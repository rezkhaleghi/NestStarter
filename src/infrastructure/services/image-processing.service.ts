import { Injectable } from "@nestjs/common";
import sharp from "sharp";
import { ImageProcessing } from "../../application/interfaces/image-processing.interface";

@Injectable()
export class ImageProcessingService implements ImageProcessing {
  async processAvatar(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .rotate()
      .resize(512, 512, {
        fit: "cover",
        position: "center",
      })
      .webp({
        quality: 85,
      })
      .toBuffer();
  }
}
