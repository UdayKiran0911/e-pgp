import { Role } from '../../generated/prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
