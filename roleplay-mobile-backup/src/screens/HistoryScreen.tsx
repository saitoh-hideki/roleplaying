import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Recording, Scene } from '../types/database';

export default function HistoryScreen({ navigation }: any) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: recordingsData, error: recordingsError } = await supabase
          .from('recordings')
          .select('*');
        if (recordingsError) {
          throw recordingsError;
        }
        setRecordings(recordingsData as Recording[]);

        const { data: scenesData, error: scenesError } = await supabase
          .from('scenes')
          .select('*');
        if (scenesError) {
          throw scenesError;
        }
        setScenes(scenesData as Scene[]);
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

  const getFilteredRecordings = () => {
    switch (selectedFilter) {
      case 'recent':
        return recordings.slice(0, 5);
      case 'completed':
        return recordings.filter(r => r.transcript);
      case 'pending':
        return recordings.filter(r => !r.transcript);
      default:
        return recordings;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSceneIcon = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    return scene?.icon || '🎭';
  };

  const getSceneTitle = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    return scene?.title || '不明なシーン';
  };

  const filteredRecordings = getFilteredRecordings();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>録音履歴</Text>
          <Text style={styles.subtitle}>
            これまでの練習記録を確認できます
          </Text>
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

        {/* 統計情報 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="mic" size={24} color="#7C4DFF" />
            <Text style={styles.statNumber}>{recordings.length}</Text>
            <Text style={styles.statLabel}>総録音数</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.statNumber}>
              {recordings.filter(r => r.transcript).length}
            </Text>
            <Text style={styles.statLabel}>評価完了</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>
              {recordings.length > 0 ? recordings.length : 0}
            </Text>
            <Text style={styles.statLabel}>総録音時間</Text>
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
            <Text style={styles.sectionCount}>
              {filteredRecordings.length}件
            </Text>
          </View>

          {filteredRecordings.length > 0 ? (
            filteredRecordings.map((recording) => (
              <TouchableOpacity
                key={recording.id}
                style={styles.recordingCard}
                onPress={() => navigation.navigate('Results', { recordingId: recording.id })}
              >
                <View style={styles.recordingHeader}>
                  <View style={styles.sceneInfo}>
                    <Text style={styles.sceneIcon}>
                      {getSceneIcon(recording.situation_id || recording.scenario_id || '')}
                    </Text>
                    <View style={styles.sceneDetails}>
                      <Text style={styles.sceneTitle}>
                        {getSceneTitle(recording.situation_id || recording.scenario_id || '')}
                      </Text>
                      <Text style={styles.recordingDate}>
                        {formatDate(recording.created_at)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingDuration}>
                      {recording.transcript ? '評価完了' : '評価待ち'}
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        // 再録音の処理
                        navigation.navigate('Record', { sceneId: recording.situation_id || recording.scenario_id || '' });
                      }}
                    >
                      <Ionicons name="refresh" size={16} color="#10B981" />
                      <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                        再録音
                      </Text>
                    </TouchableOpacity>
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

                <View style={styles.recordingFooter}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Results', { recordingId: recording.id })}
                  >
                    <Ionicons name="eye" size={16} color="#7C4DFF" />
                    <Text style={styles.actionButtonText}>詳細を見る</Text>
                  </TouchableOpacity>
                  
                  {recording.transcript && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        // 再録音の処理
                        navigation.navigate('Record', { sceneId: recording.situation_id || recording.scenario_id || '' });
                      }}
                    >
                      <Ionicons name="refresh" size={16} color="#10B981" />
                      <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                        再録音
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="mic-off-outline" size={48} color="#64748b" />
              <Text style={styles.emptyStateTitle}>録音がありません</Text>
              <Text style={styles.emptyStateText}>
                選択したフィルターに該当する録音がありません。
              </Text>
            </View>
          )}
        </View>

        {/* ヒント */}
        <View style={styles.hintContainer}>
          <View style={styles.hintCard}>
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.hintTitle}>練習の進め方</Text>
            <Text style={styles.hintText}>
              • 定期的に練習することで、接客スキルが向上します{'\n'}
              • 同じシーンを複数回練習して、改善点を見つけましょう{'\n'}
              • 評価結果を参考に、次回の練習に活かしてください
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  recordingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
  recordingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sceneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sceneIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sceneDetails: {
    flex: 1,
  },
  sceneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
    lineHeight: 20,
  },
  recordingDate: {
    fontSize: 12,
    color: '#64748b',
  },
  recordingMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transcriptContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  transcriptText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  recordingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#7C4DFF',
    fontWeight: '500',
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
  recordingInfo: {
    alignItems: 'flex-end',
    gap: 8,
  },
  recordingDuration: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    gap: 6,
  },
});
