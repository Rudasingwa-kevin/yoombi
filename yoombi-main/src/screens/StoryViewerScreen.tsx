import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatRelativeTime } from '../utils/date';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface StorySegment {
    id: string;
    imageUrl?: string;
    text?: string;
    type: 'image' | 'video' | 'text';
    createdAt: string;
    timestamp?: string; // Fallback for UI
}

interface StoryUser {
    restaurantId: string;
    restaurantName: string;
    avatar: string;
    stories: StorySegment[];
}

const StoryViewerScreen = ({ route, navigation }: any) => {
    const { storyGroup } = route.params;
    const { colors } = useTheme();
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Safety check if storyGroup is missing
    if (!storyGroup || !storyGroup.stories || storyGroup.stories.length === 0) {
        navigation.goBack();
        return null;
    }

    const currentStory = storyGroup.stories[currentStoryIndex];

    useEffect(() => {
        startProgress();
    }, [currentStoryIndex]);

    const startProgress = () => {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: STORY_DURATION,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                goToNextStory();
            }
        });
    };

    const goToNextStory = () => {
        if (currentStoryIndex < storyGroup.stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
        } else {
            closeViewer();
        }
    };

    const goToPrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
        } else {
            // Restart current story if it's the first one
            startProgress();
        }
    };

    const closeViewer = () => {
        navigation.goBack();
    };

    const handlePress = (evt: any) => {
        const x = evt.nativeEvent.locationX;
        if (x < width * 0.3) {
            goToPrevStory();
        } else {
            goToNextStory();
        }
    };

    // Pause on long press (clear animation) - simplified for MVP
    // For a real app, we'd pause animation, not reset

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Main Content */}
            <TouchableOpacity
                activeOpacity={1}
                style={styles.contentContainer}
                onPress={handlePress}
            >
                {currentStory.type === 'text' ? (
                    <LinearGradient
                        colors={['#1a1a1a', '#2d3436', '#000000']}
                        style={styles.textStoryContainer}
                    >
                        <Text style={styles.storyTextContent}>
                            {currentStory.text}
                        </Text>
                    </LinearGradient>
                ) : (
                    <Image
                        source={{ uri: currentStory.imageUrl || currentStory.image }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}

                {/* Gradient Overlay for text readability */}
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            </TouchableOpacity>

            {/* Header & Controls */}
            <SafeAreaView style={styles.safeArea}>
                {/* Progress Bars */}
                <View style={styles.progressContainer}>
                    {storyGroup.stories.map((story: any, index: number) => {
                        return (
                            <View key={index} style={styles.progressBarBackground}>
                                <Animated.View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: index === currentStoryIndex
                                                ? progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%']
                                                })
                                                : index < currentStoryIndex ? '100%' : '0%'
                                        }
                                    ]}
                                />
                            </View>
                        );
                    })}
                </View>

                {/* Header Info */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image source={{ uri: storyGroup.avatar }} style={styles.avatar} />
                        <View style={styles.textContainer}>
                            <Text style={styles.username}>{storyGroup.restaurantName || storyGroup.name}</Text>
                            <Text style={styles.timestamp}>{formatRelativeTime(currentStory.createdAt)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={closeViewer} style={styles.closeButton}>
                        <X size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Caption / CTA at bottom */}
            {currentStory.type !== 'text' && currentStory.text && (
                <View style={styles.footer}>
                    <Text style={styles.caption} numberOfLines={3}>
                        {currentStory.text}
                    </Text>
                    {/* Placeholder for future "See Menu" or "Book table" button */}
                    <TouchableOpacity 
                        style={styles.ctaButton}
                        onPress={() => {
                            const restaurantId = storyGroup.restaurantId || storyGroup.id;
                            if (restaurantId) {
                                navigation.navigate('RestaurantDetail', { id: restaurantId });
                            }
                        }}
                    >
                        <Text style={styles.ctaText}>See Details</Text>
                        <ChevronRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    contentContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height,
    },
    textStoryContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    storyTextContent: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 44,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 10, // Extra padding for safety
    },
    progressContainer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingTop: 10,
        height: 3,
        marginBottom: 12,
    },
    progressBarBackground: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 2,
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        marginRight: 10,
    },
    textContainer: {
        justifyContent: 'center',
    },
    username: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    timestamp: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    caption: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    ctaText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginRight: 4,
        fontSize: 14,
    },
});

export default StoryViewerScreen;
