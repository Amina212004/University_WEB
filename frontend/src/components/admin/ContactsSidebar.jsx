import React from 'react';
import { Search, Bell, MessageSquare } from 'lucide-react';

export default function ContactsSidebar({ users }) {
  // Use first 5 users as mock contacts
  const contacts = users.slice(0, 5).map((u, i) => ({
    id: u.id,
    name: `${u.first_name} ${u.last_name}`,
    role: u.role,
    avatar: null
  }));

  return (
    <div className="w-80 bg-brand-50/50 border-l border-brand-100 flex flex-col h-full overflow-y-auto">
      
      {/* Top Icons */}
      <div className="p-6 flex justify-end gap-3">
        <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-500 shadow-sm transition-colors">
          <MessageSquare size={18} />
        </button>
        <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-500 shadow-sm transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center text-white font-bold ml-2 shadow-sm">
          A
        </div>
      </div>

      <div className="px-6 pb-6 flex-1">
        
        {/* Contacts Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Contacts</h3>
          <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm hover:text-brand-500 transition-colors">
            <Search size={16} />
          </button>
        </div>
        
        <div className="text-xs font-semibold text-slate-400 mb-4">
          Recent Members
        </div>

        {/* Contacts List */}
        <div className="space-y-4">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                {c.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{c.name}</div>
                <div className="text-xs font-medium text-slate-400 capitalize">{c.role}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom Alert/Widget */}
      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl p-5 shadow-sm border border-brand-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-brand-200 rounded-full blur-2xl opacity-50 -mr-10 -mt-10"></div>
           <Bell className="text-brand-400 mb-3" size={24} />
           <h4 className="font-bold text-slate-800 text-sm mb-1 relative z-10">System Update</h4>
           <p className="text-xs text-slate-500 font-medium relative z-10 mb-4">Check out the new features for semester planning.</p>
           <button className="w-8 h-8 bg-brand-900 rounded-full text-white flex items-center justify-center ml-auto hover:bg-brand-800 transition-colors relative z-10">
             →
           </button>
        </div>
      </div>

    </div>
  );
}
