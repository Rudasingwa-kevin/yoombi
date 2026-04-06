import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { BarChart3, Users, Star, Eye, TrendingUp, ChevronRight, Image, Menu, LayoutDashboard, Smartphone } from 'lucide-react-native';
import { analyticsService } from '../services/api';
import type { OwnerAnalyticsDTO } from '../types/dto';

import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon: Icon, color, trend, colors, onPress }: any) => (
    <TouchableOpacity
        style={[styles.statCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}
        onPress={onPress}
        disabled={!onPress}
    >
        <View style={styles.statHeader}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Icon color={color} size={20} />
            </View>
            <Text style={[styles.trend, { color: trend.startsWith('+') ? colors.success : colors.error }]}>
                {trend}
            </Text>
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
);

const OwnerDashboard = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { currentRestaurant: restaurant } = useRestaurant();
    const [isOpen, setIsOpen] = useState(true);
    const [analytics, setAnalytics] = useState<OwnerAnalyticsDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [restaurant?.id]);

    const fetchAnalytics = async () => {
        if (!restaurant?.id) return;
        setIsLoading(true);
        try {
            const data = await analyticsService.getOwnerAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.warn('[OwnerDashboard] Failed to fetch analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = () => {
        const nextState = !isOpen;
        Alert.alert(
            "Update Store Status",
            `Are you sure you want to set your restaurant to ${nextState ? 'OPEN' : 'CLOSED'}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: nextState ? "Open Store" : "Close Store",
                    onPress: () => setIsOpen(nextState),
                    style: nextState ? "default" : "destructive"
                }
            ]
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={[TYPOGRAPHY.h1, { color: colors.primary }]}>Business Insights</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {restaurant?.name || 'My Restaurant'} Analytics
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.statusToggle,
                            {
                                backgroundColor: isOpen ? colors.success + '15' : colors.error + '15',
                                borderColor: isOpen ? colors.success : colors.error
                            }
                        ]}
                        onPress={toggleStatus}
                    >
                        <View style={[styles.statusDot, { backgroundColor: isOpen ? colors.success : colors.error }]} />
                        <Text style={[styles.statusText, { color: isOpen ? colors.success : colors.error }]}>
                            {isOpen ? 'OPEN' : 'CLOSED'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Total Views"
                    value={analytics ? (analytics.profileViews > 1000 ? `${(analytics.profileViews / 1000).toFixed(1)}K` : analytics.profileViews) : "0"}
                    icon={Eye}
                    color="#3B82F6"
                    trend="+12%"
                    colors={colors}
                />
                <StatCard
                    title="Avg Rating"
                    value={restaurant?.rating?.toFixed(1) || "0.0"}
                    icon={Star}
                    color={colors.secondary}
                    trend={analytics ? `+${(analytics.averageRating - 4.5).toFixed(1)}` : "0.0"}
                    colors={colors}
                />
                <StatCard
                    title="Total Followers"
                    value={restaurant?.followers || "0"}
                    icon={Users}
                    color="#8B5CF6"
                    trend="+5%"
                    colors={colors}
                    onPress={() => navigation.navigate('FollowersList')}
                />
                <StatCard
                    title="Total Reviews"
                    value={restaurant?.reviewCount || "0"}
                    icon={TrendingUp}
                    color={colors.success}
                    trend="+18%"
                    colors={colors}
                    onPress={() => navigation.navigate('OwnerReviews')}
                />
            </View>

            <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <View style={styles.sectionHeader}>
                    <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Top Performance</Text>
                    <BarChart3 color={colors.primary} size={20} />
                </View>

                <View style={styles.chartPlaceholder}>
                    {isLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        (analytics?.viewsOverTime || [80, 45, 95, 60, 75, 50, 85]).map((dp, i) => {
                            const val = typeof dp === 'number' ? dp : dp.value;
                            const label = typeof dp === 'number' ? `D${i+1}` : dp.label;
                            return (
                                <View key={i} style={styles.chartColumn}>
                                    <View style={[styles.chartBar, { height: Math.min(val, 100), backgroundColor: colors.primary }]} />
                                    <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{label}</Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Business Operations</Text>

                    <TouchableOpacity
                        style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => navigation.navigate('MenuManagement')}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.secondary + '10' }]}>
                                <Menu color={colors.secondary} size={20} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Manage Menu</Text>
                        </View>
                        <ChevronRight color={colors.gray} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => navigation.navigate('ImageGallery')}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#10B981' + '20' }]}>
                                <Image color="#10B981" size={20} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Photo Gallery</Text>
                        </View>
                        <ChevronRight color={colors.gray} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => navigation.navigate('OwnerReviews')}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.secondary + '15' }]}>
                                <Star color={colors.secondary} size={20} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Manage Reviews</Text>
                        </View>
                        <ChevronRight color={colors.gray} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => navigation.navigate('OwnerStories')}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#FF005015' }]}>
                                <Smartphone color="#FF0050" size={20} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Manage Stories</Text>
                        </View>
                        <ChevronRight color={colors.gray} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionItem, { borderBottomWidth: 0 }]}
                        onPress={() => navigation.navigate('OwnerContent')}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                                <LayoutDashboard color={colors.primary} size={20} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Content Hub</Text>
                        </View>
                        <ChevronRight color={colors.gray} size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.bottomSpace} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    subtitle: {
        ...TYPOGRAPHY.bodyLarge,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        width: (width - 50) / 2,
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
        ...SHADOWS.light,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trend: {
        fontSize: 10,
        fontWeight: '700',
    },
    statValue: {
        ...TYPOGRAPHY.h2,
        marginBottom: 4,
    },
    statTitle: {
        ...TYPOGRAPHY.bodySmall,
    },
    section: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        ...SHADOWS.light,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chartPlaceholder: {
        height: 120,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    chartColumn: {
        alignItems: 'center',
        gap: 8,
    },
    chartBar: {
        width: 12,
        borderRadius: 6,
    },
    chartLabel: {
        fontSize: 8,
    },
    actionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionText: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '600',
    },
    bottomSpace: {
        height: 110,
    },
});

export default OwnerDashboard;
