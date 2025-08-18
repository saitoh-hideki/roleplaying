import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import type { Scene, Recording, Evaluation } from '../types/database';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // デバッグ情報を表示
      console.log('=== デバッグ情報 ===');
      console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      console.log('Supabase Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定');
      
      // 1. まず基本的なシーンデータを取得
      console.log('1. シーンデータを取得中...');
      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('シーンデータ結果:', { data: scenesData, error: scenesError });

      if (scenesError) {
        console.error('Error fetching scenes:', scenesError);
      } else {
        setScenes(scenesData || []);
      }

      // 2. 録音データを取得（まず基本的なデータのみ）
      console.log('2. 録音データを取得中...');
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('録音データ結果:', { data: recordingsData, error: recordingsError });

      if (recordingsError) {
        console.error('Error fetching recordings:', recordingsError);
      } else {
        setRecordings(recordingsData || []);
      }

      // 3. 評価データを取得（まず基本的なデータのみ）
      console.log('3. 評価データを取得中...');
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('評価データ結果:', { data: evaluationsData, error: evaluationsError });

      if (evaluationsError) {
        console.error('Error fetching evaluations:', evaluationsError);
      } else {
        setEvaluations(evaluationsData || []);
      }

      // 4. テーブル一覧を取得して構造を確認
      console.log('4. テーブル一覧を取得中...');
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      console.log('テーブル一覧結果:', { data: tablesData, error: tablesError });

      console.log('=== 最終結果 ===');
      console.log('シーン数:', scenesData?.length || 0);
      console.log('録音数:', recordingsData?.length || 0);
      console.log('評価数:', evaluationsData?.length || 0);
      console.log('利用可能テーブル:', tablesData?.map(t => t.table_name) || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentRecordings = recordings.slice(0, 3);
  const recentEvaluations = evaluations.slice(0, 3);

  const getCategoryColor = (sceneId: string) => {
    // シーンIDに基づいてカテゴリを判定
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>OrgShift RolePlay</Text>
          <Text style={styles.subtitle}>接客スキル向上のための練習アプリ</Text>
        </View>

        {/* クイックアクション */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Record')}
          >
            <LinearGradient
              colors={['#7C4DFF', '#9C7CFF']}
              style={styles.gradientButton}
            >
              <Ionicons name="mic" size={24} color="white" />
              <Text style={styles.quickActionText}>録音開始</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Scenes')}
          >
            <LinearGradient
              colors={['#10B981', '#34D399']}
              style={styles.gradientButton}
            >
              <Ionicons name="list" size={24} color="white" />
              <Text style={styles.quickActionText}>シーン選択</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 統計カード */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="play-circle" size={24} color="#7C4DFF" />
            <Text style={styles.statNumber}>{scenes.length}</Text>
            <Text style={styles.statLabel}>利用可能シーン</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="mic" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{recordings.length}</Text>
            <Text style={styles.statLabel}>録音回数</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="analytics" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{evaluations.length}</Text>
            <Text style={styles.statLabel}>評価完了</Text>
          </View>
        </View>

        {/* デバッグ情報表示 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>デバッグ情報</Text>
          </View>
          <View style={styles.debugCard}>
            <Text style={styles.debugText}>Supabase URL: {process.env.EXPO_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定'}</Text>
            <Text style={styles.debugText}>Supabase Key: {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}</Text>
            <Text style={styles.debugText}>シーン数: {scenes.length}</Text>
            <Text style={styles.debugText}>録音数: {recordings.length}</Text>
            <Text style={styles.debugText}>評価数: {evaluations.length}</Text>
          </View>
        </View>

        {/* 最近の練習シーン */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近の練習シーン</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Scenes')}>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          {scenes.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {scenes.slice(0, 3).map((scene) => (
                <TouchableOpacity
                  key={scene.id}
                  style={styles.sceneCard}
                  onPress={() => navigation.navigate('Record', { sceneId: scene.id })}
                >
                  <View style={styles.sceneIconContainer}>
                    <Text style={styles.sceneIcon}>{scene.icon}</Text>
                  </View>
                  <Text style={styles.sceneTitle} numberOfLines={2}>
                    {scene.title}
                  </Text>
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
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color="#64748b" />
              <Text style={styles.emptyStateText}>シーンがありません</Text>
              <Text style={styles.emptyStateSubtext}>シーンを追加して練習を始めましょう</Text>
            </View>
          )}
        </View>

        {/* 最近の録音 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近の録音</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          {recentRecordings.length > 0 ? (
            recentRecordings.map((recording) => {
              const recordingWithRelations = recording as any;
              const scene = recordingWithRelations.scenarios;
              return (
                <TouchableOpacity
                  key={recording.id}
                  style={styles.recordingCard}
                  onPress={() => navigation.navigate('Results', { recordingId: recording.id })}
                >
                  <View style={styles.recordingHeader}>
                    <Text style={styles.recordingTitle}>
                      {scene?.title || '不明なシーン'}
                    </Text>
                    <Text style={styles.recordingTime}>
                      {recordingWithRelations.duration ? `${Math.floor(recordingWithRelations.duration / 60)}:${(recordingWithRelations.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                    </Text>
                  </View>
                  <Text style={styles.recordingTranscript} numberOfLines={2}>
                    {recording.transcript || '文字起こしなし'}
                  </Text>
                  <Text style={styles.recordingDate}>
                    {new Date(recording.created_at).toLocaleDateString('ja-JP')}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="mic-outline" size={48} color="#64748b" />
              <Text style={styles.emptyStateText}>録音がありません</Text>
              <Text style={styles.emptyStateSubtext}>最初の録音を始めましょう</Text>
            </View>
          )}
        </View>

        {/* 最近の評価結果 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近の評価結果</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Results')}>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          {recentEvaluations.length > 0 ? (
            recentEvaluations.map((evaluation) => {
              const evaluationWithRelations = evaluation as any;
              const recording = recordings.find(r => r.id === evaluation.recording_id);
              const scene = evaluationWithRelations.recordings?.scenarios;
              return (
                <TouchableOpacity
                  key={evaluation.id}
                  style={styles.evaluationCard}
                  onPress={() => navigation.navigate('Results', { evaluationId: evaluation.id })}
                >
                  <View style={styles.evaluationHeader}>
                    <Text style={styles.evaluationTitle}>
                      {scene?.title || '不明なシーン'}
                    </Text>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>{evaluation.total_score}</Text>
                      <Text style={styles.scoreMax}>/100</Text>
                    </View>
                  </View>
                  <Text style={styles.evaluationComment} numberOfLines={2}>
                    {evaluation.summary_comment || 'コメントなし'}
                  </Text>
                  <View style={styles.evaluationMeta}>
                    <Text style={styles.evaluationDate}>
                      {new Date(evaluation.created_at).toLocaleDateString('ja-JP')}
                    </Text>
                    <View style={styles.evaluationBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.evaluationBadgeText}>評価完了</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color="#64748b" />
              <Text style={styles.emptyStateText}>評価結果がありません</Text>
              <Text style={styles.emptyStateSubtext}>録音を完了すると評価結果が表示されます</Text>
            </View>
          )}
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
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
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
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  seeAllText: {
    fontSize: 14,
    color: '#7C4DFF',
    fontWeight: '500',
  },
  sceneCard: {
    width: width * 0.4,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sceneIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#334155',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sceneIcon: {
    fontSize: 24,
  },
  sceneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
    lineHeight: 20,
  },
  sceneMeta: {
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  recordingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  recordingTime: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  recordingTranscript: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 12,
    lineHeight: 20,
  },
  recordingDate: {
    fontSize: 12,
    color: '#64748b',
  },
  evaluationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C4DFF',
  },
  scoreMax: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 2,
  },
  evaluationComment: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 12,
    lineHeight: 20,
  },
  evaluationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evaluationDate: {
    fontSize: 12,
    color: '#64748b',
  },
  evaluationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evaluationBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#f8fafc',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  debugCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  debugText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
});
