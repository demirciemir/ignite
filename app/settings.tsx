import { View, Text, StyleSheet, Pressable, Alert, Linking, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, ThemePreference } from '../src/store';
import { useAppTheme } from '../src/theme';
import { Monitor, Moon, Sun, Trash2, Shield, FileText, Mail, ChevronRight, Volume2, Vibrate } from 'lucide-react-native';

type AppearanceOptionProps = {
  pref: ThemePreference;
  title: string;
  icon: typeof Monitor;
  selected: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: (pref: ThemePreference) => void;
};

function AppearanceOption({ pref, title, icon: Icon, selected, colors, onPress }: AppearanceOptionProps) {
  return (
    <Pressable
      style={[
        styles.optionRow,
        { borderBottomColor: colors.border },
        selected && { backgroundColor: colors.buttonSecondary },
      ]}
      onPress={() => onPress(pref)}
    >
      <View style={styles.optionIcon}>
        <Icon size={20} color={selected ? colors.accent : colors.text} />
      </View>
      <Text style={[styles.optionText, { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  
  const themePref = useStore(s => s.themePreference);
  const setThemePref = useStore(s => s.setThemePreference);
  const hapticsEnabled = useStore(s => s.hapticsEnabled);
  const setHapticsEnabled = useStore(s => s.setHapticsEnabled);
  const soundEnabled = useStore(s => s.soundEnabled);
  const setSoundEnabled = useStore(s => s.setSoundEnabled);

  const handlePress = (pref: ThemePreference) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemePref(pref);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: t.colors.background }]} 
      contentContainerStyle={{ paddingTop: 16, paddingBottom: Math.max(insets.bottom, 20) }}
    >
      <View style={{ alignItems: 'center', marginBottom: 16, marginTop: 0 }}>
        <View style={[styles.dragIndicator, { backgroundColor: t.colors.border, marginBottom: 16 }]} />
        <Text style={[styles.title, { color: t.colors.text, textTransform: 'uppercase' }]}>Settings</Text>
      </View>

      <View style={[styles.section, { backgroundColor: t.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: t.colors.textMuted }]}>APPEARANCE</Text>
        <AppearanceOption pref="system" title="System Default" icon={Monitor} selected={themePref === 'system'} colors={t.colors} onPress={handlePress} />
        <AppearanceOption pref="light" title="Light" icon={Sun} selected={themePref === 'light'} colors={t.colors} onPress={handlePress} />
        <AppearanceOption pref="dark" title="Dark" icon={Moon} selected={themePref === 'dark'} colors={t.colors} onPress={handlePress} />
      </View>

      <View style={[styles.section, { backgroundColor: t.colors.card, marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: t.colors.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.optionRow, { borderBottomColor: t.colors.border }]}>
          <Vibrate size={20} color={t.colors.textMuted} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: t.colors.text, flex: 1 }]}>Haptics (Vibrations)</Text>
          <Switch
            value={hapticsEnabled}
            onValueChange={(val) => {
              if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHapticsEnabled(val);
            }}
            trackColor={{ false: t.colors.border, true: t.colors.accent }}
          />
        </View>
        <View style={[styles.optionRow, { borderBottomWidth: 0 }]}>
          <Volume2 size={20} color={t.colors.textMuted} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: t.colors.text, flex: 1 }]}>Timer Sounds</Text>
          <Switch
            value={soundEnabled}
            onValueChange={(val) => {
              if (val && hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSoundEnabled(val);
            }}
            trackColor={{ false: t.colors.border, true: t.colors.accent }}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: t.colors.card, marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: t.colors.textMuted }]}>DATA MANAGEMENT</Text>
        <Pressable
          style={[styles.optionRow, { borderBottomWidth: 0 }]}
          onPress={() => {
            if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
              'Reset All Data',
              'Are you sure you want to delete all workouts, streaks, and settings? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reset', 
                  style: 'destructive',
                  onPress: () => {
                    useStore.getState().resetAll();
                    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.back();
                  }
                }
              ]
            );
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Trash2 size={20} color={t.colors.accent} />
            <Text style={[styles.optionText, { color: t.colors.accent, fontWeight: '700' }]}>Reset All Data</Text>
          </View>
        </Pressable>
      </View>

      {/* About & Legal Section */}
      <Text style={[styles.sectionTitle, { color: t.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16 }]}>
        About & Legal
      </Text>
      <View style={[styles.section, { backgroundColor: t.colors.card }]}>
        <Pressable 
          style={[styles.optionRow, { borderBottomColor: t.colors.border }]}
          onPress={() => router.push('/privacy')}
        >
          <Shield size={20} color={t.colors.textMuted} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: t.colors.text }]}>Privacy Policy</Text>
          <ChevronRight size={16} color={t.colors.border} style={{ marginLeft: 'auto' }} />
        </Pressable>
        <Pressable 
          style={[styles.optionRow, { borderBottomColor: t.colors.border }]}
          onPress={() => router.push('/terms')}
        >
          <FileText size={20} color={t.colors.textMuted} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: t.colors.text }]}>Terms of Use</Text>
          <ChevronRight size={16} color={t.colors.border} style={{ marginLeft: 'auto' }} />
        </Pressable>
        <Pressable 
          style={[styles.optionRow, { borderBottomWidth: 0 }]}
          onPress={() => Linking.openURL('mailto:emirdemirci1637@gmail.com')}
        >
          <Mail size={20} color={t.colors.textMuted} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: t.colors.text }]}>Contact Support</Text>
          <ChevronRight size={16} color={t.colors.border} style={{ marginLeft: 'auto' }} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: t.colors.textMuted }]}>Designed by Emir Demirci</Text>
        <Text style={[styles.footerVersion, { color: t.colors.textMuted }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dragIndicator: { width: 40, height: 5, borderRadius: 3 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionIcon: { marginRight: 12 },
  optionText: { fontSize: 16, fontWeight: '500' },
  footer: {
    marginTop: 48,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  footerVersion: {
    fontSize: 10,
    fontWeight: '400',
    opacity: 0.5,
  }
});
