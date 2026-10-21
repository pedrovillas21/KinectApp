import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { KINETIC } from '../theme/kinetic';
import Icon from './Icon';
import { FlipCameraButton, GalleryButton, RoundButton, ShutterButton } from './CameraButtons';
import { Button, Text } from './ui';
import { showAlert } from './ui/AlertHost';

interface Props {
  /** Foto tirada ou escolhida na galeria. */
  onCapture: (uri: string) => void;
  onClose: () => void;
  /** Recorte da galeria: [9, 16] story, [4, 5] post. */
  galleryAspect: [number, number];
  /** Título da tela quando a câmera não tem permissão. */
  permissionTitle: string;
}

/**
 * Câmera em tela cheia estilo Instagram (story e post): fechar e flash no topo; galeria,
 * disparador e virar câmera embaixo. Sem permissão, oferece liberar ou usar a galeria.
 * Renderizar dentro de um Modal/tela de fundo preto.
 */
export default function CameraCapture({ onCapture, onClose, galleryAspect, permissionTitle }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const takingRef = useRef(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [ready, setReady] = useState(false);

  // Primeira abertura: pede a câmera direto, como o Instagram.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.status]);

  const takePhoto = async () => {
    if (!ready || takingRef.current) return;
    takingRef.current = true;
    try {
      const pic = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (pic?.uri) onCapture(pic.uri);
    } catch {
      showAlert('Não foi possível tirar a foto', 'Tente novamente.');
    } finally {
      takingRef.current = false;
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert('Permissão necessária', 'Conceda acesso à galeria para escolher uma foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: galleryAspect,
      quality: 0.8,
    });
    if (!result.canceled) onCapture(result.assets[0].uri);
  };

  const closeButton = (
    <RoundButton label="Fechar câmera" onPress={onClose} style={[styles.topLeft, { top: insets.top + 12 }]}>
      <Icon name="close" size={20} color="#fff" strokeWidth={2.2} />
    </RoundButton>
  );

  if (permission && !permission.granted) {
    return (
      <View style={[styles.root, styles.permission, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        {closeButton}
        <Icon name="camera" size={32} color={KINETIC.textDim} />
        <Text variant="headline" style={styles.center}>
          {permissionTitle}
        </Text>
        <Text variant="body" color={KINETIC.textDim} style={styles.center}>
          Ou escolha uma foto que já está na galeria.
        </Text>
        <View style={styles.permissionActions}>
          {permission.canAskAgain ? <Button label="Permitir câmera" onPress={requestPermission} /> : null}
          <Button label="Escolher da galeria" icon="image" variant="secondary" onPress={pickFromGallery} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {permission ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          onCameraReady={() => setReady(true)}
        />
      ) : null}
      {closeButton}
      <View style={[styles.topRight, { top: insets.top + 12 }]}>
        <RoundButton
          label={flash === 'on' ? 'Flash ligado' : 'Flash desligado'}
          onPress={() => setFlash((f) => (f === 'on' ? 'off' : 'on'))}
        >
          <Icon name="bolt" size={20} color={flash === 'on' ? KINETIC.primary : '#fff'} />
        </RoundButton>
      </View>
      <View style={[styles.controls, { bottom: insets.bottom + 28 }]}>
        <GalleryButton onPress={pickFromGallery} />
        <ShutterButton onPress={takePhoto} ready={ready} />
        <FlipCameraButton onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topLeft: { position: 'absolute', left: 14 },
  topRight: { position: 'absolute', right: 14 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permission: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  permissionActions: { alignSelf: 'stretch', gap: 10, marginTop: 18 },
  center: { textAlign: 'center' },
});
