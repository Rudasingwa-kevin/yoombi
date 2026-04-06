import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ChevronLeft, MessageSquare, Trash2, ShieldCheck, Flag, Calendar, User, Store } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { reviewService } from '../services/api';
import { ReviewDTO } from '../types/dto';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AdminReviewModerationScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }
    const [flaggedReviews, setFlaggedReviews] = useState<ReviewDTO[]>([]);

    useEffect(() => {
        // GET /admin/reviews?flagged=true — fetch the first page of flagged reviews
        reviewService.getForRestaurant('all', 1)
            .then(res => {
                const all = res.data || (res as any) || [];
                setFlaggedReviews(all.filter((r: ReviewDTO) => r.isFlagged));
            })
            .catch(e => console.warn('[AdminReviewModeration] Failed to fetch reviews:', e));
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Review',
            'Are you sure you want to permanently delete this review? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            await reviewService.approveFlag(id);
                            setFlaggedReviews(prev => prev.filter(item => item.id !== id));
                        } catch (e) { Alert.alert('Error', 'Failed to delete review.'); }
                    },
                    style: 'destructive'
                },
            ]
        );
    };

    const handleKeep = (id: string) => {
        Alert.alert(
            'Keep Review',
            'This will clear the flagged status and keep the review on the platform.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Keep Review',
                    onPress: async () => {
                        try {
                            await reviewService.dismissFlag(id);
                            setFlaggedReviews(prev => prev.filter(item => item.id !== id));
                        } catch (e) { Alert.alert('Error', 'Failed to dismiss flag.'); }
                    },
                    style: 'default'
                },
            ]
        );
    };

    const renderFlaggedItem = ({ item }: { item: ReviewDTO }) => (
        <View style={[styles.card, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.flagBadge, { backgroundColor: '#EF444420' }]}>
                    <Flag color="#EF4444" size={14} />
                    <Text style={styles.flagText}>Flagged Review</Text>
                </View>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <View style={styles.contentBox}>
                <Text style={[styles.reviewText, { color: colors.text }]}>"{item.comment}"</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <User size={14} color={colors.textSecondary} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>By: <Text style={{ color: colors.text }}>{item.userName}</Text></Text>
                </View>
                <View style={styles.infoItem}>
                    <Store size={14} color={colors.textSecondary} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Restaurant ID: <Text style={{ color: colors.text }}>{item.restaurantId}</Text></Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity 
                    style={[styles.keepBtn, { borderColor: colors.secondary }]} 
                    onPress={() => handleKeep(item.id)}
                >
                    <ShieldCheck color={colors.secondary} size={20} />
                    <Text style={[styles.keepBtnText, { color: colors.secondary }]}>Keep</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.deleteBtn, { backgroundColor: '#EF4444' }]} 
                    onPress={() => handleDelete(item.id)}
                >
                    <Trash2 color="#FFF" size={20} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Review Moderation</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={flaggedReviews}
                keyExtractor={(item) => item.id}
                renderItem={renderFlaggedItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={[styles.statusInfo, { color: colors.textSecondary }]}>
                            {flaggedReviews.length} reported reviews pending action
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MessageSquare size={64} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No flagged reviews found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.light,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    listHeader: {
        marginBottom: 16,
    },
    statusInfo: {
        ...TYPOGRAPHY.bodySmall,
        fontStyle: 'italic',
    },
    card: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        ...SHADOWS.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    flagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    flagText: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '700',
    },
    dateText: {
        fontSize: 11,
    },
    contentBox: {
        marginBottom: 16,
    },
    reviewText: {
        ...TYPOGRAPHY.bodyMedium,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    infoGrid: {
        gap: 8,
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    keepBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    keepBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    deleteBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        ...TYPOGRAPHY.bodyLarge,
        marginTop: 16,
    },
});

export default AdminReviewModerationScreen;
