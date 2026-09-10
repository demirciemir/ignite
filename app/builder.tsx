import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStore, IntervalBlock } from '../src/store';
import { useAppTheme } from '../src/theme';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';
import { GripVertical, Copy, Trash2, Flame, Coffee, Plus } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Builder() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const workouts = useStore((s) => s.workouts);
  const addWorkout = useStore((s) => s.addWorkout);
  const updateWorkout = useStore((s) => s.updateWorkout);
  
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<IntervalBlock[]>([]);
  
  useEffect(() => {
    if (id) {
      const existing = workouts.find(w => w.id === id);
      if (existing) {
        setName(existing.name);
        setBlocks(existing.blocks as IntervalBlock[]);
      }
    }
  }, [id, workouts]);
  
  // Bottom Sheet state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);
  const [pickerType, setPickerType] = useState<'work' | 'rest'>('work');
  const [pickerMin, setPickerMin] = useState(0);
  const [pickerSec, setPickerSec] = useState(30);

  const handlePress = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const handleSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  const openSheet = () => {
    Keyboard.dismiss();
    handlePress();
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const addBlockFromSheet = () => {
    handlePress();
    const duration = (pickerMin * 60) + pickerSec;
    if (duration === 0) return; // Prevent 0 duration
    
    setBlocks((prev) => [
      ...prev,
      { id: Math.random().toString(), type: pickerType, durationSeconds: duration },
    ]);
    closeSheet();
  };

  const duplicateBlock = (block: IntervalBlock) => {
    handlePress();
    setBlocks((prev) => [
      ...prev,
      { ...block, id: Math.random().toString() },
    ]);
  };

  const removeBlock = (blockId: string) => {
    handlePress();
    setBlocks((prev) => prev.filter(b => b.id !== blockId));
  };

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName || blocks.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    handleSuccess();
    
    if (id) {
      updateWorkout(id, { id, name: trimmedName, blocks });
    } else {
      addWorkout({ id: Math.random().toString(), name: trimmedName, blocks });
    }
    router.back();
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m > 0 ? m + 'm ' : ''}${s}s`;
  };

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<IntervalBlock>) => {
    const isWork = item.type === 'work';
    return (
      <ScaleDecorator>
        <Animated.View 
          layout={Layout.springify()} 
          entering={FadeIn} 
          exiting={FadeOut}
          style={[
            styles.rowCard, 
            { backgroundColor: t.colors.card },
            isActive && styles.rowCardActive
          ]}
        >
          <Pressable onPressIn={drag} style={styles.dragHandle}>
            <GripVertical size={24} color={t.colors.textMuted} />
          </Pressable>
          
          <View style={styles.rowIcon}>
            {isWork ? <Flame size={24} color={t.colors.accent} /> : <Coffee size={24} color="#007AFF" />}
          </View>
          
          <View style={styles.rowContent}>
            <Text style={[styles.rowTitle, { color: t.colors.textMuted }]}>{isWork ? 'Work' : 'Rest'}</Text>
            <Text style={[styles.rowTime, { color: t.colors.text }]}>{formatTime(item.durationSeconds)}</Text>
          </View>

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

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
    []
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), backgroundColor: t.colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: t.colors.text }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]}>{id ? 'Edit Workout' : 'Builder'}</Text>
        <Pressable onPress={save} style={[styles.saveHeaderBtn, { backgroundColor: t.colors.text }]}>
          <Text style={[styles.saveText, { color: t.colors.background }]}>Save</Text>
        </Pressable>
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
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: t.colors.textMuted }]}>Add blocks to build your workout.</Text>
          </View>
        }
      />

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: t.colors.background, borderTopColor: t.colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.addBtn, { backgroundColor: t.colors.text }, pressed && styles.pressed]}
          onPress={openSheet}
        >
          <Plus size={24} color={t.colors.buttonText} />
          <Text style={[styles.addBtnText, { color: t.colors.buttonText }]}>Add Interval</Text>
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
      >
        <BottomSheetView style={styles.sheetContainer}>
          <View style={[styles.segmentControl, { backgroundColor: t.colors.border }]}>
            <Pressable 
              style={[styles.segmentBtn, pickerType === 'work' && [styles.segmentActive, { backgroundColor: t.colors.card }]]} 
              onPress={() => { handlePress(); setPickerType('work'); }}
            >
              <Text style={[styles.segmentText, { color: pickerType === 'work' ? t.colors.text : t.colors.textMuted }]}>Work</Text>
            </Pressable>
            <Pressable 
              style={[styles.segmentBtn, pickerType === 'rest' && [styles.segmentActive, { backgroundColor: t.colors.card }]]} 
              onPress={() => { handlePress(); setPickerType('rest'); }}
            >
              <Text style={[styles.segmentText, { color: pickerType === 'rest' ? t.colors.text : t.colors.textMuted }]}>Rest</Text>
            </Pressable>
          </View>

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
            onPress={addBlockFromSheet}
          >
            <Text style={[styles.addBtnText, { color: t.colors.buttonText }]}>Add to Workout</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  cancelText: { fontSize: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  saveHeaderBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  saveText: { fontWeight: '700' },
  inputContainer: { paddingHorizontal: 24, marginBottom: 16 },
  input: {
    padding: 16,
    borderRadius: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16 },
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
  rowTitle: { fontSize: 14, textTransform: 'uppercase', fontWeight: '700' },
  rowTime: { fontSize: 20, fontWeight: '800' },
  rowActions: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  iconBtn: { padding: 8, borderRadius: 8 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: { fontWeight: '700', fontSize: 16 },
  sheetContainer: { flex: 1, padding: 24, gap: 24 },
  segmentControl: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentActive: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  segmentText: { fontWeight: '600' },
  pickerRow: { flexDirection: 'row', justifyContent: 'center' },
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
