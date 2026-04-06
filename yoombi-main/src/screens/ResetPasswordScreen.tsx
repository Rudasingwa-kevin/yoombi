import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Shield, Key, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isStrongPassword, getPasswordErrorMessage } from '../utils/validation';

const ResetPasswordScreen = ({ route, navigation }: any) => {
    const { email } = route.params || {};
    const { resetPassword, isLoading } = useAuth();
    const { colors, isDark } = useTheme();
    
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async () => {
        setError('');
        if (!otp || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!isStrongPassword(password)) {
            setError(getPasswordErrorMessage());
            return;
        }
        if (otp.length < 4) {
            setError("Please enter a valid reset code.");
            return;
        }

        try {
            await resetPassword(email, otp, password);
            setIsSuccess(true);
            setTimeout(() => {
                navigation.navigate('Login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password. Please try again.");
        }
    };

    if (isSuccess) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
                    <CheckCircle2 color={colors.secondary} size={60} />
                </View>
                <Text style={[TYPOGRAPHY.h1, { color: colors.primary, textAlign: 'center', marginBottom: 16 }]}>Password Updated!</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center', marginBottom: 40 }]}>
                    Your password has been successfully reset. Redirecting you to login...
                </Text>
                <ActivityIndicator color={colors.secondary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
                        <Shield color={colors.primary} size={40} />
                    </View>
                    <Text style={[TYPOGRAPHY.h1, { color: colors.primary, textAlign: 'center' }]}>Reset Password</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                        Enter the code sent to your email and choose a strong new password.
                    </Text>
                </View>

                <View style={styles.form}>
                    {error ? (
                        <View style={[styles.errorCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
                            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.primary }]}>Reset Code</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.white, shadowColor: colors.shadow, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Key color={colors.secondary} size={20} />
                            <TextInput
                                style={[styles.input, { color: colors.text, fontSize: 24, letterSpacing: 8, fontWeight: 'bold' }]}
                                placeholder="123456"
                                placeholderTextColor={colors.textSecondary + '30'}
                                value={otp}
                                onChangeText={(text) => {
                                    setOtp(text);
                                    if (error) setError('');
                                }}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.primary }]}>New Password</Text>
                        <Text style={[TYPOGRAPHY.bodySmall, { color: colors.textSecondary, marginLeft: 4, marginBottom: 8, fontSize: 11 }]}>Requires 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.white, shadowColor: colors.shadow, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Minimum 8 characters"
                                placeholderTextColor={colors.textSecondary + '70'}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} color={colors.gray} /> : <Eye size={20} color={colors.gray} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.primary }]}>Confirm Password</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.white, shadowColor: colors.shadow, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Confirm your new password"
                                placeholderTextColor={colors.textSecondary + '70'}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                            styles.perfectButton, 
                            { backgroundColor: colors.secondary, shadowColor: colors.secondary }, 
                            (!otp || !password || !confirmPassword) && styles.disabledButton
                        ]}
                        onPress={handleReset}
                        disabled={isLoading || !otp || !password || !confirmPassword}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={isDark ? colors.primary : colors.white} />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={[styles.perfectButtonText, { color: isDark ? colors.primary : colors.white }]}>Reset Password</Text>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <ArrowRight color={isDark ? colors.primary : colors.white} size={18} />
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    subtitle: {
        ...TYPOGRAPHY.bodyLarge,
        marginTop: 16,
        lineHeight: 24,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '700',
        marginBottom: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        height: 60,
        gap: 12,
        ...SHADOWS.light,
    },
    input: {
        flex: 1,
        ...TYPOGRAPHY.bodyMedium,
    },
    errorCard: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    perfectButton: {
        height: 64,
        borderRadius: 20,
        ...SHADOWS.heavy,
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        overflow: 'hidden',
    },
    buttonContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    perfectButtonText: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default ResetPasswordScreen;
