import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import OptionPickerDialog from '../components/profile/protocol/OptionPickerDialog';
import MetricsDialog from '../components/profile/protocol/MetricsDialog';
import AnamnesisDialog from '../components/profile/protocol/AnamnesisDialog';
import type { ProtocolForm } from '../components/profile/protocol/types';
import Icon from '../components/Icon';
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
import useFocusResource from '../hooks/useFocusResource';
import { getMyProtocol, getMyTrainer } from '../services/trainerService';
import { generateWorkout } from '../services/workoutService';
import { openWhatsApp } from '../utils/whatsapp';

import type { MainStackScreenProps } from '../navigation/types';
import type { GenerateWorkoutRequest, UserProfileResponse } from '../types';
import { showAlert } from '../components/ui/AlertHost';
import { useColors } from '../theme/ThemeContext';

type ProtocolDialog = 'goal' | 'metrics' | 'level' | 'frequency' | 'anamnesis' | null;

/**
 * "Meu protocolo": o que alimenta a IA. Sem personal, as edições ficam locais e vão
 * para o backend ao regenerar o treino. Com personal ativo, objetivo, nível,
 * frequência e anamnese são dele: o aluno só vê e confere a anamnese.
 */
export default function ProtocolScreen({ navigation }: MainStackScreenProps<'Protocol'>) {
  const c = useColors();
  const [form, setForm] = useState<ProtocolForm | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ProtocolDialog>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const protocolRes = useFocusResource('me/protocol', getMyProtocol);
  const trainerRes = useFocusResource('me/trainer', getMyTrainer);

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
      await generateWorkout(payload);
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
          <Text variant="body" color={c.textSecondary}>
            Não foi possível carregar seu protocolo.
          </Text>
        ) : (
          <ActivityIndicator color={c.primary} />
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
  const managed = protocolRes.data?.managedByName ? protocolRes.data : null;

  if (managed) {
    const trainerName = managed.managedByName!.split(' ')[0];
    const phone = trainerRes.data?.peer.phone ?? null;
    const managedAnam = hasMedicalInfo(managed.medicalConditions);
    const lock = <Icon name="lock" size={14} color={c.textMuted} />;
    const talk = () => {
      if (!phone) return;
      openWhatsApp(phone, `Oi, ${trainerName}!`);
    };
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']} header={header} contentStyle={styles.content}>
        <ListGroup title={`Definido por ${managed.managedByName}, seu personal`}>
          <ListRow icon="target" title="Objetivo" value={goalLabel(managed.goal)} accessory={lock} />
          <ListRow icon="progress" title="Nível de experiência" value={levelLabel(managed.level)} accessory={lock} />
          <ListRow
            icon="calendar"
            title="Frequência semanal"
            value={managed.frequency ? `${managed.frequency} dias` : '—'}
            accessory={lock}
          />
          <ListRow
            icon="heart"
            title="Anamnese"
            subtitle={
              !managedAnam
                ? 'Ainda não registrada'
                : managed.anamnesisConfirmedAt
                  ? 'Conferida por você'
                  : 'Toque para conferir se está tudo certo'
            }
            value={managedAnam ? 'Completa' : 'Pendente'}
            onPress={() => navigation.navigate('Anamnesis')}
          />
        </ListGroup>

        <ListGroup
          title="Seus dados"
          footnote="Peso e altura são atualizados nas avaliações físicas do seu personal."
          style={styles.group}
        >
          <ListRow icon="ruler" title="Métricas" value={metricsValue} />
        </ListGroup>

        <View style={styles.regen}>
          {phone ? <Button label={`Falar com ${trainerName}`} variant="secondary" onPress={talk} /> : null}
          <Text variant="caption" color={c.textSecondary} style={styles.hint}>
            Seu treino é prescrito por {trainerName}. Para mudar objetivo, nível ou frequência, combine com {trainerName}.
          </Text>
        </View>
      </Screen>
    );
  }

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
        <Text variant="caption" color={c.textSecondary} style={styles.hint}>
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
  group: { marginTop: 20 },
  hint: { textAlign: 'center' },
});
