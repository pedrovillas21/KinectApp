import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import Icon from '../components/Icon';
import WorkoutPhotoStrip from '../components/WorkoutPhotoStrip';
import { Button, Text } from '../components/ui';
import { showAlert } from '../components/ui/AlertHost';
import { KINETIC, RADIUS } from '../theme/kinetic';
import type { MainStackScreenProps } from '../navigation/types';

/** Câmera em tela cheia (estilo stories): botão de foto no centro, controles soltos sobre a imagem. */
export default function WorkoutCameraScreen({ navigation, route }: MainStackScreenProps<'WorkoutCamera'>) {
  const { workout } = route.params;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const takingRef = useRef(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [ready, setReady] = useState(false);

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
        <Icon name="camera" size={32} color={KINETIC.textDim} />
        <Text variant="headline" style={styles.center}>
          Libere a câmera para a foto do treino
        </Text>
        <Text variant="body" color={KINETIC.textDim} style={styles.center}>
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
  // então sai um pouco mais aberta nas laterais. Recortar exato pede expo-image-manipulator.
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
          <Icon name="bolt" size={20} color={flash === 'on' ? KINETIC.primary : '#fff'} />
        </RoundButton>
      </View>

      <View style={[styles.controls, { bottom: insets.bottom + 28 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Escolher da galeria" onPress={pickFromGallery} style={styles.gallery}>
          <Icon name="image" size={18} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tirar foto"
          accessibilityState={{ disabled: !ready }}
          onPress={takePhoto}
          style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
        <RoundButton label="Virar câmera" onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
            <Path d="M4 3v5h5" />
            <Path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
            <Path d="M20 21v-5h-5" />
          </Svg>
        </RoundButton>
      </View>
    </View>
  );
}

function RoundButton({
  label,
  onPress,
  style,
  children,
}: {
  label: string;
  onPress: () => void;
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={[styles.round, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  mask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)' },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  gallery: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: KINETIC.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  permission: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  permissionActions: { alignSelf: 'stretch', gap: 10, marginTop: 18 },
  center: { textAlign: 'center' },
});
