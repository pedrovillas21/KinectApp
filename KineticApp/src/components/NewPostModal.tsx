import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { KINETIC } from '../theme/kinetic';
import { COLORS } from '../theme/colors';
import { createPost } from '../services/socialService';
import type { FeedPostData, PostIntensity } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (post: FeedPostData) => void;
}

const INTENSITY_OPTIONS: PostIntensity[] = ['LEVE', 'MODERADO', 'ALTA'];
const INTENSITY_LABELS: Record<PostIntensity, string> = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  ALTA: 'Alta',
};

export default function NewPostModal({ visible, onClose, onPostCreated }: Props) {
  const [intensity, setIntensity] = useState<PostIntensity>('MODERADO');
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const galleryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!galleryPerm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handlePost = async () => {
    if (posting) return;
    setPosting(true);
    try {
      const post = await createPost({
        intensity,
        caption: caption.trim() || undefined,
        imageUrl: imageUri ?? undefined,
      });
      onPostCreated(post);
      setCaption('');
      setImageUri(null);
      setIntensity('MODERADO');
      onClose();
    } catch {
      // silent — user can retry
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Novo Post</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Intensidade</Text>
            <View style={styles.segmented}>
              {INTENSITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.segment, intensity === opt && styles.segmentActive]}
                  onPress={() => setIntensity(opt)}
                >
                  <Text style={[styles.segmentText, intensity === opt && styles.segmentTextActive]}>
                    {INTENSITY_LABELS[opt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              ) : (
                <Text style={styles.photoBtnText}>📷 Adicionar foto</Text>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.captionInput}
              placeholder="Escreva uma legenda..."
              placeholderTextColor={KINETIC.textMuted}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={3}
            />

            <View style={styles.trainingCard}>
              <Text style={styles.trainingCardText}>🏋️ Treino detectado automaticamente</Text>
              <Text style={styles.trainingCardSub}>Os dados do último treino serão incluídos no post.</Text>
            </View>

            <TouchableOpacity
              style={[styles.postBtn, posting && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.postBtnText}>Publicar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrollContent: { justifyContent: 'flex-end', flexGrow: 1 },
  sheet: {
    backgroundColor: KINETIC.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { color: KINETIC.text, fontSize: 18, fontWeight: 'bold' },
  closeBtn: { color: KINETIC.textMuted, fontSize: 20 },
  label: { color: KINETIC.textDim, fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: KINETIC.surface2,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: KINETIC.primary },
  segmentText: { color: KINETIC.textMuted, fontSize: 13, fontWeight: 'bold' },
  segmentTextActive: { color: '#000' },
  photoBtn: {
    height: 160,
    backgroundColor: KINETIC.surface2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoBtnText: { color: KINETIC.textDim, fontSize: 15 },
  captionInput: {
    backgroundColor: KINETIC.surface2,
    color: KINETIC.text,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  trainingCard: {
    backgroundColor: KINETIC.primaryDim,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: KINETIC.primarySoft,
  },
  trainingCardText: { color: KINETIC.primary, fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  trainingCardSub: { color: KINETIC.textDim, fontSize: 12 },
  postBtn: {
    backgroundColor: COLORS.neonBlue,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
});
