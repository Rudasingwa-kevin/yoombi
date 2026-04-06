import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
    width: number | string;
    height: number | string;
    borderRadius?: number;
    style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = 8, style }) => {
    const { isDark } = useTheme();
    const [layoutWidth, setLayoutWidth] = useState<number>(0);
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-layoutWidth || 100, layoutWidth || 100],
    });

    const backgroundColor = isDark ? '#1E293B' : '#E2E8F0';
    const highlightColor = isDark ? '#334155' : '#F1F5F9';

    return (
        <View
            style={[
                styles.skeleton,
                { width, height, borderRadius, backgroundColor },
                style
            ]}
            onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
        >
            {layoutWidth > 0 && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            transform: [{ translateX }],
                        },
                    ]}
                >
                    <View
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: highlightColor,
                                opacity: 0.3,
                            }
                        ]}
                    />
                </Animated.View>
            )}
        </View>
    );
};

export const RestaurantCardSkeleton = () => (
    <View style={styles.cardSkeleton}>
        <Skeleton width="100%" height={200} borderRadius={24} />
        <View style={styles.cardContent}>
            <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
            <View style={styles.cardFooter}>
                <Skeleton width="30%" height={20} />
                <Skeleton width="25%" height={20} />
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
    cardSkeleton: {
        width: '90%',
        marginBottom: 20,
        alignSelf: 'center',
    },
    cardContent: {
        padding: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
});
