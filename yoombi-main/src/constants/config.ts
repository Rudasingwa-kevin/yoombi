/**
 * Yoombi — Application Configuration
 *
 * Change DEV_API_URL to your local backend server during development.
 * PROD_API_URL should point to your deployed backend (e.g., Railway, Render, Heroku).
 *
 * Switch IS_PRODUCTION to `true` when building a production release.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Environment Toggle
// ─────────────────────────────────────────────────────────────────────────────

/** Set to true when deploying a production build */
export const IS_PRODUCTION = false;

// ─────────────────────────────────────────────────────────────────────────────
// API URLs
// ─────────────────────────────────────────────────────────────────────────────

/** Your local backend during development (replace port as needed) */
const DEV_API_URL = 'http://192.168.1.67:3000/api';

/** Your production backend URL */
const PROD_API_URL = 'https://api.yoombi.rw/api';

export const API_BASE_URL = IS_PRODUCTION ? PROD_API_URL : DEV_API_URL;

// ─────────────────────────────────────────────────────────────────────────────
// API Timeouts
// ─────────────────────────────────────────────────────────────────────────────

/** Default request timeout in milliseconds */
export const API_TIMEOUT_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
// AsyncStorage Keys
// ─────────────────────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
    ACCESS_TOKEN: '@yoombi:access_token',
    REFRESH_TOKEN: '@yoombi:refresh_token',
    USER_PROFILE: '@yoombi:user_profile',
    THEME: '@yoombi:theme',
    PUSH_TOKEN: '@yoombi:push_token',
    NOTIFICATION_INBOX: '@yoombi:notification_inbox',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Feature Flags
// ─────────────────────────────────────────────────────────────────────────────

export const FEATURES = {
    /** Enable push notifications (requires backend support) */
    PUSH_NOTIFICATIONS: true,

    /** Enable loyalty points system */
    LOYALTY_POINTS: true,

    /** Enable restaurant stories feature */
    STORIES: true,

    /** Enable blog / content section */
    BLOG: true,

    /** Log all API requests to the console (disable in production) */
    LOG_API_REQUESTS: !IS_PRODUCTION,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

/** How many minutes before token expiry to trigger a refresh */
export const TOKEN_REFRESH_BUFFER_MINUTES = 5;
