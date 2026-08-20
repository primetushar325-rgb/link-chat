import { z } from 'zod';
export const registerSchema=z.object({name:z.string().min(2), email:z.string().email(), password:z.string().min(8)});
export const loginSchema=z.object({email:z.string().email(), password:z.string().min(1)});
export const googleSchema=z.object({idToken:z.string().min(10)});
export const messageSchema=z.object({text:z.string().max(5000).optional(), mediaUrl:z.string().url().optional(), public_id:z.string().optional(), thumbnailUrl:z.string().url().optional(), mediaType:z.enum(['image','video','audio']).optional(), replyToId:z.string().optional()}).refine(v=>!!v.text||!!v.mediaUrl,{message:'text or mediaUrl required'});
export const storySchema=z.object({type:z.enum(['photo','video','text']), mediaUrl:z.string().url().optional(), public_id:z.string().optional(), thumbnailUrl:z.string().url().optional(), text:z.string().max(500).optional()});
export const badgeSchema=z.object({imageUrl:z.string().url(), linkUrl:z.string().url(), enabled:z.boolean()});
