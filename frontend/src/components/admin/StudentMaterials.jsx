import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Sparkles, Search, Filter, Layers } from 'lucide-react';
import { getStudentMaterials, getStudentModules } from '../../api/services';

export default function StudentMaterials({ setActiveTab, onSelectMaterialForAi }) {
  const [materials, setMaterials] = useState([]);
  const [modules, setModules]     = useState([]);
  const [loading, setLoading]     = useState(true);

  const [search, setSearch]       = useState('');
  const [selectedMod, setSelectedMod] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStudentMaterials(),
      getStudentModules()
    ]).then(([matRes, modRes]) => {
      setMaterials(matRes.data || []);
      setModules(modRes.data || []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
                        (m.module_name && m.module_name.toLowerCase().includes(search.toLowerCase()));
    const matchMod    = selectedMod === 'all' || String(m.module_id) === String(selectedMod);
    const matchType   = selectedType === 'all' || m.material_type === selectedType;
    return matchSearch && matchMod && matchType;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen p-6 md:p-10 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Espace Étudiant</span>
          <h1 className="text-xl font-black text-slate-800">Mes Cours & Documents</h1>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 shadow-xs"
            />
          </div>

          <select
            value={selectedMod}
            onChange={e => setSelectedMod(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 shadow-xs"
          >
            <option value="all">Tous les modules</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 shadow-xs"
          >
            <option value="all">Tous les types</option>
            <option value="cours">Cours</option>
            <option value="td">TD</option>
            <option value="tp">TP</option>
          </select>
        </div>
      </div>

      {/* Materials List Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400">Chargement des cours...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center shadow-sm">
          <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">Aucun document trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map(m => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md p-5 flex flex-col justify-between transition-all space-y-4 group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    m.material_type === 'cours' ? 'bg-violet-100 text-violet-700' :
                    m.material_type === 'td' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {m.material_type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {m.module_name}
                  </span>
                </div>

                <h3 className="font-black text-slate-800 text-sm group-hover:text-violet-600 transition-colors">
                  {m.title}
                </h3>
                {m.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <a
                  href={`http://localhost:8000${m.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  <Download size={13} /> Télécharger
                </a>

                <button
                  onClick={() => {
                    if (onSelectMaterialForAi) onSelectMaterialForAi(m.id);
                    setActiveTab('chatbot');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all"
                >
                  <Sparkles size={13} /> Résumer IA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
