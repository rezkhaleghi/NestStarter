import type { Readable } from "stream";

export abstract class FileStorage {
  abstract upload(
    objectName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void>;

  abstract delete(objectName: string): Promise<void>;

  abstract get(objectName: string): Promise<{
    buffer: Buffer;
    contentType: string;
    size: number;
  }>;

  abstract getUrl(objectName: string): string;

  abstract healthCheck(): Promise<void>;
}
