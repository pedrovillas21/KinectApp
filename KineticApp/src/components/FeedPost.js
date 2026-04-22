import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../theme/colors';

export default function FeedPost({ post }) {
  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const handleLike = () => {
    if (isLiked) {
      setLikesCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={{ uri: post.author.avatarUrl }} style={styles.headerAvatar} />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerName}>{post.author.name}</Text>
          <Text style={styles.headerMeta}>{post.timestamp} • {post.category}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.dots}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* MID SECTION - IMAGE & GLASS OVERLAY */}
      <View style={styles.imageWrapper}>
        <ImageBackground 
          source={{ uri: post.imageUrl }} 
          style={styles.postImage}
          imageStyle={{ borderRadius: 12 }}
        >
          {post.badge && (
            <View style={styles.badgeWrap}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>{post.badge}</Text>
            </View>
          )}

          {/* Glass Overlay no canto inferior */}
          <BlurView intensity={20} tint="dark" style={styles.glassOverlay}>
            <View style={styles.metricsRow}>
              
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>DURATION</Text>
                <Text style={styles.metricValue}>
                  {post.duration.split(' ')[0]} <Text style={{ fontSize: 12 }}>{post.duration.split(' ')[1]}</Text>
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>CALORIES</Text>
                <Text style={styles.metricValue}>
                  {post.calories.split(' ')[0]} <Text style={{ fontSize: 12 }}>{post.calories.split(' ')[1]}</Text>
                </Text>
              </View>

            </View>
          </BlurView>
        </ImageBackground>
      </View>

      {/* FOOTER ACTIONS */}
      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
          <Text style={[styles.actionIcon, isLiked && { color: COLORS.neonBlue }]}>
            {isLiked ? '♥' : '♡'}
          </Text>
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
      </View>

      {/* CAPTION */}
      <View style={styles.captionContainer}>
        <Text style={styles.captionText}>
          <Text style={styles.captionAuthor}>{post.author.name} </Text>
          {post.caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  headerName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerMeta: {
    color: '#888',
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  dots: {
    color: '#CCC',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  imageWrapper: {
    // Width responsivo = 100%
    width: '100%',
    aspectRatio: 0.85, // Retrato
  },
  postImage: {
    flex: 1,
    justifyContent: 'space-between', 
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 16,
    marginRight: 16,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.neonBlue,
    marginRight: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  glassOverlay: {
    // Prende o blur na base do Image Background
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20,20,20, 0.4)', // tint dark cover
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricBlock: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  metricLabel: {
    color: '#AAA',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  footerActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionIcon: {
    fontSize: 20,
    color: '#CCC',
  },
  actionText: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  captionText: {
    color: '#CCC',
    fontSize: 13,
    lineHeight: 18,
  },
  captionAuthor: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});
