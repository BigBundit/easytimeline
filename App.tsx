
import React, { useState, useRef } from 'react';
import { Download, Clock, Calendar, LayoutGrid, Type, Hash, Maximize2, Settings2, Menu, X, Plus, Trash2, MoveHorizontal, FileJson, Upload, Palette, ChevronDown, ChevronRight, Layers, ClipboardPaste, ExternalLink } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { TimelineScale, Task, HeaderGroup, THEMES } from './types';
import TimelineChart from './components/TimelineChart';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

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
  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const [exportedConfig, setExportedConfig] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [language, setLanguage] = useState<'th' | 'en'>('th');

  const t = (key: string) => {
    const translations: Record<string, { th: string, en: string }> = {
      // General
      'project_title_placeholder': { th: 'ชื่อโครงการ...', en: 'Project Name...' },
      'description_placeholder': { th: 'คำอธิบาย...', en: 'Description...' },
      'daily_scale': { th: 'รายวัน', en: 'Daily' },
      'weekly_scale': { th: 'รายสัปดาห์', en: 'Weekly' },
      'monthly_scale': { th: 'รายเดือน', en: 'Monthly' },
      'daily_scale_label': { th: 'Daily Scale', en: 'Daily Scale' },
      'weekly_scale_label': { th: 'Weekly Scale', en: 'Weekly Scale' },
      'monthly_scale_label': { th: 'Monthly Scale', en: 'Monthly Scale' },
      
      // Sidebar
      'display_settings': { th: 'การแสดงผล', en: 'Display Settings' },
      'column_count': { th: 'จำนวนช่อง', en: 'Columns' },
      'column_width': { th: 'ความกว้าง', en: 'Width' },
      'vertical_lines': { th: 'เส้นตารางแนวตั้ง', en: 'Vertical Lines' },
      'theme': { th: 'ธีมสี', en: 'Theme' },
      'header_groups': { th: 'กลุ่มเวลา (Header)', en: 'Header Groups' },
      'header_new': { th: 'หัวข้อใหม่', en: 'New Header' },
      'header_placeholder': { th: 'ชื่อกลุ่ม...', en: 'Group Name...' },
      'start': { th: 'เริ่ม', en: 'Start' },
      'end': { th: 'ถึง', en: 'End' },
      'tasks': { th: 'รายการงาน', en: 'Tasks' },
      'add': { th: 'เพิ่ม', en: 'Add' },
      'task_new': { th: 'รายการใหม่', en: 'New Task' },
      'task_placeholder': { th: 'ชื่องาน...', en: 'Task Name...' },
      'no_tasks': { th: 'ไม่มีรายการงาน', en: 'No tasks available' },
      
      // Buttons & Modals
      'save_config': { th: 'บันทึก Config', en: 'Save Config' },
      'paste_config': { th: 'วาง Config', en: 'Paste Config' },
      'load_file': { th: 'โหลดไฟล์', en: 'Load File' },
      'export_png': { th: 'ส่งออกเป็นรูปภาพ (PNG)', en: 'Export as PNG' },
      'import_config_title': { th: 'นำเข้า Config (JSON)', en: 'Import Config (JSON)' },
      'import_config_desc': { th: 'วางโค้ด JSON ที่ได้จากการบันทึก Config ลงในช่องด้านล่าง', en: 'Paste the JSON code from your saved config below' },
      'cancel': { th: 'ยกเลิก', en: 'Cancel' },
      'import': { th: 'นำเข้า Config', en: 'Import Config' },
      'image_ready': { th: 'รูปภาพพร้อมแล้ว!', en: 'Image Ready!' },
      'save_image_hint_mobile': { th: 'แตะค้างที่รูปภาพเพื่อบันทึก (Save Image)', en: 'Long press image to save' },
      'save_image_hint_desktop': { th: 'คลิกขวาที่รูปภาพเพื่อบันทึก', en: 'Right click image to save' },
      'download': { th: 'ดาวน์โหลด', en: 'Download' },
      'download_image': { th: 'ดาวน์โหลดรูปภาพ', en: 'Download Image' },
      'open_new_tab': { th: 'เปิดแท็บใหม่', en: 'Open New Tab' },
      'config_json': { th: 'Config JSON', en: 'Config JSON' },
      'config_fallback_desc': { th: 'หากไม่สามารถบันทึกไฟล์ได้ ให้คัดลอกข้อความด้านล่างเก็บไว้ แล้วนำมาวางในไฟล์ .json เพื่อโหลดภายหลัง', en: 'If file save fails, copy the text below and save it as a .json file for later loading.' },
      'copy_config': { th: 'คัดลอก Config', en: 'Copy Config' },
      'download_file': { th: 'ดาวน์โหลดไฟล์', en: 'Download File' },
      'copy_success': { th: 'คัดลอกเรียบร้อย!', en: 'Copied!' },
      'loading_image': { th: 'กำลังสร้างรูปภาพ...', en: 'Generating Image...' },
      'loading_wait': { th: 'กรุณารอสักครู่ (อาจใช้เวลา 5-10 วินาที)', en: 'Please wait (may take 5-10 seconds)' },
      'error_export': { th: 'เกิดข้อผิดพลาดในการส่งออกรูปภาพ กรุณาลองใหม่อีกครั้ง', en: 'Error exporting image. Please try again.' },
      'error_config_load': { th: 'เกิดข้อผิดพลาดในการโหลด Config', en: 'Error loading config' },
      'config_loaded': { th: 'โหลด Config เรียบร้อย!', en: 'Config loaded successfully!' },
      'invalid_json': { th: 'รูปแบบ JSON ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', en: 'Invalid JSON format. Please check again.' },
      'config_invalid_file': { th: 'เกิดข้อผิดพลาด: ไฟล์ Config ไม่ถูกต้อง', en: 'Error: Invalid config file' },
      'popup_blocked': { th: 'Pop-up ถูกบล็อก กรุณาอนุญาต Pop-up', en: 'Pop-up blocked. Please allow pop-ups.' },
    };
    return translations[key]?.[language] || key;
  };
  
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
      label: t('task_new'),
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
      label: t('header_new'),
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

  const handleExportConfig = async () => {
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
    
    const jsonString = JSON.stringify(config, null, 2);
    setExportedConfig(jsonString);
  };

  const applyConfig = (config: any) => {
    try {
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
      if (config.projectDate) setProjectDate(config.projectDate);
      alert(t('config_loaded'));
    } catch (error) {
      console.error('Error applying config:', error);
      alert(t('error_config_load'));
    }
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const config = JSON.parse(json);
        applyConfig(config);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert(t('config_invalid_file'));
      }
    };
    reader.readAsText(fileObj);
    event.target.value = '';
  };

  const handleImportText = () => {
    if (!importText.trim()) return;
    try {
      const config = JSON.parse(importText);
      applyConfig(config);
      setShowImportModal(false);
      setImportText('');
    } catch (error) {
      alert(t('invalid_json'));
    }
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

        // 1. Fetch Google Fonts CSS manually
        let fontCss = '';
        try {
          const fontUrl = 'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap';
          const response = await fetch(fontUrl);
          fontCss = await response.text();
        } catch (e) {
          console.warn('Failed to fetch font CSS:', e);
        }

        // 2. Swap Link for Style (to avoid CORS error in html-to-image)
        // We remove the external link so html-to-image doesn't try to read its rules
        const fontLink = document.querySelector('link[href*="fonts.googleapis.com"]');
        let tempStyle: HTMLStyleElement | null = null;

        if (fontLink && fontCss) {
           tempStyle = document.createElement('style');
           tempStyle.textContent = fontCss;
           document.head.appendChild(tempStyle);
           fontLink.remove();
        }

        // Wait a bit for styles to apply
        await new Promise(resolve => setTimeout(resolve, 100));

        let blob: Blob | null = null;
        try {
          blob = await htmlToImage.toBlob(chartElement, { 
            quality: 1, 
            backgroundColor: themeBgColors[themeKey] || '#ffffff',
            pixelRatio: 2,
            filter: (node) => {
              // Double safety: filter out if it somehow still exists
              if (node instanceof Element && node.tagName === 'LINK' && node.getAttribute('href')?.includes('fonts.googleapis')) {
                return false;
              }
              return true;
            }
          });
        } finally {
          // 3. Restore Link and Remove Temp Style
          if (fontLink && tempStyle) {
             document.head.removeChild(tempStyle);
             document.head.appendChild(fontLink);
          }
        }

        // Restore styles immediately
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
        
        if (Capacitor.isNativePlatform()) {
          // Request permissions if needed
          const permStatus = await Filesystem.requestPermissions();
          console.log('Permission status:', permStatus);
          if (permStatus.publicStorage !== 'granted') {
            alert('Permission denied to save files');
            return;
          }
          
          // Convert blob to base64
          console.log('Converting blob to base64...');
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
          const base64Data = btoa(binaryString);
          
          console.log('Saving file...');
          // Save to external storage
          try {
            const result = await Filesystem.writeFile({
              path: `Download/${fileName}`,
              data: base64Data,
              directory: Directory.ExternalStorage,
            });
            console.log('File saved:', result);
            alert(`Image saved to Downloads`);
          } catch (error) {
            console.error('Failed to save file:', error);
            alert('Failed to save image: ' + error.message);
          }
        } else {
          // Web fallback
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
                // Fallback: Show image in modal for long-press save
                const reader = new FileReader();
                reader.onloadend = () => {
                  setExportedImage(reader.result as string);
                };
                reader.readAsDataURL(blob);
              }
            }
          } else {
            // Fallback: Show image in modal for long-press save (Desktop/No-Share Mobile)
            const reader = new FileReader();
            reader.onloadend = () => {
              setExportedImage(reader.result as string);
            };
            reader.readAsDataURL(blob);
          }
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
              <Palette className="w-4 h-4 text-black" /> {t('display_settings')}
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
                  {s === 'DAILY' ? t('daily_scale') : s === 'WEEKLY' ? t('weekly_scale') : t('monthly_scale')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">{t('column_count')}</label>
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
                <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">{t('column_width')}</label>
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
              <span>{t('vertical_lines')}</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors border-2 border-black ${showVerticalLines ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full border border-black transition-transform ${showVerticalLines ? 'left-5 translate-x-0.5' : 'left-0.5'}`} />
              </div>
            </button>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase">{t('theme')}</label>
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
                 <Layers className="w-4 h-4 text-black" /> {t('header_groups')}
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
                          placeholder={t('header_placeholder')}
                        />
                      </div>
                      <button onClick={() => removeHeaderGroup(group.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-2 py-1 flex-1">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">{t('start')}</span>
                         <input 
                            type="number" min={1}
                            value={group.start + 1}
                            onChange={(e) => updateHeaderGroup(group.id, { start: Math.max(0, (parseInt(e.target.value)||1)-1) })}
                            className="w-full text-center text-xs font-bold border-none p-0 focus:ring-0 text-black bg-transparent"
                         />
                       </div>
                       <div className="text-black font-bold">-</div>
                       <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-2 py-1 flex-1">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">{t('end')}</span>
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
                 <MoveHorizontal className="w-4 h-4 text-black" /> {t('tasks')}
               </div>
               <button 
                 onClick={addTask}
                 className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border-2 border-black text-black text-[10px] font-bold hover:bg-blue-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
               >
                 <Plus className="w-3.5 h-3.5" /> {t('add')}
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
                      placeholder={t('task_placeholder')}
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
                   {t('no_tasks')}
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
                      placeholder={t('project_title_placeholder')}
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-sm md:text-lg opacity-80 font-bold resize-none focus:ring-0 placeholder:text-slate-300 outline-none text-slate-600"
                      placeholder={t('description_placeholder')}
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
                      <Clock className="w-3.5 h-3.5" /> {scale === TimelineScale.DAILY ? t('daily_scale_label') : scale === TimelineScale.WEEKLY ? t('weekly_scale_label') : t('monthly_scale_label')}
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
                 <span>{t('edit_hint')}</span>
                 <span className="w-[2px] h-4 bg-black mx-1"></span>
                 <span className="text-slate-600">Created with BigBundit</span>
             </div>
             <span className="text-[10px] text-slate-500/50 font-mono font-bold tracking-widest">v.20260220.0750</span>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-bold animate-pulse">{t('loading_image')}</p>
          <p className="text-sm text-white/60 mt-2">{t('loading_wait')}</p>
        </div>
      )}

      {/* Import Config Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-white p-4 rounded-2xl w-full max-w-lg flex flex-col gap-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2 border-slate-200">
              <h3 className="font-bold text-lg text-black">{t('import_config_title')}</h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {t('import_config_desc')}
            </p>
            <textarea 
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-48 bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400"
              placeholder='{"version": 1, "tasks": [...]}'
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowImportModal(false)}
                className="flex-1 bg-slate-200 text-slate-700 px-4 py-3 rounded-full font-bold hover:bg-slate-300 transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleImportText}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg"
              >
                {t('import')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exported Image Modal (Fallback for Android) */}
      {exportedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={() => setExportedImage(null)}>
          <div className="bg-white p-4 rounded-2xl max-w-full max-h-[90vh] flex flex-col gap-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2 border-slate-200">
              <h3 className="font-bold text-lg text-black">{t('image_ready')}</h3>
              <button onClick={() => setExportedImage(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 p-2">
              <img src={exportedImage} alt="Exported Timeline" className="max-w-full h-auto object-contain shadow-md" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-blue-600">
                <span className="md:hidden">{t('save_image_hint_mobile')}</span>
                <span className="hidden md:inline">{t('save_image_hint_desktop')}</span>
              </p>
              <div className="flex flex-col md:flex-row gap-2 justify-center">
                <a 
                  href={exportedImage} 
                  download={`timeline-${Date.now()}.png`}
                  className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition-colors w-full md:w-auto"
                >
                  <Download className="w-4 h-4" /> {t('download')}
                </a>
                <button
                  onClick={() => {
                    const win = window.open();
                    if (win) {
                      win.document.write(`<iframe src="${exportedImage}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    } else {
                      alert(t('popup_blocked'));
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white border-2 border-black text-black px-6 py-3 rounded-full font-bold hover:bg-slate-50 transition-colors w-full md:w-auto"
                >
                  <ExternalLink className="w-4 h-4" /> {t('open_new_tab')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exported Config Modal (Fallback) */}
      {exportedConfig && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={() => setExportedConfig(null)}>
          <div className="bg-white p-4 rounded-2xl w-full max-w-lg flex flex-col gap-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2 border-slate-200">
              <h3 className="font-bold text-lg text-black">{t('config_json')}</h3>
              <button onClick={() => setExportedConfig(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {t('config_fallback_desc')}
            </p>
            <textarea 
              readOnly
              value={exportedConfig}
              className="w-full h-48 bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-600 focus:outline-none resize-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(exportedConfig);
                  alert(t('copy_success'));
                }}
                className="bg-black text-white px-4 py-3 rounded-full font-bold hover:bg-slate-800 transition-colors flex-1 flex items-center justify-center gap-2"
              >
                <FileJson className="w-4 h-4" /> {t('copy_config')}
              </button>
              <button 
                onClick={() => {
                  const blob = new Blob([exportedConfig], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.href = url;
                  downloadAnchorNode.download = `timeline-config-${Date.now()}.json`;
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  document.body.removeChild(downloadAnchorNode);
                  URL.revokeObjectURL(url);
                  setExportedConfig(null);
                }}
                className="bg-blue-600 text-white px-4 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors flex-1 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> {t('download_file')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        {/* JSON Controls & Language Toggle */}
        <div className="flex bg-white rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-2 gap-2">
          <button 
            onClick={() => setLanguage(prev => prev === 'th' ? 'en' : 'th')}
            className="flex items-center justify-center w-10 h-10 text-black hover:bg-slate-100 rounded-full transition-all border border-transparent hover:border-slate-200 font-black text-xs"
            title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
          >
            {language.toUpperCase()}
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
            <span>{t('save_config')}</span>
          </button>
          <div className="w-[2px] bg-black my-1"></div>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-slate-100 rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200"
          >
            <ClipboardPaste className="w-4 h-4" /> 
            <span>{t('paste_config')}</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-slate-100 rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200"
          >
            <Upload className="w-4 h-4" /> 
            <span>{t('load_file')}</span>
          </button>
        </div>

        {/* Main Export Action */}
        <button 
          onClick={exportAsPng}
          className="group flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:bg-green-400 hover:scale-[1.02] active:scale-95 active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all"
        >
          <Download className="w-6 h-6 group-hover:animate-bounce" /> 
          <span className="font-black text-base drop-shadow-md" style={{ textShadow: '1px 1px 0 #000' }}>{t('export_png')}</span>
        </button>
      </div>
    </div>
  );
};

export default App;
