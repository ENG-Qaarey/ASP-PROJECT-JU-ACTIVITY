import { Platform } from 'react-native';

// -----------------------------------------------------------------------------
// NETWORK CONFIGURATION
// -----------------------------------------------------------------------------
// For Physical Devices & Emulators:
// We use your machine's LAN IP address to ensure connectivity.
// Localhost (127.0.0.1) often fails on emulators/devices as it refers to themselves.
//
// Your Detected IP: 172.20.10.11
// -----------------------------------------------------------------------------

const LAN_IP = '172.20.10.11'; // Your computer's current IP

const DEV_HOST = Platform.select({
    // 10.0.2.2 is the magic IP for Android Emulators to reach the host machine
    android: LAN_IP,
    ios: LAN_IP,
    web: 'localhost',
    default: LAN_IP,
});

const PORT = 3001;

export const BASE_URL = `http://${DEV_HOST}:${PORT}/api`;
export const SOCKET_URL = `http://${DEV_HOST}:${PORT}`;
export const IMAGE_BASE = `http://${DEV_HOST}:${PORT}`;

export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/me',
    },
    ACTIVITIES: '/activities',
    CATEGORIES: '/categories',
};
