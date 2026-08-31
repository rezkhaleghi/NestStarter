import { Controller, Get, Req, Res, StreamableFile } from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { FileStorage } from "../../application/interfaces/file-storage.interface";

@ApiTags("Files")
@Controller("files")
export class FilesController {
  constructor(private readonly fileStorage: FileStorage) {}

  @Get("/*")
  @ApiOperation({
    summary: "Get a public file",
    description:
      "Streams a publicly accessible file from the configured file storage.",
  })
  @ApiParam({
    name: "path",
    description: "Storage object path",
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
    description: "The requested file.",
  })
  @ApiResponse({
    status: 404,
    description: "File not found.",
  })
  async getFile(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const objectName = request.path.replace(/^\/files\//, "");

    console.log("request.path:", request.path);
    console.log("objectName:", objectName);

    const file = await this.fileStorage.get(objectName);

    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Length", file.size);

    return new StreamableFile(file.stream);
  }
}
