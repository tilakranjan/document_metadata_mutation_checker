// @vitest-environment node

import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { POST } from "./route";

describe("POST /api/analyze", () => {
  it("rejects non-PDF uploads", async () => {
    const form = new FormData();
    form.append("file", new File(["hello"], "hello.txt", { type: "text/plain" }));
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
    expect(response.status).toBe(415);
  });

  it("returns report JSON for PDF uploads", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 300]);
    const bytes = await doc.save();
    const form = new FormData();
    form.append("file", new File([bytes], "sample.pdf", { type: "application/pdf" }));

    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.document_name).toBe("sample.pdf");
    expect(payload.file_type).toBe("application/pdf");
  });
});
