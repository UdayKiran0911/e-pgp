import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

// AES-256-GCM at-rest encryption (Phase 9) for secrets stored in the
// database — currently just WebhookConnector.encryptedUrl. The key comes
// from ENCRYPTION_KEY (a 32-byte hex string), never hardcoded. Payload
// format is `iv:authTag:ciphertext`, each hex-encoded, so it round-trips
// through a plain String column.
@Injectable()
export class EncryptionService implements OnModuleInit {
  private key!: Buffer;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const hexKey = this.config.get<string>('ENCRYPTION_KEY');
    if (!hexKey) {
      throw new Error('ENCRYPTION_KEY must be set.');
    }
    const key = Buffer.from(hexKey, 'hex');
    if (key.length !== KEY_LENGTH) {
      throw new Error(
        `ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars).`,
      );
    }
    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      ciphertext.toString('hex'),
    ].join(':');
  }

  decrypt(payload: string): string {
    const [ivHex, authTagHex, ciphertextHex] = payload.split(':');
    if (!ivHex || !authTagHex || !ciphertextHex) {
      throw new Error('Malformed encrypted payload.');
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, 'hex')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
