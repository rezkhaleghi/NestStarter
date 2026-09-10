import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import sharp = require("sharp");

import { ImageProcessing } from "../../application/interfaces/image-processing.interface";

const MAX_AVATAR_DIMENSION = 4096;
const MAX_AVATAR_PIXELS = 16_777_216; // 4096 × 4096

@Injectable()
export class ImageProcessingService implements ImageProcessing {
  private readonly logger = new Logger(ImageProcessingService.name);

  async processAvatar(buffer: Buffer): Promise<Buffer> {
    try {
      if (!buffer || buffer.length === 0) {
        throw new BadRequestException("Uploaded image is empty");
      }

      this.logger.debug(`Processing image (${buffer.length} bytes)`);

      /**
       * Sharp 0.35.x exposes a callable function at runtime, but with this
       * project's CommonJS TypeScript configuration, TypeScript does not
       * recognize the imported Sharp module as callable.
       *
       * This workaround is isolated to the infrastructure layer.
       */
      const image = (sharp as unknown as (input: Buffer) => any)(buffer);

      // Metadata inspection does not decode the entire image.
      const metadata = await image.metadata();

      this.logger.debug(
        `Image metadata: format=${metadata.format}, width=${metadata.width}, height=${metadata.height}`,
      );

      if (!metadata.format) {
        throw new BadRequestException("Could not determine image format");
      }

      const supportedFormats = new Set(["jpeg", "png", "webp", "gif"]);

      if (!supportedFormats.has(metadata.format)) {
        throw new BadRequestException(
          "The uploaded file format is not supported",
        );
      }

      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;

      if (width <= 0 || height <= 0) {
        throw new BadRequestException("Could not determine image dimensions");
      }

      if (
        width > MAX_AVATAR_DIMENSION ||
        height > MAX_AVATAR_DIMENSION ||
        width * height > MAX_AVATAR_PIXELS
      ) {
        throw new BadRequestException(
          `Image dimensions must not exceed ${MAX_AVATAR_DIMENSION}x${MAX_AVATAR_DIMENSION}`,
        );
      }

      const processedImage = await image
        .rotate()
        .resize(512, 512, {
          fit: "cover",
          position: "center",
        })
        .webp({
          quality: 85,
        })
        .toBuffer();

      this.logger.debug(
        `Avatar processed successfully (${processedImage.length} bytes)`,
      );

      return processedImage;
    } catch (error) {
      this.logger.error("Failed to process avatar", error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        "The uploaded file is not a valid or supported image",
      );
    }
  }
}
