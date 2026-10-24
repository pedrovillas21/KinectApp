import React, { useContext, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from './ui/scaled';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import Icon from './Icon';
import IntensityPicker from './IntensityPicker';
import CameraCapture from './CameraCapture';
import { BottomSheet, Button, ListGroup, ListRow, Text } from './ui';
import { showAlert } from './ui/AlertHost';
import { AuthContext } from '../contexts/AuthContext';
import { createPost, uploadMedia, deleteMedia } from '../services/socialService';
import { getUserWorkouts } from '../services/profileService';
import { formatDurationSeconds, formatShortDate, formatThousands, parseLocalDate } from '../utils/formatters';
import type { FeedPostData, PostIntensity, WorkoutSummary } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (post: FeedPostData) => void;
}

/** Histórico de treinos que pode ser marcado num post: hoje + 6 dias anteriores. */
const HISTORY_DAYS = 7;

const daysAgo = (iso: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // round: absorve a hora a mais/a menos de horário de verão.
  return Math.round((today - parseLocalDate(iso).getTime()) / 86400000);
};

const dayLabel = (iso: string) => {
  const d = daysAgo(iso);
  return d <= 0 ? 'Hoje' : d === 1 ? 'Ontem' : formatShortDate(iso);
};

const workoutSubtitle = (w: WorkoutSummary) =>
  [dayLabel(w.date), w.durationSeconds ? formatDurationSeconds(w.durationSeconds) : null, w.volumeKg > 0 ? `${formatThousands(w.volumeKg)} kg` : null]
    .filter(Boolean)
    .join(' · ');

export default function NewPostModal({ visible, onClose, onPostCreated }: Props) {
  const { currentUser } = useContext(AuthContext);
  const [intensity, setIntensity] = useState<PostIntensity>('MODERADO');
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [workout, setWorkout] = useState<WorkoutSummary | null>(null);
  const [posting, setPosting] = useState(false);

  const [picking, setPicking] = useState(false);
  const [recent, setRecent] = useState<WorkoutSummary[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadRecent = async () => {
    if (!currentUser) return;
    setRecent(null);
    setLoadError(false);
    try {
      const page = await getUserWorkouts(String(currentUser.id), 0, 30);
      setRecent(page.content.filter((w) => daysAgo(w.date) < HISTORY_DAYS));
    } catch {
      setLoadError(true);
    }
  };

  const openPicker = () => {
    setPicking(true);
    loadRecent();
  };

  const close = () => {
    setPicking(false);
    setCamera(true);
    setFromForm(false);
    setCameraGone(Platform.OS !== 'ios');
    onClose();
  };

  // O "+" abre direto a câmera em tela cheia (igual ao story); a foto leva ao formulário.
  // `camera` true = câmera aberta; `fromForm` = foi aberta pelo formulário (trocar/adicionar foto).
  const [camera, setCamera] = useState(true);
  const [fromForm, setFromForm] = useState(false);
  // iOS não apresenta um Modal enquanto outro ainda está fechando: o formulário espera o onDismiss da câmera.
  const [cameraGone, setCameraGone] = useState(Platform.OS !== 'ios');

  const openCamera = () => {
    setFromForm(true);
    setCameraGone(Platform.OS !== 'ios');
    setCamera(true);
  };

  const onCapture = (uri: string) => {
    setImageUri(uri);
    setCamera(false);
  };

  // Fechar a câmera: volta ao formulário se veio dele; senão desiste da publicação.
  const closeCamera = () => (fromForm ? setCamera(false) : close());

  // Post sem foto, legenda e treino não tem o que mostrar no feed.
  const isEmpty = !imageUri && !caption.trim() && !workout;

  const handlePost = async () => {
    if (posting) return;
    setPosting(true);
    let uploadedUrl: string | undefined;
    try {
      // Sobe a foto ao Storage primeiro: assim grava a URL pública (visível em
      // qualquer aparelho) em vez do caminho local do dispositivo.
      uploadedUrl = imageUri ? await uploadMedia(imageUri, 'posts') : undefined;
      const post = await createPost({
        intensity,
        caption: caption.trim() || undefined,
        imageUrl: uploadedUrl,
        workoutSessionId: workout?.id,
      });
      onPostCreated(post);
      setCaption('');
      setImageUri(null);
      setWorkout(null);
      setIntensity('MODERADO');
      close();
    } catch {
      // Se a foto já subiu mas a criação do post falhou, remove a mídia órfã
      // (best-effort) para não acumular lixo no bucket.
      if (uploadedUrl) deleteMedia(uploadedUrl).catch(() => {});
      // Mantém o modal aberto para o usuário tentar de novo (upload pode falhar por rede).
      showAlert('Não foi possível publicar', 'Verifique sua conexão e tente novamente.');
    } finally {
      setPosting(false);
    }
  };

  const form = (
    <View style={styles.body}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={imageUri ? 'Trocar foto' : 'Adicionar foto'}
        onPress={openCamera}
        style={({ pressed }) => [styles.photo, !imageUri && styles.photoEmpty, pressed && styles.pressed]}
      >
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remover foto"
              onPress={() => setImageUri(null)}
              hitSlop={8}
              style={styles.photoRemove}
            >
              <Icon name="close" size={16} color="#fff" />
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.photoIcon}>
              <Icon name="camera" size={20} color={KINETIC.primary} />
            </View>
            <Text variant="bodyStrong">Adicionar foto</Text>
            <Text variant="caption" color={KINETIC.textSecondary}>
              Câmera ou galeria
            </Text>
          </>
        )}
      </Pressable>

      <TextInput
        style={styles.caption}
        placeholder="Escreva uma legenda..."
        placeholderTextColor={KINETIC.placeholder}
        accessibilityLabel="Legenda"
        value={caption}
        onChangeText={setCaption}
        maxLength={2200}
        multiline
      />

      <ListGroup style={styles.group}>
        {workout ? (
          <ListRow
            icon="dumbbell"
            title={workout.title || 'Treino livre'}
            subtitle={workoutSubtitle(workout)}
            onPress={openPicker}
            accessory={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remover treino"
                onPress={() => setWorkout(null)}
                hitSlop={10}
                style={styles.unlink}
              >
                <Icon name="close" size={14} color={KINETIC.textDim} />
              </Pressable>
            }
          />
        ) : (
          <ListRow icon="dumbbell" title="Adicionar treino" subtitle="Escolha um dos últimos 7 dias" onPress={openPicker} />
        )}
        <IntensityPicker value={intensity} onChange={setIntensity} />
      </ListGroup>

      <Button label="Publicar" loading={posting} disabled={posting || isEmpty} onPress={handlePost} />
    </View>
  );

  const picker = (
    <View style={styles.body}>
      {loadError ? (
        <View style={styles.state}>
          <Text variant="bodyStrong">Não foi possível carregar seus treinos</Text>
          <Button label="Tentar novamente" variant="secondary" size="sm" block={false} onPress={loadRecent} />
        </View>
      ) : recent === null ? (
        <ActivityIndicator color={KINETIC.primary} style={styles.state} />
      ) : recent.length === 0 ? (
        <View style={styles.state}>
          <View style={styles.photoIcon}>
            <Icon name="calendar" size={20} color={KINETIC.primary} />
          </View>
          <Text variant="bodyStrong">Nenhum treino nos últimos 7 dias</Text>
          <Text variant="caption" color={KINETIC.textSecondary} style={styles.center}>
            Finalize um treino para compartilhá-lo aqui.
          </Text>
        </View>
      ) : (
        <ListGroup title="Últimos 7 dias" style={styles.group}>
          {recent.map((w) => (
            <ListRow
              key={w.id}
              icon="dumbbell"
              title={w.title || 'Treino livre'}
              subtitle={workoutSubtitle(w)}
              onPress={() => {
                setWorkout(w);
                setPicking(false);
              }}
              selected={w.id === workout?.id}
              accessory={w.id === workout?.id ? <Icon name="check" size={18} color={KINETIC.primary} /> : undefined}
            />
          ))}
        </ListGroup>
      )}
    </View>
  );

  return (
    <>
      <Modal
        visible={visible && camera}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeCamera}
        onDismiss={() => setCameraGone(true)}
      >
        <CameraCapture
          onCapture={onCapture}
          onClose={closeCamera}
          galleryAspect={[4, 5]}
          permissionTitle="Libere a câmera para a foto do post"
        />
      </Modal>
      <BottomSheet
        visible={visible && !camera && cameraGone}
        onClose={close}
        title={picking ? 'Treino realizado' : 'Nova publicação'}
        onBack={picking ? () => setPicking(false) : undefined}
      >
        {picking ? picker : form}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, gap: 16 },
  group: { marginHorizontal: 0 },
  photo: {
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: KINETIC.ghostHi },
  photoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
    backgroundColor: KINETIC.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  caption: {
    minHeight: 88,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: RADIUS.xl,
    backgroundColor: KINETIC.surface1,
    fontFamily: FONT.regular,
    fontSize: 15,
    lineHeight: 21,
    color: KINETIC.text,
    textAlignVertical: 'top',
  },
  unlink: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KINETIC.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: { alignItems: 'center', gap: 6, paddingVertical: 40 },
  center: { textAlign: 'center' },
});
