import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
    StatusBar,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    /** Pass an icon component (e.g. from lucide) and it will be shown in a gold accent box */
    accentIcon?: React.ReactNode;
    /** Override the default paddingTop for the safe-area */
    topInset?: number;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    subtitle,
    onBack,
    rightAction,
    accentIcon,
    topInset,
}) => {
    const { colors, isDark } = useTheme();

    // Entrance animation
    const slideY = useRef(new Animated.Value(-20)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideY, {
                toValue: 0,
                duration: 380,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 380,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const safeTop = topInset ?? (Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12);

    return (
        <Animated.View
            style={[
                styles.wrapper,
                { transform: [{ translateY: slideY }], opacity },
            ]}
        >
            <BlurView
                intensity={Platform.OS === 'ios' ? 70 : 100}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    styles.blurContainer,
                    { paddingTop: safeTop },
                ]}
            >
                {/* Gold gradient accent line at very top */}
                <LinearGradient
                    colors={['#C5A059', '#8B6914', '#C5A059']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentLine}
                />

                <View
                    style={[
                        styles.innerRow,
                        {
                            borderBottomColor: isDark
                                ? 'rgba(197,160,89,0.12)'
                                : 'rgba(5,25,35,0.06)',
                        },
                    ]}
                >
                    {/* Left — back button */}
                    <View style={styles.sideSlot}>
                        {onBack && (
                            <TouchableOpacity
                                onPress={onBack}
                                style={[
                                    styles.backButton,
                                    {
                                        backgroundColor: isDark
                                            ? 'rgba(197,160,89,0.12)'
                                            : 'rgba(5,25,35,0.06)',
                                        borderColor: isDark
                                            ? 'rgba(197,160,89,0.25)'
                                            : 'rgba(5,25,35,0.1)',
                                    },
                                ]}
                                activeOpacity={0.7}
                            >
                                <ChevronLeft
                                    color={isDark ? '#C5A059' : '#051923'}
                                    size={22}
                                    strokeWidth={2.5}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Centre — title (+ optional accent icon) */}
                    <View style={styles.centerSlot}>
                        {accentIcon && (
                            <View
                                style={[
                                    styles.accentIconBox,
                                    { backgroundColor: 'rgba(197,160,89,0.15)' },
                                ]}
                            >
                                {accentIcon}
                            </View>
                        )}
                        <View style={styles.titleBlock}>
                            <Text
                                style={[
                                    styles.title,
                                    { color: isDark ? '#F9F8F6' : '#051923' },
                                ]}
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                            {subtitle && (
                                <Text
                                    style={[
                                        styles.subtitle,
                                        { color: isDark ? 'rgba(197,160,89,0.8)' : '#C5A059' },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {subtitle}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Right — action slot */}
                    <View style={styles.sideSlot}>
                        {rightAction ?? <View style={{ width: 40 }} />}
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        zIndex: 100,
    },
    blurContainer: {
        overflow: 'hidden',
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        opacity: 0.7,
    },
    innerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    sideSlot: {
        width: 44,
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    centerSlot: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 8,
    },
    accentIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleBlock: {
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 1,
    },
});

export default ScreenHeader;
