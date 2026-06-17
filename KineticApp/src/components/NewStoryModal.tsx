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
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { KINETIC } from '../theme/kinetic';
import { COLORS } from '../theme/colors';
import { createStory, uploadMedia } from '../services/socialService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

export default function NewStoryModal({ visible, onClose, onStoryCreated }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  // Reset centralizado: usado tanto no cancelamento quanto após publicar. Assim,
  // se o usuário desistir de um story e reabrir o modal, a foto antiga não reaparece.
  const handleClose = () => {
    setImageUri(null);
    setCaption('');
    onClose();
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handlePublish = async () => {
    if (posting || !imageUri) return;
    setPosting(true);
    try {
      // Sobe a foto ao Storage primeiro: grava a URL pública (visível p/ o squad
      // em qualquer aparelho) em vez do caminho local do dispositivo.
      const url = await uploadMedia(imageUri, 'stories');
      await createStory({ imageUrl: url, caption: caption.trim() || undefined });
      onStoryCreated();
      handleClose();
    } catch {
      // Mantém o modal aberto para o usuário tentar de novo (upload pode falhar por rede).
      Alert.alert('Não foi possível publicar', 'Verifique sua conexão e tente novamente.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <BlurView intensity={30} tint="dark" style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Novo Story</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {!imageUri ? (
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerBtn} onPress={pickFromCamera}>
                  <Text style={styles.pickerIcon}>📷</Text>
                  <Text style={styles.pickerLabel}>Câmera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery}>
                  <Text style={styles.pickerIcon}>🖼️</Text>
                  <Text style={styles.pickerLabel}>Galeria</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                </View>

                <TouchableOpacity style={styles.changePhotoBtn} onPress={() => setImageUri(null)}>
                  <Text style={styles.changePhotoText}>Trocar foto</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.captionInput}
                  placeholder="Adicione uma legenda..."
                  placeholderTextColor={KINETIC.textMuted}
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[styles.postBtn, posting && styles.postBtnDisabled]}
                  onPress={handlePublish}
                  disabled={posting}
                >
                  {posting ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.postBtnText}>Adicionar ao story</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
  pickerRow: { flexDirection: 'row', gap: 12 },
  pickerBtn: {
    flex: 1,
    height: 140,
    backgroundColor: KINETIC.surface2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerIcon: { fontSize: 32, marginBottom: 8 },
  pickerLabel: { color: KINETIC.text, fontSize: 15, fontWeight: 'bold' },
  previewContainer: {
    aspectRatio: 9 / 16,
    backgroundColor: KINETIC.surface2,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewImage: { width: '100%', height: '100%' },
  changePhotoBtn: { alignSelf: 'center', marginBottom: 16 },
  changePhotoText: { color: KINETIC.textDim, fontSize: 13, fontWeight: 'bold' },
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
