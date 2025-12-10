import { useMutation, useQueryClient } from '@tanstack/react-query';
import { streamOpenAIChatCompletion, checkAPIConnection } from '../../services/openai';
import { streamSingleModel } from '../../services/multiModel';
import type { Message } from '../../types/message';
import { messagesAtom, isConnectedAtom, hasCheckedConnectionAtom } from '../../atoms/chatAtoms';
import { aiModelsAtom, selectedModelAtom } from '../../atoms/settingsAtoms';
import { useSettings } from '../useSettings';
import { useAtom } from 'jotai';
import { useEffect } from 'react';

export const useAIChat = () => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useAtom(messagesAtom);
  const [isConnected, setIsConnected] = useAtom(isConnectedAtom);
  const [hasCheckedConnection, setHasCheckedConnection] = useAtom(hasCheckedConnectionAtom);
  const [aiModels] = useAtom(aiModelsAtom);
  const [selectedModel] = useAtom(selectedModelAtom);
  const { getAPISettings } = useSettings();
  
  // 연결 상태 확인
  useEffect(() => {
    // 이미 체크했으면 다시 체크하지 않음
    if (hasCheckedConnection) return;
    
    const checkConnection = async () => {
      try {
        // chrome.storage가 없는 경우 (개발 환경 등)
        if (!chrome?.storage?.sync) {
          setIsConnected(false);
          setHasCheckedConnection(true);
          return;
        }
        
        // 실제 API 연결 테스트
        const isConnected = await checkAPIConnection(getAPISettings());
        setIsConnected(isConnected);
        setHasCheckedConnection(true);
      } catch (error) {
        console.error('Connection check error:', error);
        setIsConnected(false);
        setHasCheckedConnection(true);
      }
    };
    
    // 약간의 지연을 두고 체크 (UI가 렌더링된 후)
    const timer = setTimeout(checkConnection, 100);
    
    return () => clearTimeout(timer);
  }, [hasCheckedConnection, setIsConnected, setHasCheckedConnection]);
  
  // storage 변경 감지 및 재연결 테스트
  useEffect(() => {
    const handleStorageChange = async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.apiSettings) {
        // API 설정이 변경되면 연결 상태를 다시 확인
        setIsConnected(null); // 확인 중 상태로 변경
        const isConnected = await checkAPIConnection(getAPISettings());
        setIsConnected(isConnected);
      }
    };
    
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, [setIsConnected]);
  
  // 주기적인 연결 상태 확인 (30초마다)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (hasCheckedConnection) {
        const isConnected = await checkAPIConnection(getAPISettings());
        setIsConnected(isConnected);
      }
    }, 30000); // 30초
    
    return () => clearInterval(interval);
  }, [hasCheckedConnection, setIsConnected]);
  
  const mutation = useMutation({
    mutationFn: (newMessages: Message[]) => {
      // 선택된 모델 가져오기
      const activeModel = aiModels.find(m => m.id === selectedModel && m.apiKey);
      
      // 선택된 모델이 없으면 기본 설정 사용
      if (!activeModel) {
        const streamingMessageId = (Date.now() + 1).toString();
        let messageAdded = false;
        
        return new Promise<void>((resolve, reject) => {
          streamOpenAIChatCompletion(
            newMessages,
            getAPISettings(),
            (chunk) => {
              if (!messageAdded) {
                setMessages(prev => [...prev, {
                  id: streamingMessageId,
                  role: 'assistant',
                  content: chunk,
                  timestamp: new Date()
                }]);
                messageAdded = true;
                setIsConnected(true);
              } else {
                setMessages(prev => prev.map(m => 
                  m.id === streamingMessageId ? { ...m, content: m.content + chunk } : m
                ));
              }
            },
            () => resolve(),
            (error) => {
              if (!messageAdded) {
                setMessages(prev => [...prev, {
                  id: streamingMessageId,
                  role: 'assistant',
                  content: `Error: ${error.message}`,
                  timestamp: new Date()
                }]);
              }
              setIsConnected(false);
              reject(error);
            }
          );
        });
      }
      
      // 단일 모델 모드
      const streamingMessageId = `${Date.now()}-${activeModel.id}`;
      let messageAdded = false;
      
      return new Promise<void>((resolve, reject) => {
        streamSingleModel(
          newMessages,
          activeModel,
          (chunk) => {
            if (!messageAdded) {
              setMessages(prev => [...prev, {
                id: streamingMessageId,
                role: 'assistant',
                content: chunk,
                timestamp: new Date()
              }]);
              messageAdded = true;
              setIsConnected(true);
            } else {
              setMessages(prev => prev.map(m => 
                m.id === streamingMessageId ? { ...m, content: m.content + chunk } : m
              ));
            }
          },
          () => resolve(),
          (error) => {
            if (!messageAdded) {
              setMessages(prev => [...prev, {
                id: streamingMessageId,
                role: 'assistant',
                content: `Error: ${error.message}`,
                timestamp: new Date()
              }]);
            }
            setIsConnected(false);
            reject(error);
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      console.error("AI Chat Error:", error);
      setIsConnected(false);
    }
  });

  const sendMessage = (input: string) => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    mutation.mutate(newMessages);
  };
  
  return {
    sendMessage,
    isLoading: mutation.isPending,
    isConnected: isConnected as boolean | null,
  };
}; 