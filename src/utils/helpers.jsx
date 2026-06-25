import { 
  DAY_LABELS, 
  AV_COLORS, 
  ATT_MAX_SCORE, 
  ATT_CRITERION_ID, 
  DEFAULT_WORK_DAYS 
} from './constants';

// Toast
let toastFn = null;

export const setToastFn = (fn) => {
  toastFn = fn;
};

export const toast = (type, message, icon = 'bi-info-circle') => {
  if (toastFn) {
    toastFn(type, message, icon);
  } else {
    console.log(`[${type}] ${message}`);
  }
};

// Helpers
export const initials = (name) => {
  if (!name) return '';
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('');
};

export const avColor = (index) => AV_COLORS[index % AV_COLORS.length];

export const nextId = (arr) => {
  if (!arr || !arr.length) return 1;
  return Math.max(...arr.map(x => x.id || 0)) + 1;
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const toNum = (v) => {
  if (v === null || v === undefined || v === '') return v;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isNaN(n) ? v : n;
};

export const pillHtml = (status) => {
  const map = {
    present: ['pill-green', 'bi-check-circle-fill', 'حاضر'],
    absent: ['pill-red', 'bi-x-circle-fill', 'غائب'],
    excused: ['pill-amber', 'bi-exclamation-circle-fill', 'غياب بعذر'],
    pending: ['pill-purple', 'bi-hourglass-split', 'انتظار']
  };
  const [cls, icon, label] = map[status] || ['pill-gray', 'bi-dash', '—'];
  return `<span class="pill ${cls}"><i class="bi ${icon}"></i> ${label}</span>`;
};

export const attStatusLabel = (status) => {
  const map = { present: 'حاضر', absent: 'غائب', excused: 'غياب بعذر', pending: 'انتظار' };
  return map[status] || status;
};

export const monthName = (m) => {
  const names = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  if (!m) return '';
  const parts = m.split('-');
  if (parts.length < 2) return m;
  const [y, mn] = parts.map(Number);
  if (isNaN(y) || isNaN(mn)) return m;
  return `${names[mn - 1]} ${y}`;
};

export const normalizeStudentStatus = (v) => {
  const x = String(v || '').trim();
  if (['مستجد', 'راسب و معيد', 'ناجح و منقول'].includes(x)) return x;
  const map = { 'نشط': 'مستجد', 'موقوف': 'راسب و معيد', 'متخرج': 'ناجح و منقول', 'منسحب': 'راسب و معيد' };
  return map[x] || 'مستجد';
};

export const flutterDayLabel = (i) => {
  const map = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  return map[Number(i)] || '—';
};

// Get DB from window
const getDB = () => {
  if (typeof window !== 'undefined' && window.DB) {
    return window.DB;
  }
  return {
    places: [],
    sessions: [],
    supervisors: [],
    students: [],
    enrollments: [],
    attendance: [],
    holidays: [],
    eval_templates: []
  };
};

// Place functions
export const getPlaceWorkDays = (place, sessId) => {
  const times = place?.sessionTimes?.[String(sessId)] || {};
  return Array.isArray(times.workDays) && times.workDays.length 
    ? times.workDays.map(Number) 
    : DEFAULT_WORK_DAYS;
};

export const isOfficialHoliday = (dateStr, holidays) => {
  if (!holidays || !holidays.length) return false;
  return holidays.some(h => {
    if (h.date) return h.date === dateStr;
    if (h.startDate) {
      const end = h.endDate || h.startDate;
      return dateStr >= h.startDate && dateStr <= end;
    }
    return false;
  });
};

export const isTrainingWorkDay = (place, sessId, dateStr, holidays) => {
  if (!dateStr) return false;
  const dow = new Date(dateStr).getDay();
  if (dow === 5) return false;
  if (isOfficialHoliday(dateStr, holidays)) return false;
  return getPlaceWorkDays(place, sessId).includes(dow);
};

export const eachDateInRange = (startStr, endStr, fn) => {
  if (!startStr || !endStr) return;
  const d = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  while (d <= end) {
    fn(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
};

export const countWorkDaysInPeriod = (place, sessId, startStr, endStr, holidays) => {
  let n = 0;
  eachDateInRange(startStr, endStr, (dateStr) => {
    if (isTrainingWorkDay(place, sessId, dateStr, holidays)) n++;
  });
  return n;
};

export const getPlaceSessionTime = (place, sessId) => {
  if (!place) return { startTime: '08:00', endTime: '14:00' };
  const times = place.sessionTimes?.[String(sessId)] || {};
  return { startTime: times.startTime || '08:00', endTime: times.endTime || '14:00' };
};

export const getPlaceCap = (place, sessId) => {
  if (!place) return 0;
  if (place.sessionCaps && place.sessionCaps[String(sessId)] !== undefined) {
    return parseInt(place.sessionCaps[String(sessId)]) || 0;
  }
  if (place.capacity) return parseInt(place.capacity) || 0;
  return 0;
};

export const sessionStatusPill = (status) => {
  if (status === 'active') return '<span class="pill pill-green"><i class="bi bi-play-circle-fill"></i> جارية</span>';
  if (status === 'upcoming') return '<span class="pill pill-blue"><i class="bi bi-calendar-event"></i> قادمة</span>';
  return '<span class="pill pill-gray"><i class="bi bi-lock-fill"></i> منتهية</span>';
};

// Name helpers
export const placeName = (id) => {
  const DB = getDB();
  const p = DB.places?.find(p => p.id === id);
  return p ? p.name : '—';
};

export const svName = (id) => {
  const DB = getDB();
  const s = DB.supervisors?.find(s => s.id === id);
  return s ? (s.name || `${s.fname || ''} ${s.lname || ''}`.trim()) : '—';
};

export const sessName = (id) => {
  const DB = getDB();
  const s = DB.sessions?.find(s => s.id === id);
  return s ? s.name : '—';
};

export const studentName = (id) => {
  const DB = getDB();
  const s = DB.students?.find(s => s.id === id);
  return s ? s.name : '—';
};

export const sessionIsLocked = (sessId) => {
  const DB = getDB();
  const s = DB.sessions?.find(s => s.id === sessId);
  return s && s.status === 'done';
};

// Student distribution label
export const studentDistLabel = (student) => {
  if (!student) return { text: 'غير موزع', pill: 'pill-gray' };
  const DB = getDB();
  const mode = student.distribution_type;
  const enrolled = DB.enrollments?.some(e => e.studentId === student.id && e.placeId) || false;
  if (mode === 'external') return enrolled ? { text: 'خارجي · موزع', pill: 'pill-purple' } : { text: 'خارجي · بانتظار', pill: 'pill-amber' };
  if (mode === 'college' || mode === 'internal') return enrolled ? { text: 'داخلي · موزع', pill: 'pill-green' } : { text: 'داخلي · غير موزع', pill: 'pill-blue' };
  return enrolled ? { text: 'موزع', pill: 'pill-gray' } : { text: 'غير موزع', pill: 'pill-gray' };
};

// Attendance stats
export const attStats = (stuId, sessId, placeId, month) => {
  const DB = getDB();
  const recs = DB.attendance?.filter(r => 
    r.studentId === stuId &&
    (!sessId || r.sessionId === sessId) &&
    (!placeId || r.placeId === placeId) &&
    (!month || r.date.startsWith(month))
  ) || [];
  
  const present = recs.filter(r => r.status === 'present').length;
  const absent = recs.filter(r => r.status === 'absent').length;
  const excused = recs.filter(r => r.status === 'excused').length;
  const pending = recs.filter(r => r.status === 'pending').length;
  const total = recs.length;
  const pct = total > 0 ? Math.round(present / total * 100) : 0;
  
  return { present, absent, excused, pending, total, pct, recs };
};

// Compute attendance evaluation score
export const computeAttendanceEvalScore = (studentId, sessionId, placeId) => {
  const DB = getDB();
  const place = DB.places?.find(p => p.id === placeId);
  const sess = DB.sessions?.find(s => s.id === sessionId);
  const times = place?.sessionTimes?.[String(sessionId)] || {};
  const start = times.periodStart || sess?.start || '';
  const end = times.periodEnd || sess?.end || '';
  
  const totalWorkDays = countWorkDaysInPeriod(place, sessionId, start, end, DB.holidays || []);
  const recs = DB.attendance?.filter(r => 
    r.studentId === studentId &&
    r.sessionId === sessionId &&
    r.placeId === placeId &&
    (!start || r.date >= start) &&
    (!end || r.date <= end)
  ) || [];
  
  const present = recs.filter(r => r.status === 'present').length;
  const absentUnexcused = recs.filter(r => r.status === 'absent').length;
  const excused = recs.filter(r => r.status === 'excused').length;
  const pending = recs.filter(r => r.status === 'pending').length;
  
  let score = 0;
  let rule = '';
  const denom = totalWorkDays > 0 ? totalWorkDays : Math.max(present + absentUnexcused + excused, 1);
  
  if (absentUnexcused > 3) {
    score = 0;
    rule = 'غياب بدون عذر أكثر من 3 أيام → صفر';
  } else if (excused > 3) {
    score = ATT_MAX_SCORE / 2;
    rule = 'غياب بعذر أكثر من 3 أيام → نصف الدرجة';
  } else {
    const effective = present + excused * 0.5;
    score = Math.round((effective / denom) * ATT_MAX_SCORE * 10) / 10;
    score = Math.min(ATT_MAX_SCORE, Math.max(0, score));
    rule = 'حساب نسبي: (حضور + نصف الأعذار) ÷ أيام العمل × 25';
  }
  
  return { score, maxScore: ATT_MAX_SCORE, present, absentUnexcused, excused, pending, totalWorkDays, rule, recs };
};

export const getSessionPeriodForPlace = (place, sessId) => {
  const DB = getDB();
  const sess = DB.sessions?.find(x => x.id === sessId);
  const times = place?.sessionTimes?.[String(sessId)] || {};
  return {
    start: times.periodStart || sess?.start || '',
    end: times.periodEnd || sess?.end || ''
  };
};

// Ensure attendance criterion
export const ensureAttCriterion = (criteria) => {
  const list = Array.isArray(criteria) ? [...criteria] : [];
  const others = list.filter(c => c.id !== ATT_CRITERION_ID && !c.fixed);
  return [{ id: ATT_CRITERION_ID, name: 'الحضور', maxScore: ATT_MAX_SCORE, fixed: true }, ...others];
};

export const getEvalCriteriaForPlace = (placeId) => {
  const DB = getDB();
  const tpl = DB.eval_templates?.find(t => t.placeId === placeId);
  return ensureAttCriterion(tpl?.criteria || []);
};

// Export DEFAULT_WORK_DAYS
export { DEFAULT_WORK_DAYS };