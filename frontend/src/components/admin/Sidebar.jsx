import React from 'react';
import { Home, LayoutGrid, FileText, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { logout } = useAuth();

  const navItems = [
    { id: 'overview', icon: <Home size={20} /> },
    { id: 'teachers', icon: <LayoutGrid size={20} /> },
    { id: 'students', icon: <FileText size={20} /> },
    { id: 'settings', icon: <Settings size={20} /> },
    { id: 'help', icon: <HelpCircle size={20} /> },
  ];

  return (
    <div className="w-24 bg-slate-50 flex flex-col items-center py-8 border-r border-slate-100">
      
      {/* Navigation Pill Container */}
      <div className="bg-brand-900 rounded-full flex flex-col items-center py-6 gap-6 shadow-xl shadow-brand-900/30">
        
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-brand-300 hover:text-white hover:bg-brand-800'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      <div className="mt-auto">
         <button 
          onClick={logout}
          className="w-12 h-12 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
         >
           <LogOut size={20} />
         </button>
      </div>

    </div>
  );
}
