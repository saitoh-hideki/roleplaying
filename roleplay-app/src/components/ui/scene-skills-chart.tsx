'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { RadarChart } from './radar-chart'

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
    <Card className="bg-slate-800 border-slate-700 text-slate-50 h-full flex flex-col shadow-lg">
      <CardHeader className="pb-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <span className="text-amber-400 text-sm">🎯</span>
          </div>
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
          <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '300px', minWidth: '100%' }}>
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