// 기존 호환성을 위한 re-export
// 새로운 구조에서는 src/atoms/index.ts를 사용하는 것을 권장

export { 
  messagesAtom, 
  inputAtom 
} from './messageAtoms';

export { 
  isMinimizedAtom, 
  chatPositionAtom, 
  chatSizeAtom, 
  chatOpenAtom 
} from './uiAtoms';

export { settingsAtom } from './settingsAtoms';

export { 
  isConnectedAtom, 
  hasCheckedConnectionAtom 
} from './connectionAtoms'; 