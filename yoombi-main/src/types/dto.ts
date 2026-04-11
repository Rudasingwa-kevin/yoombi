/**
 * Yoombi — Data Transfer Object (DTO) Types
 *
 * These types represent the exact shape of data sent to and received from the backend API.
 * Keep them in sync with your backend's response schemas.
 * They are intentionally separate from the frontend service/mock types in `services/data.ts`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Generic API Wrappers
// ─────────────────────────────────────────────────────────────────────────────

/** Standard backend success response envelope */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/** Standard backend error response */
export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
    statusCode: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth DTOs
// ─────────────────────────────────────────────────────────────────────────────

export type UserRoleDTO = 'ADMIN' | 'OWNER' | 'USER';

/** User object returned from the backend */
export interface UserDTO {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRoleDTO;
    avatar?: string;
    isApproved: boolean;
    isEmailVerified: boolean;
    isBlocked: boolean;
    loyaltyPoints: number;
    following: string[];   // Array of restaurant IDs
    likedRestaurants: string[];
    restaurantId?: string; // Populated for OWNER role
    createdAt: string;     // ISO date string
    updatedAt: string;
}

/** POST /auth/login — Request body */
export interface LoginRequestDTO {
    email: string;
    password: string;
}

/** POST /auth/login — Response data */
export interface LoginResponseDTO {
    user: UserDTO;
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds until accessToken expires
}

/** POST /auth/register — Request body */
export interface RegisterRequestDTO {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRoleDTO;
    // New fields for OWNER registration
    restaurantName?: string;
    restaurantDescription?: string;
    restaurantCuisine?: string;
    vibe?: string;
    dressCode?: string;
    city?: string;
    area?: string;
    latitude?: number;
    longitude?: number;
    restaurantImage?: string; // Base64 or URL for the restaurant's featured image
    restaurantEmail?: string;
    restaurantPhone?: string;
}

/** POST /auth/register — Response data */
export type RegisterResponseDTO = LoginResponseDTO;

/** POST /auth/refresh — Request body */
export interface RefreshTokenRequestDTO {
    refreshToken: string;
}

/** POST /auth/refresh — Response data */
export interface RefreshTokenResponseDTO {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/** POST /auth/forgot-password — Request */
export interface ForgotPasswordRequestDTO {
    email: string;
}

/** POST /auth/reset-password — Request */
export interface ResetPasswordRequestDTO {
    email: string;
    token?: string;       // For link-based reset
    otp?: string;         // For code-based reset
    newPassword: string;
}

/** POST /auth/verify-email — Request */
export interface VerifyEmailRequestDTO {
    email: string;
    code: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Restaurant DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface LocationDTO {
    latitude: number;
    longitude: number;
}

export interface RestaurantDTO {
    id: string;
    name: string;
    description: string;
    city: string;
    area: string;
    cuisine: string;
    images: string[];
    rating: number;
    reviewCount: number;
    totalReviews?: number; // Optional until schema is fully aligned
    location: LocationDTO;
    likes: number;
    followers: number;
    vibe?: string;
    dressCode?: string;
    isMichelin: boolean;
    isApproved: boolean;
    isTrending: boolean;
    ownerId: string;
    openingHours?: Record<string, { open: string; close: string; closed: boolean }>;
    phone?: string;
    email?: string;
    website?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HomepageSectionDTO {
    id: string;
    title: string;
    subtitle?: string;
    type: 'DYNAMIC' | 'MANUAL';
    criteria?: 'TOP_RATED' | 'NEW_COMERS' | 'EXCLUSIVE';
    restaurantIds: string[];
    order: number;
    active: boolean;
    restaurants?: RestaurantDTO[];
}

export interface CreateHomepageSectionDTO {
    title: string;
    subtitle?: string;
    type?: 'DYNAMIC' | 'MANUAL';
    criteria?: 'TOP_RATED' | 'NEW_COMERS' | 'EXCLUSIVE';
    restaurantIds?: string[];
    order?: number;
    active?: boolean;
}


/** POST /restaurants — Create restaurant request */
export interface CreateRestaurantRequestDTO {
    name: string;
    description: string;
    city: string;
    area: string;
    cuisine: string;
    vibe?: string;
    dressCode?: string;
    location: LocationDTO;
    phone?: string;
    website?: string;
}

/** PATCH /restaurants/:id — Update restaurant request */
export type UpdateRestaurantRequestDTO = Partial<CreateRestaurantRequestDTO> & {
    isTrending?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Menu DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItemDTO {
    id: string;
    restaurantId: string;
    name: string;
    description: string;
    price: number | null; // in RWF (raw integer, not formatted string)
    category: string;
    image?: string;
    available: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMenuItemRequestDTO {
    name: string;
    description: string;
    price?: number | null;
    category: string;
    image?: string;
    available: boolean;
}

export type UpdateMenuItemRequestDTO = Partial<CreateMenuItemRequestDTO>;

// ─────────────────────────────────────────────────────────────────────────────
// Review DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewDTO {
    id: string;
    restaurantId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    ownerReply?: string;
    repliedAt?: string;
    isFlagged: boolean;
    flagReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateReviewRequestDTO {
    restaurantId: string;
    rating: number;
    comment: string;
}

export interface MyReviewDTO {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    restaurantName: string;
    restaurantImage: string;
    replies: number;
    ownerReply?: string;
    repliedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification DTOs
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationTypeDTO = 'BROADCAST' | 'SYSTEM' | 'FOLLOW' | 'REVIEW' | 'PROMOTION';

export interface NotificationDTO {
    id: string;
    title: string;
    message: string;      // Changed from body to match backend
    type: string;         // INFO, SUCCESS, WARNING, PROMO
    data?: Record<string, string>;
    read: boolean;        // Changed from isRead to match backend
    createdAt: string;
}

/** POST /notifications/broadcast — Admin broadcast request */
export interface BroadcastNotificationRequestDTO {
    title: string;
    body: string;
    targetRole?: UserRoleDTO; // Omit to send to all users
    data?: Record<string, string>;
}

/** POST /notifications/device-token — Register device push token */
export interface RegisterDeviceTokenRequestDTO {
    deviceToken: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Management DTOs (Admin)
// ─────────────────────────────────────────────────────────────────────────────

export interface UserAccountDTO extends UserDTO {
    joinDate: string;
    lastLoginAt?: string;
    restaurantCount: number;
    hasRestaurant?: boolean;
    restaurantName?: string;
}

export interface BlockUserRequestDTO {
    reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Support DTOs
// ─────────────────────────────────────────────────────────────────────────────

export type TicketStatusDTO = 'OPEN' | 'RESOLVED' | 'CLOSED';
export type TicketPriorityDTO = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicketDTO {
    id: string;
    userId: string;
    userName: string;
    subject: string;
    message: string;
    status: TicketStatusDTO;
    priority: TicketPriorityDTO;
    adminReply?: string;
    createdAt: string;
    updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log DTOs (Admin)
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditLogDTO {
    id: string;
    action: string;
    adminId: string;
    adminName: string;
    targetType: 'USER' | 'RESTAURANT' | 'REVIEW' | 'SYSTEM';
    targetId?: string;
    targetLabel?: string;
    detail?: string;
    createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Story DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface StoryItemDTO {
    id: string;
    imageUrl?: string; // Opt for IMAGE and VIDEO
    text?: string;     // For TEXT or captions
    type: 'image' | 'video' | 'text';
    createdAt: string;
}

export interface RestaurantStoriesDTO {
    restaurantId: string;
    restaurantName: string;
    avatar: string;
    stories: StoryItemDTO[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsDataPointDTO {
    label: string;
    value: number;
}

export interface OwnerAnalyticsDTO {
    restaurantId: string;
    totalFollowers: number;
    totalReviews: number;
    averageRating: number;
    profileViews: number;
    viewsOverTime: AnalyticsDataPointDTO[];
    reviewsOverTime: AnalyticsDataPointDTO[];
}

// ─────────────────────────────────────────────────────────────────────────────
// System Health DTOs (Admin)
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemHealthDTO {
    apiLatency: string;
    errorRate: string;
    serverStatus: string;
    memoryUsage: string;
    appVersions: { version: string; count: string; }[];
    activeUsers?: number;
    dbStatus?: 'healthy' | 'degraded' | 'down';
    storageUsed?: string;
    uptime?: string;
    lastCheckedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Article DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface ArticleDTO {
    id: string;
    title: string;
    content: string;
    category: string;
    imageUrl?: string | null;
    date: string;
    status: string;
    restaurantName: string;
    restaurantId: string;
}
