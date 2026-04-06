import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    Platform,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LogIn, X, ShieldCheck, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AuthRequirementModalProps {
    isVisible: boolean;
    onClose: () => void;
    onLogin: () => void;
    title?: string;
    description?: string;
}

const AuthRequirementModal: React.FC<AuthRequirementModalProps> = ({
    isVisible,
    onClose,
    onLogin,
    title = "Membership Required",
    description = "Join the Yoombi elite to unlock curated collections, trending hotspots, and exclusive dining experiences across Rwanda.",
}) => {
    const { colors, isDark } = useTheme();

    const handleLogin = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLogin();
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView
                    intensity={isDark ? 40 : 60}
                    tint={isDark ? "dark" : "light"}
                    style={StyleSheet.absoluteFill}
                />
                
                <TouchableOpacity 
                    style={StyleSheet.absoluteFill} 
                    activeOpacity={1} 
                    onPress={onClose} 
                />

                <View style={[styles.modalContainer, { backgroundColor: colors.background, shadowColor: colors.shadow }]}>
                    {/* Header Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <ShieldCheck size={32} color={colors.secondary} />
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity 
                        style={[styles.closeButton, { backgroundColor: colors.gray + '20' }]} 
                        onPress={onClose}
                    >
                        <X size={20} color={colors.text} />
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {description}
                        </Text>
                    </View>

                    {/* Features List */}
                    <View style={styles.features}>
                        <View style={styles.featureItem}>
                            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                            <Text style={[styles.featureText, { color: colors.text }]}>Trending Hotspots</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                            <Text style={[styles.featureText, { color: colors.text }]}>Emerald Exclusive Access</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                            <Text style={[styles.featureText, { color: colors.text }]}>Loyalty Rewards & Points</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: colors.primary }]}
                            onPress={handleLogin}
                        >
                            <Text style={[styles.loginButtonText, { color: isDark ? colors.secondary : 'white' }]}>Sign In to Explore</Text>
                            <ArrowRight size={18} color={isDark ? colors.secondary : 'white'} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Continue as Guest</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        ...SHADOWS.heavy,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        ...TYPOGRAPHY.h2,
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        ...TYPOGRAPHY.bodyMedium,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    features: {
        width: '100%',
        marginBottom: 32,
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    featureText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        width: '100%',
        gap: 12,
    },
    loginButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        ...SHADOWS.medium,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '800',
    },
    cancelButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default AuthRequirementModal;
