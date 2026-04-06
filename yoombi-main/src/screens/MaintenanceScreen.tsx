import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { AlertCircle, Wrench } from 'lucide-react-native';
import { TYPOGRAPHY, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const MaintenanceScreen = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.secondary + '15' }]}>
                <Wrench color={colors.secondary} size={60} />
            </View>
            <Text style={[TYPOGRAPHY.h1, { color: colors.primary, textAlign: 'center' }]}>Under Maintenance</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                Yoombi is currently undergoing scheduled updates to provide you with a even more premium experience.
            </Text>
            <Text style={[styles.footer, { color: colors.gray }]}>We'll be back shortly.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    subtitle: {
        ...TYPOGRAPHY.bodyLarge,
        marginTop: 16,
        marginBottom: 40,
        lineHeight: 24,
    },
    footer: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    }
});

export default MaintenanceScreen;
