import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { accountErrorMessage, deleteMyAccount } from '../../services/accountService';

import { Button, Dialog, Text, TextField } from '../ui';
import { showAlert } from '../ui/AlertHost';
import { useColors } from '../../theme/ThemeContext';

interface DeleteAccountDialogProps {
  visible: boolean;
  onClose: () => void;
  /** Conta apagada no servidor: a tela encerra a sessão. */
  onDeleted: () => void;
  /** Abre o export antes de excluir. */
  onExport: () => void;
}

/**
 * Exclusão imediata e definitiva (LGPD art. 18), confirmada com a senha e com
 * um segundo alerta antes de chamar o backend.
 */
export default function DeleteAccountDialog({ visible, onClose, onDeleted, onExport }: DeleteAccountDialogProps) {
  const c = useColors();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      setPassword('');
      setError(null);
      setDeleting(false);
    }
  }, [visible]);

  const runDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteMyAccount(password);
      onDeleted();
    } catch (e) {
      setError(accountErrorMessage(e, 'Não foi possível excluir a conta agora. Tente novamente.'));
      setDeleting(false);
    }
  };

  const confirm = () => {
    if (!password) return setError('Digite sua senha para confirmar.');
    showAlert(
      'Excluir conta definitivamente?',
      'Seu perfil, treinos, fotos, medidas e amizades serão apagados agora. Isso não pode ser desfeito.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: runDelete },
      ],
    );
  };

  return (
    <Dialog visible={visible} onClose={onClose} title="Excluir minha conta" dismissable={!deleting}>
      <View style={styles.body}>
        <Text variant="body" color={c.textDim}>
          A exclusão apaga seu perfil, treinos, fotos, medidas e amizades de forma imediata e definitiva. Se você tem
          um personal, o vínculo é encerrado. Por obrigação legal ficam guardados, sem acesso pelo app: os registros
          de acesso (6 meses), os pagamentos que seu personal já registrou (só seu nome, valor e data) e as fichas
          que ele aprovou com inteligência artificial (5 anos, sem seu nome).
        </Text>
        <Button label="Exportar meus dados antes" icon="download" variant="secondary" size="md" block onPress={onExport} />
        <TextField
          label="Sua senha"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(null);
          }}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          error={error}
        />
        <View style={styles.row}>
          <Button label="Cancelar" variant="secondary" size="md" block disabled={deleting} onPress={onClose} style={styles.flex} />
          <Button label="Excluir conta" variant="danger" size="md" block loading={deleting} onPress={confirm} style={styles.flex} />
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
