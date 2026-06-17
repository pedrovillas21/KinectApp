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
import { COLORS } from '../theme/colors';
import { KINETIC } from '../theme/kinetic';
import Icon from './Icon';
import type { PendingRequest } from '../types';

interface Props {
  visible: boolean;
  requests: PendingRequest[];
  onClose: () => void;
  /** Aceitar solicitação de `requesterId`. */
  onAccept: (requesterId: string) => Promise<void>;
  /** Recusar/remover solicitação de `requesterId`. */
  onDecline: (requesterId: string) => Promise<void>;
}

export default function ConnectionRequestsModal({
  visible,
  requests,
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

  const renderItem: ListRenderItem<PendingRequest> = ({ item }) => {
    const isBusy = !!busy[item.requesterId];
    return (
      <View style={styles.row}>
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        <Text style={styles.name} numberOfLines={1}>{item.nome}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.declineBtn, isBusy && styles.btnDisabled]}
            onPress={() => handle(item.requesterId, onDecline)}
            disabled={isBusy}
          >
            <Text style={styles.declineText}>Recusar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, isBusy && styles.btnDisabled]}
            onPress={() => handle(item.requesterId, onAccept)}
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
            <Text style={styles.sheetTitle}>Solicitações</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={20} color={KINETIC.textMuted} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={requests}
            keyExtractor={(item) => item.connectionId}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhuma solicitação pendente.</Text>
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
  closeBtn: { color: KINETIC.textMuted, fontSize: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KINETIC.surface2,
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: KINETIC.surface2 },
  name: { flex: 1, color: KINETIC.text, fontSize: 15 },
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
