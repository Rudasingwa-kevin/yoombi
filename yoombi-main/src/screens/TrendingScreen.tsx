import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';

import RestaurantCard from '../components/RestaurantCard';
import BlogCard from '../components/BlogCard';
import StoryBubbles from '../components/StoryBubbles';
import { RestaurantCardSkeleton } from '../components/SkeletonLoader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RefreshControl } from 'react-native';
import { storyService, restaurantService, articleService } from '../services/api';
import { RestaurantStoriesDTO, RestaurantDTO, ArticleDTO } from '../types/dto';

const { width } = Dimensions.get('window');


const TrendingScreen = ({ navigation }: any) => {
    const { role } = useAuth();
    const { colors, isDark } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stories, setStories] = useState<RestaurantStoriesDTO[]>([]);
    const [trendingRestaurants, setTrendingRestaurants] = useState<RestaurantDTO[]>([]);
    const [articles, setArticles] = useState<ArticleDTO[]>([]);

    const fetchData = async () => {
        try {
            const [storyRes, restRes, articleRes] = await Promise.all([
                storyService.getAllStories(),
                restaurantService.getAll(),
                articleService.getAll()
            ]);
            setStories(storyRes || []);
            setArticles(articleRes || []);
            
            // Only show restaurants that are explicitly marked as trending
            const sortedRestaurants = (restRes || [])
                .filter((r: RestaurantDTO) => r.isTrending)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0));
                
            setTrendingRestaurants(sortedRestaurants);
        } catch (error) {
            console.error('[TrendingScreen] Fetch error:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    const renderRestaurant = useCallback(({ item }: { item: RestaurantDTO }) => {
        if (isLoading) return <RestaurantCardSkeleton />;
        return (
            <RestaurantCard
                restaurant={item as any}
                onPress={() => {
                    if (role === 'GUEST') {
                        Alert.alert(
                            "Login Required",
                            "You need to login to view restaurant details.",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Login", onPress: () => navigation.navigate('Login') }
                            ]
                        );
                        return;
                    }
                    navigation.navigate('RestaurantDetail', { id: item.id });
                }}
            />
        );
    }, [navigation, role, isLoading]);

    const renderBlogCard = useCallback(({ item }: { item: ArticleDTO }) => (
        <BlogCard
            article={item}
            onPress={() => navigation.navigate('BlogDetail', { id: item.id })}
        />
    ), [navigation]);

    const ListHeaderComponent = useCallback(() => (
        <>
            <View style={styles.header}>
                <Text style={[TYPOGRAPHY.h1, { color: colors.primary }]}>Trending</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Handpicked for you today</Text>
            </View>

            <View style={styles.storiesSection}>
                {!isLoading && stories.length > 0 && (
                    <StoryBubbles 
                        stories={stories.map(s => ({
                            id: s.restaurantId,
                            name: s.restaurantName,
                            avatar: s.avatar,
                            stories: s.stories
                        }))}
                        onPressStory={(storyGroup) => navigation.navigate('StoryViewer', { storyGroup })}
                    />
                )}
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Daily Spotlight</Text>
            </View>

            <TouchableOpacity
                style={[styles.spotlightCard, { shadowColor: colors.shadow }]}
                onPress={() => navigation.navigate('BlogDetail', { id: articles.length > 0 ? articles[0].id : 'blog-2' })}
                activeOpacity={0.9}
            >
                <Image
                    source={{ uri: articles.length > 0 && articles[0].imageUrl ? articles[0].imageUrl : 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop' }}
                    style={styles.spotlightImage}
                    resizeMode="cover"
                />
                <View style={[styles.spotlightOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(10, 25, 47, 0.6)' }]}>
                    <Text style={[styles.spotlightTitle, { color: colors.white }]}>{articles.length > 0 ? articles[0].title : 'Michelin Experience in Kigali'}</Text>
                    <Text style={[styles.spotlightDesc, { color: isDark ? colors.textSecondary : colors.gray }]}>{articles.length > 0 ? articles[0].content.substring(0, 50) + '...' : 'Discover the secret behind Rwanda\'s rising star chefs.'}</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Featured Stories</Text>
            </View>

            <View style={styles.blogSection}>
                {articles.length > 0 ? (
                    <FlatList
                        data={articles.slice(0, 4)}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={renderBlogCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.blogList}
                    />
                ) : (
                    <Text style={{ padding: 20, color: colors.textSecondary }}>No featured stories available.</Text>
                )}
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Trending Now</Text>
            </View>
        </>
    ), [colors, isDark, renderBlogCard, stories, articles, isLoading, navigation]);

    return (
        <FlatList
            style={[styles.container, { backgroundColor: colors.background }]}
            data={(isLoading ? [1, 2, 3] : trendingRestaurants) as any[]}
            renderItem={renderRestaurant}
            keyExtractor={(item, index) => isLoading ? `skeleton-${index}` : (item as any).id}
            ListHeaderComponent={ListHeaderComponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContentContainer}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={5}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
        />
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
    storiesSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    spotlightCard: {
        marginHorizontal: 20,
        height: 200,
        borderRadius: SIZES.radius_xl,
        overflow: 'hidden',
        marginBottom: 24,
        ...SHADOWS.medium,
    },
    spotlightImage: {
        width: '100%',
        height: '100%',
    },
    spotlightOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    spotlightTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: 4,
    },
    spotlightDesc: {
        ...TYPOGRAPHY.bodySmall,
    },
    listContentContainer: {
        paddingBottom: 110,
    },
    blogSection: {
        marginBottom: 24,
    },
    blogList: {
        paddingLeft: 20,
        paddingRight: 4,
    },
});

export default TrendingScreen;
