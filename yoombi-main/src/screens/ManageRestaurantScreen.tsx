import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { ChevronLeft, Save, MapPin, Clock, Phone, Mail, Plus, X, Camera } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useToast } from '../context/ToastContext';

import { restaurantService } from '../services/api';
import { RestaurantDTO } from '../types/dto';

const ManageRestaurantScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useTheme();
    const { currentRestaurant: contextRestaurant, updateRestaurantInfo, addRestaurantImage, removeRestaurantImage, refreshRestaurant } = useRestaurant();
    const toast = useToast();
    
    // Support Admin management by checking for a passed restaurantId
    const targetId = navigation.getState().routes.find((r: any) => r.name === 'ManageRestaurant')?.params?.restaurantId;
    const [remoteRestaurant, setRemoteRestaurant] = useState<RestaurantDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const currentRestaurant = targetId ? remoteRestaurant : contextRestaurant;

    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        cuisine: '',
        area: '',
        city: '',
        hours: '', 
        phone: '',
        email: '',
        vibe: '',
        dressCode: '',
    });

    useEffect(() => {
        if (targetId) {
            setIsLoading(true);
            restaurantService.getById(targetId)
                .then(res => setRemoteRestaurant(res))
                .catch(e => toast.error('Error', 'Failed to fetch restaurant data.'))
                .finally(() => setIsLoading(false));
        }
    }, [targetId]);

    useEffect(() => {
        if (currentRestaurant) {
            setFormData((prev: any) => ({
                ...prev,
                name: currentRestaurant.name,
                description: currentRestaurant.description,
                cuisine: currentRestaurant.cuisine,
                area: currentRestaurant.area,
                city: currentRestaurant.city,
                phone: currentRestaurant.phone || '',
                email: currentRestaurant.email || '',
                vibe: currentRestaurant.vibe || '',
                dressCode: currentRestaurant.dressCode || '',
            }));
        }
    }, [currentRestaurant]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updateData = {
                name: formData.name,
                description: formData.description,
                cuisine: formData.cuisine,
                area: formData.area,
                city: formData.city,
                phone: formData.phone,
                email: formData.email,
                vibe: formData.vibe,
                dressCode: formData.dressCode,
            };

            if (targetId) {
                await restaurantService.update(targetId, updateData);
                toast.success('Changes Saved', 'Restaurant profile updated by Admin.');
            } else {
                await updateRestaurantInfo(updateData);
                toast.success('Changes Saved', 'Your restaurant profile has been updated.');
            }
            navigation.goBack();
        } catch (error) {
            toast.error('Save Failed', 'Could not save restaurant details.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddImage = async () => {
        if (!currentRestaurant) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setIsSaving(true);
            try {
                if (targetId) {
                    await restaurantService.uploadImage(targetId, result.assets[0].uri);
                    const updated = await restaurantService.getById(targetId);
                    setRemoteRestaurant(updated);
                } else {
                    await addRestaurantImage(result.assets[0].uri);
                }
                toast.success('Gallery Updated', 'Image added successfully.');
            } catch (error) {
                toast.error('Upload Failed', 'Could not add image.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleRemoveImage = (url: string) => {
        Alert.alert('Remove Image', 'Are you sure you want to remove this image from the gallery?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: async () => {
                try {
                    if (targetId) {
                        await restaurantService.deleteImage(targetId, url);
                        const updated = await restaurantService.getById(targetId);
                        setRemoteRestaurant(updated);
                    } else {
                        await removeRestaurantImage(url);
                    }
                    toast.success('Gallery Updated', 'Image removed.');
                } catch (error) {
                    toast.error('Error', 'Failed to remove image.');
                }
            }},
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Restaurant Profile</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Save color={colors.secondary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Basic Information</Text>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Restaurant Name</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        multiline
                        numberOfLines={4}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Cuisine Type</Text>
                    <Text style={[styles.helpText, { color: colors.textSecondary + '80', marginBottom: 8 }]}>e.g. Contemporary African, Italian, Asian Fusion</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        value={formData.cuisine}
                        onChangeText={(text) => setFormData({ ...formData, cuisine: text })}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Establishment Vibe</Text>
                    <Text style={[styles.helpText, { color: colors.textSecondary + '80', marginBottom: 8 }]}>e.g. Rooftop, Romantic, Business, Intimate</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        value={formData.vibe}
                        onChangeText={(text) => setFormData({ ...formData, vibe: text })}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Dress Code Protocol</Text>
                    <Text style={[styles.helpText, { color: colors.textSecondary + '80', marginBottom: 8 }]}>e.g. Formal, Smart Casual, Casual</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        value={formData.dressCode}
                        onChangeText={(text) => setFormData({ ...formData, dressCode: text })}
                    />

                </View>

                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Location & Contact</Text>

                    <View style={styles.iconInput}>
                        <MapPin color={colors.secondary} size={20} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Area</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, marginBottom: 0 }]}
                                value={formData.area}
                                onChangeText={(text) => setFormData({ ...formData, area: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.iconInput}>
                        <MapPin color={colors.secondary} size={20} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, marginBottom: 0 }]}
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.iconInput}>
                        <Clock color={colors.secondary} size={20} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Operating Hours</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, marginBottom: 0 }]}
                                value={formData.hours}
                                onChangeText={(text) => setFormData({ ...formData, hours: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.iconInput}>
                        <Phone color={colors.secondary} size={20} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, marginBottom: 0 }]}
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.iconInput}>
                        <Mail color={colors.secondary} size={20} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, marginBottom: 0 }]}
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                keyboardType="email-address"
                            />
                        </View>
                    </View>
                </View>

                {/* Gallery Section */}
                <View style={[styles.section, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 0 }]}>Restaurant Gallery</Text>
                        <TouchableOpacity 
                            onPress={handleAddImage}
                            style={[styles.smallAddButton, { backgroundColor: colors.secondary + '20' }]}
                        >
                            <Plus color={colors.secondary} size={20} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {currentRestaurant?.images && currentRestaurant.images.length > 0 ? (
                            currentRestaurant.images.map((img: string, idx: number) => (
                                <View key={idx} style={styles.galleryItem}>
                                    <Image source={{ uri: img }} style={styles.galleryImage} />
                                    <TouchableOpacity 
                                        style={styles.deleteImageButton}
                                        onPress={() => handleRemoveImage(img)}
                                    >
                                        <X color="white" size={14} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <TouchableOpacity style={styles.emptyGallery} onPress={handleAddImage}>
                                <Camera color={colors.textSecondary} size={24} />
                                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>Add Photos</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]} 
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={isDark ? colors.secondary : 'white'} size="small" />
                    ) : (
                        <>
                            <Save color={isDark ? colors.secondary : 'white'} size={20} />
                            <Text style={[styles.saveButtonText, { color: isDark ? colors.secondary : 'white' }]}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>

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
    section: { padding: 20, borderRadius: 24, marginBottom: 20, ...SHADOWS.light },
    sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: 20 },
    label: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    input: {
        ...TYPOGRAPHY.bodyMedium,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    helpText: { fontSize: 12, fontWeight: '400', marginLeft: 4 },
    textArea: { height: 100, textAlignVertical: 'top' },
    iconInput: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 8 },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 18,
        borderRadius: 16,
        ...SHADOWS.medium,
    },
    saveButtonText: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700' },
    bottomSpace: { height: 40 },
    smallAddButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryItem: {
        width: 140,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    galleryImage: { width: '100%', height: '100%' },
    deleteImageButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyGallery: {
        width: 140,
        height: 90,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ManageRestaurantScreen;
