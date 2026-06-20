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
