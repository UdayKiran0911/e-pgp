import type {
  AuthResponse,
  CreateProjectInput,
  CreateUserInput,
  LoginInput,
  Organization,
  Project,
  PublicUser,
  RegisterInput,
  UpdateProjectInput,
  UpdateUserInput,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  message?: string | string[];
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body: ErrorBody = await response.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? response.statusText);
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  register: (data: RegisterInput) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginInput) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) => request<PublicUser>('/auth/me', {}, token),

  getMyOrganization: (token: string) =>
    request<Organization>('/organizations/me', {}, token),

  listUsers: (token: string) => request<PublicUser[]>('/users', {}, token),

  createUser: (token: string, data: CreateUserInput) =>
    request<PublicUser>(
      '/users',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateUser: (token: string, id: string, data: UpdateUserInput) =>
    request<PublicUser>(
      `/users/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listProjects: (token: string) => request<Project[]>('/projects', {}, token),

  createProject: (token: string, data: CreateProjectInput) =>
    request<Project>(
      '/projects',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateProject: (token: string, id: string, data: UpdateProjectInput) =>
    request<Project>(
      `/projects/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),
};
