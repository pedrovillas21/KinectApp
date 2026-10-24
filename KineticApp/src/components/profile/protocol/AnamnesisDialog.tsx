import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { hasMedicalInfo } from '../../../constants/protocol';
import { KINETIC } from '../../../theme/kinetic';
import { Button, Dialog, Text, TextField } from '../../ui';

interface AnamnesisDialogProps {
  visible: boolean;
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

/** Lesões, dores e restrições que a IA deve considerar. Vazio = "Nenhuma". */
export default function AnamnesisDialog({ visible, value, onSave, onClose }: AnamnesisDialogProps) {
  const [text, setText] = useState<string>(hasMedicalInfo(value) ? value : '');

  useEffect(() => {
    if (visible) setText(hasMedicalInfo(value) ? value : '');
  }, [visible, value]);

  const handleSave = () => {
    const trimmed = text.trim();
    onSave(trimmed.length > 0 ? trimmed : 'Nenhuma');
    onClose();
  };

  return (
    <Dialog visible={visible} onClose={onClose} title="Anamnese">
      <View style={styles.body}>
        <Text variant="body" color={KINETIC.textDim}>
          Possui alguma lesão, dor articular ou restrição médica que a IA deva considerar?
        </Text>
        <TextField
          label="Lesões e restrições"
          value={text}
          onChangeText={setText}
          placeholder="Ex: hérnia de disco L4-L5, dor no ombro direito, asma…"
          multiline
          numberOfLines={4}
          maxLength={2000}
          hint="Deixe em branco se não houver restrições."
        />
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
