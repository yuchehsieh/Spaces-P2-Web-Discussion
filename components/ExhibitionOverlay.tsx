import React from 'react';
import { ShieldAlert, Lock } from 'lucide-react';

interface ExhibitionOverlayProps {
  title?: string;
}

const ExhibitionOverlay: React.FC<ExhibitionOverlayProps> = ({ title = "展覽模式功能限制" }) => {
  return (
    <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500 pointer-events-auto">
      <div className="flex flex-col items-center gap-6 p-12 bg-[#111827]/80 border border-slate-700/50 rounded-[3rem] shadow-2xl ring-1 ring-white/5 max-w-sm text-center">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border-4 border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
          <Lock size={48} className="text-amber-500 animate-pulse" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
          <p className="text-slate-500 text-sm font-bold leading-relaxed">
            為確保展覽期間系統運行穩定<br/>
            此功能目前處於「唯讀」或「受限」狀態
          </p>
        </div>
        <div className="px-6 py-2 bg-slate-800/50 rounded-full border border-slate-700">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Exhibition Sync Mode</span>
        </div>
      </div>
    </div>
  );
};

export default ExhibitionOverlay;