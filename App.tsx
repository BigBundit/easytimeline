
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
  const [themeKey, setThemeKey] = useState<string>('cartoon');
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
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Initialize date with local time to avoid timezone issues
  const [projectDate, setProjectDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const chartRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'});
  };

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
      setIsExporting(true);
      const chartElement = chartRef.current;
      const scrollContainer = scrollContainerRef.current;
      const scrollWrapper = scrollWrapperRef.current;
      
      try {
        const originalScrollOverflow = scrollContainer.style.overflowX;
        const originalScrollWidth = scrollContainer.style.width;
        const originalWrapperOverflow = scrollWrapper ? scrollWrapper.style.overflow : '';
        
        const originalChartWidth = chartElement.style.width;
        const originalChartMinWidth = chartElement.style.minWidth;
        const originalChartMaxWidth = chartElement.style.maxWidth;
        const originalChartBoxShadow = chartElement.style.boxShadow;

        scrollContainer.style.overflowX = 'visible';
        scrollContainer.style.width = 'fit-content';
        
        if (scrollWrapper) {
          scrollWrapper.style.overflow = 'visible';
          scrollWrapper.style.width = 'fit-content';
        }
        
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

        // Wait a bit for styles to apply (helps with rendering on some devices)
        await new Promise(resolve => setTimeout(resolve, 100));

        const blob = await htmlToImage.toBlob(chartElement, { 
          quality: 1, 
          backgroundColor: themeBgColors[themeKey] || '#ffffff',
          pixelRatio: 2,
        });

        scrollContainer.style.overflowX = originalScrollOverflow;
        scrollContainer.style.width = originalScrollWidth;
        
        if (scrollWrapper) {
          scrollWrapper.style.overflow = originalWrapperOverflow;
          scrollWrapper.style.width = '';
        }
        
        chartElement.style.width = originalChartWidth;
        chartElement.style.minWidth = originalChartMinWidth;
        chartElement.style.maxWidth = originalChartMaxWidth;
        chartElement.style.boxShadow = originalChartBoxShadow;

        if (!blob) {
           throw new Error('Could not generate image blob');
        }

        const fileName = `timeline-${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        
        // Try Web Share API first (works best on Android/iOS)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Timeline Export',
              text: 'My timeline chart',
            });
          } catch (shareError) {
            if ((shareError as Error).name !== 'AbortError') {
              // Fallback to download if share fails (but not if user aborted)
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }
        } else {
          // Fallback for desktop or browsers without share support
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

      } catch (err) {
        console.error('Export failed', err);
        alert('เกิดข้อผิดพลาดในการส่งออกรูปภาพ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsExporting(false);
      }
    }
  };

  const currentTheme = THEMES[themeKey];

  return (
    <div className="min-h-screen bg-amber-300 flex flex-col md:flex-row relative overflow-x-hidden text-black font-['Prompt']">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-blue-400 border-b-4 border-black sticky top-0 z-50 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white border-2 border-black rounded-lg text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
             <LayoutGrid className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-lg drop-shadow-md" style={{ textShadow: '2px 2px 0 #000' }}>EzTimeline</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-blue-400 border-r-4 border-black flex flex-col shadow-2xl transition-transform duration-300 transform
        md:translate-x-0 md:static md:z-auto md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b-4 border-black bg-blue-500">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-white border-2 border-black rounded-xl text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight tracking-wide" style={{ textShadow: '2px 2px 0 #000' }}>EzTimeline</h1>
              <p className="text-xs text-blue-100 font-bold tracking-wider opacity-90">Professional Tool</p>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-blue-400">
          
          {/* Section: Display Settings */}
          <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
             <div className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-wider mb-1">
              <Palette className="w-4 h-4 text-black" /> การแสดงผล
            </div>

            {/* Time Scale Segmented Control */}
            <div className="bg-blue-100 p-1.5 rounded-xl border-2 border-black flex shadow-inner">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as TimelineScale[]).map((s) => (
                <button 
                  key={s}
                  onClick={() => {
                    setScale(s);
                    if (s === TimelineScale.DAILY) setColumnCount(20);
                    else setColumnCount(12);
                  }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-200 border-2 ${
                    scale === s 
                      ? 'bg-white border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
                      : 'border-transparent text-slate-500 hover:text-black hover:bg-blue-200'
                  }`}
                >
                  {s === 'DAILY' ? 'รายวัน' : s === 'WEEKLY' ? 'รายสัปดาห์' : 'รายเดือน'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">จำนวนช่อง</label>
                <div className="relative group">
                  <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                  <input 
                    type="number" 
                    min={1} 
                    max={100}
                    value={columnCount}
                    onChange={(e) => setColumnCount(Number(e.target.value))}
                    className="w-full pl-9 pr-2 py-2.5 border-2 border-black bg-white rounded-xl text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">ความกว้าง</label>
                <div className="flex items-center h-[42px] border-2 border-black rounded-xl bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <button 
                    onClick={() => setMinColumnWidth(prev => Math.max(30, prev - 5))}
                    className="h-full px-3 hover:bg-slate-100 text-black font-bold transition-colors border-r-2 border-black"
                  >-</button>
                  <div className="flex-1 text-center text-sm font-bold text-black select-none">
                    {minColumnWidth}
                  </div>
                  <button 
                    onClick={() => setMinColumnWidth(prev => Math.min(200, prev + 5))}
                    className="h-full px-3 hover:bg-slate-100 text-black font-bold transition-colors border-l-2 border-black"
                  >+</button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowVerticalLines(!showVerticalLines)}
              className={`w-full py-2.5 px-4 border-2 border-black rounded-xl text-xs font-bold flex items-center justify-between transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] ${
                showVerticalLines 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'bg-white text-slate-500'
              }`}
            >
              <span>เส้นตารางแนวตั้ง</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors border-2 border-black ${showVerticalLines ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full border border-black transition-transform ${showVerticalLines ? 'left-5 translate-x-0.5' : 'left-0.5'}`} />
              </div>
            </button>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase">ธีมสี</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(THEMES).map(key => (
                  <button
                    key={key}
                    onClick={() => setThemeKey(key)}
                    className={`relative text-[10px] py-2.5 px-3 border-2 border-black rounded-xl font-bold text-left transition-all overflow-hidden group ${
                      themeKey === key 
                        ? 'bg-blue-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="relative z-10">{THEMES[key].name}</span>
                    {themeKey === key && <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-500 border-l-2 border-black" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Headers */}
          <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
             <div className="flex items-center justify-between mb-1">
               <div className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-wider">
                 <Layers className="w-4 h-4 text-black" /> กลุ่มเวลา (Header)
               </div>
               <button 
                 onClick={addHeaderGroup}
                 className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-black text-black hover:bg-blue-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
               >
                 <Plus className="w-4 h-4" />
               </button>
             </div>
             
             <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                {headerGroups.map(group => (
                  <div key={group.id} className="p-3 border-2 border-black rounded-xl bg-slate-50 hover:bg-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={group.label}
                          onChange={(e) => updateHeaderGroup(group.id, { label: e.target.value })}
                          className="w-full bg-white border-2 border-black rounded-lg px-2 py-1 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="ชื่อกลุ่ม..."
                        />
                      </div>
                      <button onClick={() => removeHeaderGroup(group.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-2 py-1 flex-1">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">เริ่ม</span>
                         <input 
                            type="number" min={1}
                            value={group.start + 1}
                            onChange={(e) => updateHeaderGroup(group.id, { start: Math.max(0, (parseInt(e.target.value)||1)-1) })}
                            className="w-full text-center text-xs font-bold border-none p-0 focus:ring-0 text-black bg-transparent"
                         />
                       </div>
                       <div className="text-black font-bold">-</div>
                       <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-2 py-1 flex-1">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">ถึง</span>
                         <input 
                            type="number" min={1}
                            value={group.end + 1}
                            onChange={(e) => updateHeaderGroup(group.id, { end: Math.max(0, (parseInt(e.target.value)||1)-1) })}
                            className="w-full text-center text-xs font-bold border-none p-0 focus:ring-0 text-black bg-transparent"
                         />
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Section: Tasks */}
          <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-1 flex flex-col min-h-[250px]">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-wider">
                 <MoveHorizontal className="w-4 h-4 text-black" /> รายการงาน
               </div>
               <button 
                 onClick={addTask}
                 className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border-2 border-black text-black text-[10px] font-bold hover:bg-blue-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
               >
                 <Plus className="w-3.5 h-3.5" /> เพิ่ม
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
               {tasks.map(task => (
                 <div key={task.id} className="group flex items-center gap-2 p-2 border-2 border-black rounded-xl bg-slate-50 hover:bg-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border-2 border-black shadow-sm hover:scale-105 transition-transform">
                      <input 
                        type="color" 
                        value={task.color}
                        onChange={(e) => updateTask(task.id, { color: e.target.value })}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                      />
                    </div>
                    <input 
                      type="text" 
                      value={task.label}
                      onChange={(e) => updateTask(task.id, { label: e.target.value })}
                      className="flex-1 bg-transparent border-none text-xs font-bold text-black p-0 focus:ring-0 placeholder:text-slate-400"
                      placeholder="ชื่องาน..."
                    />
                    <button 
                      onClick={() => removeTask(task.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
               {tasks.length === 0 && (
                 <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
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
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col items-center justify-start overflow-hidden bg-amber-300">
         {/* Background Pattern */}
         <div className="absolute inset-0 z-0 opacity-[0.1]" 
              style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}>
         </div>

        <div className="w-full h-full overflow-auto custom-scrollbar p-4 md:p-10 flex flex-col items-center z-10">
          <div 
            ref={chartRef}
            className={`w-full max-w-full md:w-auto md:min-w-[800px] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden bg-white transition-all duration-300 border-4 border-black flex flex-col`}
          >
            <div className="p-6 md:p-10">
              <header className="mb-8 border-b-4 border-black border-dashed pb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="w-full md:w-2/3">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-3xl md:text-5xl font-black mb-3 tracking-tight focus:ring-0 placeholder:text-slate-300 outline-none text-black"
                      placeholder="ชื่อโครงการ..."
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-sm md:text-lg opacity-80 font-bold resize-none focus:ring-0 placeholder:text-slate-300 outline-none text-slate-600"
                      placeholder="คำอธิบาย..."
                      rows={1}
                      onInput={(e) => {
                         const target = e.target as HTMLTextAreaElement;
                         target.style.height = 'auto';
                         target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-2 opacity-80 flex-shrink-0">
                    <div className="relative inline-flex items-center justify-center cursor-pointer group">
                      <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-black bg-yellow-200 px-3 py-1 rounded-full border-2 border-black group-hover:bg-yellow-300 transition-colors pointer-events-none select-none">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(projectDate)}
                      </span>
                      <style>{`
                        .date-input-full-trigger::-webkit-calendar-picker-indicator {
                          position: absolute;
                          top: 0;
                          left: 0;
                          right: 0;
                          bottom: 0;
                          width: auto;
                          height: auto;
                          color: transparent;
                          background: transparent;
                          cursor: pointer;
                        }
                      `}</style>
                      <input 
                        type="date" 
                        value={projectDate}
                        onChange={(e) => setProjectDate(e.target.value)}
                        className="date-input-full-trigger absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20"
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-black bg-blue-200 px-3 py-1 rounded-full border-2 border-black">
                      <Clock className="w-3.5 h-3.5" /> {scale === TimelineScale.DAILY ? 'Daily Scale' : scale === TimelineScale.WEEKLY ? 'Weekly Scale' : 'Monthly Scale'}
                    </span>
                  </div>
                </div>
              </header>

              <div 
                ref={scrollWrapperRef}
                className="relative rounded-2xl overflow-hidden bg-white"
              >
                {/* Border Overlay to fix sticky z-index clipping */}
                <div className="absolute inset-0 border-4 border-black rounded-2xl pointer-events-none z-40" />
                
                <div 
                  ref={scrollContainerRef}
                  className="overflow-x-auto custom-scrollbar"
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
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2 pb-24">
             <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs text-black font-bold transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
                 <Maximize2 className="w-4 h-4 text-blue-500" />
                 <span>คลิ๊กในช่องเพื่อแก้ไข / เลื่อนแนวนอนเพื่อดู</span>
                 <span className="w-[2px] h-4 bg-black mx-1"></span>
                 <span className="text-slate-600">Created with BigBundit</span>
             </div>
             <span className="text-[10px] text-slate-500/50 font-mono font-bold tracking-widest">v.20260220.0225</span>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-bold animate-pulse">กำลังสร้างรูปภาพ...</p>
          <p className="text-sm text-white/60 mt-2">กรุณารอสักครู่ (อาจใช้เวลา 5-10 วินาที)</p>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        {/* JSON Controls & Fullscreen */}
        <div className="flex bg-white rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-2 gap-2">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-10 h-10 text-black hover:bg-slate-100 rounded-full transition-all border border-transparent hover:border-slate-200"
            title="เต็มจอ"
          >
            {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <div className="w-[2px] bg-black my-1"></div>
          <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImportConfig} 
          />
          <button 
            onClick={handleExportConfig}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-slate-100 rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200"
          >
            <FileJson className="w-4 h-4" /> 
            <span>บันทึก Config</span>
          </button>
          <div className="w-[2px] bg-black my-1"></div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-slate-100 rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200"
          >
            <Upload className="w-4 h-4" /> 
            <span>โหลด Config</span>
          </button>
        </div>

        {/* Main Export Action */}
        <button 
          onClick={exportAsPng}
          className="group flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:bg-green-400 hover:scale-[1.02] active:scale-95 active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all"
        >
          <Download className="w-6 h-6 group-hover:animate-bounce" /> 
          <span className="font-black text-base drop-shadow-md" style={{ textShadow: '1px 1px 0 #000' }}>ส่งออกเป็นรูปภาพ (PNG)</span>
        </button>
      </div>
    </div>
  );
};

export default App;
