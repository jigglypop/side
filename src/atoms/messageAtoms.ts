import { atom } from 'jotai';
import type { Message } from '../types/message';

// 메시지 목록 atom
export const messagesAtom = atom<Message[]>([
  {
    id: '1',
    role: 'assistant',
    content: '안녕하세요! ∇·Chat AI 어시스턴트입니다. 무엇을 도와드릴까요?',
    timestamp: new Date(),
  },
]);

// 입력 텍스트 atom
export const inputAtom = atom<string>(''); 