import { describe, expect, it } from "@jest/globals";

import { HtmlSanitizerService } from "./html-sanitizer.service";

describe("HtmlSanitizerService", () => {
  const sanitizer = new HtmlSanitizerService();

  it("preserves supported formatting", () => {
    const result = sanitizer.sanitize(
      "<h1>About</h1><p>Hello <strong>there</strong>.</p>",
    );

    expect(result).toContain("<h1>About</h1>");
    expect(result).toContain("<strong>there</strong>");
  });

  it("removes scripts and their contents", () => {
    const result = sanitizer.sanitize(
      "<p>Safe</p><script>alert('xss')</script>",
    );

    expect(result).toContain("<p>Safe</p>");
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert(");
  });

  it("removes event handlers", () => {
    const result = sanitizer.sanitize('<p onclick="alert(1)">Hello</p>');

    expect(result).not.toContain("onclick");
    expect(result).not.toContain("alert");
    expect(result).toContain("Hello");
  });

  it("removes javascript URLs", () => {
    const result = sanitizer.sanitize(
      '<a href="javascript:alert(1)">Click</a>',
    );

    expect(result).not.toContain("javascript:");
    expect(result).not.toContain("href=");
    expect(result).toContain("Click");
  });

  it("removes unsupported tags and attributes", () => {
    const result = sanitizer.sanitize(
      '<iframe src="https://evil.example"></iframe><p style="color:red">Text</p>',
    );

    expect(result).not.toContain("<iframe");
    expect(result).not.toContain("style=");
    expect(result).toContain("Text");
  });

  it("allows ordinary HTTPS links", () => {
    const result = sanitizer.sanitize(
      '<a href="https://example.com" title="Example">Example</a>',
    );

    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('title="Example"');
  });
});
