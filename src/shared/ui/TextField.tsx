import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

type Props = TextInputProps & { label: string; error?: string; hint?: string };

/** Themed labelled input with an optional error or hint line. */
export function TextField({ label, error, hint, style, editable = true, ...props }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        editable={editable}
        placeholderTextColor={colors.muted}
        style={[styles.input, !!error && styles.inputError, !editable && styles.disabled, style]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { marginBottom: 16 },
    label: { color: c.muted, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      color: c.text,
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    inputError: { borderColor: c.error },
    disabled: { opacity: 0.6 },
    error: { color: c.error, fontSize: 13, marginTop: 6 },
    hint: { color: c.muted, fontSize: 12, marginTop: 6 },
  });
