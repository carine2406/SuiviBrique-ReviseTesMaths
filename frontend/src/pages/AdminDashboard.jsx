import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Users,
  LogOut,
  Search,
  Filter,
  GraduationCap,
  ChevronRight,
  Loader2,
  TrendingUp,
  BookOpen,
} from "lucide-react";

import EleveDetailModal from "../components/EleveDetailModal";
import DarkModeToggle from "../components/DarkModeToggle";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  // Ajout pour modal détail élève
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [activeEleveTab, setActiveEleveTab] = useState("T1");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [eleveNotes, setEleveNotes] = useState([]);
  const [elevePlanning, setElevePlanning] = useState([]);

  // Fonction pour charger les détails d'un élève (notes et planning)
  const fetchEleveDetails = async (eleve) => {
    setSelectedEleve(eleve);
    setShowDetailModal(true);
    setLoadingDetails(true);
    setActiveEleveTab("T1");
    try {
      // 1. Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .eq("eleve_id", eleve.id);

      if (notesError) throw notesError;

      const flattenedNotes =
        notesData?.map((n) => ({
          ...n.donnees,
          trimestre: `T${n.trimestre}`,
          id: n.id,
        })) || [];
      setEleveNotes(flattenedNotes);

      // 2. Fetch planning
      const { data: planningData, error: planningError } = await supabase
        .from("planning")
        .select("*")
        .eq("eleve_id", eleve.id)
        .single();

      if (planningError && planningError.code !== "PGRST116")
        throw planningError;
      setElevePlanning(
        planningData?.indicateurs ? [planningData.indicateurs] : [],
      );
    } catch (err) {
      console.error("Error fetching student details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const adminData = localStorage.getItem("staff_data");
    if (!adminData) {
      navigate("/");
      return;
    }
    const parsed = JSON.parse(adminData);
    if (parsed.role !== "admin") {
      navigate("/");
      return;
    }
    setAdmin(parsed);
    fetchEleves();
  }, [navigate]);

  const fetchEleves = async () => {
    try {
      const { data, error } = await supabase
        .from("eleves")
        .select("*")
        .order("nom", { ascending: true });

      if (error) throw error;
      setEleves(data || []);
    } catch (err) {
      console.error("Error fetching eleves:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const distinctClasses = [
    "All",
    ...new Set(eleves.map((e) => e.classe).filter(Boolean)),
  ];
  const distinctLevels = [
    "All",
    ...new Set(eleves.map((e) => e.niveau).filter(Boolean)),
  ];

  const filteredEleves = eleves.filter((e) => {
    const matchesSearch = (e.nom + " " + e.prenom)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === "All" || e.classe === filterClass;
    const matchesLevel = filterLevel === "All" || e.niveau === filterLevel;
    return matchesSearch && matchesClass && matchesLevel;
  });

  if (!admin || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-12">
      {/* Top Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Admin<span className="text-indigo-400">Panel</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <DarkModeToggle />
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{admin.nom}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                  Administrateur
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6">
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">
                Total Élèves
              </p>
              <p className="text-3xl font-black text-white">{eleves.length}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">
                Moyenne Générale
              </p>
              <p className="text-3xl font-black text-white">
                {(
                  eleves.reduce((acc, curr) => acc + (curr.moyenne || 0), 0) /
                  (eleves.length || 1)
                ).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6">
            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">
                Classes
              </p>
              <p className="text-3xl font-black text-white">
                {distinctClasses.length - 1}
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 sm:p-8 rounded-[2rem] mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <select
                  className="bg-transparent text-white focus:outline-none font-bold text-sm min-w-[120px]"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <option value="All" className="bg-slate-900">
                    Tout les niveaux
                  </option>
                  {distinctLevels
                    .filter((l) => l !== "All")
                    .map((l) => (
                      <option key={l} value={l} className="bg-slate-900">
                        {l}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <select
                  className="bg-transparent text-white focus:outline-none font-bold text-sm min-w-[100px]"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="All" className="bg-slate-900">
                    Toutes les classes
                  </option>
                  {distinctClasses
                    .filter((c) => c !== "All")
                    .map((c) => (
                      <option key={c} value={c} className="bg-slate-900">
                        {c}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/30 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-800">
                  <th className="px-8 py-6">Élève</th>
                  <th className="px-6 py-6 text-center">Niveau / Classe</th>
                  <th className="px-6 py-6 text-center">Trimestre</th>
                  <th className="px-6 py-6 text-center">Moyenne</th>
                  <th className="px-6 py-6 text-center">Briques</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEleves.map((eleve) => (
                  <tr
                    key={eleve.id}
                    className="group hover:bg-slate-800/20 transition-all cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-indigo-400 font-black text-xl border border-slate-700">
                          {eleve.nom?.[0]}
                        </div>
                        <div>
                          <p className="text-white font-bold group-hover:text-indigo-400 transition-colors">
                            {eleve.nom} {eleve.prenom}
                          </p>
                          <p className="text-xs text-slate-500">
                            Code:{" "}
                            <span className="font-mono text-slate-400">
                              {eleve.code}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-bold">
                          {eleve.niveau || "-"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {eleve.classe || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-black text-slate-300">
                        {eleve.trimestre}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span
                        className={`text-xl font-black ${
                          (eleve.moyenne || 0) >= 14
                            ? "text-emerald-400"
                            : (eleve.moyenne || 0) >= 10
                              ? "text-amber-400"
                              : "text-rose-400"
                        }`}
                      >
                        {eleve.moyenne ? eleve.moyenne.toFixed(2) : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="text-white font-bold">
                        {eleve.total_briques || "-"}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        className="p-3 bg-slate-800/50 hover:bg-indigo-600 rounded-xl transition-all group/btn border border-slate-700 hover:border-indigo-500"
                        onClick={() => fetchEleveDetails(eleve)}
                      >
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEleves.length === 0 && (
            <div className="py-20 text-center">
              <Users className="w-16 h-16 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-500 font-bold text-lg">
                Aucun élève trouvé.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Détails Élève */}
      <EleveDetailModal
        isOpen={showDetailModal && !!selectedEleve}
        onClose={() => setShowDetailModal(false)}
        eleve={selectedEleve || {}}
        notes={
          Array.isArray(eleveNotes)
            ? eleveNotes.filter((n) => n.trimestre === activeEleveTab)
            : []
        }
        planning={Array.isArray(elevePlanning) ? elevePlanning : []}
        activeTab={activeEleveTab}
        setActiveTab={setActiveEleveTab}
        loading={loadingDetails}
      />
    </div>
  );
}
