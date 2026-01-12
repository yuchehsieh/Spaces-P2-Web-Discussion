
import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Search, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronLeft,
  Building2, 
  Clock, 
  ArrowDown, 
  ArrowUp,
  ExternalLink, 
  History, 
  Lock, 
  Plus, 
  ShieldEllipsis, 
  FileSearch, 
  UserPlus, 
  Mail, 
  Shield, 
  Video, 
  Bell, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Calendar
} from 'lucide-react';
import { MOCK_AUTHORIZATIONS } from '../constants';

type SubNavType = 'authorization';

const AccountTab: React.FC = () => {
  const [activeSubNav, setActiveSubNav] = useState<SubNavType>('authorization');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthId, setSelectedAuthId] = useState<string | null>(null);
  const [viewingDetailId, setViewingDetailId] = useState<string | null>(null);

  const filteredAuths = MOCK_AUTHORIZATIONS.filter(auth => 
    auth.granter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    auth.units.some(u => u.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenDetail = (id: string) => {
    setViewingDetailId(id);
    setSelectedAuthId(null); // Close the expansion card
  };

  const activeAuthDetail = MOCK_AUTHORIZATIONS.find(a => a.id === viewingDetailId);

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden">
      {/* Account Sub-Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0 p-6">
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Lock size={20} />
             </div>
             Account
          </h2>
        </div>
        
        <nav className="space-y-2">
          {[
            { id: 'authorization', label: '授權管理中心', icon: <Key size={18} />, desc: 'Access & Permissions' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveSubNav(item.id as SubNavType); setViewingDetailId(null); }}
              className={`w-full group flex items-start gap-4 px-4 py-4 rounded-2xl transition-all duration-300 border ${
                activeSubNav === item.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]' 
                  : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className={`mt-0.5 p-2 rounded-xl ${activeSubNav === item.id ? 'bg-white/20' : 'bg-slate-800 text-slate-400 group-hover:text-blue-400'}`}>
                {item.icon}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold tracking-tight">{item.label}</div>
                <div className={`text-[10px] font-medium opacity-60 ${activeSubNav === item.id ? 'text-blue-100' : ''}`}>{item.desc}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050914] p-10">
        {activeSubNav === 'authorization' && !viewingDetailId && (
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header section optimized for Web */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-800/50">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                  Authorization Management <span className="text-blue-600">.</span>
                </h1>
                <p className="text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
                  管理您的據點訪問權限，每一項授權代表您對特定站點或區域的監控與操作權力。
                  權限的最小單位為分區 (Zone)，可由個人、據點負責人或系統管理員發起授權。
                </p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="px-5 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-slate-400 text-xs font-black tracking-widest uppercase">
                    Total: {MOCK_AUTHORIZATIONS.length} Grants
                 </div>
              </div>
            </div>

            {/* Filters & Search Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-10">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="搜尋授權者名稱、據點名稱或類型..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all shadow-xl" 
                />
                <Search size={20} className="absolute left-4 top-4 text-slate-600" />
              </div>
              <button className="px-6 py-4 bg-[#111827] border border-slate-700 rounded-2xl text-slate-400 hover:text-white transition-all flex items-center gap-3 text-sm font-bold">
                <History size={18}/> 歷史變更紀錄
              </button>
            </div>

            {/* Authorization List - Web Optimized Layout (Grid/Cards) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
               {filteredAuths.map((auth) => (
                 <div 
                   key={auth.id}
                   onClick={() => setSelectedAuthId(auth.id === selectedAuthId ? null : auth.id)}
                   className={`group relative overflow-hidden bg-[#111827] border transition-all duration-300 rounded-[2.5rem] p-8 cursor-pointer ${
                     selectedAuthId === auth.id 
                       ? 'border-blue-500 shadow-[0_20px_50px_rgba(37,99,235,0.15)] ring-1 ring-blue-500/30' 
                       : 'border-slate-800 hover:border-slate-600 hover:shadow-2xl'
                   }`}
                 >
                   {/* Background Glow Effect */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full transition-opacity opacity-0 group-hover:opacity-100"></div>
                   
                   <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl ${
                          auth.validity === 'Permanent' 
                            ? 'bg-blue-600 text-white shadow-blue-900/40' 
                            : 'bg-slate-800 text-amber-400 border border-amber-500/20 shadow-black/40'
                        }`}>
                           <Key size={30} />
                        </div>
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Granted By</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                                auth.type === 'System' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                auth.type === 'Corporate' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                'bg-green-500/10 text-green-400 border-green-500/20'
                              }`}>
                                {auth.type}
                              </span>
                           </div>
                           <h3 className="text-2xl font-black text-white tracking-tighter">{auth.granter}</h3>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                           auth.validity === 'Permanent' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                         }`}>
                            <Clock size={12}/> {auth.validity === 'Permanent' ? 'Permanent Access' : `Valid Until: ${auth.validity}`}
                         </div>
                         <button className="p-2 text-slate-600 hover:text-white transition-colors"><MoreHorizontal size={24}/></button>
                      </div>
                   </div>

                   <div className="space-y-4 relative z-10">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">
                         <Building2 size={12}/> Authorized Units ({auth.units.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {auth.units.map((unit, idx) => (
                          <span key={idx} className="px-4 py-2 bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl border border-slate-700/50 transition-colors">
                            {unit}
                          </span>
                        ))}
                      </div>
                   </div>

                   {/* Expandable Details Area */}
                   {selectedAuthId === auth.id && (
                     <div className="mt-8 pt-8 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                           <div className="p-6 bg-black/30 rounded-3xl border border-slate-800/50">
                              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ShieldEllipsis size={14}/> Grant Metadata
                              </span>
                              <div className="space-y-3">
                                 <div className="flex justify-between text-xs"><span className="text-slate-500">Grant Date:</span><span className="text-slate-300 font-mono font-bold">{auth.grantDate}</span></div>
                                 <div className="flex justify-between text-xs"><span className="text-slate-500">Permissions:</span><span className="text-blue-400 font-black">FULL_VIEW / CONTROL</span></div>
                                 <div className="flex justify-between text-xs"><span className="text-slate-500">Security Node:</span><span className="text-slate-300 font-bold">SKS-INTERNAL-V4</span></div>
                              </div>
                           </div>
                           <div className="flex flex-col gap-3 justify-center">
                              <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 border border-slate-700 shadow-xl">
                                 <ExternalLink size={18}/> 檢視授權證書
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenDetail(auth.id); }}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/30"
                              >
                                 <FileSearch size={18}/> 查看授權細節
                              </button>
                              <button className="w-full py-4 bg-transparent hover:bg-white/5 text-slate-300 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 border border-slate-700/50 border-dashed">
                                 <UserPlus size={18}/> 為他人授權
                              </button>
                           </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                           <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                             COLLAPSE DETAILS <ArrowUp size={14} />
                           </div>
                        </div>
                     </div>
                   )}

                   {!selectedAuthId && (
                     <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none">
                        <div className="flex items-center gap-2 text-xs font-black text-blue-500 uppercase tracking-[0.2em]">
                           VIEW FULL GRANT DETAILS <ArrowDown size={14}/>
                        </div>
                     </div>
                   )}
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* --- Authorization Details View --- */}
        {viewingDetailId && activeAuthDetail && (
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex items-center gap-4 mb-10">
                <button 
                  onClick={() => setViewingDetailId(null)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all shadow-xl"
                >
                   <ChevronLeft size={24} />
                </button>
                <div className="h-10 w-px bg-slate-800 mx-2"></div>
                <div>
                   <h1 className="text-3xl font-black text-white tracking-tighter">授予權限詳情 <span className="text-blue-600">.</span></h1>
                   <p className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">Granted by {activeAuthDetail.granter}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                {/* Left Column: Identity & Scope */}
                <div className="space-y-8 lg:col-span-1">
                   <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full"></div>
                      <div className="flex items-center gap-6 mb-10 relative z-10">
                         <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-900/40">
                            <Key size={40} />
                         </div>
                         <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter mb-1">{activeAuthDetail.granter}</h2>
                            <span className="text-[10px] font-black px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 uppercase tracking-widest">{activeAuthDetail.type} PROVIDER</span>
                         </div>
                      </div>

                      <div className="space-y-6 relative z-10">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Authorized From (Email)</label>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center gap-3">
                               <Mail size={16} className="text-slate-500" />
                               <span className="text-sm font-bold text-slate-300">{activeAuthDetail.email}</span>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Access Scope (Units)</label>
                            <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-wrap gap-2">
                               {activeAuthDetail.units.map(unit => (
                                 <span key={unit} className="px-3 py-1 bg-slate-800 text-[11px] font-bold text-slate-300 rounded-lg border border-slate-700/50">{unit}</span>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-4">
                      <button className="w-full py-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 border border-blue-500/20">
                         <UserPlus size={18} /> 為他人授權
                      </button>
                      <button className="w-full py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 border border-red-500/20 shadow-xl shadow-red-900/10">
                         <Trash2 size={18} /> 終止此項授權
                      </button>
                   </div>
                </div>

                {/* Right Column: Permission Matrix */}
                <div className="lg:col-span-2 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <ReadOnlyToggle icon={<Lock size={18}/>} label="Enabled" active={activeAuthDetail.permissions.enabled} color="green" />
                      <ReadOnlyToggle 
                        icon={<Clock size={18}/>} 
                        label="Permanent" 
                        active={activeAuthDetail.permissions.permanent} 
                        color="blue" 
                        validity={activeAuthDetail.validity}
                      />
                      <ReadOnlyToggle icon={<History size={18}/>} label="Allow Re-sharing" active={activeAuthDetail.permissions.allowResharing} color="purple" />
                   </div>

                   {/* Permission Sections */}
                   <div className="space-y-8">
                      {/* Security Permissions */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                         <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                               <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tighter">安防權限 (Security Permissions)</h3>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <PermissionItem label="View" active={activeAuthDetail.permissions.security.view} />
                            <PermissionItem label="Settings" active={activeAuthDetail.permissions.security.settings} />
                            <PermissionItem label="Schedule" active={activeAuthDetail.permissions.security.schedule} />
                            <PermissionItem label="Security Card Edit" active={activeAuthDetail.permissions.security.cardEdit} />
                            <PermissionItem label="Emergency Contact Edit" active={activeAuthDetail.permissions.security.contactEdit} />
                         </div>
                      </div>

                      {/* Camera Permissions */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                         <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                               <Video size={24} />
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tighter">影像監控 (Camera Permissions)</h3>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <PermissionItem label="View" active={activeAuthDetail.permissions.camera.view} />
                            <PermissionItem label="Settings" active={activeAuthDetail.permissions.camera.settings} />
                            <PermissionItem label="PTZ" active={activeAuthDetail.permissions.camera.ptz} />
                            <PermissionItem label="View Playback" active={activeAuthDetail.permissions.camera.playback} />
                         </div>
                      </div>

                      {/* Event Permissions */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                         <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl">
                               <Bell size={24} />
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tighter">事件告警 (Events Permissions)</h3>
                         </div>
                         <div className="grid grid-cols-1">
                            <PermissionItem label="Event Notification & Logs" active={activeAuthDetail.permissions.events} />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components for Detail View ---

const ReadOnlyToggle: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  color: 'green' | 'blue' | 'purple';
  validity?: string;
}> = ({ icon, label, active, color, validity }) => {
  const colors = {
    green: active ? 'bg-green-500 shadow-green-900/30' : 'bg-slate-800',
    blue: active ? 'bg-blue-500 shadow-blue-900/30' : 'bg-slate-800',
    purple: active ? 'bg-purple-500 shadow-purple-900/30' : 'bg-slate-800'
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-[2rem] p-6 flex flex-col gap-4 group shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className={`p-3 rounded-2xl ${active ? 'bg-white/10 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {icon}
           </div>
           <span className={`text-sm font-black uppercase tracking-widest ${active ? 'text-slate-100' : 'text-slate-400'}`}>{label}</span>
        </div>
        <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? colors[color] : 'bg-slate-800'}`}>
           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${active ? 'left-7' : 'left-1'}`}></div>
        </div>
      </div>
      
      {/* If not permanent, show validity date */}
      {!active && label === "Permanent" && validity && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-800/50">
           <Calendar size={12} className="text-amber-500" />
           <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">
             Valid Until: {validity}
           </span>
        </div>
      )}
    </div>
  );
};

const PermissionItem: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${active ? 'bg-slate-900/50 border-slate-700/50' : 'bg-black/10 border-slate-800/50'}`}>
     <span className={`text-xs font-bold tracking-tight ${active ? 'text-slate-200' : 'text-slate-400'}`}>{label}</span>
     {active ? <CheckCircle2 size={20} className="text-blue-500" /> : <XCircle size={20} className="text-slate-700" />}
  </div>
);

export default AccountTab;
