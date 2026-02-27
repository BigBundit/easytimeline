
export enum TimelineScale {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface Task {
  id: string;
  label: string;
  slots: number[]; // Array of indices representing active time slots
  color: string;
  children?: Task[]; // Optional nested sub-tasks
}

export interface HeaderGroup {
  id: string;
  label: string;
  start: number;
  end: number;
}

export interface TimelineTheme {
  name: string;
  bg: string;
  grid: string;
  text: string;
  accent: string;
  headerGroupBg: string; // Background for the top header row (groups)
  headerGroupText?: string; // Specific text color for header groups
  headerRowBg: string;   // Background for the time scale row (days/weeks)
  hover: string;
  inputBg: string;
}

export const THEMES: Record<string, TimelineTheme> = {
  cartoon: {
    name: 'Cartoon Fun',
    bg: 'bg-white',
    grid: 'border-slate-200',
    text: 'text-slate-800 font-bold',
    accent: 'bg-yellow-400',
    headerGroupBg: 'bg-yellow-100',
    headerRowBg: 'bg-yellow-50',
    hover: 'hover:bg-yellow-50',
    inputBg: 'focus:bg-yellow-50'
  },
  modern: {
    name: 'Modern Blue',
    bg: 'bg-white',
    grid: 'border-slate-200',
    text: 'text-slate-800',
    accent: 'bg-blue-500',
    headerGroupBg: 'bg-slate-50/50',
    headerRowBg: 'bg-slate-50/10',
    hover: 'hover:bg-slate-50',
    inputBg: 'focus:bg-white'
  },
  dark: {
    name: 'Deep Dark',
    bg: 'bg-black',
    grid: 'border-zinc-800', // Slightly lighter than black for visibility
    text: 'text-zinc-100',
    accent: 'bg-indigo-500',
    headerGroupBg: 'bg-zinc-800',
    headerGroupText: 'text-black',
    headerRowBg: 'bg-zinc-900',
    hover: 'hover:bg-zinc-900',
    inputBg: 'focus:bg-zinc-800'
  },
  minimal: {
    name: 'Soft Minimal',
    bg: 'bg-rose-50',
    grid: 'border-rose-200',
    text: 'text-rose-900',
    accent: 'bg-rose-400',
    headerGroupBg: 'bg-rose-100',
    headerRowBg: 'bg-rose-100/50',
    hover: 'hover:bg-rose-100',
    inputBg: 'focus:bg-white'
  },
  forest: {
    name: 'Nature Forest',
    bg: 'bg-emerald-50',
    grid: 'border-emerald-200',
    text: 'text-emerald-900',
    accent: 'bg-emerald-600',
    headerGroupBg: 'bg-emerald-100',
    headerRowBg: 'bg-emerald-100/50',
    hover: 'hover:bg-emerald-100',
    inputBg: 'focus:bg-white'
  }
};
