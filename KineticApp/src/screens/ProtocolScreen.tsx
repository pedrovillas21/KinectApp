import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import OptionPickerDialog from '../components/profile/protocol/OptionPickerDialog';
import MetricsDialog from '../components/profile/protocol/MetricsDialog';
import AnamnesisDialog from '../components/profile/protocol/AnamnesisDialog';
import type { ProtocolForm } from '../components/profile/protocol/types';
import { Button, ListGroup, ListRow, Screen, StackHeader, Text } from '../components/ui';
import {
  ageFromBirthDate,
  FREQUENCY_OPTIONS,
  GOAL_OPTIONS,
  goalLabel,
  hasMedicalInfo,
  LEVEL_OPTIONS,
  levelLabel,
} from '../constants/protocol';
import api from '../services/api';
import { KINETIC } from '../theme/kinetic';
import type { MainStackScreenProps } from '../navigation/types';
import type { GenerateWorkoutRequest, UserProfileResponse } from '../types';
import { showAlert } from '../components/ui/AlertHost';

type ProtocolDialog = 'goal' | 'metrics' | 'level' | 'frequency' | 'anamnesis' | null;

/**
 * "Meu protocolo": o que alimenta a IA. As edições ficam locais e vão para o
 * backend ao regenerar o treino (mesma lógica da antiga tela Perfil).
 */
export default function ProtocolScreen({ navigation }: MainStackScreenProps<'Protocol'>) {
  const [form, setForm] = useState<ProtocolForm | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ProtocolDialog>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    api
      .get<UserProfileResponse>('/users/profile')
      .then(({ data: p }) =>
        setForm({
          goal: p.targetGoal ?? '',
          weight: p.weight ?? 0,
          height: p.height ?? 0,
          birthDate: p.birthDate ?? '',
          level: p.level ?? '',
          frequency: p.frequency ?? 0,
          medicalConditions: p.medicalConditions ?? '',
        }),
      )
      .catch(() => setLoadFailed(true));
  }, []);

  const patchForm = (patch: Partial<ProtocolForm>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleRegenerate = async () => {
    if (!form) return;
    const { goal, weight, height, birthDate, level, frequency, medicalConditions } = form;

    if (!goal || !level || !birthDate || !weight || !height || !frequency) {
      showAlert('Dados incompletos', 'Preencha objetivo, métricas, nível e frequência antes de regenerar o treino.');
      return;
    }

    try {
      setIsRegenerating(true);
      const payload: GenerateWorkoutRequest = {
        birthDate,
        weight,
        height,
        goal,
        frequency,
        level,
        medicalConditions: medicalConditions?.trim() || 'Nenhuma',
      };
      // O backend tenta até N modelos com 120s de read timeout cada.
      // 3 modelos × 120s + 60s de buffer = 420s. Mantemos 480s para folga.
      await api.post('/workouts/generate', payload, { timeout: 480000 });
      showAlert('Pronto!', 'Seu treino foi regenerado com sucesso com base nos novos dados.');
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (e) {
      const err = e as { response?: { status?: number; data?: unknown } };
      const raw = err.response?.data;
      const message =
        typeof raw === 'string' && raw ? raw : 'Não foi possível regenerar o treino agora. Tente novamente.';
      // 409 = a ficha vigente foi montada pelo personal; 429 = cota de IA (1 ficha a cada 30 dias).
      // Ambos são regra de negócio, não falha.
      const status = err.response?.status;
      showAlert(status === 409 ? 'Treino do seu personal' : status === 429 ? 'Nova ficha em breve' : 'Erro', message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const header = <StackHeader title="Meu protocolo" onBack={() => navigation.goBack()} />;

  if (!form) {
    return (
      <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']} header={header} contentStyle={styles.center}>
        {loadFailed ? (
          <Text variant="body" color={KINETIC.textSecondary}>
            Não foi possível carregar seu protocolo.
          </Text>
        ) : (
          <ActivityIndicator color={KINETIC.primary} />
        )}
      </Screen>
    );
  }

  const age = ageFromBirthDate(form.birthDate);
  const metricsValue =
    [form.weight ? `${form.weight} kg` : null, form.height ? `${form.height} cm` : null, age != null ? `${age} anos` : null]
      .filter(Boolean)
      .join(' · ') || 'Adicionar';
  const anamComplete = hasMedicalInfo(form.medicalConditions);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} header={header} contentStyle={styles.content}>
      <ListGroup title="O que alimenta sua IA">
        <ListRow icon="target" title="Objetivo" value={goalLabel(form.goal)} onPress={() => setActiveDialog('goal')} />
        <ListRow icon="ruler" title="Métricas" value={metricsValue} onPress={() => setActiveDialog('metrics')} />
        <ListRow icon="progress" title="Nível de experiência" value={levelLabel(form.level)} onPress={() => setActiveDialog('level')} />
        <ListRow
          icon="calendar"
          title="Frequência semanal"
          value={form.frequency ? `${form.frequency} dias` : 'Definir'}
          onPress={() => setActiveDialog('frequency')}
        />
        <ListRow
          icon="heart"
          title="Anamnese"
          subtitle={anamComplete ? 'Lesões, restrições e condições informadas' : 'Toque para informar lesões ou restrições'}
          value={anamComplete ? 'Completa' : 'Pendente'}
          onPress={() => setActiveDialog('anamnesis')}
        />
      </ListGroup>

      <View style={styles.regen}>
        <Button
          label={isRegenerating ? 'Regenerando…' : 'Regenerar treino com IA'}
          icon="sparkle"
          loading={isRegenerating}
          onPress={handleRegenerate}
        />
        <Text variant="caption" color={KINETIC.textSecondary} style={styles.hint}>
          Recria seu plano com base nos dados acima. Pode levar alguns minutos.
        </Text>
      </View>

      <OptionPickerDialog
        visible={activeDialog === 'goal'}
        title="Objetivo principal"
        options={GOAL_OPTIONS}
        selected={form.goal}
        onSelect={(value) => patchForm({ goal: value })}
        onClose={() => setActiveDialog(null)}
      />
      <OptionPickerDialog
        visible={activeDialog === 'level'}
        title="Nível de experiência"
        options={LEVEL_OPTIONS}
        selected={form.level}
        onSelect={(value) => patchForm({ level: value })}
        onClose={() => setActiveDialog(null)}
      />
      <OptionPickerDialog
        visible={activeDialog === 'frequency'}
        title="Frequência semanal"
        options={FREQUENCY_OPTIONS}
        selected={String(form.frequency)}
        onSelect={(value) => patchForm({ frequency: parseInt(value, 10) })}
        onClose={() => setActiveDialog(null)}
      />
      <MetricsDialog
        visible={activeDialog === 'metrics'}
        form={form}
        onSave={(patch) => patchForm(patch)}
        onClose={() => setActiveDialog(null)}
      />
      <AnamnesisDialog
        visible={activeDialog === 'anamnesis'}
        value={form.medicalConditions}
        onSave={(value) => patchForm({ medicalConditions: value })}
        onClose={() => setActiveDialog(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 12, paddingBottom: 32 },
  regen: { marginTop: 20, marginHorizontal: 16, gap: 8 },
  hint: { textAlign: 'center' },
});
