import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Power, GraduationCap, Calendar, ChevronRight, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState([])
  const [planning, setPlanning] = useState([])
  const [activeTab, setActiveTab] = useState('T1')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('eleve_data')
    if (!userData) {
      navigate('/')
      return
    }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchData(parsedUser)
  }, [navigate])

  async function fetchData(userData) {
    setLoading(true)
    try {
      // 1. Récupérer les notes de l'élève (plusieurs trimestres possibles)
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('eleve_id', userData.id)

      if (notesError) throw notesError
      
      // Transformer le JSONB 'donnees' pour l'affichage à plat si nécessaire
      const flattenedNotes = notesData?.map(n => ({
        ...n.donnees,
        trimestre: `T${n.trimestre}`,
        id: n.id
      })) || []
      
      setNotes(flattenedNotes)

      // 2. Récupérer le planning
      const { data: planningData, error: planningError } = await supabase
        .from('planning')
        .select('*')
        .eq('eleve_id', userData.id)
        .single() // Un seul planning par élève

      if (planningError && planningError.code !== 'PGRST116') throw planningError
      setPlanning(planningData?.indicateurs ? [planningData.indicateurs] : [])

    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const currentNotes = notes.find(n => n.trimestre === activeTab)

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Premium */}
      <nav className="glass sticky top-0 z-30 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                <GraduationCap className="text-white w-7 h-7" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 block leading-none">
                  Brique<span className="text-indigo-600">Suivi</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                  Espace Élève
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
            >
              <Power size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-indigo-600 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl shadow-indigo-200">
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
              Ravi de vous revoir, <br />
              <span className="text-indigo-200">{user.prenom} !</span>
            </h1>
            <p className="text-indigo-100 text-lg font-medium opacity-90 max-w-xl">
              Retrouvez ici l'ensemble de vos performances académiques et votre organisation hebdomadaire.
            </p>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 mr-10 mb-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Global Stats Overview (Brief) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover-lift">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Trimestre Actuel</p>
            <p className="text-2xl font-black text-slate-900">{activeTab}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover-lift">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Moyenne Générale</p>
            <p className="text-2xl font-black text-indigo-600">{currentNotes?.moyenne ?? '--'}</p>
          </div>
        </div>

        {/* Tabs for Trimestres */}
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 p-1.5 bg-slate-200/50 rounded-2xl w-fit border border-slate-200/50">
            {['T1', 'T2', 'T3'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                  ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Trimestre {tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Notes Section (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                  Résultats détaillés
                </h2>
              </div>

              {loading ? (
                <div className="bg-white rounded-[2rem] p-20 text-center border border-slate-100">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Analyse des données...</p>
                </div>
              ) : currentNotes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Moyenne Organisée', value: currentNotes.moyenne, icon: '📊' },
                    { label: 'QCM Flash', value: currentNotes.qcm, icon: '⚡' },
                    { label: 'Régularité', value: currentNotes.regularite, icon: '📅' },
                    { label: 'Brique IB', value: currentNotes.brique_ib, icon: '🧱' },
                    { label: 'Brique +', value: currentNotes.brique_plus, icon: '➕' },
                    { label: 'Total Briques', value: currentNotes.total_briques, icon: '🧱' },
                    { label: 'Apprentissage', value: currentNotes.apprentissage, icon: '💡' },
                    { label: 'DST', value: currentNotes.dst, icon: '📝' },
                    { label: 'Bac Blanc', value: currentNotes.bb, icon: '🎓' },
                    { label: 'Moyenne DST', value: currentNotes.moy_dst, icon: '🏆' },
                  ].map((row, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">{row.icon}</span>
                        <div className="h-2 w-8 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors"></div>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{row.label}</p>
                      <p className="text-2xl font-black text-slate-900">
                        {row.value ?? <span className="text-slate-300">--</span>}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 border-dashed">
                  <p className="text-slate-400 font-bold">Aucune donnée disponible pour cette période.</p>
                </div>
              )}
            </div>

            {/* Planning Section (1/3) */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 px-2">
                <div className="w-2 h-8 bg-indigo-400 rounded-full"></div>
                Planning
              </h2>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Suivi des compétences</p>
                </div>

                <div className="divide-y divide-slate-50">
                  {planning.length > 0 ? (
                    <div className="p-8 space-y-10">
                      {[
                        {
                          title: 'Suites',
                          color: 'text-emerald-500',
                          items: [
                            { key: 'rec', label: 'ib2' },
                            { key: 'sg', label: 'b5' },
                            { key: 'cv', label: 'ib6' },
                            { key: 'python', label: 'ib7' },
                            { key: 'lim', label: 'ib7bis' }
                          ]
                        },
                        {
                          title: 'Probabilités',
                          color: 'text-amber-500',
                          items: [
                            { key: 'den', label: 'i' },
                            { key: 'cond', label: 'ib1' },
                            { key: 'v', label: 'ib18' },
                            { key: 'va', label: 'ib22' }
                          ]
                        },
                        {
                          title: 'Fonctions',
                          color: 'text-indigo-600',
                          items: [
                            { key: 'deriv', label: 'ib3' },
                            { key: 'signe', label: 'ib4' },
                            { key: 'graph', label: 'ib8' },
                            { key: 'conv', label: 'ib9' },
                            { key: 'lim_fn', label: 'ib12' },
                            { key: 'co', label: 'ib13' },
                            { key: 'trigo', label: 'ib15' },
                            { key: 'integr', label: 'ib19' },
                            { key: 'aire', label: 'ib20' },
                            { key: 'int_plus', label: 'ib21' },
                            { key: 'ed', label: 'ib23' }
                          ]
                        },
                        {
                          title: 'Géométrie & Autres',
                          color: 'text-slate-400',
                          items: [
                            { key: 'vect', label: 'ib10' },
                            { key: 'dte', label: 'ib11' },
                            { key: 'plan', label: 'ib16' },
                            { key: 'bino', label: 'ib17' }
                          ]
                        }
                      ].map((group) => (
                        <div key={group.title} className="space-y-4">
                          <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${group.color} opacity-80 px-1`}>
                            {group.title}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {group.items.map((item) => {
                              const value = planning[0]?.[item.key];
                              return (
                                <div key={item.key} className="flex flex-col gap-1.5 group">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">{item.label}</p>
                                  <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                    {value || <span className="text-slate-200">--</span>}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                        Aucun planning <br /> pour le moment
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto p-10 mt-10 text-center border-t border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
          BriqueSuivi &copy; 2024
        </p>
      </footer>
    </div>
  )
}
