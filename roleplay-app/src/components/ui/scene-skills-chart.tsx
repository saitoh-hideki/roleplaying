'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { RadarChart } from './radar-chart'
import { Target } from 'lucide-react'

interface SceneSkillsChartProps {
  data: {
    label: string
    score: number
    maxScore: number
  }[]
  sceneTitle?: string
}

export function SceneSkillsChart({ data, sceneTitle }: SceneSkillsChartProps) {
  return (
    <Card className="bg-[#1E293B] border-[#334155] text-slate-50 h-full flex flex-col shadow-lg">
      <CardHeader className="pb-3 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-slate-300" />
          <div>
            <CardTitle className="text-slate-50 text-base font-semibold">Scene-Specific Skills Analysis</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Visualization of performance in scene-specific skills
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex items-center justify-center">
        {data.length > 0 ? (
          <div className="w-[75%] h-[75%] min-w-[260px] min-h-[260px] flex items-center justify-center">
            <RadarChart data={data} variant="scene" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <span className="text-3xl mb-3 block">📝</span>
              <p className="text-sm">No scene-specific evaluation data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 