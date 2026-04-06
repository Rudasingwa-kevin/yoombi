import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Image } from 'react-native';
import { ChevronLeft, Star, MessageCircle, Reply, Filter, Search, MoreVertical } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';
import { ReviewDTO } from '../types/dto';
import { reviewService } from '../services/api';

const OwnerReviewsScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { currentRestaurant } = useRestaurant();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [reviews, setReviews] = useState<ReviewDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [replyingTo, setReplyingTo] = useState<ReviewDTO | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReviews = async (pageNum: number = 1, isRefresh: boolean = false) => {
        if (!currentRestaurant) return;
        
        try {
            if (pageNum === 1) setIsLoading(true);
            const response = await reviewService.getForRestaurant(currentRestaurant.id, pageNum);
            
            if (isRefresh || pageNum === 1) {
                setReviews(response.data);
            } else {
                setReviews(prev => [...prev, ...response.data]);
            }
            
            setHasMore(response.meta.page < response.meta.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('[OwnerReviewsScreen] Failed to fetch reviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async () => {
        if (!replyingTo || !replyText.trim()) return;
        
        setIsSubmitting(true);
        try {
            await reviewService.reply(replyingTo.id, replyText);
            // Refresh reviews to show the new reply
            fetchReviews(1, true);
            setReplyingTo(null);
            setReplyText('');
        } catch (error) {
            console.error('[OwnerReviewsScreen] Failed to submit reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    React.useEffect(() => {
        if (currentRestaurant) {
            fetchReviews(1, true);
        }
    }, [currentRestaurant?.id]);

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            fetchReviews(page + 1);
        }
    };

    // Filter reviews based on search and rating
    const filteredReviews = reviews.filter(review => {
        const matchesSearch = review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.userName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRating = filterRating ? review.rating === filterRating : true;
        return matchesSearch && matchesRating;
    });

    const renderReviewItem = ({ item }: { item: ReviewDTO }) => (
        <View style={[styles.reviewCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
            <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '10' }]}>
                        {item.userAvatar ? (
                            <Image source={{ uri: item.userAvatar }} style={styles.reviewAvatarImage} />
                        ) : (
                            <Text style={[styles.avatarText, { color: colors.primary }]}>{item.userName.charAt(0)}</Text>
                        )}
                    </View>
                    <View>
                        <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
                        <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={[styles.ratingBadge, { backgroundColor: colors.secondary + '10' }]}>
                    <Star size={14} color={colors.secondary} fill={colors.secondary} />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{item.rating}</Text>
                </View>
            </View>

            <Text style={[styles.comment, { color: colors.text }]}>{item.comment}</Text>

            {item.ownerReply && (
                <View style={[styles.replyContainer, { backgroundColor: colors.background, borderColor: colors.secondary + '30' }]}>
                    <View style={styles.replyHeader}>
                        <Reply size={14} color={colors.secondary} />
                        <Text style={[styles.replyTitle, { color: colors.secondary }]}>Your Response</Text>
                        {item.repliedAt && (
                            <Text style={[styles.replyDate, { color: colors.textSecondary }]}>
                                {new Date(item.repliedAt).toLocaleDateString()}
                            </Text>
                        ) || null}
                    </View>
                    <Text style={[styles.replyText, { color: colors.text }]}>{item.ownerReply}</Text>
                </View>
            )}

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                        setReplyingTo(item);
                        setReplyText(item.ownerReply || '');
                    }}
                >
                    <MessageCircle size={18} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>
                        {item.ownerReply ? 'Edit Reply' : 'Reply'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <MoreVertical size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Manage Reviews</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchSection}>
                <View style={[styles.searchBar, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Search color={colors.textSecondary} size={20} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search reviews..."
                        placeholderTextColor={colors.textSecondary + '70'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]}>
                    <Filter color={isDark ? colors.secondary : colors.white} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
                <TouchableOpacity
                    style={[styles.ratingChip, filterRating === null && { backgroundColor: colors.secondary }]}
                    onPress={() => setFilterRating(null)}
                >
                    <Text style={[styles.chipText, filterRating === null && { color: isDark ? colors.primary : colors.white }]}>All</Text>
                </TouchableOpacity>
                {[5, 4, 3, 2, 1].map(rating => (
                    <TouchableOpacity
                        key={rating}
                        style={[styles.ratingChip, filterRating === rating && { backgroundColor: colors.secondary }]}
                        onPress={() => setFilterRating(rating)}
                    >
                        <Star size={12} color={filterRating === rating ? (isDark ? colors.primary : colors.white) : colors.textSecondary} fill={filterRating === rating ? (isDark ? colors.primary : colors.white) : 'transparent'} />
                        <Text style={[styles.chipText, filterRating === rating && { color: isDark ? colors.primary : colors.white }]}>{rating}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filteredReviews}
                renderItem={renderReviewItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshing={isLoading && page === 1}
                onRefresh={() => fetchReviews(1, true)}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {isLoading ? (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading reviews...</Text>
                        ) : (
                            <>
                                <MessageCircle size={64} color={colors.textSecondary + '30'} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reviews found</Text>
                            </>
                        )}
                    </View>
                }
            />

            {/* Reply Modal */}
            {replyingTo && (
                <View style={StyleSheet.absoluteFill}>
                    <TouchableOpacity 
                        style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} 
                        onPress={() => setReplyingTo(null)} 
                    />
                    <View style={[styles.replyModal, { backgroundColor: colors.white }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {replyingTo.ownerReply ? 'Edit Reply' : 'Reply to ' + replyingTo.userName}
                            </Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                <MoreVertical size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={[styles.originalReview, { backgroundColor: colors.background }]}>
                            <Text style={[styles.originalReviewText, { color: colors.textSecondary }]} numberOfLines={3}>
                                "{replyingTo.comment}"
                            </Text>
                        </View>

                        <TextInput
                            style={[styles.replyInput, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Type your response..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={replyText}
                            onChangeText={setReplyText}
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.cancelButton, { borderColor: colors.border }]} 
                                onPress={() => setReplyingTo(null)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.submitButton, { backgroundColor: colors.primary }]} 
                                onPress={handleReply}
                                disabled={isSubmitting || !replyText.trim()}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color={isDark ? colors.secondary : 'white'} />
                                ) : (
                                    <Text style={[styles.submitButtonText, { color: isDark ? colors.secondary : 'white' }]}>
                                        {replyingTo.ownerReply ? 'Update' : 'Send Reply'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 15,
        gap: 10,
        ...SHADOWS.light,
    },
    searchInput: {
        flex: 1,
        ...TYPOGRAPHY.bodyMedium,
    },
    filterButton: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    filtersContainer: {
        maxHeight: 40,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    ratingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        gap: 4,
    },
    chipText: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    reviewCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        ...SHADOWS.light,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    reviewAvatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    userName: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '700',
    },
    reviewDate: {
        fontSize: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
    },
    comment: {
        ...TYPOGRAPHY.bodyMedium,
        lineHeight: 22,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionText: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        ...TYPOGRAPHY.bodyLarge,
        fontWeight: '600',
    },
    replyContainer: {
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    replyTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    replyDate: {
        fontSize: 10,
        marginLeft: 'auto',
    },
    replyText: {
        fontSize: 13,
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
    },
    replyModal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        ...SHADOWS.heavy,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    originalReview: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    originalReviewText: {
        fontSize: 13,
        fontStyle: 'italic',
    },
    replyInput: {
        height: 120,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        textAlignVertical: 'top',
        fontSize: 14,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelButtonText: {
        fontWeight: '700',
    },
    submitButton: {
        flex: 2,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        fontWeight: '700',
    },
});

export default OwnerReviewsScreen;
