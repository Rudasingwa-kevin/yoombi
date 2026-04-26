import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Animated, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { User, Settings, CreditCard, Bell, Shield, LogOut, ChevronRight, Moon, Sun, Calendar, HelpCircle, Star, MapPin, Clock } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';
import MembershipCard from '../components/MembershipCard';
import SignOutModal from '../components/SignOutModal';
import { useToast } from '../context/ToastContext';

const ProfileButton = ({ icon: Icon, label, color, onPress }: any) => {
    const { colors } = useTheme();
    const iconColor = color || colors.primary;
    return (
        <TouchableOpacity style={[styles.actionItem, { borderBottomColor: colors.border }]} onPress={onPress}>
            <View style={styles.actionLeft}>
                <View style={[styles.iconBox, { backgroundColor: iconColor + '20' }]}>
                    <Icon color={iconColor} size={20} />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>{label}</Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={20} />
        </TouchableOpacity>
    );
};

const ProfileScreen = ({ navigation }: any) => {
    const { signOut, user, role } = useAuth();
    const { colors, isDark, toggleTheme } = useTheme();
    const { loyaltyPoints, getUserTier, checkIn } = useRestaurant();
    const toast = useToast();
    const [isSignOutVisible, setIsSignOutVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const handleCheckIn = async () => {
        try {
            await checkIn('general-check-in');
            toast.success('Visit Verified! 🎉', 'You just earned +50 Loyalty Points.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            toast.error('Check-in Failed', 'Could not verify your visit at this time.');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                    ) : (
                        <Text style={[styles.avatarTextLarge, { color: isDark ? colors.secondary : 'white' }]}>{user?.name?.[0] || 'U'}</Text>
                    )}
                </View>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>{user?.name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.roleText, { color: colors.primary }]}>{role}</Text>
                </View>
            </View>

            {role === 'USER' && (
                <View style={styles.loyaltySection}>
                    <MembershipCard points={loyaltyPoints} tier={getUserTier()} />
                    <TouchableOpacity
                        style={[styles.checkInButton, { backgroundColor: colors.secondary }]}
                        onPress={handleCheckIn}
                    >
                        <MapPin color={colors.primary} size={18} />
                        <Text style={[styles.checkInText, { color: colors.primary }]}>Verify a Visit (+50 PTS)</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.section, { backgroundColor: colors.white }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
                <View style={styles.actionItem}>
                    <View style={styles.actionLeft}>
                        <View style={[styles.iconBox, { backgroundColor: colors.secondary + '20' }]}>
                            {isDark ? <Moon color={colors.secondary} size={20} /> : <Sun color={colors.secondary} size={20} />}
                        </View>
                        <Text style={[styles.actionText, { color: colors.text }]}>Dark Mode</Text>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#767577', true: colors.secondary }}
                        thumbColor={isDark ? colors.primary : '#f4f3f4'}
                    />
                </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.white }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Settings</Text>
                <ProfileButton
                    icon={User}
                    label="Personal Information"
                    onPress={() => navigation.navigate('PersonalInformation')}
                />
                <ProfileButton
                    icon={Bell}
                    label="Notifications"
                    onPress={() => navigation.navigate('Notifications')}
                />
                <ProfileButton
                    icon={Shield}
                    label="Security & Privacy"
                    onPress={() => navigation.navigate('SecurityPrivacy')}
                />
            </View>

            {role !== 'OWNER' && (
                <View style={[styles.section, { backgroundColor: colors.white }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>My Activity</Text>
                    <ProfileButton
                        icon={Clock}
                        label="My Activity History"
                        onPress={() => navigation.navigate('MyActivity')}
                    />
                </View>
            )}

            <View style={[styles.section, { backgroundColor: colors.white }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support & Info</Text>
                <ProfileButton
                    icon={HelpCircle}
                    label="Help & Support"
                    onPress={() => navigation.navigate('HelpSupport')}
                />
            </View>

            {role === 'OWNER' && (
                <View style={[styles.section, { backgroundColor: colors.white }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Business Tools</Text>
                    <ProfileButton
                        icon={Shield}
                        label="Manage Restaurant"
                        color={colors.secondary}
                        onPress={() => navigation.navigate('ManageRestaurant')}
                    />
                    <ProfileButton
                        icon={Star}
                        label="Manage Reviews"
                        color={colors.secondary}
                        onPress={() => navigation.navigate('OwnerReviews')}
                    />
                    <ProfileButton
                        icon={Settings}
                        label="Analytics"
                        color={colors.secondary}
                        onPress={() => navigation.navigate('Analytics')}
                    />
                </View>
            )}

            {role === 'ADMIN' && (
                <View style={[styles.section, { backgroundColor: colors.white }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Admin Controls</Text>
                    <ProfileButton icon={Shield} label="System Security" color="#EF4444" />
                    <ProfileButton icon={Settings} label="Global Config" color="#EF4444" />
                </View>
            )}

            <View style={[styles.section, { marginBottom: 110, backgroundColor: colors.white }]}>
                <ProfileButton icon={LogOut} label="Sign Out" color="#EF4444" onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsSignOutVisible(true);
                }} />
            </View>

            <SignOutModal
                visible={isSignOutVisible}
                onClose={() => setIsSignOutVisible(false)}
                onConfirm={() => {
                    setIsSignOutVisible(false);
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }).start(() => {
                        signOut();
                    });
                }}
            />

            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: colors.background,
                        opacity: fadeAnim,
                        zIndex: 999,
                    }
                ]}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 80, alignItems: 'center', marginBottom: 32 },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...SHADOWS.medium,
    },
    avatarTextLarge: { fontSize: 40, fontWeight: 'bold' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
    roleBadge: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12 },
    roleText: { fontWeight: '700', fontSize: 12 },
    section: { marginHorizontal: 20, borderRadius: 24, padding: 16, marginBottom: 20, ...SHADOWS.light },
    sectionTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', marginBottom: 12, marginLeft: 8, textTransform: 'uppercase' },
    actionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionText: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600' },
    loyaltySection: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    checkInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 8,
        width: '100%',
        marginTop: -10,
        ...SHADOWS.light,
    },
    checkInText: {
        fontWeight: '800',
        fontSize: 14,
    },
});

export default ProfileScreen;
