import re

with open('app/streak.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add to destructuring
content = content.replace('      totalMinutesLogged,', '      totalMinutesLogged,\n      totalWorkSeconds,\n      totalRestSeconds,\n      totalRounds,')

# Add Activity, Timer icons
content = content.replace('Flame, ChevronLeft, ShieldCheck, ArrowRight, CalendarDays, Award }', 'Flame, ChevronLeft, ShieldCheck, ArrowRight, CalendarDays, Award, Activity, Timer }')

# Format time
formatted_time_block = '''  const formatHMS = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formattedTime = useMemo(() => {
    return formatHMS((totalMinutesLogged * 60) + (totalWorkSeconds || 0));
  }, [totalMinutesLogged, totalWorkSeconds]);'''

content = re.sub(r'const formattedTime = useMemo\(\(\) => \{[\s\S]*?\}, \[totalMinutesLogged\]\);', formatted_time_block, content)


# Stats bento layout
stats_bento = '''        {/* Secondary Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBoxSmall, { backgroundColor: t.colors.card }]}>
            <View style={styles.statBoxHeader}>
              <Activity size={16} color={t.colors.accent} />
              <Text style={[styles.statBoxLabel, { color: t.colors.textMuted }]}>Work</Text>
            </View>
            <Text style={[styles.statBoxValue, { color: t.colors.text }]}>{formatHMS(totalWorkSeconds || 0)}</Text>
          </View>
          
          <View style={[styles.statBoxSmall, { backgroundColor: t.colors.card }]}>
            <View style={styles.statBoxHeader}>
              <Timer size={16} color="#0A84FF" />
              <Text style={[styles.statBoxLabel, { color: t.colors.textMuted }]}>Rest</Text>
            </View>
            <Text style={[styles.statBoxValue, { color: t.colors.text }]}>{formatHMS(totalRestSeconds || 0)}</Text>
          </View>

          <View style={[styles.statBoxSmall, { backgroundColor: t.colors.card }]}>
            <View style={styles.statBoxHeader}>
              <Award size={16} color="#34C759" />
              <Text style={[styles.statBoxLabel, { color: t.colors.textMuted }]}>Rounds</Text>
            </View>
            <Text style={[styles.statBoxValue, { color: t.colors.text }]}>{totalRounds || 0}</Text>
          </View>
        </View>

        {/* Restore Section */}'''

content = content.replace('        {/* Restore Section */}', stats_bento)

# Styles
styles_addition = '''    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statBoxSmall: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
    },
    statBoxHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    statBoxLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    statBoxValue: {
      fontSize: 18,
      fontWeight: '800',
    },
    restoreCard: {'''

content = content.replace('    restoreCard: {', styles_addition)

with open('app/streak.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
