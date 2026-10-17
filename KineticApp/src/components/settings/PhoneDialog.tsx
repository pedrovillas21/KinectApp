import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { isValidCellPhone, maskCellPhone } from '../../utils/whatsapp';
import { Button, Dialog, TextField } from '../ui';

interface PhoneDialogProps {
  visible: boolean;
  value: string | null;
  onClose: () => void;
  onSaved: (phone: string) => void;
}

/** Celular (WhatsApp) do usuário. */
export default function PhoneDialog({ visible, value, onClose, onSaved }: PhoneDialogProps) {
  // Pelo AuthContext para o usuário em memória também ficar com o número novo.
  const { updatePhone } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setPhone(value ? maskCellPhone(value) : '');
      setError('');
      setSubmitting(false);
    }
  }, [visible, value]);

  const handleSubmit = async () => {
    if (!isValidCellPhone(phone)) {
      return setError('Informe um celular válido com DDD, ex.: (11) 98765-4321.');
    }

    setError('');
    setSubmitting(true);
    const result = await updatePhone(phone);
    setSubmitting(false);
    if (!result.success) {
      return setError(result.error);
    }
    onSaved(phone.replace(/\D/g, ''));
    onClose();
  };

  return (
    <Dialog visible={visible} onClose={onClose} title="Celular (WhatsApp)">
      <View style={styles.body}>
        <TextField
          label="Celular com DDD"
          value={phone}
          onChangeText={(text) => setPhone(maskCellPhone(text))}
          placeholder="(11) 98765-4321"
          keyboardType="phone-pad"
          maxLength={15}
          autoFocus
          mono
          error={error || null}
          hint="Só aparece para o seu personal enquanto o vínculo estiver ativo."
        />
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
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
