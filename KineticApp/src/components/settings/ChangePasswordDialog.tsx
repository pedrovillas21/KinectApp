import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Dialog, Text, TextField } from '../ui';
import { PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from '../../constants/password';
import { useColors } from '../../theme/ThemeContext';


interface ChangePasswordDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
}

export default function ChangePasswordDialog({ visible, onClose, onSubmit, onSuccess }: ChangePasswordDialogProps) {
  const c = useColors();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setShow(false);
      setError('');
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!current || !next || !confirm) return setError('Preencha todos os campos.');
    if (!PASSWORD_REGEX.test(next)) {
      return setError(PASSWORD_RULE_MESSAGE);
    }
    if (next !== confirm) return setError('A confirmação não corresponde à nova senha.');
    if (next === current) return setError('A nova senha deve ser diferente da atual.');

    setError('');
    setSubmitting(true);
    const result = await onSubmit(current, next);
    setSubmitting(false);

    if (result.success) {
      onClose();
      onSuccess();
    } else {
      setError(result.error || 'Não foi possível alterar a senha.');
    }
  };

  const secure = !show;

  return (
    <Dialog visible={visible} onClose={onClose} title="Alterar senha">
      <View style={styles.body}>
        <TextField label="Senha atual" value={current} onChangeText={setCurrent} placeholder="••••••••" secureTextEntry={secure} autoCapitalize="none" autoComplete="current-password" />
        <TextField label="Nova senha" value={next} onChangeText={setNext} placeholder="••••••••" secureTextEntry={secure} autoCapitalize="none" autoComplete="new-password" />
        <TextField label="Confirmar nova senha" value={confirm} onChangeText={setConfirm} placeholder="••••••••" secureTextEntry={secure} autoCapitalize="none" autoComplete="new-password" />

        <Pressable accessibilityRole="button" onPress={() => setShow((v) => !v)} hitSlop={8} style={styles.toggle}>
          <Text variant="captionStrong" color={c.primary}>
            {show ? 'Ocultar senhas' : 'Mostrar senhas'}
          </Text>
        </Pressable>

        {error ? (
          <Text variant="caption" color={c.danger} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <View style={styles.row}>
          <Button label="Cancelar" variant="secondary" size="md" block disabled={submitting} onPress={onClose} style={styles.flex} />
          <Button label="Salvar" size="md" block loading={submitting} onPress={handleSubmit} style={styles.flex} />
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14 },
  toggle: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
