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
  // 基本スキル用（ブルー系）とシーン特有スキル用（オレンジ系）で色を分ける
  const colors = variant === 'basic' 
    ? {
        backgroundColor: 'rgba(59, 130, 246, 0.15)', // blue-500 with lower opacity
        borderColor: 'rgba(59, 130, 246, 0.8)', // blue-500 with opacity
        pointBackgroundColor: 'rgba(59, 130, 246, 1)', // blue-500
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)', // blue-500
      }
    : {
        backgroundColor: 'rgba(249, 115, 22, 0.15)', // orange-500 with lower opacity
        borderColor: 'rgba(249, 115, 22, 0.8)', // orange-500 with opacity
        pointBackgroundColor: 'rgba(249, 115, 22, 1)', // orange-500
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(249, 115, 22, 1)', // orange-500
      }

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: variant === 'basic' ? 'Basic Skills' : 'Scene-Specific Skills',
        data: data.map(item => (item.score / item.maxScore) * 5), // 5点満点に正規化
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        borderWidth: 2,
        pointBackgroundColor: colors.pointBackgroundColor,
        pointBorderColor: colors.pointBorderColor,
        pointHoverBackgroundColor: colors.pointHoverBackgroundColor,
        pointHoverBorderColor: colors.pointHoverBorderColor,
        pointRadius: 4,
        pointHoverRadius: 6,
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
            size: 10,
            weight: 500,
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          lineWidth: 1,
        },
        angleLines: {
          color: 'rgba(148, 163, 184, 0.1)',
          lineWidth: 1,
        },
        pointLabels: {
          color: '#e2e8f0',
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          padding: 8,
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
    <div className={`w-56 h-56 ${className}`} style={{ width: '220px', height: '220px' }}>
      <Radar data={chartData} options={options} />
    </div>
  )
} 