import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Star, MapPin, Calendar, Clock, Filter, MessageSquare, ThumbsUp } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { TYPOGRAPHY, SHADOWS } from '../constants/theme';
import api, { authService } from '../services/api';
import { MyReviewDTO } from '../types/dto';

interface Visit {
    id: string;
    restaurantId: string;
    pointsEarned: number;
    createdAt: string;
    restaurant: {
        name: string;
        area: string;
        cuisine: string;
        images: string[];
    };
}

type ActivityType = 'VISIT' | 'REVIEW';

interface ActivityItem {
    id: string;
    type: ActivityType;
    date: Date;
    restaurantName: string;
    restaurantId: string;
    restaurantImage?: string;
    // Visit specific
    pointsEarned?: number;
    area?: string;
    cuisine?: string;
    // Review specific
    rating?: number;
    comment?: string;
    ownerReply?: string;
    replies?: number;
}

const ActivityCard = ({ item, navigation }: { item: ActivityItem, navigation: any }) => {
    const { colors, isDark } = useTheme();

    const formattedDate = item.date.toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.white }]}
            onPress={() => navigation.navigate('RestaurantDetail', { id: item.restaurantId })}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'VISIT' ? colors.primary + '20' : colors.secondary + '20' }]}>
                    {item.type === 'VISIT' ? (
                        <MapPin size={12} color={colors.primary} />
                    ) : (
                        <Star size={12} color={colors.secondary} />
                    )}
                    <Text style={[styles.typeText, { color: item.type === 'VISIT' ? colors.primary : colors.secondary }]}>
                        {item.type === 'VISIT' ? 'VISIT' : 'REVIEW'}
                    </Text>
                </View>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formattedDate}</Text>
            </View>

            <View style={styles.restaurantRow}>
                {item.restaurantImage ? (
                    <Image source={{ uri: item.restaurantImage }} style={styles.restaurantThumb} />
                ) : (
                    <View style={[styles.restaurantThumb, { backgroundColor: colors.gray + '20', justifyContent: 'center', alignItems: 'center' }]}>
                        <MapPin size={20} color={colors.gray} />
                    </View>
                )}
                <View style={styles.restaurantInfo}>
                    <Text style={[styles.restaurantName, { color: colors.text }]}>{item.restaurantName}</Text>
                    {item.type === 'VISIT' && (
                        <Text style={[styles.subText, { color: colors.gray }]}>{item.area} • {item.cuisine}</Text>
                    )}
                </View>
                
                {item.type === 'VISIT' ? (
                    <View style={styles.pointsContainer}>
                        <View style={[styles.ptsBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.ptsValue, { color: isDark ? colors.secondary : 'white' }]}>+{item.pointsEarned}</Text>
                        </View>
                        <Text style={[styles.ptsLabel, { color: colors.primary }]}>PTS</Text>
                    </View>
                ) : (
                    <View style={styles.ratingRow}>
                        <Star size={16} color={colors.star} fill={colors.star} />
                        <Text style={[styles.ratingText, { color: colors.text }]}>{item.rating}</Text>
                    </View>
                )}
            </View>

            {item.type === 'REVIEW' && (
                <View style={styles.reviewContent}>
                    <Text style={[styles.commentText, { color: colors.text }]} numberOfLines={2}>{item.comment}</Text>
                    {item.ownerReply && (
                        <View style={[styles.replyBox, { backgroundColor: colors.background }]}>
                            <View style={styles.replyHeader}>
                                <MessageSquare size={12} color={colors.primary} />
                                <Text style={[styles.replyTitle, { color: colors.primary }]}>Owner Replied</Text>
                            </View>
                            <Text style={[styles.replyText, { color: colors.text }]} numberOfLines={1}>{item.ownerReply}</Text>
                        </View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const MyActivityScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'VISITS' | 'REVIEWS'>('ALL');

    const fetchData = useCallback(async () => {
        try {
            const [visits, reviews] = await Promise.all([
                api.get<Visit[]>('/loyalty/visits').catch(() => []),
                authService.getMyReviews().catch(() => []),
            ]);

            const visitItems: ActivityItem[] = (visits || []).map(v => ({
                id: `visit-${v.id}`,
                type: 'VISIT',
                date: new Date(v.createdAt),
                restaurantName: v.restaurant.name,
                restaurantId: v.restaurantId,
                restaurantImage: v.restaurant.images?.[0],
                pointsEarned: v.pointsEarned,
                area: v.restaurant.area,
                cuisine: v.restaurant.cuisine,
            }));

            const reviewItems: ActivityItem[] = (reviews || []).map(r => ({
                id: `review-${r.id}`,
                type: 'REVIEW',
                date: new Date(r.createdAt),
                restaurantName: r.restaurantName,
                restaurantId: '', // Review DTO might not have restaurantId, but usually it does. 
                // In MyReviewDTO it's missing, but we can potentially get it or just navigate by name if supported.
                // Assuming we might need to adjust API or just use what we have.
                restaurantImage: r.restaurantImage,
                rating: r.rating,
                comment: r.comment,
                ownerReply: r.ownerReply,
                replies: r.replies,
            }));

            const combined = [...visitItems, ...reviewItems].sort((a, b) => b.date.getTime() - a.date.getTime());
            setActivities(combined);
        } catch (error) {
            console.error('[MyActivity] Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredActivities = useMemo(() => {
        if (filter === 'ALL') return activities;
        if (filter === 'VISITS') return activities.filter(a => a.type === 'VISIT');
        if (filter === 'REVIEWS') return activities.filter(a => a.type === 'REVIEW');
        return activities;
    }, [activities, filter]);

    const FilterButton = ({ label, value }: { label: string, value: typeof filter }) => (
        <TouchableOpacity 
            style={[
                styles.filterTab, 
                { backgroundColor: filter === value ? colors.primary : 'transparent' }
            ]}
            onPress={() => setFilter(value)}
        >
            <Text style={[
                styles.filterTabText, 
                { color: filter === value ? (colors.background === '#050B10' ? '#C5A059' : 'white') : colors.textSecondary }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.white }]}>
                    <ChevronLeft color={colors.primary} size={24} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>My Activity</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.filterBar}>
                <FilterButton label="All" value="ALL" />
                <FilterButton label="Visits" value="VISITS" />
                <FilterButton label="Reviews" value="REVIEWS" />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : filteredActivities.length === 0 ? (
                <View style={styles.centerContainer}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.gray + '10' }]}>
                        <Clock color={colors.gray} size={40} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No activity yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        Your visits and reviews will appear here as you explore restaurants.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredActivities}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ActivityCard item={item} navigation={navigation} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                />
            )}
        </View>
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
    filterBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    card: {
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        ...SHADOWS.light,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
    },
    restaurantRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    restaurantThumb: {
        width: 50,
        height: 50,
        borderRadius: 14,
    },
    restaurantInfo: {
        flex: 1,
        marginLeft: 12,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    subText: {
        fontSize: 12,
        fontWeight: '500',
    },
    pointsContainer: {
        alignItems: 'center',
    },
    ptsBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ptsValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    ptsLabel: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: 2,
        opacity: 0.8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '700',
    },
    reviewContent: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    commentText: {
        fontSize: 13,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    replyBox: {
        marginTop: 8,
        padding: 8,
        borderRadius: 12,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    replyTitle: {
        fontSize: 10,
        fontWeight: '800',
    },
    replyText: {
        fontSize: 12,
        lineHeight: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        opacity: 0.7,
    },
});

export default MyActivityScreen;
