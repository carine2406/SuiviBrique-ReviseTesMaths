import React from "react";

export default function EleveDetailModal({
  isOpen,
  onClose,
  eleve,
  notes,
  planning,
  activeTab,
  setActiveTab,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4">Détail de l'élève</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="animate-spin text-indigo-500 text-3xl">⏳</span>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-lg font-bold">
                {eleve.nom} {eleve.prenom}
              </p>
              <p className="text-sm text-gray-600">
                Classe: {eleve.classe || "-"} | Niveau: {eleve.niveau || "-"}
              </p>
              <p className="text-sm text-gray-600">
                Code: <span className="font-mono">{eleve.code}</span>
              </p>
            </div>
            <div className="flex gap-4 mb-4">
              <button
                className={`px-4 py-2 rounded-lg font-bold ${activeTab === "T1" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-700"}`}
                onClick={() => setActiveTab("T1")}
              >
                Trimestre 1
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-bold ${activeTab === "T2" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-700"}`}
                onClick={() => setActiveTab("T2")}
              >
                Trimestre 2
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-bold ${activeTab === "T3" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-700"}`}
                onClick={() => setActiveTab("T3")}
              >
                Trimestre 3
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Notes</h3>
              <ul className="mb-4">
                {Array.isArray(notes) && notes.length > 0 ? (
                  notes.map((note, idx) => (
                    <li key={idx} className="mb-1 text-gray-700">
                      {note.matiere}:{" "}
                      <span className="font-bold">{note.valeur}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">Aucune note disponible.</li>
                )}
              </ul>
              <h3 className="text-lg font-bold mb-2">Planning</h3>
              <ul>
                {Array.isArray(planning) && planning.length > 0 ? (
                  planning.map((item, idx) => (
                    <li key={idx} className="mb-1 text-gray-700">
                      {item.activite} - {item.date}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">Aucun planning disponible.</li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
