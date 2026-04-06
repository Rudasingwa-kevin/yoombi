import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, FlatList } from 'react-native';
import { ChevronLeft, Plus, Trash2, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';

const ImageGalleryScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { currentRestaurant, addRestaurantImage, removeRestaurantImage } = useRestaurant();
    const [images, setImages] = useState<string[]>([
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070',
    ]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImage = result.assets[0].uri;
            setImages(prev => [...prev, newImage]);
            addRestaurantImage(newImage);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImage = result.assets[0].uri;
            setImages(prev => [...prev, newImage]);
            addRestaurantImage(newImage);
        }
    };

    const handleDelete = (imageUri: string) => {
        Alert.alert('Delete Image', 'Are you sure you want to remove this image from your gallery?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setImages(prev => prev.filter(img => img !== imageUri));
                    removeRestaurantImage(imageUri);
                },
            },
        ]);
    };

    const renderImage = ({ item, index }: { item: string; index: number }) => (
        <View style={styles.imageContainer}>
            <Image source={{ uri: item }} style={styles.galleryImage} />
            {index === 0 && (
                <View style={[styles.primaryBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.primaryText, { color: isDark ? colors.primary : 'white' }]}>Primary</Text>
                </View>
            )}
            <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
                onPress={() => handleDelete(item)}
            >
                <Trash2 color="white" size={18} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Image Gallery</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={pickImage}>
                        <ImageIcon color={isDark ? colors.secondary : 'white'} size={24} />
                        <Text style={[styles.actionButtonText, { color: isDark ? colors.secondary : 'white' }]}>
                            Choose from Gallery
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]} onPress={takePhoto}>
                        <Camera color={isDark ? colors.secondary : colors.primary} size={24} />
                        <Text style={[styles.actionButtonText, { color: isDark ? colors.secondary : colors.primary }]}>
                            Take Photo
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        💡 The first image will be your restaurant's primary photo shown in search results
                    </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Your Photos ({images.length})</Text>

                <FlatList
                    data={images}
                    renderItem={renderImage}
                    keyExtractor={(item, index) => index.toString()}
                    numColumns={2}
                    scrollEnabled={false}
                    columnWrapperStyle={styles.row}
                />

                <View style={styles.bottomSpace} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    content: { flex: 1, padding: 20 },
    actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
    },
    actionButtonText: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700' },
    infoBox: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        marginBottom: 24,
    },
    infoText: { ...TYPOGRAPHY.bodySmall, lineHeight: 20 },
    sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: 16 },
    row: { gap: 12, marginBottom: 12 },
    imageContainer: { flex: 1, aspectRatio: 1, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    galleryImage: { width: '100%', height: '100%' },
    primaryBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    primaryText: { fontSize: 10, fontWeight: '700' },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSpace: { height: 40 },
});

export default ImageGalleryScreen;
