import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Modal } from 'react-native';
import { ChevronLeft, AlertTriangle, Megaphone, ShieldAlert, Save, X, Info, CheckCircle, AlertCircle, Eye, Zap } from 'lucide-react-native';
import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';

const AdminEmergencyScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();
    const { isMaintenanceMode, setMaintenanceMode, activeBanner, updateBanner } = useSite();

    if (!isAdmin) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }

    const [tempBanner, setTempBanner] = useState({
        message: activeBanner?.message || '',
        type: activeBanner?.type || 'info',
        isActive: activeBanner?.isActive || false
    });

    const DEFAULT_FLAGS = [
        { id: '1', name: 'User Registration', description: 'Allow new user signups', isActive: true, icon: 'user' },
        { id: '2', name: 'Review Submissions', description: 'Allow users to post reviews', isActive: true, icon: 'star' },
        { id: '3', name: 'Restaurant Onboarding', description: 'Allow vendor applications', isActive: true, icon: 'store' },
        { id: '4', name: 'Real-time Notifications', description: 'Websocket push system', isActive: false, icon: 'bell' }
    ];

    const [featureFlags, setFeatureFlags] = useState(DEFAULT_FLAGS);

    const toggleFeature = (id: string, value: boolean) => {
        setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, isActive: value } : f));
    };

    const handleMaintenanceToggle = (value: boolean) => {
        Alert.alert(
            value ? "Enable Maintenance Mode" : "Disable Maintenance Mode",
            value ? "This will deny access to the app for all non-admin users. Are you sure?" : "This will restore access to the app for everyone. Proceed?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: value ? "Enable" : "Disable", 
                    style: value ? "destructive" : "default",
                    onPress: () => setMaintenanceMode(value)
                }
            ]
        );
    };

    const handleSaveBanner = () => {
        updateBanner(tempBanner);
        Alert.alert("Success", "Announcement banner updated!");
    };

    const bannerTypes: Array<{type: 'info' | 'success' | 'warning' | 'error', color: string}> = [
        { type: 'info', color: colors.primary },
        { type: 'success', color: '#10B981' },
        { type: 'warning', color: '#F59E0B' },
        { type: 'error', color: '#EF4444' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Emergency Controls</Text>
                <ShieldAlert color="#EF4444" size={24} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Maintenance Mode */}
                <View style={[styles.card, { backgroundColor: colors.white, borderColor: isMaintenanceMode ? '#EF4444' : 'transparent', borderWidth: isMaintenanceMode ? 1 : 0 }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                            <AlertTriangle color="#EF4444" size={20} />
                        </View>
                        <View style={styles.headerMeta}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Maintenance Mode</Text>
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Pause app access for all users</Text>
                        </View>
                        <Switch
                            value={isMaintenanceMode}
                            onValueChange={handleMaintenanceToggle}
                            trackColor={{ false: colors.gray + '40', true: '#EF4444' }}
                        />
                    </View>
                    {isMaintenanceMode && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>ACTIVE: Global access is restricted.</Text>
                        </View>
                    )}
                </View>

                {/* Banner Manager */}
                <View style={[styles.card, { backgroundColor: colors.white }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: colors.secondary + '15' }]}>
                            <Megaphone color={colors.secondary} size={20} />
                        </View>
                        <View style={styles.headerMeta}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Platform Banner</Text>
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Site-wide announcement</Text>
                        </View>
                        <Switch
                            value={tempBanner.isActive}
                            onValueChange={(val) => setTempBanner(prev => ({ ...prev, isActive: val }))}
                            trackColor={{ false: colors.gray + '40', true: colors.secondary }}
                        />
                    </View>

                    <View style={styles.bannerForm}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>MESSAGE</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.gray + '30' }]}
                            value={tempBanner.message}
                            onChangeText={(t) => setTempBanner(prev => ({ ...prev, message: t }))}
                            placeholder="What's the big news?"
                            multiline
                        />

                        <Text style={[styles.label, { color: colors.textSecondary }]}>BANNER THEME</Text>
                        <View style={styles.typeGrid}>
                            {bannerTypes.map((b) => (
                                <TouchableOpacity
                                    key={b.type}
                                    style={[
                                        styles.typeBtn,
                                        { 
                                            backgroundColor: b.color + '15',
                                            borderColor: tempBanner.type === b.type ? b.color : 'transparent',
                                            borderWidth: 2
                                        }
                                    ]}
                                    onPress={() => setTempBanner(prev => ({ ...prev, type: b.type }))}
                                >
                                    <View style={[styles.typeDot, { backgroundColor: b.color }]} />
                                    <Text style={[styles.typeText, { color: b.color }]}>{b.type.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                            onPress={handleSaveBanner}
                        >
                            <Save color={isDark ? colors.secondary : 'white'} size={20} />
                            <Text style={[styles.saveBtnText, { color: isDark ? colors.secondary : 'white' }]}>Apply Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Feature Flags */}
                <View style={[styles.card, { backgroundColor: colors.white }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#6366F115' }]}>
                            <Zap color="#6366F1" size={20} />
                        </View>
                        <View style={styles.headerMeta}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Feature Flags</Text>
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Toggle experimental features</Text>
                        </View>
                        <AlertCircle color={colors.gray} size={18} />
                    </View>

                    <View style={styles.flagList}>
                        {featureFlags.map((flag) => (
                            <View key={flag.id} style={[styles.flagItem, { borderBottomColor: colors.gray + '10' }]}>
                                <View style={styles.flagMeta}>
                                    <Text style={[styles.flagName, { color: colors.text }]}>{flag.name}</Text>
                                    <Text style={[styles.flagDesc, { color: colors.textSecondary }]}>{flag.description}</Text>
                                </View>
                                <Switch
                                    value={flag.isActive}
                                    onValueChange={(val) => toggleFeature(flag.id, val)}
                                    trackColor={{ false: colors.gray + '40', true: '#6366F1' }}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '05' }]}>
                    <Info color={colors.primary} size={18} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Changes to maintenance mode take effect immediately. Banners are cached locally and will update for users on their next session or app refresh.
                    </Text>
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
    card: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        ...SHADOWS.light,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerMeta: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '800' },
    cardSub: { fontSize: 12 },
    warningBox: { marginTop: 16, padding: 12, backgroundColor: '#EF444415', borderRadius: 12 },
    warningText: { color: '#EF4444', fontSize: 12, fontWeight: '700', textAlign: 'center' },
    bannerForm: { marginTop: 24 },
    label: { fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
    input: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 14, marginBottom: 20 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    typeDot: { width: 8, height: 8, borderRadius: 4 },
    typeText: { fontSize: 10, fontWeight: '800' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
    saveBtnText: { fontSize: 16, fontWeight: '800' },
    infoCard: { flexDirection: 'row', gap: 12, padding: 20, borderRadius: 20, alignItems: 'center' },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    flagList: { marginTop: 16 },
    flagItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    flagMeta: { flex: 1, marginRight: 16 },
    flagName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    flagDesc: { fontSize: 11 },
    bottomSpacer: { height: 100 },
});

export default AdminEmergencyScreen;
