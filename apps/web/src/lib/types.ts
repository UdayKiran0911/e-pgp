export type Role = 'ADMIN' | 'GOVERNANCE_LEAD' | 'MEMBER' | 'AUDITOR';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface RegisterInput {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  isActive?: boolean;
}
