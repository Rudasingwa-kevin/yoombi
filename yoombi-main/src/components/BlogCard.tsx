import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Clock, User } from 'lucide-react-native';
import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { ArticleDTO } from '../types/dto';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface BlogCardProps {
    article: ArticleDTO;
    onPress?: () => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ article, onPress }) => {
    const { colors } = useTheme();

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

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.white, shadowColor: colors.shadow }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: article.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image' }}
                style={[styles.image, { backgroundColor: colors.gray }]}
                resizeMode="cover"
            />
            <View style={styles.content}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) }]}>
                    <Text style={styles.categoryText}>{article.category}</Text>
                </View>

                <Text style={[styles.title, { color: colors.primary }]} numberOfLines={2}>
                    {article.title}
                </Text>

                <Text style={[styles.excerpt, { color: colors.textSecondary }]} numberOfLines={2}>
                    {article.content}
                </Text>

                <View style={styles.footer}>
                    <View style={styles.authorContainer}>
                        <User size={14} color={colors.textSecondary} />
                        <Text style={[styles.authorText, { color: colors.textSecondary }]}>
                            {article.restaurantName || 'Yoombi Editorial'}
                        </Text>
                    </View>

                    <View style={styles.readTimeContainer}>
                        <Clock size={14} color={colors.secondary} />
                        <Text style={[styles.readTimeText, { color: colors.secondary }]}>
                            {Math.max(1, Math.ceil((article.content?.length || 0) / 1000))} min read
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        borderRadius: SIZES.radius_lg,
        marginRight: 16,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    image: {
        width: '100%',
        height: 180,
    },
    content: {
        padding: 16,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: SIZES.radius_sm,
        marginBottom: 12,
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
        ...TYPOGRAPHY.h3,
        fontSize: 18,
        marginBottom: 8,
        lineHeight: 24,
    },
    excerpt: {
        ...TYPOGRAPHY.bodySmall,
        lineHeight: 20,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    authorText: {
        ...TYPOGRAPHY.bodySmall,
        fontSize: 12,
        marginLeft: 6,
    },
    readTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readTimeText: {
        ...TYPOGRAPHY.bodySmall,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default BlogCard;
