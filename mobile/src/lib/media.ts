import { IMAGE_BASE } from './config';

export const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');

export const getAvatarUrl = (path?: string) => {
    if (!path) return DEFAULT_AVATAR;
    if (path.startsWith('http')) return { uri: path };
    return { uri: `${IMAGE_BASE}${path.startsWith('/') ? path : `/${path}`}` };
};
