import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockEvaluations, mockRecordings, mockScenes } from '../utils/mockData';

const { width } = Dimensions.get('window');

export default function ResultsScreen({ navigation, route }: any) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'transcript'>('overview');
  
  // ルートパラメータから評価IDまたは録音IDを取得
  const evaluationId = route.params?.evaluationId;
  const recordingId = route.params?.recordingId;
  
  // 評価データを取得
  const evaluation = evaluationId 
    ? mockEvaluations.find(e => e.id === evaluationId)
    : mockEvaluations[0]; // デフォルトで最初の評価を使用
  
  const recording = recordingId
    ? mockRecordings.find(r => r.id === recordingId)
    : mockRecordings.find(r => r.id === evaluation?.recordingId);
  
  const scene = recording 
    ? mockScenes.find(s => s.id === recording.sceneId)
    : null;

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
              <Text style={styles.totalScore}>{evaluation.totalScore}</Text>
              <Text style={styles.totalScoreMax}>/ 100</Text>
            </View>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${evaluation.totalScore}%`,
                    backgroundColor: getScoreColor(evaluation.totalScore, 100),
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
                selectedTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab.id as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={selectedTab === tab.id ? '#7C4DFF' : '#94a3b8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  selectedTab === tab.id && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* タブコンテンツ */}
        {selectedTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* 総評 */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>総評</Text>
              <Text style={styles.summaryText}>{evaluation.summaryComment}</Text>
            </View>

            {/* スコア分布 */}
            <View style={styles.scoresContainer}>
              <Text style={styles.scoresTitle}>評価項目別スコア</Text>
              
              {/* 基本評価 */}
              <View style={styles.scoreSection}>
                <Text style={styles.scoreSectionTitle}>基本評価</Text>
                {evaluation.criteriaScores.map((criteria, index) => (
                  <View key={criteria.id} style={styles.scoreItem}>
                    <View style={styles.scoreItemHeader}>
                      <Text style={styles.scoreItemLabel}>{criteria.label}</Text>
                      <View
                        style={[
                          styles.scoreBadge,
                          {
                            backgroundColor: getScoreBackgroundColor(criteria.score, criteria.maxScore),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreBadgeText,
                            { color: getScoreColor(criteria.score, criteria.maxScore) },
                          ]}
                        >
                          {criteria.score} / {criteria.maxScore}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.scoreItemDescription}>{criteria.description}</Text>
                  </View>
                ))}
              </View>

              {/* シーン特有評価 */}
              {evaluation.sceneScores.length > 0 && (
                <View style={styles.scoreSection}>
                  <Text style={styles.scoreSectionTitle}>シーン特有評価</Text>
                  {evaluation.sceneScores.map((sceneScore) => (
                    <View key={sceneScore.id} style={styles.scoreItem}>
                      <View style={styles.scoreItemHeader}>
                        <Text style={styles.scoreItemLabel}>{sceneScore.criterionName}</Text>
                        <View
                          style={[
                            styles.scoreBadge,
                            {
                              backgroundColor: getScoreBackgroundColor(sceneScore.score, sceneScore.maxScore),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.scoreBadgeText,
                              { color: getScoreColor(sceneScore.score, sceneScore.maxScore) },
                            ]}
                          >
                            {sceneScore.score} / {sceneScore.maxScore}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.scoreItemDescription}>{sceneScore.description}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 理念評価 */}
              {evaluation.philosophyScores.length > 0 && (
                <View style={styles.scoreSection}>
                  <Text style={styles.scoreSectionTitle}>理念評価</Text>
                  {evaluation.philosophyScores.map((philosophyScore) => (
                    <View key={philosophyScore.id} style={styles.scoreItem}>
                      <View style={styles.scoreItemHeader}>
                        <Text style={styles.scoreItemLabel}>{philosophyScore.label}</Text>
                        <View
                          style={[
                            styles.scoreBadge,
                            {
                              backgroundColor: getScoreBackgroundColor(philosophyScore.score, philosophyScore.maxScore),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.scoreBadgeText,
                              { color: getScoreColor(philosophyScore.score, philosophyScore.maxScore) },
                            ]}
                          >
                            {philosophyScore.score} / {philosophyScore.maxScore}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {selectedTab === 'details' && (
          <View style={styles.tabContent}>
            {/* 詳細なフィードバック */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>詳細フィードバック</Text>
              
              {evaluation.criteriaScores.map((criteria) => (
                <View key={criteria.id} style={styles.feedbackCard}>
                  <View style={styles.feedbackHeader}>
                    <Text style={styles.feedbackLabel}>{criteria.label}</Text>
                    <View
                      style={[
                        styles.feedbackScore,
                        {
                          backgroundColor: getScoreBackgroundColor(criteria.score, criteria.maxScore),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.feedbackScoreText,
                          { color: getScoreColor(criteria.score, criteria.maxScore) },
                        ]}
                      >
                        {criteria.score} / {criteria.maxScore}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.feedbackDescription}>{criteria.description}</Text>
                  <View style={styles.feedbackComment}>
                    <Text style={styles.feedbackCommentLabel}>コメント:</Text>
                    <Text style={styles.feedbackCommentText}>{criteria.comment}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'transcript' && (
          <View style={styles.tabContent}>
            {/* 文字起こし結果 */}
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptTitle}>録音内容（文字起こし）</Text>
              <View style={styles.transcriptCard}>
                <Text style={styles.transcriptText}>{recording.transcript}</Text>
              </View>
              
              {/* 録音情報 */}
              <View style={styles.recordingInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color="#94a3b8" />
                  <Text style={styles.infoLabel}>録音時間:</Text>
                  <Text style={styles.infoValue}>
                    {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                  <Text style={styles.infoLabel}>録音日時:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(recording.createdAt).toLocaleDateString('ja-JP')}
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
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
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
});
