import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, TextInput, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { ChevronLeft, Layout, Edit3, Move, Plus, Trash2, Eye, Save, X, ChevronUp, ChevronDown, Check, Zap, HandMetal } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { restaurantService, cmsService } from '../services/api';
import { RestaurantDTO, HomepageSectionDTO } from '../types/dto';
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

    const [sections, setSections] = useState<HomepageSectionDTO[]>([]);
    const [allRestaurants, setAllRestaurants] = useState<RestaurantDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<HomepageSectionDTO>>({});

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [sectRes, restRes] = await Promise.all([
                cmsService.getAdminSections(),
                restaurantService.getAll()
            ]);
            setSections(sectRes || []);
            setAllRestaurants(restRes || []);
        } catch (e) {
            console.error('[AdminCMS] Fetch error:', e);
            Alert.alert('Error', 'Failed to load CMS data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Add Restaurant Modal
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
    const [restaurantSearch, setRestaurantSearch] = useState('');

    // Preview Modal
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [previewSection, setPreviewSection] = useState<HomepageSectionDTO | null>(null);

    const handleCreateSection = async () => {
        try {
            const newSection = await cmsService.createSection({
                title: 'New Section',
                subtitle: 'Add a description...',
                type: 'DYNAMIC',
                criteria: 'TOP_RATED',
                order: sections.length,
                active: true
            });
            setSections([...sections, newSection]);
            handleEdit(newSection);
        } catch (e) {
            Alert.alert('Error', 'Failed to create section.');
        }
    };

    const handleDeleteSection = (id: string) => {
        Alert.alert('Delete Section', 'Are you sure you want to remove this homepage section?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await cmsService.deleteSection(id);
                        setSections(prev => prev.filter(s => s.id !== id));
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete section.');
                    }
                } 
            }
        ]);
    };

    const handleEdit = (section: HomepageSectionDTO) => {
        setEditingId(section.id);
        setEditData(section);
    };

    const handleSave = async () => {
        if (!editingId || !editData) return;
        try {
            const updated = await cmsService.updateSection(editingId, editData);
            setSections(prev => prev.map(s => s.id === editingId ? updated : s));
            setEditingId(null);
            Alert.alert('Saved', 'Section updated successfully.');
        } catch (e) {
            Alert.alert('Error', 'Failed to save changes.');
        }
    };

    const handleUpdateField = (field: keyof HomepageSectionDTO, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const handleRemoveRestaurant = (restaurantId: string) => {
        const newIds = (editData.restaurantIds || []).filter(id => id !== restaurantId);
        handleUpdateField('restaurantIds', newIds);
    };

    const handleReorderRestaurant = (index: number, direction: 'up' | 'down') => {
        const newIds = [...(editData.restaurantIds || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newIds.length) {
            const temp = newIds[index];
            newIds[index] = newIds[targetIndex];
            newIds[targetIndex] = temp;
            handleUpdateField('restaurantIds', newIds);
        }
    };

    const handleAddRestaurant = (restaurantId: string) => {
        const currentIds = editData.restaurantIds || [];
        if (!currentIds.includes(restaurantId)) {
            handleUpdateField('restaurantIds', [...currentIds, restaurantId]);
        }
        setIsAddModalVisible(false);
        setRestaurantSearch('');
    };

    const openPreview = async (section: HomepageSectionDTO) => {
        // Fetch preview data (resolved)
        try {
            // We use sections from getActiveSections for preview or just resolve locally
            setPreviewSection(section);
            setIsPreviewVisible(true);
        } catch (e) {}
    };

    const toggleSectionVisibility = async (id: string, current: boolean) => {
        try {
            const updated = await cmsService.updateSection(id, { active: !current });
            setSections(prev => prev.map(s => s.id === id ? updated : s));
        } catch (e) {
            Alert.alert('Error', 'Failed to toggle visibility.');
        }
    };

    const renderSectionItem = ({ item }: { item: HomepageSectionDTO }) => {
        const isEditing = editingId === item.id;
        const displayData = isEditing ? editData : item;
        
        return (
            <View style={[styles.card, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <View style={styles.cardHeader}>
                    {isEditing ? (
                        <View style={styles.editForm}>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.gray + '50' }]}
                                value={editData.title}
                                onChangeText={(t) => handleUpdateField('title', t)}
                                placeholder="Section Title"
                            />
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.gray + '50' }]}
                                value={editData.subtitle}
                                onChangeText={(t) => handleUpdateField('subtitle', t)}
                                placeholder="Subtitle"
                            />
                            
                            <View style={styles.typeSelector}>
                                <TouchableOpacity 
                                    style={[styles.typeBtn, editData.type === 'DYNAMIC' && { backgroundColor: colors.primary }]}
                                    onPress={() => handleUpdateField('type', 'DYNAMIC')}
                                >
                                    <Zap size={16} color={editData.type === 'DYNAMIC' ? 'white' : colors.text} />
                                    <Text style={[styles.typeBtnText, { color: editData.type === 'DYNAMIC' ? 'white' : colors.text }]}>Automatic</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.typeBtn, editData.type === 'MANUAL' && { backgroundColor: colors.primary }]}
                                    onPress={() => handleUpdateField('type', 'MANUAL')}
                                >
                                    <HandMetal size={16} color={editData.type === 'MANUAL' ? 'white' : colors.text} />
                                    <Text style={[styles.typeBtnText, { color: editData.type === 'MANUAL' ? 'white' : colors.text }]}>Manual</Text>
                                </TouchableOpacity>
                            </View>

                            {editData.type === 'DYNAMIC' && (
                                <View style={styles.criteriaList}>
                                    {['TOP_RATED', 'NEW_COMERS', 'EXCLUSIVE'].map((c) => (
                                        <TouchableOpacity 
                                            key={c}
                                            onPress={() => handleUpdateField('criteria', c)}
                                            style={[styles.criteriaBtn, { borderColor: colors.secondary, backgroundColor: editData.criteria === c ? colors.secondary : 'transparent' }]}
                                        >
                                            <Text style={[styles.criteriaBtnText, { color: editData.criteria === c ? colors.primary : colors.secondary }]}>
                                                {c.replace('_', ' ')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.headerInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.collectionTitle, { color: colors.text }]}>{item.title}</Text>
                                <View style={[styles.badge, { backgroundColor: item.type === 'DYNAMIC' ? colors.secondary + '30' : colors.primary + '30' }]}>
                                    <Text style={[styles.badgeText, { color: item.type === 'DYNAMIC' ? colors.secondary : colors.primary }]}>
                                        {item.type}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.collectionSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                        </View>
                    )}
                    
                    <View style={styles.headerActions}>
                        {isEditing ? (
                            <View style={{ gap: 8 }}>
                                <TouchableOpacity onPress={handleSave} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                                    <Save color={isDark ? colors.secondary : 'white'} size={18} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditingId(null)} style={[styles.actionBtn, { backgroundColor: colors.gray + '20' }]}>
                                    <X color={colors.text} size={18} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ gap: 8 }}>
                                <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionBtn, { backgroundColor: colors.secondary + '20' }]}>
                                    <Edit3 color={colors.secondary} size={18} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => toggleSectionVisibility(item.id, item.active)} style={[styles.actionBtn, { backgroundColor: item.active ? '#10B98120' : '#EF444420' }]}>
                                    <Eye color={item.active ? '#10B981' : '#EF4444'} size={18} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteSection(item.id)} style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}>
                                    <Trash2 color="#EF4444" size={18} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {displayData.type === 'MANUAL' && (
                    <>
                        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Selected Restaurants ({displayData.restaurantIds?.length || 0})</Text>
                        
                        <View style={styles.restaurantList}>
                            {(displayData.restaurantIds || []).map((id, index) => {
                                const restaurant = allRestaurants.find(r => r.id === id);
                                return (
                                    <View key={id} style={[styles.restaurantRow, { borderBottomColor: colors.gray + '20' }]}>
                                        <View style={styles.rowLeft}>
                                            <Text style={[styles.indexText, { color: colors.textSecondary }]}>{index + 1}</Text>
                                            <Text style={[styles.rowText, { color: colors.text }]} numberOfLines={1}>{restaurant?.name || 'Unknown'}</Text>
                                        </View>
                                        {isEditing && (
                                            <View style={styles.rowActions}>
                                                <TouchableOpacity onPress={() => handleReorderRestaurant(index, 'up')} disabled={index === 0}>
                                                    <ChevronUp color={index === 0 ? colors.gray + '50' : colors.textSecondary} size={20} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleReorderRestaurant(index, 'down')} disabled={index === (displayData.restaurantIds?.length || 0) - 1}>
                                                    <ChevronDown color={index === (displayData.restaurantIds?.length || 0) - 1 ? colors.gray + '50' : colors.textSecondary} size={20} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleRemoveRestaurant(id)}>
                                                    <X color="#EF4444" size={18} />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                            {isEditing && (
                                <TouchableOpacity 
                                    style={[styles.addButton, { borderColor: colors.secondary, borderStyle: 'dashed' }]}
                                    onPress={() => {
                                        setTargetSectionId(item.id);
                                        setIsAddModalVisible(true);
                                    }}
                                >
                                    <Plus color={colors.secondary} size={20} />
                                    <Text style={[styles.addButtonText, { color: colors.secondary }]}>Add Restaurant</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}

                {!isEditing && (
                    <View style={styles.footerActions}>
                        <TouchableOpacity onPress={() => openPreview(item)} style={styles.footerBtn}>
                            <Eye color={colors.primary} size={18} />
                            <Text style={[styles.footerBtnText, { color: colors.primary }]}>View Configuration</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Homepage CMS</Text>
                <TouchableOpacity onPress={handleCreateSection}>
                    <Plus color={colors.primary} size={28} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSectionItem}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <View style={styles.cmsStats}>
                                <Layout size={20} color={colors.secondary} />
                                <Text style={[styles.statusInfo, { color: colors.textSecondary }]}>
                                    {sections.length} Configured Sections
                                </Text>
                            </View>
                        </View>
                    }
                />
            )}

            {/* Add Restaurant Modal */}
            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Select Restaurant</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                <X color={colors.text} size={24} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={[styles.searchBox, { backgroundColor: colors.white }]}>
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search by name or cuisine..."
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
                        <Text style={[TYPOGRAPHY.bodySmall, { color: colors.gray, textAlign: 'center', marginBottom: 20 }]}>PREVIEW DATA</Text>
                        
                        {previewSection && (
                            <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: 20 }}>
                                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>{previewSection.title}</Text>
                                <Text style={[TYPOGRAPHY.bodySmall, { color: colors.textSecondary, marginBottom: 16 }]}>{previewSection.subtitle}</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Type: {previewSection.type}</Text>
                                {previewSection.type === 'DYNAMIC' && <Text style={{ fontSize: 12, color: colors.textSecondary }}>Criteria: {previewSection.criteria}</Text>}
                            </View>
                        )}

                        <TouchableOpacity 
                            style={[styles.donePreview, { backgroundColor: colors.primary }]}
                            onPress={() => setIsPreviewVisible(false)}
                        >
                            <Text style={{ color: 'white', fontWeight: '800' }}>CLOSE</Text>
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
    editForm: { flex: 1, gap: 12 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
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
    
    // Type and Criteria selectors
    typeSelector: { flexDirection: 'row', gap: 8, marginTop: 4 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1' },
    typeBtnText: { fontSize: 12, fontWeight: '700' },
    criteriaList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    criteriaBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    criteriaBtnText: { fontSize: 10, fontWeight: '800' },

    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '800' },

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
