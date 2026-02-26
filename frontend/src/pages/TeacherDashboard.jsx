import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import StudentDetail from "../components/StudentDetail";
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
  Trash2,
  Settings,
  Table,
  X,
  Power,
  Check,
} from "lucide-react";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("none"); // 'class' or 'eleve'
  const [newClassName, setNewClassName] = useState("");
  const [newEleveData, setNewEleveData] = useState({
    nom: "",
    prenom: "",
    classe_id: "",
  });

  const [selectedEleve, setSelectedEleve] = useState(null);
  const [eleveNotes, setEleveNotes] = useState([]);
  const [elevePlanning, setElevePlanning] = useState([]);
  const [activeEleveTab, setActiveEleveTab] = useState("T1");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [eleveToEdit, setEleveToEdit] = useState(null);
  const [editClassId, setEditClassId] = useState("");

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  useEffect(() => {
    const staffData = localStorage.getItem("staff_data");
    const userType = localStorage.getItem("user_type");

    if (!staffData || userType !== "teacher") {
      navigate("/");
      return;
    }

    const parsed = JSON.parse(staffData);
    setTeacher(parsed);
    fetchTeacherInfo(parsed.id);
  }, [navigate]);

  const fetchTeacherInfo = async (profId) => {
    try {
      // 1. Get classes created by the teacher
      const { data: teacherClasses, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("professeur_id", profId);

      if (classError) throw classError;
      setClasses(teacherClasses || []);

      if (teacherClasses && teacherClasses.length > 0) {
        const classIds = teacherClasses.map((c) => c.id);
        // 2. Fetch students for these class IDs
        const { data, error } = await supabase
          .from("eleves")
          .select("*, classes(nom)")
          .in("classe_id", classIds)
          .order("nom", { ascending: true });

        if (error) throw error;
        setEleves(data || []);
      }
    } catch (err) {
      console.error("Error fetching teacher data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredEleves = eleves.filter((e) => {
    const matchesSearch = (e.nom + " " + e.prenom)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === "All" || e.classe_id === filterClass;
    return matchesSearch && matchesClass;
  });

  const handleAddClass = async () => {
    if (!newClassName) return;
    try {
      const { error } = await supabase
        .from("classes")
        .insert([{ nom: newClassName, professeur_id: teacher.id }]);
      if (error) throw error;
      setShowAddModal(false);
      setNewClassName("");
      fetchTeacherInfo(teacher.id);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la classe");
    }
  };

  const handleAddEleve = async () => {
    if (!newEleveData.nom || !newEleveData.prenom || !newEleveData.classe_id)
      return;
    try {
      const code = generateCode();
      const { error } = await supabase.from("eleves").insert([
        {
          nom: newEleveData.nom,
          prenom: newEleveData.prenom,
          classe_id: newEleveData.classe_id,
          code_connexion: code,
        },
      ]);
      if (error) throw error;
      setShowAddModal(false);
      setNewEleveData({ nom: "", prenom: "", classe_id: "" });
      fetchTeacherInfo(teacher.id);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout de l'élève");
    }
  };

  const handleDeleteEleve = async (id) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet élève ? Toutes ses données (notes, planning) seront définitivement effacées.",
      )
    )
      return;
    try {
      const { error } = await supabase.from("eleves").delete().eq("id", id);
      if (error) throw error;
      fetchTeacherInfo(teacher.id);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression de l'élève");
    }
  };

  const handleOpenEdit = (eleve) => {
    setEleveToEdit(eleve);
    setEditClassId(eleve.classe_id);
    setShowEditModal(true);
  };

  const handleUpdateEleveClass = async () => {
    if (!editClassId) return;
    try {
      const { error } = await supabase
        .from("eleves")
        .update({ classe_id: editClassId })
        .eq("id", eleveToEdit.id);
      if (error) throw error;
      setShowEditModal(false);
      fetchTeacherInfo(teacher.id);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification de la classe");
    }
  };

  const fetchEleveDetails = async (eleve) => {
    navigate(`../StudentDetail/${eleve.id}`);
  };

  if (!teacher || loading) {
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
                Espace<span className="text-indigo-400">Prof</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">
                  {teacher.prenom} {teacher.nom}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                  Professeur
                </p>
              </div>
              {teacher.code_professeur && (
                <div className="hidden md:flex flex-col items-end px-4 border-l border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                    Code Excel
                  </p>
                  <p className="text-indigo-400 font-mono font-bold">
                    {teacher.code_professeur}
                  </p>
                </div>
              )}
              <button
                onClick={() => navigate("/teacher/guide")}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-xs font-bold border border-slate-700"
              >
                <Table className="w-4 h-4 text-indigo-400" /> Structure Excel
              </button>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Header Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6">
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">
                Vos Élèves
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
                Dernières Notes
              </p>
              <p className="text-3xl font-black text-white">
                {eleves.length > 0 ? "Sync OK" : "0 Sync"}
              </p>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6">
            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">
                Vos Classes
              </p>
              <p className="text-3xl font-black text-white">{classes.length}</p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Chercher un élève..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <select
                  className="bg-transparent text-white focus:outline-none font-bold text-sm min-w-[150px]"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="All" className="bg-slate-900">
                    Toutes vos classes
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setModalType("selector");
                  setShowAddModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all"
              >
                + Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/30 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-800">
                  <th className="px-8 py-6">Élève</th>
                  <th className="px-6 py-6 text-center">Classe</th>
                  <th className="px-6 py-6 text-center">Code Connexion</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEleves.map((eleve) => (
                  <tr
                    key={eleve.id}
                    className="group hover:bg-slate-800/20 transition-all"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700">
                          {eleve.nom?.[0]}
                        </div>
                        <p className="text-white font-bold">
                          {eleve.nom} {eleve.prenom}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="text-slate-400 font-bold">
                        {eleve.classes?.nom}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="px-3 py-1 bg-slate-800 rounded-lg text-indigo-400 font-mono font-bold border border-slate-700">
                        {eleve.code_connexion}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => fetchEleveDetails(eleve)}
                          className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Voir détails"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(eleve)}
                          className="p-2 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Changer classe"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEleve(eleve.id)}
                          className="p-2 text-slate-500 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEleves.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              Aucun élève trouvé dans vos classes.
            </div>
          )}
        </div>
      </main>

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            {modalType === "selector" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-8">
                  Que souhaitez-vous ajouter ?
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setModalType("class")}
                    className="p-6 rounded-3xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex flex-col items-center gap-3 group"
                  >
                    <BookOpen className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">Une Classe</span>
                  </button>
                  <button
                    onClick={() => setModalType("eleve")}
                    className="p-6 rounded-3xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex flex-col items-center gap-3 group"
                  >
                    <Users className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">Un Élève</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="mt-8 text-slate-500 hover:text-white font-bold text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}

            {modalType === "class" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">
                  Créer une classe
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nom de la classe (ex: Terminale G1)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                  <button
                    onClick={handleAddClass}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                  >
                    Créer la classe
                  </button>
                  <button
                    onClick={() => setModalType("selector")}
                    className="w-full text-slate-500 hover:text-white font-bold text-sm"
                  >
                    Retour
                  </button>
                </div>
              </div>
            )}

            {modalType === "eleve" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">
                  Ajouter un élève
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nom de famille"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={newEleveData.nom}
                    onChange={(e) =>
                      setNewEleveData({ ...newEleveData, nom: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Prénom"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={newEleveData.prenom}
                    onChange={(e) =>
                      setNewEleveData({
                        ...newEleveData,
                        prenom: e.target.value,
                      })
                    }
                  />
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={newEleveData.classe_id}
                    onChange={(e) =>
                      setNewEleveData({
                        ...newEleveData,
                        classe_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddEleve}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                  >
                    Ajouter l'élève
                  </button>
                  <button
                    onClick={() => setModalType("selector")}
                    className="w-full text-slate-500 hover:text-white font-bold text-sm"
                  >
                    Retour
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Modification Classe */}
      {showEditModal && eleveToEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Modifier la classe
              </h2>
              <p className="text-slate-400 text-sm">
                Changement de classe pour{" "}
                <strong>
                  {eleveToEdit.prenom} {eleveToEdit.nom}
                </strong>
              </p>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Choisir une nouvelle classe
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateEleveClass}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                >
                  Enregistrer le changement
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-full text-slate-500 hover:text-white font-bold text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
