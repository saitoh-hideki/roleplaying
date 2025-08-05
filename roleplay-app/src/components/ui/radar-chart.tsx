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
}

export function RadarChart({ data, className = '' }: RadarChartProps) {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: '今回の評価',
        data: data.map(item => (item.score / item.maxScore) * 5), // 5点満点に正規化
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
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