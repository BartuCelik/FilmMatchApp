import React from 'react';
import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { detailModalStyles as styles } from './DetailModal.styles';

export default function DetailModal({ visible, panelY, selectedItem, loading, details, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="none">
      <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFillObject} />
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View style={[styles.panel, { transform: [{ translateY: panelY }] }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {selectedItem?.title}
          </Text>
          <Pressable onPress={onClose} style={styles.close}>
            <AntDesign name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#8B3DFF" />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.blockTitle}>Overview</Text>
            <Text style={styles.blockText}>{details?.overview || 'No overview available for this content.'}</Text>

            <Text style={[styles.blockTitle, styles.blockMargin]}>Cast</Text>
            {details?.cast?.length ? (
              details.cast.map((castMember) => (
                <View key={castMember.id} style={styles.castRow}>
                  <View style={styles.avatar}>
                    {castMember.profileImage ? (
                      <Image source={{ uri: castMember.profileImage }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person-outline" size={18} color="#BFBFBF" />
                    )}
                  </View>
                  <Text style={styles.blockText}>{castMember.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.blockText}>Cast information is not available.</Text>
            )}

            <Text style={[styles.blockTitle, styles.blockMargin]}>Watch Providers</Text>
            <View style={styles.providers}>
              {details?.providers?.length ? (
                details.providers.map((provider) => <Image key={provider.id} source={{ uri: provider.logo }} style={styles.provider} />)
              ) : (
                <View style={styles.banner}>
                  <Ionicons name="information-circle-outline" size={16} color="#FFC978" />
                  <Text style={styles.bannerText}>Su an dijital platformlarda mevcut degil</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}
