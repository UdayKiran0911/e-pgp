import { Role } from '../../generated/prisma/client';
import { PublicUser } from '../auth/auth.types';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Strips passwordHash (and anything else not meant to leave the API) from a User record. */
export function toPublicUser(user: UserRecord): PublicUser {
  const {
    id,
    email,
    name,
    role,
    organizationId,
    isActive,
    createdAt,
    updatedAt,
  } = user;
  return {
    id,
    email,
    name,
    role,
    organizationId,
    isActive,
    createdAt,
    updatedAt,
  };
}
