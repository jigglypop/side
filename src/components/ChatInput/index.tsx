import { type FC, useRef } from 'react';
import styles from './ChatInput.module.css';
import type { ChatInputProps } from './types';

export const ChatInput: FC<ChatInputProps> = ({ 
  value, 
  onChange, 
  onSend, 
  disabled = false,
  placeholder = "메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)",
  activeModelName,
  onSelectModel
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
   <div className={styles.inputContainer}>
    <div className={styles.inputWrapper}>
     {activeModelName && (
      <button
       type="button"
       className={styles.modelPill}
       aria-label="모델 선택"
       onClick={onSelectModel}
      >
       {activeModelName}
      </button>
     )}
     <textarea
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={(e) => {
       if (e.key === 'Enter' && !e.shiftKey) {
        const isComposing = (e.nativeEvent as unknown as { isComposing?: boolean })?.isComposing;
        if (isComposing) return;
        e.preventDefault();
        onSend();
       }
      }}
      placeholder={placeholder}
      rows={3}
      className={styles.input}
     />
     <button
      onClick={onSend}
      disabled={!value.trim() || disabled}
      className={styles.sendButton}
      aria-label="전송"
     >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
       <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
     </button>
    </div>
   </div>
  )
}; 