export type User = { id: string; email: string; name: string; avatarUrl?: string; role: 'user'|'admin'; status: 'active'|'suspended'|'banned'; createdAt: string; }
export type Conversation = { id: string; isGroup: boolean; name?: string; avatarUrl?: string; participantIds: string[]; createdAt: string; lastMessageAt?: string; }
export type Message = { id: string; conversationId: string; senderId: string; text?: string; mediaUrl?: string; public_id?: string; thumbnailUrl?: string; resourceType?: string; mediaType?: 'image'|'video'|'audio'; replyToId?: string; editedAt?: string; deletedAt?: string; createdAt: string; reactions: Reaction[]; seenBy: string[]; deliveredTo: string[]; }
export type Reaction = { emoji: string; userId: string; createdAt: string; }
export type Story = { id: string; userId: string; type: 'photo'|'video'|'text'; mediaUrl?: string; public_id?: string; thumbnailUrl?: string; text?: string; createdAt: string; expiresAt: string; views: { userId: string; viewedAt: string }[]; }
export type AppBadge = { imageUrl: string; linkUrl: string; enabled: boolean; updatedAt: string; updatedBy?: string; }
export type ApiEnvelope<T> = { success: boolean; data?: T; error?: { code: string; message: string; details?: any }; meta?: { page?: number; limit?: number; total?: number; cursor?: string } };
export type CloudinaryAsset = { secure_url: string; public_id: string; thumbnailUrl: string; resource_type: string; bytes?: number; format?: string; }
