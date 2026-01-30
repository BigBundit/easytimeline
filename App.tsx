
import React, { useState, useRef } from 'react';
import { Plus, Download, Trash2, Clock, Calendar, LayoutGrid, Type, Hash, Maximize2, Settings2, Menu, X } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { TimelineScale, Task, THEMES } from './types';
import TimelineChart from './components/TimelineChart';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', label: 'เริ่มต้นโครงการ', slots: [0, 1, 2], color: '#3b82f6' },
    { id: '2', label: 'ออกแบบ UI/UX', slots: [3, 4, 5, 6], color: '#10b981' },
    { id: '3', label: 'พัฒนาระบบหลังบ้าน', slots: [6, 7, 8, 9, 10], color: '#f59e0b' },
  ]);
  const [scale, setScale] = useState<TimelineScale>(TimelineScale.DAILY);
  const [themeKey, setThemeKey] = useState<string>('modern');
  const [title, setTitle] = useState<string>('แผนผังระยะเวลาโครงการ (Timeline)');
  const [description, setDescription] = useState<string>('กำหนดการและขั้นตอนการดำเนินงานที่สำคัญของทีม');
  const [columnCount, setColumnCount] = useState<number>(20);
  const [showVerticalLines, setShowVerticalLines] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
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

  const updateTaskLabel = (id: string, label: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, label } : t));
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

  const exportAsPng = async () => {
    if (chartRef.current && scrollContainerRef.current) {
      try {
        const scrollContainer = scrollContainerRef.current;
        const originalOverflow = scrollContainer.style.overflowX;
        const originalWidth = scrollContainer.style.width;

        scrollContainer.style.overflowX = 'visible';
        scrollContainer.style.width = 'auto';

        const dataUrl = await htmlToImage.toPng(chartRef.current, { 
          quality: 0.95, 
          backgroundColor: THEMES[themeKey].bg.startsWith('bg-white') ? '#ffffff' : '#0f172a',
          style: {
            maxWidth: 'none',
            width: 'auto',
            height: 'auto',
            margin: '0'
          }
        });

        scrollContainer.style.overflowX = originalOverflow;
        scrollContainer.style.width = originalWidth;

        const link = document.createElement('a');
        link.download = `timeline-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed', err);
      }
    }
  };

  const currentTheme = THEMES[themeKey];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row relative overflow-x-hidden text-slate-700">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-700 text-sm">Easy Timeline</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Controls */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 p-5 flex flex-col gap-5 shadow-xl transition-transform duration-300 transform 
        md:translate-x-0 md:static md:z-auto md:shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:block">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            Easy Timeline
          </h1>
          <p className="text-xs text-slate-400">สร้างแผนผังของคุณให้สวยงาม</p>
        </div>

        {/* Project Meta Section */}
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

        {/* Timeline Settings */}
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
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> เส้น
                </span>
                <button 
                  onClick={() => setShowVerticalLines(!showVerticalLines)}
                  className={`w-full py-2 px-2 border rounded-lg text-[10px] font-bold transition-all ${showVerticalLines ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                >
                  {showVerticalLines ? 'เปิด' : 'ปิด'}
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

        {/* Tasks Section */}
        <section className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายการทั้งหมด</label>
            <button 
              onClick={addTask}
              className="p-1 hover:bg-blue-50 text-blue-500 rounded-full transition-colors"
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
                    onChange={(e) => {
                      setTasks(tasks.map(t => t.id === task.id ? { ...t, color: e.target.value } : t));
                    }}
                    className="w-4 h-4 rounded cursor-pointer border-none bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={task.label}
                    onChange={(e) => updateTaskLabel(task.id, e.target.value)}
                    className="flex-1 bg-transparent border-none text-xs font-semibold focus:ring-0 p-0 text-slate-600 placeholder:text-slate-300"
                    placeholder="ชื่อรายการ..."
                  />
                  <button 
                    onClick={() => removeTask(task.id)}
                    className="md:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-all"
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

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Preview Area */}
      <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-start md:justify-center overflow-auto custom-scrollbar">
        <div 
          ref={chartRef}
          className={`min-w-fit max-w-full shadow-2xl rounded-2xl overflow-hidden ${currentTheme.bg} transition-all duration-500 border border-slate-200`}
        >
          <div className="p-6 md:p-12">
            <header className={`mb-8 md:mb-10 border-b pb-6 ${currentTheme.grid}`}>
              <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${currentTheme.text}`}>{title}</h2>
              <p className={`text-xs md:text-sm mb-4 max-w-2xl leading-relaxed opacity-70 ${currentTheme.text}`}>{description}</p>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm opacity-50">
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
              className="overflow-x-auto custom-scrollbar rounded-lg"
            >
               <TimelineChart 
                tasks={tasks} 
                scale={scale} 
                theme={currentTheme} 
                columnCount={columnCount}
                showVerticalLines={showVerticalLines}
                onToggleSlot={toggleSlot}
              />
            </div>

            <footer className={`mt-10 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 ${currentTheme.text}`}>
              <span>สร้างโดย Easy Timeline Maker</span>
              <span>&copy; 2026 ซินโต้ อินเทลลิเจ้นท์ จำกัด</span>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
