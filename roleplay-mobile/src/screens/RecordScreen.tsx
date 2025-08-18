import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Scene } from '../types/database';
import { mockScenes } from '../utils/mockData';
import {
  callWhisperAPI,
  callSceneEvaluationAPI,
  callPhilosophyEvaluationAPI,
  saveRecording,
  updateRecordingTranscript,
} from '../utils/api';

const { width } = Dimensions.get('window');

export default function RecordScreen({ navigation, route }: any) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const animationValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 音声録音の権限を確認
    checkAudioPermission();
    
    // ルートパラメータからシーンIDを取得
    if (route.params?.sceneId) {
      fetchScene(route.params.sceneId);
    }
  }, [route.params]);

  useEffect(() => {
    if (isRecording) {
      // 録音中のアニメーション
      Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // タイマー開始
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      // アニメーション停止
      animationValue.stopAnimation();
      // タイマー停止
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const fetchScene = async (sceneId: string) => {
    try {
      // Supabaseからシーンデータを取得
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('id', sceneId)
        .single();

      if (error) {
        console.error('Error fetching scene:', error);
        // エラーの場合はモックデータを使用
        const mockScene = mockScenes.find(s => s.id === sceneId);
        if (mockScene) {
          setSelectedScene(mockScene);
        }
        return;
      }

      setSelectedScene(data);
    } catch (error) {
      console.error('Error in fetchScene:', error);
      // エラーの場合はモックデータを使用
      const mockScene = mockScenes.find(s => s.id === sceneId);
      if (mockScene) {
        setSelectedScene(mockScene);
      }
    }
  };

  const checkAudioPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          '音声録音の権限が必要です',
          'このアプリを使用するには、マイクへのアクセス権限が必要です。設定から権限を許可してください。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '設定を開く', onPress: () => {} },
          ]
        );
      }
    } catch (error) {
      console.error('権限確認エラー:', error);
      setAudioPermission(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!audioPermission) {
        await checkAudioPermission();
        return;
      }

      // 録音設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0);
      
      console.log('録音開始');
    } catch (error) {
      console.error('録音開始エラー:', error);
      Alert.alert('エラー', '録音を開始できませんでした。');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      console.log('録音停止:', uri);
      
      // 録音完了後の処理
      handleRecordingComplete(uri);
      
      setRecording(null);
    } catch (error) {
      console.error('録音停止エラー:', error);
      Alert.alert('エラー', '録音を停止できませんでした。');
    }
  };

  const handleRecordingComplete = async (uri: string | null) => {
    if (!uri || !selectedScene) return;

    Alert.alert(
      '録音完了',
      '録音が完了しました。評価を開始しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
          onPress: () => {
            // 録音を破棄
            setRecording(null);
            setRecordingTime(0);
          },
        },
        {
          text: '評価開始',
          onPress: () => processRecording(uri),
        },
      ]
    );
  };

  const processRecording = async (audioUri: string) => {
    if (!selectedScene) return;

    setIsProcessing(true);
    
    try {
      // 1. 録音データをSupabaseに保存
      console.log('Saving recording to Supabase...');
      const recordingId = await saveRecording(selectedScene.id, audioUri);
      console.log('Recording saved with ID:', recordingId);

      // 2. Whisper APIで文字起こし
      console.log('Starting transcription with Whisper...');
      const transcript = await callWhisperAPI(audioUri);
      console.log('Transcription completed:', transcript);

      // 3. 録音データに文字起こし結果を更新
      console.log('Updating recording with transcript...');
      await updateRecordingTranscript(recordingId, transcript);

      // 4. シーン評価APIを呼び出し
      console.log('Starting scene evaluation...');
      const evaluationResult = await callSceneEvaluationAPI(
        selectedScene.id,
        recordingId,
        transcript
      );
      console.log('Scene evaluation completed:', evaluationResult);

      // 5. 理念評価APIを非同期で呼び出し（失敗しても本フローは継続）
      try {
        callPhilosophyEvaluationAPI(
          evaluationResult.evaluationId,
          transcript,
          selectedScene.id
        );
      } catch (error) {
        console.warn('Philosophy evaluation failed, but continuing:', error);
      }

      // 6. 結果画面に遷移
      navigation.navigate('Results', {
        evaluationId: evaluationResult.evaluationId,
        recordingId: recordingId,
      });

    } catch (error) {
      console.error('Error processing recording:', error);
      Alert.alert(
        'エラー',
        `録音の処理中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedScene) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#64748b" />
          <Text style={styles.errorTitle}>シーンが選択されていません</Text>
          <Text style={styles.errorText}>
            シーン選択画面から練習したいシーンを選択してください。
          </Text>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => navigation.navigate('Scenes')}
          >
            <Text style={styles.navigateButtonText}>シーン選択へ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* シーン情報 */}
        <View style={styles.sceneInfo}>
          <View style={styles.sceneHeader}>
            <View style={styles.sceneIconContainer}>
              <Text style={styles.sceneIcon}>{selectedScene.icon || '🎭'}</Text>
            </View>
            <View style={styles.sceneDetails}>
              <Text style={styles.sceneTitle}>{selectedScene.title}</Text>
              <Text style={styles.sceneDescription} numberOfLines={2}>
                {selectedScene.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.sceneMeta}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: '#3b82f620' },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: '#3b82f6' },
                ]}
              >
                練習
              </Text>
            </View>
          </View>
        </View>

        {/* 録音コントロール */}
        <View style={styles.recordingControl}>
          {/* 録音タイマー */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            <Text style={styles.timerLabel}>録音時間</Text>
          </View>

          {/* 録音ボタン */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonRecording,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={!audioPermission || isProcessing}
          >
            <Animated.View
              style={[
                styles.recordButtonInner,
                {
                  transform: [
                    {
                      scale: animationValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={32}
                color="white"
              />
            </Animated.View>
          </TouchableOpacity>

          {/* 録音ステータス */}
          <View style={styles.recordingStatus}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isRecording ? '#ef4444' : '#6b7280' },
              ]}
            />
            <Text style={styles.statusText}>
              {isProcessing ? '処理中...' : isRecording ? '録音中...' : '録音待機中'}
            </Text>
          </View>
        </View>

        {/* 処理中の表示 */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <Ionicons name="sync" size={24} color="#7C4DFF" />
            <Text style={styles.processingText}>
              録音を処理中です...{'\n'}
              文字起こしと評価を行っています
            </Text>
          </View>
        )}

        {/* 録音のヒント */}
        <View style={styles.hintContainer}>
          <View style={styles.hintCard}>
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.hintTitle}>録音のコツ</Text>
            <Text style={styles.hintText}>
              • 静かな環境で録音してください{'\n'}
              • マイクから適切な距離（15-20cm）を保ってください{'\n'}
              • 自然な声のトーンで話してください{'\n'}
              • 録音中は画面をタッチしないでください
            </Text>
          </View>
        </View>

        {/* 録音履歴へのリンク */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => navigation.navigate('History')}
        >
          <Ionicons name="time-outline" size={20} color="#7C4DFF" />
          <Text style={styles.historyLinkText}>録音履歴を見る</Text>
          <Ionicons name="chevron-forward" size={20} color="#7C4DFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 20,
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
  sceneInfo: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sceneHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sceneIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#334155',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sceneIcon: {
    fontSize: 32,
  },
  sceneDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  sceneTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
    lineHeight: 26,
  },
  sceneDescription: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  sceneMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordingControl: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7C4DFF',
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7C4DFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonRecording: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  processingContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  hintContainer: {
    marginBottom: 24,
  },
  hintCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 12,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  historyLinkText: {
    fontSize: 16,
    color: '#7C4DFF',
    fontWeight: '500',
  },
});
