import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import sharp = require("sharp");
import { ImageProcessing } from "../../application/interfaces/image-processing.interface";

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
       * We intentionally cast it here instead of enabling `esModuleInterop`
       * globally, because changing the module interop configuration affects
       * other CommonJS dependencies in the application (such as Passport).
       *
       * This workaround is isolated to the infrastructure layer and can be
       * removed if a future Sharp/TypeScript setup provides compatible typings.
       */
      const image = (sharp as unknown as (input: Buffer) => any)(buffer);

      const metadata = await image.metadata();

      this.logger.debug(
        `Image metadata: format=${metadata.format}, width=${metadata.width}, height=${metadata.height}`,
      );

      if (!metadata.format) {
        throw new BadRequestException("Could not determine image format");
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
