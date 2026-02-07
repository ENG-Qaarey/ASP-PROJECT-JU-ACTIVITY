import { BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ---------------- Types ---------------- */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    isPublic?: boolean; // If true, Authorization header is skipped
}

/* ---------------- Client ---------------- */
export const client = {
    async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {}, isPublic = false } = options;

        const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

        const isFormData = body instanceof FormData;

        const finalHeaders: Record<string, string> = {
            'Accept': 'application/json',
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...headers,
        };

        if (!isPublic) {
            const token = await AsyncStorage.getItem('user_token');
            if (token) {
                finalHeaders['Authorization'] = `Bearer ${token}`;
            }
        }

        try {
            const response = await fetch(url, {
                method,
                headers: finalHeaders,
                body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
            });

            const responseBody = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = responseBody.message || responseBody.error || 'Something went wrong';
                throw new Error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
            }

            return responseBody as T;
        } catch (error: any) {
            // Skip console.log for specific scenarios:
            // 1. 404s on DELETE (often handled naturally)
            // 2. "User not found" on profile fetch (happens after DB resets/session expiry)
            const msg = error.message?.toLowerCase() || '';
            const isExpected404 = method === 'DELETE' && (msg.includes('not found') || error.status === 404);
            const isProfileFetch = endpoint.includes('/users/me');
            const isMissingUser = msg.includes('user not found') || msg.includes('unauthorized');

            if (!isExpected404 && !(isProfileFetch && isMissingUser)) {
                // Log to terminal only, avoid triggering RedBox on mobile screen
                console.log(`❌ API Request Failed: ${method} ${url}`, error.message || error);
            }
            throw error;
        }
    },

    /* ---------------- Helpers ---------------- */
    get<T = any>(endpoint: string, isPublic = false) {
        return this.request<T>(endpoint, { method: 'GET', isPublic });
    },

    post<T = any>(endpoint: string, body: any, isPublic = false) {
        return this.request<T>(endpoint, { method: 'POST', body, isPublic });
    },

    put<T = any>(endpoint: string, body: any) {
        return this.request<T>(endpoint, { method: 'PUT', body });
    },

    patch<T = any>(endpoint: string, body: any) {
        return this.request<T>(endpoint, { method: 'PATCH', body });
    },

    delete<T = any>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'DELETE' });
    },
};
