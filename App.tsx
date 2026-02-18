
import React, { useState, useRef } from 'react';
import { Download, Clock, Calendar, LayoutGrid, Type, Hash, Maximize2, Settings2, Menu, X, Plus, Trash2, MoveHorizontal, FileJson, Upload, Palette, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { TimelineScale, Task, HeaderGroup, THEMES } from './types';
import TimelineChart from './components/TimelineChart';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', label: 'เริ่มต้นโครงการ', slots: [0, 1, 2], color: '#3b82f6' },
    { id: '2', label: 'ออกแบบ UI/UX', slots: [3, 4, 5, 6], color: '#10b981' },
    { id: '3', label: 'พัฒนาระบบหลังบ้าน', slots: [6, 7, 8, 9, 10], color: '#f59e0b' },
  ]);
  const [headerGroups, setHeaderGroups] = useState<HeaderGroup[]>([
    { id: 'g1', label: 'มกราคม', start: 0, end: 3 }
  ]);
  const [scale, setScale] = useState<TimelineScale>(TimelineScale.DAILY);
  const [themeKey, setThemeKey] = useState<string>('modern');
  const [title, setTitle] = useState<string>('แผนผังระยะเวลาโครงการ (Timeline)');
  const [description, setDescription] = useState<string>('กำหนดการและขั้นตอนการดำเนินงานที่สำคัญของทีม');
  const [columnCount, setColumnCount] = useState<number>(20);
  const [minColumnWidth, setMinColumnWidth] = useState<number>(60);
  const [taskListWidth, setTaskListWidth] = useState<number>(window.innerWidth < 768 ? 120 : 250);
  const [showVerticalLines, setShowVerticalLines] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [customTimeLabels, setCustomTimeLabels] = useState<Record<string, string>>({});
  const [taskListLabel, setTaskListLabel] = useState<string>('รายการงาน');
  const [activeSection, setActiveSection] = useState<string>('general'); // For accordion if needed, currently distinct blocks
  
  const chartRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      label: 'รายการใหม่',
      slots: [],
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
    };
    setTasks([...tasks, newTask]);
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addHeaderGroup = () => {
    const lastEndIndex = headerGroups.length > 0 
      ? Math.max(...headerGroups.map(g => g.end)) 
      : -1;
    const newStart = lastEndIndex + 1;
    const newEnd = newStart + 3; 
    const newGroup: HeaderGroup = {
      id: Date.now().toString(),
      label: 'หัวข้อใหม่',
      start: newStart,
      end: newEnd
    };
    setHeaderGroups([...headerGroups, newGroup]);
  };

  const updateHeaderGroup = (id: string, updates: Partial<HeaderGroup>) => {
    setHeaderGroups(headerGroups.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeHeaderGroup = (id: string) => {
    setHeaderGroups(headerGroups.filter(g => g.id !== id));
  };

  const toggleSlot = (taskId: string, slotIndex: number, forceState?: boolean) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const isCurrentlySelected = task.slots.includes(slotIndex);
        let shouldSelect = !isCurrentlySelected;

        // If forceState is provided, use it instead of toggling
        if (typeof forceState === 'boolean') {
          shouldSelect = forceState;
        }

        // Optimize: if state doesn't change, return original task
        if (shouldSelect === isCurrentlySelected) return task;

        const newSlots = shouldSelect
          ? [...task.slots, slotIndex].sort((a, b) => a - b)
          : task.slots.filter(s => s !== slotIndex);
        return { ...task, slots: newSlots };
      }
      return task;
    }));
  };

  const getNextLabel = (current: string): string => {
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiIdx = thaiMonths.indexOf(current);
    if (thaiIdx !== -1) return thaiMonths[(thaiIdx + 1) % 12];

    const engMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const engIdx = engMonths.findIndex(m => m.toLowerCase() === current.toLowerCase());
    if (engIdx !== -1) return engMonths[(engIdx + 1) % 12];
    
    const match = current.match(/^(.*?)(\d+)(.*)$/);
    if (match) {
      const prefix = match[1];
      const numberStr = match[2];
      const suffix = match[3];
      const nextNumber = parseInt(numberStr, 10) + 1;
      return `${prefix}${nextNumber}${suffix}`;
    }
    return current;
  };

  const updateTimeLabel = (index: number, value: string) => {
    setCustomTimeLabels(prev => {
      const newLabels = { ...prev, [`${scale}-${index}`]: value };
      if (index === 0) {
        let currentVal = value;
        for (let i = 1; i < columnCount; i++) {
          const nextVal = getNextLabel(currentVal);
          if (nextVal !== currentVal) {
            newLabels[`${scale}-${i}`] = nextVal;
            currentVal = nextVal;
          } else {
            break; 
          }
        }
      }
      return newLabels;
    });
  };

  const handlePasteTasks = (taskId: string, lines: string[]) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === taskId);
      if (idx === -1) return prev;
      
      const newTasks = [...prev];
      // Update the current task with the first line
      newTasks[idx] = { ...newTasks[idx], label: lines[0] };
      
      // Create and insert subsequent tasks
      const newItems = lines.slice(1).map((line, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        label: line,
        slots: [], 
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
      }));
      
      newTasks.splice(idx + 1, 0, ...newItems);
      return newTasks;
    });
  };

  const handleExportConfig = () => {
    const config = {
      version: 1,
      timestamp: Date.now(),
      tasks,
      headerGroups,
      scale,
      themeKey,
      title,
      description,
      columnCount,
      minColumnWidth,
      taskListWidth,
      showVerticalLines,
      customTimeLabels,
      taskListLabel
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `timeline-config-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const config = JSON.parse(json);
        
        if (config.tasks) setTasks(config.tasks);
        if (config.headerGroups) setHeaderGroups(config.headerGroups);
        if (config.scale) setScale(config.scale);
        if (config.themeKey) setThemeKey(config.themeKey);
        if (config.title) setTitle(config.title);
        if (config.description) setDescription(config.description);
        if (config.columnCount) setColumnCount(config.columnCount);
        if (config.minColumnWidth) setMinColumnWidth(config.minColumnWidth);
        if (config.taskListWidth) setTaskListWidth(config.taskListWidth);
        if (config.showVerticalLines !== undefined) setShowVerticalLines(config.showVerticalLines);
        if (config.customTimeLabels) setCustomTimeLabels(config.customTimeLabels);
        if (config.taskListLabel) setTaskListLabel(config.taskListLabel);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('เกิดข้อผิดพลาด: ไฟล์ Config ไม่ถูกต้อง');
      }
    };
    reader.readAsText(fileObj);
    event.target.value = '';
  };

  const exportAsPng = async () => {
    if (chartRef.current && scrollContainerRef.current) {
      const chartElement = chartRef.current;
      const scrollContainer = scrollContainerRef.current;
      
      try {
        const originalScrollOverflow = scrollContainer.style.overflowX;
        const originalScrollWidth = scrollContainer.style.width;
        
        const originalChartWidth = chartElement.style.width;
        const originalChartMinWidth = chartElement.style.minWidth;
        const originalChartMaxWidth = chartElement.style.maxWidth;
        const originalChartBoxShadow = chartElement.style.boxShadow;

        scrollContainer.style.overflowX = 'visible';
        scrollContainer.style.width = 'fit-content';
        
        chartElement.style.width = 'fit-content';
        chartElement.style.minWidth = 'auto'; // Reset min-width
        chartElement.style.maxWidth = 'none'; // Reset max-width
        chartElement.style.boxShadow = 'none';

        // Map theme keys to specific hex colors for export
        const themeBgColors: Record<string, string> = {
          modern: '#ffffff',
          dark: '#000000',
          minimal: '#fff1f2', // bg-rose-50
          forest: '#ecfdf5', // bg-emerald-50
        };

        const dataUrl = await htmlToImage.toPng(chartElement, { 
          quality: 1, 
          backgroundColor: themeBgColors[themeKey] || '#ffffff',
          pixelRatio: 2,
        });

        scrollContainer.style.overflowX = originalScrollOverflow;
        scrollContainer.style.width = originalScrollWidth;
        
        chartElement.style.width = originalChartWidth;
        chartElement.style.minWidth = originalChartMinWidth;
        chartElement.style.maxWidth = originalChartMaxWidth;
        chartElement.style.boxShadow = originalChartBoxShadow;

        const link = document.createElement('a');
        link.download = `timeline-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed', err);
        alert('เกิดข้อผิดพลาดในการส่งออกรูปภาพ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  const currentTheme = THEMES[themeKey];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-x-hidden text-slate-700 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
             <LayoutGrid className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Timeline Maker</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-slate-100/50 border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 transform backdrop-blur-sm
        md:translate-x-0 md:static md:z-auto md:shadow-none md:bg-slate-50
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Timeline Maker</h1>
              <p className="text-[10px] text-slate-500 font-medium">Professional Tool</p>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          
          {/* Section: Display Settings */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider mb-1">
              <Palette className="w-3.5 h-3.5 text-blue-500" /> การแสดงผล
            </div>

            {/* Time Scale Segmented Control */}
            <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as TimelineScale[]).map((s) => (
                <button 
                  key={s}
                  onClick={() => {
                    setScale(s);
                    if (s === TimelineScale.DAILY) setColumnCount(20);
                    else setColumnCount(12);
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${
                    scale === s 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {s === 'DAILY' ? 'รายวัน' : s === 'WEEKLY' ? 'รายสัปดาห์' : 'รายเดือน'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 mb-1 block">จำนวนช่อง</label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="number" 
                    min={1} 
                    max={100}
                    value={columnCount}
                    onChange={(e) => setColumnCount(Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-2 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 mb-1 block">ความกว้างช่อง</label>
                <div className="flex items-center h-[34px] border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <button 
                    onClick={() => setMinColumnWidth(prev => Math.max(30, prev - 5))}
                    className="h-full px-2 hover:bg-slate-200 text-slate-500 transition-colors"
                  >-</button>
                  <div className="flex-1 text-center text-xs font-bold text-slate-700 select-none">
                    {minColumnWidth}
                  </div>
                  <button 
                    onClick={() => setMinColumnWidth(prev => Math.min(200, prev + 5))}
                    className="h-full px-2 hover:bg-slate-200 text-slate-500 transition-colors"
                  >+</button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowVerticalLines(!showVerticalLines)}
              className={`w-full py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                showVerticalLines 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <span>เส้นตารางแนวตั้ง</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${showVerticalLines ? 'bg-blue-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showVerticalLines ? 'left-4.5 translate-x-1' : 'left-0.5'}`} />
              </div>
            </button>
            
            <div>
              <label className="text-[10px] font-semibold text-slate-400 mb-2 block">ธีมสี</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(THEMES).map(key => (
                  <button
                    key={key}
                    onClick={() => setThemeKey(key)}
                    className={`relative text-[10px] py-2 px-3 border rounded-lg font-bold text-left transition-all overflow-hidden group ${
                      themeKey === key 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="relative z-10">{THEMES[key].name}</span>
                    {themeKey === key && <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Headers */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
             <div className="flex items-center justify-between mb-1">
               <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                 <Layers className="w-3.5 h-3.5 text-blue-500" /> กลุ่มเวลา (Header)
               </div>
               <button 
                 onClick={addHeaderGroup}
                 className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
               >
                 <Plus className="w-3.5 h-3.5" />
               </button>
             </div>
             
             <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                {headerGroups.map(group => (
                  <div key={group.id} className="p-2 border border-slate-100 rounded-lg bg-white hover:border-slate-300 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={group.label}
                          onChange={(e) => updateHeaderGroup(group.id, { label: e.target.value })}
                          className="w-full bg-transparent border-none text-[11px] font-bold text-slate-700 p-0 focus:ring-0 placeholder:text-slate-400"
                          placeholder="ชื่อกลุ่ม..."
                        />
                      </div>
                      <button onClick={() => removeHeaderGroup(group.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                         <span className="text-[9px] text-slate-400 font-medium">เริ่ม</span>
                         <input 
                            type="number" min={1}
                            value={group.start + 1}
                            onChange={(e) => updateHeaderGroup(group.id, { start: Math.max(0, (parseInt(e.target.value)||1)-1) })}
                            className="w-8 text-center text-[10px] font-bold border-none p-0 focus:ring-0 text-slate-600 bg-transparent"
                         />
                       </div>
                       <div className="w-2 h-[1px] bg-slate-300"></div>
                       <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                         <span className="text-[9px] text-slate-400 font-medium">ถึง</span>
                         <input 
                            type="number" min={1}
                            value={group.end + 1}
                            onChange={(e) => updateHeaderGroup(group.id, { end: Math.max(0, (parseInt(e.target.value)||1)-1) })}
                            className="w-8 text-center text-[10px] font-bold border-none p-0 focus:ring-0 text-slate-600 bg-transparent"
                         />
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Section: Tasks */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[200px]">
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                 <MoveHorizontal className="w-3.5 h-3.5 text-blue-500" /> รายการงาน
               </div>
               <button 
                 onClick={addTask}
                 className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-colors"
               >
                 <Plus className="w-3 h-3" /> เพิ่ม
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
               {tasks.map(task => (
                 <div key={task.id} className="group flex items-center gap-2 p-2 border border-slate-100 rounded-lg bg-white hover:shadow-sm hover:border-blue-200 transition-all">
                    <div className="relative w-5 h-5 rounded-md overflow-hidden flex-shrink-0 cursor-pointer shadow-sm ring-1 ring-black/5 hover:scale-110 transition-transform">
                      <input 
                        type="color" 
                        value={task.color}
                        onChange={(e) => updateTask(task.id, { color: e.target.value })}
                        className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
                      />
                    </div>
                    <input 
                      type="text" 
                      value={task.label}
                      onChange={(e) => updateTask(task.id, { label: e.target.value })}
                      className="flex-1 bg-transparent border-none text-[11px] font-semibold text-slate-700 p-0 focus:ring-0 placeholder:text-slate-400"
                      placeholder="ชื่องาน..."
                    />
                    <button 
                      onClick={() => removeTask(task.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
               ))}
               {tasks.length === 0 && (
                 <div className="text-center py-6 text-[10px] text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                   ไม่มีรายการงาน
                 </div>
               )}
             </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col items-center justify-start overflow-hidden bg-slate-100">
         {/* Background Pattern */}
         <div className="absolute inset-0 z-0 opacity-[0.03]" 
              style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
         </div>

        <div className="w-full h-full overflow-auto custom-scrollbar p-4 md:p-10 flex flex-col items-center z-10">
          <div 
            ref={chartRef}
            className={`w-full max-w-full md:w-auto md:min-w-[700px] shadow-2xl shadow-slate-300/50 rounded-2xl overflow-hidden ${currentTheme.bg} transition-all duration-300 border border-slate-200/60 flex flex-col`}
          >
            <div className="p-6 md:p-12">
              <header className={`mb-8 border-b border-dashed ${currentTheme.grid} pb-6`}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="w-full md:w-2/3">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full bg-transparent border-none p-0 text-2xl md:text-4xl font-extrabold mb-2 tracking-tight focus:ring-0 placeholder:text-slate-300 outline-none ${currentTheme.text}`}
                      placeholder="คลิกเพื่อใส่ชื่อโครงการ..."
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full bg-transparent border-none p-0 text-sm md:text-base opacity-70 font-light resize-none focus:ring-0 placeholder:text-slate-300 outline-none ${currentTheme.text}`}
                      placeholder="คลิกเพื่อใส่คำอธิบาย..."
                      rows={1}
                      onInput={(e) => {
                         const target = e.target as HTMLTextAreaElement;
                         target.style.height = 'auto';
                         target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1 opacity-60 flex-shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${currentTheme.text}`}>
                      <Calendar className="w-3 h-3" /> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${currentTheme.text}`}>
                      <Clock className="w-3 h-3" /> {scale === TimelineScale.DAILY ? 'Daily Scale' : scale === TimelineScale.WEEKLY ? 'Weekly Scale' : 'Monthly Scale'}
                    </span>
                  </div>
                </div>
              </header>

              <div 
                ref={scrollContainerRef}
                className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200/50 bg-white/50 backdrop-blur-sm"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                 <TimelineChart 
                  tasks={tasks} 
                  headerGroups={headerGroups}
                  scale={scale} 
                  theme={currentTheme} 
                  columnCount={columnCount}
                  minColumnWidth={minColumnWidth}
                  taskListWidth={taskListWidth}
                  showVerticalLines={showVerticalLines}
                  customTimeLabels={customTimeLabels}
                  taskListLabel={taskListLabel}
                  onUpdateTimeLabel={updateTimeLabel}
                  onToggleSlot={toggleSlot}
                  onAddTask={addTask}
                  onRemoveTask={removeTask}
                  onUpdateTask={updateTask}
                  onUpdateTaskListLabel={setTaskListLabel}
                  onUpdateHeaderGroupLabel={(id, label) => updateHeaderGroup(id, { label })}
                  onPasteTasks={handlePasteTasks}
                  onTaskListWidthChange={setTaskListWidth}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2 pb-24">
             <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 shadow-sm text-[11px] text-slate-500 font-medium">
                 <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                 <span>คลิ๊กในช่องเพื่อแก้ไข / เลื่อนแนวนอนเพื่อดู</span>
                 <span className="w-[1px] h-3 bg-slate-300 mx-1"></span>
                 <span className="font-bold text-slate-600">Created with BigBundit</span>
             </div>
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
        {/* JSON Controls */}
        <div className="flex bg-white rounded-full shadow-xl border border-slate-200 p-1.5 gap-1">
          <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImportConfig} 
          />
          <button 
            onClick={handleExportConfig}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-all text-xs font-bold"
          >
            <FileJson className="w-4 h-4" /> 
            <span>บันทึก Config</span>
          </button>
          <div className="w-[1px] bg-slate-200 my-1"></div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-all text-xs font-bold"
          >
            <Upload className="w-4 h-4" /> 
            <span>โหลด Config</span>
          </button>
        </div>

        {/* Main Export Action */}
        <button 
          onClick={exportAsPng}
          className="group flex items-center gap-3 bg-green-600 text-white px-6 py-3.5 rounded-full shadow-2xl shadow-green-600/30 hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Download className="w-5 h-5 group-hover:animate-bounce" /> 
          <span className="font-bold text-sm">ส่งออกเป็นรูปภาพ (PNG)</span>
        </button>
      </div>
    </div>
  );
};

export default App;
