import { BlobReader, BlobWriter, Entry, ZipReader, ZipReaderConstructorOptions } from '@zip.js/zip.js';

export class Zipper {
  static async doesRequirePassword(zipFile: Blob): Promise<boolean> {
    const entries = await new ZipReader(new BlobReader(zipFile), {}).getEntries();

    return Promise.all(entries.map((e) => e.getData(new BlobWriter())))
      .then(() => false)
      .catch((_e: any) => true);
  }

  static async getEntries(zipFile: Blob): Promise<Entry[]> {
    return this.unzip(zipFile, null);
  }

  static async getEntriesWithPassword(zipFile: Blob, password: string): Promise<Entry[]> {
    return this.unzip(zipFile, password);
  }

  private static async unzip(zipFile: Blob, password: string | null): Promise<Entry[]> {
    const params: ZipReaderConstructorOptions = {};
    if (password) {
      params.password = password;
    }

    const reader = new ZipReader(new BlobReader(zipFile), params);
    const entries = await reader.getEntries();

    await Promise.all(entries.map((e) => e.getData(new BlobWriter()))).finally(() => reader.close());

    return entries;
  }
}
