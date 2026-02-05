import { IMAGE_BASE } from './config';

export const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');
export const DEFAULT_GROUP_AVATAR = require('@/assets/images/group-icon.png');

export const getAvatarUrl = (path?: string, isGroup = false) => {
    if (!path) return isGroup ? DEFAULT_GROUP_AVATAR : DEFAULT_AVATAR;
    if (path.startsWith('http')) return { uri: path };
    return { uri: `${IMAGE_BASE}${path.startsWith('/') ? path : `/${path}`}` };
};
