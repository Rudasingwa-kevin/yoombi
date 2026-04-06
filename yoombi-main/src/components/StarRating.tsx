import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface StarRatingProps {
    rating: number;
    size?: number;
    maxStars?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 16, maxStars = 5 }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.container}>
            {[...Array(maxStars)].map((_, index) => (
                <Star
                    key={index}
                    size={size}
                    color={index < Math.floor(rating) ? colors.star : colors.gray}
                    fill={index < Math.floor(rating) ? colors.star : 'transparent'}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 2,
    },
});

export default StarRating;
