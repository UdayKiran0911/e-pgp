// Document Management (Phase 5 Module 7): DocumentsService depends on this
// interface, not a concrete provider — swapping local disk for a real
// cloud object store later is a one-file change (implement this
// interface, update the module's provider binding), not a rewrite of
// every call site.
export interface StorageProvider {
  save(buffer: Buffer, originalFilename: string): Promise<string>;
  getAbsolutePath(storageKey: string): string;
  delete(storageKey: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
