export interface ChatAttachmentDto {
  messageAttachmentId: string;
  messageId: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string;
  fileSize: number;
}

export interface ChatMessageDto {
  messageId: string;
  roomId: string | null;
  senderId: string;
  senderFullName: string | null;
  body: string;
  translatedBody: string | null;
  sourceLang: string | null;
  targetLang: string | null;
  translationStatus: string;
  messageType: string;
  sentAt: string;
  isRead: boolean;
  attachments: ChatAttachmentDto[];
}

export interface ChatRoomMemberDto {
  userId: string;
  fullName: string | null;
  memberRole: string;
  lastReadAt: string | null;
}

export interface ChatRoomDto {
  roomId: string;
  chatRoomType: string;
  chatRoomTitle: string;
  lastMessageAt: string | null;
  isLocked: boolean;
  members: ChatRoomMemberDto[];
}

export interface ChatMessagesPage {
  items: ChatMessageDto[];
  nextCursor: string | null;
}
