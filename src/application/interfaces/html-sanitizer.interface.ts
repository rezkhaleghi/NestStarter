export abstract class HtmlSanitizer {
  abstract sanitize(html: string): string;
}
