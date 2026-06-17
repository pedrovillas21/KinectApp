import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import Icon from './Icon';
import type { StoryGroup } from '../types';

const STORY_DURATION = 5000; // ms por story, estilo Instagram
const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  const hours = Math.floor(diffMin / 60);
  return `${hours}h`;
}

export default function StoryViewer({ visible, groups, initialGroupIndex, onClose }: Props) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  // Reinicia ao abrir ou ao mudar o ponto de entrada.
  useEffect(() => {
    if (visible) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
    }
  }, [visible, initialGroupIndex]);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  const goNext = () => {
    const g = groups[groupIndex];
    if (!g) return onClose();
    if (storyIndex < g.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prev = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setStoryIndex(prev ? Math.max(0, prev.stories.length - 1) : 0);
    }
    // primeira story do primeiro grupo: reinicia a barra (efeito abaixo).
  };

  // Avanço automático: anima a barra de progresso e passa para a próxima ao terminar.
  useEffect(() => {
    if (!visible || !story) return;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) goNext();
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, groupIndex, storyIndex]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {group && story && (
          <SafeAreaView style={styles.safe}>
            {/* Barras de progresso */}
            <View style={styles.progressRow}>
              {group.stories.map((s, i) => (
                <View key={s.id} style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width:
                          i < storyIndex
                            ? '100%'
                            : i === storyIndex
                            ? progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              })
                            : '0%',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* Cabeçalho */}
            <View style={styles.header}>
              <Image source={{ uri: group.avatarUrl }} style={styles.avatar} />
              <Text style={styles.name} numberOfLines={1}>
                {group.nome.split(' ')[0]}
              </Text>
              <Text style={styles.time}>{timeAgo(story.createdAt)}</Text>
              <View style={{ flex: 1 }} />
              <Pressable hitSlop={12} onPress={onClose}>
                <Icon name="close" size={22} color="#FFF" />
              </Pressable>
            </View>

            {/* Mídia */}
            <View style={styles.media}>
              {story.imageUrl ? (
                <Image source={{ uri: story.imageUrl }} style={styles.image} resizeMode="contain" />
              ) : (
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>Story sem imagem</Text>
                </View>
              )}
              {!!story.caption && (
                <View style={styles.captionWrap}>
                  <Text style={styles.caption}>{story.caption}</Text>
                </View>
              )}
            </View>

            {/* Zonas de toque: esquerda volta, direita avança */}
            <View style={styles.tapZones} pointerEvents="box-none">
              <Pressable style={styles.tapLeft} onPress={goPrev} />
              <Pressable style={styles.tapRight} onPress={goNext} />
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    zIndex: 2,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222' },
  name: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  time: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  close: { color: '#FFF', fontSize: 22, fontWeight: '300' },
  media: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width, height: '100%' },
  noImage: { justifyContent: 'center', alignItems: 'center' },
  noImageText: { color: '#666', fontSize: 14 },
  captionWrap: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  caption: { color: '#FFF', fontSize: 15, lineHeight: 20 },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 70 },
  tapLeft: { width: width * 0.3 },
  tapRight: { flex: 1 },
});
