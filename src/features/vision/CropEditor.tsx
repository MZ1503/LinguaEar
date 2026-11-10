import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PanResponderInstance } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { containRect, defaultBox, dragBox, toImageRect } from './cropMath';
import type { Handle, Rect } from './cropMath';

type Props = {
  uri: string;
  imageWidth: number;
  imageHeight: number;
  busy?: boolean;
  onRetake: () => void;
  /** Called with the chosen area in pixels of the original photo. */
  onConfirm: (rect: Rect) => void;
};

type Latest = { box: Rect | null; bounds: Rect | null };

const HANDLE = 44;
const HANDLES: Handle[] = ['tl', 'tr', 'bl', 'br'];

function createResponders(latest: React.RefObject<Latest>, setBox: (box: Rect) => void) {
  const make = (handle: Handle): PanResponderInstance => {
    let start: Rect | null = null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start = latest.current.box;
      },
      onPanResponderMove: (_, g) => {
        const { bounds } = latest.current;
        if (start && bounds) setBox(dragBox(start, handle, g.dx, g.dy, bounds));
      },
    });
  };
  return { move: make('move'), tl: make('tl'), tr: make('tr'), bl: make('bl'), br: make('br') };
}

/** Shows a captured photo with a draggable, resizable box; the box is what gets scanned. */
export function CropEditor({ uri, imageWidth, imageHeight, busy, onRetake, onConfirm }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const [box, setBox] = useState<Rect | null>(null);

  const shown = useMemo(
    () => (area ? containRect(area.width, area.height, imageWidth, imageHeight) : null),
    [area, imageWidth, imageHeight],
  );
  const bounds = useMemo<Rect | null>(
    () => (shown ? { x: shown.x, y: shown.y, width: shown.width, height: shown.height } : null),
    [shown],
  );

  // Until the user drags, the box is the default one, so gestures must start from that, not from `null`.
  const activeBox = useMemo(() => box ?? (bounds ? defaultBox(bounds) : null), [box, bounds]);

  // The responders are built once, so they read the latest box and bounds through this ref.
  const latest = useRef<Latest>({ box: null, bounds: null });
  useEffect(() => {
    latest.current = { box: activeBox, bounds };
  });
  // The ref is only read later, inside gesture handlers, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  const [responders] = useState(() => createResponders(latest, setBox));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
    setBox(null); // re-center for the new size
  };

  const confirm = () => {
    if (activeBox && shown) onConfirm(toImageRect(activeBox, shown, imageWidth, imageHeight));
  };

  const useWholePhoto = () => bounds && setBox({ ...bounds });

  return (
    <View style={styles.screen}>
      <View style={styles.area} onLayout={onLayout}>
        {shown && (
          <Image
            source={{ uri }}
            style={{
              position: 'absolute',
              left: shown.x,
              top: shown.y,
              width: shown.width,
              height: shown.height,
            }}
          />
        )}

        {activeBox && bounds && (
          <>
            {/* Dim everything outside the box. */}
            <View style={[styles.dim, { left: 0, right: 0, top: 0, height: activeBox.y }]} />
            <View
              style={[styles.dim, { left: 0, right: 0, top: activeBox.y + activeBox.height, bottom: 0 }]}
            />
            <View
              style={[
                styles.dim,
                { left: 0, width: activeBox.x, top: activeBox.y, height: activeBox.height },
              ]}
            />
            <View
              style={[
                styles.dim,
                { left: activeBox.x + activeBox.width, right: 0, top: activeBox.y, height: activeBox.height },
              ]}
            />

            <View
              {...responders.move.panHandlers}
              style={[
                styles.box,
                { left: activeBox.x, top: activeBox.y, width: activeBox.width, height: activeBox.height },
              ]}
            />

            {HANDLES.map((h) => (
              <View
                key={h}
                {...responders[h].panHandlers}
                style={[
                  styles.handleHit,
                  {
                    left: activeBox.x + (h.endsWith('r') ? activeBox.width : 0) - HANDLE / 2,
                    top: activeBox.y + (h.startsWith('b') ? activeBox.height : 0) - HANDLE / 2,
                  },
                ]}
              >
                <View style={styles.handle} />
              </View>
            ))}
          </>
        )}
      </View>

      <Text style={styles.hint}>Drag the corners to frame just the text</Text>

      <View style={styles.actions}>
        <Pressable onPress={onRetake} disabled={busy} style={styles.secondary} accessibilityRole="button">
          <Ionicons name="camera-reverse-outline" size={18} color="#fff" />
          <Text style={styles.secondaryText}>Retake</Text>
        </Pressable>

        <Pressable
          onPress={useWholePhoto}
          disabled={busy}
          style={styles.secondary}
          accessibilityRole="button"
        >
          <Ionicons name="expand-outline" size={18} color="#fff" />
          <Text style={styles.secondaryText}>Full photo</Text>
        </Pressable>

        <Pressable
          onPress={confirm}
          disabled={busy || !activeBox}
          style={[styles.primary, (busy || !activeBox) && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <>
              <Ionicons name="scan" size={18} color={colors.onAccent} />
              <Text style={styles.primaryText}>Scan</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
    area: { flex: 1 },
    dim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)' },
    box: { position: 'absolute', borderWidth: 2, borderColor: c.accent },
    handleHit: {
      position: 'absolute',
      width: HANDLE,
      height: HANDLE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.accent,
      borderWidth: 3,
      borderColor: '#fff',
    },
    hint: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
    actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
    secondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    secondaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    primary: {
      flex: 1.3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: c.accent,
    },
    primaryText: { color: c.onAccent, fontSize: 15, fontWeight: '700' },
  });
