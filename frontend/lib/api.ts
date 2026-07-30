export type UserRole = "student" | "admin";

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

export type QuizAttemptAnswer = {
  id: number;
  question_id: number;
  question_text: string;
  selected_option_id: number;
  selected_option_text: string;
  correct_option_id: number | null;
  correct_option_text: string | null;
  is_correct: boolean;
};

export type QuizAttemptDetail = QuizAttempt & {
  answers: QuizAttemptAnswer[];
};

export type LessonProgress = {
  id: number;
  user_id: number;
  lesson_id: number;
  completed: boolean;
  completed_at: string | null;
};

export type CaseStudyResponse = {
  id: number;
  user_id: number;
  lesson_id: number;
  response_text: string;
  submitted_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by_id: number | null;
};

export type AdminPsetResponse = {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  module_title: string;
  module_order_index: number;
  assessment_id: number;
  assessment_title: string;
  response_text: string;
  submitted_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
};

export type AdminQuizAttempt = QuizAttemptDetail & {
  student_id: number;
  student_name: string;
  student_email: string;
  module_title: string;
  module_order_index: number;
  assessment_id: number;
  assessment_title: string;
};

export type AdminGradebookRow = {
  student_id: number;
  student_name: string;
  student_email: string;
  completed_assessments: number;
  total_assessments: number;
  latest_quiz_score: number | null;
  quiz_attempts: number;
  pset_submissions: number;
  pending_psets: number;
  reviewed_psets: number;
};

export type AdminReviewDashboard = {
  total_students: number;
  total_assessments: number;
  pending_psets: number;
  reviewed_psets: number;
  pset_responses: AdminPsetResponse[];
  quiz_attempts: AdminQuizAttempt[];
  gradebook: AdminGradebookRow[];
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

export function fetchLessonQuizAttempts(lessonId: string, token: string) {
  return apiRequest<QuizAttemptDetail[]>(
    `/quizzes/lesson/${lessonId}/attempts`,
    {},
    token,
  );
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

export function fetchMyCaseStudyResponse(lessonId: string, token: string) {
  return apiRequest<CaseStudyResponse>(
    `/responses/lessons/${lessonId}/me`,
    {},
    token,
  );
}

export function submitCaseStudyResponse(
  lessonId: string,
  payload: { response_text: string },
  token: string,
) {
  return apiRequest<CaseStudyResponse>(
    `/responses/lessons/${lessonId}`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export function fetchMyProgress(token: string) {
  return apiRequest<ProgressSummary>("/progress/me", {}, token);
}

export function fetchAdminReviewDashboard(token: string) {
  return apiRequest<AdminReviewDashboard>("/admin/review", {}, token);
}

export function updateAdminPsetReview(
  responseId: number,
  payload: { reviewed: boolean },
  token: string,
) {
  return apiRequest<AdminPsetResponse>(
    `/admin/pset-responses/${responseId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
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
