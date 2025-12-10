import { type FC } from 'react';
import styles from './ChatHeader.module.css';
import type { ChatHeaderProps } from './types';
import { useSettings } from '../../hooks/useSettings';

export const ChatHeader: FC<ChatHeaderProps> = ({
  isConnected,
  onCloseClick,
  activeModelName
}) => {
  const { isSetting, toggleSetting } = useSettings()
  return (
   <div className={styles.header}>
    <div className={styles.headerInfo}>
     <div className={styles.logoWrapper}>
      <svg width="36" height="36" viewBox="0 0 128 128" fill="currentColor" className={styles.logo}>
       <rect width="128" height="128" fill="url(#nabla-gradient)" rx="24" />
       <defs>
        <linearGradient id="nabla-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stopColor="#12c2e9" />
         <stop offset="50%" stopColor="#c471ed" />
         <stop offset="100%" stopColor="#f64f59" />
        </linearGradient>
       </defs>
       <text
        x="64"
        y="80"
        textAnchor="middle"
        fill="white"
        fontSize="60"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
       >
        ∇
       </text>
      </svg>
     </div>
     <div>
      <p className={styles.title}>∇·Chat {activeModelName ? `· ${activeModelName}` : ''}</p>
      <span className={`${styles.status} ${isConnected === false ? styles.disconnected : ''}`}>
       <span
        className={`${styles.statusDot} ${
         isConnected === null
          ? styles.checking
          : isConnected
          ? styles.connected
          : styles.disconnected
        }`}
       ></span>
       {isConnected === null ? '연결 확인 중...' : isConnected ? '연결됨' : '연결 안됨'}
      </span>
     </div>
    </div>
    <div className={styles.headerActions}>
     <button
      onClick={toggleSetting}
      className={styles.actionButton}
      aria-label="설정"
     >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
       <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
     </button>
     <button
      onClick={onCloseClick}
      className={styles.actionButton}
      aria-label="닫기"
     >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
       <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg>
     </button>
    </div>
   </div>
  )
}; 

export default ChatHeader; 