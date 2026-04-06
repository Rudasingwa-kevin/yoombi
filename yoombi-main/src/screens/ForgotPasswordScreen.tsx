import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Mail, ChevronLeft, Send, ArrowRight } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ForgotPasswordScreen = ({ navigation }: any) => {
    const { requestPasswordReset, isLoading } = useAuth();
    const { colors, isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);

    const handleResetRequest = async () => {
        if (!email) return;
        try {
            await requestPasswordReset(email);
            setIsSent(true);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                    style={[styles.backButton, { backgroundColor: colors.white, shadowColor: colors.shadow }]} 
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color={colors.primary} size={24} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
                        <Mail color={colors.primary} size={40} />
                    </View>
                    <Text style={[TYPOGRAPHY.h1, { color: colors.primary, textAlign: 'center' }]}>
                        {isSent ? 'Check Your Email' : 'Forgot Password?'}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                        {isSent 
                            ? `We've sent reset instructions to ${email}`
                            : "Enter the email associated with your account and we'll send you instructions to reset your password."
                        }
                    </Text>
                </View>

                {!isSent ? (
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.primary }]}>Email Address</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.white, shadowColor: colors.shadow, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                <Mail color={colors.secondary} size={20} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="yourname@example.com"
                                    placeholderTextColor={colors.textSecondary + '70'}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                                styles.perfectButton, 
                                { backgroundColor: colors.primary, shadowColor: colors.primary }, 
                                !email && styles.disabledButton
                            ]}
                            onPress={handleResetRequest}
                            disabled={isLoading || !email}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={isDark ? colors.secondary : colors.white} />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={[styles.perfectButtonText, { color: isDark ? colors.secondary : colors.white }]}>Send Instructions</Text>
                                    <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                        <Send color={isDark ? colors.secondary : colors.white} size={18} />
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.successView}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.perfectButton, { backgroundColor: colors.primary, shadowColor: colors.primary, width: '100%' }]}
                            onPress={() => navigation.navigate('ResetPassword', { email })}
                        >
                            <View style={styles.buttonContent}>
                                <Text style={[styles.perfectButtonText, { color: isDark ? colors.secondary : colors.white }]}>Enter Reset Code</Text>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                    <ArrowRight color={isDark ? colors.secondary : colors.white} size={18} />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.resendButton} onPress={() => setIsSent(false)}>
                            <Text style={[styles.resendText, { color: colors.secondary }]}>Didn't receive email? Try again</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        ...SHADOWS.light,
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
        marginBottom: 32,
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
        height: 56,
        gap: 12,
        ...SHADOWS.light,
    },
    input: {
        flex: 1,
        ...TYPOGRAPHY.bodyMedium,
    },
    perfectButton: {
        height: 64,
        borderRadius: 20,
        ...SHADOWS.medium,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
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
        opacity: 0.7,
    },
    successView: {
        alignItems: 'center',
        width: '100%',
    },
    resendButton: {
        marginTop: 24,
    },
    resendText: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '600',
    },
});

export default ForgotPasswordScreen;
