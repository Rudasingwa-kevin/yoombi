/**
 * Yoombi — Base API Client
 *
 * A fetch-based HTTP client with:
 *  - Automatic Authorization header injection
 *  - JWT access-token refresh on 401 (queue-based to avoid race conditions)
 *  - Structured error handling
 *  - Optional request logging (controlled by FEATURES.LOG_API_REQUESTS)
 *
 * Usage:
 *   import api from '../services/api';
 *   const { data } = await api.get<UserDTO>('/me');
 *   const { data } = await api.post<LoginResponseDTO>('/auth/login', { email, password });
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT_MS, FEATURES, STORAGE_KEYS } from '../constants/config';
import type {
    ApiResponse,
    ApiErrorResponse,
    PaginatedResponse,
    RefreshTokenResponseDTO,
} from '../types/dto';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

type RequestOptions = {
    /** Do not inject Authorization header (e.g. login, register) */
    skipAuth?: boolean;
    /** Extra headers to merge in */
    headers?: Record<string, string>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Token Refresh Queue
// Prevents multiple simultaneous refresh calls when several requests 401 at once.
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(newToken: string) => void> = [];

async function processRefreshQueue(newToken: string) {
    refreshQueue.forEach(cb => cb(newToken));
    refreshQueue = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Storage Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const TokenStorage = {
    async getAccessToken(): Promise<string | null> {
        return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    },
    async getRefreshToken(): Promise<string | null> {
        return AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    },
    async setTokens(accessToken: string, refreshToken: string): Promise<void> {
        await AsyncStorage.multiSet([
            [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
            [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        ]);
    },
    async clearTokens(): Promise<void> {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.ACCESS_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_PROFILE,
        ]);
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Core Request Function
// ─────────────────────────────────────────────────────────────────────────────

async function request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
    };

    if (!options.skipAuth) {
        const token = await TokenStorage.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    if (FEATURES.LOG_API_REQUESTS) {
        console.log(`[API] ${method} ${url}`, body ?? '');
    }

    // AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    let response: Response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new ApiError(408, 'Request timed out. Please check your connection.');
        }
        throw new ApiError(0, 'Network error. Please check your internet connection.');
    }

    clearTimeout(timeoutId);

    // ── 401: Try to refresh the token once ──────────────────────────────────
    if (response.status === 401 && !options.skipAuth) {
        if (isRefreshing) {
            // Wait for the ongoing refresh to finish
            return new Promise<T>((resolve, reject) => {
                refreshQueue.push(async (newToken: string) => {
                    headers['Authorization'] = `Bearer ${newToken}`;
                    try {
                        const retryResponse = await fetch(url, {
                            method,
                            headers,
                            body: body !== undefined ? JSON.stringify(body) : undefined,
                        });
                        const retryData = await retryResponse.json();
                        resolve(retryData.data ?? retryData);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }

        isRefreshing = true;
        const refreshToken = await TokenStorage.getRefreshToken();

        if (!refreshToken) {
            isRefreshing = false;
            await TokenStorage.clearTokens();
            throw new ApiError(401, 'Session expired. Please log in again.');
        }

        try {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!refreshResponse.ok) {
                throw new ApiError(401, 'Session expired. Please log in again.');
            }

            const refreshData: ApiResponse<RefreshTokenResponseDTO> = await refreshResponse.json();
            const { accessToken, refreshToken: newRefreshToken } = refreshData.data;

            await TokenStorage.setTokens(accessToken, newRefreshToken);
            await processRefreshQueue(accessToken);
            isRefreshing = false;

            // Retry the original request with the new token
            headers['Authorization'] = `Bearer ${accessToken}`;
            const retryController = new AbortController();
            const retryTimeout = setTimeout(() => retryController.abort(), API_TIMEOUT_MS);
            const retryResponse = await fetch(url, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: retryController.signal,
            });
            clearTimeout(retryTimeout);
            response = retryResponse;

        } catch (refreshError) {
            isRefreshing = false;
            refreshQueue = [];
            await TokenStorage.clearTokens();
            throw new ApiError(401, 'Session expired. Please log in again.');
        }
    }

    // ── Parse Response ────────────────────────────────────────────────────────
    let json: any;
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        json = await response.json();
    } else {
        // Non-JSON (e.g. 204 No Content)
        if (response.ok) return undefined as T;
        throw new ApiError(response.status, response.statusText || 'Unknown error');
    }

    if (FEATURES.LOG_API_REQUESTS) {
        console.log(`[API] ${response.status} ${url}`, json);
    }

    if (!response.ok) {
        const errBody = json as ApiErrorResponse;
        throw new ApiError(
            response.status,
            errBody.message ?? `Server error (${response.status})`,
            errBody.errors
        );
    }

    // Unwrap { success, data } envelope if present, but preserve if it's a paginated response (has meta)
    if ('data' in json && 'success' in json && !('meta' in json)) {
        return json.data as T;
    }

    return json as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported API Methods
// ─────────────────────────────────────────────────────────────────────────────

const api = {
    get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return request<T>('GET', endpoint, undefined, options);
    },

    post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return request<T>('POST', endpoint, body, options);
    },

    put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return request<T>('PUT', endpoint, body, options);
    },

    patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return request<T>('PATCH', endpoint, body, options);
    },

    delete<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return request<T>('DELETE', endpoint, body, options);
    },
};

export const uploadImage = async (uri: string): Promise<string> => {
    const accessToken = await TokenStorage.getAccessToken();
    const formData = new FormData();
    
    // React Native FormData format
    const filename = uri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', {
        uri,
        name: filename,
        type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            // Do NOT set Content-Type; fetch automatically adds it with the boundary
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to upload image to server');
    }

    const json = await response.json();
    return json.data.url; // Returns the secure Cloudinary URI string
};

export default api;

// ─────────────────────────────────────────────────────────────────────────────
// Domain-Specific Service Modules
// Import and use these in your contexts/screens instead of calling api directly.
// ─────────────────────────────────────────────────────────────────────────────

import type {
    LoginRequestDTO,
    LoginResponseDTO,
    RegisterRequestDTO,
    RegisterResponseDTO,
    ForgotPasswordRequestDTO,
    ResetPasswordRequestDTO,
    UserDTO,
    RestaurantDTO,
    UpdateRestaurantRequestDTO,
    MenuItemDTO,
    CreateMenuItemRequestDTO,
    UpdateMenuItemRequestDTO,
    CreateReviewRequestDTO,
    ReviewDTO,
    MyReviewDTO,
    RegisterDeviceTokenRequestDTO,
    NotificationDTO,
    BroadcastNotificationRequestDTO,
    UserAccountDTO,
    SupportTicketDTO,
    AuditLogDTO,
    SystemHealthDTO,
    OwnerAnalyticsDTO,
    RestaurantStoriesDTO,
    StoryItemDTO,
    PaginatedResponse as PaginatedResponseType,
    ArticleDTO,
    HomepageSectionDTO,
    CreateHomepageSectionDTO,
} from '../types/dto';

// ── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
    login(data: LoginRequestDTO) {
        return api.post<LoginResponseDTO>('/auth/login', data, { skipAuth: true });
    },
    register(data: RegisterRequestDTO) {
        return api.post<RegisterResponseDTO>('/auth/register', data, { skipAuth: true });
    },
    refreshToken(refreshToken: string) {
        return api.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
            '/auth/refresh',
            { refreshToken },
            { skipAuth: true }
        );
    },
    forgotPassword(data: ForgotPasswordRequestDTO) {
        return api.post<void>('/auth/forgot-password', data, { skipAuth: true });
    },
    resetPassword(data: ResetPasswordRequestDTO) {
        return api.post<void>('/auth/reset-password', data, { skipAuth: true });
    },
    verifyEmail(email: string, code: string) {
        return api.post<void>('/auth/verify-email', { email, code }, { skipAuth: true });
    },
    getMe() {
        return api.get<UserDTO>('/auth/me');
    },
    getFavorites() {
        return api.get<RestaurantDTO[]>('/auth/me/favorites');
    },
    getMyReviews() {
        return api.get<MyReviewDTO[]>('/auth/me/reviews');
    },
    sendVerifyCode(email: string) {
        return api.post<void>('/auth/send-verify-code', { email }, { skipAuth: true });
    },
    logout(refreshToken: string) {
        return api.post<void>('/auth/logout', { refreshToken });
    },
};

// ── Restaurant Service ───────────────────────────────────────────────────────

export const restaurantService = {
    getAll(params?: { 
        city?: string; 
        cuisine?: string; 
        search?: string; 
        vibe?: string; 
        dressCode?: string; 
        isMichelin?: boolean;
        page?: number; 
        limit?: number 
    }) {
        const cleanParams = Object.fromEntries(
            Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null)
        );
        const query = new URLSearchParams(cleanParams as any).toString();
        return api.get<RestaurantDTO[]>(`/restaurants${query ? `?${query}` : ''}`);
    },
    getById(id: string) {
        return api.get<RestaurantDTO>(`/restaurants/${id}`);
    },
    getOwnerRestaurant() {
        return api.get<RestaurantDTO>('/restaurants/mine');
    },
    update(id: string, data: UpdateRestaurantRequestDTO) {
        return api.patch<RestaurantDTO>(`/restaurants/${id}`, data);
    },
    async uploadImage(id: string, imageUri: string) {
        // 1. Upload to Cloudinary via our generic upload endpoint
        const uploadedUrl = await uploadImage(imageUri);
        
        // 2. Add to restaurant gallery
        return api.post<{ imageUrl: string }>(`/restaurants/${id}/images`, { imageUrl: uploadedUrl });
    },
    follow(id: string) {
        return api.post<void>(`/restaurants/${id}/follow`);
    },
    unfollow(id: string) {
        return api.delete<void>(`/restaurants/${id}/follow`);
    },
    like(id: string) {
        return api.post<void>(`/restaurants/${id}/like`);
    },
    unlike(id: string) {
        return api.delete<void>(`/restaurants/${id}/like`);
    },
    approve(id: string) {
        return api.patch<RestaurantDTO>(`/admin/restaurants/${id}/approve`);
    },
    reject(id: string, reason?: string) {
        return api.patch<void>(`/admin/restaurants/${id}/reject`, { reason });
    },
    getFollowers(id: string) {
        return api.get<any[]>(`/restaurants/${id}/followers`);
    },
    deleteImage(id: string, imageUrl: string) {
        return api.delete<void>(`/restaurants/${id}/images`, { imageUrl });
    },
    getFollowed() {
        return api.get<RestaurantDTO[]>('/auth/me/following');
    },
};

// ── Menu Service ─────────────────────────────────────────────────────────────

export const menuService = {
    getItems(restaurantId: string) {
        return api.get<MenuItemDTO[]>(`/restaurants/${restaurantId}/menu`);
    },
    addItem(restaurantId: string, data: CreateMenuItemRequestDTO) {
        return api.post<MenuItemDTO>(`/restaurants/${restaurantId}/menu`, data);
    },
    updateItem(restaurantId: string, itemId: string, data: UpdateMenuItemRequestDTO) {
        return api.patch<MenuItemDTO>(`/restaurants/${restaurantId}/menu/${itemId}`, data);
    },
    deleteItem(restaurantId: string, itemId: string) {
        return api.delete<void>(`/restaurants/${restaurantId}/menu/${itemId}`);
    },
};

// ── Review Service ───────────────────────────────────────────────────────────

export const reviewService = {
    getForRestaurant(restaurantId: string, page = 1) {
        return api.get<PaginatedResponseType<ReviewDTO>>(`/restaurants/${restaurantId}/reviews?page=${page}`);
    },
    create(data: CreateReviewRequestDTO) {
        return api.post<ReviewDTO>('/reviews', data);
    },
    flag(reviewId: string, reason: string) {
        return api.post<void>(`/reviews/${reviewId}/flag`, { reason });
    },
    async deleteReview(id: string): Promise<void> {
        await api.delete(`/admin/reviews/${id}`);
    },
    approveFlag(reviewId: string) {
        return api.delete<void>(`/admin/reviews/${reviewId}`);
    },
    dismissFlag(reviewId: string) {
        return api.patch<void>(`/admin/reviews/${reviewId}/dismiss`);
    },
    reply(reviewId: string, reply: string) {
        return api.patch<ReviewDTO>(`/reviews/${reviewId}/reply`, { reply });
    },
};

// ── Notification Service ─────────────────────────────────────────────────────

export const notificationService = {
    registerDeviceToken(data: RegisterDeviceTokenRequestDTO) {
        return api.post<void>('/notifications/device-token', data);
    },
    getInbox() {
        return api.get<NotificationDTO[]>('/notifications');
    },
    markAsRead(notificationId: string) {
        return api.patch<void>(`/notifications/${notificationId}/read`);
    },
    markAllAsRead() {
        return api.patch<void>('/notifications/read-all');
    },
    broadcast(data: BroadcastNotificationRequestDTO) {
        return api.post<void>('/admin/notifications/broadcast', data);
    },
};

// ── User Management Service (Admin) ──────────────────────────────────────────

export const userService = {
    getAll(page = 1, limit = 20) {
        return api.get<PaginatedResponseType<UserAccountDTO>>(`/admin/users?page=${page}&limit=${limit}`);
    },
    block(userId: string, reason?: string) {
        return api.patch<void>(`/admin/users/${userId}/block`, { reason });
    },
    unblock(userId: string) {
        return api.patch<void>(`/admin/users/${userId}/unblock`);
    },
    updateProfile(data: Partial<Pick<UserDTO, 'name' | 'phone' | 'avatar'>>) {
        return api.patch<UserDTO>('/auth/me', data);
    },
    changePassword(currentPassword: string, newPassword: string) {
        return api.post<void>('/auth/me/change-password', { currentPassword, newPassword });
    },
    deleteAccount(password: string) {
        return api.delete<void>('/auth/me', { password });
    },
};

// ── Support Service ──────────────────────────────────────────────────────────

export const supportService = {
    getTickets(page = 1) {
        return api.get<PaginatedResponseType<SupportTicketDTO>>(`/admin/support?page=${page}`);
    },
    updateTicketStatus(ticketId: string, status: SupportTicketDTO['status'], reply?: string) {
        return api.patch<SupportTicketDTO>(`/admin/support/${ticketId}`, { status, adminReply: reply });
    },
    createTicket(subject: string, message: string) {
        return api.post<SupportTicketDTO>('/support', { subject, message });
    },
};

// ── Audit Log Service ─────────────────────────────────────────────────────────

export const auditService = {
    getLogs(page = 1) {
        return api.get<PaginatedResponseType<AuditLogDTO>>(`/admin/audit-logs?page=${page}`);
    },
};

// ── System Health Service ─────────────────────────────────────────────────────

export const systemService = {
    getHealth() {
        return api.get<SystemHealthDTO>('/admin/system/health');
    },
    getHealthDetailed: () => {
        return api.get<SystemHealthDTO>('/admin/health-detailed');
    },
    setMaintenanceMode(enabled: boolean) {
        return api.patch<void>('/admin/system/maintenance', { enabled });
    },
};

// ── Analytics Service ─────────────────────────────────────────────────────────

export const analyticsService = {
    getOwnerAnalytics() {
        return api.get<OwnerAnalyticsDTO>('/analytics/me');
    },
    getAdminOverview: () => {
        return api.get<any>('/admin/analytics-detailed');
    },
    getAdminStats() {
        return api.get<{
            totalUsers: number;
            approvedPartners: number;
            pendingPartners: number;
            openTickets: number;
            activities: Array<{ id: string; user: string; action: string; time: string }>;
        }>('/admin/stats');
    }
};
 
export const adminService = {
    deleteRestaurant(id: string) {
        return api.delete<void>(`/admin/restaurants/${id}`);
    }
};

// ── Stories Service ───────────────────────────────────────────────────────────

export const storyService = {
    getAllStories() {
        return api.get<RestaurantStoriesDTO[]>('/stories');
    },
    addStoryItem(restaurantId: string, item: { type: 'image' | 'video' | 'text', url?: string, text?: string, duration?: number }) {
        return api.post<StoryItemDTO>(`/stories/${restaurantId}`, item);
    },
    deleteStoryItem(restaurantId: string, itemId: string) {
        return api.delete<void>(`/stories/${restaurantId}/items/${itemId}`);
    }
};

// ── Loyalty Service ──────────────────────────────────────────────────────────

export const loyaltyService = {
    checkIn(restaurantId: string) {
        return api.post<{ totalPoints: number }>('/loyalty/check-in', { restaurantId });
    },
};

export const articleService = {
    getAll: () => api.get<ArticleDTO[]>('/articles'),
    getById: (id: string) => api.get<ArticleDTO>(`/articles/${id}`),
    create: (data: Partial<ArticleDTO>) => api.post<ArticleDTO>('/articles', data),
    update: (id: string, data: Partial<ArticleDTO>) => api.patch<ArticleDTO>(`/articles/${id}`, data),
    delete: (id: string) => api.delete<void>(`/articles/${id}`),
};

export const cmsService = {
    /** Public: Get active sections with resolved restaurants */
    getActiveSections() {
        return api.get<HomepageSectionDTO[]>('/cms');
    },
    /** Admin: Get all sections */
    getAdminSections() {
        return api.get<HomepageSectionDTO[]>('/cms/admin');
    },
    createSection(data: CreateHomepageSectionDTO) {
        return api.post<HomepageSectionDTO>('/cms', data);
    },
    updateSection(id: string, data: Partial<CreateHomepageSectionDTO>) {
        return api.patch<HomepageSectionDTO>(/cms/ + id, data);
    },
    deleteSection(id: string) {
        return api.delete(/cms/ + id);
    },
};
