export interface Subject {
  id: string;
  name: string;
  icon: string;
}

export interface Grade {
  subjectId: string;
  midTerm1?: number;
  term1: number;
  midTerm2?: number;
  term2: number;
  final: number;
  exams: {
    name: string;
    score: number;
    date: string;
  }[];
}

export interface AttendanceRecord {
  date: string;
  status: 'absent' | 'late';
  reason: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  schoolYear: string;
  grades: Grade[];
  attendance: {
    present: number;
    absent: number;
    late: number;
    history?: AttendanceRecord[];
  };
  conduct: string;
  conductTerm2?: string;
  teacher?: string;
}

export interface AppNotification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  read: boolean;
}

export type ActiveTab = 'dashboard' | 'grades' | 'ai' | 'attendance';

// ============================================================
//  MOCK DATA
// ============================================================

export const SUBJECTS: Subject[] = [
  { id: 'math',       name: 'Toán học',   icon: 'Calculator' },
  { id: 'physics',    name: 'Vật lý',     icon: 'Zap' },
  { id: 'chemistry',  name: 'Hóa học',    icon: 'Beaker' },
  { id: 'literature', name: 'Ngữ văn',    icon: 'BookOpen' },
  { id: 'english',    name: 'Tiếng Anh',  icon: 'Languages' },
  { id: 'biology',    name: 'Sinh học',   icon: 'Dna' },
  { id: 'history',    name: 'Lịch sử',    icon: 'History' },
  { id: 'geography',  name: 'Địa lý',     icon: 'Globe' },
];

export const MOCK_STUDENTS: Student[] = [
  // ─── Học sinh 1: Giỏi ───────────────────────────────────
  {
    id: '123456789',
    name: 'Nguyễn Văn A',
    class: '12A1',
    schoolYear: '2023-2024',
    conduct: 'Tốt',
    conductTerm2: 'Tốt',
    teacher: 'Cô Nguyễn Thị Hoa',
    attendance: { 
      present: 150, 
      absent: 2, 
      late: 1,
      history: [
        { date: '2023-11-15', status: 'absent', reason: 'Ốm, có phép' },
        { date: '2023-12-05', status: 'late', reason: 'Hỏng xe giữa đường' },
        { date: '2024-03-20', status: 'absent', reason: 'Việc gia đình, có phép' }
      ]
    },
    grades: [
      {
        subjectId: 'math',
        midTerm1: 8.0, term1: 8.5, midTerm2: 8.5, term2: 9.0, final: 8.8,
        exams: [
          { name: 'Kiểm tra 15p', score: 9.0, date: '2023-10-15' },
          { name: 'Kiểm tra 1 tiết', score: 8.0, date: '2023-11-20' },
          { name: 'Thi học kỳ 1', score: 8.5, date: '2023-12-25' },
          { name: 'Kiểm tra 15p HK2', score: 9.5, date: '2024-03-10' },
          { name: 'Thi học kỳ 2', score: 9.0, date: '2024-05-20' },
        ],
      },
      {
        subjectId: 'physics',
        midTerm1: 7.5, term1: 7.8, midTerm2: 8.0, term2: 8.5, final: 8.2,
        exams: [
          { name: 'Kiểm tra 15p', score: 8.5, date: '2023-10-12' },
          { name: 'Kiểm tra 1 tiết', score: 7.5, date: '2023-11-18' },
          { name: 'Thi học kỳ 1', score: 8.0, date: '2023-12-22' },
          { name: 'Thi học kỳ 2', score: 8.5, date: '2024-05-18' },
        ],
      },
      {
        subjectId: 'chemistry',
        midTerm1: 9.0, term1: 9.2, midTerm2: 9.0, term2: 9.5, final: 9.4,
        exams: [
          { name: 'Kiểm tra 15p', score: 10,  date: '2023-10-10' },
          { name: 'Kiểm tra 1 tiết', score: 9.0, date: '2023-11-15' },
          { name: 'Thi học kỳ 1', score: 9.5, date: '2023-12-20' },
          { name: 'Thi học kỳ 2', score: 9.5, date: '2024-05-15' },
        ],
      },
      {
        subjectId: 'literature',
        midTerm1: 6.5, term1: 7.0, midTerm2: 7.0, term2: 7.5, final: 7.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 7.5, date: '2023-10-05' },
          { name: 'Kiểm tra 1 tiết', score: 6.5, date: '2023-11-10' },
          { name: 'Thi học kỳ 1', score: 7.0, date: '2023-12-15' },
          { name: 'Thi học kỳ 2', score: 7.5, date: '2024-05-12' },
        ],
      },
      {
        subjectId: 'english',
        midTerm1: 8.5, term1: 8.8, midTerm2: 9.0, term2: 9.2, final: 9.0,
        exams: [
          { name: 'Kiểm tra 15p', score: 9.5, date: '2023-10-08' },
          { name: 'Kiểm tra 1 tiết', score: 8.5, date: '2023-11-12' },
          { name: 'Thi học kỳ 1', score: 9.0, date: '2023-12-18' },
          { name: 'Thi học kỳ 2', score: 9.2, date: '2024-05-16' },
        ],
      },
      {
        subjectId: 'biology',
        midTerm1: 7.5, term1: 8.0, midTerm2: 8.0, term2: 8.5, final: 8.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 8.5, date: '2023-10-18' },
          { name: 'Kiểm tra 1 tiết', score: 7.5, date: '2023-11-22' },
          { name: 'Thi học kỳ 1', score: 8.0, date: '2023-12-28' },
          { name: 'Thi học kỳ 2', score: 8.5, date: '2024-05-22' },
        ],
      },
      {
        subjectId: 'history',
        midTerm1: 8.0, term1: 8.5, midTerm2: 8.5, term2: 8.0, final: 8.2,
        exams: [
          { name: 'Kiểm tra 15p', score: 9.0, date: '2023-10-20' },
          { name: 'Kiểm tra 1 tiết', score: 8.0, date: '2023-11-25' },
          { name: 'Thi học kỳ 1', score: 8.5, date: '2023-12-27' },
          { name: 'Thi học kỳ 2', score: 8.0, date: '2024-05-24' },
        ],
      },
      {
        subjectId: 'geography',
        midTerm1: 7.0, term1: 7.5, midTerm2: 7.5, term2: 8.0, final: 7.8,
        exams: [
          { name: 'Kiểm tra 15p', score: 8.0, date: '2023-10-22' },
          { name: 'Kiểm tra 1 tiết', score: 7.0, date: '2023-11-28' },
          { name: 'Thi học kỳ 1', score: 7.5, date: '2023-12-30' },
          { name: 'Thi học kỳ 2', score: 8.0, date: '2024-05-26' },
        ],
      },
    ],
  },

  // ─── Học sinh 2: Khá ────────────────────────────────────
  {
    id: '987654321',
    name: 'Trần Thị B',
    class: '11B2',
    schoolYear: '2023-2024',
    conduct: 'Tốt',
    conductTerm2: 'Khá',
    teacher: 'Thầy Lê Văn Dũng',
    attendance: { present: 145, absent: 6, late: 3 },
    grades: [
      {
        subjectId: 'math',
        midTerm1: 6.0, term1: 6.5, midTerm2: 6.5, term2: 7.0, final: 6.8,
        exams: [
          { name: 'Kiểm tra 15p', score: 7.0, date: '2023-10-15' },
          { name: 'Kiểm tra 1 tiết', score: 6.0, date: '2023-11-20' },
          { name: 'Thi học kỳ 1', score: 6.5, date: '2023-12-25' },
          { name: 'Thi học kỳ 2', score: 7.0, date: '2024-05-20' },
        ],
      },
      {
        subjectId: 'physics',
        midTerm1: 5.5, term1: 6.0, midTerm2: 6.0, term2: 6.5, final: 6.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 6.5, date: '2023-10-12' },
          { name: 'Kiểm tra 1 tiết', score: 5.5, date: '2023-11-18' },
          { name: 'Thi học kỳ 1', score: 6.0, date: '2023-12-22' },
          { name: 'Thi học kỳ 2', score: 6.5, date: '2024-05-18' },
        ],
      },
      {
        subjectId: 'chemistry',
        midTerm1: 6.5, term1: 7.0, midTerm2: 7.0, term2: 7.5, final: 7.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 7.5, date: '2023-10-10' },
          { name: 'Kiểm tra 1 tiết', score: 6.5, date: '2023-11-15' },
          { name: 'Thi học kỳ 1', score: 7.0, date: '2023-12-20' },
          { name: 'Thi học kỳ 2', score: 7.5, date: '2024-05-15' },
        ],
      },
      {
        subjectId: 'literature',
        midTerm1: 7.0, term1: 7.5, midTerm2: 7.5, term2: 8.0, final: 7.8,
        exams: [
          { name: 'Kiểm tra 15p', score: 8.0, date: '2023-10-05' },
          { name: 'Kiểm tra 1 tiết', score: 7.0, date: '2023-11-10' },
          { name: 'Thi học kỳ 1', score: 7.5, date: '2023-12-15' },
          { name: 'Thi học kỳ 2', score: 8.0, date: '2024-05-12' },
        ],
      },
      {
        subjectId: 'english',
        midTerm1: 6.5, term1: 6.8, midTerm2: 7.0, term2: 7.2, final: 7.0,
        exams: [
          { name: 'Kiểm tra 15p', score: 7.0, date: '2023-10-08' },
          { name: 'Kiểm tra 1 tiết', score: 6.5, date: '2023-11-12' },
          { name: 'Thi học kỳ 1', score: 7.0, date: '2023-12-18' },
          { name: 'Thi học kỳ 2', score: 7.2, date: '2024-05-16' },
        ],
      },
      {
        subjectId: 'biology',
        midTerm1: 6.5, term1: 7.0, midTerm2: 7.0, term2: 7.5, final: 7.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 7.5, date: '2023-10-18' },
          { name: 'Kiểm tra 1 tiết', score: 6.5, date: '2023-11-22' },
          { name: 'Thi học kỳ 1', score: 7.0, date: '2023-12-28' },
          { name: 'Thi học kỳ 2', score: 7.5, date: '2024-05-22' },
        ],
      },
      {
        subjectId: 'history',
        midTerm1: 6.0, term1: 6.5, midTerm2: 6.5, term2: 7.0, final: 6.8,
        exams: [
          { name: 'Kiểm tra 15p', score: 7.0, date: '2023-10-20' },
          { name: 'Kiểm tra 1 tiết', score: 6.0, date: '2023-11-25' },
          { name: 'Thi học kỳ 1', score: 6.5, date: '2023-12-27' },
          { name: 'Thi học kỳ 2', score: 7.0, date: '2024-05-24' },
        ],
      },
      {
        subjectId: 'geography',
        midTerm1: 7.0, term1: 7.2, midTerm2: 7.0, term2: 7.0, final: 7.1,
        exams: [
          { name: 'Kiểm tra 15p', score: 7.5, date: '2023-10-22' },
          { name: 'Kiểm tra 1 tiết', score: 6.8, date: '2023-11-28' },
          { name: 'Thi học kỳ 1', score: 7.2, date: '2023-12-30' },
          { name: 'Thi học kỳ 2', score: 7.0, date: '2024-05-26' },
        ],
      },
    ],
  },

  // ─── Học sinh 3: Trung bình (có môn dưới 5) ─────────────
  {
    id: '111222333',
    name: 'Lê Minh C',
    class: '10C3',
    schoolYear: '2023-2024',
    conduct: 'Khá',
    conductTerm2: 'Trung bình',
    teacher: 'Cô Phạm Thị Mai',
    attendance: { present: 130, absent: 15, late: 8 },
    grades: [
      {
        subjectId: 'math',
        midTerm1: 4.0, term1: 4.5, midTerm2: 4.5, term2: 5.0, final: 4.8,
        exams: [
          { name: 'Kiểm tra 15p', score: 4.0, date: '2023-10-15' },
          { name: 'Kiểm tra 1 tiết', score: 4.5, date: '2023-11-20' },
          { name: 'Thi học kỳ 1', score: 4.5, date: '2023-12-25' },
          { name: 'Thi học kỳ 2', score: 5.0, date: '2024-05-20' },
        ],
      },
      {
        subjectId: 'physics',
        midTerm1: 4.5, term1: 5.0, midTerm2: 5.0, term2: 5.5, final: 5.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 5.5, date: '2023-10-12' },
          { name: 'Kiểm tra 1 tiết', score: 4.5, date: '2023-11-18' },
          { name: 'Thi học kỳ 1', score: 5.0, date: '2023-12-22' },
          { name: 'Thi học kỳ 2', score: 5.5, date: '2024-05-18' },
        ],
      },
      {
        subjectId: 'chemistry',
        midTerm1: 3.5, term1: 4.0, midTerm2: 4.0, term2: 4.5, final: 4.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 3.5, date: '2023-10-10' },
          { name: 'Kiểm tra 1 tiết', score: 4.0, date: '2023-11-15' },
          { name: 'Thi học kỳ 1', score: 4.5, date: '2023-12-20' },
          { name: 'Thi học kỳ 2', score: 4.5, date: '2024-05-15' },
        ],
      },
      {
        subjectId: 'literature',
        midTerm1: 5.5, term1: 6.0, midTerm2: 6.0, term2: 6.5, final: 6.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 6.5, date: '2023-10-05' },
          { name: 'Kiểm tra 1 tiết', score: 5.5, date: '2023-11-10' },
          { name: 'Thi học kỳ 1', score: 6.0, date: '2023-12-15' },
          { name: 'Thi học kỳ 2', score: 6.5, date: '2024-05-12' },
        ],
      },
      {
        subjectId: 'english',
        midTerm1: 5.0, term1: 5.5, midTerm2: 5.5, term2: 6.0, final: 5.8,
        exams: [
          { name: 'Kiểm tra 15p', score: 6.0, date: '2023-10-08' },
          { name: 'Kiểm tra 1 tiết', score: 5.0, date: '2023-11-12' },
          { name: 'Thi học kỳ 1', score: 5.5, date: '2023-12-18' },
          { name: 'Thi học kỳ 2', score: 6.0, date: '2024-05-16' },
        ],
      },
      {
        subjectId: 'biology',
        midTerm1: 4.5, term1: 5.0, midTerm2: 5.0, term2: 5.5, final: 5.3,
        exams: [
          { name: 'Kiểm tra 15p', score: 5.5, date: '2023-10-18' },
          { name: 'Kiểm tra 1 tiết', score: 4.5, date: '2023-11-22' },
          { name: 'Thi học kỳ 1', score: 5.0, date: '2023-12-28' },
          { name: 'Thi học kỳ 2', score: 5.5, date: '2024-05-22' },
        ],
      },
      {
        subjectId: 'history',
        midTerm1: 5.5, term1: 6.0, midTerm2: 5.0, term2: 5.5, final: 5.7,
        exams: [
          { name: 'Kiểm tra 15p', score: 6.5, date: '2023-10-20' },
          { name: 'Kiểm tra 1 tiết', score: 5.5, date: '2023-11-25' },
          { name: 'Thi học kỳ 1', score: 6.0, date: '2023-12-27' },
          { name: 'Thi học kỳ 2', score: 5.5, date: '2024-05-24' },
        ],
      },
      {
        subjectId: 'geography',
        midTerm1: 5.0, term1: 5.5, midTerm2: 5.5, term2: 6.0, final: 5.8,
        exams: [
          { name: 'Kiểm tra 15p', score: 6.0, date: '2023-10-22' },
          { name: 'Kiểm tra 1 tiết', score: 5.0, date: '2023-11-28' },
          { name: 'Thi học kỳ 1', score: 5.5, date: '2023-12-30' },
          { name: 'Thi học kỳ 2', score: 6.0, date: '2024-05-26' },
        ],
      },
    ],
  },
];
