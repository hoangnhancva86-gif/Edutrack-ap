/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, Zap, Beaker, BookOpen, Languages, Dna, History, Globe,
  Search, LogOut, Settings, User, BarChart3, BookMarked, MessageSquare,
  ChevronRight, TrendingUp, Calendar, AlertCircle, Eye, EyeOff,
  CheckCircle2, Clock, Award, Sparkles, Send, Loader2, Moon, Sun, TrendingDown,
  Printer, ClipboardList, Upload, Download, Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend
} from 'recharts';
import Swal from 'sweetalert2';
import { Marked } from 'marked';
import { cn } from './lib/utils';
import { MOCK_STUDENTS, SUBJECTS, Student, ActiveTab } from './types';
import { callGeminiAI, generateAcademicAdvice, MODELS, MODEL_LABELS, GeminiModel } from './services/geminiService';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('edutrack_students');
    return saved ? JSON.parse(saved) : MOCK_STUDENTS;
  });
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(
    (localStorage.getItem('selected_model') as GeminiModel) || MODELS[0]
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [academicAdvice, setAcademicAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('edutrack_theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('edutrack_theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('edutrack_theme', 'light');
    }
  }, [isDark]);

  // Tính điểm trung bình thực từ dữ liệu
  const averageScore = useMemo(() => {
    if (!currentStudent || currentStudent.grades.length === 0) return 0;
    const sum = currentStudent.grades.reduce((acc, g) => acc + g.final, 0);
    return parseFloat((sum / currentStudent.grades.length).toFixed(1));
  }, [currentStudent]);

  // Tính xếp loại tự động
  const academicRank = useMemo(() => {
    if (averageScore >= 8) return 'Giỏi';
    if (averageScore >= 6.5) return 'Khá';
    if (averageScore >= 5) return 'Trung bình';
    return 'Yếu';
  }, [averageScore]);

  // Scroll chat xuống cuối khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat]);

  useEffect(() => {
    if (isLoggedIn && currentStudent && !academicAdvice) {
      fetchAdvice();
    }
  }, [isLoggedIn, currentStudent]);

  const fetchAdvice = async () => {
    if (!currentStudent) return;
    setAdviceLoading(true);
    const advice = await generateAcademicAdvice(currentStudent.name, currentStudent.grades);
    setAcademicAdvice(advice);
    setAdviceLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === studentId);
    if (student) {
      setCurrentStudent(student);
      setIsLoggedIn(true);
      Swal.fire({
        icon: 'success',
        title: 'Đăng nhập thành công',
        text: `Chào mừng phụ huynh của em ${student.name}`,
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Mã định danh học sinh không chính xác!',
      });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStudentId('');
    setCurrentStudent(null);
    setActiveTab('dashboard');
    setAcademicAdvice(null);
  };

  const saveSettings = () => {
    // Lưu API Key
    localStorage.setItem('gemini_api_key', apiKey);
    // Lưu model được chọn
    localStorage.setItem('selected_model', selectedModel);
    setShowApiKeyModal(false);
    // Reset advice để fetch lại với key/model mới
    setAcademicAdvice(null);
    Swal.fire({
      icon: 'success',
      title: 'Đã lưu cài đặt',
      text: `Mô hình: ${MODEL_LABELS[selectedModel]}`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleSendMessage = async (overrideInput?: string) => {
    const text = overrideInput ?? userInput;
    if (!text.trim()) return;
    
    const newChat = [...aiChat, { role: 'user' as const, content: text }];
    setAiChat(newChat);
    setUserInput('');
    setAiLoading(true);

    const gradeContext = currentStudent?.grades
      .map(g => `${SUBJECTS.find(s => s.id === g.subjectId)?.name}: ${g.final}/10`)
      .join(', ');

    const prompt = `Bạn là một trợ lý học tập thông minh tại Việt Nam. 
Học sinh: ${currentStudent?.name}, lớp ${currentStudent?.class}.
Điểm số: ${gradeContext}.
Câu hỏi của phụ huynh: "${text}". 
Hãy trả lời chi tiết, dựa trên dữ liệu học sinh nếu phù hợp. Trả lời bằng tiếng Việt, định dạng Markdown.`;

    const response = await callGeminiAI(prompt);
    setAiChat([...newChat, { role: 'ai' as const, content: response || "Xin lỗi, tôi không thể trả lời lúc này." }]);
    setAiLoading(false);
  };

  const chartData = useMemo(() => {
    if (!currentStudent) return [];
    return currentStudent.grades.map(g => ({
      name: SUBJECTS.find(s => s.id === g.subjectId)?.name || g.subjectId,
      score: g.final
    }));
  }, [currentStudent]);

  const getSubjectIcon = (id: string) => {
    const icons: Record<string, any> = {
      math: Calculator,
      physics: Zap,
      chemistry: Beaker,
      literature: BookOpen,
      english: Languages,
      biology: Dna,
      history: History,
      geography: Globe
    };
    const IconComp = icons[id] || BookMarked;
    return <IconComp className="w-5 h-5" />;
  };

  const exportToExcel = () => {
    const data = students.map(s => {
      const row: any = {
        'Mã HS': s.id,
        'Họ và Tên': s.name,
        'Lớp': s.class,
        'Hạnh kiểm': s.conduct,
        'Hạnh kiểm HK2': s.conductTerm2 || s.conduct,
        'Có mặt': s.attendance.present,
        'Vắng mặt': s.attendance.absent,
        'Đi muộn': s.attendance.late
      };
      
      SUBJECTS.forEach(sub => {
        const grade = s.grades.find(g => g.subjectId === sub.id);
        row[`${sub.name} Giữa HK1`] = grade?.midTerm1 || 0;
        row[`${sub.name} Cuối HK1`] = grade?.term1 || 0;
        row[`${sub.name} Giữa HK2`] = grade?.midTerm2 || 0;
        row[`${sub.name} Cuối HK2`] = grade?.term2 || 0;
        row[`${sub.name} Cả năm`] = grade?.final || 0;
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Danh_Sach_Hoc_Sinh.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const result = evt.target?.result;
        if (!result) return;
        const wb = XLSX.read(result, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map existing students and add new ones
        const updatedStudents = students.map(s => {
          const row: any = data.find((r: any) => String(r['Mã HS']) === s.id);
          if (!row) return s;

          const updatedGrades = s.grades.map(g => {
            const subject = SUBJECTS.find(sub => sub.id === g.subjectId);
            if (subject && row[`${subject.name} Cuối HK1`] !== undefined) {
              return {
                ...g,
                midTerm1: Number(row[`${subject.name} Giữa HK1`] || 0),
                term1: Number(row[`${subject.name} Cuối HK1`] || 0),
                midTerm2: Number(row[`${subject.name} Giữa HK2`] || 0),
                term2: Number(row[`${subject.name} Cuối HK2`] || 0),
                final: Number(row[`${subject.name} Cả năm`] || 0)
              };
            }
            return g;
          });

          return {
            ...s,
            name: row['Họ và Tên'] || s.name,
            class: row['Lớp'] || s.class,
            conduct: row['Hạnh kiểm'] || s.conduct,
            conductTerm2: row['Hạnh kiểm HK2'] || s.conductTerm2,
            attendance: {
              ...s.attendance,
              present: Number(row['Có mặt'] ?? s.attendance.present),
              absent: Number(row['Vắng mặt'] ?? s.attendance.absent),
              late: Number(row['Đi muộn'] ?? s.attendance.late),
            },
            grades: updatedGrades
          };
        });

        // Add new students that aren't in the current system
        const newStudentsRows: any[] = data.filter((r: any) => !students.find(s => s.id === String(r['Mã HS'])));
        newStudentsRows.forEach(row => {
          const id = String(row['Mã HS']);
          if (!id || id === 'undefined') return;
          
          const newGrades = SUBJECTS.map(sub => ({
            subjectId: sub.id,
            midTerm1: Number(row[`${sub.name} Giữa HK1`] || 0),
            term1: Number(row[`${sub.name} Cuối HK1`] || 0),
            midTerm2: Number(row[`${sub.name} Giữa HK2`] || 0),
            term2: Number(row[`${sub.name} Cuối HK2`] || 0),
            final: Number(row[`${sub.name} Cả năm`] || 0),
            exams: []
          }));

          updatedStudents.push({
            id,
            name: row['Họ và Tên'] || 'Chưa cập nhật',
            class: row['Lớp'] || 'Chưa cập nhật',
            schoolYear: students.length > 0 ? students[0].schoolYear : '2023-2024',
            conduct: row['Hạnh kiểm'] || 'Chưa xếp loại',
            conductTerm2: row['Hạnh kiểm HK2'] || 'Chưa xếp loại',
            teacher: students.length > 0 ? students[0].teacher : '',
            attendance: {
              present: Number(row['Có mặt'] || 0),
              absent: Number(row['Vắng mặt'] || 0),
              late: Number(row['Đi muộn'] || 0),
              history: []
            },
            grades: newGrades
          });
        });

        setStudents(updatedStudents);
        localStorage.setItem('edutrack_students', JSON.stringify(updatedStudents));
        
        if (currentStudent) {
            const updatedCurrentInfo = updatedStudents.find(s => s.id === currentStudent.id);
            if (updatedCurrentInfo) setCurrentStudent(updatedCurrentInfo);
        }

        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đã cập nhật dữ liệu từ Excel',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire('Lỗi', 'Định dạng file không hơp lệ, vui lòng dùng file Exported', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-card p-8 rounded-xl z-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-linear-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">EduTrack</h1>
            <p className="text-slate-500 mt-2">Tra cứu kết quả học tập thông minh</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã định danh học sinh (CCCD/MSHS)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Nhập mã định danh..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary outline-hidden transition-all"
                  required
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">* Thử mã: 123456789 để demo</p>
            </div>

            <button 
              type="submit"
              className="w-full py-3 gradient-bg text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all active:scale-95"
            >
              Tra cứu ngay
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Settings className="w-4 h-4" /> Cấu hình API Key
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col p-6 sticky top-0 h-screen transition-colors">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center shadow-md">
            <Award className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold gradient-text">EduTrack</span>
        </div>

        {/* Student mini-profile */}
        <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {currentStudent?.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{currentStudent?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lớp {currentStudent?.class}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 />} label="Tổng quan" />
          <NavButton active={activeTab === 'grades'} onClick={() => setActiveTab('grades')} icon={<BookMarked />} label="Bảng điểm" />
          <NavButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<ClipboardList />} label="Điểm danh" />
          <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<MessageSquare />} label="AI Cố vấn" />
        </nav>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-1">
          <button
            onClick={() => setIsDark(d => !d)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            <span>{isDark ? 'Sáng' : 'Tối'}</span>
          </button>
          <button onClick={() => setShowApiKeyModal(true)} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all">
            <Settings size={20} />
            <span>Cài đặt</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
          <Award className="text-primary w-6 h-6" />
          <span className="text-xl font-bold gradient-text">EduTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDark(d => !d)} className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>
          <button onClick={handleLogout} className="p-2 text-error">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-y-auto print-full">
        <div className="max-w-6xl mx-auto">
          
          {/* Print Header (Only visible when printing) */}
          <div className="print-header print-only">
            <Award className="text-primary w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold">EduTrack - Báo cáo Học tập</h1>
              <p className="text-slate-500 font-medium">Trường THCS CHU VĂN AN • Năm học {currentStudent?.schoolYear}</p>
            </div>
          </div>

          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex flex-wrap items-center gap-2">
                Xin chào,
                <select 
                  className="bg-transparent border-0 outline-hidden font-bold gradient-text cursor-pointer focus:ring-0 p-0 text-2xl"
                  value={currentStudent?.id || ''}
                  onChange={(e) => {
                    const student = students.find(s => s.id === e.target.value);
                    if (student) setCurrentStudent(student);
                  }}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 text-base font-medium">
                      Phụ huynh em {s.name}
                    </option>
                  ))}
                </select>
              </h2>
              <p className="text-slate-500 dark:text-slate-400">Lớp {currentStudent?.class} • GVCN: {currentStudent?.teacher}</p>
            </div>
            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="no-print flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 rounded-xl font-medium transition-all shadow-sm border border-indigo-200 dark:border-indigo-700/50 cursor-pointer">
                <Upload size={18} />
                <span className="hidden sm:inline text-sm">Import điểm</span>
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>

              <button 
                onClick={exportToExcel}
                className="no-print flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 rounded-xl font-medium transition-all shadow-sm border border-emerald-200 dark:border-emerald-800/50"
              >
                <Download size={18} />
                <span className="hidden sm:inline text-sm">Tải Form Mẫu</span>
              </button>

              <button 
                onClick={() => window.print()}
                className="no-print flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-all shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">Xuất PDF</span>
              </button>
              
              {/* Profile Card */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white font-bold shrink-0">
                {currentStudent?.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Hạnh kiểm</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-success">{currentStudent?.conduct}</p>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-bold",
                    averageScore >= 8 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : averageScore >= 6.5 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    : averageScore >= 5 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                  )}>{academicRank}</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Trung bình" value={averageScore.toString()} icon={<TrendingUp />} color="bg-blue-500" />
                  <StatCard label="Vắng mặt" value={currentStudent?.attendance.absent.toString() || "0"} icon={<Calendar />} color="bg-orange-500" />
                  <StatCard label="Đi muộn" value={currentStudent?.attendance.late.toString() || "0"} icon={<Clock />} color="bg-yellow-500" />
                  <StatCard label="Xếp loại" value={academicRank} icon={<Award />} color={averageScore >= 8 ? 'bg-green-500' : averageScore >= 6.5 ? 'bg-blue-500' : averageScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'} />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Bar Chart */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <BarChart3 className="text-primary" /> Phân tích điểm số môn học
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                          <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} />
                          <Tooltip
                            cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a' }}
                          />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.score >= 8 ? '#10b981' : entry.score >= 6.5 ? '#4A90E2' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AI Quick Insight with skeleton */}
                  <div className="bg-linear-to-br from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5 p-6 rounded-xl border border-primary/20 dark:border-primary/10 relative overflow-hidden">
                    <Sparkles className="absolute top-[-10px] right-[-10px] w-24 h-24 text-primary/5 -rotate-12" />
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <Sparkles className="text-primary" /> Nhận xét từ AI
                    </h3>
                    <div className="text-sm leading-relaxed max-h-56 overflow-y-auto pr-1">
                      {adviceLoading ? (
                        <div className="space-y-2">
                          <div className="skeleton h-3 w-full" />
                          <div className="skeleton h-3 w-5/6" />
                          <div className="skeleton h-3 w-4/6" />
                          <div className="skeleton h-3 w-full mt-3" />
                          <div className="skeleton h-3 w-3/4" />
                          <div className="skeleton h-3 w-5/6" />
                        </div>
                      ) : academicAdvice ? (
                        <MarkdownContent content={academicAdvice} className="prose prose-sm dark:prose-invert" />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                          <Loader2 className="animate-spin mb-2" />
                          <p>Đang phân tích...</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveTab('ai')}
                      className="mt-4 w-full py-2 bg-white dark:bg-slate-700 text-primary font-bold rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
                    >
                      Hỏi thêm AI
                    </button>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Sparkles className="text-secondary" /> Năng lực đa môn
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={chartData}>
                        <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                        <Radar name="Điểm số" dataKey="score" stroke="#4A90E2" fill="#4A90E2" fillOpacity={0.25} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Exams */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Các bài kiểm tra gần đây</h3>
                  <div className="space-y-2">
                    {currentStudent?.grades.flatMap(g => g.exams.map(e => ({ ...e, subject: SUBJECTS.find(s => s.id === g.subjectId)?.name }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((exam, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-all">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                            exam.score >= 8 ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : exam.score >= 5 ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {exam.score}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{exam.name}</p>
                            <p className="text-xs text-slate-400">{exam.subject} • {exam.date}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-slate-300" size={20} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'grades' && (
              <motion.div 
                key="grades"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentStudent?.grades.map((grade, idx) => {
                    const subject = SUBJECTS.find(s => s.id === grade.subjectId);
                    const trend = grade.term2 - grade.term1;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => setSelectedSubject(grade.subjectId)}
                        className={cn(
                          "bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer transition-all",
                          selectedSubject === grade.subjectId && "ring-2 ring-primary border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300">
                              {getSubjectIcon(grade.subjectId)}
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{subject?.name}</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{grade.final}</div>
                            <div className={cn(
                              "text-xs font-bold flex items-center justify-end gap-0.5",
                              trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-slate-400"
                            )}>
                              {trend > 0 ? <TrendingUp size={12} className="trend-up" /> : trend < 0 ? <TrendingDown size={12} className="trend-down" /> : null}
                              {trend > 0 ? `+${trend.toFixed(1)}` : trend !== 0 ? trend.toFixed(1) : '='}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-[10px]">
                          <div className="bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg text-center leading-tight">
                            <p className="text-slate-400">Giữa HK1</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{grade.midTerm1 ?? '-'}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg text-center leading-tight">
                            <p className="text-slate-400">Cuối HK1</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{grade.term1}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg text-center leading-tight">
                            <p className="text-slate-400">Giữa HK2</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{grade.midTerm2 ?? '-'}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg text-center leading-tight">
                            <p className="text-slate-400">Cuối HK2</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{grade.term2}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Term Comparison LineChart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <TrendingUp className="text-primary" /> So sánh Học kỳ 1 ↔ Học kỳ 2
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={currentStudent?.grades.map(g => ({
                        name: SUBJECTS.find(s => s.id === g.subjectId)?.name?.slice(0, 6) || g.subjectId,
                        'Học kỳ 1': g.term1,
                        'Học kỳ 2': g.term2,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="Học kỳ 1" stroke="#4A90E2" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Học kỳ 2" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subject Detail */}
                <AnimatePresence>
                  {selectedSubject && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                          {getSubjectIcon(selectedSubject)}
                          Chi tiết môn {SUBJECTS.find(s => s.id === selectedSubject)?.name}
                        </h3>
                        <button onClick={() => setSelectedSubject(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          Đóng
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-slate-400 text-sm border-b border-slate-100">
                              <th className="pb-3 font-medium">Tên bài kiểm tra</th>
                              <th className="pb-3 font-medium">Ngày</th>
                              <th className="pb-3 font-medium text-center">Điểm số</th>
                              <th className="pb-3 font-medium text-right">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentStudent?.grades.find(g => g.subjectId === selectedSubject)?.exams.map((exam, i) => (
                              <tr key={i} className="border-b border-slate-50 last:border-0">
                                <td className="py-4 font-bold text-slate-700">{exam.name}</td>
                                <td className="py-4 text-slate-500 text-sm">{exam.date}</td>
                                <td className="py-4 text-center">
                                  <span className={cn(
                                    "px-3 py-1 rounded-full font-bold text-sm",
                                    exam.score >= 8 ? "bg-green-100 text-green-600" : exam.score >= 5 ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                                  )}>
                                    {exam.score}
                                  </span>
                                </td>
                                <td className="py-4 text-right">
                                  <CheckCircle2 className="inline text-success" size={18} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-[calc(100vh-250px)] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                      <Sparkles className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">AI Cố vấn học tập</h3>
                      <p className="text-xs text-success flex items-center gap-1">
                        <span className="w-2 h-2 bg-success rounded-full animate-pulse" /> Đang trực tuyến
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAiChat([])}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Xóa hội thoại
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {aiChat.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
                        <MessageSquare size={32} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Bắt đầu trò chuyện với AI</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                        Bạn có thể hỏi về tình hình học tập của con, gợi ý cách ôn tập hoặc giải đáp các thắc mắc về điểm số.
                      </p>
                      <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
                        <QuickQuestion text="Con tôi học tốt nhất môn nào?" onSend={handleSendMessage} />
                        <QuickQuestion text="Làm sao để cải thiện điểm môn Ngữ văn?" onSend={handleSendMessage} />
                        <QuickQuestion text="Dự đoán kết quả học kỳ tới của con." onSend={handleSendMessage} />
                      </div>
                    </div>
                  )}
                  
                  {aiChat.map((msg, i) => (
                    <div key={i} className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                        msg.role === 'user' 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none"
                      )}>
                        {msg.role === 'ai' ? (
                          <MarkdownContent content={msg.content} className="prose prose-sm dark:prose-invert max-w-none" />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">AI đang suy nghĩ...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Nhập câu hỏi của bạn..."
                      className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl outline-hidden focus:ring-2 focus:ring-primary dark:text-slate-100 transition-all"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={aiLoading || !userInput.trim()}
                      className="w-12 h-12 gradient-bg text-white rounded-xl flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Attendance Stats */}
                  <div className="col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <Calendar className="text-primary" /> Tổng quan điểm danh
                    </h3>
                    <div className="h-48 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Có mặt', value: currentStudent?.attendance.present || 0, color: '#10b981' },
                              { name: 'Vắng mặt', value: currentStudent?.attendance.absent || 0, color: '#ef4444' },
                              { name: 'Đi muộn', value: currentStudent?.attendance.late || 0, color: '#f59e0b' }
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                          >
                            { [
                                { name: 'Có mặt', value: currentStudent?.attendance.present || 0, color: '#10b981' },
                                { name: 'Vắng mặt', value: currentStudent?.attendance.absent || 0, color: '#ef4444' },
                                { name: 'Đi muộn', value: currentStudent?.attendance.late || 0, color: '#f59e0b' }
                              ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          {currentStudent ? currentStudent.attendance.present + currentStudent.attendance.absent + currentStudent.attendance.late : 0}
                        </span>
                        <span className="text-xs text-slate-400">Tổng tiết</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Có mặt</p>
                        <p className="font-bold text-green-600 dark:text-green-400">{currentStudent?.attendance.present}</p>
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Vắng</p>
                        <p className="font-bold text-red-600 dark:text-red-400">{currentStudent?.attendance.absent}</p>
                      </div>
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Muộn</p>
                        <p className="font-bold text-yellow-600 dark:text-yellow-400">{currentStudent?.attendance.late}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance History */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <ClipboardList className="text-secondary" /> Lịch sử vắng/muộn chi tiết
                    </h3>
                    {currentStudent?.attendance.history && currentStudent.attendance.history.length > 0 ? (
                      <div className="space-y-3">
                        {currentStudent.attendance.history.map((record, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700/50">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                              record.status === 'absent' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                            )}>
                              {record.status === 'absent' ? <Calendar size={20} /> : <Clock size={20} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "text-xs font-bold px-2 py-0.5 rounded-full uppercase",
                                  record.status === 'absent' ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                                )}>
                                  {record.status === 'absent' ? 'Nghỉ học' : 'Đi muộn'}
                                </span>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{record.date}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">Lý do: <strong>{record.reason}</strong></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <CheckCircle2 size={48} className="text-green-500 mb-4 opacity-50" />
                        <p>Học sinh đi học đầy đủ, không có lịch sử vắng/muộn.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-around p-3 z-40 transition-colors">
        <MobileNavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')}
          icon={<BarChart3 />}
          label="Tổng quan"
        />
        <MobileNavButton 
          active={activeTab === 'grades'} 
          onClick={() => setActiveTab('grades')}
          icon={<BookMarked />}
          label="Bảng điểm"
        />
        <MobileNavButton 
          active={activeTab === 'attendance'} 
          onClick={() => setActiveTab('attendance')}
          icon={<ClipboardList />}
          label="Điểm danh"
        />
        <MobileNavButton 
          active={activeTab === 'ai'} 
          onClick={() => setActiveTab('ai')}
          icon={<MessageSquare />}
          label="AI"
        />
        <MobileNavButton 
          active={false} 
          onClick={() => setShowApiKeyModal(true)}
          icon={<Settings />}
          label="Cài đặt"
        />
      </nav>

      {/* API Key Modal (Global) */}
      <AnimatePresence>
        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm p-6 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Settings className="text-primary" /> Cấu hình Gemini API
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Mô hình AI</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-lg outline-hidden focus:ring-2 focus:ring-primary dark:text-slate-100"
                    value={selectedModel}
                    onChange={(e) => {
                      const model = e.target.value as GeminiModel;
                      setSelectedModel(model);
                    }}
                  >
                    {MODELS.map(m => (
                      <option key={m} value={m}>{MODEL_LABELS[m]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Gemini API Key</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-lg outline-hidden focus:ring-2 focus:ring-primary dark:text-slate-100"
                      placeholder="Nhập API Key của bạn..."
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-400 mb-2 uppercase">Dữ liệu hệ thống</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        const data = { student: currentStudent, settings: { apiKey } };
                        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `edutrack_backup_${new Date().getTime()}.json`;
                        a.click();
                      }}
                      className="py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      Export JSON
                    </button>
                    <button 
                      onClick={() => {
                        Swal.fire({
                          title: 'Import Dữ liệu',
                          input: 'file',
                          inputAttributes: {
                            'accept': 'application/json',
                            'aria-label': 'Upload your backup file'
                          }
                        }).then((result) => {
                          if (result.value) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              try {
                                const json = JSON.parse(e.target?.result as string);
                                if (json.settings?.apiKey) {
                                  setApiKey(json.settings.apiKey);
                                  localStorage.setItem('gemini_api_key', json.settings.apiKey);
                                }
                                Swal.fire('Thành công', 'Đã khôi phục dữ liệu', 'success');
                              } catch (err) {
                                Swal.fire('Lỗi', 'File không hợp lệ', 'error');
                              }
                            };
                            reader.readAsText(result.value);
                          }
                        });
                      }}
                      className="py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      Import File
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => setShowApiKeyModal(false)}
                    className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={saveSettings}
                    className="flex-1 py-2 gradient-bg text-white rounded-lg font-medium hover:opacity-90 transition-all"
                  >
                    Lưu lại
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
        active 
          ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary shadow-sm" 
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-primary dark:text-primary" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md", color)}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function QuickQuestion({ text, onSend }: { text: string, onSend: (t: string) => void }) {
  return (
    <button 
      onClick={() => onSend(text)}
      className="text-left px-4 py-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-primary/10 dark:hover:bg-primary/20 border border-slate-200 dark:border-slate-600 hover:border-primary/30 dark:hover:border-primary/50 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all flex items-center gap-2"
    >
      <Send size={12} className="shrink-0" />
      {text}
    </button>
  );
}

// Component render Markdown an toàn, hỗ trợ async marked.parse
function MarkdownContent({ content, className }: { content: string, className?: string }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    const m = new Marked();
    Promise.resolve(m.parse(content)).then(result => setHtml(result));
  }, [content]);
  return <div dangerouslySetInnerHTML={{ __html: html }} className={className} />;
}
