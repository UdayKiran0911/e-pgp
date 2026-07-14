import { NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: {
    organization: { findUnique: jest.Mock; update: jest.Mock };
  };

  const org = { id: 'org-1', name: 'Acme Corp' };

  beforeEach(() => {
    prisma = {
      organization: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new OrganizationsService(prisma as unknown as PrismaService);
  });

  it('returns the organization when it exists', async () => {
    prisma.organization.findUnique.mockResolvedValue(org);

    await expect(service.findOne(org.id)).resolves.toEqual(org);
  });

  it('throws when the organization does not exist', async () => {
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-org')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates the organization name after confirming it exists', async () => {
    prisma.organization.findUnique.mockResolvedValue(org);
    prisma.organization.update.mockResolvedValue({ ...org, name: 'New Name' });

    const result = await service.update(org.id, { name: 'New Name' });

    expect(result.name).toBe('New Name');
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: org.id },
      data: { name: 'New Name' },
    });
  });
});
