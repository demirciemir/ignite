import { View, Text, StyleSheet, Pressable, Alert, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, ThemePreference } from '../src/store';
import { useAppTheme } from '../src/theme';
import { ChevronLeft, Monitor, Moon, Sun, Trash2, Flame, Shield, FileText, Mail, ChevronRight } from 'lucide-react-native';

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  
  const themePref = useStore(s => s.themePreference);
  const setThemePref = useStore(s => s.setThemePreference);

  const handlePress = (pref: ThemePreference) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemePref(pref);
  };

  const Option = ({ pref, title, icon: Icon }: { pref: ThemePreference, title: string, icon: any }) => (
    <Pressable
      style={[
        styles.optionRow, 
        { borderBottomColor: t.colors.border },
        themePref === pref && { backgroundColor: t.colors.buttonSecondary }
      ]}
      onPress={() => handlePress(pref)}
    >
      <View style={styles.optionIcon}>
        <Icon size={20} color={themePref === pref ? t.colors.accent : t.colors.text} />
      </View>
      <Text style={[styles.optionText, { color: t.colors.text }]}>{title}</Text>
    </Pressable>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: t.colors.background }]} 
      contentContainerStyle={{ paddingTop: Math.max(insets.top, 10), paddingBottom: Math.max(insets.bottom, 20) }}
    >
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View style={[styles.dragIndicator, { backgroundColor: t.colors.border }]} />
      </View>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={28} color={t.colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.section, { backgroundColor: t.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: t.colors.textMuted }]}>APPEARANCE</Text>
        <Option pref="system" title="System Default" icon={Monitor} />
        <Option pref="light" title="Light" icon={Sun} />
        <Option pref="dark" title="Dark" icon={Moon} />
      </View>

      <View style={[styles.section, { backgroundColor: t.colors.card, marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: t.colors.textMuted }]}>DEVELOPER TOOLS</Text>
        <Pressable
          style={[styles.optionRow, { borderBottomColor: t.colors.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            useStore.setState({ justEarnedStreak: true });
            router.back();
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Flame size={20} color={t.colors.textMuted} />
            <Text style={[styles.optionText, { color: t.colors.text }]}>Test Streak Animation</Text>
          </View>
        </Pressable>
      </View>

      <View style={[styles.section, { backgroundColor: t.colors.card, marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: t.colors.textMuted }]}>DATA MANAGEMENT</Text>
        <Pressable
          style={[styles.optionRow, { borderBottomWidth: 0 }]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  title: { fontSize: 20, fontWeight: '700' },
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
