// ===== Keys used to save data in the browser's localStorage =====
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  REFRESH_TOKEN: "refreshToken",
};

// ===== Backend & API settings =====
export const API = {
  // Backend address - change this in the .env file or here
  BASE_URL: "http://localhost:5281/api",

  // SignalR hub for real-time chat and notifications
  HUB_URL: "/hubs/notifications",

  // How many items to show per page in lists
  PAGE_SIZE: 50,

  // SignalR reconnection delays (in milliseconds)
  RECONNECT_BASE_DELAY: 1000,  // start waiting 1 second
  RECONNECT_MAX_DELAY: 10000,  // max wait 10 seconds

  // How long to wait after someone stops typing (ms)
  TYPING_TIMEOUT: 2000,

  // How long to show "Copied!" message (ms)
  COPIED_TIMEOUT: 2000,

  // Messages within this time gap are grouped together (5 minutes)
  MESSAGE_GROUP_GAP: 300000,

  // How close to bottom to auto-scroll (pixels)
  SCROLL_NEAR_BOTTOM: 150,

  // Max height of message input box (pixels)
  MAX_TEXTAREA_HEIGHT: 160,

  // Audio visualiser settings
  ANALYSER_FFT_SIZE: 64,
  WAVEFORM_BARS: 40,

  // How many top activities to show on the dashboard
  TOP_ACTIVITIES_LIMIT: 10,

  // How often to check if the backend is back online (ms)
  BACKEND_POLL_INTERVAL: 3000,
};
