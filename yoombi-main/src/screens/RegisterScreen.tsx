import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, KeyboardAvoidingView, Platform, Dimensions, ImageBackground, Image } from 'react-native';
import { ChevronLeft, User, Mail, Lock, Store, Shield, Phone, AtSign, CheckCircle2, MapPin, Search, Compass, Heart, Eye, EyeOff, Check, X, Circle, Camera, Image as ImageIcon, RefreshCw, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { SHADOWS, SIZES, TYPOGRAPHY } from '../constants/theme';
import { useAuth, UserRole } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isStrongPassword, getPasswordRequirements } from '../utils/validation';
import { authService } from '../services/api';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }: any) => {
    const { signIn } = useAuth();
    const { colors, isDark } = useTheme();
    const [role, setRole] = useState<UserRole>('USER');
    const [step, setStep] = useState(1);

    // Form States
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Detailed Identity States
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [restaurantImage, setRestaurantImage] = useState<string | null>(null);
    const [cuisineInterests, setCuisineInterests] = useState<string[]>([]);
    const [restaurantDescription, setRestaurantDescription] = useState('');
    const [vibe, setVibe] = useState('Elegant');
    const [dressCode, setDressCode] = useState('Smart Casual');
    const [restaurantEmail, setRestaurantEmail] = useState('');
    const [restaurantPhone, setRestaurantPhone] = useState('');

    const cuisines = ['Modern African', 'Italian', 'Asian Fusion', 'French', 'Steakhouse', 'Mediterranean', 'Seafood', 'Japanese'];
    const vibes = ['Elegant', 'Romantic', 'Rooftop', 'Lively', 'Intimate', 'Business', 'Family Friendly'];
    const dressCodes = ['Formal', 'Smart Casual', 'Casual'];

    const toggleCuisine = (c: string) => {
        if (cuisineInterests.includes(c)) {
            setCuisineInterests(cuisineInterests.filter(item => item !== c));
        } else {
            setCuisineInterests([...cuisineInterests, c]);
        }
    };

    const isStepValid = () => {
        if (step === 1) return !!role;
        if (step === 2) {
            const baseValid = fullName.trim() !== '' && username.trim() !== '' && email.includes('@') && phone.trim().length >= 8;
            if (role === 'OWNER') return baseValid && restaurantName.trim() !== '';
            return baseValid;
        }
        if (step === 3) {
            const baseValid = city.trim() !== '' && area.trim() !== '';
            if (role === 'OWNER') return (
                baseValid && 
                latitude.trim() !== '' && 
                longitude.trim() !== '' && 
                restaurantDescription.trim().length >= 10 && 
                cuisineInterests.length > 0 &&
                restaurantEmail.includes('@') &&
                restaurantPhone.trim().length >= 8
            );
            return baseValid && cuisineInterests.length > 0;
        }
        if (step === 4) return isStrongPassword(password);
        return false;
    };

    const handleNextStep = () => {
        if (isStepValid()) {
            setStep(step + 1);
        } else {
            // Optional: Add alert or visual shake
        }
    };

    const handleRegister = async () => {
        if (isStepValid()) {
            try {
                // 1. Trigger the verification code from backend
                await authService.sendVerifyCode(email);
                
                // 2. Navigate to verification screen
                navigation.navigate('EmailVerification', {
                    email,
                    role,
                    password,
                    fullName,
                    phone,
                    restaurantName,
                    city,
                    area,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    restaurantImage,
                    restaurantDescription,
                    restaurantCuisine: cuisineInterests.join(', '),
                    vibe,
                    dressCode,
                    restaurantEmail,
                    restaurantPhone,
                });
            } catch (err: any) {
                // If the email sending fails, we should alert the user
                console.error('[REGISTER] Failed to send verification code:', err);
                // In a real app, use a toast or alert
            }
        }
    };

    const StepIndicator = () => (
        <View style={styles.indicatorContainer}>
            {[1, 2, 3, 4].map((i) => (
                <View
                    key={i}
                    style={[
                        styles.indicator,
                        step >= i ? { backgroundColor: colors.secondary, shadowColor: colors.secondary, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 } : { backgroundColor: 'rgba(255,255,255,0.1)' },
                        { width: step === i ? 40 : 10 }
                    ]}
                />
            ))}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.brandingRow}>
                <Sparkles color={colors.secondary} size={24} />
                <Text style={[styles.stepTitle, { color: colors.white }]}>Choose Your Path</Text>
            </View>
            <Text style={[styles.stepDesc, { color: 'rgba(255,255,255,0.6)' }]}>Discover Rwanda's elite culinary catalog</Text>

            <View style={styles.roleGrid}>
                <TouchableOpacity
                    style={[styles.bigRoleCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }, role === 'USER' && { borderColor: colors.secondary, borderWidth: 2, backgroundColor: 'rgba(197, 160, 89, 0.1)' }]}
                    onPress={() => setRole('USER')}
                    activeOpacity={0.9}
                >
                    <View style={[styles.bigIconCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }, role === 'USER' && { backgroundColor: colors.secondary }]}>
                        <User color={role === 'USER' ? colors.primary : colors.white} size={32} />
                    </View>
                    <Text style={[styles.bigRoleLabel, { color: colors.white }, role === 'USER' && { color: colors.secondary }]}>THE DINER</Text>
                    <Text style={[styles.bigRoleDesc, { color: 'rgba(255,255,255,0.4)' }]}>Discover & rate the finest venues</Text>
                    {role === 'USER' && <View style={[styles.checkBadge, { backgroundColor: colors.secondary }]}><CheckCircle2 size={16} color={colors.primary} /></View>}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.bigRoleCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }, role === 'OWNER' && { borderColor: colors.secondary, borderWidth: 2, backgroundColor: 'rgba(197, 160, 89, 0.1)' }]}
                    onPress={() => setRole('OWNER')}
                    activeOpacity={0.9}
                >
                    <View style={[styles.bigIconCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }, role === 'OWNER' && { backgroundColor: colors.secondary }]}>
                        <Store color={role === 'OWNER' ? colors.primary : colors.white} size={32} />
                    </View>
                    <Text style={[styles.bigRoleLabel, { color: colors.white }, role === 'OWNER' && { color: colors.secondary }]}>RESTAURANT OWNER</Text>
                    <Text style={[styles.bigRoleDesc, { color: 'rgba(255,255,255,0.4)' }]}>Register your restaurant & grow</Text>
                    {role === 'OWNER' && <View style={[styles.checkBadge, { backgroundColor: colors.secondary }]}><CheckCircle2 size={16} color={colors.primary} /></View>}
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.secondary, shadowColor: colors.shadow }, !isStepValid() && styles.disabledButton]}
                onPress={handleNextStep}
                disabled={!isStepValid()}
            >
                <Text style={[styles.primaryButtonText, { color: colors.primary }]}>Continue to Registry</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.white }]}>The Identity</Text>
            <Text style={[styles.stepDesc, { color: 'rgba(255,255,255,0.6)' }]}>Crafting your high-depth persona</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.white }]}>Full Legal Name *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <User color={colors.secondary} size={20} />
                    <TextInput style={[styles.input, { color: colors.white }]} placeholder="full name" placeholderTextColor={'rgba(255,255,255,0.4)'} value={fullName} onChangeText={setFullName} />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.white }]}>Elite @Username *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <AtSign color={colors.secondary} size={20} />
                    <TextInput style={[styles.input, { color: colors.white }]} placeholder="username" placeholderTextColor={'rgba(255,255,255,0.4)'} value={username} onChangeText={setUsername} autoCapitalize="none" />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.white }]}>Official Email *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Mail color={colors.secondary} size={20} />
                    <TextInput style={[styles.input, { color: colors.white }]} placeholder="email" placeholderTextColor={'rgba(255,255,255,0.4)'} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.white }]}>Private Phone *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Phone color={colors.secondary} size={20} />
                    <TextInput style={[styles.input, { color: colors.white }]} placeholder="+250 7xx xxx xxx" placeholderTextColor={'rgba(255,255,255,0.4)'} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
            </View>

            {role === 'OWNER' && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.white }]}>Establishment Name *</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                        <Store color={colors.secondary} size={20} />
                        <TextInput style={[styles.input, { color: colors.white }]} placeholder="The Golden Plate" placeholderTextColor={'rgba(255,255,255,0.4)'} value={restaurantName} onChangeText={setRestaurantName} />
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.secondary, shadowColor: colors.shadow }, !isStepValid() && styles.disabledButton]}
                onPress={handleNextStep}
                disabled={!isStepValid()}
            >
                <Text style={[styles.primaryButtonText, { color: colors.primary }]}>Confirm Identity</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.white }]}>Location & Vibe</Text>
            <Text style={[styles.stepDesc, { color: 'rgba(255,255,255,0.6)' }]}>Defining your presence on the map</Text>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={[styles.label, { color: colors.white }]}>City *</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                        <MapPin color={colors.secondary} size={18} />
                        <TextInput style={[styles.input, { color: colors.white }]} placeholder="Kigali" placeholderTextColor={'rgba(255,255,255,0.4)'} value={city} onChangeText={setCity} />
                    </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.white }]}>Area *</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                        <Compass color={colors.secondary} size={18} />
                        <TextInput style={[styles.input, { color: colors.white }]} placeholder="Kiyovu" placeholderTextColor={'rgba(255,255,255,0.4)'} value={area} onChangeText={setArea} />
                    </View>
                </View>
            </View>

            {role === 'OWNER' ? (
                <>
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={[styles.label, { color: colors.white }]}>Establishment Email *</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                <Mail color={colors.secondary} size={18} />
                                <TextInput style={[styles.input, { color: colors.white }]} placeholder="reservations@place.rw" placeholderTextColor={'rgba(255,255,255,0.4)'} value={restaurantEmail} onChangeText={setRestaurantEmail} autoCapitalize="none" keyboardType="email-address" />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.white }]}>Establishment Phone *</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                <Phone color={colors.secondary} size={18} />
                                <TextInput style={[styles.input, { color: colors.white }]} placeholder="+250..." placeholderTextColor={'rgba(255,255,255,0.4)'} value={restaurantPhone} onChangeText={setRestaurantPhone} keyboardType="phone-pad" />
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={[styles.label, { color: colors.white }]}>Latitude *</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                <TextInput style={[styles.input, { color: colors.white }]} placeholder="-1.9441" placeholderTextColor={'rgba(255,255,255,0.4)'} value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.white }]}>Longitude *</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                <TextInput style={[styles.input, { color: colors.white }]} placeholder="30.0619" placeholderTextColor={'rgba(255,255,255,0.4)'} value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
                            </View>
                        </View>
                    </View>

                    {/* Cuisine Selection for Owners */}
                    <View style={styles.cuisineSection}>
                        <Text style={[styles.label, { color: colors.white, marginBottom: 0 }]}>Primary Cuisines (Min 1) *</Text>
                        <Text style={[styles.helpText, { color: 'rgba(255,255,255,0.4)', marginBottom: 12 }]}>e.g. Contemporary African, Italian, Asian Fusion</Text>
                        <View style={styles.cuisineGrid}>
                            {cuisines.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.cuisineChip, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }, cuisineInterests.includes(c) && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
                                    onPress={() => toggleCuisine(c)}
                                >
                                    <Text style={[styles.chipText, { color: 'rgba(255,255,255,0.6)' }, cuisineInterests.includes(c) && { color: colors.primary }]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Vibe Selection */}
                    <View style={styles.cuisineSection}>
                        <Text style={[styles.label, { color: colors.white, marginBottom: 0 }]}>Establishment Vibe *</Text>
                        <Text style={[styles.helpText, { color: 'rgba(255,255,255,0.4)', marginBottom: 12 }]}>e.g. Rooftop, Romantic, Business, Intimate</Text>
                        <View style={styles.cuisineGrid}>
                            {vibes.map(v => (
                                <TouchableOpacity
                                    key={v}
                                    style={[styles.cuisineChip, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }, vibe === v && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
                                    onPress={() => setVibe(v)}
                                >
                                    <Text style={[styles.chipText, { color: 'rgba(255,255,255,0.6)' }, vibe === v && { color: colors.primary }]}>{v}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Dress Code Selection */}
                    <View style={styles.cuisineSection}>
                        <Text style={[styles.label, { color: colors.white, marginBottom: 0 }]}>Dress Code Protocol *</Text>
                        <Text style={[styles.helpText, { color: 'rgba(255,255,255,0.4)', marginBottom: 12 }]}>e.g. Formal, Smart Casual, Casual</Text>
                        <View style={styles.cuisineGrid}>
                            {dressCodes.map(d => (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.cuisineChip, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }, dressCode === d && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
                                    onPress={() => setDressCode(d)}
                                >
                                    <Text style={[styles.chipText, { color: 'rgba(255,255,255,0.6)' }, dressCode === d && { color: colors.primary }]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.white }]}>Descriptive Story (Min 10 chars) *</Text>
                        <View style={[styles.inputWrapper, { height: 120, alignItems: 'flex-start', paddingTop: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                            <Compass color={colors.secondary} size={20} style={{ marginTop: 2 }} />
                            <TextInput 
                                style={[styles.input, { color: colors.white, height: '100%', textAlignVertical: 'top' }]} 
                                placeholder="Tell us about the elite experience at your venue..." 
                                placeholderTextColor={'rgba(255,255,255,0.4)'} 
                                value={restaurantDescription} 
                                onChangeText={setRestaurantDescription}
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </View>

                    {/* Image Selection for Owners */}
                    <View style={styles.imageSection}>
                        <Text style={[styles.label, { color: colors.white }]}>Featured Establishment Photo *</Text>
                        <TouchableOpacity 
                            style={[
                                styles.imagePicker, 
                                { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: restaurantImage ? colors.secondary : 'rgba(255,255,255,0.2)' }
                            ]}
                            onPress={async () => {
                                const result = await ImagePicker.launchImageLibraryAsync({
                                    mediaTypes: ['images'],
                                    allowsEditing: true,
                                    aspect: [16, 9],
                                    quality: 0.8,
                                });
                                if (!result.canceled) {
                                    setRestaurantImage(result.assets[0].uri);
                                }
                            }}
                        >
                            {restaurantImage ? (
                                <View style={styles.previewWrapper}>
                                    <View style={styles.imagePlaceholder}>
                                        <Animated.Image source={{ uri: restaurantImage }} style={styles.selectedImage} />
                                        <View style={[styles.changeBadge, { backgroundColor: colors.secondary }]}>
                                            <RefreshCw size={12} color={colors.primary} />
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.pickerContent}>
                                    <Camera color={colors.secondary} size={32} strokeWidth={1.5} />
                                    <Text style={[styles.pickerText, { color: 'rgba(255,255,255,0.5)' }]}>Tap to select professional photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.cuisineSection}>
                    <Text style={[styles.label, { color: colors.white }]}>Palette Preferences (Min 1) *</Text>
                    <View style={styles.cuisineGrid}>
                        {cuisines.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.cuisineChip, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }, cuisineInterests.includes(c) && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
                                onPress={() => toggleCuisine(c)}
                            >
                                <Text style={[styles.chipText, { color: 'rgba(255,255,255,0.6)' }, cuisineInterests.includes(c) && { color: colors.primary }]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.secondary, shadowColor: colors.shadow }, !isStepValid() && styles.disabledButton]}
                onPress={handleNextStep}
                disabled={!isStepValid()}
            >
                <Text style={[styles.primaryButtonText, { color: colors.primary }]}>Finalize Profile</Text>
            </TouchableOpacity>
        </View>
    );

    const RequirementRow = ({ label, met }: { label: string, met: boolean }) => (
        <View style={styles.requirementRow}>
            {met ? (
                <Check color={colors.success} size={14} strokeWidth={3} />
            ) : (
                <View style={[styles.requirementDot, { backgroundColor: colors.gray + '30' }]} />
            )}
            <Text style={[styles.requirementText, { color: met ? colors.text : colors.gray, fontWeight: met ? '600' : '400' }]}>{label}</Text>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.white }]}>Final Lock</Text>
            <Text style={[styles.stepDesc, { color: 'rgba(255,255,255,0.6)' }]}>Securing your access to the elite portal</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.white }]}>Elite Password *</Text>
                
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Lock color={colors.secondary} size={20} />
                    <TextInput 
                        style={[styles.input, { color: colors.white }]} 
                        placeholder="********" 
                        placeholderTextColor={'rgba(255,255,255,0.4)'} 
                        secureTextEntry={!showPassword} 
                        value={password} 
                        onChangeText={setPassword} 
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff color={'rgba(255,255,255,0.4)'} size={20} /> : <Eye color={'rgba(255,255,255,0.4)'} size={20} />}
                    </TouchableOpacity>
                </View>

                {/* Password Requirements Checklist */}
                <View style={styles.requirementSection}>
                    <RequirementRow label="8+ characters" met={getPasswordRequirements(password).length} />
                    <RequirementRow label="1 Uppercase" met={getPasswordRequirements(password).hasUpper} />
                    <RequirementRow label="1 Number" met={getPasswordRequirements(password).hasNumber} />
                </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: 'rgba(197, 160, 89, 0.1)', borderColor: 'rgba(197, 160, 89, 0.2)' }]}>
                <Shield color={colors.secondary} size={20} />
                <Text style={[styles.summaryText, { color: 'rgba(255,255,255,0.8)' }]}>By registering, you agree to our terms of discrete service and privacy protocols.</Text>
            </View>

            <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.secondary, shadowColor: colors.shadow }, !isStepValid() && styles.disabledButton]}
                onPress={handleRegister}
                disabled={!isStepValid()}
            >
                <Text style={[styles.primaryButtonText, { color: colors.primary }]}>Grant Access</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <ImageBackground 
                source={require('../../assets/golden_registration_mural_1774964855938.png')} 
                style={styles.backgroundImage}
            >
                <LinearGradient
                    colors={['rgba(5, 11, 16, 0.6)', 'rgba(5, 11, 16, 0.98)']}
                    style={styles.gradient}
                >
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            <View style={styles.topRow}>
                                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backButton}>
                                    <ChevronLeft color={colors.white} size={28} />
                                </TouchableOpacity>
                                <View style={styles.centerBranding}>
                                    <Image source={require('../../assets/Symbol.png')} style={styles.miniSymbol} resizeMode="contain" />
                                    <Text style={[styles.brandText, { color: colors.secondary }]}>YOOMBI</Text>
                                </View>
                                <View style={{ width: 44 }} />
                            </View>

                            <View style={styles.indicatorWrapper}>
                                <StepIndicator />
                            </View>

                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                            {step === 4 && renderStep4()}

                            <View style={styles.footer}>
                                <Text style={[styles.footerText, { color: 'rgba(255,255,255,0.6)' }]}>Returning to excellence? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={[styles.loginLink, { color: colors.secondary }]}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { width: width, height: height },
    gradient: { flex: 1 },
    scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    centerBranding: { alignItems: 'center', gap: 4 },
    miniSymbol: { width: 32, height: 32 },
    brandText: { fontSize: 14, fontWeight: '800', letterSpacing: 2 },
    indicatorWrapper: { alignItems: 'center', marginBottom: 40 },
    indicatorContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    indicator: { height: 6, borderRadius: 3 },
    stepContainer: { flex: 1 },
    brandingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    stepTitle: { ...TYPOGRAPHY.h1, fontSize: 28 },
    stepDesc: { ...TYPOGRAPHY.bodyLarge, marginBottom: 24, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
    roleGrid: { gap: 16, marginBottom: 24 },
    bigRoleCard: {
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        ...SHADOWS.medium,
    },
    bigIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    bigRoleLabel: { ...TYPOGRAPHY.h2, fontSize: 20, fontWeight: '800' },
    bigRoleDesc: { ...TYPOGRAPHY.bodySmall, textAlign: 'center', marginTop: 4 },
    checkBadge: { position: 'absolute', top: 20, right: 20, borderRadius: 12, padding: 4 },
    primaryButton: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 24, ...SHADOWS.medium },
    disabledButton: {
        opacity: 0.5,
    },
    primaryButtonText: { fontSize: 18, fontWeight: '700' },
    inputGroup: { marginBottom: 20 },
    label: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, height: 60, gap: 12, ...SHADOWS.light },
    input: { flex: 1, ...TYPOGRAPHY.bodyMedium },
    row: { flexDirection: 'row' },
    helpText: { fontSize: 12, fontWeight: '400', marginLeft: 6 },
    cuisineSection: { marginBottom: 24 },
    cuisineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    cuisineChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    chipText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
    summaryCard: { padding: 24, borderRadius: 24, flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 20, borderWidth: 1 },
    summaryText: { ...TYPOGRAPHY.bodySmall, flex: 1, fontWeight: '600', lineHeight: 18 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40, paddingBottom: 20 },
    footerText: { ...TYPOGRAPHY.bodyMedium },
    loginLink: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700' },
    requirementSection: { marginTop: 16, gap: 8, paddingLeft: 8 },
    requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    requirementDot: { width: 6, height: 6, borderRadius: 3 },
    requirementText: { ...TYPOGRAPHY.bodySmall, lineHeight: 16 },
    imageSection: { marginTop: 10, marginBottom: 20 },
    imagePicker: {
        height: 160,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    pickerContent: { alignItems: 'center', gap: 10 },
    pickerText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
    previewWrapper: { width: '100%', height: '100%' },
    imagePlaceholder: { width: '100%', height: '100%', position: 'relative' },
    selectedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    changeBadge: { position: 'absolute', bottom: 12, right: 12, padding: 8, borderRadius: 20, ...SHADOWS.medium },
});

export default RegisterScreen;
