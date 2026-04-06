import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LogOut, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface SignOutModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const { width } = Dimensions.get('window');

const SignOutModal: React.FC<SignOutModalProps> = ({ visible, onClose, onConfirm }) => {
    const { colors, isDark } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView
                    intensity={40}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />

                <View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            borderColor: isDark ? 'rgba(197, 160, 89, 0.2)' : 'rgba(10, 25, 47, 0.1)',
                        }
                    ]}
                >
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
                        <LogOut color="#EF4444" size={32} />
                    </View>

                    <Text style={[TYPOGRAPHY.h2, { color: colors.primary, textAlign: 'center', marginBottom: 8 }]}>
                        Sign Out
                    </Text>

                    <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }]}>
                        Are you sure you want to log out? You'll need to enter your credentials to get back in.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { borderColor: colors.gray }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, { color: colors.text }]}>Stay Logged In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton, { backgroundColor: '#EF4444' }]}
                            onPress={onConfirm}
                        >
                            <Text style={[styles.buttonText, { color: 'white' }]}>Sign Out</Text>
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
        paddingTop: 48,
        borderWidth: 1,
        alignItems: 'center',
        ...SHADOWS.heavy,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 4,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    cancelButton: {
        borderWidth: 1,
    },
    confirmButton: {
        ...SHADOWS.small,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default SignOutModal;
