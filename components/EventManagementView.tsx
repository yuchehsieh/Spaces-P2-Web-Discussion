import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  Building2, 
  Map as MapIcon, 
  Database, 
  Trash2, 
  Zap, 
  Mail, 
  UserCheck, 
  Timer, 
  Check, 
  X, 
  Eye, 
  CheckCircle,
  Cpu,
  Video,
  MoreVertical,
  CheckCircle2,
  Clock,
  Info,
  AlertTriangle,
  CalendarClock,
  Shield,
  Pencil,
  Power,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Calendar,
  Globe,
  Link2,
  ShieldCheck,
  ShieldOff,
  Settings2
} from 'lucide-react';
import { SITE_TREE_DATA } from '../constants';
import { SiteNode } from '../types';

// --- Types for Timeline ---
interface TimeBlock {
  id: string;
  day: number; // 0-6 (Sun-Sat)
  startMinutes: number; // 0-1440
  endMinutes: number;
}

interface TimePointEntry {
  id: string;
  time: string;
  days: string[];
}

interface TriggerCondition {
  id: string;
  device: string;
  event: string;
  operator?: string;
  value?: string;
}

interface LinkedDevice {
  id: string;
  type: 'camera' | 'host' | 'gate';
  deviceId: string;
  action: string;
  delay: string; 
}

interface ScenarioRule {
  id: string;
  name: string;
  siteLabel: string;
  hostLabel: string;
  zoneLabel: string;
  triggerDevice: string;
  triggerEvent: string;
  scheduleType: 'always' | 'custom' | 'time-points' | 'security-sync';
  timeBlocks?: TimeBlock[];
  timePoints?: TimePointEntry[];
  notifyRecipients: string[];
  linkedDevicesCount: number;
  isActive: boolean;
}

// --- Constants ---
const TRIGGER_DEVICES = [
  '多功能按鈕(次數)', '多功能按鈕(時段)', '環境偵測器', '空間偵測器', '門磁', '讀卡機', 'WDI', 'SOS緊急按鈕', 'PIR', 'IPCam'
];

const DEVICE_EVENTS_MAP: Record<string, string[]> = {
  '多功能按鈕(次數)': ['按鈕觸發(二值)', '開蓋告警(異常)'],
  '多功能按鈕(時段)': ['時段起', '時段迄'],
  '環境偵測器': ['亮度偵測(數值)', '溫度偵測(數值)', '濕度偵測(數值)', '水浸告警(二值)', '聲音觸發(二值)', '開蓋告警(異常)'],
  '空間偵測器': ['有人/無人觸發', '人數閾值告警(數值)', '人員進出觸發'],
  '門磁': ['開門觸發(二值)'],
  '讀卡機': ['正常刷卡(行為)', '異常刷卡(異常)'],
  'WDI': ['異常告警', '剪斷告警', '配置錯誤'],
  'SOS緊急按鈕': ['緊急觸發(二值)'],
  'PIR': ['人體感應觸發(二值)'],
  'IPCam': ['人形偵測', '聲音偵測']
};

const VALUE_BASED_EVENTS = ['亮度偵測(數值)', '溫度偵測(數值)', '濕度偵測(數值)', '人數閾值告警(數值)'];
const OPERATORS = ['>', '>=', '<', '<=', '=='];
const DAYS_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_OPTIONS = ['日', '一', '二', '三', '四', '五', '六'];

// 定義保全排程產生的具體事件點
const MOCK_SECURITY_EVENTS = [
  { id: 'se-1-arm', name: '夜間例行設防', time: '22:00', days: '(一~五)', status: 'armed', statusLabel: '保全啟動' },
  { id: 'se-1-disarm', name: '夜間例行設防', time: '08:00', days: '(一~五)', status: 'disarmed', statusLabel: '保全解除' },
  { id: 'se-2-arm', name: '週末全天防護', time: '00:00', days: '(六~日)', status: 'armed', statusLabel: '保全啟動' },
  { id: 'se-2-disarm', name: '週末全天防護', time: '23:59', days: '(六~日)', status: 'disarmed', statusLabel: '保全解除' },
  { id: 'se-3-arm', name: '節假日特殊排程', time: '手動', days: '(不定期)', status: 'armed', statusLabel: '保全啟動' }
];

const RECIPIENTS = [
  { id: 'shelby', name: 'Shelby', email: 'shelby@sks.com.tw' },
  { id: 'campbell', name: 'Campbell', email: 'campbell@sks.com.tw' },
  { id: 'polly', name: 'Polly', email: 'polly@sks.com.tw' }
];

const CAMERA_LIST = [
  { id: 'cam_bullet', name: '門口槍型攝影機' },
  { id: 'cam_ptz', name: '大廳擺頭機' },
  { id: 'cam_starlight', name: '倉庫攝影機' }
];

const GATE_LIST = [
  { id: 'gate_main', name: '正門鐵捲門控制器' },
  { id: 'gate_back', name: '後門鐵捲門控制器' }
];

const CAMERA_ACTIONS = [
  { id: 'record_on', label: '開啟錄影功能' },
  { id: 'deterrence', label: '開啟嚇阻功能' }
];

const HOST_ACTIONS = [
  { id: 'warn_prompt', label: '播放警告提示' },
  { id: 'expel_sound', label: '播放驅逐音效' }
];

const GATE_ACTIONS = [
  { id: 'gate_open', label: '開啟鐵捲門' },
  { id: 'gate_close', label: '關閉鐵捲門' },
  { id: 'gate_stop', label: '停止動作' }
];

const INITIAL_SCENARIOS: ScenarioRule[] = [
  {
    id: 'RULE_T01',
    name: '大辦公區高溫告警',
    siteLabel: '總公司',
    hostLabel: '商研中心',
    zoneLabel: '大辦公區',
    triggerDevice: '環境偵測器',
    triggerEvent: '溫度 > 35℃',
    scheduleType: 'custom',
    timeBlocks: [
      { id: 'tb1', day: 1, startMinutes: 480, endMinutes: 1080 },
      { id: 'tb2', day: 2, startMinutes: 480, endMinutes: 1080 }
    ],
    notifyRecipients: ['Shelby', 'Admin'],
    linkedDevicesCount: 1,
    isActive: true
  }
];

const formatMinutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

const formatTimeForInput = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    h: (hours % 12 || 12).toString().padStart(2, '0'),
    m: minutes.toString().padStart(2, '0'),
    p: hours >= 12 ? 'PM' : 'AM'
  };
};

// --- Timeline Component ---
const TimelineEditor: React.FC<{
  blocks: TimeBlock[];
  onChange: (blocks: TimeBlock[]) => void;
}> = ({ blocks, onChange }) => {
  const [hoverPos, setHoverPos] = useState<{ day: number, min: number } | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [resizingSide, setResizingSide] = useState<'left' | 'right' | null>(null);
  const [dragStartMin, setDragStartMin] = useState(0);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [isHoveringExistingBlock, setIsHoveringExistingBlock] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const getMinFromX = (x: number, snap: boolean = true) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const timelineWidth = rect.width - 60 - 24; 
    const relativeX = x - rect.left - 60 - 12;
    const percent = Math.max(0, Math.min(1, relativeX / timelineWidth));
    const min = Math.round(percent * 1440);
    return snap ? Math.round(min / 15) * 15 : min;
  };

  const isOverlapping = (newStart: number, newEnd: number, day: number, excludeId: string) => {
    return blocks.some(b => b.id !== excludeId && b.day === day && newStart < b.endMinutes && newEnd > b.startMinutes);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    const timelineContentRect = containerRef.current.querySelector('.timeline-content-rows')?.getBoundingClientRect();
    if (!timelineContentRect) return;

    const dayHeight = timelineContentRect.height / 7;
    const relativeY = y - timelineContentRect.top;
    const day = Math.floor(relativeY / dayHeight);
    
    if (day >= 0 && day < 7 && relativeY >= 0 && relativeY <= timelineContentRect.height && x > rect.left + 60) {
      const min = getMinFromX(x);
      setHoverPos({ day, min });
    } else {
      setHoverPos(null);
    }

    if (draggingBlockId) {
      const targetBlock = blocks.find(b => b.id === draggingBlockId);
      if (targetBlock) {
        const currentMin = getMinFromX(x);
        const delta = currentMin - dragStartMin;
        if (delta === 0) return;
        
        setHasMoved(true);

        if (resizingSide === 'left') {
          const newStart = Math.min(targetBlock.endMinutes - 15, Math.max(0, targetBlock.startMinutes + delta));
          if (!isOverlapping(newStart, targetBlock.endMinutes, targetBlock.day, draggingBlockId)) {
            onChange(blocks.map(b => b.id === draggingBlockId ? { ...b, startMinutes: newStart } : b));
            setDragStartMin(currentMin);
          }
        } else if (resizingSide === 'right') {
          const newEnd = Math.max(targetBlock.startMinutes + 15, Math.min(1440, targetBlock.endMinutes + delta));
          if (!isOverlapping(targetBlock.startMinutes, newEnd, targetBlock.day, draggingBlockId)) {
            onChange(blocks.map(b => b.id === draggingBlockId ? { ...b, endMinutes: newEnd } : b));
            setDragStartMin(currentMin);
          }
        } else {
          const isMouseOnSameDay = day === targetBlock.day;
          if (isMouseOnSameDay) {
            const duration = targetBlock.endMinutes - targetBlock.startMinutes;
            let newStart = Math.max(0, Math.min(1440 - duration, targetBlock.startMinutes + delta));
            let newEnd = newStart + duration;
            if (!isOverlapping(newStart, newEnd, targetBlock.day, draggingBlockId)) {
              onChange(blocks.map(b => b.id === draggingBlockId ? { ...b, startMinutes: newStart, endMinutes: newEnd } : b));
              setDragStartMin(currentMin);
            }
          }
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, blockId: string, side: 'left' | 'right' | 'move') => {
    e.stopPropagation();
    setHasMoved(false);
    setDraggingBlockId(blockId);
    setResizingSide(side === 'move' ? null : side);
    setDragStartMin(getMinFromX(e.clientX));
  };

  const handleMouseUp = () => {
    setDraggingBlockId(null);
    setResizingSide(null);
  };

  const handleAddBlock = (day: number, startMin: number) => {
    const duration = 150; 
    const sMin = Math.max(0, Math.min(1440 - duration, Math.round(startMin / 15) * 15 - (duration / 2)));
    const eMin = sMin + duration;

    if (!isOverlapping(sMin, eMin, day, 'new')) {
      const newBlock: TimeBlock = {
        id: Math.random().toString(36).substr(2, 9),
        day,
        startMinutes: sMin,
        endMinutes: eMin
      };
      onChange([...blocks, newBlock]);
    }
  };

  const handleDeleteBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
    setEditingBlockId(null);
  };

  const updateBlockTime = (id: string, startH: number, startM: number, startP: string, endH: number, endM: number, endP: string, allDay: boolean) => {
    if (allDay) {
      onChange(blocks.map(b => b.id === id ? { ...b, startMinutes: 0, endMinutes: 1440 } : b));
    } else {
      const calcMin = (h: number, m: number, p: string) => {
        let hours = h === 12 ? 0 : h;
        if (p === 'PM') hours += 12;
        return hours * 60 + m;
      };
      const sMin = calcMin(startH, startM, startP);
      const eMin = calcMin(endH, endM, endP);
      
      const target = blocks.find(b => b.id === id);
      if (target && !isOverlapping(sMin, eMin, target.day, id)) {
        onChange(blocks.map(b => b.id === id ? { ...b, startMinutes: sMin, endMinutes: eMin } : b));
      }
    }
    setEditingBlockId(null);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-[#050914]/40 border border-slate-800 rounded-xl p-6 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { setHoverPos(null); handleMouseUp(); }}
    >
      <div className="flex h-10 items-center border-b border-slate-800 mb-4 px-2">
        <div className="w-12"></div>
        {['12 AM', '04 AM', '08 AM', '12 PM', '04 PM', '08 PM', '12 AM'].map((label, i) => (
          <div key={i} className="flex-1 text-[10px] font-black text-slate-500 text-center tracking-widest uppercase">{label}</div>
        ))}
      </div>

      <div className="relative timeline-content-rows">
        {DAYS_LABELS.map((dayLabel, dayIndex) => (
          <div key={dayIndex} className="flex h-14 items-center border-b border-slate-800/50 last:border-0 relative">
            <div className="w-12 text-[11px] font-black text-slate-500 uppercase tracking-widest">{dayLabel}</div>
            <div className="flex-1 h-full relative">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="absolute h-full w-px bg-slate-800/50" style={{ left: `${(i / 6) * 100}%` }}></div>
              ))}

              {/* Ghost "+" block: Hide when a block is being dragged OR the mouse is already over an existing block */}
              {hoverPos && hoverPos.day === dayIndex && !draggingBlockId && !isHoveringExistingBlock && !blocks.some(b => b.day === dayIndex && hoverPos.min >= b.startMinutes && hoverPos.min <= b.endMinutes) && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-12 h-10 bg-blue-600/20 border border-blue-500/40 rounded-lg flex items-center justify-center text-blue-400 cursor-pointer transition-none z-10 pointer-events-none"
                  style={{ left: `${(hoverPos.min / 1440) * 100}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <Plus size={16} />
                </div>
              )}
              {hoverPos && hoverPos.day === dayIndex && !draggingBlockId && (
                 <div className="absolute inset-0 cursor-pointer z-0" onClick={() => handleAddBlock(dayIndex, hoverPos.min)}></div>
              )}

              {blocks.filter(b => b.day === dayIndex).map(block => {
                const isAllDay = block.startMinutes === 0 && block.endMinutes === 1440;
                // Tooltip visibility: show on hover OR while actively dragging/resizing
                const shouldShowTooltip = !isAllDay && (draggingBlockId === block.id || (hoveredBlockId === block.id && !draggingBlockId));

                return (
                  <div 
                    key={block.id}
                    className="absolute top-1/2 -translate-y-1/2 h-10 bg-blue-600/40 border border-blue-500/60 rounded-lg group cursor-move flex items-center overflow-visible z-20 shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:border-blue-400 transition-colors"
                    style={{ 
                      left: `${(block.startMinutes / 1440) * 100}%`, 
                      width: `${((block.endMinutes - block.startMinutes) / 1440) * 100}%` 
                    }}
                    onMouseEnter={() => {
                      if (!isAllDay) setHoveredBlockId(block.id);
                      setIsHoveringExistingBlock(true);
                    }}
                    onMouseLeave={() => {
                      setHoveredBlockId(null);
                      setIsHoveringExistingBlock(false);
                    }}
                    onMouseDown={(e) => handleMouseDown(e, block.id, 'move')}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (!hasMoved) setEditingBlockId(block.id); 
                    }}
                  >
                    {!isAllDay && (
                       <div className="absolute left-0 w-3 h-full cursor-ew-resize z-30" onMouseDown={(e) => handleMouseDown(e, block.id, 'left')}></div>
                    )}
                    <div className="flex-1 px-3 text-[10px] font-black text-blue-100 truncate uppercase pointer-events-none tracking-tight">
                      {isAllDay ? 'All Day / 全日' : `${formatMinutesToTime(block.startMinutes)} - ${formatMinutesToTime(block.endMinutes)}`}
                    </div>
                    {!isAllDay && (
                       <div className="absolute right-0 w-3 h-full cursor-ew-resize z-30" onMouseDown={(e) => handleMouseDown(e, block.id, 'right')}></div>
                    )}

                    {shouldShowTooltip && (
                      <div className="absolute top-[-44px] left-1/2 -translate-x-1/2 bg-[#111827] border border-slate-700 px-3 py-2 rounded-lg text-[11px] font-black text-white shadow-2xl whitespace-nowrap z-[100] animate-in fade-in zoom-in-95 pointer-events-none border-b-blue-500 border-b-2">
                        {formatMinutesToTime(block.startMinutes)} - {formatMinutesToTime(block.endMinutes)}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#111827] rotate-45 border-r border-b border-slate-700"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editingBlockId && (
        <BlockEditPopup 
          block={blocks.find(b => b.id === editingBlockId)!} 
          onClose={() => setEditingBlockId(null)}
          onDelete={() => handleDeleteBlock(editingBlockId)}
          onSave={updateBlockTime}
        />
      )}
    </div>
  );
};

const BlockEditPopup: React.FC<{
  block: TimeBlock;
  onClose: () => void;
  onDelete: () => void;
  onSave: (id: string, sh: number, sm: number, sp: string, eh: number, em: number, ep: string, allDay: boolean) => void;
}> = ({ block, onClose, onDelete, onSave }) => {
  const start = formatTimeForInput(block.startMinutes);
  const end = formatTimeForInput(block.endMinutes);

  const [sH, setSH] = useState(parseInt(start.h));
  const [sM, setSM] = useState(parseInt(start.m));
  const [sP, setSP] = useState(start.p);
  const [eH, setEH] = useState(parseInt(end.h));
  const [eM, setEM] = useState(parseInt(end.m));
  const [eP, setEP] = useState(end.p);
  const [isAllDay, setIsAllDay] = useState(block.startMinutes === 0 && block.endMinutes === 1440);

  return (
    <>
      <div className="fixed inset-0 z-[2500] bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2501] bg-[#111827] border border-slate-700 rounded-3xl p-8 shadow-2xl w-96 animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
        <div className="flex items-center gap-3 mb-8">
           <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg"><Clock size={20}/></div>
           <h4 className="text-base font-black text-slate-200 uppercase tracking-widest">時段細節設定</h4>
        </div>
        
        <div className="space-y-8">
          <div className={`space-y-4 transition-opacity ${isAllDay ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Starts at / 開始時間</span>
              <div className="flex items-center gap-2">
                 <TimeSelector value={sH} max={12} min={1} onChange={setSH} />
                 <span className="text-slate-700 font-black">:</span>
                 <TimeSelector value={sM} max={59} min={0} onChange={setSM} />
                 <select value={sP} onChange={e => setSP(e.target.value)} className="bg-[#050914] border border-slate-800 rounded-xl px-3 py-2 text-sm font-black text-white outline-none focus:border-blue-500 cursor-pointer">
                   <option>AM</option><option>PM</option>
                 </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Ends at / 結束時間</span>
              <div className="flex items-center gap-2">
                 <TimeSelector value={eH} max={12} min={1} onChange={setEH} />
                 <span className="text-slate-700 font-black">:</span>
                 <TimeSelector value={eM} max={59} min={0} onChange={setEM} />
                 <select value={eP} onChange={e => setEP(e.target.value)} className="bg-[#050914] border border-slate-800 rounded-xl px-3 py-2 text-sm font-black text-white outline-none focus:border-blue-500 cursor-pointer">
                   <option>AM</option><option>PM</option>
                 </select>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setIsAllDay(!isAllDay)}
            className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
          >
             <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isAllDay ? 'bg-blue-600 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-800 border-slate-700 group-hover:border-slate-600'}`}>
                {isAllDay && <Check size={14} className="text-white" strokeWidth={4} />}
             </div>
             <span className={`text-xs font-black uppercase tracking-widest ${isAllDay ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>All Day / 整日模式</span>
          </div>

          <div className="pt-8 flex items-center justify-between border-t border-slate-800">
             <button onClick={onDelete} className="text-xs font-black text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors">Delete</button>
             <div className="flex gap-4">
               <button onClick={onClose} className="px-5 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-300">Cancel</button>
               <button onClick={() => onSave(block.id, sH, sM, sP, eH, eM, eP, isAllDay)} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all">Save</button>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

const TimeSelector: React.FC<{ value: number, max: number, min: number, onChange: (v: number) => void }> = ({ value, max, min, onChange }) => {
  return (
    <div className="flex-1 flex flex-col items-center bg-[#050914] border border-slate-800 rounded-xl p-1.5 shadow-inner">
      <button onClick={() => onChange(value >= max ? min : value + 1)} className="text-slate-600 hover:text-blue-400 transition-colors"><ChevronUp size={14}/></button>
      <span className="text-base font-mono font-black text-white py-1">{value.toString().padStart(2, '0')}</span>
      <button onClick={() => onChange(value <= min ? max : value - 1)} className="text-slate-600 hover:text-blue-400 transition-colors"><ChevronDown size={14}/></button>
    </div>
  );
};

// --- Custom Icons ---
const Smartphone = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
    <line x1="12" y1="18" x2="12.01" y2="18"></line>
  </svg>
);

// --- Main Page Component ---
const EventManagementView: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioRule[]>(INITIAL_SCENARIOS);
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  
  // UI States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Area Selection States
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Schedule States (New)
  const [scheduleType, setScheduleType] = useState<'always' | 'custom' | 'time-points' | 'security-sync'>('custom');
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [timePoints, setTimePoints] = useState<TimePointEntry[]>([
    { id: 'tp-1', time: '07:00', days: ['一', '二', '三', '四', '五'] }
  ]);
  const [saveAsPredefined, setSaveAsPredefined] = useState(false);
  const [selectedSecurityEventIds, setSelectedSecurityEventIds] = useState<Set<string>>(new Set());

  // Trigger Logic States
  const [triggerSourceType, setTriggerSourceType] = useState<'device' | 'time'>('device');
  const [triggerCondition, setTriggerCondition] = useState<TriggerCondition>(
    { id: 'initial', device: '', event: '', operator: '>', value: '' }
  );

  // Action States
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedNotifyMediums, setSelectedNotifyMediums] = useState<string[]>(['email', 'app']);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['shelby']);
  
  const [linkedDevices, setLinkedDevices] = useState<LinkedDevice[]>([
    { id: 'init-link-1', type: 'camera', deviceId: '', action: 'record_on', delay: '0' }
  ]);

  // --- Dependency Logic Between Left and Middle ---
  useEffect(() => {
    if (scheduleType === 'time-points' || scheduleType === 'security-sync') {
      setTriggerSourceType('time');
    } else {
      if (triggerSourceType === 'time') {
        setTriggerSourceType('device');
      }
    }
  }, [scheduleType]);

  const isTriggerSourceDisabled = (type: 'device' | 'time') => {
    if (scheduleType === 'time-points' || scheduleType === 'security-sync') {
      return type !== 'time';
    } else {
      return type === 'time';
    }
  };

  // --- Computations ---
  const sites = useMemo(() => {
    const list: SiteNode[] = [];
    const traverse = (nodes: SiteNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'site') list.push(n);
        if (n.children) traverse(n.children);
      });
    };
    traverse(SITE_TREE_DATA);
    return list;
  }, []);

  const hosts = useMemo(() => {
    if (!selectedSiteId) return [];
    const site = sites.find(s => s.id === selectedSiteId);
    return site?.children || [];
  }, [selectedSiteId, sites]);

  const zones = useMemo(() => {
    if (!selectedHostId) return [];
    const host = hosts.find(h => h.id === selectedHostId);
    return host?.children || [];
  }, [selectedHostId, hosts]);

  const currentSiteLabel = useMemo(() => sites.find(s => s.id === selectedSiteId)?.label || '', [sites, selectedSiteId]);
  const currentHostLabel = useMemo(() => hosts.find(h => h.id === selectedHostId)?.label || '', [hosts, selectedHostId]);
  const currentZoneLabel = useMemo(() => zones.find(z => z.id === selectedZoneId)?.label || '', [zones, selectedZoneId]);

  const selectedSecurityEvents = useMemo(() => 
    MOCK_SECURITY_EVENTS.filter(e => selectedSecurityEventIds.has(e.id))
  , [selectedSecurityEventIds]);

  const selectedNode = null; // Defined for scope completeness if needed locally

  const isStep1Valid = !!selectedZoneId && (
    scheduleType === 'always' || 
    (scheduleType === 'custom' && timeBlocks.length > 0) || 
    (scheduleType === 'time-points' && timePoints.length > 0) ||
    (scheduleType === 'security-sync' && selectedSecurityEventIds.size > 0)
  );
  const isStep2Valid = triggerSourceType === 'time' ? true : !!(triggerCondition.device && triggerCondition.event);
  const isStep3Enabled = isStep1Valid && isStep2Valid;

  // --- Handlers ---
  const updateCondition = (field: keyof TriggerCondition, value: string) => {
    setTriggerCondition(prev => ({ ...prev, [field]: value, ...(field === 'device' ? { event: '' } : {}) }));
  };

  const toggleOutput = (output: string) => isStep3Enabled && setSelectedOutputs(prev => prev.includes(output) ? prev.filter(o => o !== output) : [...prev, output]);
  const toggleNotifyMedium = (medium: string) => setSelectedNotifyMediums(prev => prev.includes(medium) ? prev.filter(m => m !== medium) : [...prev, medium]);
  const toggleRecipient = (id: string) => setSelectedRecipients(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const addLinkedDevice = () => setLinkedDevices([...linkedDevices, { id: Date.now().toString(), type: 'camera', deviceId: '', action: 'record_on', delay: '0' }]);
  const removeLinkedDevice = (id: string) => linkedDevices.length > 1 && setLinkedDevices(linkedDevices.filter(d => d.id !== id));
  const updateLinkedDevice = (id: string, updates: Partial<LinkedDevice>) => setLinkedDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

  const addTimePoint = () => {
    if (timePoints.length >= 10) return;
    setTimePoints([...timePoints, { id: Date.now().toString(), time: '09:00', days: ['一', '二', '三', '四', '五'] }]);
  };

  const removeTimePoint = (id: string) => {
    if (timePoints.length <= 1) return;
    setTimePoints(timePoints.filter(tp => tp.id !== id));
  };

  const updateTimePoint = (id: string, updates: Partial<TimePointEntry>) => {
    setTimePoints(prev => prev.map(tp => tp.id === id ? { ...tp, ...updates } : tp));
  };

  const toggleDayInTimePoint = (tpId: string, day: string) => {
    setTimePoints(prev => prev.map(tp => {
      if (tp.id === tpId) {
        const nextDays = tp.days.includes(day) ? tp.days.filter(d => d !== day) : [...tp.days, day];
        return { ...tp, days: nextDays };
      }
      return tp;
    }));
  };

  const toggleSecurityEventId = (id: string) => {
    setSelectedSecurityEventIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleScenarioActive = (id: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    setActiveMenuId(null);
  };

  const deleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    setDeleteConfirmId(null);
    setActiveMenuId(null);
  };

  const getActionLabel = (type: 'camera' | 'host' | 'gate', actionId: string) => {
    if (type === 'camera') return CAMERA_ACTIONS.find(a => a.id === actionId)?.label || actionId;
    if (type === 'host') return HOST_ACTIONS.find(a => a.id === actionId)?.label || actionId;
    return GATE_ACTIONS.find(a => a.id === actionId)?.label || actionId;
  };

  if (isCreating) {
    return (
      <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCreating(false)} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all shadow-xl"><ChevronLeft size={24} /></button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">新增自訂情境 <span className="text-blue-600">.</span></h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Configure automated rules and responses</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCreating(false)} className="px-6 py-3 bg-transparent text-slate-400 hover:text-white text-xs font-black tracking-widest uppercase transition-all">Cancel</button>
            <button 
              onClick={() => setIsPreviewOpen(true)}
              className={`px-10 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl ${isStep3Enabled ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
            >
              Create Rule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-start">
          <div className="lg:col-span-1 bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col min-h-full">
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-white tracking-tighter flex items-center gap-3"><Building2 size={20} className="text-blue-500" /> 基本資訊與範圍</h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">情境名稱</label>
                    <input type="text" placeholder="例如：每日定時開啟鐵捲門..." value={newEventName} onChange={(e) => setNewEventName(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-2xl py-4 px-6 text-base font-bold text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-800 shadow-inner" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2"><MapIcon size={14} className="text-blue-400" /><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">連動區域選擇</label></div>
                    <div className="flex flex-col gap-4">
                      <select value={selectedSiteId} onChange={(e) => { setSelectedSiteId(e.target.value); setSelectedHostId(''); setSelectedZoneId(''); }} className="w-full bg-[#050914] border border-slate-700 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                        <option value="">請選擇據點...</option>
                        {sites.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                      <select value={selectedHostId} disabled={!selectedSiteId} onChange={(e) => { setSelectedHostId(e.target.value); setSelectedZoneId(''); }} className="w-full bg-[#050914] border border-slate-700 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-30 appearance-none">
                        <option value="">請選擇主機...</option>
                        {hosts.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                      </select>
                      <select value={selectedZoneId} disabled={!selectedHostId} onChange={(e) => setSelectedZoneId(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-30 appearance-none">
                        <option value="">請選擇分區...</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-800/50 space-y-8">
                <h3 className="text-xl font-black text-white tracking-tighter flex items-center gap-3"><CalendarClock size={20} className="text-blue-500" /> 情境執行排程</h3>
                
                <div className="flex flex-col gap-3 mb-6 bg-black/20 p-4 rounded-[2rem] border border-slate-800/50 w-full overflow-hidden">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                      <input type="radio" name="schedType" checked={scheduleType === 'always'} onChange={() => setScheduleType('always')} className="sr-only peer" />
                      <div className="w-4 h-4 rounded-full border-2 border-slate-700 peer-checked:border-blue-500 flex items-center justify-center">
                         <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                      </div>
                      <span className={`text-sm font-black uppercase tracking-tighter ${scheduleType === 'always' ? 'text-white' : 'text-slate-500'}`}>永遠啟動</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                      <input type="radio" name="schedType" checked={scheduleType === 'custom'} onChange={() => setScheduleType('custom')} className="sr-only peer" />
                      <div className="w-4 h-4 rounded-full border-2 border-slate-700 peer-checked:border-blue-500 flex items-center justify-center">
                         <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                      </div>
                      <span className={`text-sm font-black uppercase tracking-tighter ${scheduleType === 'custom' ? 'text-white' : 'text-slate-500'}`}>自訂時段</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                      <input type="radio" name="schedType" checked={scheduleType === 'time-points'} onChange={() => setScheduleType('time-points')} className="sr-only peer" />
                      <div className="w-4 h-4 rounded-full border-2 border-slate-700 peer-checked:border-blue-500 flex items-center justify-center">
                         <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                      </div>
                      <span className={`text-sm font-black uppercase tracking-tighter ${scheduleType === 'time-points' ? 'text-white' : 'text-slate-500'}`}>到點執行模式</span>
                    </label>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-800/50 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                      <input type="radio" name="schedType" checked={scheduleType === 'security-sync'} onChange={() => setScheduleType('security-sync')} className="sr-only peer" />
                      <div className="w-4 h-4 rounded-full border-2 border-slate-700 peer-checked:border-blue-500 flex items-center justify-center">
                         <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                      </div>
                      <span className={`text-sm font-black uppercase tracking-tighter ${scheduleType === 'security-sync' ? 'text-white' : 'text-slate-500'}`}>執行於保全啟動或解除時</span>
                    </label>
                  </div>
                </div>

                {scheduleType === 'custom' && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <TimelineEditor blocks={timeBlocks} onChange={setTimeBlocks} />
                    <div 
                      onClick={() => setSaveAsPredefined(!saveAsPredefined)}
                      className="mt-8 flex items-center gap-4 px-5 py-4 bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-blue-500/30 cursor-pointer transition-all group"
                    >
                       <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${saveAsPredefined ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700 group-hover:border-slate-600'}`}>
                          {saveAsPredefined && <Check size={14} className="text-white" strokeWidth={4} />}
                       </div>
                       <label className={`text-[11px] font-black uppercase tracking-widest cursor-pointer transition-colors ${saveAsPredefined ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>儲存為預定義排程模板</label>
                    </div>
                  </div>
                )}

                {scheduleType === 'time-points' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {timePoints.map((tp, idx) => (
                        <div key={tp.id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl relative group shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                <Clock size={14}/> 時間點 {idx + 1}
                             </div>
                             {timePoints.length > 1 && (
                               <button onClick={() => removeTimePoint(tp.id)} className="p-1.5 text-slate-700 hover:text-red-400 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                             )}
                          </div>
                          <div className="space-y-4">
                             <input 
                                type="time" 
                                value={tp.time} 
                                onChange={(e) => updateTimePoint(tp.id, { time: e.target.value })}
                                className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 px-4 text-lg font-mono font-black text-white focus:border-blue-500 outline-none [color-scheme:dark]" 
                             />
                             <div className="flex flex-wrap gap-1.5">
                                {DAYS_OPTIONS.map(day => (
                                  <button 
                                    key={day}
                                    onClick={() => toggleDayInTimePoint(tp.id, day)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${tp.days.includes(day) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-[#050914] border-slate-800 text-slate-600 hover:text-slate-400'}`}
                                  >
                                    {day}
                                  </button>
                                ))}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {timePoints.length < 10 && (
                      <button onClick={addTimePoint} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 hover:text-blue-500 hover:border-blue-900/40 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-black/20 group">
                         <Plus size={16} className="group-hover:scale-110 transition-transform" /> 新增執行時間組合 ({timePoints.length}/10)
                      </button>
                    )}
                  </div>
                )}

                {scheduleType === 'security-sync' && (
                   <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1 flex items-center gap-2">
                            <Shield size={14} className="text-blue-500"/> 選取欲關聯之保全動作點 (複選)
                         </label>
                         <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                            {MOCK_SECURITY_EVENTS.map(se => (
                               <label 
                                 key={se.id}
                                 className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${selectedSecurityEventIds.has(se.id) ? 'bg-blue-600/10 border-blue-500 shadow-xl' : 'bg-black/20 border-slate-800 hover:border-slate-700'}`}
                               >
                                  <div className="pt-0.5">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedSecurityEventIds.has(se.id)} 
                                      onChange={() => toggleSecurityEventId(se.id)} 
                                      className="sr-only peer"
                                    />
                                    <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${selectedSecurityEventIds.has(se.id) ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-700'}`}>
                                       {selectedSecurityEventIds.has(se.id) && <Check size={12} className="text-white" strokeWidth={4} />}
                                    </div>
                                  </div>
                                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                                     <div className="flex justify-between items-center">
                                        <span className={`text-xs font-black truncate ${selectedSecurityEventIds.has(se.id) ? 'text-white' : 'text-slate-300'}`}>{se.name} {se.time}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${se.status === 'armed' ? 'bg-emerald-900/30 text-emerald-500 border-emerald-800' : 'bg-blue-900/30 text-blue-500 border-blue-800'}`}>{se.statusLabel}</span>
                                     </div>
                                     <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">{se.days}</span>
                                  </div>
                               </label>
                            ))}
                         </div>
                      </div>
                      <p className="text-[9px] text-slate-600 font-bold leading-relaxed px-2 italic border-t border-slate-800/50 pt-4">
                         * 此模式下，當系統執行上述所勾選的任一保全動作排程時，皆會自動連動執行本自訂情境。
                      </p>
                   </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col min-h-full">
            <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Database size={20} className="text-blue-500" /> 觸發條件邏輯</h3>
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[850px]">
              {selectedZoneId ? (
                <div className="space-y-6">
                  {/* Styled Radio Group Switcher */}
                  <div className="flex flex-wrap items-center gap-3 mb-2 bg-black/20 p-2 rounded-3xl border border-slate-800/50 w-full overflow-hidden">
                    <label className={`flex items-center gap-2 cursor-pointer group px-2 py-2 transition-all ${isTriggerSourceDisabled('device') ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                      <input 
                        type="radio" 
                        name="trigType" 
                        checked={triggerSourceType === 'device'} 
                        onChange={() => setTriggerSourceType('device')} 
                        className="sr-only peer" 
                        disabled={isTriggerSourceDisabled('device')}
                      />
                      <div className="w-4 h-4 rounded-full border-2 border-slate-700 peer-checked:border-blue-500 flex items-center justify-center">
                         <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                      </div>
                      <span className={`text-sm font-black uppercase tracking-tighter ${triggerSourceType === 'device' ? 'text-white' : 'text-slate-500'}`}>設備條件</span>
                    </label>

                    <label className={`flex items-center gap-2 cursor-pointer group px-2 py-2 transition-all ${isTriggerSourceDisabled('time') ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                      <input 
                        type="radio" 
                        name="trigType" 
                        checked={triggerSourceType === 'time'} 
                        onChange={() => setTriggerSourceType('time')} 
                        className="sr-only peer" 
                        disabled={isTriggerSourceDisabled('time')}
                      />
                      <div className="w-4 h-4 rounded-full border-2 border-slate-700 peer-checked:border-blue-500 flex items-center justify-center">
                         <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                      </div>
                      <span className={`text-sm font-black uppercase tracking-tighter ${triggerSourceType === 'time' ? 'text-white' : 'text-slate-500'}`}>時間條件</span>
                    </label>
                  </div>

                  <div className="p-8 bg-[#050914] border border-slate-800 rounded-[2.5rem] relative animate-in zoom-in-95 duration-200 group shadow-inner min-h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        {triggerSourceType === 'device' ? '事件感應設定 (Sensor Event)' : '排程連動設定 (Schedule Sync)'}
                      </span>
                    </div>
                    
                    {triggerSourceType === 'device' ? (
                      <div className="space-y-8 animate-in fade-in">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">選擇設備類型</span>
                          <select value={triggerCondition.device} onChange={(e) => updateCondition('device', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-2xl py-4 px-5 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 appearance-none shadow-xl">
                            <option value="">選擇設備...</option>
                            {TRIGGER_DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">選擇觸發事件</span>
                          <select value={triggerCondition.event} disabled={!triggerCondition.device} onChange={(e) => updateCondition('event', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-2xl py-4 px-5 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-30 appearance-none shadow-xl">
                            <option value="">選擇事件...</option>
                            {triggerCondition.device && DEVICE_EVENTS_MAP[triggerCondition.device].map(ev => <option key={ev} value={ev}>{ev}</option>)}
                          </select>
                        </div>

                        {triggerCondition.event && VALUE_BASED_EVENTS.includes(triggerCondition.event) && (
                          <div className="grid grid-cols-2 gap-4 pt-4 animate-in slide-in-from-top-4">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">運算子</span>
                                <select value={triggerCondition.operator} onChange={(e) => updateCondition('operator', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 appearance-none shadow-xl">
                                  {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">臨界數值</span>
                                <input 
                                  type="text" placeholder="輸入值..." value={triggerCondition.value} onChange={(e) => updateCondition('value', e.target.value)}
                                  className="w-full bg-[#111827] border border-slate-700 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 shadow-xl"
                                />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in">
                        <div className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-2xl flex flex-col items-center text-center gap-4">
                           <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500">
                              {scheduleType === 'security-sync' ? <Shield size={32} /> : <CalendarClock size={32} />}
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">
                                 {scheduleType === 'security-sync' ? '隨保全動作點同步連動' : '到點定時連動'}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-bold leading-relaxed px-2 italic">
                                 {scheduleType === 'security-sync' 
                                   ? `系統偵測到左側選取了 ${selectedSecurityEventIds.size} 個「保全同步點」。情境將隨這些排程點執行時同步觸發，不需額外設備觸發。`
                                   : '系統將自動讀取左側「情境執行排程」中所設定的所有時間點作為連動觸發條件。'}
                              </p>
                           </div>
                        </div>
                        <div className="px-4 py-3 bg-black/40 rounded-xl border border-slate-800 flex items-center gap-3">
                           <Info size={14} className="text-blue-400" />
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                              {scheduleType === 'security-sync' ? '保全同步模式已就緒' : `當前已配置 ${timePoints.length} 個執行點`}
                           </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/20 border border-dashed border-slate-800 rounded-[2.5rem] opacity-40">
                  <MapIcon size={48} className="text-slate-600 mb-4" />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest">請先選擇分區</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col min-h-full">
            <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Zap size={20} className="text-blue-500" /> 連動與通知</h3>
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pr-1 max-h-[850px]">
              {isStep3Enabled ? (
                <div className="space-y-10 pb-6">
                  <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
                    <button onClick={() => toggleOutput('notify')} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-tighter shadow-lg ${selectedOutputs.includes('notify') ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>通知設定</button>
                    <button onClick={() => toggleOutput('device_link')} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-tighter shadow-lg ${selectedOutputs.includes('device_link') ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>連動設備</button>
                    <button onClick={() => toggleOutput('webhook')} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-tighter shadow-lg ${selectedOutputs.includes('webhook') ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>WEBHOOK</button>
                  </div>

                  {selectedOutputs.includes('notify') && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <Mail size={14} className="text-blue-400" /> 通知媒體選擇
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                             <button onClick={() => toggleNotifyMedium('email')} className={`flex items-center justify-center gap-4 py-4 rounded-2xl border transition-all text-xs font-black ${selectedNotifyMediums.includes('email') ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-black/20 border-slate-800 text-slate-600'}`}><Mail size={18}/> EMAIL</button>
                             <button onClick={() => toggleNotifyMedium('app')} className={`flex items-center justify-center gap-4 py-4 rounded-2xl border transition-all text-xs font-black ${selectedNotifyMediums.includes('app') ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-black/20 border-slate-800 text-slate-600'}`}><Smartphone size={18}/> APP</button>
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <UserCheck size={14} className="text-blue-400" /> 通知對象 (Recipients)
                          </label>
                          <div className="space-y-2">
                             {RECIPIENTS.map(p => (
                               <button key={p.id} onClick={() => toggleRecipient(p.id)} className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] border transition-all ${selectedRecipients.includes(p.id) ? 'bg-blue-600/10 border-blue-500 shadow-xl' : 'bg-black/20 border-slate-800'}`}>
                                  <div className="flex items-center gap-4">
                                     <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs shadow-inner ${selectedRecipients.includes(p.id) ? 'bg-blue-600 text-white shadow-blue-900/40' : 'bg-slate-800 text-slate-500'}`}>{p.name[0]}</div>
                                     <div className="text-left">
                                        <span className={`block text-sm font-black tracking-tight ${selectedRecipients.includes(p.id) ? 'text-white' : 'text-slate-400'}`}>{p.name}</span>
                                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">{p.email}</span>
                                     </div>
                                  </div>
                                  {selectedRecipients.includes(p.id) && <CheckCircle size={18} className="text-blue-500" />}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {selectedOutputs.includes('webhook') && (
                    <div className="space-y-4 pt-6 border-t border-slate-800/50 animate-in fade-in duration-500">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Globe size={14} className="text-blue-400" /> Webhook 遠端串接 URL
                       </label>
                       <div className="relative group">
                          <div className="absolute inset-0 bg-blue-600/5 blur-[20px] opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl"></div>
                          <input 
                            type="text" 
                            placeholder="https://api.yourdomain.com/endpoint..." 
                            value={webhookUrl} 
                            onChange={(e) => setWebhookUrl(e.target.value)} 
                            className="w-full bg-[#050914] border border-slate-700 rounded-2xl py-4 px-6 text-sm font-bold text-blue-400 focus:outline-none focus:border-blue-500 placeholder:text-slate-800 shadow-inner relative z-10" 
                          />
                          <Link2 size={16} className="absolute right-5 top-4 text-slate-700" />
                       </div>
                    </div>
                  )}

                  {selectedOutputs.includes('device_link') && (
                    <div className="space-y-6 animate-in fade-in duration-500 pt-6 border-t border-slate-800/50">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Video size={14} className="text-blue-400" /> 連動控制列表
                       </label>
                       <div className="space-y-5">
                          {linkedDevices.map((link, idx) => {
                            const showDelay = link.type === 'gate';
                            return (
                              <div key={link.id} className="p-6 bg-black/40 border border-slate-800 rounded-[2.5rem] space-y-6 relative group shadow-inner">
                                 <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">連動項 {idx + 1}</span>
                                    {linkedDevices.length > 1 && <button onClick={() => removeLinkedDevice(link.id)} className="p-2 text-slate-700 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>}
                                 </div>
                                 <div className="space-y-2">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">選擇設備</span>
                                    <select 
                                      value={link.deviceId} 
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        let type: 'camera' | 'host' | 'gate' = 'camera';
                                        let action = 'record_on';
                                        
                                        if (val === 'host-current') {
                                          type = 'host';
                                          action = 'warn_prompt';
                                        } else if (val.startsWith('gate')) {
                                          type = 'gate';
                                          action = 'gate_open';
                                        }
                                        
                                        updateLinkedDevice(link.id, { deviceId: val, type, action });
                                      }}
                                      className="w-full bg-[#111827] border border-slate-700 rounded-2xl py-3.5 px-4 text-xs font-black text-slate-300 outline-none focus:border-blue-500 transition-all appearance-none shadow-xl"
                                    >
                                       <option value="">未選取設備...</option>
                                       <optgroup label="攝影機清單">
                                          {CAMERA_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                       </optgroup>
                                       <optgroup label="控制設備清單">
                                          {GATE_LIST.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                       </optgroup>
                                       {selectedHostId && (
                                         <optgroup label="主機音效設備">
                                            <option value="host-current">目前主機 ({currentHostLabel})</option>
                                         </optgroup>
                                       )}
                                    </select>
                                  </div>

                                  {link.deviceId && (
                                    <div className="space-y-4 animate-in slide-in-from-top-4">
                                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">執行動作</span>
                                      <div className="grid grid-cols-1 gap-2">
                                        {(link.type === 'camera' ? CAMERA_ACTIONS : link.type === 'host' ? HOST_ACTIONS : GATE_ACTIONS).map(act => (
                                          <button 
                                            key={act.id} 
                                            onClick={() => updateLinkedDevice(link.id, { action: act.id })}
                                            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all shadow-md ${link.action === act.id ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40' : 'bg-[#050914] border-slate-700 text-slate-600 hover:border-slate-600'}`}
                                          >
                                            {act.label}
                                            {link.action === act.id && <Check size={16} strokeWidth={4} />}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {showDelay && (
                                    <div className="space-y-3 pt-2 animate-in fade-in">
                                      <div className="flex items-center justify-between text-[10px] font-black">
                                         <span className="text-slate-600 uppercase tracking-widest flex items-center gap-2"><Timer size={14}/> 延時執行 (秒)</span>
                                         <span className="text-blue-400 font-mono text-xs">{link.delay}s</span>
                                      </div>
                                      <div className="px-2">
                                        <input 
                                          type="range" min="0" max="300" step="5"
                                          value={link.delay} onChange={(e) => updateLinkedDevice(link.id, { delay: e.target.value })}
                                          className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-blue-600 cursor-pointer shadow-inner"
                                        />
                                      </div>
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                          <button onClick={addLinkedDevice} className="w-full py-6 border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 hover:text-blue-500 hover:border-blue-900/40 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest bg-[#050914]/40 group shadow-xl">
                             <Plus size={20} className="group-hover:scale-110 transition-transform" /> 新增其他連動設備
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/20 border border-dashed border-slate-800 rounded-[2.5rem] opacity-40">
                  <MapIcon size={48} className="text-slate-600 mb-4" />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest leading-relaxed">請先完成範圍與<br/>排程設定</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isPreviewOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
             <div className="bg-[#111827] border border-slate-700 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40 shrink-0">
                   <div className="flex items-center gap-5">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40"><Eye size={28}/></div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic uppercase italic">情境設定預覽 <span className="text-blue-500">.</span></h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Review your rule before deployment</p>
                      </div>
                   </div>
                   <button onClick={() => setIsPreviewOpen(false)} className="p-3 hover:bg-red-500/20 rounded-2xl text-slate-500 hover:text-red-500 transition-all"><X size={32}/></button>
                </div>
                
                <div className="p-10 space-y-12 overflow-y-auto max-h-[65vh] custom-scrollbar">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] ml-1"><Building2 size={16}/> 基本範圍與排程</div>
                      <div className="bg-[#050914] p-8 rounded-[2.5rem] border border-slate-800 space-y-6 shadow-inner">
                         <div className="flex justify-between items-center"><span className="text-xs text-slate-600 font-black uppercase tracking-widest">情境規則名稱</span><span className="text-base font-black text-white italic">{newEventName || '未命名情境'}</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs text-slate-600 font-black uppercase tracking-widest">部署範圍</span><span className="text-sm font-black text-slate-300">{currentSiteLabel} > {currentHostLabel} > {currentZoneLabel}</span></div>
                         <div className="h-px bg-slate-800/50"></div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 font-black uppercase tracking-widest">排程模式</span>
                            <span className="text-[10px] font-black text-blue-400 bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-800 uppercase tracking-widest shadow-xl">
                              {scheduleType === 'always' ? '永遠啟動 (ALWAYS)' : scheduleType === 'custom' ? '自訂時段 (CUSTOM)' : scheduleType === 'security-sync' ? '保全同步連動 (SECURITY)' : '到點執行模式 (POINTS)'}
                            </span>
                         </div>
                         
                         {/* 詳細排程摘要 - 自訂時段 */}
                         {scheduleType === 'custom' && timeBlocks.length > 0 && (
                           <div className="mt-4 space-y-3 p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl animate-in fade-in">
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                                <Clock size={12}/> 已設定時段摘要
                              </div>
                              <div className="space-y-2.5">
                                {DAYS_OPTIONS.map((day, dIdx) => {
                                  const blocks = timeBlocks.filter(b => b.day === dIdx);
                                  if (blocks.length === 0) return null;
                                  return (
                                    <div key={day} className="flex items-start gap-4 text-[11px]">
                                      <span className="text-blue-500 font-black shrink-0 w-8">週{day}</span>
                                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        {blocks.map(b => (
                                          <span key={b.id} className="text-slate-300 font-mono font-bold tracking-tighter">
                                            {formatMinutesToTime(b.startMinutes)} - {formatMinutesToTime(b.endMinutes)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                           </div>
                         )}

                         {/* 詳細排程摘要 - 到點執行 */}
                         {scheduleType === 'time-points' && timePoints.length > 0 && (
                           <div className="mt-4 space-y-3 p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl animate-in fade-in">
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                                <Calendar size={12}/> 預定執行時間點
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                 {timePoints.map(tp => (
                                   <div key={tp.id} className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                                      <span className="text-sm font-black text-white font-mono tracking-tighter">{tp.time}</span>
                                      <div className="flex gap-1">
                                         {tp.days.map(d => (
                                           <span key={d} className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white text-[9px] font-black rounded-md shadow-lg">{d}</span>
                                         ))}
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}

                         {scheduleType === 'security-sync' && (
                           <div className="flex flex-col gap-3 p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
                             <div className="flex items-center gap-3">
                               <Shield size={16} className="text-blue-500" />
                               <span className="text-[10px] font-black text-slate-300 uppercase">關連保全動作點 ({selectedSecurityEventIds.size})</span>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {selectedSecurityEvents.map(se => (
                                   <span key={se.id} className="text-[9px] font-black text-blue-400 bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-800/40">
                                      {se.name} {se.time} ({se.statusLabel})
                                   </span>
                                ))}
                             </div>
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center gap-3 text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] ml-1"><Database size={16}/> 觸發條件設定</div>
                      <div className="bg-[#050914] border border-slate-800 p-8 rounded-[2.5rem] flex items-center justify-between shadow-inner">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20"><Cpu size={24}/></div>
                            <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">EVENT TRIGGER</span>
                               <span className="text-sm font-black text-slate-200">
                                  {scheduleType === 'security-sync' 
                                    ? `隨上述 ${selectedSecurityEventIds.size} 個保全動作同步觸發`
                                    : triggerSourceType === 'time' 
                                      ? '排程同步觸發模式 (Scheduled Logic)' 
                                      : `${triggerCondition.device} : ${triggerCondition.event}`}
                               </span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center gap-3 text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] ml-1"><Zap size={16}/> 執行連動與通知</div>
                      <div className="space-y-4">
                         {selectedOutputs.includes('notify') && (
                           <div className="bg-[#050914] p-8 rounded-[2.5rem] border border-slate-800 space-y-8 shadow-inner">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4 text-slate-500 uppercase tracking-widest"><Mail size={18}/><span className="text-[10px] font-black">通知媒體</span></div>
                                 <div className="flex gap-2">
                                    {selectedNotifyMediums.map(m => (
                                      <span key={m} className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg">{m}</span>
                                    ))}
                                 </div>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4 text-slate-500 uppercase tracking-widest"><UserCheck size={18}/><span className="text-[10px] font-black">通知對象</span></div>
                                 <span className="text-sm font-black text-white italic">{selectedRecipients.map(id => RECIPIENTS.find(r => r.id === id)?.name).join(', ')}</span>
                              </div>
                           </div>
                         )}

                         {selectedOutputs.includes('webhook') && (
                           <div className="bg-[#050914] p-8 rounded-[2.5rem] border border-slate-800 flex items-center justify-between shadow-inner">
                              <div className="flex items-center gap-5">
                                 <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20"><Globe size={20}/></div>
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">WEBHOOK URL</span>
                                    <span className="text-xs font-mono font-bold text-white truncate max-w-[300px]">{webhookUrl || '未設定網址'}</span>
                                 </div>
                              </div>
                              <div className="px-3 py-1 bg-green-900/20 text-green-500 text-[9px] font-black border border-green-800 rounded">READY</div>
                           </div>
                         )}

                         {selectedOutputs.includes('device_link') && linkedDevices.map((link, idx) => (
                           <div key={idx} className="bg-[#050914] p-8 rounded-[2.5rem] border border-slate-800 flex items-center justify-between group shadow-inner">
                              <div className="flex items-center gap-5">
                                 <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform"><Video size={20}/></div>
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">連動設備 {idx+1}</span>
                                    <div className="text-sm font-black text-white">
                                      {link.deviceId === 'host-current' 
                                        ? `目前主機 (${currentHostLabel})` 
                                        : (CAMERA_LIST.concat(GATE_LIST).find(c => c.id === link.deviceId)?.name || '未選設備')}
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-900/20 px-4 py-1.5 rounded-xl border border-blue-800/40 shadow-xl">{getActionLabel(link.type, link.action)}</div>
                                 {link.type === 'gate' && link.delay !== '0' && (
                                   <div className="text-[10px] font-mono text-slate-500 mt-2 flex items-center justify-end gap-1.5 font-black uppercase tracking-tighter">
                                      <Clock size={10} /> 延時執行 {link.delay}s
                                   </div>
                                 )}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex gap-6 shrink-0 shadow-2xl">
                   <button onClick={() => setIsPreviewOpen(false)} className="flex-1 py-5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 rounded-[1.8rem] font-black uppercase tracking-[0.2em] border border-slate-700 transition-all text-xs">返回修改</button>
                   <button onClick={() => { setIsPreviewOpen(false); setIsCreating(false); }} className="flex-[1.8] py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-4 active:scale-95 ring-1 ring-white/10">
                      <CheckCircle size={22}/> 確認並發布規則
                   </button>
                </div>
             </div>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 z-[3100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
             <div className="bg-[#111827] border border-slate-700 rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.9)] p-12 max-w-md w-full ring-1 ring-white/5 animate-in zoom-in-95 duration-200 text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-inner">
                   <AlertTriangle className="text-red-500" size={56} />
                </div>
                <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tighter">確定刪除規則？</h2>
                <p className="text-base text-slate-500 mb-10 leading-relaxed font-medium">此操作將永久移除此項自訂情境連動規則，且無法復原。您確定要繼續嗎？</p>
                
                <div className="grid grid-cols-2 gap-6">
                   <button onClick={() => deleteScenario(deleteConfirmId)} className="py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-900/40 transition-all active:scale-95">確認刪除</button>
                   <button onClick={() => setDeleteConfirmId(null)} className="py-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-700 transition-all active:scale-95">返回</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-800/50">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic uppercase">情境管理 <span className="text-blue-600">.</span></h1>
          <p className="text-sm text-slate-500 font-medium italic">根據個人需求自訂感測器通知與設備連動規則</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-900/30 flex items-center gap-3 active:scale-95"><Plus size={20} /> 新增自訂情境</button>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-visible shadow-2xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <table className="w-full text-left border-collapse relative z-10">
          <thead>
            <tr className="bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
              <th className="px-8 py-6">情境規則名稱</th>
              <th className="px-8 py-6">範圍 (SCOPE)</th>
              <th className="px-8 py-6">觸發邏輯</th>
              <th className="px-8 py-6 text-center">排程模式</th>
              <th className="px-8 py-6">執行動作</th>
              <th className="px-8 py-6">狀態</th>
              <th className="px-8 py-6 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {scenarios.map((scenario) => (
              <tr key={scenario.id} className="group hover:bg-white/5 transition-all">
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-white italic">{scenario.name}</span>
                    <span className="text-[10px] font-mono text-slate-600 font-black uppercase tracking-widest">ID: {scenario.id}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-black text-slate-400 block whitespace-nowrap uppercase tracking-widest">{scenario.siteLabel}</span>
                  <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-widest">{scenario.hostLabel} > {scenario.zoneLabel}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 bg-[#050914] px-4 py-2 rounded-xl border border-slate-800 w-fit shadow-inner">
                    <Cpu size={16} className="text-orange-400"/>
                    <span className="text-xs text-slate-300 font-black tracking-tight">{scenario.triggerDevice} ({scenario.triggerEvent})</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-4 py-1.5 rounded-lg border border-blue-500/20 shadow-xl">
                    {scenario.scheduleType === 'time-points' ? 'POINTS' : scenario.scheduleType === 'security-sync' ? 'SECURITY' : scenario.scheduleType}
                   </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-700/50 px-2.5 py-1 rounded text-blue-400 shadow-sm">
                        <Mail size={10}/>
                        <span className="text-[9px] font-black uppercase tracking-widest">通知: {scenario.notifyRecipients.join(', ')}</span>
                      </div>
                    </div>
                    {scenario.linkedDevicesCount > 0 && (
                      <div className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/50 px-2.5 py-1 rounded text-purple-400 w-fit shadow-sm">
                        <Video size={10}/>
                        <span className="text-[9px] font-black uppercase tracking-widest">連動: {scenario.linkedDevicesCount} 設備</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${scenario.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${scenario.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    {scenario.isActive ? '啟用中' : '已停用'}
                  </div>
                </td>
                <td className="px-8 py-6 text-right relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === scenario.id ? null : scenario.id)}
                    className="p-3 text-slate-600 hover:text-white transition-all bg-slate-800/40 rounded-xl border border-transparent hover:border-slate-700 hover:shadow-xl group"
                  >
                    <MoreVertical size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  
                  {activeMenuId === scenario.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                      <div className="absolute right-14 top-1/2 -translate-y-1/2 w-56 bg-[#1e293b] border border-slate-700 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-20 overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
                        <button 
                          onClick={() => toggleScenarioActive(scenario.id)}
                          className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-700 text-sm font-black text-slate-300 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Power size={16} className={scenario.isActive ? 'text-orange-400' : 'text-green-400'}/>
                            <span className="uppercase tracking-widest text-[11px]">{scenario.isActive ? '停用情境' : '啟用情境'}</span>
                          </div>
                          {scenario.isActive ? <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> : <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                        </button>
                        <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-700 text-[11px] font-black text-slate-300 transition-colors border-t border-slate-700/50 uppercase tracking-widest">
                          <Pencil size={16} className="text-blue-400"/>
                          編輯情境內容
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(scenario.id)}
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-900/30 text-[11px] font-black text-red-400 transition-colors border-t border-slate-700/50 uppercase tracking-widest"
                        >
                          <Trash2 size={16} className="text-red-500"/>
                          刪除此規則
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-[3rem] p-10 flex items-center gap-10 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[40px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
         <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shrink-0 shadow-2xl shadow-blue-900/40 relative z-10 group-hover:rotate-6 transition-transform">
            <Info size={40} />
         </div>
         <div className="space-y-3 relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase">什麼是情境？</h3>
            <p className="text-base text-slate-400 leading-relaxed font-medium">
               自訂情境允許您針對特定的硬體狀態設定通知規則。這些規則可根據排程與保全狀態進行過濾，符合條件時系統會自動執行連動動作。
            </p>
         </div>
      </div>
    </div>
  );
};

export default EventManagementView;