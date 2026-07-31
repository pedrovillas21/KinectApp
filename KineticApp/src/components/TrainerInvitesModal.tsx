import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { KINETIC } from '../theme/kinetic';
import Icon from './Icon';
import { avatarFallback } from './../services/socialService';
import type { TrainerLink } from '../types';

interface Props {
  visible: boolean;
  invites: TrainerLink[];
  onClose: () => void;
  /** Aceitar o convite `inviteId`. */
  onAccept: (inviteId: string) => Promise<void>;
  /** Recusar o convite `inviteId`. */
  onDecline: (inviteId: string) => Promise<void>;
}

/** Convites de personal recebidos pelo aluno (vínculo profissional, Fase 1). */
export default function TrainerInvitesModal({
  visible,
  invites,
  onClose,
  onAccept,
  onDecline,
}: Props) {
  // Ids em processamento — desabilita os botões para evitar toque duplo.
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const handle = async (id: string, action: (id: string) => Promise<void>) => {
    if (busy[id]) return;
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await action(id);
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const renderItem: ListRenderItem<TrainerLink> = ({ item }) => {
    const isBusy = !!busy[item.id];
    return (
      <View style={styles.row}>
        <Image
          source={{ uri: avatarFallback(item.peer.id, item.peer.avatarUrl) }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.peer.nome}</Text>
          <Text style={styles.sub} numberOfLines={1}>quer ser seu personal</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.declineBtn, isBusy && styles.btnDisabled]}
            onPress={() => handle(item.id, onDecline)}
            disabled={isBusy}
          >
            <Text style={styles.declineText}>Recusar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, isBusy && styles.btnDisabled]}
            onPress={() => handle(item.id, onAccept)}
            disabled={isBusy}
          >
            <Text style={styles.acceptText}>Aceitar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Convites de personal</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={20} color={KINETIC.textMuted} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={invites}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum convite pendente.</Text>
            }
          />
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: KINETIC.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: { color: KINETIC.text, fontSize: 18, fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KINETIC.surface2,
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: KINETIC.surface2 },
  info: { flex: 1, minWidth: 0 },
  name: { color: KINETIC.text, fontSize: 15, fontWeight: '600' },
  sub: { color: KINETIC.textMuted, fontSize: 12, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    backgroundColor: KINETIC.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  acceptText: { color: '#000', fontSize: 13, fontWeight: 'bold' },
  declineBtn: {
    backgroundColor: KINETIC.surface2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  declineText: { color: KINETIC.textMuted, fontSize: 13, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.5 },
  empty: { color: KINETIC.textMuted, textAlign: 'center', marginTop: 24 },
});
