import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

export type AlertType = 'info' | 'success' | 'warning' | 'danger' | 'error' | 'question';

export type AlertButton = {
  text: string;
  /** "cancel" is the quiet button, "destructive" is red; anything else is the main action. */
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AlertOptions = {
  type?: AlertType;
  /** Overrides the icon the type would show. */
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  /** Closes itself after this many milliseconds. Meant for alerts that need no answer. */
  timer?: number;
};

const ICONS: Record<AlertType, keyof typeof Ionicons.glyphMap> = {
  info: 'information',
  success: 'checkmark',
  warning: 'warning',
  danger: 'alert',
  error: 'close',
  question: 'help',
};

type Props = AlertOptions & { onClose: (button?: AlertButton) => void };

/** A themed alert card: coloured icon, title, message and buttons over a dimmed screen. */
export function AlertCard({ type = 'info', icon, title, message, buttons, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const tint = {
    info: colors.accent,
    success: '#10B981',
    warning: '#F59E0B',
    danger: colors.error,
    error: colors.error,
    question: colors.accent,
  }[type];

  const actions = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
  // The Android back button and a tap outside close it like the quiet button. A lone OK is just an
  // acknowledgement, so closing it any way counts as pressing it.
  const dismiss = () =>
    onClose(actions.find((b) => b.style === 'cancel') ?? (actions.length === 1 ? actions[0] : undefined));

  return (
    <Modal transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Close" />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={[styles.icon, { backgroundColor: tint }]}>
            <Ionicons name={icon ?? ICONS[type]} size={24} color="#fff" />
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttons}>
            {actions.map((button) => {
              const quiet = button.style === 'cancel';
              const danger = button.style === 'destructive';
              return (
                <Pressable
                  key={button.text}
                  onPress={() => onClose(button)}
                  style={({ pressed }) => [
                    styles.button,
                    quiet ? styles.buttonQuiet : { backgroundColor: danger ? colors.error : tint },
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.buttonText, quiet && { color: colors.text }]}>{button.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 18,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    title: { color: c.text, fontSize: 19, fontWeight: '700', textAlign: 'center', marginTop: 14 },
    message: { color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
    buttons: { alignSelf: 'stretch', gap: 10, marginTop: 22 },
    button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    buttonQuiet: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.border },
    buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  });
