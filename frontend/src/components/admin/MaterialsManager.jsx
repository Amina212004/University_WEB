import React, { useState, useEffect, useRef } from 'react';
import { getFaculties, getDepartments, getSpecialties, getLevels, getSemestersByLevel, getSemesterModules, uploadMaterial, getModuleMaterials, deleteMaterial } from '../../api/services';
import { BookOpen, FileText, Upload, Trash2, Download, AlertTriangle, X, File, FileCode, CheckCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MaterialsManager() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  
  // Hierarchy state
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [modules, setModules] = useState([]);
  
  const [selectedFac, setSelectedFac] = useState('');
  const [selectedDep, setSelectedDep] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', material_type: 'cours', module_id: '' });
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Delete state
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, title: '' });
  const fileRef = useRef();

  useEffect(() => {
    loadFaculties();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchMaterials();
    } else {
      setMaterials([]);
    }
  }, [selectedModule]);

  const loadFaculties = async () => {
    try {
      const res = await getFaculties();
      setFaculties(res.data);
    } catch (err) { console.error(err); }
  };

  const handleFacChange = async (e) => {
    const val = e.target.value; setSelectedFac(val);
    setSelectedDep(''); setSelectedSpec(''); setSelectedLevel(''); setSelectedSemester(''); setSelectedModule('');
    setDepartments([]); setSpecialties([]); setLevels([]); setSemesters([]); setModules([]);
    if (val) { const res = await getDepartments(val); setDepartments(res.data); }
  };

  const handleDepChange = async (e) => {
    const val = e.target.value; setSelectedDep(val);
    setSelectedSpec(''); setSelectedLevel(''); setSelectedSemester(''); setSelectedModule('');
    setSpecialties([]); setLevels([]); setSemesters([]); setModules([]);
    if (val) { const res = await getSpecialties(val); setSpecialties(res.data); }
  };

  const handleSpecChange = async (e) => {
    const val = e.target.value; setSelectedSpec(val);
    setSelectedLevel(''); setSelectedSemester(''); setSelectedModule('');
    setLevels([]); setSemesters([]); setModules([]);
    if (val) { const res = await getLevels(val); setLevels(res.data); }
  };

  const handleLevelChange = async (e) => {
    const val = e.target.value; setSelectedLevel(val);
    setSelectedSemester(''); setSelectedModule('');
    setSemesters([]); setModules([]);
    if (val) { const res = await getSemestersByLevel(val); setSemesters(res.data); }
  };

  const handleSemesterChange = async (e) => {
    const val = e.target.value; setSelectedSemester(val);
    setSelectedModule(''); setModules([]);
    if (val) { const res = await getSemesterModules(val); setModules(res.data); }
  };

  const fetchMaterials = async () => {
    try {
      const res = await getModuleMaterials(selectedModule);
      setMaterials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedModule) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('material_type', uploadData.material_type);
      formData.append('module_id', selectedModule);
      formData.append('file', file);
      
      await uploadMaterial(formData);
      setIsUploadModalOpen(false);
      setFile(null);
      setUploadData({ title: '', material_type: 'cours', module_id: selectedModule });
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMaterial(confirmDelete.id);
      setConfirmDelete({ isOpen: false, id: null, title: '' });
      fetchMaterials();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'cours': return <BookOpen size={20} className="text-brand-500" />;
      case 'td': return <FileCode size={20} className="text-emerald-500" />;
      case 'tp': return <FileText size={20} className="text-amber-500" />;
      default: return <File size={20} className="text-slate-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'cours': return 'Cours';
      case 'td': return 'Fiche TD';
      case 'tp': return 'Fiche TP';
      default: return 'Autre Document';
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto min-h-screen relative" style={{ background: '#f4f5f9' }}>
      {/* Background aurora blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-20 right-10 w-80 h-80 rounded-full blur-[130px] opacity-15"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, #3b82f6 100%)' }} />
        <div className="absolute bottom-10 left-20 w-96 h-96 rounded-full blur-[130px] opacity-15"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, #8b5cf6 100%)' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">Espace Professeur</span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">Matériels Pédagogiques</h2>
            <p className="text-slate-400 mt-1 text-sm font-medium">Partagez vos cours, fiches TD et TP avec vos étudiants.</p>
          </div>
          
          {(user.role === 'teacher' || user.role === 'admin') && (
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                disabled={!selectedModule}
                className={`text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${selectedModule ? 'hover:scale-[1.02] active:scale-95 shadow-md hover:opacity-90' : 'opacity-50 cursor-not-allowed'}`}
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                <Upload size={16} /> Ajouter un document
              </button>
            </div>
          )}
        </div>

        {/* ── SELECTION ── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600"><BookOpen size={16} /></div>
            <h3 className="font-black text-slate-700 text-sm">Sélection du module cible</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <select value={selectedFac} onChange={handleFacChange} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500">
              <option value="">Faculté...</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select value={selectedDep} onChange={handleDepChange} disabled={!selectedFac} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 disabled:opacity-50">
              <option value="">Département...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={selectedSpec} onChange={handleSpecChange} disabled={!selectedDep} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 disabled:opacity-50">
              <option value="">Spécialité...</option>
              {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedLevel} onChange={handleLevelChange} disabled={!selectedSpec} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 disabled:opacity-50">
              <option value="">Niveau...</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select value={selectedSemester} onChange={handleSemesterChange} disabled={!selectedLevel} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 disabled:opacity-50">
              <option value="">Semestre...</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedModule} onChange={e => setSelectedModule(e.target.value)} disabled={!selectedSemester} className={`bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-brand-500 disabled:opacity-50 ${selectedModule ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-700'}`}>
              <option value="">Module...</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── DOCUMENTS LIST ── */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm min-h-[400px]">
          {selectedModule ? (
            <div>
              <h3 className="font-black text-slate-800 mb-4">Documents disponibles ({materials.length})</h3>
              
              {materials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map(mat => (
                    <div key={mat.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow group bg-slate-50/50">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
                          {getIconForType(mat.material_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                            {getTypeLabel(mat.material_type)}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm truncate" title={mat.title}>{mat.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Ajouté le {new Date(mat.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                        <a 
                          href={`http://127.0.0.1:8000${mat.file_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Download size={14} /> Ouvrir
                        </a>
                        
                        {(user.role === 'teacher' || user.role === 'admin') && (
                          <button 
                            onClick={() => setConfirmDelete({ isOpen: true, id: mat.id, title: mat.title })}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <FileText size={24} className="text-slate-300" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-600 mb-1">Aucun document partagé</h4>
                  <p className="text-xs text-slate-400">Cliquez sur "Ajouter un document" pour partager des fichiers avec vos étudiants.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24 h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-brand-300" />
              </div>
              <h4 className="text-lg font-black text-slate-700 mb-2">Sélectionnez un module</h4>
              <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">Veuillez parcourir la structure académique en haut pour choisir un module avant de pouvoir gérer ses documents.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: UPLOAD ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Upload size={16} className="text-brand-600" />
                </div>
                Partager un document
              </h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Titre du document</label>
                <input 
                  type="text" required 
                  value={uploadData.title} 
                  onChange={e => setUploadData({...uploadData, title: e.target.value})}
                  placeholder="ex: Chapitre 1 - Introduction"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 transition-all" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de document</label>
                <select 
                  value={uploadData.material_type}
                  onChange={e => setUploadData({...uploadData, material_type: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 transition-all" 
                >
                  <option value="cours">Cours</option>
                  <option value="td">Fiche TD</option>
                  <option value="tp">Fiche TP</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fichier (PDF, Docx...)</label>
                <div 
                  className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => !file && fileRef.current?.click()}
                >
                  <input type="file" ref={fileRef} className="hidden" onChange={e => setFile(e.target.files[0])} required />
                  {file ? (
                    <div>
                      <CheckCircle className="text-emerald-500 mx-auto mb-2" size={24} />
                      <p className="text-slate-800 font-black text-sm truncate">{file.name}</p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-[10px] font-bold text-rose-500 mt-2 hover:underline">Retirer le fichier</button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="text-slate-400 mx-auto mb-2" size={24} />
                      <p className="text-slate-600 font-bold text-xs">Cliquez pour choisir un fichier</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-5 py-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isUploading || !file} className="text-white px-7 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                  {isUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                  Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SUPPRIMER ── */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={30} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Supprimer le document ?</h2>
            <p className="text-slate-500 mb-6 text-xs font-semibold leading-relaxed">
              Voulez-vous vraiment supprimer le fichier <span className="font-black text-slate-700">{confirmDelete.title}</span> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete({ isOpen: false, id: null, title: '' })} className="flex-1 py-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-white bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-xs shadow-md shadow-rose-400/20 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
