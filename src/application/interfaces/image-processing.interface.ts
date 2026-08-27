export abstract class ImageProcessing {
  abstract processAvatar(buffer: Buffer): Promise<Buffer>;
}
