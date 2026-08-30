export abstract class FileStorage {
  abstract upload(
    objectName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void>;

  abstract delete(objectName: string): Promise<void>;

  abstract getUrl(objectName: string): string;

  abstract healthCheck(): Promise<void>;
}
