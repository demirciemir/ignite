import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStore, IntervalBlock } from '../src/store';
import { theme } from '../src/theme';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';
import { GripVertical, Copy, Trash2, Flame, Coffee, Plus } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Builder() {
  const router = useRouter();
  const addWorkout = useStore((s) => s.addWorkout);
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<IntervalBlock[]>([]);
  
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

  const removeBlock = (id: string) => {
    handlePress();
    setBlocks((prev) => prev.filter(b => b.id !== id));
  };

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName || blocks.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    handleSuccess();
    addWorkout({ id: Math.random().toString(), name: trimmedName, blocks });
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
            isActive && styles.rowCardActive
          ]}
        >
          <Pressable onPressIn={drag} style={styles.dragHandle}>
            <GripVertical size={24} color={theme.colors.textMuted} />
          </Pressable>
          
          <View style={styles.rowIcon}>
            {isWork ? <Flame size={24} color={theme.colors.accent} /> : <Coffee size={24} color="#007AFF" />}
          </View>
          
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>{isWork ? 'Work' : 'Rest'}</Text>
            <Text style={styles.rowTime}>{formatTime(item.durationSeconds)}</Text>
          </View>

          <View style={styles.rowActions}>
            <Pressable onPress={() => duplicateBlock(item)} style={styles.iconBtn}>
              <Copy size={20} color={theme.colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => removeBlock(item.id)} style={styles.iconBtn}>
              <Trash2 size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>
      </ScaleDecorator>
    );
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
    []
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Builder</Text>
        <Pressable onPress={save} style={styles.saveHeaderBtn}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Workout Name (e.g. Core Burn)"
          placeholderTextColor={theme.colors.textMuted}
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
            <Text style={styles.emptyText}>Add blocks to build your workout.</Text>
          </View>
        }
      />

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          onPress={openSheet}
        >
          <Plus size={24} color={theme.colors.buttonText} />
          <Text style={styles.addBtnText}>Add Interval</Text>
        </Pressable>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.sheetContainer}>
          <View style={styles.segmentControl}>
            <Pressable 
              style={[styles.segmentBtn, pickerType === 'work' && styles.segmentActive]} 
              onPress={() => { handlePress(); setPickerType('work'); }}
            >
              <Text style={[styles.segmentText, pickerType === 'work' && styles.segmentTextActive]}>Work</Text>
            </Pressable>
            <Pressable 
              style={[styles.segmentBtn, pickerType === 'rest' && styles.segmentActive]} 
              onPress={() => { handlePress(); setPickerType('rest'); }}
            >
              <Text style={[styles.segmentText, pickerType === 'rest' && styles.segmentTextActive]}>Rest</Text>
            </Pressable>
          </View>

          <View style={styles.pickerRow}>
            <Picker
              style={styles.picker}
              selectedValue={pickerMin}
              onValueChange={(val) => setPickerMin(val)}
            >
              {[...Array(60).keys()].map(i => <Picker.Item key={`min-${i}`} label={`${i} min`} value={i} />)}
            </Picker>
            <Picker
              style={styles.picker}
              selectedValue={pickerSec}
              onValueChange={(val) => setPickerSec(val)}
            >
              {[...Array(12).keys()].map(i => <Picker.Item key={`sec-${i*5}`} label={`${i*5} sec`} value={i*5} />)}
            </Picker>
          </View>

          <Pressable
            style={({ pressed }) => [styles.sheetAddBtn, pressed && styles.pressed]}
            onPress={addBlockFromSheet}
          >
            <Text style={styles.addBtnText}>Add to Workout</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  cancelText: { color: theme.colors.text, fontSize: 16 },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  saveHeaderBtn: { 
    backgroundColor: theme.colors.text, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  saveText: { color: theme.colors.background, fontWeight: '700' },
  inputContainer: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  input: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: theme.colors.textMuted, fontSize: 16 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  rowCardActive: {
    shadowOpacity: 0.15,
    transform: [{ scale: 1.02 }],
  },
  dragHandle: { padding: theme.spacing.sm },
  rowIcon: { width: 40, alignItems: 'center' },
  rowContent: { flex: 1, marginLeft: 8 },
  rowTitle: { fontSize: 14, color: theme.colors.textMuted, textTransform: 'uppercase', fontWeight: '700' },
  rowTime: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  rowActions: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  iconBtn: { padding: 8, backgroundColor: theme.colors.background, borderRadius: 8 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.text,
    padding: 16,
    borderRadius: theme.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: { fontWeight: '700', color: theme.colors.buttonText, fontSize: 16 },
  sheetContainer: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.lg },
  segmentControl: { flexDirection: 'row', backgroundColor: theme.colors.border, borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: theme.colors.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  segmentText: { fontWeight: '600', color: theme.colors.textMuted },
  segmentTextActive: { color: theme.colors.text },
  pickerRow: { flexDirection: 'row', justifyContent: 'center' },
  picker: { flex: 1, height: 200 },
  sheetAddBtn: {
    backgroundColor: theme.colors.text,
    padding: 16,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  pressed: { opacity: 0.8 },
});
