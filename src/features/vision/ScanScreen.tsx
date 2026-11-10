import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHistory } from '@/src/features/history';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { CropEditor } from './CropEditor';
import type { Rect } from './cropMath';
import { scanImage } from './visionService';
import type { Direction, ScannedPhrase } from './visionService';
import { useAlert } from '@/src/shared/ui/AlertProvider';

const DIRECTIONS: { id: Direction; label: string }[] = [
  { id: 'de-en', label: 'DE → EN' },
  { id: 'en-de', label: 'EN → DE' },
  { id: 'auto', label: 'Auto' },
];

type Photo = { uri: string; width: number; height: number };

const LIVE_INTERVAL_MS = 2500;
const MAX_WIDTH = 1024;

export function ScanScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  const camera = useRef<CameraView>(null);
  const busy = useRef(false);
  const history = useHistory();
  const alert = useAlert();
  // Phrases saved from this screen, so the button shows as done; `pending` blocks double taps.
  const [savedPhrases, setSavedPhrases] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [direction, setDirection] = useState<Direction>('de-en');
  const [live, setLive] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [scanning, setScanning] = useState(false);
  const [phrases, setPhrases] = useState<ScannedPhrase[]>([]);
  const [message, setMessage] = useState('Point the camera at some text.');

  /** Takes a photo. Orientation is left to the camera, so the image is upright and its size is reliable. */
  const capture = useCallback(async (): Promise<Photo> => {
    if (!camera.current || !ready) throw new Error('The camera is not ready yet.');
    const photo = await camera.current.takePictureAsync({ quality: 0.8, shutterSound: false });
    return { uri: photo.uri, width: photo.width, height: photo.height };
  }, [ready]);

  /** Optionally crops a photo, shrinks it and sends it to be read and translated. */
  const recognize = useCallback(
    async (photo: Photo, crop?: Rect) => {
      // A small JPEG is enough to read signs and costs far less to upload.
      const source = crop ?? { x: 0, y: 0, width: photo.width, height: photo.height };
      const actions: ImageManipulator.Action[] = [];
      if (crop)
        actions.push({ crop: { originX: crop.x, originY: crop.y, width: crop.width, height: crop.height } });
      if (source.width > MAX_WIDTH) actions.push({ resize: { width: MAX_WIDTH } });

      const small = await ImageManipulator.manipulateAsync(photo.uri, actions, {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });
      const { phrases: found, skippedLanguage } = await scanImage(small.base64 ?? '', direction);
      setPhrases(found);
      setMessage(
        found.length
          ? ''
          : skippedLanguage === 'de'
            ? 'That text is German. Switch to DE → EN (or Auto) to translate it.'
            : skippedLanguage === 'en'
              ? 'That text is English. Switch to EN → DE (or Auto) to translate it.'
              : 'No text found. Try cropping closer to the text.',
      );
    },
    [direction],
  );

  /** Runs `job` with the busy flag and spinner, and turns failures into the on-screen message. */
  const guarded = useCallback(async (job: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setScanning(true);
    try {
      await job();
    } catch (err) {
      console.warn('Scan failed:', err);
      setMessage(err instanceof Error ? err.message : 'Scan failed. Try again.');
    } finally {
      busy.current = false;
      setScanning(false);
    }
  }, []);

  // Live mode scans the whole frame on a timer.
  const scan = useCallback(
    () => guarded(async () => recognize(await capture())),
    [guarded, recognize, capture],
  );

  // Shutter: freeze the frame so the text can be framed before scanning.
  const takePhoto = () =>
    guarded(async () => {
      setLive(false);
      setPhoto(await capture());
    });

  const scanCropped = (rect: Rect) =>
    guarded(async () => {
      if (!photo) return;
      await recognize(photo, rect);
      setPhoto(null);
    });

  // Live mode: scan, wait, repeat. Stops when the tab loses focus or the switch is turned off.
  useEffect(() => {
    if (!live || !focused) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await scan();
      if (!cancelled) timer = setTimeout(tick, LIVE_INTERVAL_MS);
    };
    timer = setTimeout(tick, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [live, focused, scan]);

  // Leaving the tab turns live mode off and silences any speech.
  useFocusEffect(
    useCallback(
      () => () => {
        setLive(false);
        Speech.stop();
      },
      [],
    ),
  );

  const save = async (p: ScannedPhrase) => {
    const key = p.original.toLowerCase();
    if (savedPhrases.has(key) || pending.has(key)) return;
    setPending((s) => new Set(s).add(key));
    try {
      await history.save({ transcript: p.original, translation: p.translation, source: 'scan' });
      setSavedPhrases((s) => new Set(s).add(key));
    } catch (err) {
      alert.error('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setPending((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }
  };

  /** Hides the results (or the hint) so the camera view is clear again. */
  const dismiss = () => {
    Speech.stop();
    setPhrases([]);
    setMessage('');
  };

  const speak = (p: ScannedPhrase) => {
    // Read out whichever side is German.
    const germanText = p.language === 'de' ? p.original : p.translation;
    Speech.stop();
    Speech.speak(germanText, { language: 'de-DE', rate: 0.9 });
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Ionicons name="camera-outline" size={44} color={colors.accent} />
        <Text style={styles.permTitle}>Camera access</Text>
        <Text style={styles.permText}>
          Point your camera at signs, menus or letters and see them translated instantly. Photos are sent for
          translation and never stored.
        </Text>
        <Pressable style={styles.permButton} onPress={requestPermission} accessibilityRole="button">
          <Text style={styles.permButtonText}>
            {permission.canAskAgain ? 'Allow camera' : 'Open settings to allow'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {focused && (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setReady(true)}
        />
      )}

      {photo && (
        <CropEditor
          uri={photo.uri}
          imageWidth={photo.width}
          imageHeight={photo.height}
          busy={scanning}
          onRetake={() => setPhoto(null)}
          onConfirm={scanCropped}
        />
      )}

      {!photo && (
        <>
          <View style={styles.top} pointerEvents="box-none">
            <View style={styles.segment}>
              {DIRECTIONS.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => setDirection(d.id)}
                  style={[styles.segItem, direction === d.id && styles.segActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: direction === d.id }}
                >
                  <Text style={[styles.segText, direction === d.id && styles.segTextActive]}>{d.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.bottom} pointerEvents="box-none">
            {(phrases.length > 0 || !!message) && (
              <View style={styles.sheet}>
                <Pressable
                  onPress={dismiss}
                  hitSlop={10}
                  style={styles.close}
                  accessibilityRole="button"
                  accessibilityLabel="Close results"
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
                {!!message && phrases.length === 0 ? (
                  <Text style={styles.hint}>{message}</Text>
                ) : (
                  <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
                    {phrases.map((p, i) => (
                      <View key={`${p.original}-${i}`} style={[styles.row, i > 0 && styles.rowBorder]}>
                        <View style={styles.rowText}>
                          <Text style={styles.original}>{p.original}</Text>
                          <Text style={styles.translation}>{p.translation}</Text>
                        </View>
                        <Pressable
                          onPress={() => speak(p)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel="Listen"
                        >
                          <Ionicons name="volume-high-outline" size={22} color={colors.accent} />
                        </Pressable>
                        <Pressable
                          onPress={() => save(p)}
                          disabled={savedPhrases.has(p.original.toLowerCase())}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel="Save phrase"
                        >
                          {pending.has(p.original.toLowerCase()) ? (
                            <ActivityIndicator size="small" color={colors.accent} />
                          ) : (
                            <Ionicons
                              name={
                                savedPhrases.has(p.original.toLowerCase()) ? 'bookmark' : 'bookmark-outline'
                              }
                              size={22}
                              color={colors.accent}
                            />
                          )}
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <View style={styles.controls}>
              <Pressable
                onPress={() => setLive((v) => !v)}
                style={[styles.liveButton, live && styles.liveActive]}
                accessibilityRole="switch"
                accessibilityState={{ checked: live }}
              >
                <View style={[styles.dot, live && styles.dotActive]} />
                <Text style={[styles.liveText, live && styles.liveTextActive]}>Live</Text>
              </Pressable>

              <Pressable
                onPress={takePhoto}
                disabled={scanning || !ready}
                style={styles.shutterRing}
                accessibilityRole="button"
                accessibilityLabel="Scan text"
              >
                <View style={styles.shutter}>
                  {scanning && <ActivityIndicator color={colors.onAccent} />}
                </View>
              </Pressable>

              <View style={styles.liveButton} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },
    center: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: c.bg },
    permTitle: { color: c.text, fontSize: 22, fontWeight: '800' },
    permText: { color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
    permButton: {
      marginTop: 8,
      backgroundColor: c.accent,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 28,
    },
    permButtonText: { color: c.onAccent, fontSize: 16, fontWeight: '700' },
    top: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
    segment: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    segItem: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999 },
    segActive: { backgroundColor: c.accent },
    segText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    segTextActive: { color: c.onAccent },
    bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 14 },
    sheet: {
      backgroundColor: 'rgba(11, 15, 25, 0.88)',
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.15)',
      padding: 14,
    },
    close: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 1,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    results: { maxHeight: 240, marginTop: 24 },
    hint: { color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 28 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.15)' },
    rowText: { flex: 1 },
    original: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
    translation: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 2 },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    liveButton: {
      width: 84,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 999,
    },
    liveActive: { backgroundColor: 'rgba(0,0,0,0.55)' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: '#ef4444' },
    liveText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700' },
    liveTextActive: { color: '#fff' },
    shutterRing: {
      width: 78,
      height: 78,
      borderRadius: 39,
      borderWidth: 3,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutter: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
