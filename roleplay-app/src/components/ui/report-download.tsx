'use client'

import { useRef } from 'react'
import { Button } from './button'
import { Download } from 'lucide-react'
import html2pdf from 'html2pdf.js'

interface ReportDownloadProps {
  data: {
    recording: {
      scenario: {
        title: string
        description: string
      }
      created_at: string
      transcript: string
    }
    evaluation: {
      total_score: number
      summary_comment: string
    }
    feedbackNotes: {
      criterion: {
        label: string
        description: string
        max_score: number
      }
      score: number
      comment: string
    }[]
  }
}

export function ReportDownload({ data }: ReportDownloadProps) {
  const reportRef = useRef<HTMLDivElement>(null)

  const downloadReport = async () => {
    if (!reportRef.current) return

    const element = reportRef.current
    const opt = {
      margin: 1,
      filename: `評価レポート_${data.recording.scenario.title}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    }

    try {
      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('PDFの生成に失敗しました。')
    }
  }

  return (
    <>
      <Button
        onClick={downloadReport}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Download className="mr-2 h-4 w-4" />
        評価レポートをダウンロード
      </Button>

      {/* 非表示のレポートテンプレート */}
      <div ref={reportRef} className="hidden">
        <div style={{ 
          padding: '20px', 
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#ffffff',
          color: '#000000'
        }}>
          {/* ヘッダー */}
          <div style={{ 
            textAlign: 'center', 
            borderBottom: '2px solid #333',
            paddingBottom: '20px',
            marginBottom: '30px'
          }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>
              接客ロールプレイ評価レポート
            </h1>
            <p style={{ fontSize: '14px', margin: '0', color: '#666' }}>
              {new Date().toLocaleDateString('ja-JP')}
            </p>
          </div>

          {/* シナリオ情報 */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0', color: '#333' }}>
              シナリオ情報
            </h2>
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '10px'
            }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
                {data.recording.scenario.title}
              </h3>
              <p style={{ fontSize: '14px', margin: '0', color: '#666' }}>
                {data.recording.scenario.description}
              </p>
            </div>
            <p style={{ fontSize: '12px', color: '#999', margin: '0' }}>
              実施日: {new Date(data.recording.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>

          {/* 総合評価 */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', color: '#333' }}>
              総合評価
            </h2>
            <div style={{ 
              textAlign: 'center',
              backgroundColor: '#f0f8ff',
              padding: '20px',
              borderRadius: '5px'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0066cc', margin: '0 0 10px 0' }}>
                {data.evaluation.total_score}点
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>/ 100点満点</div>
            </div>
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '15px', 
              borderRadius: '5px',
              marginTop: '15px'
            }}>
              <h4 style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#333' }}>総評</h4>
              <p style={{ fontSize: '14px', margin: '0', lineHeight: '1.5' }}>
                {data.evaluation.summary_comment}
              </p>
            </div>
          </div>

          {/* 項目別評価 */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', color: '#333' }}>
              項目別評価
            </h2>
            {data.feedbackNotes.map((note, index) => (
              <div key={index} style={{ 
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '15px',
                marginBottom: '10px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ fontSize: '16px', margin: '0', color: '#333' }}>
                    {note.criterion.label}
                  </h4>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    color: note.score >= note.criterion.max_score * 0.8 ? '#28a745' : 
                           note.score >= note.criterion.max_score * 0.6 ? '#ffc107' : '#dc3545'
                  }}>
                    {note.score} / {note.criterion.max_score}点
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0' }}>
                  {note.criterion.description}
                </p>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '3px'
                }}>
                  <p style={{ fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                    {note.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 文字起こし */}
          <div>
            <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', color: '#333' }}>
              録音内容（文字起こし）
            </h2>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '5px',
              maxHeight: '200px',
              overflow: 'hidden'
            }}>
              <p style={{ 
                fontSize: '12px', 
                margin: '0', 
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap'
              }}>
                {data.recording.transcript}
              </p>
            </div>
            <p style={{ fontSize: '10px', color: '#999', margin: '10px 0 0 0' }}>
              ※ 文字起こしは自動生成のため、一部不正確な場合があります。
            </p>
          </div>

          {/* フッター */}
          <div style={{ 
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid #ddd',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '10px', color: '#999', margin: '0' }}>
              このレポートは接客ロールプレイアプリにより自動生成されました。
            </p>
          </div>
        </div>
      </div>
    </>
  )
} 