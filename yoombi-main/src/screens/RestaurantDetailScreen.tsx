import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Animated,
    Share,
    Alert,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ActivityIndicator
} from 'react-native';
import { ChevronLeft, Share2, Heart, Clock, MapPin, Star, UserPlus } from 'lucide-react-native';

import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';
import { restaurantService, menuService, reviewService } from '../services/api';
import { RestaurantDTO, MenuItemDTO, ReviewDTO } from '../types/dto';

const { width } = Dimensions.get('window');

const RestaurantDetailScreen = ({ route, navigation }: any) => {
    const { role } = useAuth();
    const { colors, isDark } = useTheme();
    const { id } = route.params;
    const { 
        isFollowing, 
        followRestaurant, 
        unfollowRestaurant, 
        isLiked,
        likeRestaurant,
        unlikeRestaurant,
        checkIn
    } = useRestaurant();

    // Data state
    const [restaurant, setRestaurant] = useState<RestaurantDTO | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
    const [reviews, setReviews] = useState<ReviewDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // Local state for carousel and interaction
    const [activeIndex, setActiveIndex] = useState(0);
    const [liked, setLiked] = useState(isLiked(id));
    const heartAnim = useRef(new Animated.Value(1)).current;

    // Sync local liked state when context changes
    useEffect(() => {
        setLiked(isLiked(id));
    }, [isLiked(id)]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [restData, menuData, reviewData] = await Promise.all([
                restaurantService.getById(id),
                menuService.getItems(id),
                reviewService.getForRestaurant(id)
            ]);
            setRestaurant(restData);
            setMenuItems(menuData);
            setReviews(reviewData.data || reviewData);
        } catch (error) {
            console.error('[RestaurantDetail] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isFollowed = isFollowing(id);

    const handleFollowToggle = () => {
        if (role === 'GUEST') {
            Alert.alert(
                'Sign In Required',
                'Please sign in to follow restaurants and stay updated!',
                [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign In', onPress: () => {} }]
            );
            return;
        }

        if (isFollowed) {
            unfollowRestaurant(id);
        } else {
            followRestaurant(id);
        }
    };

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
    }, []);

    const handleLike = () => {
        if (role === 'GUEST') {
            Alert.alert(
                'Sign In Required',
                'Please sign in to like restaurants and save them to your profile!',
                [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign In', onPress: () => {} }]
            );
            return;
        }

        if (liked) {
            unlikeRestaurant(id);
            setLiked(false);
        } else {
            likeRestaurant(id);
            setLiked(true);
            heartAnim.setValue(0.8);
            Animated.spring(heartAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleShare = useCallback(async () => {
        if (!restaurant) return;
        try {
            await Share.share({
                title: restaurant.name,
                message: `Check out ${restaurant.name} in ${restaurant.area}, ${restaurant.city}! ⭐ ${restaurant.rating} — ${restaurant.cuisine}. Discover it on Yoombi!`,
            });
        } catch (error) {
            console.error(error);
        }
    }, [restaurant]);

    const renderReview = ({ item }: { item: ReviewDTO }) => (
        <View style={[styles.reviewCard, { backgroundColor: isDark ? colors.background : colors.white }]}>
            <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                        {item.userAvatar ? (
                            <Image source={{ uri: item.userAvatar }} style={styles.reviewAvatarImage} />
                        ) : (
                            <Text style={[styles.avatarText, { color: isDark ? colors.secondary : 'white' }]}>{(item.userName || 'U')[0]}</Text>
                        )}
                    </View>
                    <View>
                        <Text style={[styles.userName, { color: colors.text }]}>{item.userName || 'Anonymous'}</Text>
                        <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                <StarRating rating={item.rating} size={12} />
            </View>
            <Text style={[styles.reviewComment, { color: colors.text }]}>{item.comment}</Text>
        </View>
    );

    if (loading || !restaurant) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const images = restaurant.images && restaurant.images.length > 0
        ? restaurant.images
        : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <FlatList
                        data={images}
                        keyExtractor={(_, i) => String(i)}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item }}
                                style={styles.heroImage}
                                resizeMode="cover"
                            />
                        )}
                    />

                    {images.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {images.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: i === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                                            width: i === activeIndex ? 18 : 6,
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    <View style={styles.navButtons}>
                        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
                            <ChevronLeft color={colors.primary} size={24} />
                        </TouchableOpacity>
                        <View style={styles.rightActions}>
                            <TouchableOpacity
                                style={[
                                    styles.iconCircle,
                                    isFollowed && { backgroundColor: colors.secondary }
                                ]}
                                onPress={handleFollowToggle}
                            >
                                <UserPlus
                                    color={isFollowed ? colors.white : colors.primary}
                                    size={20}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconCircle} onPress={handleShare}>
                                <Share2 color={colors.primary} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconCircle}
                                onPress={handleLike}
                            >
                                <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                                    <Heart
                                        color={liked ? '#FF4D6D' : colors.primary}
                                        size={20}
                                        fill={liked ? '#FF4D6D' : 'none'}
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
                    <View style={styles.titleRow}>
                        <Text style={[TYPOGRAPHY.h1, { color: colors.primary }]}>{restaurant.name}</Text>
                    </View>

                    <View style={styles.ratingRow}>
                        <StarRating rating={restaurant.rating} size={16} />
                        <Text style={[styles.ratingInfo, { color: colors.text }]}>{restaurant.rating} ({restaurant.reviewCount || restaurant.totalReviews || 0} reviews)</Text>
                        <Text style={[styles.cuisineTag, { color: colors.secondary, backgroundColor: colors.primary + '10' }]}>{restaurant.cuisine}</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.gray + '30' }]} />

                    <View style={styles.featureRow}>
                        <View style={styles.featureItem}>
                            <Clock color={colors.secondary} size={20} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>9 AM - 11 PM</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MapPin color={colors.secondary} size={20} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{restaurant.area}, {restaurant.city}</Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>About</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>{restaurant.description}</Text>

                    <TouchableOpacity
                        style={[styles.checkInButton, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary, borderWidth: 1 }]}
                        onPress={async () => {
                            try {
                                await checkIn(id);
                                Alert.alert('Visit Verified! 🎉', 'You earned 50 loyalty points.');
                            } catch (e) {
                                Alert.alert('Verification Failed', 'Please try again later.');
                            }
                        }}
                    >
                        <MapPin color={colors.secondary} size={20} />
                        <Text style={[styles.checkInText, { color: colors.secondary }]}>Verify My Visit (+50 PTS)</Text>
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.gray + '30' }]} />

                    <View style={styles.metricsContainer}>
                        {[
                            { label: 'Food', value: 4.9, fill: '95%' },
                            { label: 'Service', value: 4.7, fill: '90%' },
                            { label: 'Ambiance', value: 4.8, fill: '92%' }
                        ].map((m, i) => (
                            <View key={i} style={styles.metric}>
                                <Text style={[styles.metricLabel, { color: colors.text }]}>{m.label}</Text>
                                <View style={[styles.metricBar, { backgroundColor: colors.gray + '30' }]}>
                                    <View style={[styles.metricFill, { width: m.fill as any, backgroundColor: colors.secondary }]} />
                                </View>
                                <Text style={[styles.metricValue, { color: colors.primary }]}>{m.value}</Text>
                            </View>
                        ))}
                    </View>

                    {menuItems.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Signature Menu</Text>
                            <View style={styles.menuContainer}>
                                {menuItems.slice(0, 3).map((item) => (
                                    <View key={item.id} style={styles.menuItem}>
                                        <View>
                                            <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
                                            <Text style={[styles.menuItemPrice, { color: colors.secondary }]}>{item.price ? `${item.price.toLocaleString()} RWF` : 'Price on inquiry'}</Text>

                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.gray + '30' }]} />
                        </>
                    )}

                    <View style={styles.reviewSection}>
                        <View style={styles.reviewHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Reviews</Text>
                            <TouchableOpacity>
                                <Text style={[styles.seeAll, { color: colors.secondary }]}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {reviews.length > 0 ? (
                            <FlatList
                                data={reviews}
                                renderItem={renderReview}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        ) : (
                            <Text style={[styles.noReviews, { color: colors.textSecondary }]}>No reviews yet. Be the first to rate!</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.fixedBottom, { backgroundColor: colors.background, borderTopColor: colors.gray + '20', borderTopWidth: 1 }]}>
                {role === 'GUEST' ? (
                    <TouchableOpacity
                        style={[styles.rateButton, { backgroundColor: colors.secondary }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={[styles.rateButtonText, { color: colors.primary }]}>Sign in to Rate & Review</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.rateButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Review', { restaurantId: restaurant.id, restaurantName: restaurant.name })}
                    >
                        <Text style={[styles.rateButtonText, { color: isDark ? colors.secondary : 'white' }]}>Share Your Experience</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    imageContainer: { height: 350, width: '100%' },
    heroImage: { width: width, height: 350 },
    dotsContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    navButtons: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rightActions: { flexDirection: 'row', gap: 12 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', ...SHADOWS.light },
    detailsContainer: { padding: 24, marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32, minHeight: 500 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    priceTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    priceText: { fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
    ratingInfo: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600' },
    cuisineTag: { ...TYPOGRAPHY.bodySmall, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
    divider: { height: 1, marginVertical: 20 },
    featureRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    featureText: { ...TYPOGRAPHY.bodyMedium },
    sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: 12 },
    description: { ...TYPOGRAPHY.bodyMedium, lineHeight: 22, marginBottom: 10 },
    metricsContainer: { gap: 12, marginBottom: 24 },
    metric: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    metricLabel: { width: 70, ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
    metricBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    metricFill: { height: '100%' },
    metricValue: { width: 30, ...TYPOGRAPHY.bodySmall, fontWeight: '700', textAlign: 'right' },
    menuContainer: { gap: 12, marginBottom: 24 },
    menuItem: { padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.05)' },
    menuItemName: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
    menuItemPrice: { fontWeight: '800', fontSize: 13 },
    reviewSection: { paddingBottom: 100 },
    reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    seeAll: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
    reviewCard: { marginBottom: 20, padding: 16, borderRadius: 16, ...SHADOWS.light },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontWeight: 'bold' },
    reviewAvatarImage: { width: '100%', height: '100%', borderRadius: 18 },
    userName: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600' },
    reviewDate: { fontSize: 10 },
    reviewComment: { ...TYPOGRAPHY.bodySmall, lineHeight: 18 },
    noReviews: { ...TYPOGRAPHY.bodySmall, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
    checkInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 8,
        marginTop: 16,
        marginBottom: 8,
    },
    checkInText: {
        fontWeight: '800',
        fontSize: 15,
    },
    fixedBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 32, ...SHADOWS.heavy },
    rateButton: { padding: 18, borderRadius: 16, alignItems: 'center' },
    rateButtonText: { fontSize: 16, fontWeight: '700' },
});

export default RestaurantDetailScreen;
