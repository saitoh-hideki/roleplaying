'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { RadarChart } from './radar-chart'

interface CoreSkillsChartProps {
  data: {
    label: string
    score: number
    maxScore: number
  }[]
}

export function CoreSkillsChart({ data }: CoreSkillsChartProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 text-slate-50 h-full">
      <CardHeader className="pb-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <span className="text-blue-400 text-lg">📊</span>
          </div>
          <div>
            <CardTitle className="text-slate-50 text-lg">Basic Skills Analysis</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Visualization of core skill performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 h-[calc(100%-120px)] flex items-center justify-center">
        <div className="w-full h-full">
          <RadarChart data={data} variant="basic" />
        </div>
      </CardContent>
    </Card>
  )
} 