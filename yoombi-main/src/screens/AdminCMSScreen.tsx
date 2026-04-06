import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, TextInput, Modal, Dimensions } from 'react-native';
import { ChevronLeft, Layout, Edit3, Move, Plus, Trash2, Eye, Save, X, ChevronUp, ChevronDown, Check } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { restaurantService } from '../services/api';
import { RestaurantDTO } from '../types/dto';
import CuratedCollection from '../components/CuratedCollection';

const { width, height } = Dimensions.get('window');

const AdminCMSScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }
    const [collections, setCollections] = useState<{id: string, title: string, subtitle: string, restaurantIds: string[]}[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ title: '', subtitle: '' });
    const [allRestaurants, setAllRestaurants] = useState<RestaurantDTO[]>([]);

    React.useEffect(() => {
        restaurantService.getAll()
            .then(res => setAllRestaurants(res.data || (res as any) || []))
            .catch(e => console.warn('[AdminCMS] Failed to fetch restaurants:', e));
    }, []);
    
    // Add Restaurant Modal
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [targetCollectionId, setTargetCollectionId] = useState<string | null>(null);
    const [restaurantSearch, setRestaurantSearch] = useState('');

    // Preview Modal
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [previewCollection, setPreviewCollection] = useState<{id: string, title: string, subtitle: string, restaurantIds: string[]} | null>(null);

    // Create New Collection
    const handleCreateCollection = () => {
        const newId = `c${collections.length + 1}`;
        const newCollection = {
            id: newId,
            title: 'New Collection',
            subtitle: 'Description here',
            restaurantIds: [],
        };
        setCollections([newCollection, ...collections]);
        handleEdit(newCollection);
    };

    const handleDeleteCollection = (id: string) => {
        Alert.alert('Delete Collection', 'Are you sure you want to remove this curated list?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: () => setCollections(prev => prev.filter(c => c.id !== id)) 
            }
        ]);
    };

    const handleEdit = (collection: {id: string, title: string, subtitle: string, restaurantIds: string[]}) => {
        setEditingId(collection.id);
        setEditData({ title: collection.title, subtitle: collection.subtitle });
    };

    const handleSave = () => {
        setCollections(prev => prev.map(c => c.id === editingId ? { ...c, ...editData } : c));
        setEditingId(null);
        Alert.alert('Saved', 'Collection info updated.');
    };

    const handleRemoveRestaurant = (collectionId: string, restaurantId: string) => {
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId) {
                return { ...c, restaurantIds: c.restaurantIds.filter(id => id !== restaurantId) };
            }
            return c;
        }));
    };

    const handleReorder = (collectionId: string, index: number, direction: 'up' | 'down') => {
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId) {
                const newIds = [...c.restaurantIds];
                const targetIndex = direction === 'up' ? index - 1 : index + 1;
                if (targetIndex >= 0 && targetIndex < newIds.length) {
                    const temp = newIds[index];
                    newIds[index] = newIds[targetIndex];
                    newIds[targetIndex] = temp;
                    return { ...c, restaurantIds: newIds };
                }
            }
            return c;
        }));
    };

    const handleAddRestaurant = (restaurantId: string) => {
        if (!targetCollectionId) return;
        setCollections(prev => prev.map(c => {
            if (c.id === targetCollectionId && !c.restaurantIds.includes(restaurantId)) {
                return { ...c, restaurantIds: [...c.restaurantIds, restaurantId] };
            }
            return c;
        }));
        setIsAddModalVisible(false);
        setRestaurantSearch('');
    };

    const openPreview = (collection: {id: string, title: string, subtitle: string, restaurantIds: string[]}) => {
        setPreviewCollection(collection);
        setIsPreviewVisible(true);
    };

    const renderCollectionItem = ({ item }: { item: {id: string, title: string, subtitle: string, restaurantIds: string[]} }) => {
        const isEditing = editingId === item.id;
        
        return (
            <View style={[styles.card, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <View style={styles.cardHeader}>
                    {isEditing ? (
                        <View style={styles.editForm}>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.gray + '50' }]}
                                value={editData.title}
                                onChangeText={(t) => setEditData(prev => ({ ...prev, title: t }))}
                                placeholder="Collection Title"
                            />
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.gray + '50' }]}
                                value={editData.subtitle}
                                onChangeText={(t) => setEditData(prev => ({ ...prev, subtitle: t }))}
                                placeholder="Subtitle"
                            />
                        </View>
                    ) : (
                        <View style={styles.headerInfo}>
                            <Text style={[styles.collectionTitle, { color: colors.text }]}>{item.title}</Text>
                            <Text style={[styles.collectionSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                        </View>
                    )}
                    
                    <View style={styles.headerActions}>
                        {isEditing ? (
                            <TouchableOpacity onPress={handleSave} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                                <Save color={isDark ? colors.secondary : 'white'} size={18} />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionBtn, { backgroundColor: colors.secondary + '20' }]}>
                                    <Edit3 color={colors.secondary} size={18} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteCollection(item.id)} style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}>
                                    <Trash2 color="#EF4444" size={18} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Restaurants Order ({item.restaurantIds.length})</Text>
                
                <View style={styles.restaurantList}>
                    {item.restaurantIds.map((id, index) => {
                        const restaurant = allRestaurants.find(r => r.id === id);
                        return (
                            <View key={id} style={[styles.restaurantRow, { borderBottomColor: colors.gray + '20' }]}>
                                <View style={styles.rowLeft}>
                                    <Text style={[styles.indexText, { color: colors.textSecondary }]}>{index + 1}</Text>
                                    <Text style={[styles.rowText, { color: colors.text }]} numberOfLines={1}>{restaurant?.name || 'Unknown'}</Text>
                                </View>
                                <View style={styles.rowActions}>
                                    <TouchableOpacity onPress={() => handleReorder(item.id, index, 'up')} disabled={index === 0}>
                                        <ChevronUp color={index === 0 ? colors.gray + '50' : colors.textSecondary} size={20} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleReorder(item.id, index, 'down')} disabled={index === item.restaurantIds.length - 1}>
                                        <ChevronDown color={index === item.restaurantIds.length - 1 ? colors.gray + '50' : colors.textSecondary} size={20} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleRemoveRestaurant(item.id, id)}>
                                        <X color="#EF4444" size={18} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                    <TouchableOpacity 
                        style={[styles.addButton, { borderColor: colors.secondary, borderStyle: 'dashed' }]}
                        onPress={() => {
                            setTargetCollectionId(item.id);
                            setIsAddModalVisible(true);
                        }}
                    >
                        <Plus color={colors.secondary} size={20} />
                        <Text style={[styles.addButtonText, { color: colors.secondary }]}>Add Restaurant</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerActions}>
                    <TouchableOpacity onPress={() => openPreview(item)} style={styles.footerBtn}>
                        <Eye color={colors.primary} size={18} />
                        <Text style={[styles.footerBtnText, { color: colors.primary }]}>Preview on Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const filteredRestaurants = allRestaurants.filter(r => 
        r.name.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(restaurantSearch.toLowerCase())
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Content CMS</Text>
                <TouchableOpacity onPress={handleCreateCollection}>
                    <Plus color={colors.primary} size={28} />
                </TouchableOpacity>
            </View>

            {/* This uses the local CuratedCollection component which dynamically fetches internally anyway */}
            
            <FlatList
                data={collections}
                keyExtractor={(item) => item.id}
                renderItem={renderCollectionItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <View style={styles.cmsStats}>
                            <Layout size={20} color={colors.secondary} />
                            <Text style={[styles.statusInfo, { color: colors.textSecondary }]}>
                                {collections.length} Current Curated Highlights
                            </Text>
                        </View>
                    </View>
                }
            />

            {/* Add Restaurant Modal */}
            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Add to Collection</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                <X color={colors.text} size={24} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={[styles.searchBox, { backgroundColor: colors.white }]}>
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search restaurants..."
                                value={restaurantSearch}
                                onChangeText={setRestaurantSearch}
                            />
                        </View>

                        <ScrollView style={styles.modalList}>
                            {filteredRestaurants.map(r => (
                                <TouchableOpacity 
                                    key={r.id} 
                                    style={[styles.modalItem, { borderBottomColor: colors.gray + '20' }]}
                                    onPress={() => handleAddRestaurant(r.id)}
                                >
                                    <View>
                                        <Text style={[styles.modalItemTitle, { color: colors.text }]}>{r.name}</Text>
                                        <Text style={[styles.modalItemSub, { color: colors.textSecondary }]}>{r.cuisine} • {r.rating}★</Text>
                                    </View>
                                    <Plus color={colors.secondary} size={20} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Preview Modal */}
            <Modal visible={isPreviewVisible} animationType="fade" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                    <View style={styles.previewContainer}>
                        <TouchableOpacity style={styles.closePreview} onPress={() => setIsPreviewVisible(false)}>
                            <X color="white" size={32} />
                        </TouchableOpacity>
                        <Text style={[TYPOGRAPHY.bodySmall, { color: colors.gray, textAlign: 'center', marginBottom: 20 }]}>HOMEPAGE PREVIEW</Text>
                        {previewCollection && (
                             <CuratedCollection
                                title={previewCollection.title}
                                subtitle={previewCollection.subtitle}
                                data={previewCollection.restaurantIds.map(id => allRestaurants.find(r => r.id === id)).filter(Boolean) as any[]}
                                onPressItem={() => {}}
                            />
                        )}
                        <TouchableOpacity 
                            style={[styles.donePreview, { backgroundColor: colors.primary }]}
                            onPress={() => setIsPreviewVisible(false)}
                        >
                            <Text style={{ color: 'white', fontWeight: '800' }}>CLOSE PREVIEW</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.light,
    },
    listContent: { padding: 16, paddingBottom: 100 },
    listHeader: { marginBottom: 20 },
    cmsStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusInfo: { ...TYPOGRAPHY.bodySmall, fontStyle: 'italic' },
    card: { borderRadius: 24, padding: 20, marginBottom: 20, ...SHADOWS.medium },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerInfo: { flex: 1 },
    editForm: { flex: 1, gap: 8 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 },
    collectionTitle: { ...TYPOGRAPHY.h3, fontSize: 18, marginBottom: 4 },
    collectionSubtitle: { fontSize: 12 },
    headerActions: { marginLeft: 16 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, marginVertical: 16 },
    sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 0.5 },
    restaurantList: { gap: 8 },
    restaurantRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    indexText: { fontSize: 12, fontWeight: '800', width: 20 },
    rowText: { fontSize: 14, fontWeight: '600', flex: 1 },
    rowActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    addButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        paddingVertical: 14, 
        borderWidth: 1, 
        borderRadius: 16,
        marginTop: 12
    },
    addButtonText: { fontSize: 14, fontWeight: '700' },
    footerActions: { marginTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 },
    footerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    footerBtnText: { fontSize: 14, fontWeight: '800' },
    
    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    searchBox: { borderRadius: 16, padding: 12, marginBottom: 16, ...SHADOWS.small },
    searchInput: { fontSize: 14 },
    modalList: { flex: 1 },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    modalItemTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    modalItemSub: { fontSize: 12 },
    
    // Preview
    previewContainer: { flex: 1, justifyContent: 'center', padding: 20 },
    closePreview: { alignSelf: 'center', marginBottom: 40 },
    donePreview: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 40 },
});

export default AdminCMSScreen;
