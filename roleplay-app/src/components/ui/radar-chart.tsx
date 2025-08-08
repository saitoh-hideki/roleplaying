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
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
        pointBackgroundColor: 'rgba(59, 130, 246, 1)', // blue-500
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)', // blue-500
      }
    : {
        backgroundColor: 'rgba(249, 115, 22, 0.2)', // orange-500 with opacity
        borderColor: 'rgba(249, 115, 22, 1)', // orange-500
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
          },
        },
        grid: {
          color: '#334155',
        },
        pointLabels: {
          color: '#e2e8f0',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex
            const item = data[index]
            return `${item.label}: ${item.score}/${item.maxScore}点`
          }
        }
      },
    },
  }

  return (
    <div className={`w-full h-80 ${className}`}>
      <Radar data={chartData} options={options} />
    </div>
  )
} 