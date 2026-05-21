import { NextResponse } from "next/server";
import { analyzePdf } from "@/lib/analyzer";

export const runtime = "nodejs";

interface UploadedFile {
  name: string;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!isUploadedFile(file)) {
    return NextResponse.json({ error: "Upload a PDF file using the 'file' field." }, { status: 400 });
  }

  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported in this version." }, { status: 415 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const report = await analyzePdf({ fileName: file.name, fileType: file.type || "application/pdf", bytes });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyze the uploaded file." },
      { status: 422 }
    );
  }
}

function isUploadedFile(value: unknown): value is UploadedFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string" &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function"
  );
}
