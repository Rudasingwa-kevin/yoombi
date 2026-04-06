import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Camera, User, Mail, Phone, MapPin, Check, Edit2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TYPOGRAPHY, SHADOWS, SIZES } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../services/api';

const InfoField = ({ icon: Icon, label, value, onChangeText, editable, isEditing, isDark, colors }: any) => (
    <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={[
            styles.inputWrapper,
            {
                backgroundColor: isDark ? colors.white : '#F8F9FA',
                borderColor: isEditing && editable ? colors.secondary : 'transparent',
                borderWidth: 1
            }
        ]}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                <Icon color={colors.primary} size={18} />
            </View>
            <TextInput
                style={[styles.input, { color: colors.text }]}
                value={value}
                onChangeText={onChangeText}
                editable={isEditing && editable}
                placeholder={`Enter ${label.toLowerCase()}`}
                placeholderTextColor={colors.gray}
            />
        </View>
    </View>
);

const PersonalInformationScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { user, updateProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState('Kigali, Rwanda'); // Address is not currently in the User model, keeping as placeholder for now
 
    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }
 
        setIsLoading(true);
        try {
            await updateProfile({ 
                name, 
                phone 
            });
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickAvatar = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission needed", "Please allow camera roll access to update your avatar.");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
            const uri = pickerResult.assets[0].uri;
            setIsLoading(true);
            try {
                const uploadedUrl = await uploadImage(uri);
                await updateProfile({ avatar: uploadedUrl });
                Alert.alert('Success', 'Profile picture updated successfully!');
            } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to update avatar. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        }
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
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Personal Details</Text>
                <TouchableOpacity
                    onPress={isEditing ? handleSave : () => setIsEditing(true)}
                    style={[styles.editButton, { backgroundColor: isEditing ? colors.success : colors.primary }]}
                >
                    {isEditing ? (
                        <Check color="white" size={20} />
                    ) : (
                        <Edit2 color={isDark ? colors.secondary : "white"} size={18} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={[styles.avatarContainer, { borderColor: colors.secondary }]}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={[styles.avatar, { width: '100%', height: '100%', borderRadius: 60 }]} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: colors.primary, width: '100%', height: '100%', borderRadius: 60, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={styles.avatarInitial}>{name[0]}</Text>
                            </View>
                        )}
                        <View style={[styles.cameraButton, { backgroundColor: colors.secondary }]}>
                            <Camera color="white" size={16} />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.userName, { color: colors.text }]}>{isLoading ? 'Updating...' : name}</Text>
                    <Text style={[styles.userRole, { color: colors.secondary }]}>{user?.role || 'User'}</Text>
                </View>

                <View style={[styles.infoSection, { backgroundColor: colors.white }]}>
                    <InfoField
                        icon={User}
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        editable={true}
                        isEditing={isEditing}
                        isDark={isDark}
                        colors={colors}
                    />
                    <InfoField
                        icon={Mail}
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        editable={false}
                        isEditing={isEditing}
                        isDark={isDark}
                        colors={colors}
                    />
                    <InfoField
                        icon={Phone}
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        editable={true}
                        isEditing={isEditing}
                        isDark={isDark}
                        colors={colors}
                    />
                    <InfoField
                        icon={MapPin}
                        label="Location"
                        value={address}
                        onChangeText={setAddress}
                        editable={true}
                        isEditing={isEditing}
                        isDark={isDark}
                        colors={colors}
                    />
                </View>

                {isEditing && (
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={isDark ? colors.secondary : 'white'} />
                        ) : (
                            <Text style={[styles.saveButtonText, { color: isDark ? colors.secondary : 'white' }]}>Update Profile</Text>
                        )}
                    </TouchableOpacity>
                )}
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
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    scrollContent: { padding: 20, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        padding: 5,
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: { fontSize: 40, fontWeight: 'bold', color: 'white' },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    userName: { ...TYPOGRAPHY.h2, marginBottom: 4 },
    userRole: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    infoSection: {
        borderRadius: 24,
        padding: 20,
        paddingBottom: 8,
        ...SHADOWS.light,
    },
    fieldContainer: { marginBottom: 20 },
    fieldLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 56,
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '500',
    },
    saveButton: {
        marginTop: 24,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    saveButtonText: { fontSize: 16, fontWeight: '700' },
});

export default PersonalInformationScreen;
