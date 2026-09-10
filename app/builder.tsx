import { useState } from 'react';
import { Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStore, WorkoutBlock } from '../src/store';
import { BentoCard } from '../src/components/BentoCard';
import { theme } from '../src/theme';

export default function Builder() {
  const router = useRouter();
  const addWorkout = useStore((s) => s.addWorkout);
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addInterval = () => {
    handlePress();
    setBlocks((prev) => [
      ...prev,
      { id: Math.random().toString(), type: 'work', durationSeconds: 30 },
    ]);
  };

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    handlePress();
    addWorkout({ id: Math.random().toString(), name: trimmedName, blocks });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Workout</Text>
      <TextInput
        style={styles.input}
        placeholder="Workout Name (e.g. Abs)"
        placeholderTextColor={theme.colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      {blocks.map((b) => (
        <BentoCard key={b.id} style={styles.blockCard}>
          <Text style={styles.blockType}>{b.type.toUpperCase()}</Text>
          {b.type === 'work' && <Text style={styles.blockDuration}>{b.durationSeconds}s</Text>}
        </BentoCard>
      ))}

      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        onPress={addInterval}
      >
        <Text style={styles.addBtnText}>+ Add 30s Work</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.addBtn, styles.saveBtn, pressed && styles.pressed]}
        onPress={save}
      >
        <Text style={styles.saveBtnText}>Save Workout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
  input: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    fontSize: 18,
    color: theme.colors.text,
  },
  blockCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockType: { fontWeight: '700', color: theme.colors.accent },
  blockDuration: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  addBtn: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.buttonSecondary,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
  },
  addBtnText: { fontWeight: '600', color: theme.colors.text },
  saveBtn: { backgroundColor: theme.colors.text, marginTop: theme.spacing.xl },
  saveBtnText: { fontWeight: '700', color: theme.colors.buttonText },
  pressed: { opacity: 0.8 },
});
