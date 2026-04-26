import React, { useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const { colors, isDark } = useTheme();
    const totalTabs = state.routes.length;
    const tabWidth = (width - 40) / totalTabs; // 40 is total horizontal margin

    // Animation value for the sliding background indicator
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(translateX, {
            toValue: state.index * tabWidth,
            useNativeDriver: true,
            bounciness: 4,
        }).start();
    }, [state.index, tabWidth]);

    return (
        <View style={styles.container}>
            <BlurView
                intensity={Platform.OS === 'ios' ? 80 : 100}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    styles.blurContainer,
                    {
                        backgroundColor: isDark ? 'rgba(10, 25, 47, 0.8)' : 'rgba(253, 251, 247, 0.8)',
                        borderColor: isDark ? 'rgba(197, 160, 89, 0.3)' : 'rgba(10, 25, 47, 0.1)',
                    }
                ]}
            >
                {/* Animated indicator background */}
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            width: tabWidth - 10,
                            backgroundColor: colors.secondary,
                            transform: [{ translateX: Animated.add(translateX, 5) }],
                            opacity: 0.15,
                        },
                    ]}
                />

                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    // Scale animation for icons
                    const scale = useRef(new Animated.Value(1)).current;

                    useEffect(() => {
                        Animated.spring(scale, {
                            toValue: isFocused ? 1.2 : 1,
                            useNativeDriver: true,
                        }).start();
                    }, [isFocused]);

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarButtonTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={{ transform: [{ scale }] }}>
                                {options.tabBarIcon &&
                                    options.tabBarIcon({
                                        focused: isFocused,
                                        color: isFocused ? colors.secondary : colors.textSecondary,
                                        size: 24,
                                    })}
                            </Animated.View>
                        </TouchableOpacity>
                    );
                })}
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 20,
        right: 20,
        height: 64,
        borderRadius: 32,
        // Shadow for elevation effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden', // Required for border radius on Android with BlurView
    },
    blurContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderRadius: 32,
        borderWidth: 1,
    },
    tabItem: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicator: {
        position: 'absolute',
        height: 44,
        borderRadius: 22,
        left: 0,
    },
});

export default CustomTabBar;
