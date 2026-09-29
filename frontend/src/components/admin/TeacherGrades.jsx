import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, 
  Search, RefreshCw, BarChart3, Filter, Award, BookOpen, 
  GraduationCap, Calendar, Users, ArrowUpRight, Sparkles,
  Layers, ChevronDown
} from 'lucide-react';
import { getTeacherModules, uploadGradesExcel, getTeacherGrades, getModuleStudentsTemplate } from '../../api/services';

const GRADE_TYPES = [
  { value: 'exam', label: 'Examen Final', icon: '📝', color: 'bg-brand-100 text-brand-700 border-brand-200' },
  { value: 'td',   label: 'Travaux Dirigés (TD)', icon: '📖', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'tp',   label: 'Travaux Pratiques (TP)', icon: '🔬', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

const getScoreColor = (score) => {
  if (score === undefined || score === null) return { text: 'text-slate-400', bg: 'bg-slate-100 text-slate-600', border: 'border-slate-200', label: '—' };
  if (score >= 16) return { text: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200', label: 'Très Bien' };
  if (score >= 14) return { text: 'text-blue-600', bg: 'bg-blue-50 text-blue-700', border: 'border-blue-200', label: 'Bien' };
  if (score >= 12) return { text: 'text-brand-600', bg: 'bg-brand-50 text-brand-700', border: 'border-brand-200', label: 'Assez Bien' };
  if (score >= 10) return { text: 'text-amber-600', bg: 'bg-amber-50 text-amber-700', border: 'border-amber-200', label: 'Passable' };
  return { text: 'text-rose-600', bg: 'bg-rose-50 text-rose-700', border: 'border-rose-200', label: 'Ajourné' };
};

export default function TeacherGrades() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [gradeType, setGradeType] = useState('exam');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [filterModule, setFilterModule] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'list'
  const fileInputRef = useRef(null);

  useEffect(() => {
    getTeacherModules().then(r => {
      const mods = r.data || [];
      setModules(mods);
      if (mods.length > 0 && !selectedModule) {
        setSelectedModule(mods[0].id.toString());
      }
    }).catch(console.error);

    loadGrades();
  }, []);

  const loadGrades = (modId = '', gType = '') => {
    setLoadingGrades(true);
    getTeacherGrades(modId || null, gType || null)
      .then(r => setGrades(r.data || []))
      .catch(() => setGrades([]))
      .finally(() => setLoadingGrades(false));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f);
    }
  };

  const handleUpload = async (e) => {
    if (e) e.preventDefault();
    if (!selectedModule) { alert('Veuillez sélectionner un module'); return; }
    if (!file) { alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)'); return; }

    setUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadGradesExcel(parseInt(selectedModule), gradeType, academicYear, file);
      setUploadResult({
        success: true,
        ...res.data
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadGrades(filterModule, filterType);
    } catch (err) {
      setUploadResult({
        success: false,
        imported: 0,
        updated: 0,
        errors: 1,
        message: err.response?.data?.detail || "Erreur lors de l'importation des notes",
        error_details: [err.response?.data?.detail || "Erreur inconnue"]
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      if (selectedModule) {
        const res = await getModuleStudentsTemplate(selectedModule);
        const students = res.data || [];
        if (students.length > 0) {
          const rows = [
            ['id_etudiant', 'nom', 'prenom', 'email', 'note'],
            ...students.map(s => [s.id, s.last_name, s.first_name, s.email, ''])
          ];
          const csvContent = "\uFEFF" + rows.map(r => r.map(cell => `"${cell}"`).join(';')).join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const currentMod = modules.find(m => m.id.toString() === selectedModule.toString());
          const modName = currentMod ? currentMod.name.replace(/[^a-zA-Z0-9]/g, '_') : 'module';
          a.download = `liste_etudiants_${modName}_${gradeType}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
      }
    } catch (e) {
      console.error("Error generating student template:", e);
    }

    // Default template fallback
    const rows = [
      ['id_etudiant', 'nom', 'prenom', 'note'],
      ['1', 'Benali', 'Ahmed', '15.5'],
      ['2', 'Meziane', 'Sara', '12.0'],
      ['3', 'Hadj', 'Karim', '09.5'],
    ];
    const csvContent = "\uFEFF" + rows.map(r => r.map(cell => `"${cell}"`).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modele_notes_${gradeType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered grades
  const filteredGrades = grades.filter(g => {
    if (filterModule && g.module_id.toString() !== filterModule) return false;
    if (filterType && g.grade_type !== filterType) return false;
    if (searchTerm) {
      const studentName = `${g.student?.first_name || ''} ${g.student?.last_name || ''}`.toLowerCase();
      const studentEmail = (g.student?.email || '').toLowerCase();
      const s = searchTerm.toLowerCase();
      if (!studentName.includes(s) && !studentEmail.includes(s)) return false;
    }
    return true;
  });

  // Calculate quick stats
  const totalNotes = grades.length;
  const passedNotes = grades.filter(g => g.score >= 10).length;
  const passRate = totalNotes > 0 ? Math.round((passedNotes / totalNotes) * 100) : 0;
  const averageScore = totalNotes > 0 ? (grades.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalNotes).toFixed(2) : '—';

  return (
    <div className="flex-1 overflow-y-auto min-h-screen bg-[#f5f3ff] p-6 md:p-10 font-sans relative">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-80 left-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8 animate-fade-in-up">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 font-extrabold text-xs uppercase tracking-wider mb-2">
              <Award size={13} className="text-brand-600" />
              Évaluations & Examens
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Gestion des Notes & Délibérations
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Importez, modifiez et publiez les notes de vos étudiants par module en quelques clics.
            </p>
          </div>

          <button
            onClick={downloadTemplate}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-brand-200 text-brand-700 font-bold text-xs rounded-2xl shadow-xs hover:shadow transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Download size={15} />
            Télécharger le Modèle Excel
          </button>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-brand-100 shadow-xl shadow-brand-950/5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modules Enseignés</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{modules.length}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-brand-100 shadow-xl shadow-brand-950/5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Notes Saisies</p>
            <p className="text-2xl font-black text-brand-700 mt-1">{totalNotes}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-brand-100 shadow-xl shadow-brand-950/5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Moyenne Générale</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{averageScore} <span className="text-xs font-bold text-slate-400">/20</span></p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-brand-100 shadow-xl shadow-brand-950/5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux de Réussite</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{passRate}%</p>
          </div>
        </div>

        {/* ── NAVIGATION TABS ── */}
        <div className="flex p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-brand-100 shadow-sm max-w-md">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
              activeTab === 'upload'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/50'
            }`}
          >
            <Upload size={15} />
            Importer / Modifier
          </button>
          <button
            onClick={() => {
              setActiveTab('list');
              loadGrades(filterModule, filterType);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
              activeTab === 'list'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/50'
            }`}
          >
            <BookOpen size={15} />
            Notes Publiées ({grades.length})
          </button>
        </div>

        {/* ── TAB CONTENT 1: UPLOAD / EDIT GRADES ── */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
            
            {/* Form Section */}
            <div className="lg:col-span-7 bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-brand-950/5 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Paramètres du Fichier de Notes</h3>
                  <p className="text-xs text-slate-500 font-medium">Sélectionnez le module et téléversez le tableau Excel.</p>
                </div>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                {/* Module selection */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Module Concerné *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      required
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">— Sélectionner un module —</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.level?.name ? `(${m.level.name})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Type de note */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Type d'Évaluation *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {GRADE_TYPES.map((gt) => {
                      const isSelected = gradeType === gt.value;
                      return (
                        <button
                          key={gt.value}
                          type="button"
                          onClick={() => setGradeType(gt.value)}
                          className={`py-3 px-2 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-base">{gt.icon}</span>
                          <span className="truncate">{gt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Année Académique */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Année Universitaire
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2024-2025"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>

                {/* Drag & Drop Zone */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Fichier Excel (.xlsx, .xls) *
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                        : file
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : 'border-slate-200 bg-slate-50/80 hover:bg-slate-50 hover:border-brand-300'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-600 border border-slate-100">
                      {file ? <CheckCircle size={28} className="text-emerald-500" /> : <Upload size={24} />}
                    </div>

                    <p className="text-xs font-black text-slate-800">
                      {file ? file.name : "Glissez-déposez votre fichier Excel ici"}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                      {file ? `${(file.size / 1024).toFixed(1)} Ko • Prêt à l'envoi` : "ou cliquez pour parcourir vos fichiers"}
                    </p>
                  </div>
                </div>

                {/* Upload Action Button */}
                <button
                  type="submit"
                  disabled={uploading || !file || !selectedModule}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-700 hover:to-accent-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-brand-600/20 hover:shadow-brand-600/35 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploading ? "Traitement et validation des notes..." : "Importer & Publier les Notes"}
                </button>
              </form>
            </div>

            {/* Right Guide & Feedback Section */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Feedback Banner */}
              {uploadResult && (
                <div className={`p-6 rounded-3xl border shadow-xl shadow-brand-950/5 animate-fade-in-up ${
                  uploadResult.success !== false
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/90 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      uploadResult.success !== false ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                    }`}>
                      {uploadResult.success !== false ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    </div>
                    <h4 className="text-sm font-black">
                      {uploadResult.success !== false ? "Importation Réussie !" : "Erreur lors de l'import"}
                    </h4>
                  </div>

                  <p className="text-xs font-semibold mb-3">{uploadResult.message}</p>

                  {uploadResult.error_details && uploadResult.error_details.length > 0 && (
                    <div className="bg-white/80 p-3 rounded-2xl text-[11px] font-medium text-rose-700 space-y-1 max-h-40 overflow-y-auto">
                      {uploadResult.error_details.map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  )}

                  {uploadResult.success !== false && (
                    <button
                      onClick={() => setActiveTab('list')}
                      className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all"
                    >
                      Consulter les notes publiées →
                    </button>
                  )}
                </div>
              )}

              {/* Instructions Card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-brand-100 shadow-xl shadow-brand-950/5 p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-brand-900 uppercase tracking-wider">
                  <Sparkles size={16} className="text-brand-600" />
                  Identification Flexible des Étudiants
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Le système reconnaît automatiquement les étudiants selon vos données :
                </p>

                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 font-mono text-[11px] space-y-2">
                  <div className="text-slate-700 font-bold text-[10px] uppercase text-brand-700">Option 1 : Par Numéro / ID</div>
                  <div className="grid grid-cols-2 pb-1 border-b border-slate-200 text-slate-500 font-semibold">
                    <span>id_etudiant</span>
                    <span>note</span>
                  </div>
                  <div className="grid grid-cols-2 text-slate-700">
                    <span>14</span>
                    <span className="font-bold text-emerald-600">16.5</span>
                  </div>

                  <div className="text-slate-700 font-bold text-[10px] uppercase text-brand-700 pt-1">Option 2 : Par Nom & Prénom</div>
                  <div className="grid grid-cols-3 pb-1 border-b border-slate-200 text-slate-500 font-semibold">
                    <span>nom</span>
                    <span>prenom</span>
                    <span>note</span>
                  </div>
                  <div className="grid grid-cols-3 text-slate-700">
                    <span>Benali</span>
                    <span>Ahmed</span>
                    <span className="font-bold text-brand-600">14.0</span>
                  </div>
                </div>

                <ul className="text-xs text-slate-500 space-y-2 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <strong>Conseil Pro :</strong> Cliquez sur <em>"Télécharger le Modèle Excel"</em> pour obtenir la liste déjà pré-remplie de vos étudiants !
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <strong>Modification :</strong> Pour corriger une note, réimportez simplement le fichier mis à jour.
                  </li>
                </ul>
              </div>

            </div>

          </div>
        )}

        {/* ── TAB CONTENT 2: GRADES LIST / CONSULTATION ── */}
        {activeTab === 'list' && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-brand-950/5 p-6 md:p-8 space-y-6 animate-fade-in-up">
            
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
              
              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par étudiant ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              {/* Select filters */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={filterModule}
                  onChange={(e) => {
                    setFilterModule(e.target.value);
                    loadGrades(e.target.value, filterType);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Tous les modules</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    loadGrades(filterModule, e.target.value);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Tous les types</option>
                  <option value="exam">Examen</option>
                  <option value="td">TD</option>
                  <option value="tp">TP</option>
                </select>

                <button
                  onClick={() => loadGrades(filterModule, filterType)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-brand-600 transition-colors shrink-0"
                  title="Actualiser"
                >
                  <RefreshCw size={15} className={loadingGrades ? "animate-spin text-brand-600" : ""} />
                </button>
              </div>

            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 pl-2">Étudiant</th>
                    <th className="pb-3">Module</th>
                    <th className="pb-3">Évaluation</th>
                    <th className="pb-3 text-center">Note /20</th>
                    <th className="pb-3">Mention</th>
                    <th className="pb-3">Année</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGrades.map((g) => {
                    const scoreInfo = getScoreColor(g.score);
                    const studentInitials = `${g.student?.first_name?.[0] || ''}${g.student?.last_name?.[0] || ''}`.toUpperCase() || 'E';

                    return (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                              {studentInitials}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">{g.student?.first_name} {g.student?.last_name}</p>
                              <p className="text-[11px] font-medium text-slate-400">{g.student?.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            <BookOpen size={12} className="text-brand-500" />
                            {g.module?.name || `Module #${g.module_id}`}
                          </span>
                        </td>

                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${
                            g.grade_type === 'exam' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            g.grade_type === 'td' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {g.grade_type === 'exam' ? 'Examen' : g.grade_type === 'td' ? 'TD' : 'TP'}
                          </span>
                        </td>

                        <td className="py-3.5 text-center">
                          <span className={`inline-block px-3 py-1 rounded-xl text-sm font-black ${scoreInfo.bg} ${scoreInfo.text}`}>
                            {Number(g.score).toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5">
                          <span className={`text-xs font-bold ${scoreInfo.text}`}>
                            {scoreInfo.label}
                          </span>
                        </td>

                        <td className="py-3.5 text-xs font-semibold text-slate-400">
                          {g.academic_year || '2024-2025'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredGrades.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Award size={40} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Aucune note enregistrée</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Utilisez l'onglet "Importer / Modifier" pour téléverser votre premier tableau.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
