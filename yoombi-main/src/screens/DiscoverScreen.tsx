import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { User as UserIcon, LogIn, Search, Sliders, X, Check, Star, History, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';

import RestaurantCard from '../components/RestaurantCard';
import CuratedCollection from '../components/CuratedCollection';
import { RestaurantCardSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { restaurantService } from '../services/api';

import { RestaurantDTO } from '../types/dto';
import AuthRequirementModal from '../components/AuthRequirementModal';
import { RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const FilterSection = ({ title, options, selectedValue, onSelect, colors }: any) => (
    <View style={styles.filterSection}>
        <Text style={[styles.filterSectionTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.filterOptions}>
            {options.map((option: string) => (
                <TouchableOpacity
                    key={option}
                    onPress={() => onSelect(selectedValue === option ? null : option)}
                    style={[
                        styles.filterOption,
                        {
                            backgroundColor: selectedValue === option ? colors.primary : colors.white,
                            borderColor: selectedValue === option ? colors.primary : colors.gray + '50'
                        }
                    ]}
                >
                    <Text style={[
                        styles.filterOptionText,
                        { color: selectedValue === option ? 'white' : colors.text }
                    ]}>
                        {option}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);
const SAVED_FILTERS_KEY = 'yoombi_saved_filters';
const SEARCH_HISTORY_KEY = 'yoombi_search_history';

const DiscoverScreen = ({ navigation }: any) => {
    const { user, role } = useAuth();
    const { colors, isDark } = useTheme();
    const isGuest = role === 'GUEST';

    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [vibe, setVibe] = useState<string | null>(null);
    const [dressCode, setDressCode] = useState<string | null>(null);
    const [isMichelin, setIsMichelin] = useState(false);
    const [restaurants, setRestaurants] = useState<RestaurantDTO[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);


    const fetchRestaurants = async () => {
        setIsLoading(true);
        try {
            const response = await restaurantService.getAll({
                search: searchQuery || undefined,
                vibe: vibe || undefined,
                dressCode: dressCode || undefined,
                isMichelin: isMichelin || undefined
            });
            setRestaurants(response);
        } catch (error) {
            console.error('[DiscoverScreen] Fetch error:', error);
            setRestaurants([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchRestaurants();
        }, searchQuery ? 500 : 0);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, vibe, dressCode, isMichelin]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchRestaurants();
    };

    useEffect(() => {
        const loadPersistedData = async () => {
            try {
                const savedFilters = await AsyncStorage.getItem(SAVED_FILTERS_KEY);
                if (savedFilters) {
                    const { vibe: v, dressCode: d, isMichelin: m } = JSON.parse(savedFilters);
                    setVibe(v);
                    setDressCode(d);
                    setIsMichelin(m);
                }

                const savedHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
                if (savedHistory) {
                    setSearchHistory(JSON.parse(savedHistory));
                }
            } catch (e) {
                console.error('Failed to load persisted data', e);
            }
        };

        loadPersistedData();
    }, []);

    // Save filters when they change
    useEffect(() => {
        if (!isLoading) {
            const saveFilters = async () => {
                try {
                    await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify({ vibe, dressCode, isMichelin }));
                } catch (e) {
                    console.error('Failed to save filters', e);
                }
            };
            saveFilters();
        }
    }, [vibe, dressCode, isMichelin, isLoading]);

    // Derive curated collections from real restaurants
    const curatedCollections = useMemo(() => [
        {
            id: 'c1',
            title: 'Top Rated',
            subtitle: 'Highest rated this month',
            restaurants: [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6),
        },
        {
            id: 'c2',
            title: 'Luxury Dining',
            subtitle: 'Fine dining experiences',
            restaurants: restaurants.filter((r: any) => r.isMichelin || r.vibe === 'Elegant').slice(0, 6),
        },
    ], [restaurants]);



    const addToHistory = async (query: string) => {
        if (!query.trim()) return;
        const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
        setSearchHistory(newHistory);
        try {
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (e) {
            console.error('Failed to save search history', e);
        }
    };

    const clearHistory = async () => {
        setSearchHistory([]);
        try {
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (e) {
            console.error('Failed to clear history', e);
        }
    };

    const resetFilters = async () => {
        setSearchQuery('');
        setVibe(null);
        setVibe(null);
        setDressCode(null);
        setIsMichelin(false);
        try {
            await AsyncStorage.removeItem(SAVED_FILTERS_KEY);
        } catch (e) {
            console.error('Failed to clear saved filters', e);
        }
        // fetchRestaurants(); // REMOVED: This uses stale state. useEffect handles this automatically.
    };


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={['#050B10', '#0A1A2F']}
                style={styles.header}
            >
                <View>
                    <Text style={[TYPOGRAPHY.h1, { color: colors.secondary, letterSpacing: 1 }]}>Yoombi</Text>
                    <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.5)' }]}>Elite Dining Across Rwanda</Text>
                </View>

                <TouchableOpacity
                    style={[styles.profileButton, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(197, 160, 89, 0.2)', borderWidth: 1 }]}
                    onPress={() => isGuest ? navigation.navigate('Login') : navigation.navigate('Profile')}
                >
                    <View style={styles.greetingContainer}>
                        <Text style={[styles.greetingText, { color: colors.secondary }]}>
                            {isGuest ? 'Join Gold' : user?.name.split(' ')[0]}
                        </Text>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.secondary }]}>
                            {isGuest ? (
                                <LogIn color={colors.primary} size={14} />
                            ) : (
                                <UserIcon color={colors.primary} size={14} />
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            {/* Search & Filter Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.white }]}>
                    <Search color={colors.gray} size={20} />
                    <TextInput
                        placeholder="Search vibe, cuisine, restaurant..."
                        placeholderTextColor={colors.gray}
                        style={[styles.searchInput, { color: colors.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        onSubmitEditing={() => addToHistory(searchQuery)}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, { backgroundColor: colors.primary }]}
                    onPress={() => setIsFilterVisible(true)}
                >
                    <Sliders color={isDark ? colors.secondary : 'white'} size={20} />
                    {(vibe || dressCode || isMichelin) && <View style={[styles.filterBadge, { backgroundColor: colors.secondary }]} />}
                </TouchableOpacity>
            </View>

            {/* Active Filters Display */}
            {(vibe || dressCode || isMichelin) && (
                <View style={styles.activeFiltersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersList}>
                        <TouchableOpacity style={[styles.clearAllChip, { backgroundColor: colors.secondary }]} onPress={resetFilters}>
                            <X size={14} color={colors.primary} />
                            <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear All</Text>
                        </TouchableOpacity>
                        
                        {vibe && (
                            <View style={[styles.filterChip, { backgroundColor: colors.white }]}>
                                <Text style={[styles.filterChipText, { color: colors.text }]}>{vibe}</Text>
                                <TouchableOpacity onPress={() => setVibe(null)}><X size={12} color={colors.gray} /></TouchableOpacity>
                            </View>
                        )}
                        {dressCode && (
                            <View style={[styles.filterChip, { backgroundColor: colors.white }]}>
                                <Text style={[styles.filterChipText, { color: colors.text }]}>{dressCode}</Text>
                                <TouchableOpacity onPress={() => setDressCode(null)}><X size={12} color={colors.gray} /></TouchableOpacity>
                            </View>
                        )}
                        {isMichelin && (
                            <View style={[styles.filterChip, { backgroundColor: colors.white }]}>
                                <Text style={[styles.filterChipText, { color: colors.text }]}>Michelin</Text>
                                <TouchableOpacity onPress={() => setIsMichelin(false)}><X size={12} color={colors.gray} /></TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}

            <FlatList
                data={(isLoading ? [1, 2, 3] : restaurants) as any[]}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                renderItem={({ item }) => {
                    if (isLoading) return <RestaurantCardSkeleton />;
                    return (
                        <RestaurantCard
                            restaurant={item as any}
                            onPress={() => {
                                if (isGuest) {
                                    setIsAuthModalVisible(true);
                                    return;
                                }
                                navigation.navigate('RestaurantDetail', { id: (item as any).id });
                            }}
                        />
                    );
                }}
                keyExtractor={(item, index) => isLoading ? `skeleton-${index}` : (item as any).id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>

                        {/* Search History */}
                        {!isLoading && isSearchFocused && !searchQuery && searchHistory.length > 0 && (
                            <View style={styles.historyContainer}>
                                <View style={styles.historyHeader}>
                                    <View style={styles.historyTitleRow}>
                                        <History size={16} color={colors.textSecondary} />
                                        <Text style={[styles.historyTitle, { color: colors.textSecondary }]}>Recent Searches</Text>
                                    </View>
                                    <TouchableOpacity onPress={clearHistory}>
                                        <Trash2 size={16} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
                                    {searchHistory.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.historyItem, { backgroundColor: colors.white }]}
                                            onPress={() => setSearchQuery(item)}
                                        >
                                            <Text style={[styles.historyText, { color: colors.text }]}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {!searchQuery && !isLoading && (
                            <>
                                {curatedCollections.filter(c => c.restaurants.length > 0).map((collection) => (
                                    <CuratedCollection
                                        key={collection.id}
                                        title={collection.title}
                                        subtitle={collection.subtitle}
                                        data={collection.restaurants as any[]}
                                        onPressItem={(id) => {
                                            if (isGuest) {
                                                setIsAuthModalVisible(true);
                                                return;
                                            }
                                            navigation.navigate('RestaurantDetail', { id });
                                        }}
                                    />
                                ))}
                            </>
                        )}
                        <View style={styles.innerHeader}>
                            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                                {isLoading ? 'Exploring Rwanda...' : (searchQuery || vibe || dressCode || isMichelin ? 'Results Found' : 'All Restaurants')}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => !isLoading ? (
                    <View style={styles.emptyState}>
                        <Text style={[TYPOGRAPHY.bodyLarge, { color: colors.textSecondary }]}>No matching experiences found.</Text>
                        <TouchableOpacity onPress={resetFilters} style={styles.resetLink}>
                            <Text style={{ color: colors.secondary, fontWeight: '700' }}>Clear all filters</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            />

            {/* Filter Modal */}
            <Modal visible={isFilterVisible} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Advanced Filters</Text>
                            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                                <X color={colors.text} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <FilterSection
                                title="Vibe & Atmosphere"
                                options={['Rooftop', 'Romantic', 'Business', 'Family']}
                                selectedValue={vibe}
                                onSelect={setVibe}
                                colors={colors}
                            />

                            <FilterSection
                                title="Dress Code"
                                options={['Formal', 'Smart Casual', 'Casual']}
                                selectedValue={dressCode}
                                onSelect={setDressCode}
                                colors={colors}
                            />

                            <View style={styles.filterSection}>
                                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Exclusivity</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.michelinToggle,
                                        { backgroundColor: colors.white, borderColor: isMichelin ? colors.secondary : colors.gray + '30' }
                                    ]}
                                    onPress={() => setIsMichelin(!isMichelin)}
                                >
                                    <View style={styles.michelinLeft}>
                                        <Star size={20} color={colors.star} fill={colors.star} />
                                        <Text style={[styles.michelinText, { color: colors.text }]}>Michelin Star Experiences</Text>
                                    </View>
                                    <View style={[
                                        styles.checkbox,
                                        { backgroundColor: isMichelin ? colors.secondary : 'transparent', borderColor: colors.gray }
                                    ]}>
                                        {isMichelin && <Check size={14} color="white" />}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                                <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                                onPress={() => setIsFilterVisible(false)}
                            >
                                <Text style={[styles.applyButtonText, { color: isDark ? colors.secondary : 'white' }]}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    header: {
        paddingTop: 64,
        paddingHorizontal: 20,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subtitle: { ...TYPOGRAPHY.bodySmall, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10, fontWeight: '700' },
    profileButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
    greetingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    greetingText: { fontSize: 12, fontWeight: '700' },
    avatarCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 12,
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 48,
        ...SHADOWS.light,
    },
    searchInput: { flex: 1, marginLeft: 8, ...TYPOGRAPHY.bodyMedium },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        ...SHADOWS.small,
    },
    filterBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: 'white',
    },
    listContainer: { alignItems: 'center', paddingBottom: 110 },
    listHeader: { width: '100%', paddingTop: 24 },
    innerHeader: { width: '100%', paddingHorizontal: 20, marginBottom: 16, alignSelf: 'flex-start' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    resetLink: { marginTop: 12 },

    activeFiltersContainer: {
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    activeFiltersList: {
        gap: 8,
        alignItems: 'center',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        ...SHADOWS.small,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    clearAllChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        ...SHADOWS.small,
    },
    clearAllText: {
        fontSize: 12,
        fontWeight: '800',
    },

    // History Styles
    historyContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    historyTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    historyList: {
        gap: 8,
        paddingBottom: 4,
    },
    historyItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        alignSelf: 'flex-start',
        ...SHADOWS.small,
    },
    historyText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        ...SHADOWS.medium,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
    },
    filterSection: { marginBottom: 32 },
    filterSectionTitle: { ...TYPOGRAPHY.bodyLarge, fontWeight: '800', marginBottom: 16 },
    filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1
    },
    filterOptionText: { fontSize: 13, fontWeight: '700' },
    michelinToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        ...SHADOWS.light,
    },
    michelinLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    michelinText: { fontWeight: '700', fontSize: 13 },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    modalFooter: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        marginTop: 20
    },
    resetButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    resetButtonText: { fontWeight: '700' },
    applyButton: { flex: 2, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
    applyButtonText: { fontSize: 16, fontWeight: '800' },
});

export default DiscoverScreen;
