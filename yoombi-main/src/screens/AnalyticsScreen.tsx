import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { TrendingUp, Users, Star, Eye, ThumbsUp, MessageCircle } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();

    const stats = [
        { label: 'Total Views', value: '12.4K', change: '+12%', icon: Eye, color: colors.primary },
        { label: 'New Reviews', value: '48', change: '+8%', icon: MessageCircle, color: colors.secondary },
        { label: 'Avg Rating', value: '4.8', change: '+0.2', icon: Star, color: '#FFD700' },
        { label: 'Favorites', value: '2.1K', change: '+15%', icon: ThumbsUp, color: '#10B981' },
    ];

    const weeklyData = [
        { day: 'Mon', views: 320, reviews: 5 },
        { day: 'Tue', views: 450, reviews: 8 },
        { day: 'Wed', views: 380, reviews: 6 },
        { day: 'Thu', views: 520, reviews: 12 },
        { day: 'Fri', views: 680, reviews: 15 },
        { day: 'Sat', views: 890, reviews: 20 },
        { day: 'Sun', views: 750, reviews: 18 },
    ];

    const maxViews = Math.max(...weeklyData.map(d => d.views));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader
                title="Analytics"
                subtitle="Restaurant performance"
                onBack={() => navigation.goBack()}
                accentIcon={<TrendingUp color="#C5A059" size={16} />}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View
                            key={index}
                            style={[styles.statCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: stat.color + '20' }]}>
                                <stat.icon color={stat.color} size={24} />
                            </View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                            <Text style={[styles.statChange, { color: '#10B981' }]}>{stat.change}</Text>
                        </View>
                    ))}
                </View>

                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Weekly Performance</Text>
                        <TrendingUp color={colors.secondary} size={20} />
                    </View>

                    <View style={styles.chart}>
                        {weeklyData.map((data, index) => (
                            <View key={index} style={styles.chartBar}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: (data.views / maxViews) * 120,
                                            backgroundColor: colors.secondary,
                                        },
                                    ]}
                                />
                                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{data.day}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Daily Views</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Top Performing Days</Text>
                    {weeklyData
                        .sort((a, b) => b.views - a.views)
                        .slice(0, 3)
                        .map((data, index) => (
                            <View key={index} style={[styles.dayRow, { borderBottomColor: colors.gray + '30' }]}>
                                <View style={[styles.rank, { backgroundColor: colors.secondary + '20' }]}>
                                    <Text style={[styles.rankText, { color: colors.secondary }]}>#{index + 1}</Text>
                                </View>
                                <Text style={[styles.dayName, { color: colors.text }]}>{data.day}</Text>
                                <View style={{ flex: 1 }} />
                                <View style={styles.dayStats}>
                                    <Eye color={colors.primary} size={16} />
                                    <Text style={[styles.dayValue, { color: colors.text }]}>{data.views}</Text>
                                </View>
                                <View style={styles.dayStats}>
                                    <MessageCircle color={colors.secondary} size={16} />
                                    <Text style={[styles.dayValue, { color: colors.text }]}>{data.reviews}</Text>
                                </View>
                            </View>
                        ))}
                </View>

                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Customer Demographics</Text>
                    <View style={styles.demoRow}>
                        <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Local Visitors</Text>
                        <View style={styles.demoBar}>
                            <View style={[styles.demoFill, { width: '65%', backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={[styles.demoValue, { color: colors.text }]}>65%</Text>
                    </View>
                    <View style={styles.demoRow}>
                        <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Tourists</Text>
                        <View style={styles.demoBar}>
                            <View style={[styles.demoFill, { width: '35%', backgroundColor: colors.secondary }]} />
                        </View>
                        <Text style={[styles.demoValue, { color: colors.text }]}>35%</Text>
                    </View>
                </View>

                <View style={styles.bottomSpace} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: {
        width: (width - 52) / 2,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { ...TYPOGRAPHY.h2, marginBottom: 4 },
    statLabel: { ...TYPOGRAPHY.bodySmall, marginBottom: 4 },
    statChange: { ...TYPOGRAPHY.bodySmall, fontWeight: '700' },
    section: { padding: 20, borderRadius: 24, marginBottom: 20, ...SHADOWS.light },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { ...TYPOGRAPHY.h3 },
    chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150, marginBottom: 16 },
    chartBar: { flex: 1, alignItems: 'center', gap: 8 },
    bar: { width: 24, borderRadius: 12 },
    chartLabel: { fontSize: 10, fontWeight: '600' },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12 },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    rank: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 12, fontWeight: '700' },
    dayName: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600', width: 60 },
    dayStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dayValue: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', width: 40 },
    demoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    demoLabel: { ...TYPOGRAPHY.bodySmall, width: 100 },
    demoBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.05)' },
    demoFill: { height: '100%', borderRadius: 4 },
    demoValue: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', width: 40, textAlign: 'right' },
    bottomSpace: { height: 40 },
});

export default AnalyticsScreen;
