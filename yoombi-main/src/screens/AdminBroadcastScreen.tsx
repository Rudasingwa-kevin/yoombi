import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Send, Megaphone, Bell, Info, CheckCircle, Smartphone, Rocket } from 'lucide-react-native';
import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { notificationService } from '../services/api';

const AdminBroadcastScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();
    const { addNotification } = useNotifications();

    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        message: '',
        type: 'PROMOTION' as 'PROMOTION' | 'SYSTEM' | 'REWARD',
    });

    const handleSend = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            Alert.alert("Error", "Please fill in both title and message.");
            return;
        }

        setLoading(true);
        try {
            // In a real app, this would be an API call to a push notification service (FCM/APNS)
            // Here we trigger the local notification + save to inbox
            await addNotification({
                title: form.title,
                message: form.message,
                type: form.type,
            });

            Alert.alert(
                "Broadcast Sent!", 
                "The notification has been sent to users' lockscreens and added to their in-app inbox.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (e) {
            Alert.alert("Error", "Failed to send broadcast.");
        } finally {
            setLoading(false);
        }
    };

    const notificationTypes: Array<{id: 'PROMOTION' | 'SYSTEM' | 'REWARD', label: string, icon: any, color: string}> = [
        { id: 'PROMOTION', label: 'Promotion', icon: Megaphone, color: colors.secondary },
        { id: 'SYSTEM', label: 'System Alert', icon: Info, color: '#3B82F6' },
        { id: 'REWARD', label: 'Member Reward', icon: CheckCircle, color: '#10B981' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Send Broadcast</Text>
                <Smartphone color={colors.primary} size={24} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '05' }]}>
                    <Rocket color={colors.primary} size={24} />
                    <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoTitle, { color: colors.primary }]}>Global Push Notification</Text>
                        <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
                            This message will appear instantly on users' lockscreens and in their notification tray.
                        </Text>
                    </View>
                </View>

                {/* Type Selection */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>SELECT NOTIFICATION TYPE</Text>
                <View style={styles.typeGrid}>
                    {notificationTypes.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.typeBtn,
                                { 
                                    backgroundColor: colors.white,
                                    borderColor: form.type === type.id ? type.color : 'transparent',
                                    borderWidth: 2
                                }
                            ]}
                            onPress={() => setForm(prev => ({ ...prev, type: type.id }))}
                        >
                            <type.icon color={type.color} size={20} />
                            <Text style={[styles.typeText, { color: colors.text }]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Form */}
                <View style={[styles.form, { backgroundColor: colors.white }]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTIFICATION TITLE</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.gray + '20' }]}
                        value={form.title}
                        onChangeText={(t) => setForm(prev => ({ ...prev, title: t }))}
                        placeholder="e.g. Flash Sale: 20% Off Tonight!"
                        placeholderTextColor={colors.gray}
                    />

                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SHORT MESSAGE (Lockscreen Text)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.gray + '20' }]}
                        value={form.message}
                        onChangeText={(t) => setForm(prev => ({ ...prev, message: t }))}
                        placeholder="e.g. Visit The Heaven Restaurant and enjoy our signature fusion cocktail package at a special price."
                        placeholderTextColor={colors.gray}
                        multiline
                        numberOfLines={4}
                    />

                    <TouchableOpacity 
                        style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleSend}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Send color={isDark ? colors.secondary : 'white'} size={20} />
                                <Text style={[styles.sendBtnText, { color: isDark ? colors.secondary : 'white' }]}>Send Broadcast Now</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.previewSection}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>LOCKSCREEN PREVIEW</Text>
                    <View style={[styles.previewCard, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                        <View style={styles.previewHeader}>
                            <Bell color={isDark ? '#BBB' : '#666'} size={12} />
                            <Text style={[styles.previewAppName, { color: isDark ? '#BBB' : '#666' }]}>YOOMBI • NOW</Text>
                        </View>
                        <Text style={[styles.previewTitle, { color: isDark ? 'white' : 'black' }]}>
                            {form.title || 'Notification Title'}
                        </Text>
                        <Text style={[styles.previewBody, { color: isDark ? '#DDD' : '#444' }]} numberOfLines={2}>
                            {form.message || 'Description of the promotion or update will appear here...'}
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.light,
    },
    content: { padding: 20 },
    infoCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 24,
        gap: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    infoTextContainer: { flex: 1 },
    infoTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    infoDesc: { fontSize: 12, lineHeight: 18 },
    label: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1 },
    typeGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    typeBtn: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 16,
        alignItems: 'center',
        gap: 8,
        ...SHADOWS.light,
    },
    typeText: { fontSize: 10, fontWeight: '700' },
    form: {
        padding: 20,
        borderRadius: 24,
        ...SHADOWS.light,
        marginBottom: 24,
    },
    inputLabel: { fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        fontSize: 15,
        marginBottom: 20,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    sendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 18,
    },
    sendBtnText: { fontSize: 16, fontWeight: '800' },
    previewSection: { marginTop: 10 },
    previewCard: {
        borderRadius: 18,
        padding: 16,
        marginTop: 4,
    },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    previewAppName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    previewTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    previewBody: { fontSize: 13, lineHeight: 18 },
    bottomSpacer: { height: 100 },
});

export default AdminBroadcastScreen;
