import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { analyzePdf } from "@/lib/analyzer";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: pnpm analyze <path-to-pdf>");
  process.exit(1);
}

try {
  const bytes = new Uint8Array(await readFile(filePath));
  const report = await analyzePdf({ fileName: basename(filePath), fileType: "application/pdf", bytes });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to analyze PDF.");
  process.exit(1);
}
