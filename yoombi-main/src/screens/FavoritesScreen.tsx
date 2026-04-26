import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TYPOGRAPHY } from '../constants/theme';
import RestaurantCard from '../components/RestaurantCard';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthRequirementModal from '../components/AuthRequirementModal';
import { authService, restaurantService } from '../services/api';
import { RestaurantDTO } from '../types/dto';

const FavoritesScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { role } = useAuth();
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
    const [favorites, setFavorites] = useState<RestaurantDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'liked' | 'following'>('liked');

    const fetchFavorites = async () => {
        if (role === 'GUEST') return;
        try {
            setLoading(true);
            const data = activeTab === 'liked' 
                ? await authService.getFavorites() 
                : await restaurantService.getFollowed(); // Need to add this to api.js
            setFavorites(data || []);
        } catch (error) {
            console.error('Failed to load favorites', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFavorites();
        }, [role, activeTab])
    );

    const handlePress = (id: string) => {
        if (role === 'GUEST') {
            setIsAuthModalVisible(true);
            return;
        }
        navigation.navigate('RestaurantDetail', { id });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[TYPOGRAPHY.h1, { color: colors.primary }]}>My Favorites</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your saved luxury spots</Text>
                
                <View style={[styles.tabContainer, { backgroundColor: colors.gray + '20' }]}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'liked' && { backgroundColor: colors.primary }]} 
                        onPress={() => setActiveTab('liked')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'liked' ? (isDark ? colors.secondary : 'white') : colors.textSecondary }]}>Liked</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'following' && { backgroundColor: colors.primary }]} 
                        onPress={() => setActiveTab('following')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'following' ? (isDark ? colors.secondary : 'white') : colors.textSecondary }]}>Following</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : favorites.length > 0 ? (
                <FlatList
                    data={favorites}
                    renderItem={({ item }) => (
                        <RestaurantCard
                            restaurant={item as any}
                            onPress={() => handlePress(item.id)}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.centerContainer}>
                    {role === 'GUEST' ? (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Please log in to see your favorites.</Text>
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {activeTab === 'liked' 
                                ? "You haven't liked any restaurants yet." 
                                : "You're not following any restaurants yet."}
                        </Text>
                    )}
                </View>
            )}

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
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    subtitle: {
        ...TYPOGRAPHY.bodyLarge,
        marginTop: 4,
    },
    listContainer: {
        alignItems: 'center',
        paddingBottom: 110,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        ...TYPOGRAPHY.bodyLarge,
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 20,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabText: {
        fontWeight: '700',
        fontSize: 14,
    },
});

export default FavoritesScreen;
