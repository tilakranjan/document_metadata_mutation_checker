export interface ParsedPdfDate {
  raw: string;
  date: Date | null;
  isValid: boolean;
  isUnusualFormat: boolean;
}

const standardPdfDatePattern = /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([Zz]|[+-]\d{2}'?\d{2}'?)?$/;

export function parsePdfDate(value: unknown): ParsedPdfDate | null {
  if (!value) return null;
  if (value instanceof Date) {
    return {
      raw: value.toISOString(),
      date: Number.isNaN(value.getTime()) ? null : value,
      isValid: !Number.isNaN(value.getTime()),
      isUnusualFormat: false
    };
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const pdfMatch = standardPdfDatePattern.exec(raw);
  if (pdfMatch) {
    const [, year, month = "01", day = "01", hour = "00", minute = "00", second = "00", tz] = pdfMatch;
    const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
    if (!isDatePartsValid(utcDate, year, month, day, hour, minute, second)) {
      return { raw, date: null, isValid: false, isUnusualFormat: false };
    }

    if (!tz || tz.toUpperCase() === "Z") {
      return { raw, date: utcDate, isValid: true, isUnusualFormat: false };
    }

    const sign = tz.startsWith("-") ? -1 : 1;
    const digits = tz.slice(1).replace(/'/g, "");
    const offsetMinutes = sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4)));
    return {
      raw,
      date: new Date(utcDate.getTime() - offsetMinutes * 60_000),
      isValid: true,
      isUnusualFormat: false
    };
  }

  const fallback = new Date(raw);
  const isIsoDate = /^\d{4}-\d{2}-\d{2}T/.test(raw);
  return {
    raw,
    date: Number.isNaN(fallback.getTime()) ? null : fallback,
    isValid: !Number.isNaN(fallback.getTime()),
    isUnusualFormat: !isIsoDate
  };
}

function isDatePartsValid(date: Date, year: string, month: string, day: string, hour: string, minute: string, second: string) {
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day) &&
    date.getUTCHours() === Number(hour) &&
    date.getUTCMinutes() === Number(minute) &&
    date.getUTCSeconds() === Number(second)
  );
}

export function toReportDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}
