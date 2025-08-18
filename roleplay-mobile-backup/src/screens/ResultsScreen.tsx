import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Evaluation, Recording, Scene } from '../types/database';

const { width } = Dimensions.get('window');

export default function ResultsScreen({ navigation, route }: any) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // ルートパラメータから評価IDまたは録音IDを取得
  const evaluationId = route.params?.evaluationId;
  const recordingId = route.params?.recordingId;

  useEffect(() => {
    fetchData();
  }, [evaluationId, recordingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let evaluationData: Evaluation | null = null;
      let recordingData: Recording | null = null;
      let currentRecordingId = recordingId;

      if (evaluationId) {
        // 評価IDから評価データを取得
        const { data: evalData, error: evalError } = await supabase
          .from('evaluations')
          .select('*')
          .eq('id', evaluationId)
          .single();

        if (evalError) {
          console.error('Error fetching evaluation:', evalError);
          Alert.alert('エラー', '評価データの取得に失敗しました');
          return;
        }
        evaluationData = evalData;
        currentRecordingId = evalData.recording_id;
      }

      if (currentRecordingId) {
        // 録音IDから録音データを取得
        const { data: recData, error: recError } = await supabase
          .from('recordings')
          .select('*')
          .eq('id', currentRecordingId)
          .single();

        if (recError) {
          console.error('Error fetching recording:', recError);
          Alert.alert('エラー', '録音データの取得に失敗しました');
          return;
        }
        recordingData = recData;

        // シーンデータを取得
        const sceneId = recData.situation_id || recData.scenario_id;
        if (sceneId) {
          const { data: sceneData, error: sceneError } = await supabase
            .from('scenes')
            .select('*')
            .eq('id', sceneId)
            .single();

          if (sceneError) {
            console.error('Error fetching scene:', sceneError);
          } else {
            setScene(sceneData);
          }
        }
      }

      setEvaluation(evaluationData);
      setRecording(recordingData);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('エラー', 'データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!evaluation || !recording) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#64748b" />
          <Text style={styles.errorTitle}>評価データが見つかりません</Text>
          <Text style={styles.errorText}>
            指定されたIDの評価データが存在しません。
          </Text>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.navigateButtonText}>履歴に戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreBackgroundColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#10B98120';
    if (percentage >= 60) return '#F59E0B20';
    return '#EF444420';
  };

  const tabs = [
    { id: 'overview', label: '概要', icon: 'pie-chart' },
    { id: 'details', label: '詳細', icon: 'list' },
    { id: 'transcript', label: '文字起こし', icon: 'document-text' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View style={styles.sceneInfo}>
            <Text style={styles.sceneIcon}>{scene?.icon || '🎭'}</Text>
            <View style={styles.sceneDetails}>
              <Text style={styles.sceneTitle}>{scene?.title || '不明なシーン'}</Text>
              <Text style={styles.sceneDescription} numberOfLines={2}>
                {scene?.description || ''}
              </Text>
            </View>
          </View>
          
          {/* 総合スコア */}
          <View style={styles.totalScoreContainer}>
            <Text style={styles.totalScoreLabel}>総合スコア</Text>
            <View style={styles.scoreDisplay}>
              <Text style={styles.totalScore}>{evaluation.total_score}</Text>
              <Text style={styles.totalScoreMax}>/ 100</Text>
            </View>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${evaluation.total_score}%`,
                    backgroundColor: getScoreColor(evaluation.total_score, 100),
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* タブナビゲーション */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.id ? '#7C4DFF' : '#94a3b8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab.id && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* タブコンテンツ */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* 総評 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>総評</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>
                  {evaluation.summary_comment || '評価コメントがありません'}
                </Text>
              </View>
            </View>

            {/* スコア分布 */}
            <View style={styles.scoresContainer}>
              <Text style={styles.scoresTitle}>評価項目別スコア</Text>
              
              <Text style={styles.noDataText}>
                詳細なスコアデータは現在利用できません
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            {/* 詳細なフィードバック */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>詳細フィードバック</Text>
              <Text style={styles.noDataText}>
                詳細なフィードバックデータは現在利用できません
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'transcript' && (
          <View style={styles.tabContent}>
            {/* 文字起こし結果 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>文字起こし結果</Text>
              <View style={styles.transcriptCard}>
                <Text style={styles.transcriptText}>
                  {recording.transcript || '文字起こしデータがありません'}
                </Text>
              </View>
              
              {/* 録音情報 */}
              <View style={styles.recordingInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                  <Text style={styles.infoLabel}>録音日時:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(recording.created_at).toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* アクションボタン */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Record', { sceneId: scene?.id })}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.actionButtonText}>同じシーンで再練習</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Scenes')}
          >
            <Ionicons name="list" size={20} color="#7C4DFF" />
            <Text style={[styles.actionButtonText, { color: '#7C4DFF' }]}>
              他のシーンを選択
            </Text>
          </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  navigateButton: {
    backgroundColor: '#7C4DFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  sceneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sceneIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  sceneDetails: {
    flex: 1,
  },
  sceneTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
    lineHeight: 26,
  },
  sceneDescription: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  totalScoreContainer: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  totalScoreLabel: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  totalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7C4DFF',
  },
  totalScoreMax: {
    fontSize: 20,
    color: '#94a3b8',
    marginLeft: 4,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  tabButtonActive: {
    borderColor: '#7C4DFF',
    backgroundColor: '#7C4DFF20',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  tabButtonTextActive: {
    color: '#7C4DFF',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  scoresContainer: {
    gap: 24,
  },
  scoresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  scoreSection: {
    gap: 16,
  },
  scoreSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  scoreItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f8fafc',
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreItemDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  detailsContainer: {
    gap: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  feedbackCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f8fafc',
    flex: 1,
  },
  feedbackScore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  feedbackScoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 20,
  },
  feedbackComment: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  feedbackCommentLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  feedbackCommentText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  transcriptContainer: {
    gap: 16,
  },
  transcriptTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  transcriptCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  transcriptText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  recordingInfo: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#7C4DFF',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7C4DFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
  },
});
