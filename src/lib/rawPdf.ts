const decoder = new TextDecoder("latin1");

export interface RawPdfInspection {
  pdfVersion: string | null;
  eofMarkerCount: number;
  startxrefCount: number;
  hasXmpMetadata: boolean;
  xmpMetadata: Partial<Record<"created_date" | "modified_date" | "creator" | "producer" | "title", string>>;
}

export function inspectRawPdf(bytes: Uint8Array): RawPdfInspection {
  const text = decoder.decode(bytes);
  const pdfVersion = /^%PDF-(\d+\.\d+)/.exec(text)?.[1] ?? null;
  const eofMarkerCount = countMatches(text, /%%EOF/g);
  const startxrefCount = countMatches(text, /startxref/g);
  const xmpBlocks = [...text.matchAll(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/gi)].map((match) => match[0]);
  const xmpText = xmpBlocks.join("\n");

  return {
    pdfVersion,
    eofMarkerCount,
    startxrefCount,
    hasXmpMetadata: xmpBlocks.length > 0,
    xmpMetadata: extractXmpFields(xmpText)
  };
}

function countMatches(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].length;
}

function extractXmpFields(xmpText: string) {
  if (!xmpText) return {};
  return {
    created_date: firstMatch(xmpText, /<xmp:CreateDate>(.*?)<\/xmp:CreateDate>/i),
    modified_date: firstMatch(xmpText, /<xmp:ModifyDate>(.*?)<\/xmp:ModifyDate>/i),
    creator: firstMatch(xmpText, /<xmp:CreatorTool>(.*?)<\/xmp:CreatorTool>/i),
    producer: firstMatch(xmpText, /<pdf:Producer>(.*?)<\/pdf:Producer>/i),
    title: firstMatch(xmpText, /<dc:title>[\s\S]*?<rdf:li[^>]*>(.*?)<\/rdf:li>/i)
  };
}

function firstMatch(text: string, pattern: RegExp) {
  return pattern.exec(text)?.[1]?.trim();
}
