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
