export const MEDIA = {
  AUDIO: {
    MAX_DURATION: 300, // 5 minutes in seconds
    MAX_SIZE: 1024 * 1024 * 1024, // 1GB
    ALLOWED_TYPES: ["audio/webm", "audio/mp3", "audio/wav", "audio/ogg"],
  },
  IMAGE: {
    MAX_SIZE: 1024 * 1024 * 1024, // 1GB
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    MIN_WIDTH: 100,
    MIN_HEIGHT: 100,
    MAX_WIDTH: 8192,
    MAX_HEIGHT: 8192,
  },
  VIDEO: {
    MAX_DURATION: 300, // 5 minutes
    MAX_SIZE: 1024 * 1024 * 1024, // 1GB
    ALLOWED_TYPES: ["video/mp4", "video/webm", "video/quicktime"],
  },
  FILE: {
    MAX_SIZE: 1024 * 1024 * 1024, // 1GB
  },
} as const;
