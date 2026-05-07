import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../theme/colors';
import api from '../services/api';

interface EvolutionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EvolutionModal({ visible, onClose, onSuccess }: EvolutionModalProps) {
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!weight) return;
    setLoading(true);
    try {
      const parsedWeight = parseFloat(weight.replace(',', '.'));
      await api.post('/users/weight', { newWeight: parsedWeight });
      
      Alert.alert(
        'Peso Atualizado',
        'Deseja atualizar sua ficha de treinos baseada no seu novo peso?',
        [
          { text: 'Não, manter os atuais', onPress: () => { onSuccess(); onClose(); }, style: 'cancel' },
          { text: 'Sim, recriar ficha!', onPress: handleRegenerate }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o peso.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    // A chamada a seguir presume que haja uma rota pro Gemini.
    // Você pode ter que ajustar de acordo com a implementação real de geração
    setLoading(true);
    try {
      await api.post('/workouts/generate', { days: 5, target: 'hypertrophy' }); // Mock payload, adjust as needed
      Alert.alert('Sucesso!', 'Seus treinos foram atualizados.');
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Houve um erro ao regerar o treino.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Hora do Check-in Mensal!</Text>
          <Text style={styles.subtitle}>Já faz 30 dias desde seu último registro. Informe seu peso atual (em jejum) para podermos ajustar seus treinos se necessário.</Text>
          
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ex: 80,5"
            placeholderTextColor="#888"
            value={weight}
            onChangeText={setWeight}
          />
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.neonBlue} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
                <Text style={styles.primaryButtonText}>SALVAR PESO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Lembrar mais tarde</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center'
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24
  },
  input: {
    backgroundColor: '#333',
    width: '100%',
    color: '#FFF',
    fontSize: 20,
    textAlign: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24
  },
  primaryButton: {
    backgroundColor: COLORS.neonBlue,
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16
  },
  cancelButton: {
    padding: 12
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 14
  }
});
