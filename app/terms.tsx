import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/theme';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function TermsOfUse() {
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }} 
            style={styles.backBtn}
          >
            <ChevronLeft size={28} color={t.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: t.colors.text }]}>Terms of Use</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.date, { color: t.colors.textMuted }]}>Last Updated: September 2026</Text>
        
        <Text style={[styles.heading, { color: t.colors.text, marginTop: 0 }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          By downloading or using Ignite ("the App"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the App.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>2. Medical Disclaimer</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          Ignite is a productivity and fitness timer tool. We do not provide medical advice. Always consult with a qualified healthcare professional before beginning any new exercise routine. You use the App and perform physical activities at your own risk.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>3. Use of the App</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          You agree to use the App only for lawful purposes. The App and its original content, features, and functionality are owned by Emir Demirci and are protected by international copyright and intellectual property laws.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>4. User Data</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          All user data, including timer settings and workout logs, is stored locally on your device. We are not responsible for lost data resulting from deleting the App, factory resets, or device damage.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>5. Limitation of Liability</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          In no event shall the developer be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the App.
        </Text>

        <Text style={[styles.heading, { color: t.colors.text }]}>6. Contact Us</Text>
        <Text style={[styles.paragraph, { color: t.colors.text }]}>
          If you have any questions about these Terms, please contact us at emirdemirci1637@gmail.com.
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
