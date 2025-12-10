import type { Message } from '../types/message';
import type { APISettings } from '../hooks/useSettings';

// API 설정 가져오기 (임시 함수, 추후 제거 예정)
const getAPISettings = async (): Promise<APISettings> => {
  const result = await chrome.storage.sync.get(['settings']);
  if (!result.settings || !result.settings.apiKey) {
    // 기본값 반환 (환경변수 사용)
    return {
      modelType: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
    };
  }
  return {
    modelType: result.settings.modelType || 'openai',
    endpoint: result.settings.endpoint || 'https://api.openai.com/v1/chat/completions',
    apiKey: result.settings.apiKey
  };
};

// API 연결 상태 확인 함수
export const checkAPIConnection = async (settings?: APISettings): Promise<boolean> => {
  try {
    if (!settings) {
      settings = await getAPISettings();
    }
    
    if (!settings.apiKey) {
      return false;
    }

    // 간단한 테스트 요청 (최소한의 토큰 사용)
    const response = await fetch(settings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.modelType === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-opus',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
        stream: false
      })
    });

    // 401은 인증 실패, 다른 에러는 연결은 되지만 다른 문제
    return response.ok || (response.status !== 401 && response.status !== 403);
  } catch (error) {
    // 네트워크 에러 등
    console.error('Connection check failed:', error);
    return false;
  }
};



// SSE 스트리밍 지원 함수 (추후 React Query와 함께 사용)
export const streamOpenAIChatCompletion = async (
  messages: Message[],
  settings: APISettings | undefined,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  try {
    if (!settings) {
      settings = await getAPISettings();
    }
    
    if (!settings.apiKey) {
      throw new Error('API 키가 설정되지 않았습니다.');
    }

    const formattedMessages = messages.map(({ id, timestamp, ...rest }) => rest);

    const response = await fetch(settings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.modelType === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-opus',
        messages: formattedMessages,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API 요청 실패: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('스트림을 읽을 수 없습니다.');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'));
  }
};

 