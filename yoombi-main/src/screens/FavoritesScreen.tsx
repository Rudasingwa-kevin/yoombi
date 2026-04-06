import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TYPOGRAPHY } from '../constants/theme';
import RestaurantCard from '../components/RestaurantCard';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthRequirementModal from '../components/AuthRequirementModal';
import { authService } from '../services/api';
import { RestaurantDTO } from '../types/dto';

const FavoritesScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { role } = useAuth();
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
    const [favorites, setFavorites] = useState<RestaurantDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFavorites = async () => {
        if (role === 'GUEST') return;
        try {
            setLoading(true);
            const data = await authService.getFavorites();
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
        }, [role])
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
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You haven't saved any restaurants yet.</Text>
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
});

export default FavoritesScreen;
