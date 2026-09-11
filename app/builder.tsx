import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Dimensions, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore, IntervalBlock, Workout } from '../src/store';
import { useAppTheme } from '../src/theme';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { Picker } from '@react-native-picker/picker';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Play, Pause, Trash2, Copy, GripVertical, Check, Plus } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BuilderScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const store = useStore();
  const existingWorkout = useMemo(() => store.workouts.find(w => w.id === id), [id, store.workouts]);

  const [name, setName] = useState(existingWorkout?.name || '');
  const [blocks, setBlocks] = useState<IntervalBlock[]>(
    existingWorkout ? (existingWorkout.blocks as IntervalBlock[]) : []
  );

  // Bottom Sheet State
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['65%'], []);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [pickerType, setPickerType] = useState<'work'|'rest'>('work');
  const [pickerMin, setPickerMin] = useState(0);
  const [pickerSec, setPickerSec] = useState(30);
  const [blockName, setBlockName] = useState('');

  const handlePress = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const openSheetForNew = (type: 'work' | 'rest') => {
    handlePress();
    setEditingBlockId(null);
    setPickerType(type);
    setBlockName('');
    setPickerMin(type === 'work' ? 0 : 0);
    setPickerSec(type === 'work' ? 45 : 15);
    bottomSheetRef.current?.expand();
  };

  const openSheetForEdit = (block: IntervalBlock) => {
    handlePress();
    setEditingBlockId(block.id);
    setPickerType(block.type);
    setBlockName(block.name || '');
    setPickerMin(Math.floor(block.durationSeconds / 60));
    setPickerSec(block.durationSeconds % 60);
    bottomSheetRef.current?.expand();
  };

  const saveBlock = () => {
    handlePress();
    Keyboard.dismiss();
    const durationSeconds = pickerMin * 60 + pickerSec;
    if (durationSeconds === 0) return; // Prevent 0 duration
    
    if (editingBlockId) {
      setBlocks(blocks.map(b => b.id === editingBlockId ? { 
        ...b, 
        durationSeconds, 
        name: blockName.trim() || undefined 
      } : b));
    } else {
      const newBlock: IntervalBlock = {
        id: Math.random().toString(36).substring(7),
        type: pickerType,
        durationSeconds,
        name: blockName.trim() || undefined,
      };
      setBlocks([...blocks, newBlock]);
    }
    bottomSheetRef.current?.close();
  };

  const removeBlock = (blockId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const duplicateBlock = (block: IntervalBlock) => {
    handlePress();
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === block.id);
      if (idx === -1) return prev;
      const newBlock = { ...block, id: Math.random().toString(36).substring(2, 9) + Date.now() };
      const newBlocks = [...prev];
      newBlocks.splice(idx + 1, 0, newBlock);
      return newBlocks;
    });
  };

  const saveWorkout = () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const workout: Workout = {
      id: existingWorkout?.id || Math.random().toString(36).substring(7),
      name: name.trim(),
      blocks,
    };

    if (existingWorkout) {
      store.updateWorkout(workout.id, workout);
    } else {
      store.addWorkout(workout);
    }
    router.back();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? m + 'm ' : ''}${s}s`;
  };

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<IntervalBlock>) => {
    const isWork = item.type === 'work';
    const iconColor = isWork ? '#FF3B30' : '#007AFF';
    
    return (
      <ScaleDecorator>
        <Animated.View style={[
          styles.rowCard, 
          { backgroundColor: t.colors.card },
          isActive && styles.rowCardActive
        ]}>
          <Pressable onPressIn={drag} delayLongPress={100} style={styles.dragHandle}>
            <GripVertical size={20} color={t.colors.textMuted} />
          </Pressable>
          
          <Pressable onPress={() => openSheetForEdit(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.rowIcon}>
              {isWork ? <Play size={20} color={iconColor} fill={iconColor} /> : <Pause size={20} color={iconColor} fill={iconColor} />}
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: isWork ? t.colors.text : t.colors.textMuted }]}>
                {item.name || (isWork ? 'WORK' : 'REST')}
              </Text>
              <Text style={[styles.rowTime, { color: t.colors.text }]}>{formatTime(item.durationSeconds)}</Text>
            </View>
          </Pressable>

          <View style={styles.rowActions}>
            <Pressable onPress={() => duplicateBlock(item)} style={[styles.iconBtn, { backgroundColor: t.colors.background }]}>
              <Copy size={20} color={t.colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => removeBlock(item.id)} style={[styles.iconBtn, { backgroundColor: t.colors.background }]}>
              <Trash2 size={20} color={t.colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>
      </ScaleDecorator>
    );
  }, [t]);

  const renderFooter = () => {
    const canAddRest = blocks.length > 0;
    
    if (!canAddRest) {
      return (
        <View style={styles.footerContainer}>
          <Pressable 
            onPress={() => openSheetForNew('work')} 
            style={({ pressed }) => [styles.typeBtn, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }, pressed && styles.pressed]}
          >
            <Play size={24} color="#FF3B30" fill="#FF3B30" />
            <Text style={[styles.typeBtnText, { color: '#FF3B30' }]}>Work</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.footerContainer}>
        <Pressable 
          onPress={() => openSheetForNew('work')} 
          style={({ pressed }) => [styles.typeBtn, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }, pressed && styles.pressed]}
        >
          <Play size={24} color="#FF3B30" fill="#FF3B30" />
          <Text style={[styles.typeBtnText, { color: '#FF3B30' }]}>Work</Text>
        </Pressable>
        
        <Pressable 
          onPress={() => openSheetForNew('rest')} 
          style={({ pressed }) => [
            styles.typeBtn, 
            { backgroundColor: 'rgba(0, 122, 255, 0.15)' }, 
            pressed && styles.pressed
          ]}
        >
          <Pause size={24} color="#007AFF" fill="#007AFF" />
          <Text style={[styles.typeBtnText, { color: '#007AFF' }]}>Rest</Text>
        </Pressable>
      </View>
    );
  };

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
    []
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10), backgroundColor: t.colors.background }]}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View style={[styles.dragIndicator, { backgroundColor: t.colors.border }]} />
      </View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.colors.text }]}>{id ? 'Edit Workout' : 'Builder'}</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: t.colors.card, color: t.colors.text }]}
          placeholder="Workout Name (e.g. Core Burn)"
          placeholderTextColor={t.colors.textMuted}
          value={name}
          onChangeText={setName}
          returnKeyType="done"
        />
      </View>

      <DraggableFlatList
        data={blocks}
        onDragEnd={({ data }) => setBlocks(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
      />

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: t.colors.background }]}>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: t.colors.text }, pressed && styles.pressed, (!name.trim() || blocks.length === 0) && { opacity: 0.5 }]}
          onPress={saveWorkout}
        >
          <Check size={24} color={t.colors.background} />
          <Text style={[styles.saveBtnText, { color: t.colors.background }]}>Save Workout</Text>
        </Pressable>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: t.colors.background }}
        handleIndicatorStyle={{ backgroundColor: t.colors.textMuted }}
        keyboardBehavior="extend"
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={[styles.sheetTitle, { color: t.colors.text }]}>
            {editingBlockId ? 'Edit Block' : (pickerType === 'work' ? 'Add Work Interval' : 'Add Rest Interval')}
          </Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: t.colors.card, color: t.colors.text }]}
            placeholder={pickerType === 'work' ? "Name (e.g. Pushups)" : "Name (e.g. Water Break)"}
            placeholderTextColor={t.colors.textMuted}
            value={blockName}
            onChangeText={setBlockName}
            returnKeyType="done"
          />

          <View style={styles.pickerRow}>
            <Picker
              style={styles.picker}
              itemStyle={{ color: t.colors.text }}
              selectedValue={pickerMin}
              onValueChange={(val) => setPickerMin(val)}
            >
              {[...Array(60).keys()].map(i => <Picker.Item key={`min-${i}`} label={`${i} min`} value={i} />)}
            </Picker>
            <Picker
              style={styles.picker}
              itemStyle={{ color: t.colors.text }}
              selectedValue={pickerSec}
              onValueChange={(val) => setPickerSec(val)}
            >
              {[...Array(12).keys()].map(i => <Picker.Item key={`sec-${i*5}`} label={`${i*5} sec`} value={i*5} />)}
            </Picker>
          </View>

          <Pressable
            style={({ pressed }) => [styles.sheetAddBtn, { backgroundColor: t.colors.text }, pressed && styles.pressed]}
            onPress={saveBlock}
          >
            <Text style={[styles.saveBtnText, { color: t.colors.background }]}>{editingBlockId ? 'Update Block' : 'Add Block'}</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dragIndicator: { width: 40, height: 5, borderRadius: 3 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  inputContainer: { paddingHorizontal: 24, marginBottom: 16 },
  input: {
    padding: 16,
    borderRadius: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 120 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  rowCardActive: {
    shadowOpacity: 0.15,
    transform: [{ scale: 1.02 }],
  },
  dragHandle: { padding: 8 },
  rowIcon: { width: 40, alignItems: 'center' },
  rowContent: { flex: 1, marginLeft: 8 },
  rowTitle: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase' },
  rowTime: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  iconBtn: { padding: 8, borderRadius: 8 },
  footerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  typeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  saveBtn: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  saveBtnText: { fontWeight: '800', fontSize: 18 },
  sheetContainer: { flex: 1, padding: 24 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 24, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20 },
  picker: { flex: 1, height: 200 },
  sheetAddBtn: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
});
