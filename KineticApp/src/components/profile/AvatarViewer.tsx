import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CameraCapture from '../CameraCapture';
import { RoundButton } from '../CameraButtons';
import Icon from '../Icon';
import { Avatar, Button, Text } from '../ui';
import { showAlert } from '../ui/AlertHost';
import { removeMyAvatar, updateMyAvatar } from '../../services/profileService';
import { createStyles, useColors } from '../../theme/ThemeContext';


interface Props {
  visible: boolean;
  onClose: () => void;
  name: string;
  seed?: string | null;
  uri?: string | null;
  /** Perfil próprio: mostra o pincel para trocar e a opção de remover. */
  editable?: boolean;
  /** Foto nova (string) ou removida (null), já salva no servidor. */
  onChanged?: (uri: string | null) => void;
}

const PENCIL = 52;

/**
 * Foto de perfil ampliada numa moldura redonda (estilo Instagram). No próprio perfil,
 * o pincel no canto da moldura abre a câmera (com galeria) para trocar a foto.
 */
export default function AvatarViewer({ visible, onClose, name, seed, uri, editable, onChanged }: Props) {
  const styles = useStyles();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [camera, setCamera] = useState(false);
  const [saving, setSaving] = useState(false);
  const size = Math.min(width - 64, 300);

  const close = () => {
    setCamera(false);
    onClose();
  };

  const save = async (photo: string) => {
    setCamera(false);
    setSaving(true);
    try {
      onChanged?.(await updateMyAvatar(photo));
    } catch {
      showAlert('Não foi possível trocar a foto', 'Verifique sua conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    showAlert('Remover foto de perfil?', 'Seu perfil volta a mostrar as iniciais do seu nome.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await removeMyAvatar();
            onChanged?.(null);
          } catch {
            showAlert('Não foi possível remover a foto', 'Verifique sua conexão e tente novamente.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => (camera ? setCamera(false) : close())}
    >
      {camera ? (
        <CameraCapture
          onCapture={save}
          onClose={() => setCamera(false)}
          galleryAspect={[1, 1]}
          permissionTitle="Libere a câmera para a foto de perfil"
        />
      ) : (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
          <RoundButton label="Fechar" onPress={close} style={[styles.close, { top: insets.top + 12 }]}>
            <Icon name="close" size={20} color="#fff" strokeWidth={2.2} />
          </RoundButton>

          <View style={styles.center}>
            <View style={{ width: size, height: size }}>
              <Avatar name={name} uri={uri} seed={seed ?? name} size={size} />
              {saving ? (
                <View style={[StyleSheet.absoluteFill, styles.saving, { borderRadius: size / 2 }]}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              ) : null}
              {editable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Trocar foto de perfil"
                  onPress={() => setCamera(true)}
                  disabled={saving}
                  hitSlop={6}
                  // Sobre a borda da moldura, a 45° (canto inferior direito do círculo).
                  style={({ pressed }) => [
                    styles.pencil,
                    { right: size * 0.146 - PENCIL / 2, bottom: size * 0.146 - PENCIL / 2 },
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon name="pencil" size={22} color={c.onPrimary} strokeWidth={2.2} />
                </Pressable>
              ) : null}
            </View>
            <Text variant="title" style={styles.name} numberOfLines={2}>
              {name}
            </Text>
          </View>

          {editable && uri ? (
            <Button label="Remover foto" variant="ghost" disabled={saving} onPress={remove} />
          ) : null}
        </View>
      )}
    </Modal>
  );
}

const useStyles = createStyles((c) => ({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', paddingHorizontal: 24 },
  close: { position: 'absolute', left: 14, zIndex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  name: { textAlign: 'center' },
  saving: { backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  pencil: {
    position: 'absolute',
    width: PENCIL,
    height: PENCIL,
    borderRadius: PENCIL / 2,
    borderWidth: 4,
    borderColor: '#000',
    backgroundColor: c.primaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
}));
