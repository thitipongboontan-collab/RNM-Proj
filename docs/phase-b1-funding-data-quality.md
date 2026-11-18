# Phase B.1 funding data-quality audit

Generated: 2026-11-17T10:07:38.518Z
No funding rows were invented or updated. This report only flags missing or unusable stored fields.

## Summary

- Records: 26
- Missing or placeholder details: 1
- Missing eligibility wording in details: 16
- Missing applicant category: 19
- Missing topic lines (กลุ่มเรื่อง/แผนงานย่อย): 15
- Missing deadline pair: 0
- Attachments present but attachment text is not parsed: 20

Priority: **P0** fill empty details (especially when a PDF exists). **P1** add applicant/eligibility text. **P2** parse existing attachments or add กลุ่มเรื่อง. **P3** complete enough for matching explanations.

| Priority | ID | Details | Eligibility text | Applicant category | Topic lines | Deadlines | Attachments (unread) | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | FD007 | empty (1) | no | no | no | yes | 1 | no call description; no eligibility wording; no applicant category; no กลุ่มเรื่อง; attachment text not extracted |
| P1 | FD001 | present (3415) | no | no | yes | yes | 6 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD002 | present (2564) | no | no | yes | yes | 6 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD003 | present (2766) | no | no | yes | yes | 3 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD004 | present (3549) | no | no | yes | yes | 6 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD005 | present (2623) | no | no | yes | yes | 5 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD006 | present (3074) | no | no | yes | yes | 9 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD008 | present (1058) | no | no | no | yes | 1 | no eligibility wording; no applicant category; no กลุ่มเรื่อง; attachment text not extracted |
| P1 | FD009 | present (3552) | no | no | yes | yes | 2 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD010 | present (2381) | no | no | yes | yes | 4 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD011 | present (3019) | no | no | yes | yes | 8 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD012 | present (445) | no | no | yes | yes | 1 | no eligibility wording; no applicant category; attachment text not extracted |
| P1 | FD013 | present (580) | no | no | no | yes | 1 | no eligibility wording; no applicant category; no กลุ่มเรื่อง; attachment text not extracted |
| P1 | FD018 | present (1367) | no | no | no | yes | 8 | no eligibility wording; no applicant category; no กลุ่มเรื่อง; attachment text not extracted |
| P1 | FD020 | present (2860) | no | no | no | yes | 0 | no eligibility wording; no applicant category; no กลุ่มเรื่อง |
| P2 | FD014 | present (898) | yes | no | no | yes | 6 | no applicant category; no กลุ่มเรื่อง; attachment text not extracted |
| P2 | FD015 | present (753) | yes | no | no | yes | 6 | no applicant category; no กลุ่มเรื่อง; attachment text not extracted |
| P2 | FD016 | present (1983) | yes | yes | no | yes | 4 | no กลุ่มเรื่อง; attachment text not extracted |
| P2 | FD017 | present (3651) | yes | no | no | yes | 2 | no applicant category; no กลุ่มเรื่อง; attachment text not extracted |
| P2 | FD019 | present (1354) | yes | yes | yes | yes | 1 | attachment text not extracted |
| P2 | FD024 | present (815) | yes | no | no | yes | 0 | no applicant category; no กลุ่มเรื่อง |
| P2 | FD026 | present (1366) | yes | yes | no | yes | 2 | no กลุ่มเรื่อง; attachment text not extracted |
| P3 | FD021 | present (1425) | no | yes | no | yes | 0 | no eligibility wording; no กลุ่มเรื่อง |
| P3 | FD022 | present (965) | yes | yes | no | yes | 0 | no กลุ่มเรื่อง |
| P3 | FD023 | present (1030) | yes | yes | no | yes | 0 | no กลุ่มเรื่อง |
| P3 | FD025 | present (867) | yes | yes | no | yes | 0 | no กลุ่มเรื่อง |

## Recommended correction order

1. P0 records with attachments: copy eligibility and topic text from the already-uploaded PDF into `details`. Do not crawl.
2. P1 วช. calls that have กลุ่มเรื่อง but no applicant category: add who may apply, or explicitly mark unknown.
3. P2 fellowships/personnel funds: keep narrative details, add a structured applicant field in Phase C.
4. Do not fill missing fields with inferred research themes.
