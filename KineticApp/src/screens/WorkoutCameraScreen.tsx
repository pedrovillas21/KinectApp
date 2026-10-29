import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarHidden } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Icon from '../components/Icon';
import { FlipCameraButton, GalleryButton, RoundButton, ShutterButton } from '../components/CameraButtons';
import WorkoutPhotoStrip from '../components/WorkoutPhotoStrip';
import { Button, Text } from '../components/ui';
import { showAlert } from '../components/ui/AlertHost';

import type { MainStackScreenProps } from '../navigation/types';
import { useColors } from '../theme/ThemeContext';

/** Câmera em tela cheia (estilo stories): botão de foto no centro, controles soltos sobre a imagem. */
export default function WorkoutCameraScreen({ navigation, route }: MainStackScreenProps<'WorkoutCamera'>) {
  const c = useColors();
  const { workout } = route.params;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const takingRef = useRef(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [ready, setReady] = useState(false);

  // Status bar escondida só com a câmera em foco. A opção statusBarHidden da rota exigiria
  // UIViewControllerBasedStatusBarAppearance = YES no iOS, e o app usa NO (expo-status-bar).
  useFocusEffect(
    useCallback(() => {
      setStatusBarHidden(true, 'fade');
      return () => setStatusBarHidden(false, 'fade');
    }, []),
  );

  const openPost = (photoUri: string) => navigation.navigate('NewWorkoutPost', { workout, photoUri });

  const takePhoto = async () => {
    if (!ready || takingRef.current) return;
    takingRef.current = true;
    try {
      const pic = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (pic?.uri) openPost(pic.uri);
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
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled) openPost(result.assets[0].uri);
  };

  const close = () => navigation.goBack();

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.permission, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <RoundButton label="Fechar câmera" onPress={close} style={[styles.closeAbs, { top: insets.top + 12 }]}>
          <Icon name="close" size={20} color="#fff" strokeWidth={2.2} />
        </RoundButton>
        <Icon name="camera" size={32} color={c.textDim} />
        <Text variant="headline" style={styles.center}>
          Libere a câmera para a foto do treino
        </Text>
        <Text variant="body" color={c.textDim} style={styles.center}>
          A foto sai com a tonelagem, o tempo e o treino de hoje.
        </Text>
        <View style={styles.permissionActions}>
          {permission.canAskAgain ? <Button label="Permitir câmera" onPress={requestPermission} /> : null}
          <Button label="Escolher da galeria" icon="image" variant="secondary" onPress={pickFromGallery} />
        </View>
      </View>
    );
  }

  // Moldura 4:5 (o formato do post) centrada na tela.
  // shortcut: a foto não é recortada ao que a moldura mostra; o feed corta o centro em 4:5,
  // então sai um pouco mais aberta nas laterais. Recortar exato: expo-image-manipulator
  // (já usado em utils/compressImage).
  const frameH = Math.min(width * 1.25, height * 0.62);
  const frameW = frameH * 0.8;

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        onCameraReady={() => setReady(true)}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.mask} />
        <View style={{ height: frameH, flexDirection: 'row' }}>
          <View style={styles.mask} />
          <View style={{ width: frameW, overflow: 'hidden' }}>
            <WorkoutPhotoStrip volumeKg={workout.volumeKg} durationSeconds={workout.durationSeconds} title={workout.title} />
          </View>
          <View style={styles.mask} />
        </View>
        <View style={styles.mask} />
      </View>

      <RoundButton label="Fechar câmera" onPress={close} style={[styles.closeAbs, { top: insets.top + 12 }]}>
        <Icon name="close" size={20} color="#fff" strokeWidth={2.2} />
      </RoundButton>
      <View style={[styles.rail, { top: insets.top + 12 }]}>
        <RoundButton
          label={flash === 'on' ? 'Flash ligado' : 'Flash desligado'}
          onPress={() => setFlash((f) => (f === 'on' ? 'off' : 'on'))}
        >
          <Icon name="bolt" size={20} color={flash === 'on' ? c.primary : '#fff'} />
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
  mask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)' },
  closeAbs: { position: 'absolute', left: 14 },
  rail: { position: 'absolute', right: 14, gap: 10 },
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
