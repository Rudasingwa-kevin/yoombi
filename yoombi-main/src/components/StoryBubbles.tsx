import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface StoryBubblesProps {
    stories: any[];
    onPressStory: (storyGroup: any) => void;
}

const StoryBubbles = ({ stories, onPressStory }: StoryBubblesProps) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {stories.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.storyItem}
                        onPress={() => onPressStory(item)}
                    >
                        <LinearGradient
                            colors={['#FF0050', '#5E5CE6', '#FFD700']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientBorder}
                        >
                            <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
                                <Image
                                    source={{ uri: item.avatar }}
                                    style={styles.avatar}
                                />
                            </View>
                        </LinearGradient>
                        <Text
                            style={[styles.name, { color: colors.text }]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        marginBottom: 8,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    storyItem: {
        alignItems: 'center',
        width: 76,
    },
    gradientBorder: {
        width: 68,
        height: 68,
        borderRadius: 34,
        padding: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    avatarContainer: {
        width: 63,
        height: 63,
        borderRadius: 31.5,
        padding: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    name: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default StoryBubbles;
