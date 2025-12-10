import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { settingsAtom } from '../../atoms/chatAtoms';
import { toggleAtom } from '../../atoms/settingsAtoms';

export interface APISettings {
  modelType: 'openai' | 'claude' | 'custom';
  endpoint: string;
  apiKey: string;
}

export interface AppSettings {
  modelType: 'openai' | 'claude' | 'custom';
  endpoint: string;
  apiKey: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [toggle, setToggle] = useAtom(toggleAtom)

  const toggleSetting = () => {
    setToggle(!toggle)
  }

  // Chrome Storage에서 설정 로드
  const loadSettings = useCallback(async () => {
    try {
      // chrome.storage가 없는 경우 (개발 환경 등)
      if (!chrome?.storage?.sync) {
        console.warn('Chrome storage not available, using default settings');
        return;
      }
      
      const result = await chrome.storage.sync.get(['settings']);
      if (result.settings) {
        setSettings(result.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [setSettings]);

  // Chrome Storage에 설정 저장
  const saveSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      // chrome.storage가 없는 경우 (개발 환경 등)
      if (!chrome?.storage?.sync) {
        console.warn('Chrome storage not available, settings saved only in memory');
        return;
      }
      await chrome.storage.sync.set({ settings: updatedSettings });
      // background script로 설정 변경 알림
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ 
          type: 'SETTINGS_UPDATED', 
          settings: updatedSettings 
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings, setSettings]);

  // API 설정만 반환 (OpenAI 서비스용)
  const getAPISettings = useCallback((): APISettings => {
    if (!settings.apiKey) {
      // 기본값 반환 (환경변수 사용)
      return {
        modelType: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
      };
    }
    return {
       modelType: settings.modelType as 'openai' | 'claude' | 'custom',
       endpoint: settings.endpoint,
       apiKey: settings.apiKey
     };
  }, [settings]);

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Storage 변경 감지
  useEffect(() => {
    if (!chrome?.storage?.onChanged) {
      return;
    }
    
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.settings && changes.settings.newValue) {
        setSettings(changes.settings.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [setSettings]);

  // Background script 메시지 감지
  useEffect(() => {
    if (!chrome?.runtime?.onMessage) {
      return;
    }
    const messageListener = (message: any) => {
      if (message.type === 'SETTINGS_UPDATED' && message.settings) {
        setSettings(message.settings);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, [setSettings]);

  return {
    settings,
    saveSettings,
    getAPISettings,
    loadSettings,
    toggleSetting,
    isSetting: toggle
  };
}; 