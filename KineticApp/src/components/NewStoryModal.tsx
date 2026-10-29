import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput } from './ui/scaled';
import { FONT, RADIUS } from '../theme/kinetic';
import Icon from './Icon';
import { RoundButton } from './CameraButtons';
import CameraCapture from './CameraCapture';
import { Text } from './ui';
import { showAlert } from './ui/AlertHost';
import useKeyboardOverlap from '../hooks/useKeyboardOverlap';
import { createStory, uploadAndCreate } from '../services/socialService';
import { createStyles, useColors } from '../theme/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

/**
 * Story estilo Instagram: abre direto na câmera em tela cheia (galeria no canto inferior);
 * depois da foto, prévia em tela cheia com legenda por cima e "Seu story".
 */
export default function NewStoryModal({ visible, onClose, onStoryCreated }: Props) {
  const styles = useStyles();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardOverlap(visible);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  // Reset centralizado: usado tanto no cancelamento quanto após publicar. Assim,
  // se o usuário desistir de um story e reabrir, a foto antiga não reaparece.
  const handleClose = () => {
    setImageUri(null);
    setCaption('');
    onClose();
  };

  const handlePublish = async () => {
    if (posting || !imageUri) return;
    setPosting(true);
    try {
      await uploadAndCreate(imageUri, 'stories', (imageUrl) =>
        createStory({ imageUrl, caption: caption.trim() || undefined }),
      );
      onStoryCreated();
      handleClose();
    } catch {
      // Mantém a prévia aberta para o usuário tentar de novo (upload pode falhar por rede).
      showAlert('Não foi possível publicar', 'Verifique sua conexão e tente novamente.');
    } finally {
      setPosting(false);
    }
  };

  const closeButton = (label: string, onPress: () => void) => (
    <RoundButton label={label} onPress={onPress} style={[styles.topLeft, { top: insets.top + 12 }]}>
      <Icon name="close" size={20} color="#fff" strokeWidth={2.2} />
    </RoundButton>
  );

  let content: React.ReactNode;
  if (imageUri) {
    // Prévia: foto em tela cheia, legenda e envio por cima, subindo com o teclado.
    content = (
      <View ref={keyboard.ref} style={styles.root}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel="Foto do story" />
        {closeButton('Descartar foto', () => setImageUri(null))}
        <View style={[styles.composer, { paddingBottom: keyboard.open ? keyboard.overlap + 12 : insets.bottom + 16 }]}>
          <TextInput
            style={styles.caption}
            placeholder="Adicione uma legenda..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            accessibilityLabel="Legenda"
            value={caption}
            onChangeText={setCaption}
            maxLength={2200}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Publicar no seu story"
            accessibilityState={{ disabled: posting, busy: posting }}
            onPress={handlePublish}
            disabled={posting}
            style={({ pressed }) => [styles.send, pressed && styles.pressed]}
          >
            {posting ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <>
                <Text variant="captionStrong" color={c.onPrimary}>
                  Seu story
                </Text>
                <Icon name="arrow-right" size={16} color={c.onPrimary} strokeWidth={2.2} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  } else {
    content = (
      <CameraCapture
        onCapture={setImageUri}
        onClose={handleClose}
        galleryAspect={[9, 16]}
        permissionTitle="Libere a câmera para criar seu story"
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => (imageUri ? setImageUri(null) : handleClose())}
    >
      {content}
    </Modal>
  );
}

const useStyles = createStyles((c) => ({
  root: { flex: 1, backgroundColor: '#000' },
  topLeft: { position: 'absolute', left: 14 },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  caption: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    fontFamily: FONT.regular,
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
  },
  send: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: c.primaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: { opacity: 0.85 },
}));
