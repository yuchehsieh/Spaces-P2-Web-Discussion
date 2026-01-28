import React from 'react';
import { Shield, CalendarClock, ExternalLink, ShieldOff, AlertTriangle } from 'lucide-react';

interface SecurityInfoProps {
  onJump?: () => void;
  deviceLabel?: string;
}

const SecurityInfo: React.FC<SecurityInfoProps> = ({ onJump, deviceLabel = "" }) => {
  const isPeriodMode = deviceLabel.includes('時段');

  if (isPeriodMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500 py-10 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border-4 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] mb-8">
           <ShieldOff size={48} className="text-red-500/60" />
        </div>
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-4">保全功能不支援</h3>
        <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-sm">
          此多功能按鈕目前已設定為「<span className="text-blue-400">時段統計模式</span>」。<br/>
          在此模式下，系統將優先處理時序計時邏輯，不再提供保全連動與設撤防服務。
        </p>
        <div className="mt-10 px-6 py-3 bg-slate-800/40 border border-slate-700 rounded-2xl flex items-center gap-3">
           <AlertTriangle size={16} className="text-amber-500" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">請透過設備中心切換功能類型</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* 左側資訊區 */}
      <div className="flex-1 bg-[#1e293b]/30 border border-slate-800 rounded-[2.5rem] p-10 space-y-12">
        <div className="flex items-center justify-between">
           <span className="text-xs font-black text-slate-500 uppercase tracking-widest">當前安防狀態</span>
           <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <span className="text-sm font-black text-emerald-500 uppercase tracking-widest">設防中 (Armed)</span>
           </div>
        </div>
        
        <div className="h-px bg-slate-800/50"></div>

        <div className="space-y-6">
           <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">今日排程任務</span>
           <div className="bg-black/40 border border-slate-800 rounded-3xl p-6 flex items-center gap-6 group hover:border-blue-500/30 transition-all">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                 <CalendarClock size={28} />
              </div>
              <div>
                 <h4 className="text-lg font-black text-white italic">夜間安防自動化</h4>
                 <p className="text-xs text-slate-500 font-bold uppercase mt-1">Daily • 22:00 ~ 08:00</p>
              </div>
           </div>
        </div>
      </div>

      {/* 右側跳轉區 */}
      <div className="w-full lg:w-[450px] bg-blue-600/5 border border-dashed border-blue-500/20 rounded-[2.5rem] flex flex-col items-center justify-center p-12 gap-8 group">
         <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center border-4 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform duration-500">
            <Shield size={48} className="text-blue-500/60" />
         </div>
         <button 
           onClick={onJump}
           className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/40 flex items-center gap-4 active:scale-95 transition-all"
         >
            跳轉保全排程 <ExternalLink size={20} />
         </button>
      </div>
    </div>
  );
};

export default SecurityInfo;