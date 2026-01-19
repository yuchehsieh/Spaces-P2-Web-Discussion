import React from 'react';
import { Cpu, ExternalLink } from 'lucide-react';

interface DeviceInfoProps {
  onJump?: () => void;
}

const DeviceInfo: React.FC<DeviceInfoProps> = ({ onJump }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      <div className="flex-1 bg-[#1e293b]/30 border border-slate-800 rounded-[2.5rem] p-12 space-y-12">
        <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-4">硬體底層規格</h4>
        
        <div className="grid grid-cols-2 gap-y-12 gap-x-8">
           <InfoItem label="序列號 (S/N)" value="SKS-SEC-8841-B" />
           <InfoItem label="韌體版本" value="v2.4.8-LATEST" />
           <InfoItem label="通訊協定" value="Zigbee 3.0 / Matter" />
           <InfoItem label="連線時數" value="1,248 Hours" />
           <InfoItem label="剩餘電量" value="92% (CR123A)" valueColor="text-emerald-400" />
           <InfoItem label="網路延遲" value="14ms" valueColor="text-blue-400" />
        </div>
      </div>

      <div className="w-full lg:w-[450px] bg-slate-800/30 border border-dashed border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center p-12 gap-8 group">
         <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/5 shadow-inner">
            <Cpu size={56} className="text-slate-600 group-hover:text-blue-400 transition-colors duration-500" />
         </div>
         <button 
           onClick={onJump}
           className="px-10 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-4 active:scale-95 transition-all"
         >
            跳轉設備中心 <ExternalLink size={20} />
         </button>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, valueColor = "text-white" }: { label: string; value: string; valueColor?: string }) => (
  <div className="space-y-2">
     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">{label}</span>
     <span className={`text-xl font-black italic tracking-tight block ${valueColor}`}>{value}</span>
  </div>
);

export default DeviceInfo;