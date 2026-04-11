import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Plus, Edit2, Trash2, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant, MenuItem } from '../context/RestaurantContext';
import { uploadImage, menuService } from '../services/api';

const MenuManagementScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { menuItems: contextItems, addMenuItem, updateMenuItem, deleteMenuItem } = useRestaurant();
    
    // Support Admin management by checking for a passed restaurantId
    const targetId = navigation.getState().routes.find((r: any) => r.name === 'MenuManagement')?.params?.restaurantId;
    const [remoteItems, setRemoteItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const items = targetId ? remoteItems : contextItems;

    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Main Course',
        image: '',
        available: true,
    });

    const categories = ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Special'];

    const fetchItems = async () => {
        if (!targetId) return;
        setIsLoading(true);
        try {
            const res = await menuService.getItems(targetId);
            const formatted = (res as any).map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price ? `RWF ${item.price.toLocaleString()}` : null,
                category: item.category,
                image: item.imageUrl,
                available: item.available
            }));
            setRemoteItems(formatted);
        } catch (e) {
            console.warn('[MenuManagement] Failed to fetch items:', e);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchItems();
    }, [targetId]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData({ ...formData, image: result.assets[0].uri });
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            Alert.alert('Missing field', 'Please provide at least an item name.');
            return;
        }

        // Extract numbers from price string for the raw value
        const numericPrice = formData.price.replace(/[^0-9]/g, '');
        const priceRaw = numericPrice ? parseInt(numericPrice, 10) : null;

        setIsSaving(true);
        try {
            let finalImageUrl = formData.image;
            // If it's a local URI, upload it first
            if (formData.image && (formData.image.startsWith('file://') || formData.image.startsWith('content://'))) {
                try {
                    finalImageUrl = await uploadImage(formData.image);
                } catch (uploadErr) {
                    console.error('Menu image upload failed:', uploadErr);
                    // Fallback to empty or keep the local one (which might fail on backend)
                    // Better to fail early
                    Alert.alert('Upload Error', 'Failed to upload the menu photo to the cloud.');
                    setIsSaving(false);
                    return;
                }
            }

            if (editingId) {
                if (targetId) {
                    await menuService.updateItem(targetId, editingId, { ...formData, image: finalImageUrl, price: priceRaw });
                    await fetchItems();
                } else {
                    await updateMenuItem(editingId, { ...formData, image: finalImageUrl, priceRaw });
                }
                setEditingId(null);
            } else {
                if (targetId) {
                    await menuService.addItem(targetId, { ...formData, image: finalImageUrl, price: priceRaw });
                    await fetchItems();
                } else {
                    await addMenuItem({ ...formData, image: finalImageUrl, priceRaw });
                }
            }

            setFormData({ name: '', description: '', price: '', category: 'Main Course', image: '', available: true });
            setIsAdding(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to save menu item.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (item: MenuItem) => {
        setFormData({
            name: item.name,
            description: item.description,
            price: item.price || '',
            category: item.category,
            image: item.image || '',
            available: item.available,
        });
        setEditingId(item.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Delete Item',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            if (targetId) {
                                await menuService.deleteItem(targetId, id);
                                await fetchItems();
                            } else {
                                await deleteMenuItem(id);
                            }
                        } catch (e) { Alert.alert('Error', 'Failed to delete item.'); }
                    },
                    style: 'destructive'
                },
            ]
        );
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', description: '', price: '', category: 'Main Course', image: '', available: true });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Menu Management</Text>
                <TouchableOpacity onPress={() => setIsAdding(true)}>
                    <Plus color={colors.secondary} size={28} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {isAdding && (
                    <View style={[styles.formCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                        <View style={styles.formHeader}>
                            <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>
                                {editingId ? 'Edit Item' : 'Add New Item'}
                            </Text>
                            <TouchableOpacity onPress={handleCancel}>
                                <X color={colors.textSecondary} size={24} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.imagePicker, { backgroundColor: colors.background }]} onPress={pickImage}>
                            {formData.image ? (
                                <Image source={{ uri: formData.image }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.imagePickerContent}>
                                    <Camera color={colors.secondary} size={32} />
                                    <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="Item Name"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="Description"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            multiline
                            numberOfLines={3}
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="Price (optional, e.g., 15,000 RWF)"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.price}
                            onChangeText={(text) => setFormData({ ...formData, price: text })}
                        />

                        <View style={styles.categoryRow}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        { backgroundColor: formData.category === cat ? colors.secondary : colors.background },
                                    ]}
                                    onPress={() => setFormData({ ...formData, category: cat })}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            { color: formData.category === cat ? (isDark ? colors.primary : 'white') : colors.textSecondary },
                                        ]}
                                    >
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]} 
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={isDark ? colors.secondary : 'white'} size="small" />
                            ) : (
                                <Text style={[styles.saveButtonText, { color: isDark ? colors.secondary : 'white' }]}>
                                    {editingId ? 'Update Item' : 'Add to Menu'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Current Menu ({items.length} items)</Text>

                {isLoading && <ActivityIndicator size="large" color={colors.secondary} style={{ marginVertical: 20 }} />}
                
                {items.map((item) => (
                    <View key={item.id} style={[styles.menuItem, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                        {item.image && <Image source={{ uri: item.image }} style={styles.itemImage} />}
                        <View style={styles.itemInfo}>
                            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                            {item.description && (
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            )}
                            <View style={styles.itemFooter}>
                                <Text style={[styles.itemPrice, { color: colors.secondary }]}>{item.price || 'Price on inquiry'}</Text>
                                <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{item.category}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.itemActions}>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background }]} onPress={() => handleEdit(item)}>
                                <Edit2 color={colors.primary} size={18} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
                                onPress={() => handleDelete(item.id, item.name)}
                            >
                                <Trash2 color="#EF4444" size={18} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

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
    listContent: { paddingBottom: 100 },
    formCard: { padding: 20, borderRadius: 24, marginBottom: 24, ...SHADOWS.medium },
    formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    imagePicker: { height: 180, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
    imagePickerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    imagePickerText: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600' },
    previewImage: { width: '100%', height: '100%' },
    input: {
        ...TYPOGRAPHY.bodyMedium,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    categoryText: { fontSize: 12, fontWeight: '600' },
    saveButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700' },
    sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: 16 },
    menuItem: { flexDirection: 'row', padding: 12, borderRadius: 16, marginBottom: 12, ...SHADOWS.light },
    itemImage: { width: 80, height: 80, borderRadius: 12, marginRight: 12 },
    itemInfo: { flex: 1 },
    itemName: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700', marginBottom: 4 },
    itemDescription: { ...TYPOGRAPHY.bodySmall, marginBottom: 8 },
    itemFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemPrice: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700' },
    categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    categoryBadgeText: { fontSize: 10, fontWeight: '600' },
    itemActions: { gap: 8 },
    actionButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    bottomSpace: { height: 40 },
});

export default MenuManagementScreen;
