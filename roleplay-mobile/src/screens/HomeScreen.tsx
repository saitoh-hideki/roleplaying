import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { mockScenes, mockRecordings, mockEvaluations } from '../utils/mockData';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const recentRecordings = mockRecordings.slice(0, 3);
  const recentEvaluations = mockEvaluations.slice(0, 3);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic':
        return '#3b82f6';
      case 'advanced':
        return '#10b981';
      case 'special':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'basic':
        return '基本';
      case 'advanced':
        return '応用';
      case 'special':
        return '特別';
      default:
        return 'その他';
    }
  };

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
            <Text style={styles.statNumber}>{mockScenes.length}</Text>
            <Text style={styles.statLabel}>利用可能シーン</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="mic" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{mockRecordings.length}</Text>
            <Text style={styles.statLabel}>録音回数</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="analytics" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{mockEvaluations.length}</Text>
            <Text style={styles.statLabel}>評価完了</Text>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {mockScenes.slice(0, 3).map((scene) => (
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
                      { backgroundColor: getCategoryColor(scene.category) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: getCategoryColor(scene.category) },
                      ]}
                    >
                      {getCategoryLabel(scene.category)}
                    </Text>
                  </View>
                  <View style={styles.difficultyContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < scene.difficulty ? 'star' : 'star-outline'}
                        size={12}
                        color={i < scene.difficulty ? '#F59E0B' : '#6B7280'}
                      />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 最近の録音 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近の録音</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          {recentRecordings.map((recording) => {
            const scene = mockScenes.find(s => s.id === recording.sceneId);
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
                    {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.recordingTranscript} numberOfLines={2}>
                  {recording.transcript}
                </Text>
                <Text style={styles.recordingDate}>
                  {new Date(recording.createdAt).toLocaleDateString('ja-JP')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 最近の評価結果 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近の評価結果</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Results')}>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          {recentEvaluations.map((evaluation) => {
            const recording = mockRecordings.find(r => r.id === evaluation.recordingId);
            const scene = mockScenes.find(s => s.id === recording?.sceneId);
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
                    <Text style={styles.scoreText}>{evaluation.totalScore}</Text>
                    <Text style={styles.scoreMax}>/100</Text>
                  </View>
                </View>
                <Text style={styles.evaluationComment} numberOfLines={2}>
                  {evaluation.summaryComment}
                </Text>
                <View style={styles.evaluationMeta}>
                  <Text style={styles.evaluationDate}>
                    {new Date(recording?.createdAt || '').toLocaleDateString('ja-JP')}
                  </Text>
                  <View style={styles.evaluationBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.evaluationBadgeText}>評価完了</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
});
