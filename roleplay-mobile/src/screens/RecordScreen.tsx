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
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Scene } from '../types/database';
import {
  callWhisperAPI,
  callSceneEvaluationAPI,
  callPhilosophyEvaluationAPI,
  updateRecordingTranscript,
  processAudioRecording,
} from '../utils/api';

const { width } = Dimensions.get('window');

export default function RecordScreen({ navigation, route }: any) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<string>('');
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string>('');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  const animationValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        Alert.alert('エラー', 'シーンデータの取得に失敗しました');
        return;
      }

      setSelectedScene(data);
    } catch (error) {
      console.error('Error in fetchScene:', error);
      Alert.alert('エラー', 'シーンデータの取得中にエラーが発生しました');
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
      console.log('=== 録音開始処理 ===');
      
      if (!audioPermission) {
        console.log('音声権限がありません。権限を確認します。');
        await checkAudioPermission();
        return;
      }

      console.log('音声録音の設定を開始...');
      
      // 録音設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('録音オブジェクトを作成中...');
      
      // Expoのプリセットを使用してクロスプラットフォームで安定動作させる
      const recordingOptions: Audio.RecordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;
      console.log('録音設定: HIGH_QUALITY プリセットを使用');
      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);

      console.log('録音オブジェクト作成完了:', newRecording);

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0);
      
      // 状態初期化
      setTranscript('');
      setShowTranscript(false);
      
      console.log('録音開始完了');
    } catch (error) {
      console.error('=== 録音開始エラー ===');
      console.error('録音開始エラー:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        errorMessage = errorObj.message || errorObj.error || JSON.stringify(error);
      }
      
      Alert.alert(
        '録音開始エラー',
        `録音を開始できませんでした:\n\n${errorMessage}`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: '詳細を見る', 
            onPress: () => {
              console.log('Full error details:', error);
              Alert.alert('詳細エラー', JSON.stringify(error, null, 2));
            }
          }
        ]
      );
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

    console.log('=== 録音完了処理 ===');
    console.log('Recording completed:', uri);
    console.log('Selected Scene:', selectedScene);
    
    // 録音URIを保存（後で評価開始時に使用）
    setRecordingUri(uri);
    console.log('録音URIを状態に保存:', uri);
    
    // アラートダイアログは表示せず、直接録音完了オプションカードを表示
    console.log('録音完了オプションカードを表示');
  };

  const processRecording = async (audioUri: string) => {
    if (!selectedScene) return;

    console.log('=== 録音処理開始 ===');
    console.log('Selected Scene:', selectedScene);
    console.log('Audio URI:', audioUri);
    
    setIsProcessing(true);
    
    try {
      // 1. 音声ファイルをSupabase Storageにアップロードし、録音データを保存
      console.log('1. 音声ファイルアップロード開始...');
      const { recordingId, audioUrl } = await processAudioRecording(selectedScene.id, audioUri);
      console.log('1. 音声ファイルアップロード完了:', { recordingId, audioUrl });
      
      // 録音IDを保存
      setCurrentRecordingId(recordingId);

      // 2. Whisper APIで文字起こし
      console.log('2. Whisper API呼び出し開始...');
      const transcriptResult = await callWhisperAPI(audioUrl);
      console.log('2. Whisper API呼び出し完了:', transcriptResult);
      
      // 文字起こし結果を保存して表示
      setTranscript(transcriptResult);
      setShowTranscript(true);
      console.log('文字起こし結果を状態に保存:', transcriptResult);

      // 3. 録音データに文字起こし結果を更新
      console.log('3. 録音データ更新開始...');
      await updateRecordingTranscript(recordingId, transcriptResult);
      console.log('3. 録音データ更新完了');

      // 4. シーン評価APIを呼び出し
      console.log('4. シーン評価API呼び出し開始...');
      const evaluationResult = await callSceneEvaluationAPI(
        selectedScene.id,
        recordingId,
        transcriptResult
      );
      console.log('4. シーン評価API呼び出し完了:', evaluationResult);
      
      // 評価IDを保存
      setCurrentEvaluationId(evaluationResult.evaluationId);

      // 5. 理念評価APIを非同期で呼び出し（失敗しても本フローは継続）
      try {
        console.log('5. 理念評価API呼び出し開始...');
        callPhilosophyEvaluationAPI(
          evaluationResult.evaluationId,
          transcriptResult,
          selectedScene.id
        );
        console.log('5. 理念評価API呼び出し完了（非同期）');
      } catch (error) {
        console.warn('理念評価API呼び出し失敗（本フローは継続）:', error);
      }

      console.log('=== 録音処理完了 ===');
      console.log('最終結果:', {
        recordingId,
        evaluationId: evaluationResult.evaluationId,
        transcript: transcriptResult,
        showTranscript: true
      });

      // 6. 結果画面への遷移は削除し、文字起こし結果を表示するだけにする
      // ユーザーが「評価結果を見る」ボタンを押した時に遷移する
      console.log('文字起こし完了。ユーザーの選択を待機中...');

    } catch (error) {
      console.error('=== 録音処理エラー ===');
      console.error('Error processing recording:', error);
      
      // より詳細なエラー情報を表示
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        errorMessage = errorObj.message || errorObj.error || JSON.stringify(error);
      }
      
      Alert.alert(
        'エラー',
        `録音の処理中にエラーが発生しました:\n\n${errorMessage}`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: '詳細を見る', 
            onPress: () => {
              console.log('Full error details:', error);
              Alert.alert('詳細エラー', JSON.stringify(error, null, 2));
            }
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // （リアルタイム文字起こしは無効化）

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
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
      >
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

          {/* 録音ボタンまたは評価開始ボタン */}
          {!recordingUri ? (
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
          ) : (
            <TouchableOpacity
              style={[styles.recordButton, styles.evaluateButton]}
              onPress={() => processRecording(recordingUri)}
              disabled={isProcessing}
            >
              <View style={styles.recordButtonInner}>
                <Ionicons
                  name="play"
                  size={32}
                  color="white"
                />
              </View>
            </TouchableOpacity>
          )}

          {/* 録音ステータス */}
          <View style={styles.recordingStatus}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isRecording ? '#ef4444' : recordingUri ? '#10B981' : '#6b7280' },
              ]}
            />
            <Text style={styles.statusText}>
              {isProcessing ? '処理中...' : isRecording ? '録音中...' : recordingUri ? '評価待ち' : '録音待機中'}
            </Text>
          </View>
        </View>

        {/* リアルタイム文字起こし（無効化） */}

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

        {/* 録音完了後のオプション */}
        {recordingUri && !isProcessing && !showTranscript && (
          <View style={styles.recordingOptionsContainer}>
            <View style={styles.recordingOptionsCard}>
              <Text style={styles.recordingOptionsTitle}>録音完了</Text>
              <Text style={styles.recordingOptionsText}>
                録音が完了しました。評価を開始するか、録音をやり直すかを選択してください。
              </Text>
              <View style={styles.recordingOptionsActions}>
                <TouchableOpacity
                  style={[styles.recordingOptionButton, styles.recordingOptionButtonSecondary]}
                  onPress={() => {
                    // 録音をやり直す
                    setRecording(null);
                    setRecordingTime(0);
                    setTranscript('');
                    setShowTranscript(false);
                    setRecordingUri(null);
                    setCurrentRecordingId('');
                    setCurrentEvaluationId('');
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#6B7280" />
                  <Text style={styles.recordingOptionButtonTextSecondary}>やり直す</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recordingOptionButton, styles.recordingOptionButtonPrimary]}
                  onPress={() => processRecording(recordingUri)}
                >
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.recordingOptionButtonTextPrimary}>評価開始</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 文字起こし結果の表示 */}
        {showTranscript && transcript && (
          <View style={styles.transcriptContainer}>
            <View style={styles.transcriptHeader}>
              <Ionicons name="chatbubble-outline" size={24} color="#10B981" />
              <Text style={styles.transcriptTitle}>文字起こし結果</Text>
            </View>
            <View style={styles.transcriptContent}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
            <View style={styles.transcriptActions}>
              <TouchableOpacity
                style={styles.transcriptActionButton}
                onPress={() => setShowTranscript(false)}
              >
                <Text style={styles.transcriptActionText}>非表示</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.transcriptActionButton, styles.transcriptActionButtonPrimary]}
                onPress={() => {
                  // 結果画面に遷移
                  navigation.navigate('Results', {
                    evaluationId: currentEvaluationId, // 評価IDを使用
                    recordingId: currentRecordingId, // 録音IDを使用
                  });
                }}
              >
                <Text style={[styles.transcriptActionText, styles.transcriptActionTextPrimary]}>
                  評価結果を見る
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* 録音完了後の説明 */}
            <View style={styles.transcriptInfo}>
              <Text style={styles.transcriptInfoText}>
                文字起こしが完了しました。上記の結果を確認してから「評価結果を見る」ボタンを押してください。
              </Text>
            </View>
          </View>
        )}

        {/* 録音履歴へのリンク */}
        <TouchableOpacity
          style={[
            styles.historyLink,
            transcript && styles.historyLinkWithTranscript
          ]}
          onPress={() => {
            // 録音履歴ページではなく、現在の文字起こし結果を表示
            if (transcript && !showTranscript) {
              setShowTranscript(true);
            } else if (showTranscript) {
              setShowTranscript(false);
            } else {
              // 文字起こし結果がない場合は履歴ページに遷移
              navigation.navigate('History');
            }
          }}
        >
          <Ionicons 
            name={transcript ? "chatbubble-outline" : "time-outline"} 
            size={20} 
            color={transcript ? "#10B981" : "#7C4DFF"} 
          />
          <Text style={[
            styles.historyLinkText,
            transcript && styles.historyLinkTextWithTranscript
          ]}>
            {transcript && !showTranscript ? '文字起こし結果を見る' : 
             showTranscript ? '文字起こし結果を隠す' : '録音履歴を見る'}
          </Text>
          <Ionicons 
            name={transcript && !showTranscript ? "chevron-down" : 
                  showTranscript ? "chevron-up" : "chevron-forward"} 
            size={20} 
            color={transcript ? "#10B981" : "#7C4DFF"} 
          />
        </TouchableOpacity>
        
        {/* デバッグ情報表示ボタン */}
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => {
            console.log('=== 現在の状態 ===');
            console.log('recordingUri:', recordingUri);
            console.log('transcript:', transcript);
            console.log('showTranscript:', showTranscript);
            console.log('currentRecordingId:', currentRecordingId);
            console.log('currentEvaluationId:', currentEvaluationId);
            console.log('selectedScene:', selectedScene);
            
            Alert.alert(
              'デバッグ情報',
              `録音URI: ${recordingUri || 'なし'}\n` +
              `文字起こし: ${transcript || 'なし'}\n` +
              `表示中: ${showTranscript ? 'はい' : 'いいえ'}\n` +
              `録音ID: ${currentRecordingId || 'なし'}\n` +
              `評価ID: ${currentEvaluationId || 'なし'}`
            );
          }}
        >
          <Ionicons name="bug-outline" size={20} color="#6B7280" />
          <Text style={styles.debugButtonText}>デバッグ情報</Text>
        </TouchableOpacity>
        
        {/* スクロール用の下部余白 */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flexGrow: 1, // ScrollView内のコンテンツがスクロール可能になるように
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
  evaluateButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
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

  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 16,
  },
  historyLinkWithTranscript: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  historyLinkText: {
    color: '#7C4DFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  historyLinkTextWithTranscript: {
    color: 'white',
  },
  transcriptContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginLeft: 8,
  },
  transcriptContent: {
    backgroundColor: '#263238',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  transcriptText: {
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 24,
    textAlign: 'left',
  },
  transcriptActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  transcriptActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C4DFF',
    alignItems: 'center',
  },
  transcriptActionButtonPrimary: {
    backgroundColor: '#7C4DFF',
    borderColor: '#7C4DFF',
  },
  transcriptActionText: {
    fontSize: 14,
    color: '#7C4DFF',
    fontWeight: '600',
  },
  transcriptActionTextPrimary: {
    color: 'white',
  },
  recordingOptionsContainer: {
    marginTop: 20,
  },
  recordingOptionsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordingOptionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  recordingOptionsText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 20,
  },
  recordingOptionsActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  recordingOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  recordingOptionButtonPrimary: {
    backgroundColor: '#7C4DFF',
    borderColor: '#7C4DFF',
  },
  recordingOptionButtonSecondary: {
    borderColor: '#6B7280',
  },
  recordingOptionButtonTextPrimary: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingOptionButtonTextSecondary: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100, // スクロール可能なコンテンツの下に配置
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 16,
    marginBottom: 20,
  },
  debugButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  transcriptInfo: {
    backgroundColor: '#263238',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  transcriptInfoText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
  },
});
