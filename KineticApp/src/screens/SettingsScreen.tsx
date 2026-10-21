import React, { useCallback, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';

import InviteDialog from '../components/InviteDialog';
import PhoneDialog from '../components/settings/PhoneDialog';
import ChangePasswordDialog from '../components/settings/ChangePasswordDialog';
import DeleteAccountDialog from '../components/settings/DeleteAccountDialog';
import TextSizePicker from '../components/TextSizePicker';
import { Avatar, Button, Dialog, ListGroup, ListRow, Screen, StackHeader, Text } from '../components/ui';
import { AuthContext } from '../contexts/AuthContext';
import { TEXT_SIZES, useTextScale } from '../contexts/TextScaleContext';
import useFocusResource from '../hooks/useFocusResource';
import api from '../services/api';
import { exportMyData } from '../services/accountService';
import { getPublicProfile } from '../services/profileService';
import { getMyTrainer, getPendingInvites } from '../services/trainerService';
import { KINETIC, RADIUS } from '../theme/kinetic';
import { maskCellPhone } from '../utils/whatsapp';
import type { MainStackScreenProps } from '../navigation/types';
import type { TrainerPeer, UserProfileResponse } from '../types';
import { showAlert } from '../components/ui/AlertHost';

export default function SettingsScreen({ navigation }: MainStackScreenProps<'Settings'>) {
  const { currentUser, signOut, changePassword, forgetRememberedUser } = useContext(AuthContext);

  const [exporting, setExporting] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [textSizeOpen, setTextSizeOpen] = useState(false);
  const { size: textSize } = useTextScale();

  const myId = currentUser ? String(currentUser.id) : '';
  // Mesmas chaves do Perfil e da Home: as telas dividem o cache.
  const accountRes = useFocusResource('users/profile', () =>
    api.get<UserProfileResponse>('/users/profile').then((r) => r.data),
  );
  const profileRes = useFocusResource(myId ? `profile/${myId}` : null, () => getPublicProfile(myId));
  const trainerRes = useFocusResource('me/trainer', () =>
    getMyTrainer().then((link) => (link?.status === 'ATIVO' ? link.peer : null)),
  );
  const invitesRes = useFocusResource('me/trainer-invites', () => getPendingInvites());

  const account: UserProfileResponse | null = accountRes.data ?? null;
  const avatarUrl = profileRes.data?.avatarUrl ?? null;
  const trainer: TrainerPeer | null = trainerRes.data ?? null;
  const inviteCount = invitesRes.data?.length ?? 0;

  const load = useCallback(
    () => Promise.all([accountRes.refresh(), profileRes.refresh(), trainerRes.refresh(), invitesRes.refresh()]),
    [accountRes.refresh, profileRes.refresh, trainerRes.refresh, invitesRes.refresh],
  );

  const name = account?.fullName ?? currentUser?.nome ?? '';
  const email = account?.email ?? currentUser?.email ?? '';
  const phone = account?.phone ?? currentUser?.phone ?? null;
  const version = Constants.expoConfig?.version;

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportMyData();
    } catch {
      showAlert('Exportar meus dados', 'Não foi possível gerar o arquivo agora. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const confirmSignOut = () =>
    showAlert('Sair da conta?', 'Você precisará fazer login novamente para acessar seus treinos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);

  // Após trocar a senha o backend revoga as sessões: desloga para entrar com a nova.
  const handlePasswordChanged = () =>
    showAlert('Senha alterada', 'Sua senha foi atualizada. Faça login novamente com a nova senha.', [
      { text: 'OK', onPress: () => void signOut() },
    ]);

  const handleDeleted = async () => {
    setDeleteOpen(false);
    // A conta não existe mais: esquece o cartão "conta lembrada" e encerra a sessão local.
    await forgetRememberedUser().catch(() => {});
    await signOut().catch(() => {});
    showAlert('Conta excluída', 'Sua conta e seus dados foram apagados.');
  };

  return (
    <Screen
      edges={['top', 'bottom', 'left', 'right']}
      contentStyle={styles.content}
      header={<StackHeader title="Configurações" onBack={() => navigation.goBack()} />}
    >
      <View style={styles.accountCard}>
        <Avatar name={name} uri={avatarUrl} seed={currentUser?.id} size={48} />
        <View style={styles.flex}>
          <Text variant="label" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" color={KINETIC.textSecondary} numberOfLines={1}>
            {email}
          </Text>
        </View>
      </View>

      <ListGroup title="Conta">
        <ListRow icon="mail" title="E-mail" value={email} />
        <ListRow
          icon="phone"
          title="Celular (WhatsApp)"
          value={phone ? maskCellPhone(phone) : 'Cadastrar'}
          onPress={() => setPhoneOpen(true)}
        />
        <ListRow icon="lock" title="Senha" value="Alterar" onPress={() => setPasswordOpen(true)} />
      </ListGroup>

      <ListGroup title="Treino">
        <ListRow
          icon="target"
          title="Meu protocolo"
          subtitle="Objetivo, medidas, nível, anamnese"
          onPress={() => navigation.navigate('Protocol')}
        />
        <ListRow icon="bell" title="Notificações" comingSoon />
        <ListRow icon="ruler" title="Unidades" value="kg · cm" />
        <ListRow icon="globe" title="Idioma" value="Português" />
      </ListGroup>

      <ListGroup title="Acessibilidade">
        <ListRow
          icon="eye"
          title="Tamanho do texto"
          subtitle="Textos e ícones maiores"
          value={TEXT_SIZES.find((s) => s.key === textSize)?.label}
          onPress={() => setTextSizeOpen(true)}
        />
      </ListGroup>

      <ListGroup title="Personal">
        {trainer ? (
          <ListRow
            icon="users"
            title="Perfil do personal"
            value={trainer.nome.split(' ')[0]}
            onPress={() => navigation.navigate('TrainerProfile')}
          />
        ) : null}
        <ListRow
          icon="ticket"
          title={trainer ? 'Convites de personal' : 'Adicionar personal'}
          subtitle={trainer ? undefined : 'Código do personal ou convites recebidos'}
          value={inviteCount > 0 ? `${inviteCount} ${inviteCount === 1 ? 'novo' : 'novos'}` : undefined}
          onPress={() => setInviteOpen(true)}
        />
      </ListGroup>

      <ListGroup title="Comunidade">
        <ListRow icon="eye" title="Visibilidade no ranking" comingSoon />
        <ListRow icon="users" title="Amigos e bloqueios" comingSoon />
      </ListGroup>

      <ListGroup title="Privacidade e dados">
        <ListRow
          icon="download"
          title="Exportar meus dados"
          subtitle="Arquivo com perfil, treinos, medidas e histórico"
          value={exporting ? 'Gerando…' : undefined}
          onPress={handleExport}
        />
        <ListRow icon="check" title="Consentimentos" comingSoon />
        <ListRow icon="shield" title="Política de privacidade" comingSoon />
        <ListRow icon="doc" title="Termos de uso" comingSoon />
      </ListGroup>

      <ListGroup footnote="A exclusão apaga seu perfil, treinos, fotos e medidas de forma definitiva, conforme a LGPD (art. 18). Recomendamos exportar seus dados antes.">
        <ListRow icon="logout" title="Sair da conta" onPress={confirmSignOut} />
        <ListRow icon="trash" title="Excluir minha conta" destructive onPress={() => setDeleteOpen(true)} />
      </ListGroup>

      {version ? (
        <Text variant="mono" color={KINETIC.textMuted} style={styles.version}>
          Kinetic {version}
        </Text>
      ) : null}

      <Dialog visible={textSizeOpen} onClose={() => setTextSizeOpen(false)} title="Tamanho do texto">
        <TextSizePicker />
        <Button label="Pronto" onPress={() => setTextSizeOpen(false)} style={styles.done} />
      </Dialog>
      <PhoneDialog
        visible={phoneOpen}
        value={phone}
        onClose={() => setPhoneOpen(false)}
        onSaved={() => accountRes.refresh()}
      />
      <ChangePasswordDialog
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSubmit={changePassword}
        onSuccess={handlePasswordChanged}
      />
      <InviteDialog visible={inviteOpen} onClose={() => setInviteOpen(false)} initialTab="trainer" onChanged={load} />
      <DeleteAccountDialog
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={handleDeleted}
        onExport={handleExport}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  done: { marginTop: 16 },
  content: { gap: 22, paddingBottom: 32 },
  flex: { flex: 1, minWidth: 0, gap: 2 },
  accountCard: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: RADIUS.xl,
    backgroundColor: KINETIC.surface1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  version: { textAlign: 'center', fontSize: 11 },
});
