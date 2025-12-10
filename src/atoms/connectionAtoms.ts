import { atom } from 'jotai';

// 연결 상태 atom - null은 체크 중
export const isConnectedAtom = atom<boolean | null>(null);

// 연결 체크 완료 여부
export const hasCheckedConnectionAtom = atom<boolean>(false); 