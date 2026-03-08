import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import brickImage from "../assets/briques.png";
import {
  ChevronRight,
  GraduationCap,
  Calendar,
  ChevronLeft,
  Loader2,
  Check,
  Power,
  Users,
  ArrowLeftCircle,
} from "lucide-react";

export default function StudentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [notes, setNotes] = useState([]);
  const [planning, setPlanning] = useState([]);
  const [activeTab, setActiveTab] = useState("T1");
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    const staffData = localStorage.getItem("staff_data");
    const userType = localStorage.getItem("user_type");

    if (!staffData || userType !== "teacher") {
      navigate("/");
      return;
    }

    setTeacher(JSON.parse(staffData));
    fetchStudentData();
  }, [id, navigate]);

  async function fetchStudentData() {
    setLoading(true);
    try {
      // 1. Récupérer les infos de l'élève
      const { data: studentData, error: studentError } = await supabase
        .from("eleves")
        .select("*, classes(nom)")
        .eq("id", id)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // 2. Récupérer les notes de l'élève
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .eq("eleve_id", id);

      if (notesError) throw notesError;

      const flattenedNotes =
        notesData?.map((n) => ({
          ...n.donnees,
          trimestre: `T${n.trimestre}`,
          id: n.id,
        })) || [];

      setNotes(flattenedNotes);

      // 3. Récupérer le planning
      const { data: planningData, error: planningError } = await supabase
        .from("planning")
        .select("*")
        .eq("eleve_id", id) // Utiliser l'id de l'élève, pas userType.id
        .single();

      if (planningError && planningError.code !== "PGRST116")
        throw planningError;

      setPlanning(planningData?.indicateurs ? [planningData.indicateurs] : []);

      // Debug : vérifier les données récupérées
      console.log("Planning data:", planningData);
      console.log("Indicateurs:", planningData?.indicateurs);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    navigate("../teacher");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const currentNotes = notes.find((n) => n.trimestre === activeTab);

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <ArrowLeftCircle className="w-10 h-10" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white tracking-tight block leading-none">
                    Brique<span className="text-indigo-400">Suivi</span>
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">
                    Vue Élève
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">
                  {teacher?.prenom} {teacher?.nom}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                  Professeur
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <Power className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl shadow-indigo-500/20">
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl sm:text-4xl font-black text-white border-2 border-white/20">
              {student.nom?.[0]}
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black mb-2">
                {student.prenom} {student.nom}
              </h1>
              <div className="flex items-center gap-3 text-indigo-200">
                <Users className="w-4 h-4" />
                <p className="text-sm font-bold uppercase tracking-wider">
                  Classe : {student.classes?.nom}
                </p>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 mr-10 mb-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              Trimestre Actuel
            </p>
            <p className="text-xl font-black text-white">{activeTab}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              Moyenne Générale
            </p>
            <p className="text-2xl font-black text-indigo-400">
              {currentNotes?.moyenne ?? "--"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 p-1.5 bg-slate-900 rounded-2xl w-fit border border-slate-800">
            {["T1", "T2", "T3"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Trimestre {tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Notes Section */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                  Résultats
                </h2>
              </div>

              {currentNotes ? (
                <>
                  {/* Première ligne de stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {[
                      {
                        label: "Moyenne",
                        value: currentNotes.moyenne,
                        icon: "📊",
                      },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="bg-slate-900/50 border border-slate-800 p-4 sm:p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all flex flex-col justify-between min-h-[110px] sm:min-h-[120px]"
                      >
                        <div className="flex flex-col items-center mb-4">
                          <span className="text-2xl mb-2">{row.icon}</span>
                          <div className="h-1 w-6 bg-slate-800 rounded-full"></div>
                        </div>
                        <p className="text-[10px] text-center font-bold text-slate-500 uppercase tracking-widest mb-1">
                          {row.label}
                        </p>
                        <p className="text-xl font-black text-white text-center">
                          {row.value ?? (
                            <span className="text-slate-600">--</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Deuxième ligne de stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { label: "QCM", value: currentNotes.qcm, icon: "⚡" },
                      {
                        label: "Régularité",
                        value: currentNotes.regularite,
                        icon: "📅",
                      },
                      { label: "DST", value: currentNotes.dst, icon: "📝" },
                      {
                        label: "Bac Blanc",
                        value: currentNotes.bb,
                        icon: "🎓",
                      },
                      {
                        label: "Apprentissage",
                        value: currentNotes.apprentissage,
                        icon: "📈",
                      },
                      {
                        label: "Total Briques",
                        value: currentNotes.total_briques,
                        icon: "🧱",
                      },
                      {
                        label: "Brique IB",
                        value: currentNotes.brique_ib,
                        icon: (
                          <img
                            src={brickImage}
                            alt="Brique IB"
                            style={{ width: 50, height: 50 }}
                          />
                        ),
                      },
                      {
                        label: "Brique +",
                        value: currentNotes.brique_plus,
                        icon: "➕",
                      },
                      
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="bg-slate-900/50 border border-slate-800 p-4 sm:p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all flex flex-col justify-between min-h-[110px] sm:min-h-[120px]"
                      >
                        <div className="flex flex-col items-center mb-4">
                          <span className="text-2xl mb-2">{row.icon}</span>
                          <div className="h-1 w-6 bg-slate-800 rounded-full"></div>
                        </div>
                        <p className="text-[10px] text-center font-bold text-slate-500 uppercase tracking-widest mb-1">
                          {row.label}
                        </p>
                        <p className="text-xl font-black text-white text-center">
                          {row.value ?? (
                            <span className="text-slate-600">--</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-slate-900/30 rounded-[2rem] p-16 text-center border border-slate-800 border-dashed">
                  <p className="text-slate-600 font-bold">
                    Aucune donnée disponible pour cette période.
                  </p>
                </div>
              )}
            </div>

            {/* Planning Section */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-3 px-2">
                <div className="w-2 h-8 text-black bg-amber-500 rounded-full"></div>
                Planning
              </h2>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden min-h-[400px]">
                <div className="p-6 bg-slate-900 border-b border-slate-800">
                  <p className="text-xs font-black text-slate-200 uppercase tracking-widest text-center">
                    Planning Révisions IB
                  </p>
                </div>

                <div className="divide-y divide-slate-900">
                  {planning.length > 0 ? (
                    <div className="p-8 space-y-10">
                      {[
                        {
                          title: "Suites",
                          color: "text-emerald-400",
                          items: [
                            {
                              displayName: "récurrence",
                              dbKey: "rec",
                              label: "ib2",
                              prevKey: null,
                              nextKey: "cv",
                            },
                            
                            {
                              displayName: "convergence",
                              dbKey: "cv",
                              label: "ib6",
                              prevKey: "rec",
                              nextKey: "sg",
                            },
                            {
                              displayName: "Suite Géo",
                              dbKey: "sg",
                              label: "b5",
                              prevKey: "cv",
                              nextKey: "python",
                            },
                            {
                              displayName: "Python",
                              dbKey: "python",
                              label: "ib7",
                              prevKey: "sg",
                              nextKey: "lim",
                            },
                            {
                              displayName: "Limites",
                              dbKey: "lim",
                              label: "ib7bis",
                              prevKey: "python",
                              nextKey: null,
                            },
                          ],
                        },
                        {
                          title: "Probabilités",
                          color: "text-amber-400",
                          items: [
                            {
                              displayName: "Proba cond",
                              dbKey: "cond",
                              label: "ib1",
                              prevKey: null,
                              nextKey: "bino",
                            },
                            {
                              displayName: "Biniomiale",
                              dbKey: "bino",
                              label: "ib18",
                              prevKey: "cond",
                              nextKey: "va",
                            },
                            {
                              displayName: "VA",
                              dbKey: "va",
                              label: "ib22",
                              prevKey: "bino",
                              nextKey: null,
                            },
                          ],
                        },
                        {
                          title: "Fonctions",
                          color: "text-indigo-400",
                          items: [
                            {
                              displayName: "dériver",
                              dbKey: "deriv",
                              label: "ib3",
                              prevKey: null,
                              nextKey: "signe",
                            },
                            {
                              displayName: "signe",
                              dbKey: "signe",
                              label: "ib4",
                              prevKey: "deriv",
                              nextKey: "conv",
                            },
                            
                            {
                              displayName: "convexite",
                              dbKey: "conv",
                              label: "ib9",
                              prevKey: "signe",
                              nextKey: "co",
                            },
                            
                            {
                              displayName: "continuité",
                              dbKey: "co",
                              label: "ib13",
                              prevKey: "conv",
                              nextKey: "integr",
                            },
                            
                            {
                              displayName: "calcul d'intégrales",
                              dbKey: "integr",
                              label: "ib19",
                              prevKey: "co",
                              nextKey: "aire",
                            },
                            {
                              displayName: "aire",
                              dbKey: "aire",
                              label: "ib20",
                              prevKey: "integr",
                              nextKey: "ed",
                            },
                            
                            {
                              displayName: "equa Diff",
                              dbKey: "ed",
                              label: "ib23",
                              prevKey: "aire",
                              nextKey: "graph",
                            },
                            {
                              displayName: "graphique",
                              dbKey: "graph",
                              label: "ib8",
                              prevKey: "ed",
                              nextKey: "lim_fn",
                            },
                            {
                              displayName: "limites",
                              dbKey: "lim_fn",
                              label: "ib12",
                              prevKey: "graph",
                              nextKey: "trigo",
                            },
                            {
                              displayName: "Fns trigos",
                              dbKey: "trigo",
                              label: "ib15",
                              prevKey: "lim_fn",
                            },
                            {
                              displayName: "inégalités",
                              dbKey: "int_plus",
                              label: "ib21",
                              prevKey: "trigo",
                              nextKey: null,
                            },
                          ],
                        },
                        {
                          title: "Espace",
                          color: "text-orange-500",
                          items: [
                            
                            {
                              displayName: "droite",
                              dbKey: "dte",
                              label: "ib11",
                              prevKey: null,
                              nextKey: "plan",
                            },
                            {
                              displayName: "Equation Plan",
                              dbKey: "plan",
                              label: "ib16",
                              prevKey: "dte",
                              nextKey: "v",
                            },
                            {
                              displayName: "volume",
                              dbKey: "v",
                              label: "ib17",
                              prevKey: "plan",
                              nextKey: "vect",
                            },
                            {
                              displayName: "vecteurs",
                              dbKey: "vect",
                              label: "ib10",
                              prevKey: "v",
                              nextKey: null,
                            },
                          ],
                        },
                      ].map((group) => (
                        <div key={group.title} className="space-y-4">
                          <h4
                            className={`text-[12px] font-black uppercase tracking-[0.2em] ${group.color} opacity-80 px-1`}
                          >
                            {group.title}
                          </h4>
                          <div className="grid grid-cols-2 w-full sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                            {group.items.map((item) => {
                              const value = planning[0]?.[item.dbKey];

                              // LOGIQUE D'AFFICHAGE
                              let display;
                              let statusColor = "";

                              if (value !== "" && planning[0]?.[item.nextKey] !== "") {
                                display = (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-green-400">
                                      {value}
                                    </span>
                                    <Check className="w-3 h-3 text-green-500" />
                                  </div>
                                );
                                statusColor =
                                  "border-green-500/30 bg-green-500/5 border-3";
                              } else if (value !== "" && planning[0]?.[item.nextKey] == ""
                              ) {
                                display = (
                                    <span className="text-amber-500 font-medium italic text-[10px]">
                                    {value} à valider
                                  </span>
                                );
                                statusColor =
                                  "border-amber-500/30 bg-amber-500/5 border-3";
                              } else {
                                display = (
                                  <span className="text-rose-500 font-medium italic text-[10px]">
                                    🔒
                                  </span>
                                );
                                statusColor =
                                  "border-rose-500/30 bg-rose-500/5 border-3";
                              }

                              return (
                                <div
                                  key={item.dbKey}
                                  className={`bg-slate-900 p-3 rounded-xl border transition-all flex flex-col justify-center gap-1 group hover:scale-105 duration-200 ${statusColor}`}
                                >
                                  <p className="text-[9px] wrap-break-word text-center font-bold text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                    {item.displayName}
                                  </p>
                                  <p className="text-xs text-center font-bold text-slate-100">
                                    {display}
                                  </p>
                                {/**   {item.prevKey && (
                                    <p className="text-[8px] text-center text-slate-600 mt-1">
                                      prérequis:{" "}
                                      {group.items.find(
                                        (i) => i.dbKey === item.prevKey,
                                      )?.displayName || item.prevKey}
                                    </p>
                                  )} */}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-loose">
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
      <footer className="max-w-7xl mx-auto p-10 mt-10 text-center border-t border-slate-800">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em]">
          Révise Tes Maths &copy; 2026 
        </p>
      </footer>
    </div>
  );
}
