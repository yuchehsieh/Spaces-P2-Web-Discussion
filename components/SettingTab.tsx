
import React, { useState, useMemo } from 'react';
import { 
  User, 
  FileText, 
  ChevronRight, 
  Download, 
  Camera, 
  Grid2x2, 
  Lock, 
  Phone, 
  Bell, 
  LogOut, 
  Search,
  Mail,
  ShieldCheck,
  Zap,
  Filter,
  MoreHorizontal,
  Globe,
  Facebook,
  History,
  Trash2,
  Calendar,
  Settings2,
  AlertCircle
} from 'lucide-react';
import { MOCK_SYSTEM_LOGS } from '../constants';

type SubNavType = 'account' | 'logs';
type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR';

const SettingTab: React.FC = () => {
  const [activeSubNav, setActiveSubNav] = useState<SubNavType>('account');
  const [logFilter, setLogFilter] = useState<LogLevel>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogMenu, setShowLogMenu] = useState(false);

  // Filter logs based on search and level
  const filteredLogs = useMemo(() => {
    return MOCK_SYSTEM_LOGS.filter(log => {
      const matchesLevel = logFilter === 'ALL' || log.level === logFilter;
      const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logFilter, searchTerm]);

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden">
      {/* Left Navigation: Web Optimized Vertical Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0 p-6">
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
                <ShieldCheck size={20} />
             </div>
             Settings
          </h2>
        </div>
        
        <nav className="space-y-2">
          {[
            { id: 'account', label: '個人帳戶資訊', icon: <User size={18} />, desc: 'Profile & Security' },
            { id: 'logs', label: '系統操作日誌', icon: <FileText size={18} />, desc: 'System Audit Logs' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveSubNav(item.id as SubNavType)}
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

        <div className="mt-auto p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50">
           <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Node Status</div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Synced (V2.4.8)</span>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050914]">
        {activeSubNav === 'account' ? (
          <div className="w-full max-w-[1400px] mx-auto p-10 animate-in fade-in slide-in-from-right-4 duration-500">
             
             {/* Profile Banner */}
             <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-[#c6e9ec] via-[#f1f9f9] to-[#d1e8f5] p-12 mb-10 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex items-center gap-10 relative z-10">
                   <div className="relative">
                      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center border-8 border-white shadow-2xl overflow-hidden ring-4 ring-blue-500/10">
                         <User size={64} className="text-slate-300" />
                      </div>
                      <button className="absolute bottom-1 right-1 p-2.5 bg-slate-800 text-white rounded-full border-4 border-white hover:bg-blue-600 transition-all shadow-xl group/btn">
                         <Camera size={18} className="group-hover/btn:scale-110" />
                      </button>
                   </div>
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-4xl font-black text-slate-800 tracking-tighter">Admin <span className="text-blue-500">.</span></h3>
                        <span className="px-3 py-1 bg-blue-600 text-[10px] font-black text-white rounded-lg tracking-widest uppercase shadow-md">SYSTEM OWNER</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white/60 text-[10px] font-black text-slate-600 rounded-lg border border-slate-300 tracking-widest uppercase shadow-sm">Super Admin</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">
                           <Globe size={12}/> Global Node Authority
                        </span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                   <button className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-900/40 tracking-widest uppercase">
                      <Grid2x2 size={18} /> My Access Code
                   </button>
                   <button className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40 tracking-widest uppercase">
                      編輯個人資料
                   </button>
                </div>
             </div>

             {/* 3-Column Grid for Web Layout */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Basic & Identity */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                           <User size={14}/> 基本帳號資訊
                        </h4>
                        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-xl">
                            <SettingBlock icon={<User size={20}/>} label="登入使用者名稱" value="Admin" />
                            <SettingBlock icon={<Mail size={20}/>} label="系統主帳號 (Email)" value="Admin@sks.com.tw" />
                            <SettingBlock icon={<Smartphone size={20}/>} label="手機號碼" value="+886 912-345-678" />
                            <SettingBlock icon={<Lock size={20}/>} label="登入密碼修改" value="上次更換：32天前" action="Change Password" actionClass="text-blue-400" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                           <Globe size={14}/> 社交帳號連動管理
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-[#111827] border border-slate-800 rounded-3xl flex items-center justify-between group hover:border-slate-600 transition-all">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-white/10 text-white rounded-xl"><Globe size={20}/></div>
                                  <div>
                                     <span className="block text-sm font-bold text-slate-200">Google 帳號</span>
                                     <span className="block text-[10px] text-green-500 font-bold uppercase tracking-widest">已連動: Admin@gmail.com</span>
                                  </div>
                               </div>
                               <button className="text-[10px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors">解除連動</button>
                            </div>
                            <div className="p-6 bg-[#111827] border border-slate-800 rounded-3xl flex items-center justify-between group hover:border-slate-600 transition-all">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl"><Facebook size={20}/></div>
                                  <div>
                                     <span className="block text-sm font-bold text-slate-200">Facebook 帳號</span>
                                     <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">尚未連動</span>
                                  </div>
                               </div>
                               <button className="text-[10px] font-black text-blue-500 hover:underline uppercase tracking-widest">立即連動</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Preferences & Security Summary */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                           <Bell size={14}/> 通知與推播設定
                        </h4>
                        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                            <SettingBlock icon={<Bell size={20}/>} label="全域推送頻率" value="Play Once / Each Alarm" action="Edit" />
                            <SettingBlock icon={<Zap size={20}/>} label="快速處置捷徑" value="已啟用系統預設" />
                            <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/20 flex items-center gap-4">
                                <AlertCircle size={20} className="text-blue-400 shrink-0"/>
                                <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                                   管理員權限已偵測到最高安全等級，所有異常將同步推送至您的緊急連絡人。
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                           <ShieldCheck size={14}/> 登入安全紀錄
                        </h4>
                        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl overflow-hidden">
                           <div className="flex items-center gap-3">
                              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                              <div>
                                 <span className="block text-xs font-bold text-slate-200">目前裝置: Chrome / macOS</span>
                                 <span className="block text-[10px] text-slate-500">Taipei, Taiwan • 114.32.XX.XX</span>
                              </div>
                           </div>
                           <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl border border-red-500/20 transition-all text-[11px] font-black uppercase tracking-widest">
                              <LogOut size={16}/> 登出所有其他裝置
                           </button>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="w-full max-w-[1400px] mx-auto p-10 animate-in fade-in slide-in-from-right-4 duration-500">
             
             {/* Large Web-Style Log Header */}
             <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-800/50">
                <div>
                   <h1 className="text-4xl font-black text-white tracking-tighter mb-2">System Audit Logs <span className="text-blue-600">.</span></h1>
                   <p className="text-sm text-slate-500 font-medium">記錄所有操作員、感測器狀態變更與系統自動化任務的執行歷史</p>
                </div>
                <div className="flex items-center gap-3 relative">
                   <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-black transition-all flex items-center gap-2 tracking-widest uppercase border border-slate-700">
                      <Download size={16} className="text-blue-400" /> Export CSV
                   </button>
                   <div className="relative">
                      <button 
                        onClick={() => setShowLogMenu(!showLogMenu)}
                        className={`p-3 rounded-2xl shadow-xl transition-all ${showLogMenu ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                         <MoreHorizontal size={24} />
                      </button>
                      
                      {/* Meatball Menu Dropdown */}
                      {showLogMenu && (
                        <>
                          <div className="fixed inset-0 z-[100]" onClick={() => setShowLogMenu(false)}></div>
                          <div className="absolute right-0 mt-3 w-64 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-200">
                             <div className="p-2 border-b border-slate-700 bg-black/20">
                                <span className="px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">日誌管理功能</span>
                             </div>
                             <div className="p-2">
                                <LogMenuItem icon={<Trash2 size={16} className="text-red-400"/>} label="清空歷史日誌" onClick={() => setShowLogMenu(false)} />
                                <LogMenuItem icon={<Calendar size={16}/>} label="自訂日期範圍篩選" onClick={() => setShowLogMenu(false)} />
                                <LogMenuItem icon={<Settings2 size={16}/>} label="日誌存檔設定 (Auto)" onClick={() => setShowLogMenu(false)} />
                                <LogMenuItem icon={<History size={16} className="text-blue-400"/>} label="查看已存檔數據" onClick={() => setShowLogMenu(false)} />
                             </div>
                          </div>
                        </>
                      )}
                   </div>
                </div>
             </div>

             {/* Professional Data Controls */}
             <div className="bg-[#111827] rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden mb-10">
                <div className="p-6 border-b border-slate-800 flex flex-col lg:flex-row gap-6 items-center">
                   
                   {/* Search */}
                   <div className="relative flex-1 w-full">
                      <input 
                        type="text" 
                        placeholder="搜尋特定的日誌內容、使用者或動作描述..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#050914] border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all shadow-inner" 
                      />
                      <Search size={20} className="absolute left-4 top-3.5 text-slate-600" />
                   </div>

                   {/* Filters */}
                   <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-700 rounded-2xl w-full lg:w-auto overflow-x-auto shrink-0 no-scrollbar">
                      {(['ALL', 'INFO', 'WARN', 'ERROR'] as LogLevel[]).map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setLogFilter(lvl)}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all tracking-widest uppercase flex items-center gap-2 whitespace-nowrap ${
                            logFilter === lvl 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : 'text-slate-500 hover:text-slate-200'
                          }`}
                        >
                          {lvl === 'ALL' && <Filter size={14} />}
                          {lvl}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Professional List View (Web Optimized) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-[#0f172a]/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <th className="px-8 py-5">Type</th>
                        <th className="px-8 py-5">Precise Time</th>
                        <th className="px-8 py-5">Level</th>
                        <th className="px-8 py-5">Operation & Message</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="group hover:bg-slate-800/30 transition-all cursor-default">
                          <td className="px-8 py-6">
                             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:scale-110 transition-all border border-slate-800">
                                <FileText size={20} />
                             </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-mono font-bold text-slate-200 tracking-tighter">{log.timestamp}</span>
                              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">2025-12-18</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${
                              log.level === 'INFO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                              log.level === 'WARN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-0.5">
                               <p className="text-sm font-bold text-slate-200 leading-relaxed">{log.message}</p>
                               <span className="text-[10px] font-medium text-slate-500">USER_REF: SYSTEM_ADMIN_HQ</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button className="p-2 text-slate-600 hover:text-white transition-colors"><ChevronRight size={18}/></button>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                             <div className="flex flex-col items-center gap-4 opacity-20">
                                <Search size={48} />
                                <span className="text-sm font-bold uppercase tracking-widest">No matching logs found</span>
                             </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-6 bg-[#0f172a]/30 border-t border-slate-800 flex justify-center">
                    <button className="text-[11px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-[0.2em] transition-all flex items-center gap-2 group">
                       <Zap size={14} className="group-hover:animate-bounce" /> Load more entries (Total 250+)
                    </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal Sub-component for individual settings blocks in Personal Info
const SettingBlock: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  action?: string; 
  actionClass?: string;
  valueClass?: string;
}> = ({ icon, label, value, action, actionClass = "text-blue-500", valueClass = "text-slate-200" }) => (
  <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-slate-800 hover:bg-slate-800/60 transition-all group">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-[#050914] rounded-xl text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-bold truncate ${valueClass}`}>{value}</span>
      </div>
    </div>
    {action ? (
      <button className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-white/5 rounded-xl transition-all ${actionClass}`}>
        {action}
      </button>
    ) : (
      <div className="p-2 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={16}/></div>
    )}
  </div>
);

// Log Dropdown Item
const LogMenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 rounded-xl transition-colors text-sm font-bold text-slate-300"
  >
    {icon}
    {label}
  </button>
);

const Smartphone = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
    <line x1="12" y1="18" x2="12.01" y2="18"></line>
  </svg>
);

export default SettingTab;
