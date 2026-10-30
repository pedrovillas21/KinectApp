import React, { useContext, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from './ui/scaled';
import { FONT, RADIUS } from '../theme/kinetic';
import Icon from './Icon';
import IntensityPicker from './IntensityPicker';
import CameraCapture from './CameraCapture';
import { BottomSheet, Button, ListGroup, ListRow, Text } from './ui';
import { showAlert } from './ui/AlertHost';
import { AuthContext } from '../contexts/AuthContext';
import { createPost, uploadAndCreate } from '../services/socialService';
import { getUserWorkouts } from '../services/profileService';
import { formatDurationSeconds, formatShortDate, formatThousands, parseLocalDate } from '../utils/formatters';
import type { FeedPostData, PostIntensity, WorkoutSummary } from '../types';
import { createStyles, useColors } from '../theme/ThemeContext';

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
  const styles = useStyles();
  const c = useColors();
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
    try {
      const base = { intensity, caption: caption.trim() || undefined, workoutSessionId: workout?.id };
      // Com foto, ela sobe ao Storage primeiro: o post grava o identificador dela, não o caminho local.
      const post = imageUri
        ? await uploadAndCreate(imageUri, 'posts', (imageUrl) => createPost({ ...base, imageUrl }))
        : await createPost(base);
      onPostCreated(post);
      setCaption('');
      setImageUri(null);
      setWorkout(null);
      setIntensity('MODERADO');
      close();
    } catch {
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
              <Icon name="camera" size={20} color={c.primary} />
            </View>
            <Text variant="bodyStrong">Adicionar foto</Text>
            <Text variant="caption" color={c.textSecondary}>
              Câmera ou galeria
            </Text>
          </>
        )}
      </Pressable>

      <TextInput
        style={styles.caption}
        placeholder="Escreva uma legenda..."
        placeholderTextColor={c.placeholder}
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
                <Icon name="close" size={14} color={c.textDim} />
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

  // Erro, carregando, vazio ou a lista dos treinos recentes.
  const renderRecent = () => {
    if (loadError) {
      return (
        <View style={styles.state}>
          <Text variant="bodyStrong">Não foi possível carregar seus treinos</Text>
          <Button label="Tentar novamente" variant="secondary" size="sm" block={false} onPress={loadRecent} />
        </View>
      );
    }
    if (recent === null) return <ActivityIndicator color={c.primary} style={styles.state} />;
    if (recent.length === 0) {
      return (
        <View style={styles.state}>
          <View style={styles.photoIcon}>
            <Icon name="calendar" size={20} color={c.primary} />
          </View>
          <Text variant="bodyStrong">Nenhum treino nos últimos 7 dias</Text>
          <Text variant="caption" color={c.textSecondary} style={styles.center}>
            Finalize um treino para compartilhá-lo aqui.
          </Text>
        </View>
      );
    }
    return (
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
            accessory={w.id === workout?.id ? <Icon name="check" size={18} color={c.primary} /> : undefined}
          />
        ))}
      </ListGroup>
    );
  };

  const picker = <View style={styles.body}>{renderRecent()}</View>;

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

const useStyles = createStyles((c) => ({
  body: { paddingHorizontal: 16, gap: 16 },
  group: { marginHorizontal: 0 },
  photo: { 
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: c.ghostHi },
  photoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
    backgroundColor: c.primaryDim,
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
    backgroundColor: c.surface1,
    fontFamily: FONT.regular,
    fontSize: 15,
    lineHeight: 21,
    color: c.text,
    textAlignVertical: 'top',
  },
  unlink: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: { alignItems: 'center', gap: 6, paddingVertical: 40 },
  center: { textAlign: 'center' },
}));
