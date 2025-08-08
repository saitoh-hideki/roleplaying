'use client'

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

interface RadarChartProps {
  data: {
    label: string
    score: number
    maxScore: number
  }[]
  className?: string
  variant?: 'basic' | 'scene' // 基本スキル用かシーン特有スキル用か
}

export function RadarChart({ data, className = '', variant = 'basic' }: RadarChartProps) {
  // 基本スキル用（水色系）とシーン特有スキル用（オレンジ系）で色を分ける
  const colors = variant === 'basic' 
    ? {
        backgroundColor: 'rgba(56, 189, 248, 0.2)', // sky-400 with opacity
        borderColor: 'rgba(56, 189, 248, 0.9)', // sky-400 with opacity
        pointBackgroundColor: 'rgba(56, 189, 248, 1)', // sky-400
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(56, 189, 248, 1)', // sky-400
      }
    : {
        backgroundColor: 'rgba(245, 158, 11, 0.2)', // amber-500 with opacity
        borderColor: 'rgba(245, 158, 11, 0.9)', // amber-500 with opacity
        pointBackgroundColor: 'rgba(245, 158, 11, 1)', // amber-500
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(245, 158, 11, 1)', // amber-500
      }

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: variant === 'basic' ? 'Basic Skills' : 'Scene-Specific Skills',
        data: data.map(item => (item.score / item.maxScore) * 5), // 5点満点に正規化
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        borderWidth: 3,
        pointBackgroundColor: colors.pointBackgroundColor,
        pointBorderColor: colors.pointBorderColor,
        pointHoverBackgroundColor: colors.pointHoverBackgroundColor,
        pointHoverBorderColor: colors.pointHoverBorderColor,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        min: 0,
        ticks: {
          stepSize: 1,
          color: '#94a3b8',
          font: {
            size: 12,
            weight: 500,
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
          lineWidth: 1,
        },
        angleLines: {
          color: 'rgba(148, 163, 184, 0.15)',
          lineWidth: 1,
        },
        pointLabels: {
          color: '#f8fafc',
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          padding: 8,
          callback: function(value: any, index: number) {
            // 長いラベルを短縮または折り返し
            const label = value as string;
            if (label.length > 8) {
              // 8文字を超える場合は短縮
              return label.substring(0, 8) + '...';
            }
            return label;
          }
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            return context[0].label
          },
          label: function(context: any) {
            const index = context.dataIndex
            const item = data[index]
            return `${item.score}/${item.maxScore} points`
          }
        }
      },
    },
  }

  return (
    <div className={`w-full h-full ${className}`} style={{ width: '100%', height: '100%' }}>
      <Radar data={chartData} options={options} />
    </div>
  )
} 