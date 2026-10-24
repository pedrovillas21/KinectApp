import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from './ui/scaled';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import type { ConnectionState, PendingRequest, TrainerLink, UserCard } from '../types';
import {
  acceptConnection,
  getPendingRequests,
  removeConnection,
  searchUsers,
  sendConnection,
} from '../services/socialService';
import {
  acceptInvite,
  declineInvite,
  getPendingInvites,
  redeemErrorMessage,
  redeemInviteCode,
} from '../services/trainerService';
import Icon from './Icon';
import { Avatar, Button, Dialog, SegmentedControl, Text } from './ui';

export type InviteTab = 'friend' | 'trainer';

interface InviteDialogProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: InviteTab;
  /** Chamado ao fechar se algo mudou (amizade, vínculo), para a tela recarregar. */
  onChanged?: () => void;
  /** Toque numa pessoa → perfil dela. */
  onOpenProfile?: (userId: string) => void;
}

const MAX_RESULTS = 6;

/** Convite em balão: Amigo (busca + pedidos) | Personal (código + convites recebidos). */
export default function InviteDialog({ visible, onClose, initialTab = 'friend', onChanged, onOpenProfile }: InviteDialogProps) {
  const [tab, setTab] = useState<InviteTab>(initialTab);
  const changed = useRef(false);

  useEffect(() => {
    if (visible) {
      setTab(initialTab);
      changed.current = false;
    }
  }, [visible, initialTab]);

  const markChanged = () => {
    changed.current = true;
  };

  const close = () => {
    onClose();
    if (changed.current) onChanged?.();
  };

  return (
    <Dialog visible={visible} onClose={close} title="Convidar">
      <SegmentedControl
        options={[
          { key: 'friend', label: 'Amigo' },
          { key: 'trainer', label: 'Personal' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'friend' ? (
        <FriendTab
          onChanged={markChanged}
          onOpenProfile={
            onOpenProfile
              ? (id) => {
                  close();
                  onOpenProfile(id);
                }
              : undefined
          }
        />
      ) : (
        <TrainerTab onChanged={markChanged} />
      )}
    </Dialog>
  );
}

// ─── Amigo ───────────────────────────────────────────────────────────────────

const ACTION: Record<ConnectionState, { label: string; variant: 'primary' | 'secondary'; enabled: boolean }> = {
  NONE: { label: 'Adicionar', variant: 'primary', enabled: true },
  PENDING_OUTGOING: { label: 'Enviado', variant: 'secondary', enabled: false },
  PENDING_INCOMING: { label: 'Aceitar', variant: 'primary', enabled: true },
  CONNECTED: { label: 'Amigos', variant: 'secondary', enabled: false },
};

function FriendTab({ onChanged, onOpenProfile }: { onChanged: () => void; onOpenProfile?: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserCard[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getPendingRequests()
      .then(setRequests)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const run = async () => {
      setLoading(true);
      try {
        // Sem texto → backend devolve a lista padrão de sugestões.
        setResults(await searchUsers(query.trim()));
      } catch {
        // mantém os resultados anteriores
      } finally {
        setLoading(false);
      }
    };
    if (!query.trim()) run();
    else debounceRef.current = setTimeout(run, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const setState = (id: string, state: ConnectionState) =>
    setResults((prev) => prev.map((u) => (u.id === id ? { ...u, connectionState: state } : u)));

  const handleAction = async (user: UserCard) => {
    const before = user.connectionState;
    setState(user.id, before === 'NONE' ? 'PENDING_OUTGOING' : 'CONNECTED');
    try {
      if (before === 'NONE') await sendConnection(user.id);
      else await acceptConnection(user.id);
      onChanged();
    } catch {
      setState(user.id, before);
    }
  };

  const answerRequest = async (req: PendingRequest, accept: boolean) => {
    setRequests((prev) => prev.filter((r) => r.requesterId !== req.requesterId));
    try {
      if (accept) await acceptConnection(req.requesterId);
      else await removeConnection(req.requesterId);
      setState(req.requesterId, accept ? 'CONNECTED' : 'NONE');
      onChanged();
    } catch {
      setRequests((prev) => [req, ...prev]);
    }
  };

  return (
    <View style={styles.tabBody}>
      {requests.length > 0 ? (
        <View style={styles.block}>
          <Text variant="captionStrong" color={KINETIC.textSecondary}>
            Pedidos recebidos
          </Text>
          {requests.map((req) => (
            <View key={req.connectionId} style={styles.person}>
              <Avatar name={req.nome} uri={req.avatarUrl || null} seed={req.requesterId} size={36} />
              <Text variant="bodyMedium" numberOfLines={1} style={styles.flex}>
                {req.nome}
              </Text>
              <Button label="Recusar" size="sm" variant="secondary" onPress={() => answerRequest(req, false)} />
              <Button label="Aceitar" size="sm" onPress={() => answerRequest(req, true)} />
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.input, focused && styles.inputFocused]}>
        <Icon name="search" size={16} color={KINETIC.textSecondary} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Nome ou @usuário"
          placeholderTextColor={KINETIC.placeholder}
          accessibilityLabel="Buscar por nome ou usuário"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.inputText}
        />
        {loading ? <ActivityIndicator size="small" color={KINETIC.textSecondary} /> : null}
      </View>

      {results.length === 0 && !loading ? (
        <Text variant="body" color={KINETIC.textSecondary} style={styles.empty}>
          {query.trim() ? 'Ninguém encontrado com esse nome.' : 'Digite um nome para buscar.'}
        </Text>
      ) : (
        <View>
          {results.slice(0, MAX_RESULTS).map((user) => {
            const action = ACTION[user.connectionState];
            return (
              <View key={user.id} style={styles.person}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ver perfil de ${user.nome}`}
                  disabled={!onOpenProfile}
                  onPress={() => onOpenProfile?.(user.id)}
                  style={styles.personMain}
                >
                  <Avatar name={user.nome} uri={user.avatarUrl || null} seed={user.id} size={36} />
                  <Text variant="bodyMedium" numberOfLines={1} style={styles.flex}>
                    {user.nome}
                  </Text>
                </Pressable>
                <Button
                  label={action.label}
                  size="sm"
                  variant={action.variant}
                  disabled={!action.enabled}
                  onPress={() => handleAction(user)}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Personal ────────────────────────────────────────────────────────────────

function TrainerTab({ onChanged }: { onChanged: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [invites, setInvites] = useState<TrainerLink[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    getPendingInvites()
      .then(setInvites)
      .catch(() => setInvites([]));
  }, []);

  const redeem = async () => {
    if (!code.trim() || redeeming) return;
    setRedeeming(true);
    setError(null);
    try {
      const link = await redeemInviteCode(code);
      setSuccess(`Pronto! Agora você treina com ${link.peer.nome}.`);
      setCode('');
      onChanged();
    } catch (e) {
      setError(redeemErrorMessage(e));
    } finally {
      setRedeeming(false);
    }
  };

  const answer = async (invite: TrainerLink, accept: boolean) => {
    if (busy) return;
    setBusy(invite.id);
    try {
      if (accept) {
        await acceptInvite(invite.id);
        setSuccess(`Pronto! Agora você treina com ${invite.peer.nome}.`);
      } else {
        await declineInvite(invite.id);
      }
      setInvites((prev) => (prev ?? []).filter((i) => i.id !== invite.id));
      onChanged();
    } catch {
      setError('Não foi possível responder ao convite agora. Tente novamente.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.tabBody}>
      <Text variant="body" color={KINETIC.textDim}>
        Digite o código que seu personal enviou para entrar na carteira dele.
      </Text>
      <View style={styles.block}>
        <Text variant="captionStrong" color={KINETIC.textSecondary}>
          Código de convite
        </Text>
        <View style={styles.codeRow}>
          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              setError(null);
            }}
            placeholder="ABCDE-23456"
            placeholderTextColor={KINETIC.placeholder}
            accessibilityLabel="Código de convite"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={redeem}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, styles.codeInput, focused && styles.inputFocused]}
          />
          <Button label="Usar" size="md" block={false} loading={redeeming} disabled={!code.trim()} onPress={redeem} />
        </View>
        {error ? (
          <Text variant="caption" color={KINETIC.danger} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        {success ? (
          <Text variant="caption" color={KINETIC.success} accessibilityLiveRegion="polite">
            {success}
          </Text>
        ) : null}
      </View>

      <View style={[styles.block, styles.divided]}>
        <Text variant="captionStrong" color={KINETIC.textSecondary}>
          Convites recebidos
        </Text>
        {invites === null ? (
          <ActivityIndicator size="small" color={KINETIC.textSecondary} style={styles.loader} />
        ) : invites.length === 0 ? (
          <Text variant="body" color={KINETIC.textDim}>
            Nenhum convite pendente.
          </Text>
        ) : (
          invites.map((invite) => (
            <View key={invite.id} style={styles.person}>
              <Avatar name={invite.peer.nome} uri={invite.peer.avatarUrl} seed={invite.peer.id} size={36} />
              <Text variant="bodyMedium" numberOfLines={1} style={styles.flex}>
                {invite.peer.nome}
              </Text>
              <Button
                label="Recusar"
                size="sm"
                variant="secondary"
                disabled={busy === invite.id}
                onPress={() => answer(invite, false)}
              />
              <Button label="Aceitar" size="sm" disabled={busy === invite.id} onPress={() => answer(invite, true)} />
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBody: { paddingTop: 14, gap: 12 },
  block: { gap: 8 },
  divided: { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  person: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  personMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  input: {
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: KINETIC.bg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  inputFocused: { borderColor: KINETIC.primary },
  inputText: { flex: 1, color: KINETIC.text, fontFamily: FONT.regular, fontSize: 15, padding: 0 },
  codeRow: { flexDirection: 'row', gap: 8 },
  codeInput: { flex: 1, color: KINETIC.text, fontFamily: FONT.mono, fontSize: 15, letterSpacing: 1 },
  empty: { paddingVertical: 8 },
  loader: { alignSelf: 'flex-start' },
});
