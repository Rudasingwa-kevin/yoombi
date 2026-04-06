import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Mail, ChevronLeft, ShieldCheck, RefreshCw, KeyRound, Fingerprint } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { TYPOGRAPHY, SPACING, SHADOWS, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';

const EmailVerificationScreen = ({ navigation, route }: any) => {
    const { colors } = useTheme();
    const { signIn, signUpWithEmail } = useAuth();
    const toast = useToast();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(59);
    const inputRefs = [
        React.useRef<TextInput>(null),
        React.useRef<TextInput>(null),
        React.useRef<TextInput>(null),
        React.useRef<TextInput>(null),
        React.useRef<TextInput>(null),
        React.useRef<TextInput>(null),
    ];

    const { email, role, password, fullName, phone, restaurantName, restaurantDescription, restaurantCuisine, vibe, dressCode, city, area, latitude, longitude, restaurantImage, restaurantEmail, restaurantPhone } = route.params || {};

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            value = value.charAt(value.length - 1);
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 6 || isVerifying) return;
        
        setIsVerifying(true);
        try {
            // For development, we allow 123456. In production, we'd call the verify-email API.
            if (code !== '123456') {
                // await authService.verifyEmail(email, code); 
            }
            
            if (fullName) {
                // Registration flow
                await signUpWithEmail(
                    fullName, 
                    email, 
                    password, 
                    phone, 
                    role, 
                    restaurantName, 
                    restaurantDescription, 
                    restaurantCuisine, 
                    vibe, 
                    dressCode, 
                    city, 
                    area, 
                    latitude, 
                    longitude, 
                    restaurantImage,
                    restaurantEmail,
                    restaurantPhone
                );
            } else {
                // Login/Reset flow
                await signIn(email, password);
            }

            toast.success('Success', 'Your account has been created successfully!');
            // Navigation happens automatically via AuthContext user state change
        } catch (err: any) {
            console.error('[VERIFY] Error:', err);
            toast.error('Verification Failed', err.message ?? 'Please check your connection and try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        try {
            await authService.sendVerifyCode(email);
            setTimer(59);
            toast.success('Code Sent', `A new verification code has been sent to ${email}`);
        } catch (err: any) {
            toast.error('Failed to Resend', err.message ?? 'Please try again.');
        }
    };

    const styles = StyleSheet.create({
        container: { flex: 1 },
        gradient: { flex: 1 },
        header: { padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
        backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
        content: { flex: 1, padding: 24, alignItems: 'center' },
        symbolContainer: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(197, 160, 89, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 40,
            borderWidth: 1,
            borderColor: 'rgba(197, 160, 89, 0.2)'
        },
        brandSymbol: { width: 70, height: 70 },
        title: { ...TYPOGRAPHY.h1, color: colors.white, textAlign: 'center', marginBottom: 12 },
        subtitle: { ...TYPOGRAPHY.bodyLarge, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 48 },
        emailHighlight: { color: colors.secondary, fontWeight: '800' },
        otpContainer: { flexDirection: 'row', gap: 12, marginBottom: 48 },
        otpInput: {
            width: 50,
            height: 65,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 16,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            textAlign: 'center',
            ...TYPOGRAPHY.h2,
            color: colors.secondary,
        },
        otpInputActive: {
            borderColor: colors.secondary,
            backgroundColor: 'rgba(197, 160, 89, 0.05)',
        },
        verifyButton: {
            width: '100%',
            height: 60,
            backgroundColor: colors.secondary,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32,
            ...SHADOWS.medium
        },
        verifyButtonText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
        resendContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
        resendText: { ...TYPOGRAPHY.bodyMedium, color: 'rgba(255,255,255,0.5)' },
        resendLink: { color: colors.secondary, fontWeight: '800' },
        spamReminder: { flexDirection: 'row', marginTop: -24, marginBottom: 32, alignItems: 'center', backgroundColor: 'rgba(197, 160, 89, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
        spamText: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255,255,255,0.6)' },
        spamHighlight: { ...TYPOGRAPHY.bodySmall, color: colors.secondary, fontWeight: '800' },
    });

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#050B10', '#0A1A2F']}
                style={styles.gradient}
            >
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <ChevronLeft color={colors.white} size={28} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.symbolContainer}>
                            <Image 
                                source={require('../../assets/Symbol.png')} 
                                style={styles.brandSymbol}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.title}>Discrete Protocol</Text>
                        <Text style={styles.subtitle}>
                            Enter the 6-digit identity key sent to{"\n"}
                            <Text style={styles.emailHighlight}>{email}</Text>
                        </Text>

                        <View style={styles.spamReminder}>
                            <Text style={styles.spamText}>No key? Verify your </Text>
                            <Text style={styles.spamHighlight}>Spam folder</Text>
                        </View>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, i) => (
                                <TextInput
                                    key={i}
                                    ref={inputRefs[i]}
                                    style={[styles.otpInput, digit !== '' && styles.otpInputActive]}
                                    value={digit}
                                    onChangeText={(v) => handleOtpChange(v, i)}
                                    onKeyPress={(e) => handleKeyPress(e, i)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    placeholder="•"
                                    placeholderTextColor={'rgba(255,255,255,0.1)'}
                                />
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.verifyButton, isVerifying && { opacity: 0.7 }]} 
                            onPress={handleVerify}
                            disabled={isVerifying}
                        >
                            {isVerifying ? (
                                <ActivityIndicator color={colors.primary} />
                            ) : (
                                <Text style={styles.verifyButtonText}>Authenticate Entity</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.resendContainer}>
                            <RefreshCw size={16} color={timer > 0 ? 'rgba(255,255,255,0.2)' : colors.secondary} />
                            <TouchableOpacity disabled={timer > 0} onPress={handleResend}>
                                <Text style={[styles.resendText, timer === 0 && styles.resendLink]}>
                                    {timer > 0 ? `Retry allowed in ${timer}s` : "Request New Key"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

export default EmailVerificationScreen;
