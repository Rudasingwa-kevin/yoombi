import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ChevronLeft, MapPin, Calendar, Star, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { TYPOGRAPHY, SHADOWS } from '../constants/theme';
import api from '../services/api';

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

const ExperienceScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchVisits = useCallback(async () => {
        try {
            const data = await api.get<Visit[]>('/loyalty/visits');
            setVisits(data);
        } catch (error) {
            console.error('[Experiences] Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchVisits();
    }, [fetchVisits]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchVisits();
    };

    const renderVisit = ({ item }: { item: Visit }) => (
        <TouchableOpacity 
            style={[styles.visitCard, { backgroundColor: colors.white }]}
            onPress={() => navigation.navigate('RestaurantDetail', { id: item.restaurantId })}
        >
            <View style={[styles.iconBox, { backgroundColor: colors.secondary + '20' }]}>
                <MapPin color={colors.secondary} size={22} />
            </View>
            <View style={styles.visitInfo}>
                <Text style={[styles.restaurantName, { color: colors.text }]}>{item.restaurant.name}</Text>
                <View style={styles.visitMeta}>
                    <Calendar color={colors.gray} size={12} />
                    <Text style={[styles.visitDate, { color: colors.textSecondary }]}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                </View>
                <Text style={[styles.visitArea, { color: colors.gray }]}>{item.restaurant.area} • {item.restaurant.cuisine}</Text>
            </View>
            <View style={styles.pointsContainer}>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { color: isDark ? colors.secondary : 'white' }]}>+{item.pointsEarned}</Text>
                </View>
                <Text style={[styles.ptsText, { color: colors.primary }]}>PTS</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.primary} size={24} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Dining Experiences</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : visits.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.gray + '10' }]}>
                        <Star color={colors.gray} size={40} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No experiences recorded</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        Your dining history will appear here once you verify your visits at restaurants.
                    </Text>
                    <TouchableOpacity 
                        style={[styles.exploreButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('MainUserAuth', { screen: 'Discover' })}
                    >
                        <Text style={[styles.exploreText, { color: isDark ? colors.secondary : 'white' }]}>Discover Restaurants</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={visits}
                    keyExtractor={(item) => item.id}
                    renderItem={renderVisit}
                    contentContainerStyle={styles.listContent}
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
        backgroundColor: 'rgba(0,0,0,0.02)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 40 },
    visitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        ...SHADOWS.light,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visitInfo: { flex: 1, marginLeft: 16 },
    restaurantName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    visitMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    visitDate: { fontSize: 12, fontWeight: '500' },
    visitArea: { fontSize: 12 },
    pointsContainer: { alignItems: 'center', gap: 4 },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: { fontSize: 12, fontWeight: '800' },
    ptsText: { fontSize: 10, fontWeight: '700', opacity: 0.6 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', opacity: 0.6, lineHeight: 20, marginBottom: 32 },
    exploreButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
    exploreText: { fontWeight: '700' },
});

export default ExperienceScreen;
