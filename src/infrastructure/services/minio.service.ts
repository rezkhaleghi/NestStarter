import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";
import { FileStorage } from "../../application/interfaces/file-storage.interface";

@Injectable()
export class MinioService extends FileStorage implements OnModuleInit {
  private readonly client: Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    super();

    this.client = new Client({
      endPoint: this.configService.get<string>("MINIO_ENDPOINT", "localhost"),
      port: Number(this.configService.get<string>("MINIO_PORT", "9000")),
      useSSL: false,
      accessKey: this.configService.get<string>(
        "MINIO_ACCESS_KEY",
        "minioadmin",
      ),
      secretKey: this.configService.get<string>(
        "MINIO_SECRET_KEY",
        "minioadmin",
      ),
    });

    this.bucket = this.configService.get<string>("MINIO_BUCKET", "app");
  }

  async onModuleInit(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);

    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async upload(
    objectName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.putObject(
      this.bucket,
      objectName,
      buffer,
      buffer.length,
      {
        "Content-Type": contentType,
      },
    );
  }

  async delete(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectName);
  }

  getUrl(objectName: string): string {
    const endpoint = this.configService.get<string>(
      "MINIO_ENDPOINT",
      "localhost",
    );

    const port = this.configService.get<string>("MINIO_PORT", "9000");

    return `http://${endpoint}:${port}/${this.bucket}/${objectName}`;
  }
}
