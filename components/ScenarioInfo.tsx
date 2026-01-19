import React from 'react';
import { Zap, Shield, ExternalLink, ChevronRight } from 'lucide-react';

interface ScenarioInfoProps {
  onJump?: () => void;
}

const ScenarioInfo: React.FC<ScenarioInfoProps> = ({ onJump }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      <div className="flex-1 space-y-4">
        <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-6">關聯自動化情境</h4>
        
        {/* Trigger Item */}
        <div className="bg-[#1e293b]/30 border border-slate-800 rounded-[2rem] p-8 flex items-center justify-between group hover:border-slate-600 transition-all cursor-pointer">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                 <Zap size={28} />
              </div>
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-black text-white italic">PIR 異常連動</h4>
                    <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-500/30 rounded text-[9px] font-black text-blue-400 uppercase">觸發源 (Trigger)</span>
                 </div>
                 <p className="text-xs text-slate-500 font-medium">當此感測器發報時，自動開啟全區影像錄影並通知保安</p>
              </div>
           </div>
           <ChevronRight className="text-slate-700 group-hover:text-blue-400 transition-colors" />
        </div>

        {/* Action Item */}
        <div className="bg-[#1e293b]/30 border border-slate-800 rounded-[2rem] p-8 flex items-center justify-between group hover:border-slate-600 transition-all cursor-pointer">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                 <Shield size={28} />
              </div>
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-black text-white italic">緊急撤防安全鎖</h4>
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-black text-slate-400 uppercase">連動項 (Action)</span>
                 </div>
                 <p className="text-xs text-slate-500 font-medium">系統進入撤防模式時，此感測器將自動進入節電模式</p>
              </div>
           </div>
           <ChevronRight className="text-slate-700 group-hover:text-blue-400 transition-colors" />
        </div>
      </div>

      <div className="w-full lg:w-[450px] bg-purple-600/5 border border-dashed border-purple-500/20 rounded-[2.5rem] flex flex-col items-center justify-center p-12 gap-6 group">
         <Zap size={64} className="text-purple-500/30 group-hover:scale-110 transition-transform duration-700" />
         <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">情境模式管理中心</h4>
         <button 
           onClick={onJump}
           className="px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-purple-900/40 flex items-center gap-4 active:scale-95 transition-all"
         >
            進入情境編輯 <ExternalLink size={20} />
         </button>
      </div>
    </div>
  );
};

export default ScenarioInfo;