import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, GraduationCap, Calendar, 
  TrendingUp, Activity, Plus 
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { getStudyYears, getUsers, getMyUniversity } from '../../api/services';

export default function Overview({ user }) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    years: 0
  });
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [departments, setDepartments] = useState({});
  const [university, setUniversity] = useState(null);

  useEffect(() => {
    // Fetch some basic stats to display
    const fetchData = async () => {
      try {
        const [studentsRes, teachersRes, yearsRes] = await Promise.all([
          getUsers('student'),
          getUsers('teacher'),
          getStudyYears()
        ]);
        
        if (user?.university_id) {
          getMyUniversity().then(res => setUniversity(res.data)).catch(console.error);
        }

        setStats({
          students: studentsRes.data.length,
          teachers: teachersRes.data.length,
          years: yearsRes.data.length
        });

        // Mix recent users
        const recent = [...studentsRes.data, ...teachersRes.data]
          .sort((a, b) => b.id - a.id)
          .slice(0, 4);
        setRecentUsers(recent);

        // Group study years by name (acting as Department)
        const grouped = {};
        yearsRes.data.forEach(year => {
          if (!grouped[year.name]) {
            grouped[year.name] = [];
          }
          grouped[year.name].push(year.level);
        });
        setDepartments(grouped);

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

  const colors = ['bg-brand-800', 'bg-teal-600', 'bg-emerald-600', 'bg-indigo-600'];

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
        
        {/* Left Column (Cards) */}
        <div className="w-full xl:w-80 flex flex-col gap-4">
          {/* Main University Card (Purple Zone) */}
          <div className="h-44 rounded-2xl bg-brand-900 p-5 text-white flex flex-col justify-between relative overflow-hidden shadow-xl shadow-brand-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-500 rounded-full blur-3xl opacity-30 -ml-10 -mb-10"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="font-bold text-xl">{university?.name || "Université"}</div>
            </div>
            <div className="relative z-10">
              <div className="font-mono text-lg tracking-widest mb-2 shadow-sm">{university?.domain || "Domaine"}</div>
              <div className="flex justify-between text-xs text-white/70">
                <span>{stats.students} inscrits totaux</span>
                <span>Actif</span>
              </div>
            </div>
          </div>

          {/* Render Departments dynamically under the purple card */}
          {Object.entries(departments).map(([deptName, levels], index) => (
            <div key={deptName} className={`min-h-32 rounded-2xl ${colors[index % colors.length] || 'bg-brand-800'} p-5 text-white flex flex-col justify-between relative overflow-hidden shadow-xl shadow-brand-900/10`}>
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwTDIwMCAyMDAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] opacity-50"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="font-bold">{deptName}</div>
              </div>
              <div className="relative z-10 flex flex-wrap gap-2">
                {levels.map((lvl, i) => (
                   <span key={i} className="px-3 py-1 bg-white/20 rounded-lg text-sm font-bold border border-white/10 backdrop-blur-sm">
                     {lvl}
                   </span>
                ))}
              </div>
            </div>
          ))}

          <button className="h-32 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
            <span className="text-2xl mb-1">+</span>
            <span className="text-sm font-semibold">Ajouter une année</span>
          </button>
        </div>

        {/* Right Column (Transactions & Summaries) */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* Transactions Header */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Dernières Activités</h3>
            </div>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="text-sm font-semibold text-slate-400">Total Membres</div>
              <div className="flex items-center gap-2 text-2xl font-black text-slate-800">
                <div className="w-6 h-6 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm shadow-md">U</div>
                {stats.students + stats.teachers} <span className="text-slate-400 text-lg">Actifs</span>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-2">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${u.role === 'teacher' ? 'bg-brand-900 text-white' : 'bg-teal-400 text-white'}`}>
                      {u.role === 'teacher' ? <BookOpen size={18} /> : <GraduationCap size={18} />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Nouvel {u.role === 'teacher' ? 'Enseignant' : 'Étudiant'} ajouté</div>
                      <div className="text-xs text-slate-400 font-medium">{u.first_name} {u.last_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className={`font-bold text-slate-500 capitalize`}>
                      {u.role}
                    </div>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                 <div className="p-4 text-slate-400 text-center">Aucune activité récente.</div>
              )}
            </div>
          </div>

          {/* Quick Summary Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Statistiques Académiques</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Income */}
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

              {/* Expenses */}
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

              {/* Subscriptions */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden h-40 flex flex-col justify-between">
                <div className="flex justify-between items-start z-10 relative">
                  <div>
                    <div className="text-sm font-semibold text-slate-500 mb-1">Filières</div>
                    <div className="text-2xl font-black text-slate-800">{stats.years}</div>
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
