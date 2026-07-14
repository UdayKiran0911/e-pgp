/** Minimal shapes for asserting on supertest response bodies in integration tests. */

export interface PublicUserBody {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  isActive: boolean;
}

export interface AuthResponseBody {
  accessToken: string;
  user: PublicUserBody;
}
