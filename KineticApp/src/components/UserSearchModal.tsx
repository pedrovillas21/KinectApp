import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../theme/colors';
import { KINETIC } from '../theme/kinetic';
import Icon from './Icon';
import {
  searchUsers,
  sendConnection,
  acceptConnection,
  removeConnection,
} from '../services/socialService';
import type { UserCard, ConnectionState } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ACTION_LABEL: Record<ConnectionState, string> = {
  NONE: 'Add',
  PENDING_OUTGOING: 'Pending',
  PENDING_INCOMING: 'Accept',
  CONNECTED: 'In squad',
};

export default function UserSearchModal({ visible, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const run = async () => {
      setLoading(true);
      try {
        // Sem texto → backend devolve a lista padrão de usuários do banco.
        const data = await searchUsers(query.trim());
        setResults(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    // Lista padrão (query vazia) carrega na hora; digitação é debounced.
    if (!query.trim()) {
      run();
    } else {
      debounceRef.current = setTimeout(run, 400);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible]);

  const handleAction = async (item: UserCard) => {
    const optimisticState: ConnectionState =
      item.connectionState === 'NONE' ? 'PENDING_OUTGOING' :
      item.connectionState === 'PENDING_INCOMING' ? 'CONNECTED' : item.connectionState;

    setResults((prev) =>
      prev.map((u) => u.id === item.id ? { ...u, connectionState: optimisticState } : u)
    );

    try {
      if (item.connectionState === 'NONE') {
        await sendConnection(item.id);
      } else if (item.connectionState === 'PENDING_INCOMING') {
        await acceptConnection(item.id);
      } else if (item.connectionState === 'CONNECTED') {
        await removeConnection(item.id);
        setResults((prev) =>
          prev.map((u) => u.id === item.id ? { ...u, connectionState: 'NONE' } : u)
        );
      }
    } catch {
      setResults((prev) =>
        prev.map((u) => u.id === item.id ? { ...u, connectionState: item.connectionState } : u)
      );
    }
  };

  const renderItem: ListRenderItem<UserCard> = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.rowName}>{item.nome}</Text>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          item.connectionState === 'CONNECTED' && styles.actionBtnConnected,
          item.connectionState === 'PENDING_OUTGOING' && styles.actionBtnPending,
        ]}
        onPress={() => handleAction(item)}
        disabled={item.connectionState === 'PENDING_OUTGOING'}
      >
        <Text style={styles.actionBtnText}>{ACTION_LABEL[item.connectionState]}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Encontrar pessoas</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={20} color={KINETIC.textMuted} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Buscar por nome..."
            placeholderTextColor={KINETIC.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />

          {loading && <ActivityIndicator color={COLORS.neonBlue} style={styles.loader} />}

          {!loading && results.length > 0 && (
            <Text style={styles.sectionLabel}>
              {query.trim() ? 'Resultados' : 'Sugestões'}
            </Text>
          )}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.empty}>
                  {query.trim() ? 'Nenhum resultado.' : 'Nenhum usuário cadastrado ainda.'}
                </Text>
              ) : null
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
  input: {
    backgroundColor: KINETIC.surface2,
    color: KINETIC.text,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  loader: { marginVertical: 12 },
  sectionLabel: {
    color: KINETIC.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KINETIC.surface2,
  },
  rowName: { flex: 1, color: KINETIC.text, fontSize: 15 },
  actionBtn: {
    backgroundColor: KINETIC.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnConnected: { backgroundColor: KINETIC.surface3 },
  actionBtnPending: { backgroundColor: KINETIC.surface2 },
  actionBtnText: { color: '#000', fontSize: 13, fontWeight: 'bold' },
  empty: { color: KINETIC.textMuted, textAlign: 'center', marginTop: 24 },
});
