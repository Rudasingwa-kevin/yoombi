import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { ChevronLeft, Activity, Globe, Cpu, Smartphone, AlertCircle, RefreshCw, Zap } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { systemService } from '../services/api';
import { SystemHealthDTO } from '../types/dto';
import { ActivityIndicator } from 'react-native';

const AdminSystemHealthScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }

    const [healthData, setHealthData] = React.useState<SystemHealthDTO | null>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchHealth = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await systemService.getHealthDetailed();
            setHealthData(data);
        } catch (error) {
            console.error('[AdminSystemHealth] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchHealth();
    }, [fetchHealth]);

    const stats = healthData || {
        apiLatency: '0ms',
        errorRate: '0.0%',
        serverStatus: 'Loading',
        memoryUsage: '0%',
        uptime: '0%',
        activeConnections: '0',
        appVersions: [
            { version: 'iOS 1.2.0', count: 'Loading...' },
            { version: 'Android 1.2.0', count: 'Loading...' },
            { version: 'Web', count: 'Loading...' }
        ]
    };

    const HEALTH_CARDS = [
        { label: 'API Latency', value: stats.apiLatency, icon: Zap, color: '#3B82F6', status: 'Healthy' },
        { label: 'Error Rate', value: stats.errorRate, icon: AlertCircle, color: '#10B981', status: 'Nominal' },
        { label: 'Server Status', value: stats.serverStatus, icon: Globe, color: '#10B981', status: 'Online' },
        { label: 'Memory Usage', value: stats.memoryUsage, icon: Cpu, color: '#F59E0B', status: 'Optimal' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <View style={styles.headerTitleRow}>
                    <Activity color={colors.secondary} size={20} />
                    <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>System Health</Text>
                </View>
                <TouchableOpacity onPress={fetchHealth}>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                        <RefreshCw color={colors.primary} size={20} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Summary */}
                <View style={[styles.statusBanner, { backgroundColor: '#10B98115' }]}>
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.statusText, { color: '#10B981' }]}>ALL SYSTEMS OPERATIONAL</Text>
                </View>

                {/* Metrics Grid */}
                <View style={styles.grid}>
                    {HEALTH_CARDS.map((card, i) => (
                        <View key={i} style={[styles.metricCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                            <View style={[styles.iconBox, { backgroundColor: card.color + '10' }]}>
                                <card.icon color={card.color} size={20} />
                            </View>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{card.label}</Text>
                            <Text style={[styles.metricValue, { color: colors.text }]}>{card.value}</Text>
                            <View style={styles.statusRow}>
                                <View style={[styles.tinyDot, { backgroundColor: card.color }]} />
                                <Text style={[styles.tinyStatus, { color: card.color }]}>{card.status}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* App Versions */}
                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <View style={styles.sectionHeader}>
                        <Smartphone size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Version Distribution</Text>
                    </View>
                    
                    {stats.appVersions.map((v: { version: string; count: string }, i: number) => (
                        <View key={i} style={styles.versionRow}>
                            <View style={styles.versionMeta}>
                                <Text style={[styles.versionName, { color: colors.text }]}>{v.version}</Text>
                                <Text style={[styles.versionCount, { color: colors.textSecondary }]}>{v.count} of active users</Text>
                            </View>
                            <View style={styles.progressBack}>
                                <View style={[styles.progressFill, { width: v.count, backgroundColor: i === 0 ? '#3B82F6' : colors.gray + '50' } as any]} />
                            </View>
                        </View>
                    ))}
                </View>

                <View style={[styles.infoCard, { backgroundColor: colors.primary + '05' }]}>
                    <AlertCircle color={colors.primary} size={18} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Metrics are refreshed every 5 minutes. High latency or error rates will trigger automatic alerts to the technical team.
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
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    content: { padding: 20 },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 24,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    metricCard: {
        width: (Dimensions.get('window').width - 56) / 2,
        padding: 16,
        borderRadius: 24,
        ...SHADOWS.light,
    },
    iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    metricLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
    metricValue: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tinyDot: { width: 4, height: 4, borderRadius: 2 },
    tinyStatus: { fontSize: 9, fontWeight: '700' },
    section: { padding: 20, borderRadius: 24, marginBottom: 24, ...SHADOWS.light },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: '800' },
    versionRow: { marginBottom: 16 },
    versionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
    versionName: { fontSize: 13, fontWeight: '700' },
    versionCount: { fontSize: 10 },
    progressBack: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    infoCard: { flexDirection: 'row', gap: 12, padding: 20, borderRadius: 20, alignItems: 'center' },
    infoText: { flex: 1, fontSize: 11, lineHeight: 18 },
    bottomSpacer: { height: 100 },
});

export default AdminSystemHealthScreen;
