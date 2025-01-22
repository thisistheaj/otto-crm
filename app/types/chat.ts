export type SenderType = 'customer' | 'agent' | 'system';

export interface Message {
  id: string;
  room_id: string;
  content: string;
  sender_type: SenderType;
  created_at: string;
} 