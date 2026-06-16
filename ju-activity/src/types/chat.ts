export interface ChatMessage {
  id: string;
  activityId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  content: string;
  type: string;
  metadata?: string | null;
  createdAt: string;
  editedAt?: string | null;
  reactions?: string | null;
  parentId?: string | null;
  parent?: { id: string; content: string; senderName: string } | null;
  isDeleted?: boolean;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface ReactionEntry {
  emoji: string;
  users: string[];
}

export interface ReplyTo {
  id: string;
  content: string;
  senderName: string;
}
