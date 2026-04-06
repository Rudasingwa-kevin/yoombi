import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Lock, Eye, EyeOff, Shield, ShieldCheck, UserX, ChevronRight, Fingerprint } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TYPOGRAPHY, SHADOWS, SIZES } from '../constants/theme';
import { userService } from '../services/api';
import { isStrongPassword, getPasswordErrorMessage } from '../utils/validation';

const SecurityItem = ({ icon: Icon, title, description, onPress, children }: any) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.itemContainer, { borderBottomColor: colors.gray + '50' }]}>
            <TouchableOpacity style={styles.itemLeft} onPress={onPress} disabled={!onPress}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                    <Icon color={colors.primary} size={20} />
                </View>
                <View style={styles.itemTextContainer}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>{description}</Text>
                </View>
            </TouchableOpacity>
            {onPress && !children && <ChevronRight color={colors.gray} size={20} />}
            {children}
        </View>
    );
};

const SecurityPrivacyScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { signOut } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPass || !newPass) {
            Alert.alert('Error', 'Please enter both current and new passwords.');
            return;
        }

        if (!isStrongPassword(newPass)) {
            Alert.alert('Weak Password', getPasswordErrorMessage());
            return;
        }

        setIsLoading(true);
        try {
            await userService.changePassword(currentPass, newPass);
            Alert.alert('Success', 'Your password has been changed.');
            setCurrentPass('');
            setNewPass('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action is permanent and cannot be reversed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userService.deleteAccount();
                            await signOut();
                        } catch (e: any) {
                            Alert.alert('Error', 'Failed to delete account. Try again later.');
                        }
                    }
                }
            ]
        );
    };

    const handleComingSoon = () => {
        Alert.alert('Coming Soon', 'This feature is currently under development.');
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: colors.white }]}
                >
                    <ChevronLeft color={colors.primary} size={24} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Security & Privacy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>Password Management</Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
                        <View style={styles.passwordField}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Current Password</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: '#F8F9FA' }]}>
                                <Lock size={16} color={colors.gray} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry={!showPassword}
                                    value={currentPass}
                                    onChangeText={setCurrentPass}
                                    placeholder="••••••••"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} color={colors.gray} /> : <Eye size={18} color={colors.gray} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.passwordField}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>New Password</Text>
                            <Text style={[TYPOGRAPHY.bodySmall, { color: colors.gray, marginLeft: 4, marginBottom: 8, fontSize: 11 }]}>Requires 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: '#F8F9FA' }]}>
                                <Lock size={16} color={colors.gray} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry={!showPassword}
                                    value={newPass}
                                    onChangeText={setNewPass}
                                    placeholder="Enter new password"
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.updateButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
                            onPress={handleChangePassword}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={isDark ? colors.secondary : 'white'} />
                            ) : (
                                <Text style={[styles.updateButtonText, { color: isDark ? colors.secondary : 'white' }]}>Change Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>Access Control</Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
                        <SecurityItem
                            icon={Fingerprint}
                            title="Biometric Login"
                            description="Use FaceID or Fingerprint"
                        >
                            <Switch
                                value={false}
                                onValueChange={handleComingSoon}
                                trackColor={{ false: '#767577', true: colors.secondary }}
                                thumbColor={'#f4f3f4'}
                            />
                        </SecurityItem>
                        <SecurityItem
                            icon={ShieldCheck}
                            title="Two-Factor Auth"
                            description="Higher security for your account"
                        >
                            <Switch
                                value={false}
                                onValueChange={handleComingSoon}
                                trackColor={{ false: '#767577', true: colors.secondary }}
                                thumbColor={'#f4f3f4'}
                            />
                        </SecurityItem>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>Privacy & Danger Zone</Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
                        <SecurityItem
                            icon={Shield}
                            title="Private Profile"
                            description="Only approved followers can see you"
                        >
                            <Switch
                                value={false}
                                onValueChange={handleComingSoon}
                                trackColor={{ false: '#767577', true: colors.secondary }}
                                thumbColor={'#f4f3f4'}
                            />
                        </SecurityItem>
                        <SecurityItem
                            icon={UserX}
                            title="Delete Account"
                            description="Permanently remove your data"
                            onPress={handleDeleteAccount}
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    scrollContent: { padding: 20, paddingBottom: 40 },
    section: { marginBottom: 28 },
    sectionTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', marginBottom: 12, marginLeft: 8, textTransform: 'uppercase' },
    sectionCard: {
        borderRadius: 24,
        padding: 16,
        ...SHADOWS.light,
    },
    passwordField: { marginBottom: 16 },
    fieldLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 48,
        gap: 12,
    },
    input: { flex: 1, ...TYPOGRAPHY.bodyMedium, fontSize: 13 },
    updateButton: {
        marginTop: 8,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    updateButtonText: { fontSize: 14, fontWeight: '700' },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTextContainer: { flex: 1 },
    itemTitle: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600', marginBottom: 2 },
    itemDescription: { fontSize: 11 },
});

export default SecurityPrivacyScreen;
