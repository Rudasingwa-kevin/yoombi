import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    View,
} from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastItemProps {
    config: ToastConfig;
    onDismiss: (id: string) => void;
}

const ICON_MAP = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const PALETTE = {
    success: {
        bg: '#ECFDF5',
        border: '#10B981',
        icon: '#10B981',
        title: '#065F46',
        message: '#047857',
        darkBg: '#064E3B',
        darkBorder: '#10B981',
        darkTitle: '#D1FAE5',
        darkMessage: '#A7F3D0',
    },
    error: {
        bg: '#FEF2F2',
        border: '#EF4444',
        icon: '#EF4444',
        title: '#7F1D1D',
        message: '#991B1B',
        darkBg: '#450A0A',
        darkBorder: '#EF4444',
        darkTitle: '#FEE2E2',
        darkMessage: '#FECACA',
    },
    warning: {
        bg: '#FFFBEB',
        border: '#F59E0B',
        icon: '#F59E0B',
        title: '#78350F',
        message: '#92400E',
        darkBg: '#422006',
        darkBorder: '#F59E0B',
        darkTitle: '#FEF3C7',
        darkMessage: '#FDE68A',
    },
    info: {
        bg: '#EFF6FF',
        border: '#3B82F6',
        icon: '#3B82F6',
        title: '#1E3A8A',
        message: '#1D4ED8',
        darkBg: '#0C1C3F',
        darkBorder: '#3B82F6',
        darkTitle: '#DBEAFE',
        darkMessage: '#BFDBFE',
    },
};

export const ToastItem = ({ config, onDismiss }: ToastItemProps) => {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.92)).current;

    const palette = PALETTE[config.type];
    const Icon = ICON_MAP[config.type];
    const duration = config.duration ?? 4000;

    useEffect(() => {
        // Entrance
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
        ]).start();

        // Auto-dismiss
        const timer = setTimeout(() => dismiss(), duration);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -120,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss(config.id));
    };

    const bg = isDark ? palette.darkBg : palette.bg;
    const borderColor = isDark ? palette.darkBorder : palette.border;
    const titleColor = isDark ? palette.darkTitle : palette.title;
    const messageColor = isDark ? palette.darkMessage : palette.message;

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    backgroundColor: bg,
                    borderLeftColor: borderColor,
                    transform: [{ translateY }, { scale }],
                    opacity,
                    marginTop: insets.top + (Platform.OS === 'android' ? 8 : 0),
                },
                SHADOWS.heavy,
            ]}
        >
            {/* Accent bar */}
            <View style={[styles.accentBar, { backgroundColor: borderColor }]} />

            <View style={styles.iconWrapper}>
                <Icon color={palette.icon} size={22} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                    {config.title}
                </Text>
                {config.message ? (
                    <Text style={[styles.message, { color: messageColor }]} numberOfLines={2}>
                        {config.message}
                    </Text>
                ) : null}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={titleColor} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toast: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        borderLeftWidth: 4,
        minHeight: 64,
        paddingVertical: 12,
        paddingRight: 12,
    },
    accentBar: {
        width: 0, // handled by borderLeftWidth
    },
    iconWrapper: {
        paddingHorizontal: 14,
    },
    content: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    message: {
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 18,
        opacity: 0.9,
    },
    closeBtn: {
        padding: 4,
        marginLeft: 8,
        opacity: 0.7,
    },
});
