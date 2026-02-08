import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { client } from './api';

// LAZY LOAD EXPO-NOTIFICATIONS TO PREVENT CRASH IN EXPO GO (SDK 53+)
let Notifications: any = null;
const getNotifications = () => {
    if (!Notifications) {
        // Only load the library if it's safe (iOS or not Expo Go)
        // or just load it and let the internal checks handle it, 
        // but the side effects happen at import.
        Notifications = require('expo-notifications');
    }
    return Notifications;
};

// Guarded setNotificationHandler
if (Platform.OS !== 'android' || Constants.executionEnvironment !== 'storeClient') {
    try {
        const N = getNotifications();
        N.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    } catch (e) {
        console.warn('Notification handler setup failed:', e.message);
    }
}

export const NotificationService = {
    async registerForPushNotificationsAsync(): Promise<string | undefined> {
        // Defensive check for Expo Go on Android
        if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
            console.warn('⚠️ Push notifications (remote) are disabled in Expo Go (SDK 53+). Please use a Development Build.');
            return undefined;
        }

        const N = getNotifications();
        let token;

        if (Platform.OS === 'android') {
            await N.setNotificationChannelAsync('default', {
                name: 'default',
                importance: N.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await N.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await N.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.warn('Failed to get notifications permission');
                return;
            }

            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;

            if (!projectId) {
                console.warn('⚠️ Push notifications skipped: No "projectId" in app config.');
                return undefined;
            }

            try {
                token = (await N.getExpoPushTokenAsync({ projectId })).data;
                console.log('✅ Push Token:', token);
            } catch (error: any) {
                console.error('❌ Failed to get push token:', error?.message ?? error);
            }
        } else {
            console.warn('Must use physical device for Push Notifications');
        }

        return token;
    },

    async syncPushTokenWithBackend() {
        try {
            const token = await this.registerForPushNotificationsAsync();
            if (token) {
                await client.post('/notifications/push-token', { token });
                console.log('✅ Push token synced with backend');
            }
        } catch (error) {
            console.error('❌ Failed to sync push token:', error);
        }
    },

    // Listeners wrapped to prevent crashes
    addNotificationReceivedListener(callback: (notification: any) => void) {
        if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') return { remove: () => { } };
        try {
            return getNotifications().addNotificationReceivedListener(callback);
        } catch (e) {
            return { remove: () => { } };
        }
    },

    addNotificationResponseReceivedListener(callback: (response: any) => void) {
        if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') return { remove: () => { } };
        try {
            return getNotifications().addNotificationResponseReceivedListener(callback);
        } catch (e) {
            return { remove: () => { } };
        }
    }
};
