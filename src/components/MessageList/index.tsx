import { useRef, useEffect, type FC } from 'react';
import styles from './MessageList.module.css';
import type { MessageListProps } from './types';

export const MessageList: FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
   <div className={styles.messagesContainer}>
    {messages.map(message => (
     <div
      key={message.id}
      className={`${styles.message} ${
       message.role === 'user' ? styles.userMessage : styles.assistantMessage
      }`}
     >
      <div
       className={`${styles.avatar} ${
        message.role === 'user' ? styles.userAvatar : styles.assistantAvatar
       }`}
      >
       <span>👤</span>
      </div>
      <div
       className={`${styles.messageContent} ${
        message.role === 'user' ? styles.userBubbleOuter : styles.assistantBubbleOuter
       }`}
      >
       <div
        className={`${styles.messageBubble} ${
         message.role === 'user' ? styles.userBubble : styles.assistantBubble
        }`}
       >
        <p>{message.content}</p>
       </div>
       <span
        className={`${styles.timestamp} ${message.role === 'user' ? styles.userTimestamp : ''}`}
       >
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
       </span>
      </div>
     </div>
    ))}
    {isLoading && (
     <div className={`${styles.message} ${styles.assistantMessage}`}>
      <div
       className={`${styles.avatar} ${styles.assistantAvatar}`}
      >
       <span>👤</span>
      </div>
      <div className={styles.messageContent}>
       <div className={`${styles.messageBubble} ${styles.assistantBubble} ${styles.typingBubble}`}>
        <div className={styles.typingIndicator}>
         <span></span>
         <span></span>
         <span></span>
        </div>
       </div>
      </div>
     </div>
    )}
    <div ref={messagesEndRef} />
   </div>
  )
}; 