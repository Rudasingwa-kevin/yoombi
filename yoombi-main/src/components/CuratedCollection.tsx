import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Star, ChevronRight } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { RestaurantDTO } from '../types/dto';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

interface CuratedCollectionProps {
    title: string;
    subtitle?: string;
    data: RestaurantDTO[];
    onPressItem: (id: string) => void;
}

const CuratedCollection = ({ title, subtitle, data, onPressItem }: CuratedCollectionProps) => {
    const { colors } = useTheme();

    const renderItem = ({ item }: { item: RestaurantDTO }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.white, shadowColor: colors.shadow }]}
            onPress={() => onPressItem(item.id)}
        >
            <Image source={{ uri: item.images[0] }} style={styles.image} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.name, { color: colors.primary }]} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.rating}>
                        <Star size={12} color={colors.star} fill={colors.star} />
                        <Text style={[styles.ratingText, { color: colors.text }]}>{item.rating}</Text>
                    </View>
                </View>
                <Text style={[styles.cuisine, { color: colors.textSecondary }]}>{item.cuisine} • {item.area}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <View>
                    <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
                    {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
                </View>
                <TouchableOpacity style={styles.seeAll}>
                    <ChevronRight color={colors.secondary} size={20} />
                </TouchableOpacity>
            </View>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                snapToInterval={CARD_WIDTH + 16}
                decelerationRate="fast"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
        width: '100%',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        ...TYPOGRAPHY.h3,
        fontSize: 18,
    },
    subtitle: {
        ...TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    seeAll: {
        marginBottom: 2,
    },
    listContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    card: {
        width: CARD_WIDTH,
        borderRadius: 20,
        overflow: 'hidden',
        ...SHADOWS.medium,
        marginBottom: 10, // For shadow
    },
    image: {
        width: '100%',
        height: 140,
        backgroundColor: '#DDD',
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        ...TYPOGRAPHY.bodyLarge,
        fontWeight: '800',
        flex: 1,
        marginRight: 8,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cuisine: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default CuratedCollection;
