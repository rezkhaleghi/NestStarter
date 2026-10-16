import { Injectable } from "@nestjs/common";
import sanitizeHtml = require("sanitize-html");
import { HtmlSanitizer } from "@application/interfaces/html-sanitizer.interface";

/**
 * CMS content is intentionally restricted to presentation-focused HTML.
 * Scripts, styles, forms, embedded content, event handlers, and unsafe URL
 * protocols are not part of the supported content format.
 */
@Injectable()
export class HtmlSanitizerService extends HtmlSanitizer {
  sanitize(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "br",
        "hr",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "blockquote",
        "ul",
        "ol",
        "li",
        "a",
        "pre",
        "code",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
      ],
      allowedAttributes: {
        a: ["href", "title"],
        th: ["colspan", "rowspan"],
        td: ["colspan", "rowspan"],
      },
      allowedSchemes: ["http", "https", "mailto"],
      allowedSchemesByTag: {
        a: ["http", "https", "mailto"],
      },
      allowProtocolRelative: false,
      disallowedTagsMode: "discard",
      enforceHtmlBoundary: true,
    });
  }
}
