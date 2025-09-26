import { z } from 'zod';

const PeerStateSchema = z.object({
    userName: z.string(),
    userAvatar: z.string(),
    isInChat: z.boolean(),
    isInputMuted: z.boolean(),
    isOutputMuted: z.boolean(),
    isSharingScreen: z.boolean(),
    isSharingAudio: z.boolean(),
});

// 从 schema 推导出 TypeScript 类型
type PeerState = z.infer<typeof PeerStateSchema>;


export { PeerStateSchema, type PeerState };
