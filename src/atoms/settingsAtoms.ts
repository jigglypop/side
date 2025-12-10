import { atom } from 'jotai';

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  endpoint: string;
  apiKey: string;
  enabled: boolean;
  order: number;
}

// 설정 atom (chrome.storage.sync로만 동기화)
export const settingsAtom = atom({
  modelType: 'openai',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: ''
});

// 멀티 모델 설정 atom
export const aiModelsAtom = atom<AIModel[]>([
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    enabled: true,
    order: 0
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    enabled: false,
    order: 1
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: '',
    enabled: false,
    order: 2
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    model: 'gemini-pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    apiKey: '',
    enabled: false,
    order: 3
  }
]);

// 선택된 모델 atom (단일 선택)
export const selectedModelAtom = atom<string>('gpt-4'); 
export const toggleAtom = atom<boolean>(true);