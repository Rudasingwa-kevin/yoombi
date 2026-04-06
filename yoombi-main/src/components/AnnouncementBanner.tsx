import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react-native';
import { SIZES } from '../constants/theme';
import { useSite } from '../context/SiteContext';
import { useTheme } from '../context/ThemeContext';

const AnnouncementBanner = () => {
    const { activeBanner, hideBanner } = useSite();
    const { colors } = useTheme();

    if (!activeBanner || !activeBanner.isActive) return null;

    const getIcon = () => {
        switch (activeBanner.type) {
            case 'success': return <CheckCircle color="white" size={16} />;
            case 'warning': return <AlertTriangle color="white" size={16} />;
            case 'error': return <AlertCircle color="white" size={16} />;
            default: return <Info color="white" size={16} />;
        }
    };

    const getBgColor = () => {
        switch (activeBanner.type) {
            case 'success': return '#10B981';
            case 'warning': return '#F59E0B';
            case 'error': return '#EF4444';
            default: return colors.primary;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: getBgColor() }]}>
            <View style={styles.content}>
                {getIcon()}
                <Text style={styles.message}>{activeBanner.message}</Text>
            </View>
            <TouchableOpacity onPress={hideBanner} style={styles.closeBtn}>
                <X color="white" size={16} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 50, // To account for top safe area if used at root
        paddingBottom: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    message: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    closeBtn: {
        padding: 4,
    }
});

export default AnnouncementBanner;
