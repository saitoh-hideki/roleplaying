'use client'

import { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  isRecording: boolean
  className?: string
}

export function WaveformVisualizer({ isRecording, className }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawWaveform = () => {
      if (!isRecording) {
        // 録音停止時は静的な波形を表示
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#6366f1'
        ctx.lineWidth = 2
        ctx.beginPath()
        
        for (let x = 0; x < canvas.width; x += 2) {
          const y = canvas.height / 2 + Math.sin(x * 0.02) * 20
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
        return
      }

      // 録音中のアニメーション波形
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 2
      ctx.beginPath()

      const time = Date.now() * 0.001
      
      for (let x = 0; x < canvas.width; x += 2) {
        const amplitude = Math.sin(x * 0.02 + time * 2) * 30 + 
                         Math.sin(x * 0.05 + time * 1.5) * 15 +
                         Math.sin(x * 0.1 + time * 3) * 8
        const y = canvas.height / 2 + amplitude
        
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.stroke()
      animationRef.current = requestAnimationFrame(drawWaveform)
    }

    if (isRecording) {
      drawWaveform()
    } else {
      drawWaveform()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording])

  return (
    <div className={`w-full ${className || ''}`}>
      <canvas
        ref={canvasRef}
        width={300}
        height={80}
        className="w-full h-20 rounded-lg bg-slate-700 border border-slate-600"
      />
    </div>
  )
} 