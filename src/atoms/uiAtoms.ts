import { atom } from 'jotai';

// localStorage에서 저장된 위치 가져오기
const getSavedPosition = () => {
  try {
    const saved = localStorage.getItem('nabla-chat-position');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        x: Math.max(0, Math.min(window.innerWidth - 400, parsed.x || 20)),
        y: Math.max(0, Math.min(window.innerHeight - 600, parsed.y || 20))
      };
    }
  } catch (error) {
    // Failed to load saved position
  }
  return { 
    x: typeof window !== 'undefined' ? Math.max(0, window.innerWidth - 420) : 20, 
    y: 20 
  };
};

// localStorage에서 저장된 크기 가져오기
const getSavedSize = () => {
  try {
    const saved = localStorage.getItem('nabla-chat-size');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        width: Math.max(320, Math.min(window.innerWidth - 40, parsed.width || 400)),
        height: Math.max(400, Math.min(window.innerHeight - 40, parsed.height || 600))
      };
    }
  } catch (error) {
    // Failed to load saved size
  }
  return { width: 400, height: 600 };
};

// UI 상태 관련 atoms
export const isMinimizedAtom = atom<boolean>(false);
export const chatPositionAtom = atom(getSavedPosition());
export const chatSizeAtom = atom(getSavedSize());
export const chatOpenAtom = atom<boolean>(false); 