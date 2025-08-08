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
    <Card className="bg-slate-800 border-slate-700 text-slate-50 h-full">
      <CardHeader className="pb-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <span className="text-orange-400 text-lg">🎯</span>
          </div>
          <div>
            <CardTitle className="text-slate-50 text-lg">Scene-Specific Skills Analysis</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Visualization of performance in scene-specific skills
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 h-[calc(100%-120px)] flex items-center justify-center">
        {data.length > 0 ? (
          <div className="w-full h-full">
            <RadarChart data={data} variant="scene" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <span className="text-4xl mb-4 block">📝</span>
              <p>No scene-specific evaluation data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 