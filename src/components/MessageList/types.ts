import type { Message } from '../../types/message';

export interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}
