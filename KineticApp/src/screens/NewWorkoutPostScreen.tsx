import React, { useContext, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icon from '../components/Icon';
import WorkoutPhotoStrip from '../components/WorkoutPhotoStrip';
import { Avatar, Button, ListGroup, ListRow, Screen, StackHeader, Text } from '../components/ui';
import { showAlert } from '../components/ui/AlertHost';
import { AuthContext } from '../contexts/AuthContext';
import { createPost, deleteMedia, uploadMedia } from '../services/socialService';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import type { MainStackScreenProps } from '../navigation/types';
import type { PostIntensity } from '../types';

const INTENSITIES: { value: PostIntensity; label: string }[] = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'ALTA', label: 'Alta' },
];

/** Prévia e publicação da foto do treino recém-concluído, já ligada à sessão salva. */
export default function NewWorkoutPostScreen({ navigation, route }: MainStackScreenProps<'NewWorkoutPost'>) {
  const { workout, photoUri } = route.params;
  const { currentUser } = useContext(AuthContext);
  const [caption, setCaption] = useState('');
  const [intensity, setIntensity] = useState<PostIntensity>('MODERADO');
  const [posting, setPosting] = useState(false);

  const publish = async () => {
    if (posting) return;
    setPosting(true);
    let uploadedUrl: string | undefined;
    try {
      uploadedUrl = await uploadMedia(photoUri, 'posts');
      await createPost({
        intensity,
        caption: caption.trim() || undefined,
        imageUrl: uploadedUrl,
        clientSessionId: workout.clientSessionId,
      });
      navigation.navigate('MainTabs', { screen: 'Social', params: { refreshAt: Date.now() } });
    } catch {
      // Foto subiu mas o post falhou: remove a mídia órfã (best-effort), igual ao NewPostModal.
      if (uploadedUrl) deleteMedia(uploadedUrl).catch(() => {});
      showAlert('Não foi possível publicar', 'Verifique sua conexão e tente novamente.');
      setPosting(false);
    }
  };

  const footer = (
    <View style={styles.footer}>
      <Button label="Publicar" icon="arrow-right" loading={posting} disabled={posting} onPress={publish} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        edges={['top', 'left', 'right', 'bottom']}
        header={<StackHeader title="Nova publicação" onBack={() => navigation.goBack()} />}
        footer={footer}
        contentStyle={styles.content}
      >
        <View style={styles.photo}>
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} accessibilityLabel="Foto do treino" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refazer foto"
            onPress={() => navigation.goBack()}
            style={styles.retake}
          >
            <Icon name="camera" size={16} color="#fff" />
          </Pressable>
          <WorkoutPhotoStrip volumeKg={workout.volumeKg} durationSeconds={workout.durationSeconds} title={workout.title} />
        </View>

        <View style={styles.captionRow}>
          <Avatar name={currentUser?.nome} seed={currentUser?.id} size={36} />
          <TextInput
            style={styles.caption}
            placeholder="Escreva uma legenda..."
            placeholderTextColor={KINETIC.textMuted}
            accessibilityLabel="Legenda"
            value={caption}
            onChangeText={setCaption}
            maxLength={2200}
            multiline
          />
        </View>

        <ListGroup>
          <ListRow
            icon="dumbbell"
            title={workout.title}
            subtitle={`Hoje · ${workout.setsCount} séries · ${workout.exercisesCount} exercícios`}
            accessory={
              <View style={styles.tag}>
                <Text variant="micro" color={KINETIC.primary}>
                  Marcado
                </Text>
              </View>
            }
          />
          <ListRow
            icon="flame"
            title="Intensidade"
            accessory={
              <View style={styles.chips} accessibilityRole="radiogroup">
                {INTENSITIES.map((opt) => {
                  const on = opt.value === intensity;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      onPress={() => setIntensity(opt.value)}
                      hitSlop={6}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text variant="captionStrong" color={on ? KINETIC.onPrimary : KINETIC.textDim}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
          />
          <ListRow icon="users" title="Visível para" value="Amigos" />
        </ListGroup>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: KINETIC.bg },
  content: { gap: 16, paddingTop: 4 },
  photo: {
    marginHorizontal: 16,
    aspectRatio: 4 / 5,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: KINETIC.media,
  },
  retake: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 18 },
  caption: {
    flex: 1,
    minHeight: 44,
    paddingTop: 8,
    fontFamily: FONT.regular,
    fontSize: 15,
    lineHeight: 21,
    color: KINETIC.text,
    textAlignVertical: 'top',
  },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.xs, backgroundColor: KINETIC.primaryDim },
  chips: { flexDirection: 'row', gap: 4 },
  chip: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: KINETIC.primary, borderColor: KINETIC.primary },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: KINETIC.hairline,
    backgroundColor: KINETIC.bg,
  },
});
