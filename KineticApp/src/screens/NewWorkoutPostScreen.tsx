import React, { useContext, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from '../components/ui/scaled';
import Icon from '../components/Icon';
import IntensityPicker from '../components/IntensityPicker';
import WorkoutPhotoStrip from '../components/WorkoutPhotoStrip';
import { Avatar, Button, ListGroup, ListRow, Screen, StackHeader, Text } from '../components/ui';
import { showAlert } from '../components/ui/AlertHost';
import { AuthContext } from '../contexts/AuthContext';
import { createPost, deleteMedia, uploadMedia } from '../services/socialService';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import type { MainStackScreenProps } from '../navigation/types';
import type { PostIntensity } from '../types';

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
          placeholderTextColor={KINETIC.placeholder}
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
          <IntensityPicker value={intensity} onChange={setIntensity} />
          <ListRow icon="users" title="Visível para" value="Amigos" />
        </ListGroup>
      </Screen>
  );
}

const styles = StyleSheet.create({
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: KINETIC.hairline,
    backgroundColor: KINETIC.bg,
  },
});
