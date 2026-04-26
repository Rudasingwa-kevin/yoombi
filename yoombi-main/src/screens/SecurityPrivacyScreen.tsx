import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
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
            {onPress && !children && <ChevronRight color={colors.textSecondary} size={20} />}
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
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deletePass, setDeletePass] = useState('');

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
            setIsPasswordModalVisible(false);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePass) {
            Alert.alert('Error', 'Please enter your password to confirm.');
            return;
        }

        setIsLoading(true);
        try {
            await userService.deleteAccount(deletePass);
            setIsDeleteModalVisible(false);
            await signOut();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete account. Please verify your password.');
        } finally {
            setIsLoading(false);
        }
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
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Security</Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
                        <SecurityItem
                            icon={Lock}
                            title="Change Password"
                            description="Update your login credentials"
                            onPress={() => setIsPasswordModalVisible(true)}
                        />
                    </View>
                </View>

                {/* Change Password Modal */}
                <Modal
                    visible={isPasswordModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsPasswordModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={[styles.modalContent, { backgroundColor: colors.background }]}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Change Password</Text>
                                <TouchableOpacity onPress={() => setIsPasswordModalVisible(false)} style={styles.closeButton}>
                                    <Text style={{ color: colors.secondary, fontWeight: '700' }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <View style={styles.passwordField}>
                                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Current Password</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.white : '#F8F9FA' }]}>
                                        <Lock size={16} color={colors.textSecondary} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            secureTextEntry={!showPassword}
                                            value={currentPass}
                                            onChangeText={setCurrentPass}
                                            placeholder="••••••••"
                                            placeholderTextColor={colors.gray}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.passwordField}>
                                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>New Password</Text>
                                    <Text style={[TYPOGRAPHY.bodySmall, { color: colors.textSecondary, marginLeft: 4, marginBottom: 8, fontSize: 11, opacity: 0.8 }]}>Requires 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.white : '#F8F9FA' }]}>
                                        <Lock size={16} color={colors.textSecondary} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            secureTextEntry={!showPassword}
                                            value={newPass}
                                            onChangeText={setNewPass}
                                            placeholder="Enter new password"
                                            placeholderTextColor={colors.gray}
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
                                        <Text style={[styles.updateButtonText, { color: isDark ? colors.secondary : 'white' }]}>Update Password Now</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Access Control</Text>
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
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacy & Danger Zone</Text>
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
                            onPress={() => setIsDeleteModalVisible(true)}
                        />
                    </View>
                </View>

                {/* Delete Account Confirmation Modal */}
                <Modal
                    visible={isDeleteModalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setIsDeleteModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: 40 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[TYPOGRAPHY.h3, { color: colors.error }]}>Delete Account?</Text>
                                <TouchableOpacity onPress={() => setIsDeleteModalVisible(false)} style={styles.closeButton}>
                                    <Text style={{ color: colors.secondary, fontWeight: '700' }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalBody}>
                                <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text, marginBottom: 20 }]}>
                                    This action is permanent and will delete all your data. Please enter your password to confirm.
                                </Text>

                                <View style={styles.passwordField}>
                                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.white : '#F8F9FA', borderColor: colors.error, borderWidth: 1 }]}>
                                        <Lock size={16} color={colors.error} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            secureTextEntry={true}
                                            value={deletePass}
                                            onChangeText={setDeletePass}
                                            placeholder="Enter your password"
                                            placeholderTextColor={colors.gray}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={[styles.updateButton, { backgroundColor: colors.error, marginTop: 20, opacity: isLoading ? 0.7 : 1 }]}
                                    onPress={handleDeleteAccount}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={[styles.updateButtonText, { color: 'white' }]}>Permanently Delete My Account</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
        ...SHADOWS.heavy,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    closeButton: {
        padding: 8,
    },
    modalBody: {
        marginBottom: 20,
    },
});

export default SecurityPrivacyScreen;
