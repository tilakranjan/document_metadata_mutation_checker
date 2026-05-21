# Document Metadata Mutation Checker

A small PDF-focused metadata analysis tool for the technical assessment. It accepts a PDF, extracts available metadata, runs rule-based checks for possible metadata mutation indicators, and returns a careful risk report.

The report language is intentionally cautious. Metadata signals can suggest editing, export, conversion, or structural history, but they do not prove document authenticity or misconduct.

## Tech Stack

- Next.js, React, TypeScript
- `pdf-lib` for PDF parsing and document info extraction
- Raw byte inspection for PDF version, EOF/startxref markers, and basic XMP detection
- Vitest for unit and API tests

## Setup

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`, upload a PDF, and review the generated report.

## CLI Usage

```bash
pnpm analyze /path/to/document.pdf
```

## Tests

```bash
pnpm test
```

## Metadata Fields Extracted

- File name, file size, file type
- PDF version
- Created date and modified date
- Author, creator, producer, title, subject
- Page count
- Encryption status where available
- EOF marker count, `startxref` count, XMP metadata presence

## Rules Implemented

- Missing created and modified dates
- Modified date present while created date is missing
- Modified date before created date
- Modified date more than 7 days after created date
- Invalid or unusual date formats
- Creator and producer mismatch
- Common editing/export tool signals such as Preview, Acrobat, Photoshop, Illustrator, Canva, online PDF editors, and scanner software
- Missing author metadata as a weak signal
- Incremental update indicators from repeated EOF/startxref markers
- Basic XMP/document-info mismatch detection when both values are available

## Scoring Logic

Findings are weighted by severity and confidence:

- Low: `10`
- Medium: `30`
- High: `55`

Each contribution is `severity weight * confidence`. Related findings add a small category boost. Reports made only of weak/common signals are capped at Medium so normal editing/export behavior does not become High risk by itself.

Risk levels:

- `0-30`: Low
- `31-65`: Medium
- `66-100`: High

## Limitations

- PDF is the only supported file type in this version.
- XMP parsing is intentionally lightweight and pattern-based.
- Encrypted or malformed PDFs may expose limited metadata.
- Metadata alone is not forensic proof. Findings should be reviewed with file provenance, source records, and business context.

## Improvements With More Time

- Deeper XMP packet parsing and namespace support
- JPG/PNG EXIF metadata support
- DOCX core properties support
- PDF-style summary report export
- Two-file metadata comparison
- More detailed incremental update inspection
