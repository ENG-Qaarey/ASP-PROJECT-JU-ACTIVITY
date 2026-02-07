import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ShieldCheck, FileText, Calendar, Clock, MapPin, Users, ChevronDown, Rocket, X, Check, Trash2, RefreshCw } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { JuInput } from '@/src/components/JuInput';
import { JuButton } from '@/src/components/JuButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';

// ... imports
import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';

// Update categories to match backend enum values (from web project reference)
const CATEGORY_OPTIONS = [
  { label: 'Workshop', value: 'workshop' },
  { label: 'Seminar', value: 'seminar' },
  { label: 'Training Program', value: 'training' },
  { label: 'Extracurricular', value: 'extracurricular' },
];

export default function AdminCreateActivity() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const isEditMode = params.mode === 'edit';
  const activityId = params.activityId;

  const [coordinatorsList, setCoordinatorsList] = React.useState<any[]>([]);

  // Form State
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: '',
    coordinator: '', // Name
    coordinatorId: '', // ID
    date: '',
    time: '',
    location: '',
    capacity: ''
  });

  // Calendar & Modal State
  const [viewingDate, setViewingDate] = React.useState(new Date());
  const [showYearPicker, setShowYearPicker] = React.useState(false);
  const [modalType, setModalType] = React.useState<'category' | 'coordinator' | 'date' | 'time' | null>(null);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCapacityChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    updateField('capacity', cleanText);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.category || !formData.description || !formData.coordinatorId || !formData.location || !formData.capacity) {
      Alert.alert('Incomplete Form', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Convert mm/dd/yyyy to yyyy-mm-dd for backend stability
      const dateParts = formData.date.split('/');
      const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}` : formData.date;

      // Validate that date/time is in the future
      const [timeStr, period] = formData.time.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      const activityDateTime = new Date(`${isoDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
      if (activityDateTime < new Date()) {
        Alert.alert('Invalid Date', 'The activity date and time must be in the future.');
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: isoDate,
        time: formData.time,
        location: formData.location,
        capacity: parseInt(formData.capacity, 10),
        coordinatorId: formData.coordinatorId,
        coordinatorName: formData.coordinator, // Required by backend
      };

      if (isEditMode && activityId) {
        await client.put(`/activities/${activityId}`, payload);
        Alert.alert('Success', 'Activity updated successfully!');
      } else {
        await client.post('/activities', payload);
        Alert.alert('Success', 'Activity published successfully!');
      }
      router.back();
    } catch (e: any) {
      console.log('Submit failed:', e);
      Alert.alert('Error', 'Failed to publish activity: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<{ label: string; value: string }[]>([]);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = React.useState(false);

  React.useEffect(() => {
    // Fetch coordinators
    const fetchCoordinators = async () => {
      try {
        const res = await client.get('/users?role=coordinator');
        if (Array.isArray(res)) {
          setCoordinatorsList(res);
        }
      } catch (e) {
        console.log('Failed to fetch coordinators:', e);
      }
    };

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const res = await client.get(ENDPOINTS.CATEGORIES);
        if (Array.isArray(res)) {
           const mapped = res.map((c: any) => ({ label: c.name, value: c.name })); // Value is name for now as backend Activity uses string
           setCategories(mapped);
        }
      } catch (e) {
        console.log('Failed to fetch categories:', e);
        // Fallback
        setCategories(CATEGORY_OPTIONS); 
      }
    };

    fetchCoordinators();
    fetchCategories();

    if (isEditMode && params.activityId) {
      setFormData({
        title: (params.title as string) || '',
        description: (params.description as string) || '',
        category: (params.category as string) || '',
        coordinator: (params.coordinatorName as string) || '',
        coordinatorId: (params.coordinatorId as string) || '', 
        date: (params.date as string) || '',
        time: (params.time as string) || '',
        location: (params.location as string) || '',
        capacity: params.capacity ? String(params.capacity) : ''
      });
    }
  }, []); // Run once on mount

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    try {
        const res = await client.post(ENDPOINTS.CATEGORIES, { name: newCategoryName.trim() });
        const newCat = { label: res.name, value: res.name };
        setCategories(prev => [...prev, newCat]);
        updateField('category', newCat.value);
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        setModalType(null); // Close modal
    } catch (e: any) {
        Alert.alert('Error', 'Failed to create category: ' + (e.message || 'Unknown error'));
    } finally {
        setLoading(false);
    }
  };

  const renderPickerModal = () => {
    if (modalType === 'date') return renderDateModal();
    if (modalType === 'time') return renderTimeModal();

    const isCategory = modalType === 'category';
    
    // For category, stick "Create New" at the end
    const displayData = isCategory 
        ? [...categories, { label: '+ Create New Category', value: 'create_new_special_value' }]
        : coordinatorsList;
        
    const title = isCategory ? 'Select Category' : 'Assign Coordinator';

    if (!modalType) return null;

    return (
      <Modal
        visible={modalType === 'category' || modalType === 'coordinator'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
              <TouchableOpacity onPress={() => { setModalType(null); setShowNewCategoryInput(false); }}>
                <X size={20} color={theme.icon} />
              </TouchableOpacity>
            </View>
            
            {showNewCategoryInput ? (
                <View style={{ gap: 10 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Enter Category Name:</Text>
                    <TextInput 
                        style={{ 
                            borderWidth: 1, 
                            borderColor: theme.primary, 
                            borderRadius: 8, 
                            padding: 10, 
                            color: theme.text,
                            backgroundColor: theme.background 
                        }}
                        placeholder="e.g. Hackathon"
                        placeholderTextColor={theme.tabIconDefault}
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        autoFocus
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity 
                            style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}
                            onPress={() => setShowNewCategoryInput(false)}
                        >
                            <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.primary, alignItems: 'center' }}
                            onPress={handleCreateCategory}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <FlatList
                data={displayData}
                keyExtractor={item => isCategory ? item.value : item.id}
                renderItem={({ item }) => {
                    const label = isCategory ? item.label : item.name;
                    const value = isCategory ? item.value : item.id;
                    const isSelected = isCategory ? (formData.category === value) : (formData.coordinatorId === value);
                    const isCreateAction = isCategory && value === 'create_new_special_value';
                    
                    return (
                    <TouchableOpacity 
                        style={[styles.modalItem, { borderBottomColor: theme.border }]}
                        onPress={() => {
                        if (isCreateAction) {
                            setShowNewCategoryInput(true);
                            return;
                        }

                        if (isCategory) {
                            updateField('category', value);
                        } else {
                            setFormData(prev => ({ ...prev, coordinator: label, coordinatorId: value }));
                        }
                        setModalType(null);
                        }}
                    >
                        <Text style={[
                        styles.modalItemText,
                        { color: theme.textSecondary },
                        isSelected && { color: theme.primary, fontWeight: '700' },
                        isCreateAction && { color: theme.primary, fontWeight: '800' }
                        ]}>{label}</Text>
                        {isSelected && <Check size={18} color={theme.primary} />}
                    </TouchableOpacity>
                    );
                }}
                />
            )}
          </GlassCard>
        </View>
      </Modal>
    );
  };

  const renderDateModal = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const viewYear = viewingDate.getFullYear();
    const viewMonth = viewingDate.getMonth();
    
    // Calculate days in month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
    
    // Previous month filler days
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
    const prevMonthFillers = Array.from({ length: firstDayOfMonth }, (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1);
    
    // Current month days
    const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Next month filler days (fill up to 42 cells for 6 weeks)
    const totalFilled = prevMonthFillers.length + currentDays.length;
    const nextMonthFillers = Array.from({ length: 42 - totalFilled }, (_, i) => i + 1);

    const changeMonth = (offset: number) => {
      setViewingDate(new Date(viewYear, viewMonth + offset, 1));
    };

    const jumpToToday = () => {
      const today = new Date();
      setViewingDate(new Date(today.getFullYear(), today.getMonth(), 1));
      const d = today.getDate();
      const m = today.getMonth() + 1;
      updateField('date', `${m < 10 ? '0'+m : m}/${d < 10 ? '0'+d : d}/${today.getFullYear()}`);
    };

    if (showYearPicker) return renderYearPicker();

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.premiumCalendarCard, { backgroundColor: colorScheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.95)' }]}>
            {/* High-End Header */}
            <View style={styles.premiumCalHeader}>
                <TouchableOpacity style={[styles.premiumMonthSelector, { backgroundColor: theme.accent }]} onPress={() => setShowYearPicker(true)}>
                    <Text style={[styles.premiumMonthText, { color: theme.text }]}>{monthNames[viewMonth]} {viewYear}</Text>
                    <ChevronDown size={14} color={theme.primary} />
                </TouchableOpacity>
                <View style={styles.navControls}>
                    <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.accent }]} onPress={() => changeMonth(-1)}>
                        <Text style={[styles.navArrow, { color: theme.primary }]}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.accent }]} onPress={() => changeMonth(1)}>
                        <Text style={[styles.navArrow, { color: theme.primary }]}>↓</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Polished Weekdays */}
            <View style={styles.premiumWeekdayRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, i) => (
                    <Text key={i} style={[styles.premiumWeekdayText, { color: theme.textSecondary }]}>{wd}</Text>
                ))}
            </View>
            
            {/* Premium Grid */}
            <View style={styles.premiumGrid}>
                {prevMonthFillers.map(day => (
                    <View key={`prev-${day}`} style={styles.premiumDay}>
                        <Text style={[styles.premiumDayFillerText, { color: theme.tabIconDefault }]}>{day}</Text>
                    </View>
                ))}
                {currentDays.map(day => {
                    const dStr = day < 10 ? `0${day}` : `${day}`;
                    const mStr = (viewMonth + 1) < 10 ? `0${viewMonth + 1}` : `${viewMonth + 1}`;
                    const dateStr = `${mStr}/${dStr}/${viewYear}`;
                    const isSelected = formData.date === dateStr;
                    return (
                        <TouchableOpacity 
                            key={day} 
                            style={[
                                styles.premiumDay, 
                                isSelected && { backgroundColor: theme.primary }
                            ]}
                            onPress={() => {
                                updateField('date', dateStr);
                                setModalType(null);
                            }}
                        >
                            <Text style={[
                                styles.premiumDayText, 
                                { color: theme.text },
                                isSelected && { color: '#FFFFFF', fontWeight: '800' }
                            ]}>{day}</Text>
                        </TouchableOpacity>
                    );
                })}
                {nextMonthFillers.map(day => (
                    <View key={`next-${day}`} style={styles.premiumDay}>
                        <Text style={[styles.premiumDayFillerText, { color: theme.tabIconDefault }]}>{day}</Text>
                    </View>
                ))}
            </View>

            {/* Smart Footer */}
            <View style={[styles.premiumCalFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity style={styles.footerAction} onPress={() => { updateField('date', ''); setModalType(null); }}>
                    <Trash2 size={16} color={theme.error} />
                    <Text style={[styles.footerActionText, { color: theme.error }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerAction} onPress={() => { jumpToToday(); setModalType(null); }}>
                    <RefreshCw size={16} color={theme.primary} />
                    <Text style={[styles.footerActionText, { color: theme.primary }]}>Today</Text>
                </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    );
  };

  const renderYearPicker = () => {
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const viewYear = viewingDate.getFullYear();
    const viewMonth = viewingDate.getMonth();
    
    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.premiumPickerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.premiumPickerHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.premiumPickerTitle, { color: theme.text }]}>Jump to Date</Text>
                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                    <X size={20} color={theme.icon} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerScroll}>
                {years.map(y => (
                    <View key={y}>
                        <TouchableOpacity 
                            style={[
                                styles.pickerYearItem, 
                                { backgroundColor: theme.accent },
                                viewYear === y && { backgroundColor: theme.background }
                            ]}
                            onPress={() => setViewingDate(new Date(y, viewMonth, 1))}
                        >
                            <Text style={[
                                styles.pickerYearText, 
                                { color: theme.textSecondary },
                                viewYear === y && { color: theme.primary, fontWeight: '900' }
                            ]}>{y}</Text>
                            {viewYear === y && <Check size={16} color={theme.primary} />}
                        </TouchableOpacity>

                        {viewYear === y && (
                            <View style={[styles.pickerMonthGrid, { backgroundColor: theme.card }]}>
                                {months.map((m, i) => (
                                    <TouchableOpacity 
                                        key={m} 
                                        style={[
                                            styles.pickerMonthBtn, 
                                            { borderColor: theme.border },
                                            viewMonth === i && { backgroundColor: theme.primary, borderColor: theme.primary }
                                        ]}
                                        onPress={() => {
                                            setViewingDate(new Date(y, i, 1));
                                            setShowYearPicker(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.pickerMonthText, 
                                            { color: theme.textSecondary },
                                            viewMonth === i && { color: '#FFFFFF', fontWeight: '800' }
                                        ]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <View style={[styles.pickerDivider, { backgroundColor: theme.border }]} />
                    </View>
                ))}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    );
  };

  const renderTimeModal = () => {
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const mins = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ['AM', 'PM'];

    const currentHour = formData.time.split(':')[0] || '09';
    const currentMin = (formData.time.split(':')[1] || '00').split(' ')[0] || '00';
    const currentPeriod = formData.time.split(' ')[1] || 'PM';

    const TimeColumn = ({ data, selected, onSelect }: any) => (
      <View style={styles.timeColumn}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.timeColumnScroll} 
          contentContainerStyle={styles.timeColumnContent}
        >
          {data.map((item: string) => {
            const isSelected = selected === item;
            return (
              <TouchableOpacity 
                key={item} 
                style={[
                  styles.timeItem, 
                  isSelected && { 
                    borderWidth: 2, 
                    borderColor: theme.primary,
                    backgroundColor: theme.primary + '20'
                  }
                ]}
                onPress={() => onSelect(item)}
              >
                <Text style={[
                  styles.timeItemText,
                  { color: theme.text },
                  isSelected && { color: theme.primary, fontWeight: '800' }
                ]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.premiumTimePickerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.premiumPickerHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.premiumPickerTitle, { color: theme.text }]}>Select Time</Text>
                <TouchableOpacity onPress={() => setModalType(null)}>
                    <X size={20} color={theme.icon} />
                </TouchableOpacity>
            </View>

            <View style={styles.timeColumnsContainer}>
              <TimeColumn 
                data={hours} 
                selected={currentHour} 
                onSelect={(h: string) => updateField('time', `${h}:${currentMin} ${currentPeriod}`)} 
              />
              <TimeColumn 
                data={mins} 
                selected={currentMin} 
                onSelect={(m: string) => updateField('time', `${currentHour}:${m} ${currentPeriod}`)} 
              />
              <TimeColumn 
                data={periods} 
                selected={currentPeriod} 
                onSelect={(p: string) => updateField('time', `${currentHour}:${currentMin} ${p}`)} 
              />
            </View>

            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.confirmBtnText}>Confirm Time</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    );
  };



  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Admin Action Header */}
        <View style={styles.header}>
            <View style={styles.actionTag}>
                <ShieldCheck size={14} color={theme.textSecondary} />
                <Text style={[styles.actionTagText, { color: theme.textSecondary }]}>ADMIN ACTION</Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{isEditMode ? 'Edit Activity' : 'Publish Strategic Activity'}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {isEditMode ? 'Modify activity details and update for all students.' : 'Spin up university-wide workshops, seminars, or urgent make-up sessions without waiting on coordinators.'}
            </Text>
        </View>

        {/* Form Card */}
        <GlassCard style={[styles.card, { backgroundColor: colorScheme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.9)' }]}>
            {/* Blueprint Header */}
            <View style={styles.blueprintHeader}>
                <FileText size={20} color={theme.primary} />
                <Text style={[styles.blueprintTitle, { color: theme.text }]}>Activity Blueprint</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
                <View style={styles.textAreaContainer}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Activity Title *</Text>
                    <TextInput 
                        multiline 
                        numberOfLines={2} 
                        placeholder="e.g. University Innovation Forum" 
                        style={[
                            styles.textArea, 
                            { 
                                height: 45, 
                                borderColor: theme.primary, 
                                backgroundColor: theme.background,
                                color: theme.text
                            }
                        ]}
                        placeholderTextColor={theme.tabIconDefault}
                        value={formData.title}
                        onChangeText={(text) => updateField('title', text)}
                    />
                </View>

                <View style={styles.textAreaContainer}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Description *</Text>
                    <TextInput 
                        multiline 
                        numberOfLines={4} 
                        placeholder="Outline the purpose, speakers, and outcomes for this activity..." 
                        style={[
                            styles.textArea, 
                            { 
                                backgroundColor: theme.background, 
                                borderColor: theme.border,
                                color: theme.text
                            }
                        ]}
                        placeholderTextColor={theme.tabIconDefault}
                        value={formData.description}
                        onChangeText={(text) => updateField('description', text)}
                    />
                </View>

                {/* Two Column Layouts */}
                <View style={styles.row}>
                    <View style={styles.fieldColumn}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Category *</Text>
                        <TouchableOpacity 
                          style={[styles.selectBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                          onPress={() => setModalType('category')}
                        >
                            <Text style={[
                                styles.selectPlaceholder, 
                                { color: theme.tabIconDefault },
                                formData.category && { color: theme.text, fontWeight: '600' }
                            ]}>
                              {formData.category 
                                ? categories.find(c => c.value === formData.category)?.label || formData.category 
                                : 'Select category'}
                            </Text>
                            <ChevronDown size={18} color={theme.tabIconDefault} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.fieldColumn}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Assign Coordinator *</Text>
                        <TouchableOpacity 
                          style={[styles.selectBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                          onPress={() => setModalType('coordinator')}
                        >
                            <Text style={[
                                styles.selectPlaceholder, 
                                { color: theme.tabIconDefault },
                                formData.coordinator && { color: theme.text, fontWeight: '600' }
                            ]}>
                              {formData.coordinator || 'Select coordinator'}
                            </Text>
                            <ChevronDown size={18} color={theme.tabIconDefault} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.fieldColumn}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                             <Calendar size={13} color={theme.textSecondary} style={{ marginRight: 4 }} /> Date *
                        </Text>
                        <TouchableOpacity 
                          style={[styles.inputWithIcon, { backgroundColor: theme.background, borderColor: theme.border }]}
                          onPress={() => setModalType('date')}
                        >
                            <TextInput 
                              placeholder="mm/dd/yyyy" 
                              style={[styles.innerInput, { color: theme.text }]} 
                              placeholderTextColor={theme.tabIconDefault} 
                              value={formData.date}
                              editable={false}
                            />
                            <Calendar size={18} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.fieldColumn}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                            <Clock size={13} color={theme.textSecondary} style={{ marginRight: 4 }} /> Time *
                        </Text>
                        <TouchableOpacity 
                          style={[styles.inputWithIcon, { backgroundColor: theme.background, borderColor: theme.border }]}
                          onPress={() => setModalType('time')}
                        >
                            <TextInput 
                              placeholder="--:-- --" 
                              style={[styles.innerInput, { color: theme.text }]} 
                              placeholderTextColor={theme.tabIconDefault} 
                              value={formData.time}
                              editable={false}
                            />
                            <Clock size={18} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.fieldColumn}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                            <MapPin size={13} color={theme.textSecondary} style={{ marginRight: 4 }} /> Location *
                        </Text>
                        <TextInput 
                            placeholder="Main Auditorium..." 
                            style={[styles.singleLineInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} 
                            placeholderTextColor={theme.tabIconDefault} 
                            value={formData.location}
                            onChangeText={(text) => updateField('location', text)}
                        />
                    </View>
                    <View style={styles.fieldColumn}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                            <Users size={13} color={theme.textSecondary} style={{ marginRight: 4 }} /> Capacity *
                        </Text>
                        <TextInput 
                            placeholder="Target" 
                            style={[styles.singleLineInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]} 
                            placeholderTextColor={theme.tabIconDefault} 
                            keyboardType="numeric"
                            value={formData.capacity}
                            onChangeText={handleCapacityChange}
                        />
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity 
                    style={[styles.cancelBtn, { borderColor: theme.primary }]} 
                    onPress={() => router.back()}
                >
                    <Text style={[styles.cancelText, { color: theme.primary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.publishBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                    <Rocket size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.publishText}>
                        {loading ? 'Processing...' : isEditMode ? 'Update Activity' : 'Publish Activity'}
                    </Text>
                </TouchableOpacity>
            </View>
        </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
      {renderPickerModal()}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { padding: 12, paddingTop: 20, paddingBottom: 40 },
  header: { marginBottom: 10 },
  actionTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
  actionTagText: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  card: { padding: 14, borderRadius: 16 },
  blueprintHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  blueprintTitle: { fontSize: 15, fontWeight: '800' },
  form: { gap: 10 },
  textAreaContainer: { width: '100%' },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4, marginLeft: 2, flexDirection: 'row', alignItems: 'center' },
  textArea: { borderRadius: 10, padding: 10, height: 70, textAlignVertical: 'top', fontSize: 13, borderWidth: 1 },
  row: { flexDirection: 'row', gap: 8 },
  fieldColumn: { flex: 1 },
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, height: 40, paddingHorizontal: 10 },
  selectPlaceholder: { fontSize: 12 },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, height: 40, paddingHorizontal: 10 },
  innerInput: { flex: 1, fontSize: 12 },
  singleLineInput: { borderWidth: 1, borderRadius: 10, height: 40, paddingHorizontal: 10, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontWeight: '800', fontSize: 13 },
  publishBtn: { flex: 1.2, height: 44, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  publishText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '60%', padding: 20, borderRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  modalItemText: { fontSize: 14, fontWeight: '500' },
  modalItemTextSelected: { fontWeight: '700' },
  selectActiveText: { fontWeight: '600' },
  modalSub: { fontSize: 11, marginTop: 1 },
  // Premium Calendar Logic UI
  premiumCalendarCard: { width: 320, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  premiumCalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  premiumMonthSelector: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  premiumMonthText: { fontSize: 16, fontWeight: '800' },
  navControls: { flexDirection: 'row', gap: 12 },
  navBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  navArrow: { fontSize: 18, fontWeight: '600' },
  premiumWeekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  premiumWeekdayText: { width: 38, textAlign: 'center', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  premiumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  premiumDay: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 6, borderRadius: 10 },
  premiumDaySelected: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  premiumDayText: { fontSize: 14, fontWeight: '600' },
  premiumDayTextSelected: { fontWeight: '800' },
  premiumDayFillerText: { fontSize: 14, fontWeight: '400' },
  premiumCalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, borderTopWidth: 1.5, paddingTop: 15 },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  footerActionText: { fontSize: 14, fontWeight: '800' },
  // Premium Picker Card (Year/Month Jump)
  premiumPickerCard: { width: 300, maxHeight: 400, borderRadius: 24, padding: 0, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12, borderWidth: 1 },
  premiumPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  premiumPickerTitle: { fontSize: 18, fontWeight: '900' },
  pickerScroll: { flex: 1 },
  pickerYearItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  pickerYearItemActive: {},
  pickerYearText: { fontSize: 16, fontWeight: '700' },
  pickerYearTextSelected: { fontWeight: '900' },
  pickerMonthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 15 },
  pickerMonthBtn: { width: '22%', height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1 },
  pickerMonthBtnSelected: {},
  pickerMonthText: { fontSize: 13, fontWeight: '600' },
  pickerMonthTextSelected: { fontWeight: '800' },
  pickerDivider: { height: 1 },
  // Premium Time Picker UI
  premiumTimePickerCard: { width: 280, padding: 0, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12, borderWidth: 1 },
  timeColumnsContainer: { flexDirection: 'row', padding: 15, height: 300, gap: 8 },
  timeColumn: { flex: 1 },
  timeColumnScroll: { flex: 1 },
  timeColumnContent: { paddingVertical: 10 },
  timeItem: { paddingVertical: 12, alignItems: 'center', borderRadius: 6, marginBottom: 8 },
  timeItemText: { fontSize: 18, fontWeight: '500' },
  // Legacy/Common Picker Styles
  pickerSectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginTop: 12, marginBottom: 8, marginLeft: 4 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pickerItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F1F5F9', minWidth: 45, alignItems: 'center' },
  pickerItemSelected: { backgroundColor: '#3B82F6' },
  pickerItemText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  pickerItemTextSelected: { color: '#FFFFFF' },
  confirmBtn: { backgroundColor: '#3B82F6', borderRadius: 12, height: 44, justifyContent: 'center', alignItems: 'center', margin: 20, marginTop: 0 },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});

