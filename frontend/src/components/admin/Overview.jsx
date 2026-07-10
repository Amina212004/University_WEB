import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, GraduationCap, Calendar, 
  TrendingUp, Activity, Layers, ChevronRight 
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { getAdminStats, getMyUniversity, getAcademicTree } from '../../api/services';

export default function Overview({ user }) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    modules: 0
  });
  
  const [university, setUniversity] = useState(null);
  const [academicTree, setAcademicTree] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.university_id) {
          getMyUniversity().then(res => setUniversity(res.data)).catch(console.error);
          getAcademicTree().then(res => setAcademicTree(res.data)).catch(console.error);
        }
        
        getAdminStats().then(res => setStats(res.data)).catch(console.error);

      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user]);

  const pieData = [
    { name: 'Étudiants', value: stats.students || 1, color: '#00e5ff' },
    { name: 'Professeurs', value: stats.teachers || 1, color: '#e0e7ff' }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">
          Bonjour {user?.first_name}!
        </h2>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center shadow-lg">
            <BookOpen size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left Column (Cards & Hierarchy) */}
        <div className="w-full xl:w-96 flex flex-col gap-6">
          {/* Main University Card (Purple Zone) */}
          <div className="h-44 rounded-2xl bg-brand-900 p-5 text-white flex flex-col justify-between relative overflow-hidden shadow-xl shadow-brand-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-500 rounded-full blur-3xl opacity-30 -ml-10 -mb-10"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="font-bold text-xl">{university?.name || "Université"}</div>
            </div>
            <div className="relative z-10">
              <div className="font-mono text-lg tracking-widest mb-2 shadow-sm">{university?.subdomain || "Domaine"}</div>
              <div className="flex justify-between text-xs text-white/70">
                <span>{stats.students + stats.teachers} membres</span>
                <span>Actif</span>
              </div>
            </div>
          </div>

          {/* Academic Tree */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Layers size={20} className="text-brand-600" /> Structure existante
            </h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {academicTree.map(fac => (
                <div key={fac.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-semibold text-slate-800 flex items-center justify-between border-b border-slate-100">
                    {fac.name}
                  </div>
                  <div className="p-3 space-y-3 bg-white">
                    {fac.departments.length === 0 && <span className="text-sm text-slate-400 italic">Aucun département</span>}
                    {fac.departments.map(dep => (
                      <div key={dep.id} className="pl-2 border-l-2 border-brand-200">
                        <div className="font-medium text-slate-700 text-sm">{dep.name}</div>
                        <div className="mt-2 pl-3 space-y-2">
                          {dep.specialties.length === 0 && <span className="text-xs text-slate-400 italic">Aucune spécialité</span>}
                          {dep.specialties.map(spec => (
                            <div key={spec.id} className="text-xs">
                              <span className="text-slate-500 font-semibold">{spec.name} :</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {spec.levels.length === 0 && <span className="text-slate-400 italic">Aucun niveau</span>}
                                {spec.levels.map(level => (
                                  <span key={level.id} className="bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full">
                                    {level.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {academicTree.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-4 italic">
                  Aucune structure définie.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Transactions & Summaries) */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Quick Summary Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Statistiques de l'Université</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Étudiants */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden h-40 flex flex-col justify-between">
                <div className="flex justify-between items-start z-10 relative">
                  <div>
                    <div className="text-sm font-semibold text-slate-500 mb-1">Étudiants</div>
                    <div className="text-2xl font-black text-slate-800">{stats.students}</div>
                  </div>
                  <GraduationCap size={16} className="text-brand-500" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 w-full -mb-2">
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full text-brand-900 fill-current opacity-90">
                    <path d="M0 40 L0 20 Q15 35, 30 15 T60 25 T100 10 L100 40 Z" />
                  </svg>
                </div>
              </div>

              {/* Professeurs */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden h-40 flex flex-col justify-between">
                <div className="flex justify-between items-start z-10 relative">
                  <div>
                    <div className="text-sm font-semibold text-slate-500 mb-1">Professeurs</div>
                    <div className="text-2xl font-black text-slate-800">{stats.teachers}</div>
                  </div>
                  <BookOpen size={16} className="text-brand-500" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 w-full -mb-2">
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full text-cyan-200 fill-current opacity-70">
                    <path d="M0 40 L0 30 Q15 15, 30 25 T60 15 T100 20 L100 40 Z" />
                  </svg>
                </div>
              </div>

              {/* Modules */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden h-40 flex flex-col justify-between">
                <div className="flex justify-between items-start z-10 relative">
                  <div>
                    <div className="text-sm font-semibold text-slate-500 mb-1">Modules Actifs</div>
                    <div className="text-2xl font-black text-slate-800">{stats.modules}</div>
                  </div>
                  <Activity size={16} className="text-brand-500" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 w-full p-2 flex items-end justify-between gap-1">
                  {[4, 8, 3, 6, 2, 9, 5, 4, 7, 3].map((val, i) => (
                    <div key={i} className="w-full bg-brand-500 rounded-t-sm" style={{ height: `${val * 10}%` }}></div>
                  ))}
                </div>
              </div>

              {/* Graph / Donut */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden h-40 flex flex-col justify-between">
                <div className="flex justify-between items-start z-10 relative">
                  <div className="text-sm font-semibold text-slate-500">Répartition</div>
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <div className="h-24 w-full flex items-center justify-center relative -mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={25} outerRadius={40} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
