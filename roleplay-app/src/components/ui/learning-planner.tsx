'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { format, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { Trash2, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { ReflectionNote, PracticePlan, Scenario } from '@/types/database'

interface PracticePlanWithScene extends PracticePlan {
  scene_title: string
}

export function LearningPlanner() {
  const [notes, setNotes] = useState<ReflectionNote[]>([])
  const [plans, setPlans] = useState<PracticePlanWithScene[]>([])
  const [scenarios, setScenarios] = useState<Pick<Scenario, 'id' | 'title'>[]>([])
  const [newNote, setNewNote] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedScene, setSelectedScene] = useState('')
  const [planNote, setPlanNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const scenarioTriggerRef = useRef<HTMLButtonElement | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Notes
      const { data: notesData, error: notesError } = await supabase
        .from('reflection_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('Notes table error:', notesError)
      }

      // Plans
      const { data: plansData, error: plansError } = await supabase
        .from('practice_plans')
        .select(`
          id,
          date,
          scene_id,
          note,
          scenes (title)
        `)
        .order('date', { ascending: true })

      if (plansError) {
        console.error('Practice plans table error:', plansError)
      }

      // Scenarios
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenes')
        .select('id, title')
        .order('title')

      if (scenariosError) {
        console.error('Scenes table error:', scenariosError)
      }

      setNotes(notesData || [])
      setPlans(
        plansData?.map((p) => ({
          id: p.id,
          user_id: '00000000-0000-0000-0000-000000000000',
          date: p.date,
          scene_id: p.scene_id,
          scene_title: (p.scenes as any)?.title || 'Unknown Scene',
          note: p.note || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) || []
      )
      setScenarios(scenariosData || [])
    } catch (error) {
      console.error('Error fetching learning planner data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Autosave for new note (debounced)
  useEffect(() => {
    if (!newNote.trim()) return
    setSavingNote(true)
    const id = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('reflection_notes')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            content: newNote.trim(),
          })
        if (error) throw error
        setNewNote('')
        await fetchData()
      } catch (e) {
        console.error('Autosave note failed:', e)
      } finally {
        setSavingNote(false)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [newNote])

  const savePlan = async () => {
    if (!selectedScene || !selectedDate) return
    try {
      const { error } = await supabase
        .from('practice_plans')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          date: format(selectedDate, 'yyyy-MM-dd'),
          scene_id: selectedScene,
          note: planNote.trim(),
        })
      if (error) throw error
      setSelectedScene('')
      setPlanNote('')
      await fetchData()
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('学習計画の保存に失敗しました。')
    }
  }

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reflection_notes')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('practice_plans')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting plan:', error)
    }
  }

  const getPlansForDate = (date: Date) => {
    return plans.filter((plan) => isSameDay(new Date(plan.date), date))
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-5 rounded-lg text-white">
          <div className="animate-pulse">
            <div className="h-4 bg-[#2A2E3D] rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-[#2A2E3D] rounded mb-4"></div>
            <div className="h-8 bg-[#2A2E3D] rounded w-1/4"></div>
          </div>
        </Card>
        <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-5 rounded-lg text-white">
          <div className="animate-pulse">
            <div className="h-4 bg-[#2A2E3D] rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-[#2A2E3D] rounded"></div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
      {/* Reflection Notes */}
      <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-5 rounded-lg text-white h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            📝 Reflection Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* New Note Input (Autosave) */}
          <div className="mb-6">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your thoughts, reflections, or learning insights... (auto-saved)"
              className="w-full h-32 bg-[#111827] text-white p-3 rounded border border-[#2A2E3D] resize-none focus:border-[#7C4DFF] focus:outline-none"
            />
            {savingNote && (
              <p className="text-xs text-slate-400 mt-1">Saving...</p>
            )}
          </div>

          {/* Recent Notes - Scrollable container */}
          <div className="flex-1">
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              Recent Notes ({notes.length})
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
              {notes.slice(0, 10).map((note) => (
                <div key={note.id} className="bg-[#111827] p-3 rounded border border-[#2A2E3D]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-slate-400">
                      {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                    <Button
                      onClick={() => deleteNote(note.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-slate-500 text-sm italic">No notes yet. Start reflecting on your practice sessions!</p>
              )}
              {notes.length > 10 && (
                <p className="text-slate-400 text-xs italic text-center py-2">
                  Scroll to see {notes.length - 10} more notes...
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Planner */}
      <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-5 rounded-lg text-white h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            📅 Practice Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar */}
          <div className="mb-6">
            <Calendar
              onChange={(value) => {
                setSelectedDate(value as Date)
                // Focus scenario select after picking a date
                setTimeout(() => scenarioTriggerRef.current?.focus(), 50)
              }}
              value={selectedDate}
              className="bg-[#111827] border border-[#2A2E3D] rounded-lg p-2"
              tileClassName={({ date }) => {
                const plansForDate = getPlansForDate(date)
                return plansForDate.length > 0 ? 'bg-[#7C4DFF] text-white' : ''
              }}
              tileContent={({ date }) => {
                const plansForDate = getPlansForDate(date)
                return plansForDate.length > 0 ? (
                  <div className="text-xs bg-[#7C4DFF] text-white rounded-full w-5 h-5 flex items-center justify-center">
                    {plansForDate.length}
                  </div>
                ) : null
              }}
            />
          </div>

          {/* Add New Plan */}
          <div className="space-y-3 mb-6">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Selected Date</label>
              <div className="bg-[#111827] p-2 rounded border border-[#2A2E3D] text-sm">
                {format(selectedDate, 'EEEE, MMMM dd, yyyy', { locale: ja })}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Scenario</label>
              <Select value={selectedScene} onValueChange={setSelectedScene}>
                <SelectTrigger ref={scenarioTriggerRef} className="bg-[#111827] border-[#2A2E3D] text-white">
                  <SelectValue placeholder="Select a scenario" />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#2A2E3D]">
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id} className="text-white">
                      {scenario.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Note (Optional)</label>
              <textarea
                value={planNote}
                onChange={(e) => setPlanNote(e.target.value)}
                placeholder="Add any notes about this practice session..."
                className="w-full h-20 bg-[#111827] text-white p-2 rounded border border-[#2A2E3D] resize-none focus:border-[#7C4DFF] focus:outline-none text-sm"
              />
            </div>

            <Button
              onClick={savePlan}
              disabled={!selectedScene}
              className="w-full bg-[#7C4DFF] hover:bg-[#6b3bff] text-white"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Practice Plan
            </Button>
          </div>

          {/* All Plans - Scrollable container */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              Upcoming Plans ({plans.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
              {plans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="bg-[#111827] p-3 rounded border border-[#2A2E3D]">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="w-3 h-3 text-[#7C4DFF]" />
                        <span className="text-xs text-[#7C4DFF] font-medium">
                          {format(new Date(plan.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white">{plan.scene_title}</p>
                      {plan.note && (
                        <p className="text-xs text-slate-400 mt-1">{plan.note}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => deletePlan(plan.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {plans.length === 0 && (
                <p className="text-slate-500 text-sm italic">No upcoming plans. Schedule your next practice session!</p>
              )}
              {plans.length > 3 && (
                <p className="text-slate-400 text-xs italic text-center py-2">
                  Scroll to see {plans.length - 3} more plans...
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 