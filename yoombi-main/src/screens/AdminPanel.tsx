import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { ShieldCheck, Users, Store, AlertCircle, ChevronRight, Search, Database, Layout, MessageSquare, Smartphone, TrendingUp, ShieldAlert, Megaphone, History, Activity } from 'lucide-react-native';

import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';

const AdminPanel = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<{
        totalUsers: number;
        approvedPartners: number;
        pendingPartners: number;
        openTickets: number;
        activities: Array<{ id: string; user: string; action: string; time: string }>;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const statsData = await analyticsService.getAdminStats();
                setStats(statsData);
            } catch (e) {
                console.warn('[AdminPanel] Failed to fetch stats:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (!isAdmin) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }

    const ADMIN_STATS = [
        { id: '1', label: 'Total Users', value: stats?.totalUsers.toString() || '0', icon: Users, color: '#3B82F6' },
        { id: '2', label: 'Partners', value: stats?.approvedPartners.toString() || '0', icon: Store, color: colors.secondary },
        { id: '3', label: 'Support Items', value: stats?.openTickets.toString() || '0', icon: MessageSquare, color: '#F59E0B' },
    ];

    const RECENT_ACTIVITIES = stats?.activities || [];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Text style={[TYPOGRAPHY.h1, { color: colors.primary }]}>System Admin</Text>
                    <ShieldCheck color={colors.secondary} size={28} />
                </View>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Platform-wide management</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBarWrapper, { backgroundColor: colors.white }]}>
                    <Search color={colors.gray} size={20} />
                    <TextInput
                        placeholder="Quick search modules..."
                        placeholderTextColor={colors.gray}
                        style={[styles.searchInput, { color: colors.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.statsRow}>
                {ADMIN_STATS.map((stat) => (
                    <View key={stat.id} style={[styles.statBox, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                        <stat.icon color={stat.color} size={24} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Management</Text>

                <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminUserManagement')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#3B82F610' }]}>
                            <Users color="#3B82F6" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>User Management</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminRestaurantModeration')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '10' }]}>
                            <Store color={colors.secondary} size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Restaurant Applications</Text>
                    </View>
                    {(stats?.pendingPartners ?? 0) > 0 && (
                        <View style={styles.badge}>
                            <Text style={[styles.badgeText, { color: colors.white }]}>{stats?.pendingPartners}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminReviewModeration')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#EF444410' }]}>
                            <AlertCircle color="#EF4444" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Review Moderation</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminSupport')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#F59E0B10' }]}>
                            <MessageSquare color="#F59E0B" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Support Inbox</Text>
                    </View>
                    {(stats?.openTickets ?? 0) > 0 && (
                        <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                            <Text style={[styles.badgeText, { color: colors.white }]}>{stats?.openTickets}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminAnalytics')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#10B98110' }]}>
                            <TrendingUp color="#10B981" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Platform Insights</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomWidth: 0 }]}
                    onPress={() => navigation.navigate('AdminEmergency')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#EF444410' }]}>
                            <ShieldAlert color="#EF4444" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Emergency Controls</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>System & Operations</Text>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminAuditLogs')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#6366F110' }]}>
                            <History color="#6366F1" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Audit Logs</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomWidth: 0 }]}
                    onPress={() => navigation.navigate('AdminSystemHealth')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#10B98110' }]}>
                            <Activity color="#10B981" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>System Health</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Growth & Content</Text>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminCMS')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '10' }]}>
                            <Layout color={colors.secondary} size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Homepage CMS</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminStories')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FF005010' }]}>
                            <Smartphone color="#FF0050" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Stories Manager</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => navigation.navigate('AdminDatabase')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#64748B10' }]}>
                            <Database color="#64748B" size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Database Explorer</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomWidth: 0 }]}
                    onPress={() => navigation.navigate('AdminBroadcast')}
                >
                    <View style={styles.menuLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '10' }]}>
                            <Megaphone color={colors.secondary} size={20} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Send Broadcast</Text>
                    </View>
                    <ChevronRight color={colors.gray} size={20} />
                </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Recent Activity</Text>
                {RECENT_ACTIVITIES.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                        <View style={[styles.activityDot, { backgroundColor: colors.secondary }]} />
                        <View style={styles.activityContent}>
                            <Text style={[styles.activityUser, { color: colors.primary }]}>{activity.user}</Text>
                            <Text style={[styles.activityAction, { color: colors.textSecondary }]}>{activity.action}</Text>
                        </View>
                        <Text style={[styles.activityTime, { color: colors.gray }]}>{activity.time}</Text>
                    </View>
                ))}
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
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subtitle: {
        ...TYPOGRAPHY.bodyLarge,
        marginTop: 4,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        ...SHADOWS.light,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    statValue: {
        ...TYPOGRAPHY.h3,
        marginTop: 8,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        textAlign: 'center',
    },
    section: {
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 24,
        marginBottom: 20,
        ...SHADOWS.light,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: '#EF4444',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityUser: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '700',
    },
    activityAction: {
        ...TYPOGRAPHY.bodySmall,
    },
    activityTime: {
        fontSize: 10,
    },
    bottomSpace: {
        height: 110,
    },
});

export default AdminPanel;
