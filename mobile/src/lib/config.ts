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

const LAN_IP = '172.20.10.11'; // Updated based on current network config

const DEV_HOST = Platform.select({
    android: LAN_IP, // Use LAN IP for all to be safe, or '10.0.2.2' if specifically emulator
    ios: LAN_IP,     // Must use LAN IP for physical device
    web: 'localhost', // Web is running on the same machine, so localhost is fine
    default: LAN_IP,
});

const PORT = 3001;

export const BASE_URL = `http://${DEV_HOST}:${PORT}/api`;
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
