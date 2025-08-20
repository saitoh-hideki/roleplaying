import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface Recording {
  id: string;
  created_at: string;
  transcript: string;
  situation_id: string;
  scenes: {
    title: string;
    description: string;
    icon: string;
  };
}

export default function HistoryScreen({ navigation }: any) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Webアプリと同じデータ構造で録音データを取得
        const { data: recordingsData, error: recordingsError } = await supabase
          .from('recordings')
          .select(`
            id,
            created_at,
            transcript,
            situation_id,
            scenes (title, description, icon)
          `)
          .order('created_at', { ascending: false });

        if (recordingsError) {
          throw recordingsError;
        }
        
        // 型を正しく変換
        const formattedRecordings: Recording[] = (recordingsData || []).map((recording: any) => ({
          id: recording.id,
          created_at: recording.created_at,
          transcript: recording.transcript,
          situation_id: recording.situation_id,
          scenes: {
            title: (recording.scenes as any)?.title || '不明なシーン',
            description: (recording.scenes as any)?.description || '',
            icon: (recording.scenes as any)?.icon || '🎭'
          }
        }));
        
        setRecordings(formattedRecordings);
        
        // フェードインアニメーション
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        Alert.alert('エラー', 'データの読み込みに失敗しました。');
        console.error(error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // 5秒ごとにデータを更新
    return () => clearInterval(interval);
  }, []);

  const filters = [
    { id: 'all', label: 'すべて', icon: 'list' },
    { id: 'recent', label: '最近', icon: 'time' },
    { id: 'completed', label: '完了', icon: 'checkmark-circle' },
    { id: 'pending', label: '評価中', icon: 'hourglass' },
  ];

  const dateFilters = [
    { id: 'all', label: 'すべて' },
    { id: 'today', label: '今日' },
    { id: 'week', label: '今週' },
    { id: 'month', label: '今月' },
  ];

  const getFilteredRecordings = () => {
    let filtered = recordings;

    // 検索クエリでフィルタ
    if (searchQuery.trim()) {
      filtered = filtered.filter(r => 
        r.scenes.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.transcript?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 日付フィルタ
    const now = new Date();
    switch (selectedDateFilter) {
      case 'today':
        filtered = filtered.filter(r => {
          const recordDate = new Date(r.created_at);
          return recordDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(r => new Date(r.created_at) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(r => new Date(r.created_at) >= monthAgo);
        break;
    }

    // カテゴリフィルタ
    switch (selectedFilter) {
      case 'recent':
        return filtered.slice(0, 5);
      case 'completed':
        return filtered.filter(r => r.transcript);
      case 'pending':
        return filtered.filter(r => !r.transcript);
      default:
        return filtered;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '昨日';
    } else if (diffDays === 0) {
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays <= 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getSceneIcon = (scene: any) => {
    return scene?.icon || '🎭';
  };

  const getSceneTitle = (scene: any) => {
    return scene?.title || '不明なシーン';
  };

  const getStatusBadge = (recording: Recording) => {
    if (!recording.transcript) {
      return { text: '評価待ち', color: '#F59E0B', bgColor: '#FEF3C7' };
    }
    return { text: '評価完了', color: '#10B981', bgColor: '#D1FAE5' };
  };

  const filteredRecordings = getFilteredRecordings();

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>録音履歴</Text>
            <Text style={styles.subtitle}>
              これまでの練習記録を確認できます
            </Text>
          </View>

          {/* 検索バー */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="シーン名や内容で検索..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* フィルター */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter.id && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Ionicons
                    name={filter.icon as any}
                    size={16}
                    color={selectedFilter === filter.id ? '#7C4DFF' : '#94a3b8'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === filter.id && styles.filterButtonTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 日付フィルター */}
          <View style={styles.dateFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dateFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.dateFilterButton,
                    selectedDateFilter === filter.id && styles.dateFilterButtonActive,
                  ]}
                  onPress={() => setSelectedDateFilter(filter.id)}
                >
                  <Text
                    style={[
                      styles.dateFilterButtonText,
                      selectedDateFilter === filter.id && styles.dateFilterButtonTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 統計情報 */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="mic" size={20} color="#7C4DFF" />
              </View>
              <Text style={styles.statNumber}>{recordings.length}</Text>
              <Text style={styles.statLabel}>総録音数</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>
                {recordings.filter(r => r.transcript).length}
              </Text>
              <Text style={styles.statLabel}>評価完了</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>
                {recordings.filter(r => !r.transcript).length}
              </Text>
              <Text style={styles.statLabel}>評価待ち</Text>
            </View>
          </View>

          {/* 録音一覧 */}
          <View style={styles.recordingsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedFilter === 'all' && 'すべての録音'}
                {selectedFilter === 'recent' && '最近の録音'}
                {selectedFilter === 'completed' && '評価完了'}
                {selectedFilter === 'pending' && '評価待ち'}
              </Text>
              <View style={styles.sectionCountContainer}>
                <Text style={styles.sectionCount}>
                  {filteredRecordings.length}件
                </Text>
              </View>
            </View>

            {filteredRecordings.length > 0 ? (
              filteredRecordings.map((recording, index) => (
                <View key={recording.id} style={styles.recordingCardContainer}>
                  {/* タイムライン */}
                  <View style={styles.timelineContainer}>
                    <View style={styles.timelineLine} />
                    <View style={styles.timelineNode} />
                    {index < filteredRecordings.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>

                  {/* カード */}
                  <TouchableOpacity
                    style={styles.recordingCard}
                    onPress={() => navigation.navigate('Results', { recordingId: recording.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.sceneInfo}>
                        <View style={styles.sceneIconContainer}>
                          <Text style={styles.sceneIcon}>
                            {getSceneIcon(recording.scenes)}
                          </Text>
                        </View>
                        <View style={styles.sceneDetails}>
                          <Text style={styles.sceneTitle}>
                            {getSceneTitle(recording.scenes)}
                          </Text>
                          <Text style={styles.recordingDate}>
                            {formatDate(recording.created_at)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.statusContainer}>
                        {(() => {
                          const status = getStatusBadge(recording);
                          return (
                            <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                              <Text style={[styles.statusText, { color: status.color }]}>
                                {status.text}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    </View>

                    {recording.transcript && (
                      <View style={styles.transcriptContainer}>
                        <Text style={styles.transcriptLabel}>文字起こし結果:</Text>
                        <Text style={styles.transcriptText} numberOfLines={2}>
                          {recording.transcript}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Results', { recordingId: recording.id })}
                      >
                        <Ionicons name="eye" size={16} color="#ffffff" />
                        <Text style={styles.primaryButtonText}>詳細を見る</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => 
                          navigation.navigate('Record', { sceneId: recording.situation_id })
                        }
                      >
                        <Ionicons name="refresh" size={16} color="#10B981" />
                        <Text style={styles.secondaryButtonText}>再録音</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="mic-off-outline" size={48} color="#64748b" />
                </View>
                <Text style={styles.emptyStateTitle}>録音がありません</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? '検索条件に該当する録音がありません。' : '選択したフィルターに該当する録音がありません。'}
                </Text>
              </View>
            )}
          </View>

          {/* ヒント */}
          <View style={styles.hintContainer}>
            <View style={styles.hintCard}>
              <View style={styles.hintIconContainer}>
                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.hintTitle}>練習の進め方</Text>
              <Text style={styles.hintText}>
                • 定期的に練習することで、接客スキルが向上します{'\n'}
                • 同じシーンを複数回練習して、改善点を見つけましょう{'\n'}
                • 評価結果を参考に、次回の練習に活かしてください
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#f8fafc',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1a1a2b',
    marginRight: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: '#7C4DFF',
    backgroundColor: '#7C4DFF20',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  filterButtonTextActive: {
    color: '#7C4DFF',
    fontWeight: '600',
  },
  dateFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1a1a2b',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateFilterButtonActive: {
    borderColor: '#7C4DFF',
    backgroundColor: '#7C4DFF20',
  },
  dateFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  dateFilterButtonTextActive: {
    color: '#7C4DFF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2b',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  recordingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
  },
  sectionCountContainer: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sectionCount: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  recordingCardContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#334155',
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C4DFF',
    borderWidth: 3,
    borderColor: '#1a1a2b',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingCard: {
    flex: 1,
    backgroundColor: '#1a1a2b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sceneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sceneIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sceneIcon: {
    fontSize: 24,
  },
  sceneDetails: {
    flex: 1,
  },
  sceneTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
    lineHeight: 22,
  },
  recordingDate: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  transcriptContainer: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#7C4DFF',
    gap: 8,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a2b',
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a2b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  hintContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  hintCard: {
    backgroundColor: '#1a1a2b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  hintIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
});
