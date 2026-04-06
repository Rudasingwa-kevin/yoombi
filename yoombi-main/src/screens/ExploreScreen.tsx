import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator, Image, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Crosshair, Navigation, X, MapPin, ChevronRight, User as UserIcon, LogIn } from 'lucide-react-native';

import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { restaurantService } from '../services/api';
import { RestaurantDTO } from '../types/dto';
import AuthRequirementModal from '../components/AuthRequirementModal';

const { width, height } = Dimensions.get('window');

const ExploreScreen = ({ navigation }: any) => {
    const { user, role } = useAuth();
    const { colors, isDark } = useTheme();
    const isGuest = role === 'GUEST';
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [loading, setLoading] = useState(true);
    const [restaurants, setRestaurants] = useState<RestaurantDTO[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDTO | null>(null);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

    const initialRegion = {
        latitude: -1.9441,
        longitude: 30.0619,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    const fetchRestaurants = async () => {
        try {
            const response = await restaurantService.getAll();
            setRestaurants(Array.isArray(response) ? response : (response as any).data || []);
        } catch (error) {
            console.error('[Explore] Fetch error:', error);
        }
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                await fetchRestaurants();
                setLoading(false);
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
            await fetchRestaurants();
            setLoading(false);
        })();
    }, []);

    const handleNearMe = async () => {
        setLoading(true);
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        await fetchRestaurants();
        setLoading(false);
    };

    const handleRestaurantPress = (restaurant: RestaurantDTO) => {
        if (isGuest) {
            setIsAuthModalVisible(true);
            return;
        }
        setSelectedRestaurant(restaurant);
    };

    const handleViewDetails = () => {
        // This check is redundant if we block setting selectedRestaurant, but good for safety if logic changes
        if (isGuest) {
            setIsAuthModalVisible(true);
            return;
        }
        if (selectedRestaurant) {
            navigation.navigate('RestaurantDetail', { id: selectedRestaurant.id });
        }
    };


    if (loading && !location) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.secondary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={initialRegion}
                region={location ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                } : undefined}
                onPress={() => setSelectedRestaurant(null)}
                userInterfaceStyle={isDark ? 'dark' : 'light'}
            >
                {restaurants.map((restaurant) => (
                    <Marker
                        key={restaurant.id}
                        coordinate={{
                            latitude: restaurant.latitude,
                            longitude: restaurant.longitude,
                        }}
                        title={restaurant.name}
                        pinColor={colors.secondary}
                        onPress={() => handleRestaurantPress(restaurant)}
                    />
                ))}
            </MapView>

            {selectedRestaurant && (
                <View style={styles.cardContainer}>
                    <TouchableOpacity
                        style={[styles.restaurantCard, { backgroundColor: colors.white, borderBottomWidth: 0 }]}
                        onPress={handleViewDetails}
                        activeOpacity={0.9}
                    >
                        <Image
                            source={{ uri: selectedRestaurant.images?.[0] || 'https://via.placeholder.com/300' }}
                            style={[styles.cardImage, { backgroundColor: colors.background }]}
                        />
                        <View style={styles.cardInfo}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={1}>{selectedRestaurant.name}</Text>
                                <TouchableOpacity onPress={() => setSelectedRestaurant(null)} style={styles.closeButton}>
                                    <X size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cardRatingRow}>
                                <StarRating rating={selectedRestaurant.rating} size={14} />
                                <Text style={[styles.cardReviewCount, { color: colors.textSecondary }]}>({selectedRestaurant.reviewCount || selectedRestaurant.totalReviews || 0} reviews)</Text>
                            </View>

                            <Text style={[styles.cardCuisine, { color: colors.secondary }]}>{selectedRestaurant.cuisine}</Text>

                            <View style={styles.cardLocationBox}>
                                <MapPin size={12} color={colors.secondary} />
                                <Text style={[styles.cardLocationText, { color: colors.textSecondary }]}>{selectedRestaurant.area}, {selectedRestaurant.city}</Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={[styles.viewDetailsBtn, { backgroundColor: colors.primary }]}>
                                    <Text style={[styles.viewDetailsText, { color: isDark ? colors.secondary : 'white' }]}>View Details</Text>
                                    <ChevronRight size={14} color={isDark ? colors.secondary : 'white'} />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={[styles.nearMeButton, { backgroundColor: colors.secondary }]} onPress={handleNearMe}>
                <Crosshair color={colors.primary} size={24} />
            </TouchableOpacity>

            <View style={[styles.header, { backgroundColor: isDark ? colors.white : 'rgba(255, 255, 255, 0.95)' }]}>
                <View style={styles.headerLeft}>
                    <Text style={[TYPOGRAPHY.h2, { color: colors.primary, fontSize: 18 }]}>Map Discovery</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Fine dining across Rwanda</Text>
                </View>

                <TouchableOpacity
                    style={[styles.profileBadge, { backgroundColor: colors.primary }]}
                    onPress={() => isGuest ? navigation.navigate('Login') : navigation.navigate('Profile')}
                >
                    <Text style={[styles.greetingText, { color: isDark ? colors.secondary : 'white' }]}>
                        {isGuest ? 'Hello, Guest' : `Hello, ${user?.name.split(' ')[0]}`}
                    </Text>
                    <View style={[styles.badgeCircle, { backgroundColor: colors.secondary }]}>
                        {isGuest ? (
                            <LogIn color={isDark ? colors.secondary : 'white'} size={12} />
                        ) : (
                            <UserIcon color={isDark ? colors.secondary : 'white'} size={12} />
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <AuthRequirementModal
                isVisible={isAuthModalVisible}
                onClose={() => setIsAuthModalVisible(false)}
                onLogin={() => {
                    setIsAuthModalVisible(false);
                    navigation.navigate('Login');
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: width, height: height },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    headerLeft: { flex: 1 },
    profileBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 15, gap: 6 },
    greetingText: { fontSize: 10, fontWeight: '700' },
    badgeCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    subtitle: { ...TYPOGRAPHY.bodySmall, fontSize: 10, marginTop: 2 },
    nearMeButton: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.heavy,
        zIndex: 10,
    },
    cardContainer: { position: 'absolute', bottom: 120, left: 20, right: 20, zIndex: 20 },
    restaurantCard: { borderRadius: 24, flexDirection: 'row', padding: 12, ...SHADOWS.heavy, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    cardImage: { width: 100, height: 120, borderRadius: 18 },
    cardInfo: { flex: 1, paddingLeft: 16, justifyContent: 'space-between' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { ...TYPOGRAPHY.h3, fontSize: 16, flex: 1, marginRight: 8 },
    closeButton: { padding: 4 },
    cardRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    cardReviewCount: { ...TYPOGRAPHY.bodySmall, fontSize: 11 },
    cardCuisine: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', fontSize: 12, marginTop: 4 },
    cardLocationBox: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    cardLocationText: { ...TYPOGRAPHY.bodySmall, fontSize: 11 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    priceText: { ...TYPOGRAPHY.bodySmall, fontWeight: '700' },
    viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, gap: 4 },
    viewDetailsText: { fontSize: 11, fontWeight: '700' },
});

export default ExploreScreen;
