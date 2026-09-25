import { useStore } from '../src/store';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/theme';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function PrivacyPolicy() {
  const hapticsEnabled = useStore(s => s.hapticsEnabled);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={[styles.dragIndicator, { backgroundColor: t.colors.border }]} />
        </View>
        <View style={styles.headerContent}>
          <Pressable 
            onPress={() => {
              if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }} 
            style={styles.backBtn}
          >
            <ChevronLeft size={28} color={t.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: t.colors.text }]}>Privacy Policy</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.date, { color: t.colors.textMuted }]}>Last Updated: September 2026</Text>
        
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          Thank you for choosing Ignite (“we”, “us”, “our”). We are committed to protecting your personal information and your right to privacy.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>1. Data Collection</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          Ignite is designed with a privacy-first approach. We do not collect, transmit, distribute, or sell your personal data. All data created within the app, including your routines, workout history, and streaks, is saved entirely locally on your device.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>2. Third-Party Access</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          Because your data is stored locally, no third-party services, including us, have access to your personal timer data or usage habits. 
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>3. Analytics & Tracking</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          We do not use any third-party tracking, advertising SDKs, or analytics tools that monitor your behavior across other apps or websites.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>4. Changes to this Policy</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          We may update this Privacy Policy from time to time. The updated version will be indicated by an updated “Last Updated” date.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>5. Contact Us</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          If you have questions or comments about this notice, you may email us at emirdemirci1637@gmail.com.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  dragIndicator: { width: 40, height: 5, borderRadius: 3 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4, marginLeft: -4 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 64 },
  date: { fontSize: 13, fontWeight: '600', marginBottom: 24 },
  heading: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  paragraph: { fontSize: 15, lineHeight: 24, opacity: 0.9 },
});
