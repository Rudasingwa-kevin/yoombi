import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    ReactNode,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, userService, TokenStorage, ApiError, uploadImage } from '../services/api';
import { STORAGE_KEYS } from '../constants/config';
import type { UserDTO } from '../types/dto';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'OWNER' | 'USER' | 'GUEST';

/**
 * The in-app User object (a trimmed view of UserDTO for contexts/screens).
 * Mapped from UserDTO on login / session restore.
 */
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    avatar?: string;
    isApproved: boolean;
    restaurantId?: string; // Only for OWNER role
}

type SignInCallbackFn = (user: AuthUser) => Promise<void> | void;
type SignOutCallbackFn = () => Promise<void> | void;

interface AuthContextType {
    user: AuthUser | null;
    role: UserRole;
    isLoading: boolean;
    isSessionLoading: boolean; // true while restoring session on app launch
    isAdmin: boolean;
    /** Login with email + password (real API) */
    signIn: (email: string, password: string) => Promise<void>;
    /** Register a new account */
    signUpWithEmail: (
        name: string,
        email: string,
        password: string,
        phone?: string,
        role?: UserRole,
        restaurantName?: string,
        restaurantDescription?: string,
        restaurantCuisine?: string,
        vibe?: string,
        dressCode?: string,
        city?: string,
        area?: string,
        latitude?: number,
        longitude?: number,
        restaurantImage?: string,
        restaurantEmail?: string,
        restaurantPhone?: string
    ) => Promise<void>;
    /** Sign out and clear all stored tokens */
    signOut: () => Promise<void>;
    /** Request a password reset OTP to be sent via email */
    requestPasswordReset: (email: string) => Promise<void>;
    /** Complete the password reset using the OTP */
    resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
    /**
     * Update the user's profile information.
     */
    updateProfile: (data: Partial<Pick<AuthUser, 'name' | 'avatar' | 'phone'>>) => Promise<void>;
    /**
     * Register a callback that fires after every successful sign-in.
     * Use this in other contexts (e.g. NotificationContext, RestaurantContext)
     * to react to login without circular context dependencies.
     */
    onSignIn: (cb: SignInCallbackFn) => () => void;
    /**
     * Register a callback that fires after sign-out.
     */
    onSignOut: (cb: SignOutCallbackFn) => () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function dtoToAuthUser(dto: UserDTO): AuthUser {
    return {
        id: dto.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role as UserRole,
        avatar: dto.avatar,
        isApproved: dto.isApproved,
        restaurantId: dto.restaurantId,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionLoading, setIsSessionLoading] = useState(true);

    // Callback registries — avoid circular context deps
    const signInCallbacks = useRef<SignInCallbackFn[]>([]);
    const signOutCallbacks = useRef<SignOutCallbackFn[]>([]);

    const role: UserRole = user?.role ?? 'GUEST';
    const isAdmin = role === 'ADMIN';

    // ── Restore Session on App Launch ──────────────────────────────────────
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const [storedUser, accessToken] = await AsyncStorage.multiGet([
                    STORAGE_KEYS.USER_PROFILE,
                    STORAGE_KEYS.ACCESS_TOKEN,
                ]);

                const userJson = storedUser[1];
                const token = accessToken[1];

                if (userJson && token) {
                    const parsed: AuthUser = JSON.parse(userJson);
                    setUser(parsed);

                    // Re-validate token silently against /auth/me
                    // If it fails, TokenStorage clears on 401 automatically via the api client
                    try {
                        const fresh = await authService.getMe();
                        const refreshed = dtoToAuthUser(fresh);
                        setUser(refreshed);
                        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(refreshed));
                    } catch {
                        // Token expired and refresh also failed — clear session
                        await TokenStorage.clearTokens();
                        setUser(null);
                    }
                }
            } catch (e) {
                console.error('[AuthContext] Failed to restore session:', e);
            } finally {
                setIsSessionLoading(false);
            }
        };

        restoreSession();
    }, []);

    // ── Callback Registration ──────────────────────────────────────────────
    const onSignIn = useCallback((cb: SignInCallbackFn) => {
        signInCallbacks.current.push(cb);
        return () => {
            signInCallbacks.current = signInCallbacks.current.filter(fn => fn !== cb);
        };
    }, []);

    const onSignOut = useCallback((cb: SignOutCallbackFn) => {
        signOutCallbacks.current.push(cb);
        return () => {
            signOutCallbacks.current = signOutCallbacks.current.filter(fn => fn !== cb);
        };
    }, []);

    // ── Sign In ────────────────────────────────────────────────────────────
    const signIn = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authService.login({ 
                email, 
                password,
                platform: Platform.OS,
                appVersion: '1.0.0'
            } as any);
            await TokenStorage.setTokens(response.accessToken, response.refreshToken);

            const authUser = dtoToAuthUser(response.user);
            setUser(authUser);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(authUser));

            // Fire all registered post-login callbacks (e.g. push token registration)
            await Promise.allSettled(signInCallbacks.current.map(cb => cb(authUser)));
        } finally {
            setIsLoading(false);
        }
    };

    const signUpWithEmail = async (
        name: string,
        email: string,
        password: string,
        phone?: string,
        role?: UserRole,
        restaurantName?: string,
        restaurantDescription?: string,
        restaurantCuisine?: string,
        vibe?: string,
        dressCode?: string,
        city?: string,
        area?: string,
        latitude?: number,
        longitude?: number,
        restaurantImage?: string,
        restaurantEmail?: string,
        restaurantPhone?: string
    ) => {
        setIsLoading(true);
        try {
            let finalizedImageUrl = restaurantImage;

            // If we have a local image URI, upload it to Cloudinary first
            if (restaurantImage && restaurantImage.startsWith('file://')) {
                try {
                    console.log('[AuthContext] Uploading restaurant image to Cloudinary...');
                    finalizedImageUrl = await uploadImage(restaurantImage);
                    console.log('[AuthContext] Upload success:', finalizedImageUrl);
                } catch (uploadErr) {
                    console.warn('[AuthContext] Image upload failed, proceeding without image:', uploadErr);
                    finalizedImageUrl = undefined;
                }
            }

            const response = await authService.register({
                name,
                email,
                password,
                phone,
                role: role as any,
                restaurantName,
                restaurantDescription,
                restaurantCuisine,
                vibe,
                dressCode,
                city,
                area,
                latitude,
                longitude,
                restaurantImage: finalizedImageUrl,
                restaurantEmail,
                restaurantPhone,
                platform: Platform.OS,
                appVersion: '1.0.0'
            } as any);

            await TokenStorage.setTokens(response.accessToken, response.refreshToken);

            const authUser = dtoToAuthUser(response.user);
            setUser(authUser);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(authUser));

            await Promise.allSettled(signInCallbacks.current.map(cb => cb(authUser)));
        } finally {
            setIsLoading(false);
        }
    };

    // ── Sign Out ───────────────────────────────────────────────────────────
    const signOut = async () => {
        setIsLoading(true);
        try {
            const refreshToken = await TokenStorage.getRefreshToken();
            if (refreshToken) {
                // Best-effort — don't block UI if this fails
                authService.logout(refreshToken).catch(() => {});
            }
        } finally {
            await TokenStorage.clearTokens();
            setUser(null);
            setIsLoading(false);
            await Promise.allSettled(signOutCallbacks.current.map(cb => cb()));
        }
    };

    // ── Password Reset ─────────────────────────────────────────────────────
    const requestPasswordReset = async (email: string) => {
        setIsLoading(true);
        try {
            await authService.forgotPassword({ email });
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (email: string, otp: string, newPassword: string) => {
        setIsLoading(true);
        try {
            await authService.resetPassword({ email, otp, newPassword });
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (data: Partial<Pick<AuthUser, 'name' | 'avatar' | 'phone'>>) => {
        setIsLoading(true);
        try {
            const fresh = await userService.updateProfile(data);
            const authUser = dtoToAuthUser(fresh);
            setUser(authUser);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(authUser));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                isLoading,
                isSessionLoading,
                isAdmin,
                signIn,
                signUpWithEmail,
                signOut,
                requestPasswordReset,
                resetPassword,
                updateProfile,
                onSignIn,
                onSignOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
