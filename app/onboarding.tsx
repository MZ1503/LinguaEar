import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, useWindowDimensions, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/store/authStore';
import { authColors, authStyles as s } from '@/src/styles/authStyles';

type Icon = React.ComponentProps<typeof Ionicons>['name'];

const INTRO: { icon: Icon; title: string; body: string }[] = [
  {
    icon: 'ear',
    title: 'Hear it. Understand it.',
    body: 'Tap Listen and LinguaEar transcribes what people say around you in real time.',
  },
  {
    icon: 'school',
    title: 'Learn from every sentence',
    body: 'Get grammar breakdowns, alternative phrases and quick quizzes for what you just heard.',
  },
  {
    icon: 'dice',
    title: 'Practise in Game Mode',
    body: 'Role-play real scenarios, like immigration and daily life, and get scored on your replies.',
  },
];

const GOALS: { id: string; label: string; icon: Icon }[] = [
  { id: 'travel', label: 'Travel', icon: 'airplane' },
  { id: 'work', label: 'Work', icon: 'briefcase' },
  { id: 'study', label: 'Study', icon: 'book' },
  { id: 'immigration', label: 'Immigration', icon: 'document-text' },
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

type Page = { key: string };
const PAGES: Page[] = [...INTRO.map((_, i) => ({ key: `intro-${i}` })), { key: 'profile' }];

export default function Onboarding() {
  const { user, completeOnboarding } = useAuth();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Page>>(null);
  const [index, setIndex] = useState(0);
  const [goal, setGoal] = useState<string>();
  const [level, setLevel] = useState<string>();
  const [busy, setBusy] = useState(false);

  const last = index === PAGES.length - 1;

  const finish = async (skip = false) => {
    setBusy(true);
    await completeOnboarding(skip ? {} : { goal, level });
    // The root layout's route guard moves us into the app.
  };

  const next = () => {
    if (last) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const renderPage = ({ item, index: i }: { item: Page; index: number }) => {
    if (item.key === 'profile') {
      return (
        <View style={[styles.page, { width }]}>
          <Text style={s.title}>{user?.name ? `Nice to meet you, ${user.name.split(' ')[0]}` : 'Tell us about you'}</Text>
          <Text style={s.subtitle}>This helps us pick the right practice for you</Text>

          <Text style={s.label}>What are you learning for?</Text>
          <View style={styles.chips}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.chip, goal === g.id && styles.chipActive]}
                onPress={() => setGoal(g.id)}>
                <Ionicons name={g.icon} size={18} color={goal === g.id ? authColors.bg : authColors.accent} />
                <Text style={[styles.chipText, goal === g.id && styles.chipTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 12 }]}>Your English level</Text>
          <View style={styles.chips}>
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.chip, level === l && styles.chipActive]}
                onPress={() => setLevel(l)}>
                <Text style={[styles.chipText, level === l && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    const slide = INTRO[i];
    return (
      <View style={[styles.page, styles.center, { width }]}>
        <View style={styles.iconWrap}>
          <Ionicons name={slide.icon} size={64} color={authColors.accent} />
        </View>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={[s.subtitle, { marginBottom: 0 }]}>{slide.body}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.screen}>
      <View style={styles.top}>
        {!last && (
          <TouchableOpacity onPress={() => finish(true)} disabled={busy}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(p) => p.key}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <View key={p.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={[s.button, busy && s.buttonDisabled]} onPress={next} disabled={busy}>
          <Text style={s.buttonText}>{last ? "Let's go" : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { height: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 24 },
  skip: { color: authColors.muted, fontSize: 16, fontWeight: '600' },
  page: { paddingHorizontal: 24, paddingTop: 24 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 0 },
  iconWrap: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: authColors.card,
    borderWidth: 1,
    borderColor: authColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: authColors.border,
    backgroundColor: authColors.card,
  },
  chipActive: { backgroundColor: authColors.accent, borderColor: authColors.accent },
  chipText: { color: authColors.text, fontSize: 15, fontWeight: '600' },
  chipTextActive: { color: authColors.bg },
  bottom: { paddingHorizontal: 24, paddingBottom: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: authColors.border },
  dotActive: { width: 24, backgroundColor: authColors.accent },
});
