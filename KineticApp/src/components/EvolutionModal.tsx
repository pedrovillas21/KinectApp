import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Text, TextField } from './ui';

import api from '../services/api';
import { useColors } from '../theme/ThemeContext';

interface EvolutionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Leva ao protocolo, onde a ficha é regerada com os dados completos do aluno. */
  onReviewProtocol: () => void;
}

/** Check-in mensal de peso. Depois de salvar, oferece revisar o protocolo. */
export default function EvolutionModal({ visible, onClose, onSuccess, onReviewProtocol }: EvolutionModalProps) {
  const c = useColors();
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      setWeight('');
      setError('');
      setSaved(false);
    }
  }, [visible]);

  const handleSave = async () => {
    const parsed = Number(weight.replace(',', '.'));
    if (!parsed || parsed < 20 || parsed > 500) {
      setError('Informe um peso entre 20 e 500 kg.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/users/weight', { newWeight: parsed });
      setSaved(true);
    } catch {
      setError('Não foi possível salvar o peso. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Dialog visible={visible} onClose={onSuccess} title="Peso registrado">
        <View style={styles.body}>
          <Text variant="body" color={c.textDim}>
            Quer revisar seu protocolo? Com o peso novo, você pode gerar uma ficha ajustada.
          </Text>
          <View style={styles.row}>
            <Button label="Agora não" variant="secondary" size="md" block onPress={onSuccess} style={styles.flex} />
            <Button
              label="Revisar"
              size="md"
              block
              onPress={() => {
                onSuccess();
                onReviewProtocol();
              }}
              style={styles.flex}
            />
          </View>
        </View>
      </Dialog>
    );
  }

  return (
    <Dialog visible={visible} onClose={onClose} title="Check-in mensal">
      <View style={styles.body}>
        <Text variant="body" color={c.textDim}>
          Já faz 30 dias desde o seu último registro. Informe seu peso atual, de preferência em jejum.
        </Text>
        <TextField
          label="Peso atual (kg)"
          value={weight}
          onChangeText={setWeight}
          placeholder="80,5"
          keyboardType="decimal-pad"
          maxLength={6}
          mono
          error={error || null}
        />
        <View style={styles.row}>
          <Button label="Depois" variant="secondary" size="md" block onPress={onClose} style={styles.flex} />
          <Button label="Salvar" size="md" block loading={saving} disabled={!weight.trim()} onPress={handleSave} style={styles.flex} />
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
