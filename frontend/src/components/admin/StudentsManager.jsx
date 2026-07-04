import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, createUsersBulk, autoGroupStudents, getStudyYears } from '../../api/services';
import { Users, Plus, Trash2, Mail, Zap } from 'lucide-react';

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importResults, setImportResults] = useState(null);

  const fetchStudentsAndYears = async () => {
    try {
      const [sRes, yRes] = await Promise.all([
        getUsers('student'),
        getStudyYears()
      ]);
      setStudents(sRes.data);
      setYears(yRes.data);
      if (yRes.data.length > 0 && !selectedYearId) {
        setSelectedYearId(yRes.data[0].id.toString());
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchStudentsAndYears();
  }, []);

  const handleBulkImport = async (e) => {
    e.preventDefault();
    try {
      const lines = importData.trim().split('\n');
      const payload = lines.map(line => {
        const [first_name, last_name, email] = line.split(',');
        return {
          first_name: first_name?.trim(),
          last_name: last_name?.trim(),
          email: email?.trim(),
          role: 'student',
          study_year_id: parseInt(selectedYearId) || null
        };
      }).filter(u => u.first_name && u.email);

      const res = await createUsersBulk(payload);
      setImportResults(res.data);
      fetchStudentsAndYears();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'importation');
    }
  };

  const handleAutoGroup = async () => {
    if (!selectedYearId) return alert("Sélectionnez une année d'étude");
    if (!confirm("Voulez-vous répartir tous les étudiants non groupés de cette année par ordre alphabétique ? (Sections de 100, Groupes de 25)")) return;
    
    try {
      const res = await autoGroupStudents(selectedYearId);
      alert(res.data.message);
      fetchStudentsAndYears();
    } catch(err) {
      alert("Erreur lors du groupement");
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des Étudiants</h2>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-semibold text-slate-700 outline-none shadow-sm"
          >
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          
          <button 
            onClick={handleAutoGroup}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Zap size={18} /> Répartition Automatique
          </button>
          
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={18} /> Importer (CSV)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Étudiant</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Année</th>
              <th className="px-6 py-4 font-semibold">Section & Groupe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                      {s.first_name[0]}{s.last_name[0]}
                    </div>
                    <div className="font-semibold text-slate-900">{s.first_name} {s.last_name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  <div className="flex items-center gap-2"><Mail size={14} /> {s.email}</div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                  {years.find(y => y.id === s.study_year_id)?.name || "-"}
                </td>
                <td className="px-6 py-4">
                  {s.group_id ? (
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                      Groupe {s.group_id}
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
                      Non assigné
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-400">Aucun étudiant trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Import en masse d'étudiants</h2>
              <button onClick={() => { setIsImportModalOpen(false); setImportResults(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!importResults ? (
                <form onSubmit={handleBulkImport}>
                  <p className="text-sm text-slate-500 mb-4">
                    Collez vos données au format CSV (Prénom,Nom,Email,ID_Année).
                  </p>
                  <textarea
                    className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 font-mono text-sm"
                    placeholder="Jean,Dupont,jean@mail.com,1&#10;Marie,Curie,marie@mail.com,1"
                    value={importData}
                    onChange={e => setImportData(e.target.value)}
                    required
                  />
                  <div className="mt-4 flex justify-end">
                    <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-medium">Lancer l'import</button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 font-medium">
                    ✅ {importResults.imported} étudiants importés avec succès.
                  </div>
                  <h3 className="font-bold text-slate-800 mb-3">Mots de passe générés (Sauvegardez ceci !)</h3>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-sm overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-700">
                          <th className="pb-2">Nom</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Mot de passe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.users.map((u, i) => (
                          <tr key={i}>
                            <td className="py-2">{u.first_name} {u.last_name}</td>
                            <td className="py-2">{u.email}</td>
                            <td className="py-2 font-bold text-emerald-400 select-all">{u.generated_password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
