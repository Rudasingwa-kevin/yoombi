import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { ChevronLeft, TrendingUp, Users, Star, MapPin, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react-native';
import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { analyticsService, restaurantService } from '../services/api';
import { RestaurantDTO } from '../types/dto';

const { width } = Dimensions.get('window');

const AdminAnalyticsScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }

    const [analyticsData, setAnalyticsData] = React.useState<any>(null);
    const [topRated, setTopRated] = React.useState<RestaurantDTO[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [analytics, restaurants] = await Promise.all([
                analyticsService.getAdminOverview(),
                restaurantService.getAll()
            ]);
            setAnalyticsData(analytics);
            const all = (restaurants as any) || [];
            setTopRated([...all].sort((a: any, b: any) => b.rating - a.rating).slice(0, 3));
        } catch (e) {
            console.warn('[AdminAnalytics] Fetch failed', e);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { fetchData(); }, [fetchData]);

    const stats = analyticsData?.stats || [
        { label: 'New Signups', value: '...', sub: 'this week', icon: Users, color: '#3B82F6', trend: '' },
        { label: 'Active Sessions', value: '...', sub: 'last 24h', icon: Activity, color: colors.secondary, trend: '' },
        { label: 'Platform Rating', value: '...', sub: 'avg across app', icon: Star, color: '#F59E0B', trend: '' },
    ];

    const hotZones = analyticsData?.hotZones || [];
    const weeklyGrowth = analyticsData?.growth || [
        { day: 'Mon', count: 0 }, { day: 'Tue', count: 0 }, { day: 'Wed', count: 0 },
        { day: 'Thu', count: 0 }, { day: 'Fri', count: 0 }, { day: 'Sat', count: 0 }, { day: 'Sun', count: 0 },
    ];


    const maxGrowth = Math.max(...weeklyGrowth.map((d: any) => d.count), 1);

    const getStatIcon = (label: string, fallback: any) => {
        if (fallback) return fallback;
        switch (label) {
            case 'New Signups': return Users;
            case 'Active Sessions': return Activity;
            case 'Platform Rating': return Star;
            default: return Activity;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Executive View</Text>
                <TouchableOpacity onPress={fetchData}>
                    {loading ? <ActivityIndicator color={colors.primary} size="small" /> : <TrendingUp color={colors.primary} size={24} />}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* High Level Stats */}
                <View style={styles.statsScrollContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
                        {stats.map((stat: any, i: number) => {
                            const IconComponent = getStatIcon(stat.label, stat.icon);
                            return (
                                <View key={i} style={[styles.statCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                                    <View style={[styles.iconBox, { backgroundColor: stat.color + '15' }]}>
                                        <IconComponent color={stat.color} size={20} />
                                    </View>
                                    <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                                    <View style={styles.statFooter}>
                                        <Text style={[styles.statTrend, { color: colors.success }]}>{stat.trend}</Text>
                                        <Text style={[styles.statSub, { color: colors.gray }]}>{stat.sub}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* User Growth Chart */}
                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>User Growth (This Week)</Text>
                    <View style={styles.chartContainer}>
                        {weeklyGrowth.map((day: any, i: number) => (
                            <View key={i} style={styles.chartBarWrapper}>
                                <View 
                                    style={[
                                        styles.chartBar, 
                                        { 
                                            height: (day.count / maxGrowth) * 100,
                                            backgroundColor: i === 5 ? colors.secondary : colors.primary + '30'
                                        }
                                    ]} 
                                />
                                <Text style={[styles.chartDay, { color: colors.textSecondary }]}>{day.day}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Hot Zones */}
                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Hot Zones (Trending Areas)</Text>
                    {hotZones.length === 0 ? (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 }}>No approved restaurants yet</Text>
                    ) : hotZones.map((zone: any, i: number) => (
                        <View key={zone.id || i} style={[styles.zoneRow, i < hotZones.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.gray + '20' }]}>
                            <View style={[styles.zoneIcon, { backgroundColor: colors.secondary + '10' }]}>
                                <MapPin color={colors.secondary} size={18} />
                            </View>
                            <View style={styles.zoneMeta}>
                                <Text style={[styles.zoneName, { color: colors.text }]}>{zone.name}</Text>
                                <Text style={[styles.zoneCount, { color: colors.textSecondary }]}>{zone.count}</Text>
                            </View>
                            {zone.trend === 'up' ? (
                                <ArrowUpRight color={colors.success} size={20} />
                            ) : (
                                <ArrowDownRight color={colors.error} size={20} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Top Rated Leaderboard */}
                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Highest Rated This Month</Text>
                    {topRated.map((rest, i) => (
                        <View key={rest.id} style={styles.leaderRow}>
                            <Text style={[styles.rankText, { color: colors.secondary }]}>#{i + 1}</Text>
                            <View style={styles.leaderMeta}>
                                <Text style={[styles.restName, { color: colors.text }]}>{rest.name}</Text>
                                <Text style={[styles.restCategory, { color: colors.textSecondary }]}>{rest.cuisine}</Text>
                            </View>
                            <View style={styles.ratingBox}>
                                <Star color="#F59E0B" size={14} fill="#F59E0B" />
                                <Text style={[styles.ratingText, { color: colors.text }]}>{rest.rating}</Text>
                            </View>
                        </View>
                    ))}
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
    scrollContent: { padding: 20 },
    statsScrollContainer: { marginHorizontal: -20, marginBottom: 24 },
    statsRow: { paddingHorizontal: 20, gap: 16 },
    statCard: {
        width: 150,
        padding: 16,
        borderRadius: 24,
        ...SHADOWS.light,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    statFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statTrend: { fontSize: 10, fontWeight: '700' },
    statSub: { fontSize: 10 },
    section: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        ...SHADOWS.light,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 140,
        paddingTop: 10,
    },
    chartBarWrapper: { alignItems: 'center', gap: 8 },
    chartBar: { width: 30, borderRadius: 8 },
    chartDay: { fontSize: 10, fontWeight: '600' },
    zoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 16,
    },
    zoneIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoneMeta: { flex: 1 },
    zoneName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    zoneCount: { fontSize: 12 },
    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    rankText: { fontSize: 18, fontWeight: '900', width: 30 },
    leaderMeta: { flex: 1 },
    restName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    restCategory: { fontSize: 12 },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    ratingText: { fontSize: 13, fontWeight: '700' },
    bottomSpacer: { height: 40 },
});

export default AdminAnalyticsScreen;
