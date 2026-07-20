import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  const key32Bytes = 'a'.repeat(64); // 32 bytes hex-encoded

  function makeService(hexKey: string | undefined) {
    const config = { get: jest.fn().mockReturnValue(hexKey) };
    const service = new EncryptionService(config as unknown as ConfigService);
    service.onModuleInit();
    return service;
  }

  it('throws on module init if ENCRYPTION_KEY is not set', () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new EncryptionService(config as unknown as ConfigService);
    expect(() => service.onModuleInit()).toThrow('ENCRYPTION_KEY must be set.');
  });

  it('throws on module init if ENCRYPTION_KEY is not 32 bytes', () => {
    const config = { get: jest.fn().mockReturnValue('deadbeef') };
    const service = new EncryptionService(config as unknown as ConfigService);
    expect(() => service.onModuleInit()).toThrow(/32 bytes/);
  });

  it('round-trips a plaintext value through encrypt/decrypt', () => {
    const service = makeService(key32Bytes);
    const ciphertext = service.encrypt('https://hooks.slack.com/services/x');
    expect(ciphertext).not.toContain('https://');
    expect(service.decrypt(ciphertext)).toBe(
      'https://hooks.slack.com/services/x',
    );
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const service = makeService(key32Bytes);
    const first = service.encrypt('same-value');
    const second = service.encrypt('same-value');
    expect(first).not.toBe(second);
  });

  it('rejects a tampered ciphertext', () => {
    const service = makeService(key32Bytes);
    const ciphertext = service.encrypt('secret-url');
    const [iv, authTag, body] = ciphertext.split(':');
    const tampered = [iv, authTag, body.slice(0, -2) + '00'].join(':');
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('cannot decrypt a payload encrypted under a different key', () => {
    const serviceA = makeService(key32Bytes);
    const serviceB = makeService('b'.repeat(64));
    const ciphertext = serviceA.encrypt('secret-url');
    expect(() => serviceB.decrypt(ciphertext)).toThrow();
  });
});
