import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  MoreVertical, 
  Video, 
  DoorClosed, 
  Zap, 
  Cpu, 
  Server,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Check,
  Network,
  List,
  User,
  Home,
  FolderOpen,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';
import { SITE_TREE_DATA } from '../constants';
import { SiteNode } from '../types';

// --- Types ---
interface DeviceListItem {
  id: string;
  icon: React.ReactNode;
  typeLabel: string;
  name: string;
  parent: string;
  sn: string;
  status: 'online' | 'offline';
  version: string;
  location: string;
  ip: string;
  mac: string;
  rawType: string;
}

type ViewMode = 'list' | 'topology';

// --- Helper Functions ---
const flattenDevices = (nodes: SiteNode[], parentName: string = '', siteName: string = ''): DeviceListItem[] => {
  let devices: DeviceListItem[] = [];
  nodes.forEach(node => {
    // 如果目前節點是 Site，則更新 siteName 傳遞給子孫
    const currentSiteName = node.type === 'site' ? node.label : siteName;
    
    if (node.type === 'device') {
      const isOnline = Math.random() > 0.15;
      const typeLabel = node.deviceType === 'camera' ? 'IPCAM' : 
                        node.deviceType === 'door' ? '門磁' : 
                        node.deviceType === 'sensor' ? '感測器' : 
                        node.deviceType === 'emergency' ? '主機' : '其他';
      
      devices.push({
        id: node.id,
        icon: node.deviceType === 'camera' ? <Video size={16} /> : 
              node.deviceType === 'door' ? <DoorClosed size={16} /> : 
              node.deviceType === 'sensor' ? <Cpu size={16} /> : <Server size={16} />,
        typeLabel,
        name: node.label,
        parent: parentName || '獨立設備',
        sn: `SKS${Math.floor(100000000 + Math.random() * 900000000)}`,
        status: isOnline ? 'online' : 'offline',
        version: `R.6.0.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 9)}`,
        location: currentSiteName, // 直接使用包含括弧的 Site 名稱
        ip: `10.81.161.${180 + Math.floor(Math.random() * 50)}`,
        mac: `${Math.floor(Math.random()*255).toString(16)}:${Math.floor(Math.random()*255).toString(16)}:eb:1f:${Math.floor(Math.random()*255).toString(16)}:${Math.floor(Math.random()*255).toString(16)}`.toUpperCase(),
        rawType: node.deviceType || ''
      });
    }
    if (node.children) {
      devices = [...devices, ...flattenDevices(node.children, node.label, currentSiteName)];
    }
  });
  return devices;
};

// --- Topology Components ---
interface TopologyNodeProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  type: 'owner' | 'group' | 'site' | 'host' | 'zone' | 'device';
  status?: 'online' | 'offline';
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

const TopologyNode: React.FC<TopologyNodeProps> = ({ 
  id, 
  label, 
  icon, 
  children, 
  type,
  status,
  isExpanded,
  onToggle
}) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="flex flex-col items-center relative">
      <div className="flex flex-col items-center group relative z-10">
        <div className={`
          flex items-center justify-center rounded-2xl border transition-all duration-300 shadow-xl
          ${type === 'owner' ? 'w-20 h-20 bg-blue-500/10 border-blue-500/30 text-blue-400 p-2' : ''}
          ${type === 'group' ? 'w-18 h-18 bg-slate-800 border-slate-700 text-white' : ''}
          ${type === 'site' ? 'w-16 h-16 bg-white/5 border-slate-700 text-slate-300' : ''}
          ${type === 'host' ? 'w-14 h-14 bg-slate-800 border-slate-600 text-slate-400' : ''}
          ${type === 'zone' ? 'w-12 h-12 bg-transparent border-slate-800 text-slate-500' : ''}
          ${type === 'device' ? 'w-10 h-10 bg-slate-900 border-slate-800 text-slate-400' : ''}
          ${status === 'online' ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}
        `}>
          {icon}
        </div>
        <div className="mt-3 flex flex-col items-center">
          <span className={`text-[10px] font-black uppercase tracking-widest text-center ${type === 'owner' ? 'text-blue-400' : 'text-slate-300'}`}>
            {label}
          </span>
          {type === 'owner' && <span className="text-[10px] text-slate-500 font-bold mt-0.5">25070002-吳碧玉</span>}
        </div>

        {hasChildren && (
          <button 
            onMouseDown={(e) => e.stopPropagation()} 
            onClick={() => onToggle(id)}
            className="absolute -bottom-4 bg-[#111827] border border-slate-700 rounded-full p-0.5 text-slate-500 hover:text-white hover:border-blue-500 transition-all z-20 shadow-lg"
          >
            {isExpanded ? <Minus size={12} /> : <Plus size={12} />}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center pt-10 relative w-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-10 bg-slate-800"></div>
          <div className="flex justify-center gap-12 relative w-full px-10">
            {React.Children.count(children) > 1 && (
              <div className="absolute top-0 h-px bg-slate-800" 
                   style={{ 
                     left: `calc(100% / ${React.Children.count(children)} / 2)`, 
                     right: `calc(100% / ${React.Children.count(children)} / 2)` 
                   }}
              ></div>
            )}
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const DeviceTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  const SITE_OPTIONS = [
    '總公司 (Site)', 
    '新光保全-中山處 (Site)', 
    '新光保全-北屯處 (Site)', 
    '新光保全-大甲處 (Site)'
  ];
  
  const [selectedSites, setSelectedSites] = useState<string[]>(SITE_OPTIONS);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['online', 'offline']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['主機', 'IPCAM', '門磁', '電錶', '感測器']);

  const [expandedFilters, setExpandedFilters] = useState({ site: true, status: true, type: true });
  const [topologyExpanded, setTopologyExpanded] = useState<Set<string>>(new Set(['root-owner', 'taipei-group', 'taichung-group']));

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const topoContainerRef = useRef<HTMLDivElement>(null);

  const allDevices = useMemo(() => flattenDevices(SITE_TREE_DATA), []);

  const filteredDevices = useMemo(() => {
    return allDevices.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.sn.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSite = selectedSites.length === 0 || selectedSites.includes(d.location);
      const matchStatus = selectedStatus.length === 0 || selectedStatus.includes(d.status);
      const matchType = selectedTypes.length === 0 || selectedTypes.includes(d.typeLabel);
      return matchSearch && matchSite && matchStatus && matchType;
    });
  }, [allDevices, searchTerm, selectedSites, selectedStatus, selectedTypes]);

  const toggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleToggleAll = (options: string[], currentList: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    const isAllSelected = options.every(opt => currentList.includes(opt));
    setList(isAllSelected ? [] : options);
  };

  const toggleNode = (id: string) => {
    const next = new Set(topologyExpanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setTopologyExpanded(next);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'topology' || !topoContainerRef.current) return;
    setIsPanning(true);
    setPanStart({
      x: e.pageX - topoContainerRef.current.offsetLeft,
      y: e.pageY - topoContainerRef.current.offsetTop,
      scrollLeft: topoContainerRef.current.scrollLeft,
      scrollTop: topoContainerRef.current.scrollTop
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !topoContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - topoContainerRef.current.offsetLeft;
    const y = e.pageY - topoContainerRef.current.offsetTop;
    const walkX = (x - panStart.x);
    const walkY = (y - panStart.y);
    topoContainerRef.current.scrollLeft = panStart.scrollLeft - walkX;
    topoContainerRef.current.scrollTop = panStart.scrollTop - walkY;
  };

  const stopPanning = () => setIsPanning(false);

  // 遞迴渲染拓樸樹，配合新的 5 層結構
  const renderTopologyNodes = (nodes: SiteNode[]): React.ReactNode => {
    return nodes.map(node => {
      // 拓樸圖顯示時，如果 Site 層沒被選中，則過濾掉
      if (node.type === 'site' && !selectedSites.includes(node.label)) return null;

      const getIcon = () => {
        switch (node.type) {
          case 'group': return <Network size={28} />;
          case 'site': return <Home size={24} />;
          case 'host': return <Server size={20} />;
          case 'zone': return <FolderOpen size={18} />;
          case 'device':
            if (node.deviceType === 'camera') return <Video size={14} />;
            if (node.deviceType === 'door') return <DoorClosed size={14} />;
            if (node.deviceType === 'emergency') return <Zap size={14} />;
            return <Cpu size={14} />;
          default: return <Server size={14} />;
        }
      };

      return (
        <TopologyNode
          key={node.id}
          id={node.id}
          label={node.label}
          type={node.type}
          icon={getIcon()}
          isExpanded={topologyExpanded.has(node.id)}
          onToggle={toggleNode}
        >
          {node.children && renderTopologyNodes(node.children)}
        </TopologyNode>
      );
    });
  };

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden">
      <div className="w-72 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800/50">
           <h2 className="text-xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
                 <Server size={18} />
              </div>
              Device Center
           </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <button onClick={() => setExpandedFilters(prev => ({...prev, site: !prev.site}))} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {expandedFilters.site ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                    據點地點
                 </button>
                 <button onClick={() => handleToggleAll(SITE_OPTIONS, selectedSites, setSelectedSites)} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-colors ${selectedSites.length === SITE_OPTIONS.length ? 'bg-blue-600 text-white' : 'text-blue-500 bg-blue-500/10 hover:text-blue-400'}`}>
                   All
                 </button>
              </div>
              {expandedFilters.site && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                   {SITE_OPTIONS.map(site => (
                     <UnifiedSidebarCheckbox key={site} label={site} checked={selectedSites.includes(site)} onChange={() => toggleFilter(selectedSites, setSelectedSites, site)} />
                   ))}
                </div>
              )}
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <button onClick={() => setExpandedFilters(prev => ({...prev, status: !prev.status}))} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {expandedFilters.status ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                    連線狀態
                 </button>
                 <button onClick={() => handleToggleAll(['online', 'offline'], selectedStatus, setSelectedStatus)} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-colors ${selectedStatus.length === 2 ? 'bg-blue-600 text-white' : 'text-blue-500 bg-blue-500/10 hover:text-blue-400'}`}>
                   All
                 </button>
              </div>
              {expandedFilters.status && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                   {[
                     { id: 'online', label: '在線設備', dotColor: 'bg-green-500' },
                     { id: 'offline', label: '離線設備', dotColor: 'bg-slate-500' }
                   ].map(st => (
                     <UnifiedSidebarCheckbox key={st.id} label={st.label} dotColor={st.dotColor} checked={selectedStatus.includes(st.id)} onChange={() => toggleFilter(selectedStatus, setSelectedStatus, st.id)} />
                   ))}
                </div>
              )}
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <button onClick={() => setExpandedFilters(prev => ({...prev, type: !prev.type}))} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {expandedFilters.type ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                    設備類別
                 </button>
                 <button onClick={() => handleToggleAll(['主機', 'IPCAM', '門磁', '電錶', '感測器'], selectedTypes, setSelectedTypes)} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-colors ${selectedTypes.length === 5 ? 'bg-blue-600 text-white' : 'text-blue-500 bg-blue-500/10 hover:text-blue-400'}`}>
                   All
                 </button>
              </div>
              {expandedFilters.type && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                   {['主機', 'IPCAM', '門磁', '電錶', '感測器'].map(type => (
                     <UnifiedSidebarCheckbox key={type} label={type} checked={selectedTypes.includes(type)} onChange={() => toggleFilter(selectedTypes, setSelectedTypes, type)} />
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#050914] p-8">
         <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
               <div>
                  <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
                    {viewMode === 'list' ? 'Device Inventory' : 'Topology View'} <span className="text-blue-600">.</span>
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">即時監控所有硬體節點之通訊、韌體版本與網路配置</p>
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={() => setViewMode(viewMode === 'list' ? 'topology' : 'list')} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-2xl text-xs font-black transition-all flex items-center gap-3 shadow-xl tracking-widest uppercase group">
                     {viewMode === 'list' ? (
                       <><Network size={18} className="text-blue-400 group-hover:scale-110 transition-transform" /> 拓樸圖檢視</>
                     ) : (
                       <><List size={18} className="text-blue-400 group-hover:scale-110 transition-transform" /> 清單檢視</>
                     )}
                  </button>
                  <button className="px-5 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl text-xs font-black transition-all flex items-center gap-3 shadow-xl tracking-widest uppercase"><Download size={18} className="text-blue-400" /> 匯出清單</button>
                  <button className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-3 shadow-xl tracking-widest uppercase shadow-blue-900/20"><RefreshCw size={18} /> 掃描新設備</button>
               </div>
            </div>

            {viewMode === 'list' ? (
               <div className="flex flex-col h-full animate-in fade-in duration-500">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="relative flex-1 max-w-xl">
                          <input type="text" placeholder="輸入設備名稱或 SN 進行搜尋..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all shadow-xl" />
                          <Search size={20} className="absolute left-4 top-3.5 text-slate-600" />
                      </div>
                      <div className="h-12 px-5 bg-[#111827] border border-slate-800 rounded-2xl flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest"><Filter size={16}/>Showing: <span className="text-blue-400">{filteredDevices.length}</span> / {allDevices.length}</div>
                  </div>
                  <div className="flex-1 bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                     <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                           <thead>
                              <tr className="bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                                 <th className="px-8 py-6 w-24">類型</th>
                                 <th className="px-8 py-6">設備名稱</th>
                                 <th className="px-8 py-6">上級節點</th>
                                 <th className="px-8 py-6">SN</th>
                                 <th className="px-8 py-6">狀態</th>
                                 <th className="px-8 py-6">版本號</th>
                                 <th className="px-8 py-6">據點</th>
                                 <th className="px-8 py-6">IP</th>
                                 <th className="px-8 py-6 text-right">管理</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800/50">
                              {filteredDevices.map(device => (
                                <tr key={device.id} className="group hover:bg-white/5 transition-all">
                                   <td className="px-8 py-6"><div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-slate-600'}`}></div><div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${device.status === 'online' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{device.icon}</div></div></td>
                                   <td className="px-8 py-6"><div className="flex flex-col"><span className="text-base font-black text-white tracking-tight">{device.name}</span><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{device.typeLabel}</span></div></td>
                                   <td className="px-8 py-6"><span className="text-sm font-bold text-slate-400">{device.parent}</span></td>
                                   <td className="px-8 py-6"><span className="text-[11px] font-mono font-black text-slate-500 group-hover:text-blue-400 transition-colors uppercase">{device.sn}</span></td>
                                   <td className="px-8 py-6"><div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${device.status === 'online' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{device.status === 'online' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}{device.status === 'online' ? '在線' : '斷線'}</div></td>
                                   <td className="px-8 py-6"><span className="text-xs font-mono font-bold text-slate-400">{device.version}</span></td>
                                   <td className="px-8 py-6"><span className="text-sm font-bold text-slate-300">{device.location}</span></td>
                                   <td className="px-8 py-6"><span className="text-xs font-mono font-bold text-slate-400">{device.ip}</span></td>
                                   <td className="px-8 py-6 text-right"><button className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><MoreVertical size={20} /></button></td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="flex-1 bg-[#111827] border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 relative">
                  <div className="p-6 border-b border-slate-800/50 bg-black/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4"><div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg"><Network size={16}/></div><span className="text-xs font-black text-slate-400 uppercase tracking-widest">系統連線拓樸圖 (實體架構層級)</span></div>
                  </div>
                  <div 
                    ref={topoContainerRef}
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={stopPanning} onMouseLeave={stopPanning}
                    className={`flex-1 overflow-auto custom-scrollbar p-20 flex flex-col items-center min-h-full transition-shadow select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                  >
                    <div className="flex flex-col items-center">
                        <TopologyNode id="root-owner" label="System Owner" type="owner" icon={<User size={36} strokeWidth={1.5} />} isExpanded={topologyExpanded.has("root-owner")} onToggle={toggleNode}>
                           {renderTopologyNodes(SITE_TREE_DATA)}
                        </TopologyNode>
                    </div>
                  </div>
                  <div className="absolute bottom-8 right-8 p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col gap-3 shadow-2xl z-30 pointer-events-none">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-1">圖例說明</h4>
                    <div className="flex items-center gap-3"><div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white"><User size={14}/></div><span className="text-[11px] font-bold text-slate-300">擁有者 / 管理員</span></div>
                    <div className="flex items-center gap-3"><div className="w-6 h-6 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 border border-slate-700"><Home size={14}/></div><span className="text-[11px] font-bold text-slate-300">據點 (Site)</span></div>
                    <div className="flex items-center gap-3"><div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 border border-slate-800"><Server size={14}/></div><span className="text-[11px] font-bold text-slate-300">主機 (Host)</span></div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

const UnifiedSidebarCheckbox: React.FC<{ label: string; checked: boolean; onChange: () => void; dotColor?: string; }> = ({ label, checked, onChange, dotColor }) => (
  <label onClick={(e) => { e.preventDefault(); onChange(); }} className={`flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border transition-all cursor-pointer group ${checked ? 'border-blue-500 bg-blue-500/5 shadow-[0_5px_15px_rgba(37,99,235,0.1)]' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'}`}>
     <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-700'}`}>{checked && <Check size={12} className="text-white animate-in zoom-in duration-200" />}</div>
     <div className="flex items-center gap-2 flex-1 min-w-0">{dotColor && <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>}<span className={`text-xs font-bold truncate ${checked ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>{label}</span></div>
  </label>
);

export default DeviceTab;
