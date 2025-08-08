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
    <Card className="bg-slate-800 border-slate-700 text-slate-50 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <span className="text-blue-400 text-sm">📊</span>
          </div>
          <div>
            <CardTitle className="text-slate-50 text-base font-semibold">Basic Skills Analysis</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Visualization of core skill performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          <RadarChart data={data} variant="basic" />
        </div>
      </CardContent>
    </Card>
  )
} 