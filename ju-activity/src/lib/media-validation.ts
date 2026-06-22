import { MEDIA } from "@/constants/media";

export interface MediaValidationResult {
  valid: boolean;
  message?: string;
}

export const validateAudio = async (file: File): Promise<MediaValidationResult> => {
  if (!MEDIA.AUDIO.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Invalid audio format. Please use ${MEDIA.AUDIO.ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`,
    };
  }
  if (file.size > MEDIA.AUDIO.MAX_SIZE) {
    return {
      valid: false,
      message: "Audio file too large. Max size is 1GB",
    };
  }
  // Check duration (simplified for now, can enhance if needed)
  try {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    await new Promise<void>((resolve) => {
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
    });
    if (audio.duration > MEDIA.AUDIO.MAX_DURATION) {
      return {
        valid: false,
        message: `Audio too long. Max duration is ${Math.round(MEDIA.AUDIO.MAX_DURATION / 60)} minutes`,
      };
    }
  } catch {
    // If we can't get duration, proceed (but we still have size/type checks)
  }
  return { valid: true };
};

export const validateImage = async (file: File): Promise<MediaValidationResult> => {
  if (!MEDIA.IMAGE.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Invalid image format. Please use ${MEDIA.IMAGE.ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`,
    };
  }
  if (file.size > MEDIA.IMAGE.MAX_SIZE) {
    return {
      valid: false,
      message: "Image too large. Max size is 1GB",
    };
  }
  // Check dimensions
  try {
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
    });
    if (img.width < MEDIA.IMAGE.MIN_WIDTH || img.height < MEDIA.IMAGE.MIN_HEIGHT) {
      return {
        valid: false,
        message: `Image too small. Min dimensions are ${MEDIA.IMAGE.MIN_WIDTH}x${MEDIA.IMAGE.MIN_HEIGHT}`,
      };
    }
    if (img.width > MEDIA.IMAGE.MAX_WIDTH || img.height > MEDIA.IMAGE.MAX_HEIGHT) {
      return {
        valid: false,
        message: `Image too large. Max dimensions are ${MEDIA.IMAGE.MAX_WIDTH}x${MEDIA.IMAGE.MAX_HEIGHT}`,
      };
    }
  } catch {
    // If we can't get dimensions, proceed (but we still have size/type checks)
  }
  return { valid: true };
};

export const validateVideo = async (file: File): Promise<MediaValidationResult> => {
  if (!MEDIA.VIDEO.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Invalid video format. Please use ${MEDIA.VIDEO.ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`,
    };
  }
  if (file.size > MEDIA.VIDEO.MAX_SIZE) {
    return {
      valid: false,
      message: "Video too large. Max size is 1GB",
    };
  }
  // Check duration
  try {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
    });
    if (video.duration > MEDIA.VIDEO.MAX_DURATION) {
      return {
        valid: false,
        message: `Video too long. Max duration is ${Math.round(MEDIA.VIDEO.MAX_DURATION / 60)} minutes`,
      };
    }
  } catch {
    // If we can't get duration, proceed (but we still have size/type checks)
  }
  return { valid: true };
};

export const validateFile = (file: File): MediaValidationResult => {
  if (file.size > MEDIA.FILE.MAX_SIZE) {
    return {
      valid: false,
      message: "File too large. Max size is 1GB",
    };
  }
  return { valid: true };
};

export const validateMedia = async (file: File): Promise<MediaValidationResult> => {
  const isImage = MEDIA.IMAGE.ALLOWED_TYPES.includes(file.type);
  const isVideo = MEDIA.VIDEO.ALLOWED_TYPES.includes(file.type);
  const isAudio = MEDIA.AUDIO.ALLOWED_TYPES.includes(file.type);

  if (isImage) return validateImage(file);
  if (isVideo) return validateVideo(file);
  if (isAudio) return validateAudio(file);
  return validateFile(file);
};
