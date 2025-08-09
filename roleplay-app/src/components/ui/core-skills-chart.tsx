'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { RadarChart } from './radar-chart'
import { BarChart3 } from 'lucide-react'

interface CoreSkillsChartProps {
  data: {
    label: string
    score: number
    maxScore: number
  }[]
}

export function CoreSkillsChart({ data }: CoreSkillsChartProps) {
  return (
    <Card className="bg-[#1E293B] border-[#334155] text-slate-50 h-full flex flex-col shadow-lg">
      <CardHeader className="pb-3 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-slate-300" />
          <div>
            <CardTitle className="text-slate-50 text-base font-semibold">Basic Skills Analysis</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Visualization of core skill performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex items-center justify-center">
        <div className="w-[75%] h-[75%] min-w-[260px] min-h-[260px] flex items-center justify-center">
          <RadarChart data={data} variant="basic" />
        </div>
      </CardContent>
    </Card>
  )
} 