import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ageFromBirthDate } from '../../../constants/protocol';
import { Button, Dialog, Text, TextField } from '../../ui';
import { KINETIC } from '../../../theme/kinetic';
import type { ProtocolForm } from './types';

interface MetricsDialogProps {
  visible: boolean;
  form: ProtocolForm;
  onSave: (patch: Pick<ProtocolForm, 'weight' | 'height' | 'birthDate'>) => void;
  onClose: () => void;
}

// Converte ISO YYYY-MM-DD ↔ exibição DD/MM/AAAA
function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return '';
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** Data de nascimento, peso e altura. */
export default function MetricsDialog({ visible, form, onSave, onClose }: MetricsDialogProps) {
  const [weight, setWeight] = useState<string>(form.weight ? String(form.weight) : '');
  const [height, setHeight] = useState<string>(form.height ? String(form.height) : '');
  const [birthDisplay, setBirthDisplay] = useState<string>(isoToDisplay(form.birthDate));
  const [error, setError] = useState<string>('');

  // Re-sincroniza ao reabrir com dados atualizados.
  useEffect(() => {
    if (visible) {
      setWeight(form.weight ? String(form.weight) : '');
      setHeight(form.height ? String(form.height) : '');
      setBirthDisplay(isoToDisplay(form.birthDate));
      setError('');
    }
  }, [visible, form.weight, form.height, form.birthDate]);

  const handleBirthChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    setBirthDisplay(formatted);
  };

  const handleSave = () => {
    const w = parseFloat(weight.replace(',', '.'));
    const h = parseFloat(height.replace(',', '.'));
    if (!w || w <= 0 || w > 500) return setError('Peso inválido.');
    if (!h || h <= 0 || h > 300) return setError('Altura inválida (cm).');

    const cleaned = birthDisplay.replace(/\D/g, '');
    if (cleaned.length !== 8) return setError('Data de nascimento incompleta.');
    const d = cleaned.slice(0, 2);
    const m = cleaned.slice(2, 4);
    const y = cleaned.slice(4, 8);
    const iso = `${y}-${m}-${d}`;
    // Constrói a data em horário local para evitar o problema de UTC midnight
    // que desloca o dia em fusos negativos (ex: Brasil UTC-3)
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const rollover =
      date.getFullYear() !== parseInt(y, 10) ||
      date.getMonth() + 1 !== parseInt(m, 10) ||
      date.getDate() !== parseInt(d, 10);
    if (Number.isNaN(date.getTime()) || rollover || date >= new Date()) {
      return setError('Data inválida ou no futuro.');
    }
    const ageYears = ageFromBirthDate(iso);
    if (ageYears == null || ageYears < 13 || ageYears > 120) {
      return setError('Idade deve estar entre 13 e 120 anos.');
    }

    onSave({ weight: w, height: h, birthDate: iso });
    onClose();
  };

  return (
    <Dialog visible={visible} onClose={onClose} title="Suas métricas">
      <View style={styles.body}>
        <TextField
          label="Data de nascimento"
          value={birthDisplay}
          onChangeText={handleBirthChange}
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          maxLength={10}
          autoCorrect={false}
          autoComplete="off"
          mono
        />
        <View style={styles.row}>
          <TextField
            label="Peso (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="78"
            keyboardType="decimal-pad"
            mono
            style={styles.flex}
          />
          <TextField
            label="Altura (cm)"
            value={height}
            onChangeText={setHeight}
            placeholder="175"
            keyboardType="number-pad"
            mono
            style={styles.flex}
          />
        </View>
        {error ? (
          <Text variant="caption" color={KINETIC.danger} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <View style={styles.row}>
          <Button label="Cancelar" variant="secondary" size="md" block onPress={onClose} style={styles.flex} />
          <Button label="Salvar" size="md" block onPress={handleSave} style={styles.flex} />
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
