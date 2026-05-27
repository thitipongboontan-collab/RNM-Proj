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

export function abbreviateThaiMonthsInText(text: string): string {
  let result = text;

  for (const [fullMonth, abbreviation] of Object.entries(THAI_MONTH_ABBREVIATIONS).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    result = result.replaceAll(fullMonth, abbreviation);
  }

  return result;
}
