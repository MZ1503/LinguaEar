import React, { useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { authColors } from './authStyles';

export const CODE_LENGTH = 6;

export type CodeInputHandle = { focus: () => void };

type Props = {
  value: string;
  onChange: (digits: string) => void;
  /** Called once, when the last digit is typed. */
  onComplete?: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  ref?: React.Ref<CodeInputHandle>;
};

/** Six digit boxes for a one-time code. A hidden input does the typing, so paste and iOS code suggestions work. */
export function CodeInput({ value, onChange, onComplete, error, disabled, autoFocus, ref }: Props) {
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  // The short delay lets a state change that is happening right now (like clearing the boxes after a wrong
  // code) finish first; focusing in the same instant is ignored by iOS.
  useImperativeHandle(ref, () => ({ focus: () => setTimeout(() => input.current?.focus(), 80) }), []);

  const handleChange = (text: string) => {
    // Input is ignored while a code is being checked. The field itself is never switched off:
    // turning `editable` off and on again makes iOS drop the keyboard and not take typing back.
    if (disabled) return;
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    onChange(digits);
    if (digits.length === CODE_LENGTH) onComplete?.(digits);
  };

  return (
    <View>
      <Pressable onPress={() => input.current?.focus()} style={styles.boxes} accessibilityLabel="Code">
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <View
            key={i}
            style={[
              styles.box,
              i === value.length && !disabled && styles.boxActive,
              !!error && styles.boxError,
            ]}
          >
            <Text style={styles.digit}>{value[i] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={input}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  box: {
    width: 46,
    height: 56,
    borderRadius: 12,
    backgroundColor: authColors.card,
    borderWidth: 1.5,
    borderColor: authColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: authColors.accent },
  boxError: { borderColor: authColors.error },
  digit: { color: authColors.text, fontSize: 24, fontWeight: '800' },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});
