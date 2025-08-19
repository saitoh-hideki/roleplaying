import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { getEvaluation } from '../utils/api';

interface ResultData {
  recording: {
    id: string
    created_at: string
    transcript: string
    situation_id?: string
    scenes: {
      title: string
      description: string
    }
  }
  evaluation: {
    id: string
    total_score: number
    summary_comment: string
  }
  feedbackNotes: {
    id: string
    score: number
    comment: string
    evaluation_criteria: {
      label: string
      description: string
      max_score: number
    }
  }[]
  philosophyFeedbackNotes?: {
    id: string
    score: number
    comment: string
    philosophy_evaluation_criteria: {
      code: 'vision' | 'mission' | 'purpose'
      label: string
      description?: string
      max_score: number
    }
  }[]
  sceneFeedbackNotes: {
    id: string
    score: number
    comment: string
    scene_evaluation_criteria: {
      criterion_name: string
      criterion_description?: string
      max_score: number
    }
  }[]
  scene?: {
    id: string
    title: string
    description: string
  }
}

export default function ResultsScreen({ navigation, route }: any) {
  const { evaluationId, recordingId } = route.params;
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (evaluationId) {
      fetchResultData();
    }
  }, [evaluationId]);

  const fetchResultData = async () => {
    try {
      console.log('Fetching result data for evaluation ID:', evaluationId);
      
      // 評価データを取得
      const evaluationData = await getEvaluation(evaluationId);
      
      if (!evaluationData) {
        throw new Error('Evaluation data not found');
      }

      // 録音データを取得
      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .select(`
          id,
          created_at,
          transcript,
          situation_id,
          scenes (title, description)
        `)
        .eq('id', recordingId)
        .single();

      if (recordingError) {
        console.error('Recording fetch error:', recordingError);
        throw recordingError;
      }

      // シーンデータを取得
      const { data: scene, error: sceneError } = await supabase
        .from('scenes')
        .select('id, title, description')
        .eq('id', recording.situation_id)
        .single();

      if (sceneError) {
        console.error('Scene fetch error:', sceneError);
        throw sceneError;
      }

      // データを整形
      const formattedData: ResultData = {
        recording: {
          ...recording,
          scenes: {
            title: (recording.scenes as any)?.title || 'シーンなし',
            description: (recording.scenes as any)?.description || ''
          }
        },
        evaluation: {
          id: evaluationData.id,
          total_score: evaluationData.total_score,
          summary_comment: evaluationData.summary_comment
        },
        feedbackNotes: evaluationData.feedback_notes?.map((fn: any) => ({
          ...fn,
          evaluation_criteria: fn.evaluation_criteria || { label: '', description: '', max_score: 0 }
        })) || [],
        sceneFeedbackNotes: evaluationData.scene_feedback_notes?.map((sFn: any) => ({
          ...sFn,
          scene_evaluation_criteria: sFn.scene_evaluation_criteria || { criterion_name: '', criterion_description: '', max_score: 0 }
        })) || [],
        philosophyFeedbackNotes: evaluationData.philosophy_feedback_notes?.map((p: any) => ({
          ...p,
          philosophy_evaluation_criteria: p.philosophy_evaluation_criteria || { code: 'vision', label: '', description: '', max_score: 5 }
        })) || [],
        scene: scene
      };

      setData(formattedData);
    } catch (error) {
      console.error('Error fetching result data:', error);
      Alert.alert(
        'エラー',
        `評価結果の取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreBackgroundColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#d1fae5';
    if (percentage >= 60) return '#fef3c7';
    return '#fee2e2';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={styles.loadingText}>評価結果を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>データが見つかりませんでした</Text>
          <Text style={styles.errorText}>
            指定された評価データが存在しません。
          </Text>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.navigateButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#7C4DFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>評価結果</Text>
            <Text style={styles.subtitle}>
              {data.recording.scenes.title} • {new Date(data.recording.created_at).toLocaleDateString('ja-JP')}
            </Text>
          </View>
        </View>

        {/* 総合スコア */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>総合スコア</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.totalScore}>{data.evaluation.total_score}</Text>
            <Text style={styles.maxScore}>/ 100点</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${data.evaluation.total_score}%` }
              ]} 
            />
          </View>
          <Text style={styles.summaryComment}>{data.evaluation.summary_comment}</Text>
        </View>

        {/* 基本評価 */}
        {data.feedbackNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本評価</Text>
            {data.feedbackNotes.map((note, index) => (
              <View key={note.id} style={styles.evaluationItem}>
                <View style={styles.evaluationHeader}>
                  <Text style={styles.criterionLabel}>{note.evaluation_criteria.label}</Text>
                  <View style={[
                    styles.scoreBadge,
                    { backgroundColor: getScoreBackgroundColor(note.score, note.evaluation_criteria.max_score) }
                  ]}>
                    <Text style={[
                      styles.scoreText,
                      { color: getScoreColor(note.score, note.evaluation_criteria.max_score) }
                    ]}>
                      {note.score} / {note.evaluation_criteria.max_score}
                    </Text>
                  </View>
                </View>
                <Text style={styles.criterionDescription}>{note.evaluation_criteria.description}</Text>
                <Text style={styles.comment}>{note.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* シーン特有評価 */}
        {data.sceneFeedbackNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {data.scene?.title || 'シーン'}特有評価
            </Text>
            {data.sceneFeedbackNotes.map((note, index) => (
              <View key={note.id} style={styles.evaluationItem}>
                <View style={styles.evaluationHeader}>
                  <Text style={styles.criterionLabel}>{note.scene_evaluation_criteria.criterion_name}</Text>
                  <View style={[
                    styles.scoreBadge,
                    { backgroundColor: getScoreBackgroundColor(note.score, note.scene_evaluation_criteria.max_score) }
                  ]}>
                    <Text style={[
                      styles.scoreText,
                      { color: getScoreColor(note.score, note.scene_evaluation_criteria.max_score) }
                    ]}>
                      {note.score} / {note.scene_evaluation_criteria.max_score}
                    </Text>
                  </View>
                </View>
                {note.scene_evaluation_criteria.criterion_description && (
                  <Text style={styles.criterionDescription}>{note.scene_evaluation_criteria.criterion_description}</Text>
                )}
                <Text style={styles.comment}>{note.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 理念評価 */}
        {data.philosophyFeedbackNotes && data.philosophyFeedbackNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>理念評価（V/M/P）</Text>
            {data.philosophyFeedbackNotes.map((note, index) => (
              <View key={note.id} style={styles.evaluationItem}>
                <View style={styles.evaluationHeader}>
                  <Text style={styles.criterionLabel}>{note.philosophy_evaluation_criteria.label}</Text>
                  <View style={[
                    styles.scoreBadge,
                    { backgroundColor: getScoreBackgroundColor(note.score, note.philosophy_evaluation_criteria.max_score) }
                  ]}>
                    <Text style={[
                      styles.scoreText,
                      { color: getScoreColor(note.score, note.philosophy_evaluation_criteria.max_score) }
                    ]}>
                      {note.score} / {note.philosophy_evaluation_criteria.max_score}
                    </Text>
                  </View>
                </View>
                {note.philosophy_evaluation_criteria.description && (
                  <Text style={styles.criterionDescription}>{note.philosophy_evaluation_criteria.description}</Text>
                )}
                <Text style={styles.comment}>{note.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 文字起こし */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.transcriptHeader}
            onPress={() => setShowTranscript(!showTranscript)}
          >
            <Text style={styles.sectionTitle}>録音内容（文字起こし）</Text>
            <Ionicons 
              name={showTranscript ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#7C4DFF" 
            />
          </TouchableOpacity>
          {showTranscript && (
            <View style={styles.transcriptContent}>
              <Text style={styles.transcriptText}>{data.recording.transcript}</Text>
            </View>
          )}
        </View>

        {/* アクションボタン */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Record')}
          >
            <Ionicons name="mic" size={20} color="white" />
            <Text style={styles.actionButtonText}>もう一度録音</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="time" size={20} color="#7C4DFF" />
            <Text style={[styles.actionButtonText, { color: '#7C4DFF' }]}>履歴を見る</Text>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: '#1e293b',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  totalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7C4DFF',
  },
  maxScore: {
    fontSize: 20,
    color: '#94a3b8',
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C4DFF',
    borderRadius: 4,
  },
  summaryComment: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  evaluationItem: {
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
  criterionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  criterionDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 20,
  },
  comment: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transcriptContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  transcriptText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    margin: 20,
    marginTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C4DFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7C4DFF',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
