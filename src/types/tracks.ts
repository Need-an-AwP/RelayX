export const TrackID = {
    MICROPHONE_AUDIO: 0,
    CPA_AUDIO: 1,
    SCREEN_SHARE_VIDEO: 2
} as const;

export type TrackIDType = typeof TrackID[keyof typeof TrackID];
