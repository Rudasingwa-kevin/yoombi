import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Share,
    Alert,
    Animated,
} from 'react-native';
import { MapPin, Heart, Share2 } from 'lucide-react-native';
import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import StarRating from './StarRating';
import { RestaurantDTO } from '../types/dto';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

interface RestaurantCardProps {
    restaurant: RestaurantDTO;
    onPress?: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress }) => {
    const { colors } = useTheme();
    const { isFollowing, followRestaurant, unfollowRestaurant, addPoints } = useRestaurant();
    const [activeIndex, setActiveIndex] = useState(0);
    const isFollowed = isFollowing(restaurant.id);
    const [likeCount, setLikeCount] = useState(restaurant.followers ?? 0);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const flatListRef = useRef<FlatList>(null);

    const images = restaurant.images && restaurant.images.length > 0
        ? restaurant.images
        : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop'];

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
        setActiveIndex(index);
    }, []);

    const handleFollow = useCallback(() => {
        // Bounce animation
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }),
        ]).start();

        if (isFollowed) {
            unfollowRestaurant(restaurant.id);
            setLikeCount(c => c - 1);
        } else {
            followRestaurant(restaurant.id);
            setLikeCount(c => c + 1);
        }
    }, [scaleAnim, isFollowed, restaurant.id]);

    const handleShare = useCallback(async () => {
        try {
            await Share.share({
                title: restaurant.name,
                message: `Check out ${restaurant.name} in ${restaurant.area}, ${restaurant.city}! ⭐ ${restaurant.rating} (${restaurant.reviewCount} reviews) — ${restaurant.cuisine}. Discover it on Yoombi!`,
            });
            addPoints(2);
        } catch {
            Alert.alert('Share failed', 'Unable to share right now.');
        }
    }, [restaurant]);

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.white, shadowColor: colors.shadow }]}
            onPress={onPress}
            activeOpacity={0.95}
        >
            {/* ── Photo Carousel ── */}
            <View style={styles.imageWrapper}>
                <FlatList
                    ref={flatListRef}
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
                            style={[styles.image, { backgroundColor: colors.gray }]}
                            resizeMode="cover"
                        />
                    )}
                />

                {/* Dot indicators */}
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

                {/* Photo count badge */}
                {images.length > 1 && (
                    <View style={styles.photoBadge}>
                        <Text style={styles.photoBadgeText}>{activeIndex + 1}/{images.length}</Text>
                    </View>
                )}

                {/* Emerald badge */}
                {restaurant.rating >= 4.8 && (
                    <View style={[styles.emeraldBadge, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.emeraldBadgeText}>Emerald Exclusive</Text>
                    </View>
                )}
            </View>

            {/* ── Card Content ── */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.name, { color: colors.primary }]} numberOfLines={1}>
                        {restaurant.name}
                    </Text>
                </View>

                <View style={styles.locationContainer}>
                    <MapPin size={13} color={colors.secondary} />
                    <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                        {restaurant.area}, {restaurant.city}
                    </Text>
                    <View style={[styles.cuisinePill, { backgroundColor: colors.primary + '12' }]}>
                        <Text style={[styles.cuisineText, { color: colors.primary }]}>
                            {restaurant.cuisine.split(' / ')[0]}
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.ratingRow}>
                        <StarRating rating={restaurant.rating} size={13} />
                        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                            {restaurant.rating} ({restaurant.reviewCount})
                        </Text>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actions}>
                        {/* Share */}
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.primary + '10' }]}
                            onPress={handleShare}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Share2 size={15} color={colors.primary} />
                        </TouchableOpacity>

                        {/* Follow */}
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                { backgroundColor: isFollowed ? '#FF4D6D20' : colors.primary + '10' },
                            ]}
                            onPress={handleFollow}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <Heart
                                    size={15}
                                    color={isFollowed ? '#FF4D6D' : colors.primary}
                                    fill={isFollowed ? '#FF4D6D' : 'none'}
                                />
                            </Animated.View>
                            <Text
                                style={[
                                    styles.likeCount,
                                    { color: isFollowed ? '#FF4D6D' : colors.textSecondary },
                                ]}
                            >
                                {likeCount}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: SIZES.radius_lg,
        marginBottom: 20,
        width: CARD_WIDTH,
        overflow: 'hidden',
        ...SHADOWS.medium,
        alignSelf: 'center',
    },
    imageWrapper: {
        position: 'relative',
        height: 200,
        width: CARD_WIDTH,
    },
    image: {
        width: CARD_WIDTH,
        height: 200,
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    photoBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    photoBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    content: {
        padding: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        ...TYPOGRAPHY.h3,
        flex: 1,
        marginRight: 8,
        fontSize: 16,
    },
    price: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '700',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 4,
        flexWrap: 'wrap',
    },
    locationText: {
        ...TYPOGRAPHY.bodySmall,
        flex: 1,
    },
    cuisinePill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    cuisineText: {
        fontSize: 10,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingText: {
        ...TYPOGRAPHY.bodySmall,
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    likeCount: {
        fontSize: 12,
        fontWeight: '600',
    },
    emeraldBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        ...SHADOWS.small,
    },
    emeraldBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});

export default RestaurantCard;
