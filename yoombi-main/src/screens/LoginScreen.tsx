import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, ImageBackground, Image, Dimensions } from 'react-native';
import { Mail, Lock, Eye, EyeOff, LogIn, ChevronRight, User, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const { height, width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const { signIn, isLoading } = useAuth();
    const { colors, isDark } = useTheme();
    const toast = useToast();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!identifier || !password) {
            toast.warning('Missing Fields', 'Please enter your email and password to continue.');
            return;
        }
        try {
            await signIn(identifier, password);
        } catch (error: any) {
            console.error('[Login] Error during sign in:', error);
            const msg: string = error?.message ?? '';
            if (msg.toLowerCase().includes('invalid') || error?.statusCode === 401) {
                toast.error('Invalid Credentials', 'The email or password you entered is incorrect.');
            } else if (msg.toLowerCase().includes('blocked')) {
                toast.error('Account Blocked', 'Your account has been suspended. Contact support.');
            } else if (msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('network')) {
                toast.error('Connection Error', 'Cannot reach the server. Check your internet connection.');
            } else {
                toast.error('Login Failed', msg || 'Something went wrong. Please try again.');
            }
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground 
                source={require('../../assets/luxury_dining_mural_1774964512474.png')} 
                style={styles.backgroundImage}
            >
                <LinearGradient
                    colors={['rgba(5, 25, 35, 0.4)', 'rgba(5, 25, 35, 0.95)']}
                    style={styles.gradient}
                >
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.header}>
                                <Image 
                                    source={require('../../assets/Symbol.png')} 
                                    style={{ width: 80, height: 80 }}
                                    resizeMode="contain"
                                />
                                <Text style={[TYPOGRAPHY.h1, { color: colors.secondary, marginTop: 12, letterSpacing: 4 }]}>YOOMBI</Text>
                                <Text style={[styles.subtitle, { color: colors.white + '80', marginTop: 8 }]}>Sign in to your luxury experience</Text>
                            </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.white }]}>Username, Email or Phone</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                                <User color={colors.secondary} size={20} />
                                <TextInput
                                    style={[styles.input, { color: colors.white }]}
                                    placeholder="Enter identifier"
                                    placeholderTextColor={'rgba(255,255,255,0.4)'}
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: colors.white }]}>Password</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                    <Text style={[styles.forgotText, { color: colors.secondary }]}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                                <Lock color={colors.secondary} size={20} />
                                <TextInput
                                    style={[styles.input, { color: colors.white }]}
                                    placeholder="Enter password"
                                    placeholderTextColor={'rgba(255,255,255,0.4)'}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={20} color={'rgba(255,255,255,0.4)'} /> : <Eye size={20} color={'rgba(255,255,255,0.4)'} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: colors.secondary, shadowColor: colors.shadow }, (!identifier || !password) && styles.disabledButton]}
                            onPress={handleLogin}
                            disabled={isLoading || !identifier || !password}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.primary} />
                            ) : (
                                <>
                                    <Text style={[styles.loginButtonText, { color: colors.primary }]}>Login To Excellence</Text>
                                    <LogIn color={colors.primary} size={20} />
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.white + '80' }]}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={[styles.signupLink, { color: colors.secondary }]}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.guestSection}>
                        <View style={styles.dividerRow}>
                            <View style={[styles.line, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                            <Text style={[styles.dividerText, { color: 'rgba(255,255,255,0.4)' }]}>OR</Text>
                            <View style={[styles.line, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                        </View>
                        <TouchableOpacity
                            style={styles.guestButton}
                            onPress={() => navigation.navigate('MainUser')}
                        >
                            <Text style={[styles.guestButtonText, { color: colors.white + '70' }]}>Continue as Guest</Text>
                            <ChevronRight color={colors.white + '70'} size={18} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    </ImageBackground>
</View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { width: width, height: height },
    gradient: { flex: 1 },
    scrollContent: { padding: 32, paddingTop: 100 },
    header: { alignItems: 'center', marginBottom: 48 },
    logo: { width: 120, height: 120 },
    subtitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '700',
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    forgotText: {
        fontSize: 12,
        fontWeight: '600',
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
    loginButton: {
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 12,
        ...SHADOWS.medium,
    },
    disabledButton: {
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        ...TYPOGRAPHY.bodyMedium,
    },
    signupLink: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '700',
    },
    guestSection: {
        marginTop: 48,
        alignItems: 'center',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 32,
        gap: 16,
    },
    line: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        fontWeight: '600',
    },
    guestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    guestButtonText: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '600',
    },
});

export default LoginScreen;
