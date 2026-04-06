import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ShieldAlert, Mail, Phone, LogOut } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PendingApprovalScreen = () => {
    const { signOut } = useAuth();
    const { colors, isDark } = useTheme();

    const handleContactEmail = () => {
        Linking.openURL('mailto:support@yoombi.com');
    };

    const handleContactPhone = () => {
        Linking.openURL('tel:+250780000000');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '10' }]}>
                    <ShieldAlert color={colors.secondary} size={80} />
                </View>

                <Text style={[TYPOGRAPHY.h1, { color: colors.primary }]}>Account Pending</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    Thank you for joining Yoombi! Your partner account is currently being reviewed by our team.
                    This usually takes 24-48 hours.
                </Text>

                <View style={[styles.contactCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[styles.contactTitle, { color: colors.text }]}>Need urgent assistance?</Text>

                    <TouchableOpacity style={[styles.contactItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} onPress={handleContactEmail}>
                        <Mail color={colors.primary} size={20} />
                        <Text style={[styles.contactText, { color: colors.primary }]}>support@yoombi.com</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.contactItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} onPress={handleContactPhone}>
                        <Phone color={colors.primary} size={20} />
                        <Text style={[styles.contactText, { color: colors.primary }]}>+250 780 000 000</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <LogOut color="#EF4444" size={20} />
                    <Text style={styles.logoutText}>Back to Sign In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    description: {
        ...TYPOGRAPHY.bodyLarge,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
    contactCard: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        marginTop: 40,
        ...SHADOWS.medium,
    },
    contactTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: 20,
        textAlign: 'center',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    contactText: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 40,
        padding: 12,
    },
    logoutText: {
        ...TYPOGRAPHY.bodyMedium,
        color: '#EF4444',
        fontWeight: '700',
    },
});

export default PendingApprovalScreen;
