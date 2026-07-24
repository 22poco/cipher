export type UserRole = "student" | "teacher" | "admin";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type LessonSummary = {
  id: number;
  module_id: number;
  title: string;
  lesson_type: string;
  order_index: number;
  video_url: string | null;
};

export type Lesson = LessonSummary & {
  content: string | null;
};

export type LessonType = "reading" | "video" | "case_study" | "code_activity";

export type CourseModule = {
  id: number;
  unit_id: number;
  title: string;
  description: string | null;
  order_index: number;
  lessons: LessonSummary[];
};

export type Unit = {
  id: number;
  title: string;
  description: string | null;
  order_index: number;
  modules: CourseModule[];
};

export type QuizOption = {
  id: number;
  question_id: number;
  option_text: string;
};

export type QuizAdminOption = QuizOption & {
  is_correct: boolean;
};

export type QuizQuestion = {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: "multiple_choice";
  order_index: number;
  options: QuizOption[];
};

export type QuizAdminQuestion = Omit<QuizQuestion, "options"> & {
  options: QuizAdminOption[];
};

export type Quiz = {
  id: number;
  lesson_id: number;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
};

export type QuizAdmin = Omit<Quiz, "questions"> & {
  questions: QuizAdminQuestion[];
};

export type QuizSubmitResult = {
  attempt_id: number;
  quiz_id: number;
  score: number;
  correct_count: number;
  total_questions: number;
  results: {
    question_id: number;
    selected_option_id: number | null;
    correct_option_id: number | null;
    is_correct: boolean;
  }[];
};

export type QuizAttempt = {
  id: number;
  quiz_id: number;
  score: number;
  submitted_at: string;
};

export type LessonProgress = {
  id: number;
  user_id: number;
  lesson_id: number;
  completed: boolean;
  completed_at: string | null;
};

export type ProgressSummary = {
  completed_lessons: number;
  total_lessons: number;
  unit_1_progress_percent: number;
  lesson_progress: LessonProgress[];
  quiz_attempts: QuizAttempt[];
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "something went wrong";

    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(token: string) {
  return apiRequest<User>("/auth/me", {}, token);
}

export function fetchUnits(token: string) {
  return apiRequest<Unit[]>("/courses/units", {}, token);
}

export function fetchUnit(unitId: string, token: string) {
  return apiRequest<Unit>(`/courses/units/${unitId}`, {}, token);
}

export function fetchModule(moduleId: string, token: string) {
  return apiRequest<CourseModule>(`/courses/modules/${moduleId}`, {}, token);
}

export function fetchLesson(lessonId: string, token: string) {
  return apiRequest<Lesson>(`/courses/lessons/${lessonId}`, {}, token);
}

export function fetchLessonQuiz(lessonId: string, token: string) {
  return apiRequest<Quiz>(`/quizzes/lesson/${lessonId}`, {}, token);
}

export function submitQuiz(
  quizId: number,
  payload: { answers: { question_id: number; option_id: number }[] },
  token: string,
) {
  return apiRequest<QuizSubmitResult>(
    `/quizzes/${quizId}/submit`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function completeLesson(lessonId: string, token: string) {
  return apiRequest<LessonProgress>(
    `/progress/lessons/${lessonId}/complete`,
    { method: "POST" },
    token,
  );
}

export function fetchMyProgress(token: string) {
  return apiRequest<ProgressSummary>("/progress/me", {}, token);
}

export type UnitPayload = {
  title: string;
  description: string | null;
  order_index: number;
};

export type ModulePayload = {
  unit_id: number;
  title: string;
  description: string | null;
  order_index: number;
};

export type LessonPayload = {
  module_id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  lesson_type: LessonType;
  order_index: number;
};

export function createUnit(payload: UnitPayload, token: string) {
  return apiRequest<Unit>(
    "/admin/units",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function updateUnit(unitId: number, payload: UnitPayload, token: string) {
  return apiRequest<Unit>(
    `/admin/units/${unitId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export function deleteUnit(unitId: number, token: string) {
  return apiRequest<{ message: string }>(
    `/admin/units/${unitId}`,
    { method: "DELETE" },
    token,
  );
}

export function createModule(payload: ModulePayload, token: string) {
  return apiRequest<CourseModule>(
    "/admin/modules",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function updateModule(moduleId: number, payload: ModulePayload, token: string) {
  return apiRequest<CourseModule>(
    `/admin/modules/${moduleId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export function deleteModule(moduleId: number, token: string) {
  return apiRequest<{ message: string }>(
    `/admin/modules/${moduleId}`,
    { method: "DELETE" },
    token,
  );
}

export function createLesson(payload: LessonPayload, token: string) {
  return apiRequest<Lesson>(
    "/admin/lessons",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function updateLesson(lessonId: number, payload: LessonPayload, token: string) {
  return apiRequest<Lesson>(
    `/admin/lessons/${lessonId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export function deleteLesson(lessonId: number, token: string) {
  return apiRequest<{ message: string }>(
    `/admin/lessons/${lessonId}`,
    { method: "DELETE" },
    token,
  );
}

export type QuizPayload = {
  lesson_id: number;
  title: string;
  description: string | null;
};

export type QuizQuestionPayload = {
  quiz_id: number;
  question_text: string;
  question_type: "multiple_choice";
  order_index: number;
  options: { option_text: string; is_correct: boolean }[];
};

export type QuizQuestionUpdatePayload = {
  question_text: string;
  question_type: "multiple_choice";
  order_index: number;
};

export type QuizOptionUpdatePayload = {
  option_text: string;
  is_correct: boolean;
};

export function fetchAdminLessonQuiz(lessonId: number, token: string) {
  return apiRequest<QuizAdmin>(`/admin/lessons/${lessonId}/quiz`, {}, token);
}

export function createQuiz(payload: QuizPayload, token: string) {
  return apiRequest<QuizAdmin>(
    "/admin/quizzes",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function updateQuiz(quizId: number, payload: QuizPayload, token: string) {
  return apiRequest<QuizAdmin>(
    `/admin/quizzes/${quizId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export function deleteQuiz(quizId: number, token: string) {
  return apiRequest<{ message: string }>(
    `/admin/quizzes/${quizId}`,
    { method: "DELETE" },
    token,
  );
}

export function createQuizQuestion(payload: QuizQuestionPayload, token: string) {
  return apiRequest<QuizAdminQuestion>(
    "/admin/quiz-questions",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function updateQuizQuestion(
  questionId: number,
  payload: QuizQuestionUpdatePayload,
  token: string,
) {
  return apiRequest<QuizAdminQuestion>(
    `/admin/quiz-questions/${questionId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export function deleteQuizQuestion(questionId: number, token: string) {
  return apiRequest<{ message: string }>(
    `/admin/quiz-questions/${questionId}`,
    { method: "DELETE" },
    token,
  );
}

export function updateQuizOption(
  optionId: number,
  payload: QuizOptionUpdatePayload,
  token: string,
) {
  return apiRequest<QuizAdminOption>(
    `/admin/quiz-options/${optionId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

/* ===========================================================================
   Practice-first mission platform (AP Cybersecurity foundation)
   Types mirror the JSON returned by the FastAPI mission/attempt/teacher routers.
=========================================================================== */

export type SkillCode =
  | "analyze_risk"
  | "mitigate_risk"
  | "detect_attacks"
  | "collaborate";

export type MissionType =
  | "multiple_choice"
  | "written_response"
  | "case_investigation"
  | "bash_simulation"
  | "network_simulation";

export type AttemptStatus =
  | "not_started"
  | "assigned"
  | "started"
  | "draft_saved"
  | "submitted"
  | "auto_checked"
  | "needs_teacher_review"
  | "graded"
  | "returned";

export type SupportSignal = "independent" | "ai" | "teacher" | "others";

export type UnitRef = {
  id: number;
  order_index: number;
  title: string;
  accent: "green" | "blue" | "purple" | "orange" | "teal";
};

export type SkillTag = { code: SkillCode; title: string };

export type MissionCard = {
  id: number;
  title: string;
  summary: string;
  mission_type: MissionType;
  difficulty: string;
  estimated_minutes: number;
  unit: UnitRef;
  skills: SkillTag[];
  status: AttemptStatus;
  attempt_id: number | null;
  progress_percent: number;
  due_at: string | null;
  assignment_id?: number | null;
  assigned?: boolean;
};

export type StudentDashboard = {
  user: { id: number; name: string; role: UserRole };
  sections: { id: number; name: string; period: string | null; term: string | null }[];
  active_section: { id: number; name: string; period: string | null } | null;
  metrics: {
    streak_days: number;
    missions_completed: number;
    missions_assigned: number;
    average_score: number;
    support_used_week: number;
  };
  units: {
    id: number;
    order_index: number;
    title: string;
    accent: UnitRef["accent"];
    progress_percent: number;
    missions_total: number;
    missions_completed: number;
  }[];
  recent_assignments: MissionCard[];
  weekly_progress: {
    points: { day: string; value: number }[];
    time_practicing_minutes: number;
    missions_attempted: number;
    best_score: number;
  };
};

export type MissionGroup = { unit: UnitRef; missions: MissionCard[] };

export type SupportEvent = {
  id: number;
  from_signal: SupportSignal | null;
  to_signal: SupportSignal;
  note: string | null;
  source: string;
  created_at: string;
};

export type EvidenceEntry = {
  id: number;
  evidence_type: string;
  payload: Record<string, unknown>;
  updated_at: string;
};

export type MissionStep = { key: string; label: string; state: string };

export type NetworkNode = {
  id: string;
  type: string;
  label: string;
  sub: string;
  accent?: string;
};
export type FirewallRule = {
  order: number;
  action: "allow" | "deny";
  source: string;
  destination: string;
  service: string;
  port: string;
};
export type TrafficTest = {
  source: string;
  destination: string;
  service: string;
  expected: string;
  actual: string;
  passed: boolean;
};
export type NetworkPayload = {
  topology: { nodes: NetworkNode[]; edges: [string, string][] };
  firewall_rules: FirewallRule[];
  traffic_tests: TrafficTest[];
  notes: string;
  steps?: MissionStep[];
};

export type AutoCheck = {
  score: number;
  max_score: number;
  passed: boolean;
  details: {
    label?: string;
    checks?: { name: string; passed: boolean }[];
  };
} | null;

export type AttemptWorkspace = {
  attempt: {
    id: number;
    status: AttemptStatus;
    progress_percent: number;
    active_support_signal: SupportSignal;
    started_at: string | null;
    submitted_at: string | null;
    returned_at: string | null;
    due_at: string | null;
  };
  mission: {
    id: number;
    title: string;
    summary: string;
    context_brief: string | null;
    mission_type: MissionType;
    difficulty: string;
    estimated_minutes: number;
    unit: UnitRef;
    skills: SkillTag[];
  };
  steps: MissionStep[];
  activity: MissionActivity;
  evidence: EvidenceEntry[];
  support: { signals: SupportSignal[]; active: SupportSignal; events: SupportEvent[] };
  auto_check: AutoCheck;
};

export type MissionQuestion = {
  id: number;
  prompt: string;
  options: string[];
};

export type MissionActivity = {
  questions?: MissionQuestion[];
  [key: string]: unknown;
};

export type AttemptListItem = {
  attempt_id: number;
  mission_id: number;
  mission_title: string;
  mission_type: MissionType;
  unit: UnitRef;
  skills: SkillTag[];
  status: AttemptStatus;
  active_support_signal: SupportSignal;
  progress_percent: number;
  started_at: string | null;
  submitted_at: string | null;
  returned_at: string | null;
  due_at: string | null;
  auto_check_passed: boolean | null;
  final_score: number | null;
};

export type SupportSummary = {
  counts: Record<SupportSignal, number>;
  total_changes: number;
  attempts_with_support: number;
  threads: {
    attempt_id: number;
    mission_id: number;
    mission_title: string;
    unit: UnitRef;
    status: AttemptStatus;
    events: SupportEvent[];
  }[];
};

export type AiSessionMessage = {
  id: number;
  role: "student" | "tutor";
  content: string;
  refused: boolean;
  created_at: string;
};

export type AiSession = {
  session: { id: number; model: string | null; assessment_mode: boolean; created_at: string } | null;
  messages: AiSessionMessage[];
};

export type AuthConfig = {
  google_enabled: boolean;
  google_client_id: string | null;
  google_allowed_domain: string;
};

export type CriterionScore = {
  criterion_id: number;
  skill_code: SkillCode;
  skill_title: string;
  criterion_title: string;
  points_awarded: number;
  points_possible: number;
};

export type GradeSummary = {
  final_score: number | null;
  max_score: number;
  comment: string | null;
  finalized_at: string | null;
  criterion_scores: CriterionScore[];
} | null;

export type TeacherOverview = {
  cards: {
    active_sections: number;
    missions_assigned: number;
    awaiting_review: number;
    returned_week: number;
    average_score: number | null;
  };
  review_queue: ReviewQueueItem[];
};

export type ReviewQueueItem = {
  attempt_id: number;
  student: string;
  mission: string;
  unit: UnitRef;
  section: string;
  submitted_at: string | null;
  auto_check_passed: boolean | null;
  status: AttemptStatus;
};

export type SectionRow = {
  id: number;
  name: string;
  period: string | null;
  students: number;
  missions_assigned: number;
  average_score: number | null;
  last_active: string | null;
};

export type TeacherSections = {
  sections: SectionRow[];
  recent_activity: { type: string; text: string; at: string | null }[];
};

export type GradebookRow = {
  student_id: number;
  student: string;
  skills: Record<SkillCode, number | null>;
  average: number | null;
};

export type Gradebook = {
  sections: { id: number; name: string; period: string | null }[];
  active_section_id: number | null;
  skills: SkillTag[];
  students: GradebookRow[];
};

export type AttemptReview = {
  attempt: {
    id: number;
    status: AttemptStatus;
    submitted_at: string | null;
    active_support_signal: SupportSignal;
  };
  student: { id: number; name: string };
  section: { id: number; name: string } | null;
  mission: { id: number; title: string; mission_type: MissionType; unit: UnitRef };
  evidence: EvidenceEntry[];
  support_events: SupportEvent[];
  auto_check: AutoCheck;
  rubric: {
    id: number;
    title: string;
    total_points: number;
    criteria: {
      id: number;
      title: string;
      description: string | null;
      points: number;
      skill_code: SkillCode;
      skill_title: string;
    }[];
  } | null;
  grade: GradeSummary;
  grade_audit: {
    old_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    reason: string | null;
    created_at: string;
  }[];
};

// ----- Student fetchers ---------------------------------------------------- //

export function fetchStudentDashboard(token: string) {
  return apiRequest<StudentDashboard>("/dashboard/student", {}, token);
}

export function fetchMissions(token: string) {
  return apiRequest<{ groups: MissionGroup[] }>("/missions", {}, token);
}

export function fetchAttempt(attemptId: number, token: string) {
  return apiRequest<AttemptWorkspace>(`/attempts/${attemptId}`, {}, token);
}

export function startAttempt(
  payload: { mission_id: number; assignment_id?: number | null },
  token: string,
) {
  return apiRequest<AttemptWorkspace>(
    "/attempts",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function saveAttemptDraft(
  attemptId: number,
  payload: { evidence_type: string; payload: Record<string, unknown>; progress_percent?: number },
  token: string,
) {
  return apiRequest<{ status: string; attempt_status: AttemptStatus }>(
    `/attempts/${attemptId}/draft`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export function addSupportEvent(
  attemptId: number,
  payload: { to_signal: SupportSignal; note?: string | null },
  token: string,
) {
  return apiRequest<SupportEvent>(
    `/attempts/${attemptId}/support-events`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function submitAttempt(attemptId: number, token: string) {
  return apiRequest<{ status: AttemptStatus; submitted_at: string }>(
    `/attempts/${attemptId}/submit`,
    { method: "POST" },
    token,
  );
}

export function sendTutorMessage(attemptId: number, content: string, token: string) {
  return apiRequest<{ reply: string; refused: boolean; session_id: number }>(
    `/ai/attempts/${attemptId}/messages`,
    { method: "POST", body: JSON.stringify({ content }) },
    token,
  );
}

export function fetchAiSession(attemptId: number, token: string) {
  return apiRequest<AiSession>(`/ai/attempts/${attemptId}/session`, {}, token);
}

export function fetchMyAttempts(token: string) {
  return apiRequest<{ attempts: AttemptListItem[] }>("/attempts", {}, token);
}

export function fetchSupportSummary(token: string) {
  return apiRequest<SupportSummary>("/attempts/support-summary", {}, token);
}

export function runAutoCheck(attemptId: number, token: string) {
  return apiRequest<{ auto_check: AutoCheck; checked: boolean }>(
    `/attempts/${attemptId}/auto-check`,
    { method: "POST" },
    token,
  );
}

// ----- Auth / SSO ---------------------------------------------------------- //

export function fetchAuthConfig() {
  return apiRequest<AuthConfig>("/auth/config", {});
}

export function loginWithGoogle(credential: string) {
  return apiRequest<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

// ----- Teacher fetchers ---------------------------------------------------- //

export function fetchTeacherOverview(token: string) {
  return apiRequest<TeacherOverview>("/teacher/overview", {}, token);
}

export function fetchTeacherSections(token: string) {
  return apiRequest<TeacherSections>("/teacher/sections", {}, token);
}

export function fetchGradebook(token: string, sectionId?: number) {
  const query = sectionId ? `?section_id=${sectionId}` : "";
  return apiRequest<Gradebook>(`/teacher/gradebook${query}`, {}, token);
}

export function fetchReviewQueue(token: string) {
  return apiRequest<{ queue: ReviewQueueItem[] }>("/teacher/review-queue", {}, token);
}

export function fetchAttemptReview(attemptId: number, token: string) {
  return apiRequest<AttemptReview>(`/teacher/attempts/${attemptId}`, {}, token);
}

export function gradeAttempt(
  attemptId: number,
  payload: {
    final_score: number;
    max_score?: number;
    comment?: string | null;
    criterion_scores?: { criterion_id: number; points_awarded: number }[];
    finalize?: boolean;
  },
  token: string,
) {
  return apiRequest<{ status: AttemptStatus; grade: GradeSummary }>(
    `/teacher/attempts/${attemptId}/grade`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}
