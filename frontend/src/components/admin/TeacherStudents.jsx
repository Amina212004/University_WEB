import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Users, BookOpen, ChevronDown, Mail } from 'lucide-react';
import { getTeacherStudents } from '../../api/services';

export default function TeacherStudents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getTeacherStudents()
      .then(r => {
        setData(r.data || []);
        if (r.data?.length > 0) setSelectedModule(r.data[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const students = selectedModule?.students || [];
  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const totalStudents = new Set(data.flatMap(d => d.students.map(s => s.id))).size;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-10 py-5 sticky top-0 z-20 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Espace Enseignant</span>
        <h1 className="text-xl font-black text-slate-800">Mes Étudiants</h1>
      </div>

      <div className="px-6 md:px-10 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm"><Users size={16} /></div>
              <div>
                <p className="text-xl font-black text-slate-800">{totalStudents}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Étudiants uniques</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-sm"><BookOpen size={16} /></div>
              <div>
                <p className="text-xl font-black text-slate-800">{data.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Modules</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm"><GraduationCap size={16} /></div>
              <div>
                <p className="text-xl font-black text-slate-800">{selectedModule?.students?.length || 0}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Module actuel</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">Chargement...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center shadow-sm">
            <Users size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-500">Aucun étudiant trouvé.</p>
            <p className="text-xs text-slate-400 mt-1">Vous n'êtes assigné à aucun module pour le moment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
            {/* Module tabs + Search */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-2 flex-wrap">
                {data.map(mod => (
                  <button
                    key={mod.module_id}
                    onClick={() => setSelectedModule(mod)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedModule?.module_id === mod.module_id
                        ? 'bg-[#7c3aed] text-white shadow-md shadow-violet-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-[#7c3aed]'
                    }`}
                  >
                    {mod.module_name}
                    <span className="ml-1.5 opacity-70">({mod.students?.length || 0})</span>
                  </button>
                ))}
              </div>
              <div className="relative md:w-60">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Chercher un étudiant..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>
            </div>

            {/* Level info */}
            {selectedModule && (
              <div className="px-5 py-3 bg-violet-50/50 border-b border-slate-100 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-600">
                  {selectedModule.level_name}
                </span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-[10px] font-bold text-slate-500">
                  {filtered.length} étudiant(s) affiché(s)
                </span>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">
                    <th className="px-6 py-4 w-12">#</th>
                    <th className="px-6 py-4">Étudiant</th>
                    <th className="px-6 py-4">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/80">
                  {filtered.map((s, i) => {
                    const initials = `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase();
                    return (
                      <tr key={s.id} className="hover:bg-violet-50/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-300">{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-800">{s.first_name} {s.last_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={12} className="text-slate-400" />
                            {s.email}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-xs font-bold">
                        Aucun étudiant trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
