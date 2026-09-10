import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Res,
  StreamableFile,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";

import { FileStorage } from "../../application/interfaces/file-storage.interface";

@ApiTags("Files")
@Controller("files")
export class FilesController {
  constructor(private readonly fileStorage: FileStorage) {}

  @Get("*")
  @ApiOperation({
    summary: "Get a public avatar",
    description: "Streams a publicly accessible avatar from file storage.",
  })
  @ApiParam({
    name: "path",
    description: "Avatar storage object path",
    example: "avatars/da953d8a-9ee6-4c29-bf20-027bc65fad41/avatar.webp",
  })
  @ApiProduces(
    "image/webp",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/octet-stream",
  )
  @ApiResponse({
    status: 200,
    description: "The requested avatar.",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid file path.",
  })
  @ApiResponse({
    status: 404,
    description: "File not found.",
  })
  async getFile(
    @Param() params: Record<string, string | string[]>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const objectName = String(params["0"]);

    if (!objectName.startsWith("avatars/")) {
      throw new BadRequestException("Only public avatar files are accessible.");
    }

    const file = await this.fileStorage.get(objectName);

    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Length", file.size);
    response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    return new StreamableFile(file.stream);
  }
}
