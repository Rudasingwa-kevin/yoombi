import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Star, ThumbsUp, MessageSquare, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { authService } from '../services/api';
import { MyReviewDTO } from '../types/dto';

const ReviewCard = ({ review }: { review: MyReviewDTO }) => {
    const { colors } = useTheme();

    const formattedDate = new Date(review.createdAt).toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
        <View style={[styles.card, { backgroundColor: colors.white }]}>
            <View style={styles.cardHeader}>
                <Image source={{ uri: review.restaurantImage }} style={styles.restaurantThumb} />
                <View style={styles.headerInfo}>
                    <Text style={[styles.restaurantName, { color: colors.text }]}>{review.restaurantName}</Text>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formattedDate}</Text>
                </View>
                <TouchableOpacity>
                    <MoreVertical size={20} color={colors.gray} />
                </TouchableOpacity>
            </View>

            <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        color={star <= review.rating ? colors.star : colors.gray}
                        fill={star <= review.rating ? colors.star : 'transparent'}
                    />
                ))}
            </View>

            <Text style={[styles.commentText, { color: colors.text }]}>{review.comment}</Text>
            
            {review.ownerReply && (
                <View style={[styles.ownerReplyBox, { backgroundColor: colors.background }]}>
                    <Text style={[styles.ownerReplyTitle, { color: colors.primary }]}>Reply from Owner</Text>
                    <Text style={[styles.ownerReplyText, { color: colors.text }]}>{review.ownerReply}</Text>
                </View>
            )}

            <View style={[styles.footer, { borderTopColor: colors.gray + '30' }]}>
                <View style={styles.statItem}>
                    <ThumbsUp size={16} color={colors.secondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>0 Helpful</Text>
                </View>
                <View style={styles.statItem}>
                    <MessageSquare size={16} color={colors.primary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>{review.replies} Replies</Text>
                </View>
            </View>
        </View>
    );
};

const MyReviewsScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [reviews, setReviews] = useState<MyReviewDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const data = await authService.getMyReviews();
            setReviews(data || []);
        } catch (error) {
            console.error('Failed to load user reviews', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchReviews();
        }, [])
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: colors.white }]}
                >
                    <ChevronLeft color={colors.primary} size={24} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>My Contributions</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.statsOverview}>
                <View style={[styles.statBox, { backgroundColor: colors.white }]}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>{reviews.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.white }]}>
                    <Text style={[styles.statNumber, { color: colors.secondary }]}>0</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Helpful</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.white }]}>
                    <Text style={[styles.statNumber, { color: '#0EA5E9' }]}>0</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Photos</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : reviews.length > 0 ? (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ReviewCard review={item} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        <Text style={[styles.listTitle, { color: colors.gray }]}>Past Reviews</Text>
                    )}
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You haven't written any reviews yet.</Text>
                </View>
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
    statsOverview: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    statNumber: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    listTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', marginBottom: 16, marginLeft: 4, textTransform: 'uppercase' },
    card: {
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        ...SHADOWS.light,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    restaurantThumb: { width: 44, height: 44, borderRadius: 12 },
    headerInfo: { flex: 1, marginLeft: 12 },
    restaurantName: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700', marginBottom: 2 },
    dateText: { fontSize: 11, fontWeight: '500' },
    ratingRow: { flexDirection: 'row', gap: 4, marginBottom: 12 },
    commentText: { ...TYPOGRAPHY.bodyMedium, lineHeight: 20, marginBottom: 16 },
    photoRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    reviewPhoto: { width: 80, height: 80, borderRadius: 12 },
    footer: {
        flexDirection: 'row',
        paddingTop: 12,
        borderTopWidth: 1,
        gap: 20,
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 12, fontWeight: '600' },
    ownerReplyBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    ownerReplyTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    ownerReplyText: {
        fontSize: 14,
        lineHeight: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default MyReviewsScreen;
