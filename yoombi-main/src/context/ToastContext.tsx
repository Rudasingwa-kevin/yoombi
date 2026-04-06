import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { ToastItem, ToastConfig, ToastType } from '../components/Toast';

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastConfig[]>([]);
    const counter = useRef(0);

    const showToast = useCallback(
        (type: ToastType, title: string, message?: string, duration?: number) => {
            const id = `toast_${Date.now()}_${counter.current++}`;
            setToasts(prev => [...prev, { id, type, title, message, duration }]);
        },
        []
    );

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
    const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
    const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
    const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            {/* Toast overlay — always on top */}
            <View style={styles.overlay} pointerEvents="box-none">
                {toasts.map(t => (
                    <ToastItem key={t.id} config={t} onDismiss={dismiss} />
                ))}
            </View>
        </ToastContext.Provider>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 9999,
        pointerEvents: 'box-none',
    },
});
