import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Clock, User, Share2 } from 'lucide-react-native';
import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import BlogCard from '../components/BlogCard';
import { articleService } from '../services/api';
import { ArticleDTO } from '../types/dto';

const { width } = Dimensions.get('window');

const BlogDetailScreen = ({ route, navigation }: any) => {
    const { id } = route.params;
    const { colors, isDark } = useTheme();

    const [article, setArticle] = useState<ArticleDTO | null>(null);
    const [relatedArticles, setRelatedArticles] = useState<ArticleDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [articleData, allArticles] = await Promise.all([
                    articleService.getById(id),
                    articleService.getAll(),
                ]);
                setArticle(articleData);
                setRelatedArticles(
                    allArticles.filter((a: ArticleDTO) => a.id !== id && a.category === articleData.category).slice(0, 3)
                );
            } catch (e) {
                console.error('[BlogDetailScreen] Failed to load article:', e);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    const getCategoryColor = (category: string) => {
        const categoryColors: { [key: string]: string } = {
            'Chef Interview': '#D4AF37',
            'Dining Guide': '#4A90E2',
            'Food Culture': '#E85D75',
            'Discovery': '#50C878',
            'Culture': '#9B59B6',
            'Education': '#F39C12',
            'Sustainability': '#27AE60',
        };
        return categoryColors[category] || colors.secondary;
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error || !article) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Article not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
                    <Text style={{ color: colors.secondary, fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header with back button */}
            <View style={styles.headerBar}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)' }]}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.shareButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)' }]}
                >
                    <Share2 size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Hero Image */}
            <View style={styles.heroContainer}>
                <Image
                    source={{ uri: article.imageUrl || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop' }}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
                <View style={[styles.heroOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(10, 25, 47, 0.4)' }]} />
            </View>

            {/* Content */}
            <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) }]}>
                    <Text style={styles.categoryText}>{article.category}</Text>
                </View>

                <Text style={[styles.title, { color: colors.primary }]}>{article.title}</Text>

                <View style={styles.metaContainer}>
                    <View style={styles.authorInfo}>
                        <View>
                            <View style={styles.authorRow}>
                                <User size={14} color={colors.textSecondary} />
                                <Text style={[styles.authorName, { color: colors.text }]}>
                                    {article.restaurantName || 'Yoombi Editorial'}
                                </Text>
                            </View>
                            <Text style={[styles.date, { color: colors.textSecondary }]}>
                                {new Date(article.date || '').toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.readTimeContainer}>
                        <Clock size={16} color={colors.secondary} />
                        <Text style={[styles.readTime, { color: colors.secondary }]}>
                            {Math.max(1, Math.ceil((article.content?.length || 0) / 1000))} min read
                        </Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.content, { color: colors.text }]}>
                    {article.content}
                </Text>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                    <>
                        <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 40 }]} />
                        <Text style={[styles.relatedTitle, { color: colors.primary }]}>
                            Related Articles
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.relatedList}
                        >
                            {relatedArticles.map((relatedArticle) => (
                                <BlogCard
                                    key={relatedArticle.id}
                                    article={relatedArticle}
                                    onPress={() => navigation.push('BlogDetail', { id: relatedArticle.id })}
                                />
                            ))}
                        </ScrollView>
                    </>
                )}

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBar: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    shareButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    heroContainer: {
        height: 300,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    contentContainer: {
        marginTop: -30,
        borderTopLeftRadius: SIZES.radius_xl,
        borderTopRightRadius: SIZES.radius_xl,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: SIZES.radius_sm,
        marginBottom: 16,
    },
    categoryText: {
        ...TYPOGRAPHY.bodySmall,
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        ...TYPOGRAPHY.h1,
        fontSize: 28,
        lineHeight: 36,
        marginBottom: 20,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    authorName: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '600',
        marginLeft: 6,
    },
    date: {
        ...TYPOGRAPHY.bodySmall,
        fontSize: 12,
    },
    readTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readTime: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '600',
        marginLeft: 6,
    },
    divider: {
        height: 1,
        marginVertical: 20,
    },
    content: {
        ...TYPOGRAPHY.bodyMedium,
        fontSize: 16,
        lineHeight: 28,
        letterSpacing: 0.2,
    },
    relatedTitle: {
        ...TYPOGRAPHY.h2,
        fontSize: 24,
        marginBottom: 20,
        marginTop: 20,
    },
    relatedList: {
        paddingBottom: 20,
    },
});

export default BlogDetailScreen;
