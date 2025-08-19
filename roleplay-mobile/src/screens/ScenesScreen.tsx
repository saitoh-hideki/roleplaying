import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface Scene {
  id: string;
  title: string;
  description: string;
  icon: string;
  edge_function: string;
}

export default function ScenesScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: 'basic', label: '基本', color: '#3b82f6', icon: 'shield-checkmark' },
    { id: 'advanced', label: '応用', color: '#10b981', icon: 'trending-up' },
    { id: 'special', label: '特別', color: '#f59e0b', icon: 'star' },
  ];

  useEffect(() => {
    fetchScenes();
  }, []);

  const fetchScenes = async () => {
    try {
      setIsLoading(true);
      
      // Webアプリと同じscenesテーブルからデータを取得
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching scenes:', error);
        Alert.alert('エラー', 'シーンデータの取得に失敗しました');
        return;
      }

      setScenes(data || []);
    } catch (error) {
      console.error('Error in fetchScenes:', error);
      Alert.alert('エラー', 'シーンデータの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScenes = selectedCategory
    ? scenes.filter(scene => {
        // シーンIDに基づいてカテゴリを判定
        if (selectedCategory === 'basic') {
          return scene.id.includes('001') || scene.id.includes('002') || scene.id.includes('003');
        } else if (selectedCategory === 'advanced') {
          return scene.id.includes('004') || scene.id.includes('005') || scene.id.includes('006');
        } else if (selectedCategory === 'special') {
          return scene.id.includes('007') || scene.id.includes('008') || scene.id.includes('009');
        }
        return false;
      })
    : scenes;

  const getCategoryColor = (sceneId: string) => {
    if (sceneId.includes('001') || sceneId.includes('002') || sceneId.includes('003')) {
      return '#3b82f6'; // 基本
    } else if (sceneId.includes('004') || sceneId.includes('005') || sceneId.includes('006')) {
      return '#10b981'; // 応用
    } else {
      return '#f59e0b'; // 特別
    }
  };

  const getCategoryLabel = (sceneId: string) => {
    if (sceneId.includes('001') || sceneId.includes('002') || sceneId.includes('003')) {
      return '基本';
    } else if (sceneId.includes('004') || sceneId.includes('005') || sceneId.includes('006')) {
      return '応用';
    } else {
      return '特別';
    }
  };

  const handleScenePress = (sceneId: string) => {
    navigation.navigate('Record', { sceneId: sceneId });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={styles.loadingText}>シーンを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>練習シーン選択</Text>
          <Text style={styles.subtitle}>
            練習したいシーンを選択して、ロールプレイを開始しましょう
          </Text>
        </View>

        {/* カテゴリフィルター */}
        <View style={styles.categoryFilter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                !selectedCategory && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  !selectedCategory && styles.categoryButtonTextActive,
                ]}
              >
                すべて
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                  { borderColor: category.color },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.id ? category.color : '#94a3b8'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.id && styles.categoryButtonTextActive,
                    selectedCategory === category.id && { color: category.color },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* シーン一覧 */}
        <View style={styles.scenesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.label}シーン` : 'すべてのシーン'}
            </Text>
            <Text style={styles.sectionCount}>
              {filteredScenes.length}件
            </Text>
          </View>

          {filteredScenes.length > 0 ? (
            filteredScenes.map((scene) => (
              <TouchableOpacity
                key={scene.id}
                style={styles.sceneCard}
                onPress={() => handleScenePress(scene.id)}
              >
                <View style={styles.sceneHeader}>
                  <View style={styles.sceneIconContainer}>
                    <Text style={styles.sceneIcon}>{scene.icon || '🎭'}</Text>
                  </View>
                  <View style={styles.sceneInfo}>
                    <Text style={styles.sceneTitle}>{scene.title}</Text>
                    <Text style={styles.sceneDescription} numberOfLines={2}>
                      {scene.description}
                    </Text>
                  </View>
                  <View style={styles.sceneMeta}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(scene.id) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: getCategoryColor(scene.id) },
                        ]}
                      >
                        {getCategoryLabel(scene.id)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.sceneFooter}>
                  <View style={styles.sceneStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color="#94a3b8" />
                      <Text style={styles.statText}>約5分</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="people-outline" size={14} color="#94a3b8" />
                      <Text style={styles.statText}>1対1</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      { backgroundColor: getCategoryColor(scene.id) },
                    ]}
                    onPress={() => handleScenePress(scene.id)}
                  >
                    <Ionicons name="play" size={16} color="white" />
                    <Text style={styles.startButtonText}>開始</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#64748b" />
              <Text style={styles.emptyStateTitle}>シーンが見つかりません</Text>
              <Text style={styles.emptyStateText}>
                {selectedCategory 
                  ? `選択したカテゴリ「${categories.find(c => c.id === selectedCategory)?.label}」に該当するシーンがありません。`
                  : 'シーンが登録されていません。'
                }
              </Text>
            </View>
          )}
        </View>

        {/* ヒント */}
        <View style={styles.hintContainer}>
          <View style={styles.hintCard}>
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.hintTitle}>練習のコツ</Text>
            <Text style={styles.hintText}>
              基本シーンから始めて、徐々に難易度を上げていくことをお勧めします。
              各シーンは複数回練習することで、より良い結果が得られます。
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 22,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    marginRight: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    borderColor: '#7C4DFF',
    backgroundColor: '#7C4DFF20',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  categoryButtonTextActive: {
    color: '#7C4DFF',
    fontWeight: '600',
  },
  scenesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  sectionCount: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sceneCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sceneHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sceneIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#334155',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sceneIcon: {
    fontSize: 28,
  },
  sceneInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sceneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
    lineHeight: 24,
  },
  sceneDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  sceneMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sceneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sceneStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  hintContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  hintCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 12,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
});
