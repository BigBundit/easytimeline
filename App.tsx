
import React, { useState, useRef } from 'react';
import { Download, Clock, Calendar, LayoutGrid, Type, Hash, Maximize2, Settings2, Menu, X, Plus, Trash2, MoveHorizontal } from 'lucide-react';
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
    { id: 'g1', label: 'มกราคม', start: 0, end: 3 },
    { id: 'g2', label: 'กุมภาพันธ์', start: 4, end: 7 }
  ]);
  const [scale, setScale] = useState<TimelineScale>(TimelineScale.DAILY);
  const [themeKey, setThemeKey] = useState<string>('modern');
  const [title, setTitle] = useState<string>('แผนผังระยะเวลาโครงการ (Timeline)');
  const [description, setDescription] = useState<string>('กำหนดการและขั้นตอนการดำเนินงานที่สำคัญของทีม');
  const [columnCount, setColumnCount] = useState<number>(20);
  const [minColumnWidth, setMinColumnWidth] = useState<number>(60);
  const [showVerticalLines, setShowVerticalLines] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [customTimeLabels, setCustomTimeLabels] = useState<Record<string, string>>({});
  const [taskListLabel, setTaskListLabel] = useState<string>('รายการงาน');
  
  const chartRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    // Find the max end index from existing groups to append after it
    const lastEndIndex = headerGroups.length > 0 
      ? Math.max(...headerGroups.map(g => g.end)) 
      : -1;
      
    const newStart = lastEndIndex + 1;
    const newEnd = newStart + 3; // Default duration of 4

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

  const toggleSlot = (taskId: string, slotIndex: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newSlots = task.slots.includes(slotIndex)
          ? task.slots.filter(s => s !== slotIndex)
          : [...task.slots, slotIndex].sort((a, b) => a - b);
        return { ...task, slots: newSlots };
      }
      return task;
    }));
  };

  // Helper to calculate the next sequence value
  const getNextLabel = (current: string): string => {
    // Check for Thai Months
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiIdx = thaiMonths.indexOf(current);
    if (thaiIdx !== -1) return thaiMonths[(thaiIdx + 1) % 12];

    // Check for English Months (Short)
    const engMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const engIdx = engMonths.findIndex(m => m.toLowerCase() === current.toLowerCase());
    if (engIdx !== -1) return engMonths[(engIdx + 1) % 12];
    
    // Check for Text + Number sequence (e.g., "W1", "Day 1", "Week-05")
    // Regex finds: (Any Prefix)(Last Number Sequence)(Any Suffix)
    const match = current.match(/^(.*?)(\d+)(.*)$/);
    if (match) {
      const prefix = match[1];
      const numberStr = match[2];
      const suffix = match[3];
      const nextNumber = parseInt(numberStr, 10) + 1;
      return `${prefix}${nextNumber}${suffix}`;
    }

    return current; // Return same if no pattern found
  };

  const updateTimeLabel = (index: number, value: string) => {
    setCustomTimeLabels(prev => {
      const newLabels = { ...prev, [`${scale}-${index}`]: value };
      
      // Auto-increment logic: if the first column (index 0) is changed
      if (index === 0) {
        let currentVal = value;
        for (let i = 1; i < columnCount; i++) {
          const nextVal = getNextLabel(currentVal);
          // Only update if we successfully generated a new sequential value (not just copied)
          if (nextVal !== currentVal) {
            newLabels[`${scale}-${i}`] = nextVal;
            currentVal = nextVal;
          } else {
             // If we can't increment anymore (e.g., just random text), stop auto-filling
            break; 
          }
        }
      }
      
      return newLabels;
    });
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

        scrollContainer.style.overflowX = 'visible';
        scrollContainer.style.width = 'auto';
        chartElement.style.width = 'auto';
        chartElement.style.minWidth = 'max-content';

        const dataUrl = await htmlToImage.toPng(chartElement, { 
          quality: 1, 
          backgroundColor: THEMES[themeKey].bg.startsWith('bg-white') ? '#ffffff' : '#0f172a',
          pixelRatio: 2,
        });

        scrollContainer.style.overflowX = originalScrollOverflow;
        scrollContainer.style.width = originalScrollWidth;
        chartElement.style.width = originalChartWidth;
        chartElement.style.minWidth = originalChartMinWidth;

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
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row relative overflow-x-hidden text-slate-700">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-700 text-sm">Easy Timeline</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 p-5 flex flex-col gap-5 shadow-xl transition-transform duration-300 transform 
        md:translate-x-0 md:static md:z-auto md:shadow-sm overflow-y-auto custom-scrollbar
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:block">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            Easy Timeline
          </h1>
          <p className="text-xs text-slate-400">สร้างแผนผังของคุณให้สวยงาม</p>
        </div>

        <section className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ข้อมูลพื้นฐาน</label>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-2 mb-1">
                <Type className="w-3.5 h-3.5 text-slate-400" /> หัวข้อหลัก
              </span>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-600 focus:ring-2 focus:ring-blue-400 focus:outline-none focus:bg-white transition-all"
              />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-2 mb-1">
                <Settings2 className="w-3.5 h-3.5 text-slate-400" /> คำอธิบาย
              </span>
              <textarea 
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-600 focus:ring-2 focus:ring-blue-400 focus:outline-none focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">การแสดงผล</label>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">หน่วยเวลา</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as TimelineScale[]).map((s) => (
                  <button 
                    key={s}
                    onClick={() => {
                      setScale(s);
                      if (s === TimelineScale.DAILY) setColumnCount(20);
                      else setColumnCount(12);
                    }}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${scale === s ? 'bg-white shadow-sm text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {s === 'DAILY' ? 'วัน' : s === 'WEEKLY' ? 'สัปดาห์' : 'เดือน'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" /> ช่อง
                </span>
                <input 
                  type="number" 
                  min={1} 
                  max={100}
                  value={columnCount}
                  onChange={(e) => setColumnCount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-600 focus:ring-2 focus:ring-blue-400 focus:outline-none focus:bg-white transition-all"
                />
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                  <MoveHorizontal className="w-3.5 h-3.5 text-slate-400" /> ขนาด
                </span>
                <div className="flex items-center h-[34px]">
                  <button 
                    onClick={() => setMinColumnWidth(prev => Math.max(30, prev - 5))}
                    className="h-full px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-r-0 rounded-l-lg text-slate-500 transition-colors"
                  >-</button>
                  <div className="flex-1 h-full flex items-center justify-center border-y border-slate-200 bg-white text-xs text-slate-600 font-medium">
                    {minColumnWidth}
                  </div>
                  <button 
                    onClick={() => setMinColumnWidth(prev => Math.min(200, prev + 5))}
                    className="h-full px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-l-0 rounded-r-lg text-slate-500 transition-colors"
                  >+</button>
                </div>
              </div>

              <div className="col-span-2 flex flex-col">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> เส้นตาราง (แนวตั้ง)
                </span>
                <button 
                  onClick={() => setShowVerticalLines(!showVerticalLines)}
                  className={`w-full py-2 px-2 border rounded-lg text-[10px] font-bold transition-all ${showVerticalLines ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                >
                  {showVerticalLines ? 'แสดง' : 'ซ่อน'}
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1.5">สไตล์แผนภูมิ</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(THEMES).map(key => (
                  <button
                    key={key}
                    onClick={() => setThemeKey(key)}
                    className={`text-[11px] py-2 px-2 border rounded-lg font-bold transition-all ${
                      themeKey === key 
                        ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-sm' 
                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-white hover:text-slate-600'
                    }`}
                  >
                    {THEMES[key].name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">หัวข้อหน่วยหลัก (เช่น เดือน)</label>
            <button 
              onClick={addHeaderGroup}
              className="p-1 hover:bg-blue-50 text-blue-500 rounded-full transition-colors"
              title="เพิ่มต่อจากรายการล่าสุด"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {headerGroups.map(group => (
              <div key={group.id} className="p-2 border border-slate-100 rounded-xl bg-slate-50 space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={group.label}
                    onChange={(e) => updateHeaderGroup(group.id, { label: e.target.value })}
                    className="flex-1 bg-transparent border-none text-[10px] font-bold focus:ring-0 p-0 text-slate-600"
                    placeholder="หัวข้อ (เช่น ม.ค.)"
                  />
                  <button onClick={() => removeHeaderGroup(group.id)} className="text-slate-400 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400">เริ่ม:</span>
                  <input 
                    type="number" 
                    min={1}
                    value={group.start + 1} 
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 0);
                      updateHeaderGroup(group.id, { start: val - 1 });
                    }}
                    className="w-12 bg-white border border-slate-200 rounded px-1 text-center text-slate-600"
                  />
                  <span className="text-slate-400">ถึง:</span>
                  <input 
                    type="number" 
                    min={1}
                    value={group.end + 1} 
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 0);
                      updateHeaderGroup(group.id, { end: val - 1 });
                    }}
                    className="w-12 bg-white border border-slate-200 rounded px-1 text-center text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Restore Task Management Section */}
        <section className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายการทั้งหมด</label>
            <button 
              onClick={addTask}
              className="p-1 hover:bg-blue-50 text-blue-500 rounded-full transition-colors"
              title="เพิ่มรายการ"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {tasks.map(task => (
              <div key={task.id} className="group p-2.5 border border-slate-100 rounded-xl bg-slate-50 hover:border-blue-200 hover:bg-white transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={task.color}
                    onChange={(e) => updateTask(task.id, { color: e.target.value })}
                    className="w-4 h-4 rounded cursor-pointer border-none bg-transparent flex-shrink-0"
                  />
                  <input 
                    type="text" 
                    value={task.label}
                    onChange={(e) => updateTask(task.id, { label: e.target.value })}
                    className="flex-1 bg-transparent border-none text-xs font-semibold focus:ring-0 p-0 text-slate-600 placeholder:text-slate-300"
                    placeholder="ชื่อรายการ..."
                  />
                  <button 
                    onClick={() => removeTask(task.id)}
                    className="md:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button 
          onClick={exportAsPng}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors shadow-lg active:scale-95"
        >
          <Download className="w-4 h-4" />
          ส่งออกเป็น PNG
        </button>
      </aside>

      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 p-3 md:p-8 flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-100/50">
        <div 
          ref={chartRef}
          className={`w-full max-w-full md:w-auto md:min-w-[600px] shadow-2xl rounded-2xl overflow-hidden ${currentTheme.bg} transition-all duration-500 border border-slate-200 flex flex-col`}
        >
          <div className="p-5 md:p-12">
            <header className={`mb-6 md:mb-10 border-b pb-4 md:pb-6 ${currentTheme.grid}`}>
              <h2 className={`text-xl md:text-3xl font-bold mb-2 ${currentTheme.text}`}>{title}</h2>
              <p className={`text-xs md:text-sm mb-4 max-w-2xl leading-relaxed opacity-70 ${currentTheme.text}`}>{description}</p>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[10px] md:text-sm opacity-50">
                <span className={`flex items-center gap-1 ${currentTheme.text}`}>
                  <Calendar className="w-3.5 h-3.5 md:w-4 h-4" /> {new Date().toLocaleDateString('th-TH')}
                </span>
                <span className={`flex items-center gap-1 ${currentTheme.text}`}>
                  <Clock className="w-3.5 h-3.5 md:w-4 h-4" /> {scale === TimelineScale.DAILY ? 'รายวัน' : scale === TimelineScale.WEEKLY ? 'รายสัปดาห์' : 'รายเดือน'}
                </span>
              </div>
            </header>

            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto custom-scrollbar rounded-lg border border-slate-100 bg-white"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
               <TimelineChart 
                tasks={tasks} 
                headerGroups={headerGroups}
                scale={scale} 
                theme={currentTheme} 
                columnCount={columnCount}
                minColumnWidth={minColumnWidth}
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
              />
            </div>

            <footer className={`mt-8 md:mt-10 flex flex-col md:flex-row justify-between items-center gap-2 text-[9px] md:text-[10px] uppercase tracking-widest opacity-40 ${currentTheme.text} text-center`}>
              <span>สร้างโดย Easy Timeline Maker</span>
              <span>&copy; 2026 ซินโต้ อินเทลลิเจ้นท์ จำกัด</span>
            </footer>
          </div>
        </div>
        
        <div className="mt-4 text-[10px] text-slate-400 flex flex-col items-center gap-1 italic">
          <div className="flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> แตะที่ช่องเพื่อเปิด/ปิด และเลื่อนซ้าย-ขวาเพื่อดูทั้งหมด
          </div>
          <div>แก้ไขชื่อรายการและลบรายการได้ที่แถบเมนูหรือในตาราง</div>
        </div>
      </main>
    </div>
  );
};

export default App;
