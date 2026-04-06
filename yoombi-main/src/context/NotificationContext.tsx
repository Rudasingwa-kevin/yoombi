import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';
import { STORAGE_KEYS, FEATURES } from '../constants/config';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationMessage {
    id: string;
    title: string;
    message: string;
    type: 'PROMOTION' | 'SYSTEM' | 'REWARD';
    date: string;
    isRead: boolean;
}

interface NotificationContextType {
    notifications: NotificationMessage[];
    unreadCount: number;
    addNotification: (notification: Omit<NotificationMessage, 'id' | 'date' | 'isRead'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
    refreshFromServer: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
    const notificationListener = useRef<Notifications.Subscription>(null);
    const responseListener = useRef<Notifications.Subscription>(null);

    const { onSignIn, onSignOut } = useAuth();

    // ── Load cached notifications from AsyncStorage on mount ────────────────
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_INBOX);
                if (stored) setNotifications(JSON.parse(stored));
            } catch (e) {
                console.error('[NotificationContext] Failed to load cached notifications:', e);
            }
        };
        loadNotifications();
    }, []);

    // ── Register push notification listeners ─────────────────────────────────
    useEffect(() => {
        if (!FEATURES.PUSH_NOTIFICATIONS) return;

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            const { title, body, data } = notification.request.content;
            
            // Critical fix: prevent infinite loop if this was a local notification
            if (data && data.isLocal) return;

            addNotification({
                title: title ?? 'Notification',
                message: body ?? '',
                type: (data?.type as NotificationMessage['type']) ?? 'SYSTEM',
            });
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const { data } = response.notification.request.content;
            console.log('[NotificationContext] Notification tapped, data:', data);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    // ── Register device token when user signs in ─────────────────────────────
    useEffect(() => {
        const unsubscribeSignIn = onSignIn(async () => {
            if (!FEATURES.PUSH_NOTIFICATIONS) return;
            try {
                const deviceToken = await registerForPushNotificationsAsync();
                if (deviceToken) {
                    await notificationService.registerDeviceToken({ deviceToken });
                    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, deviceToken);
                    console.log('[NotificationContext] Push token registered:', deviceToken);
                }
            } catch (e) {
                console.warn('[NotificationContext] Failed to register push token:', e);
            }
            await refreshFromServer().catch(() => {});
        });

        const unsubscribeSignOut = onSignOut(async () => {
            await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_INBOX);
            await AsyncStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
            setNotifications([]);
        });

        return () => {
            unsubscribeSignIn();
            unsubscribeSignOut();
        };
    }, [onSignIn, onSignOut]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const saveNotifications = async (updated: NotificationMessage[]) => {
        setNotifications(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_INBOX, JSON.stringify(updated));
    };

    const addNotification = async (notif: Omit<NotificationMessage, 'id' | 'date' | 'isRead'>) => {
        const newNotif: NotificationMessage = {
            ...notif,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            isRead: false,
        };
        const updated = [newNotif, ...notifications];
        await saveNotifications(updated);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: newNotif.title,
                body: newNotif.message,
                data: { id: newNotif.id, isLocal: true },
            },
            trigger: null,
        });
    };

    const markAsRead = async (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        await saveNotifications(updated);
        notificationService.markAsRead(id).catch(() => {});
    };

    const markAllAsRead = async () => {
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        await saveNotifications(updated);
        notificationService.markAllAsRead().catch(() => {});
    };

    const clearAll = async () => {
        await saveNotifications([]);
    };

    const refreshFromServer = async () => {
        try {
            const serverNotifs = await notificationService.getInbox();
            const mapped: NotificationMessage[] = serverNotifs.map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: (n.type === 'PROMO' ? 'PROMOTION' : 'SYSTEM') as NotificationMessage['type'],
                date: n.createdAt,
                isRead: n.read,
            }));
            await saveNotifications(mapped);
        } catch (e) {
            console.warn('[NotificationContext] Failed to fetch from server:', e);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
                refreshFromServer,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// Push Token Registration Helper
// ─────────────────────────────────────────────────────────────────────────────

async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[Notifications] Permission not granted');
        return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
}
