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
import { Trash2, Plus, Calendar as CalendarIcon, MessageSquare, Lightbulb, Sparkles } from 'lucide-react'
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
  const [savedToast, setSavedToast] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'plans'>('notes')
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
        // 保存完了トースト
        setSavedToast(true)
        setTimeout(() => setSavedToast(false), 1500)
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl text-white shadow-2xl shadow-black/20">
          <div className="animate-pulse">
            <div className="h-6 bg-[#374151] rounded w-1/3 mb-6"></div>
            <div className="h-40 bg-[#374151] rounded mb-6"></div>
            <div className="h-8 bg-[#374151] rounded w-1/4"></div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl text-white shadow-2xl shadow-black/20">
          <div className="animate-pulse">
            <div className="h-6 bg-[#374151] rounded w-1/3 mb-6"></div>
            <div className="h-80 bg-[#374151] rounded"></div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 mt-12 w-full">
      {/* Reflection Notes - より洗練されたデザイン */}
      <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl text-white shadow-2xl shadow-black/20 w-full">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Reflection Notes</CardTitle>
          </div>
          <p className="text-slate-400 text-lg leading-relaxed">
            Share your thoughts and insights with your AI coach to accelerate your learning journey
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Note Input (Autosave) - より魅力的なデザイン */}
          <div className="relative group">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="What did you learn today? Share your insights, challenges, or breakthroughs..."
              className="w-full h-40 bg-[#0F111A] text-white p-6 rounded-2xl border-2 border-[#374151] resize-none focus:border-[#22D3EE] focus:outline-none text-lg leading-relaxed transition-all duration-300 group-hover:border-[#4B5563] group-hover:shadow-lg group-hover:shadow-[#22D3EE]/10"
            />
            {savingNote && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-sm text-slate-400">
                <div className="w-3 h-3 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            )}
          </div>

          {/* Recent Notes - タブ切り替えで整理 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-200">
                Recent Notes ({notes.length})
              </h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveTab('notes')}
                  variant={activeTab === 'notes' ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-xl transition-all duration-200 ${
                    activeTab === 'notes' 
                      ? 'bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] text-white shadow-lg shadow-[#22D3EE]/25' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#374151]'
                  }`}
                >
                  All Notes
                </Button>
                <Button
                  onClick={() => setActiveTab('plans')}
                  variant={activeTab === 'plans' ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-xl transition-all duration-200 ${
                    activeTab === 'plans' 
                      ? 'bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] text-white shadow-lg shadow-[#22D3EE]/25' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#374151]'
                  }`}
                >
                  Practice Plans
                </Button>
              </div>
            </div>
            
            {activeTab === 'notes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {notes.slice(0, 6).map((note) => (
                  <div key={note.id} className="bg-[#0F111A] p-4 rounded-2xl border border-[#374151] hover:border-[#22D3EE] transition-all duration-200 group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-slate-400 font-medium">
                        {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                      <Button
                        onClick={() => deleteNote(note.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 h-auto rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed line-clamp-3">{note.content}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Lightbulb className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-slate-500 text-base italic">No notes yet. Start reflecting on your practice sessions!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {plans.slice(0, 6).map((plan) => (
                  <div key={plan.id} className="bg-[#0F111A] p-4 rounded-2xl border border-[#374151] hover:border-[#22D3EE] transition-all duration-200 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#22D3EE]" />
                        <span className="text-xs text-[#22D3EE] font-medium">
                          {format(new Date(plan.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <Button
                        onClick={() => deletePlan(plan.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 h-auto rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium text-white mb-2">{plan.scene_title}</p>
                    {plan.note && (
                      <p className="text-xs text-slate-400 leading-relaxed">{plan.note}</p>
                    )}
                  </div>
                ))}
                {plans.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-slate-500 text-base italic">No upcoming plans. Schedule your next practice session!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Practice Planner - モダンなカレンダーデザイン */}
      <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl text-white shadow-2xl shadow-black/20 w-full">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Practice Planner</CardTitle>
          </div>
          <p className="text-slate-400 text-lg leading-relaxed">
            Schedule your practice sessions and track your learning progress
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
            {/* Calendar Section */}
            <div>
              <div className="mb-6">
                <Calendar
                  onChange={(value) => {
                    setSelectedDate(value as Date)
                    setTimeout(() => scenarioTriggerRef.current?.focus(), 50)
                  }}
                  value={selectedDate}
                  className="bg-[#0F111A] border-2 border-[#374151] rounded-2xl p-4 shadow-lg shadow-black/20"
                  tileClassName={({ date }) => {
                    const plansForDate = getPlansForDate(date)
                    return plansForDate.length > 0 ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white rounded-lg' : ''
                  }}
                  tileContent={({ date }) => {
                    const plansForDate = getPlansForDate(date)
                    return plansForDate.length > 0 ? (
                      <div className="text-xs bg-white text-[#F59E0B] rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                        {plansForDate.length}
                      </div>
                    ) : null
                  }}
                />
              </div>

              {/* Add New Plan */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Selected Date</label>
                  <div className="bg-[#0F111A] p-3 rounded-xl border border-[#374151] text-sm font-medium">
                    {format(selectedDate, 'EEEE, MMMM dd, yyyy', { locale: ja })}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Scenario</label>
                  <Select value={selectedScene} onValueChange={setSelectedScene}>
                    <SelectTrigger ref={scenarioTriggerRef} className="bg-[#0F111A] border-[#374151] text-white rounded-xl hover:border-[#F59E0B] transition-colors">
                      <SelectValue placeholder="Select a scenario" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F111A] border-[#374151]">
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id} className="text-white hover:bg-[#374151]">
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
                    className="w-full h-24 bg-[#0F111A] text-white p-3 rounded-xl border border-[#374151] resize-none focus:border-[#F59E0B] focus:outline-none text-sm transition-colors"
                  />
                </div>

                <Button
                  onClick={savePlan}
                  disabled={!selectedScene}
                  className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-semibold py-3 rounded-xl shadow-lg shadow-[#F59E0B]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#F59E0B]/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Practice Plan
                </Button>
              </div>
            </div>

            {/* Plans List Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                <h4 className="text-lg font-semibold text-slate-200">
                  Upcoming Plans ({plans.length})
                </h4>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {plans.slice(0, 8).map((plan) => (
                  <div key={plan.id} className="bg-[#0F111A] p-4 rounded-xl border border-[#374151] hover:border-[#F59E0B] transition-all duration-200 group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="w-4 h-4 text-[#F59E0B]" />
                          <span className="text-sm text-[#F59E0B] font-medium">
                            {format(new Date(plan.date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white mb-1">{plan.scene_title}</p>
                        {plan.note && (
                          <p className="text-xs text-slate-400 leading-relaxed">{plan.note}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => deletePlan(plan.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 h-auto rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {plans.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-slate-500 text-base italic">No upcoming plans. Schedule your next practice session!</p>
                  </div>
                )}
                {plans.length > 8 && (
                  <p className="text-slate-400 text-sm italic text-center py-4">
                    Scroll to see {plans.length - 8} more plans...
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存完了トースト - より魅力的なデザイン */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] text-white text-base px-6 py-4 rounded-2xl shadow-2xl shadow-[#22D3EE]/30 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Reflection note saved successfully!</span>
        </div>
      )}

      {/* カスタムスクロールバーのスタイル */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #22D3EE;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #06B6D4;
        }
        
        /* Calendar customization */
        .react-calendar {
          background: transparent;
          border: none;
          font-family: inherit;
        }
        .react-calendar__tile {
          background: transparent;
          border: none;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .react-calendar__tile:hover {
          background: rgba(34, 211, 238, 0.1);
        }
        .react-calendar__tile--active {
          background: linear-gradient(135deg, #22D3EE, #06B6D4) !important;
          color: white;
        }
        .react-calendar__navigation button {
          background: transparent;
          border: none;
          color: #9CA3AF;
          font-size: 16px;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .react-calendar__navigation button:hover {
          background: rgba(34, 211, 238, 0.1);
          color: #22D3EE;
        }
        .react-calendar__month-view__weekdays {
          color: #6B7280;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
        }
        .react-calendar__month-view__days__day--neighboringMonth {
          color: #4B5563;
        }
      `}</style>
    </div>
  )
} 