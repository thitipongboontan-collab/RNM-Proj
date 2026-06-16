const THAI_MONTH_ABBREVIATIONS: Record<string, string> = {
  มกราคม: "ม.ค.",
  กุมภาพันธ์: "ก.พ.",
  มีนาคม: "มี.ค.",
  เมษายน: "เม.ย.",
  พฤษภาคม: "พ.ค.",
  มิถุนายน: "มิ.ย.",
  กรกฎาคม: "ก.ค.",
  สิงหาคม: "ส.ค.",
  กันยายน: "ก.ย.",
  ตุลาคม: "ต.ค.",
  พฤศจิกายน: "พ.ย.",
  ธันวาคม: "ธ.ค.",
};

const THAI_MONTHS = Object.keys(THAI_MONTH_ABBREVIATIONS);

const THAI_MONTH_FROM_ABBR = Object.fromEntries(
  Object.entries(THAI_MONTH_ABBREVIATIONS).map(([full, abbr]) => [abbr, full]),
);

export function abbreviateThaiMonthsInText(text: string): string {
  let result = text;

  for (const [fullMonth, abbreviation] of Object.entries(THAI_MONTH_ABBREVIATIONS).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    result = result.replaceAll(fullMonth, abbreviation);
  }

  return result;
}

function resolveThaiMonth(token: string): number {
  const full = THAI_MONTH_FROM_ABBR[token] ?? token;
  return THAI_MONTHS.indexOf(full);
}

function stripFundingDatePrefix(value: string): string {
  return value
    .replace(/^เปิดรับวันที่\s*/i, "")
    .replace(/^เปิดรับ\s*/i, "")
    .replace(/^ปิดรับวันที่\s*/i, "")
    .replace(/^ปิดรับ\s*/i, "")
    .trim();
}

/** Parse Thai funding date text (e.g. "14 พ.ค. 2569") to ISO yyyy-mm-dd for date inputs. */
export function parseThaiFundingDateToIso(value: string): string {
  const cleaned = stripFundingDatePrefix(value);
  if (!cleaned) return "";

  const match = cleaned.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (!match) return "";

  const day = Number.parseInt(match[1], 10);
  const monthIndex = resolveThaiMonth(match[2]);
  const buddhistYear = Number.parseInt(match[3], 10);
  if (!day || monthIndex < 0 || !buddhistYear) return "";

  const year = buddhistYear - 543;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Format ISO yyyy-mm-dd to Thai funding date text with full month name. */
export function formatIsoToThaiFundingDate(iso: string): string {
  if (!iso) return "";

  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";

  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  if (!year || monthIndex < 0 || monthIndex > 11 || !day) return "";

  return `${day} ${THAI_MONTHS[monthIndex]} ${year + 543}`;
}

/** Format ISO yyyy-mm-dd to Thai date with abbreviated month (e.g. "15 มิ.ย. 2569"). */
export function formatIsoToThaiAbbreviatedDate(iso: string): string {
  const full = formatIsoToThaiFundingDate(iso);
  if (!full) return "";
  return abbreviateThaiMonthsInText(full);
}

/** Parse stored Thai event date text into ISO start/end values for date inputs. */
export function parseThaiEventDateText(value: string): { startIso: string; endIso?: string } {
  const text = value.trim();
  if (!text) return { startIso: "" };

  const sameMonthRange = text.match(/^(\d{1,2})[–-](\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (sameMonthRange) {
    const [, startDay, endDay, month, year] = sameMonthRange;
    const startIso = parseThaiFundingDateToIso(`${startDay} ${month} ${year}`);
    const endIso = parseThaiFundingDateToIso(`${endDay} ${month} ${year}`);
    return { startIso, endIso: endIso || undefined };
  }

  const crossRange = text.match(/^(\d{1,2}\s+\S+\s+\d{4})\s*[–-]\s*(\d{1,2}\s+\S+\s+\d{4})$/);
  if (crossRange) {
    return {
      startIso: parseThaiFundingDateToIso(crossRange[1]),
      endIso: parseThaiFundingDateToIso(crossRange[2]),
    };
  }

  return { startIso: parseThaiFundingDateToIso(text) };
}

/** Format one or two ISO dates as Thai event date text with abbreviated months. */
export function formatThaiEventDateRange(startIso: string, endIso?: string): string {
  if (!startIso) return "";

  const start = formatIsoToThaiAbbreviatedDate(startIso);
  if (!endIso || endIso === startIso) return start;

  const end = formatIsoToThaiAbbreviatedDate(endIso);
  const startParts = start.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  const endParts = end.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (!startParts || !endParts) return `${start} – ${end}`;

  const [, startDay, startMonth, startYear] = startParts;
  const [, endDay, endMonth, endYear] = endParts;

  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay}–${endDay} ${startMonth} ${startYear}`;
  }

  if (startYear === endYear) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
  }

  return `${start} – ${end}`;
}

/** Ensure Thai event date text uses abbreviated month names for display. */
export function normalizeThaiEventDateForDisplay(value: string): string {
  if (!value) return "";
  return abbreviateThaiMonthsInText(value.trim());
}
