# Phase B.1 matching benchmark

Generated: 2026-11-17T10:07:38.509Z
Scope: live Supabase records. No researcher or funding rows were written.
The production ranker remains `computeFundingFit` in `src/lib/ai/intelligence/funding-fit.ts`.
Calibration goal: better semantic relevance and evidence, not preserving legacy rankings.

## Funding inventory

- Fundings in database: 26
- Empty or placeholder details (`-`): 1 (FD007)
- Thin details (< 80 characters): 0
- Records with กลุ่มเรื่อง lines: 9
- Records with applicant/eligibility wording: 9
- Missing source_url: 0
- Benchmark set: FD001, FD002, FD004, FD007, FD015, FD016, FD023, FD025, FD026

| ID | Organization | Details | กลุ่มเรื่อง | Eligibility text | Attachments | Title |
| --- | --- | --- | --- | --- | --- | --- |
| FD001 | สำนักงานการวิจัยแห่งชาติ | present (3415 chars) | yes | no | 6 | วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ประจำปีงบประมาณ 2570 (ด้านสังคมและความม… |
| FD002 | สำนักงานการวิจัยแห่งชาติ | present (2564 chars) | yes | no | 6 | วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ประจำปีงบประมาณ 2570 (ด้านการรองรับสังค… |
| FD004 | สำนักงานการวิจัยแห่งชาติ | present (3549 chars) | yes | no | 6 | วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ประจำปีงบประมาณ 2570 (ด้านทรัพยากรธรรมช… |
| FD007 | สำนักงานพัฒนาการวิจัยการเกษตร (องค์การมหาชน) | empty (1 chars) | no | no | 1 | สำนักงานพัฒนาการวิจัยการเกษตร (องค์การมหาชน) เปิดรับข้อเสนอแผนงานวิจัย “ด้านการ… |
| FD015 | สำนักงานบริหารงานวิจัย มช. | present (753 chars) | no | yes | 6 | ทุนพัฒนานักวิจัยรุ่นใหม่ มหาวิทยาลัยเชียงใหม่ ประจำปี 2569 |
| FD016 | Harvard Yenching Institute | present (1983 chars) | no | yes | 4 | HYI – NUS joint Doctoral Scholarship 2027 - 2028 |
| FD023 | สำนักงานการวิจัยแห่งชาติ (วช.) | present (1030 chars) | no | yes | 0 | ทุนวิจัยมหาบัณฑิต วช. ประจำปี 2570 |
| FD025 | Japan Society for the Promotion of Science (JSPS) | present (867 chars) | no | yes | 0 | JSPS Postdoctoral Fellowship (Short-term) 2027/2028 |
| FD026 | งานบริหารงานวิจัยและวิเทศสัมพันธ์ คณะสังคมศาสตร์ | present (1366 chars) | no | yes | 2 | กองทุนพัฒนาคณะสังคมศาสตร์ ประจำปีงบประมาณ 2570 |

## Researcher profiles used

- Profiles in database: 52
- Status counts: approved=5, ai_analyzed=23, insufficient_evidence=23, needs_review=1

| ID | Name | Status | Verified | Primary topics | Publications | Projects |
| --- | --- | --- | --- | --- | --- | --- |
| RS030 | อาจารย์ ดร.วรดร ไผ่เรือง | ai_analyzed | no | carbonaceous components; size fractionated; particulate matter; biomass burning | 53 | 7 |
| RS002 | ผศ.ดร.มาลี สิทธิเกรียงไกร | ai_analyzed | no | ธรรมาภิบาลน้ำข้ามพรมแดน (Transboundary Water Governance) | 0 | 8 |
| RS007 | ผศ.ดร.สิญา อุทัย | ai_analyzed | no | Food Security | 3 | 6 |
| RS010 | อาจารย์ ดร.พีรพงศ์ จำปี | approved | yes | — | 0 | 0 |
| RS011 | ผศ.ดร.มาร์โค เฮนซเกนน | ai_analyzed | no | rural india; community engagement; Global Health | 47 | 1 |

## Ranking comparison

- Researcher–funding pairs scored: 45
- Pairs whose rank changed: 37
- Researchers with the same top-1 funding: 1/5

### RS030 อาจารย์ ดร.วรดร ไผ่เรือง

Profile: `ai_analyzed`

| Old rank | New rank | Funding | Fit Score | Relevance | Basis | Evidence confidence | Eligibility | Evidence | Review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | FD004 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 100 | 52 | titles | 0.71 (unverified_profile) | unknown | An update on adverse health effects from exposure to PM2.5 (2024); Impact of transport of fine and ultrafine particles from open biomass burning on air quality during 2019 Bangkok haze episode (2020); Fine and ultrafine particle- and gas-polycyclic aromatic hydrocarbons affecting southern Thailand air quality during transboundary haze and potential health effects (2023); Size-segregated particulate mass and carbonaceous components in roadside and riverside environments (2021) | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 2 | 2 | FD016 HYI – NUS joint Doctoral Scholarship 2027… | 100 | 16 | expertise | 0.64 (unverified_profile) | likely_eligible | southeast asia; Southeast Asia | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 3 | 8 | FD025 JSPS Postdoctoral Fellowship (Short-term)… | 100 | 0 | none | 0.71 (unverified_profile) | unknown | — | Fit Score เดิมสูงจากคำทั่วไป — อย่าสลับอันดับจนกว่าจะตรวจหลักฐาน |
| 4 | 4 | FD015 ทุนพัฒนานักวิจัยรุ่นใหม่ มหาวิทยาลัยเชียง… | 43 | 14 | titles | 0.71 (unverified_profile) | unknown | Daytime-nighttime variations in the concentration of PM0.1 carbonaceous particles during a biomass fire episode in Chiang Mai, Thailand (2024); Assessment of Urban Size-Fractionated PM Down to PM0.1 Influenced by Daytime and Nighttime Open Biomass Fires in Chiang Mai, Northern Thailand (2026) | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 5 | 7 | FD023 ทุนวิจัยมหาบัณฑิต วช. ประจำปี 2570 | 43 | 0 | none | 0.71 (unverified_profile) | likely_ineligible | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 6 | 3 | FD007 สำนักงานพัฒนาการวิจัยการเกษตร (องค์การมหา… | 39 | 15 | sparse_call_title | 0.71 (unverified_profile) | insufficient_call_data | Estimation of carbon emission in the Ex-mega rice project, Indonesia based on sar satellite images (2019); แผนงานวิจัย: การพัฒนาระบบพยากรณ์และเตือนภัยจากอุทกภัย ภัยแล้ง และภัยจากอากาศร้อน ด้วยแบบจำลองการเรียนรู้ด้วยเครื่อง ในพื้นที่ลุ่มน้ำภาคเหนือ. | เติมรายละเอียด/ข้อความแนบก่อนสรุปสิทธิ์ |
| 7 | 6 | FD002 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 36 | 0 | none | 0.71 (unverified_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 8 | 5 | FD001 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 32 | 0 | none | 0.71 (unverified_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 9 | 9 | FD026 กองทุนพัฒนาคณะสังคมศาสตร์ ประจำปีงบประมาณ… | 32 | 0 | none | 0.71 (unverified_profile) | likely_eligible | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |

Old Fit Score reasons (top 3):

- FD004: หัวข้อที่ overlap: thailand, pm2, haze, free; Scholarly output สูง (53); ทุนยังเปิดรับอยู่
- FD016: หัวข้อที่ overlap: and, university, southeast, asian; Scholarly output สูง (53); ทุนยังเปิดรับอยู่
- FD025: หัวข้อที่ overlap: science, japan, the, for; Scholarly output สูง (53); ทุนยังเปิดรับอยู่

Eligibility notes:

- FD004: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD016: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี
- FD025: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD015: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD023: likely_ineligible — ประกาศระบุผู้สมัครเป็นนักศึกษาระดับมหาบัณฑิต ในขณะที่รายชื่อนี้เป็นคณาจารย์
- FD007: insufficient_call_data — ประกาศทุนไม่มีรายละเอียดคุณสมบัติที่อ่านได้ จึงยังตัดสินสิทธิ์ไม่ได้ และไม่ได้แปลว่าไม่มีสิทธิ์
- FD002: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD001: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD026: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี

### RS002 ผศ.ดร.มาลี สิทธิเกรียงไกร

Profile: `ai_analyzed`

| Old rank | New rank | Funding | Fit Score | Relevance | Basis | Evidence confidence | Eligibility | Evidence | Review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 7 | FD016 HYI – NUS joint Doctoral Scholarship 2027… | 60 | 0 | none | 0.58 (unverified_profile) | likely_eligible | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 2 | 3 | FD004 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 43 | 24 | titles | 0.58 (unverified_profile) | unknown | โครงการภูมิปัญญาท้องถิ่นชาติพันธุ์กับการจัดการไฟ(ป่า): ความมั่นคงทางอาหารและสุขภาวะสังคม; ชุมชนชาติพันธุ์กับการเสริมสร้างความมั่นคงทางอาหารและสุขภาวะสังคมในวิกฤติฝุ่นควัน PM2.5; ความมั่นคงทางอาหาร และสุขภาวะชุมชนชาติพันธุ์บนฐานเศรษฐกิจสีเขียว | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 3 | 9 | FD025 JSPS Postdoctoral Fellowship (Short-term)… | 36 | 0 | none | 0.58 (unverified_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 4 | 1 | FD001 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 21 | 42 | expertise | 0.58 (unverified_profile) | unknown | ธรรมาภิบาลน้ำข้ามพรมแดน (Transboundary Water Governance); โครงการภูมิปัญญาท้องถิ่นชาติพันธุ์กับการจัดการไฟ(ป่า): ความมั่นคงทางอาหารและสุขภาวะสังคม; ชุมชนชาติพันธุ์กับการเสริมสร้างความมั่นคงทางอาหารและสุขภาวะสังคมในวิกฤติฝุ่นควัน PM2.5; ความมั่นคงทางอาหาร และสุขภาวะชุมชนชาติพันธุ์บนฐานเศรษฐกิจสีเขียว | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 5 | 2 | FD002 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 21 | 24 | titles | 0.58 (unverified_profile) | unknown | โครงการภูมิปัญญาท้องถิ่นชาติพันธุ์กับการจัดการไฟ(ป่า): ความมั่นคงทางอาหารและสุขภาวะสังคม; ชุมชนชาติพันธุ์กับการเสริมสร้างความมั่นคงทางอาหารและสุขภาวะสังคมในวิกฤติฝุ่นควัน PM2.5; ความมั่นคงทางอาหาร และสุขภาวะชุมชนชาติพันธุ์บนฐานเศรษฐกิจสีเขียว | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 6 | 5 | FD007 สำนักงานพัฒนาการวิจัยการเกษตร (องค์การมหา… | 21 | 0 | sparse_call_title | 0.58 (unverified_profile) | insufficient_call_data | — | เติมรายละเอียด/ข้อความแนบก่อนสรุปสิทธิ์ |
| 7 | 6 | FD015 ทุนพัฒนานักวิจัยรุ่นใหม่ มหาวิทยาลัยเชียง… | 21 | 0 | none | 0.58 (unverified_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 8 | 8 | FD023 ทุนวิจัยมหาบัณฑิต วช. ประจำปี 2570 | 21 | 0 | none | 0.58 (unverified_profile) | likely_ineligible | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 9 | 4 | FD026 กองทุนพัฒนาคณะสังคมศาสตร์ ประจำปีงบประมาณ… | 21 | 24 | titles | 0.58 (unverified_profile) | likely_eligible | โครงการภูมิปัญญาท้องถิ่นชาติพันธุ์กับการจัดการไฟ(ป่า): ความมั่นคงทางอาหารและสุขภาวะสังคม; ชุมชนชาติพันธุ์กับการเสริมสร้างความมั่นคงทางอาหารและสุขภาวะสังคมในวิกฤติฝุ่นควัน PM2.5; ความมั่นคงทางอาหาร และสุขภาวะชุมชนชาติพันธุ์บนฐานเศรษฐกิจสีเขียว | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |

Old Fit Score reasons (top 3):

- FD016: หัวข้อที่ overlap: studies, university, and; ทุนยังเปิดรับอยู่
- FD004: หัวข้อที่ overlap: thailand, pm2; ทุนยังเปิดรับอยู่
- FD025: หัวข้อที่ overlap: science, the; ทุนยังเปิดรับอยู่

Eligibility notes:

- FD016: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี
- FD004: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD025: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD001: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD002: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD007: insufficient_call_data — ประกาศทุนไม่มีรายละเอียดคุณสมบัติที่อ่านได้ จึงยังตัดสินสิทธิ์ไม่ได้ และไม่ได้แปลว่าไม่มีสิทธิ์
- FD015: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD023: likely_ineligible — ประกาศระบุผู้สมัครเป็นนักศึกษาระดับมหาบัณฑิต ในขณะที่รายชื่อนี้เป็นคณาจารย์
- FD026: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี

### RS007 ผศ.ดร.สิญา อุทัย

Profile: `ai_analyzed`

| Old rank | New rank | Funding | Fit Score | Relevance | Basis | Evidence confidence | Eligibility | Evidence | Review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 6 | FD016 HYI – NUS joint Doctoral Scholarship 2027… | 84 | 18 | expertise | 0.55 (unverified_profile) | likely_eligible | Food Security | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 2 | 3 | FD004 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 41 | 49 | expertise | 0.55 (unverified_profile) | unknown | Food Security; The Role of Civil Society Networks in Promoting Organic Food as A Path to Food Security in Chiang Mai, Thailand (2022); รูปแบบเครือข่ายทางสังคมกับการขับเคลื่อนงานเกษตรอินทรีย์ เพื่อความมั่นคงทางอาหารชุมชน : ศึกษากรณีเครือข่ายภาคประชาสังคมในจังหวัดเชียงใหม่; ภาคประชาสังคมกับการใช้เครือข่ายออนไลน์ในการขับเคลื่อนงานอาหารอินทรีย์เพื่อความมั่นคงทางอาหาร | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 3 | 9 | FD025 JSPS Postdoctoral Fellowship (Short-term)… | 38 | 0 | none | 0.55 (unverified_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 4 | 7 | FD023 ทุนวิจัยมหาบัณฑิต วช. ประจำปี 2570 | 22 | 18 | expertise | 0.55 (unverified_profile) | likely_ineligible | Food Security | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 5 | 1 | FD001 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 21 | 49 | expertise | 0.55 (unverified_profile) | unknown | Food Security; The Role of Civil Society Networks in Promoting Organic Food as A Path to Food Security in Chiang Mai, Thailand (2022); รูปแบบเครือข่ายทางสังคมกับการขับเคลื่อนงานเกษตรอินทรีย์ เพื่อความมั่นคงทางอาหารชุมชน : ศึกษากรณีเครือข่ายภาคประชาสังคมในจังหวัดเชียงใหม่; ภาคประชาสังคมกับการใช้เครือข่ายออนไลน์ในการขับเคลื่อนงานอาหารอินทรีย์เพื่อความมั่นคงทางอาหาร | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 6 | 2 | FD002 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 21 | 49 | expertise | 0.55 (unverified_profile) | unknown | Food Security; The Role of Civil Society Networks in Promoting Organic Food as A Path to Food Security in Chiang Mai, Thailand (2022); รูปแบบเครือข่ายทางสังคมกับการขับเคลื่อนงานเกษตรอินทรีย์ เพื่อความมั่นคงทางอาหารชุมชน : ศึกษากรณีเครือข่ายภาคประชาสังคมในจังหวัดเชียงใหม่; ภาคประชาสังคมกับการใช้เครือข่ายออนไลน์ในการขับเคลื่อนงานอาหารอินทรีย์เพื่อความมั่นคงทางอาหาร | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 7 | 5 | FD007 สำนักงานพัฒนาการวิจัยการเกษตร (องค์การมหา… | 21 | 24 | sparse_call_title | 0.55 (unverified_profile) | insufficient_call_data | รูปแบบเครือข่ายทางสังคมกับการขับเคลื่อนงานเกษตรอินทรีย์ เพื่อความมั่นคงทางอาหารชุมชน : ศึกษากรณีเครือข่ายภาคประชาสังคมในจังหวัดเชียงใหม่; นวัตกรรมทางสังคมในการสร้างผลิตภัณฑ์ชุมชนผ่านกระบวนการ upcycling จากเศรษฐกิจหมุนเวียนของกลุ่มเกษตรกรสูงวัยในภาคเหนือ; นวัตกรรมทางสังคมเพื่อการสร้างผลิตภัณฑ์ชุมชนผ่านกระบวนการคิดเชิงออกแบบบนฐานเศรษฐกิจหมุนเวียน: กรณี กลุ่มเกษตรกร ต.ป่าสัก จ.ลำพูน | เติมรายละเอียด/ข้อความแนบก่อนสรุปสิทธิ์ |
| 8 | 8 | FD015 ทุนพัฒนานักวิจัยรุ่นใหม่ มหาวิทยาลัยเชียง… | 21 | 15 | titles | 0.55 (unverified_profile) | unknown | The Role of Civil Society Networks in Promoting Organic Food as A Path to Food Security in Chiang Mai, Thailand (2022); รูปแบบเครือข่ายทางสังคมกับการขับเคลื่อนงานเกษตรอินทรีย์ เพื่อความมั่นคงทางอาหารชุมชน : ศึกษากรณีเครือข่ายภาคประชาสังคมในจังหวัดเชียงใหม่ | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 9 | 4 | FD026 กองทุนพัฒนาคณะสังคมศาสตร์ ประจำปีงบประมาณ… | 21 | 49 | expertise | 0.55 (unverified_profile) | likely_eligible | Food Security; The Role of Civil Society Networks in Promoting Organic Food as A Path to Food Security in Chiang Mai, Thailand (2022); รูปแบบเครือข่ายทางสังคมกับการขับเคลื่อนงานเกษตรอินทรีย์ เพื่อความมั่นคงทางอาหารชุมชน : ศึกษากรณีเครือข่ายภาคประชาสังคมในจังหวัดเชียงใหม่; ภาคประชาสังคมกับการใช้เครือข่ายออนไลน์ในการขับเคลื่อนงานอาหารอินทรีย์เพื่อความมั่นคงทางอาหาร | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |

Old Fit Score reasons (top 3):

- FD016: หัวข้อที่ overlap: and, university, international, southeast; ทุนยังเปิดรับอยู่
- FD004: หัวข้อที่ overlap: thailand; ทุนยังเปิดรับอยู่
- FD025: หัวข้อที่ overlap: the, society; ทุนยังเปิดรับอยู่

Eligibility notes:

- FD016: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี
- FD004: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD025: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD023: likely_ineligible — ประกาศระบุผู้สมัครเป็นนักศึกษาระดับมหาบัณฑิต ในขณะที่รายชื่อนี้เป็นคณาจารย์
- FD001: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD002: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD007: insufficient_call_data — ประกาศทุนไม่มีรายละเอียดคุณสมบัติที่อ่านได้ จึงยังตัดสินสิทธิ์ไม่ได้ และไม่ได้แปลว่าไม่มีสิทธิ์
- FD015: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD026: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี

### RS010 อาจารย์ ดร.พีรพงศ์ จำปี

Profile: `approved`, verified/admin-locked

| Old rank | New rank | Funding | Fit Score | Relevance | Basis | Evidence confidence | Eligibility | Evidence | Review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 6 | FD016 HYI – NUS joint Doctoral Scholarship 2027… | 72 | 0 | none | 0.2 (approved_profile) | likely_eligible | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 2 | 7 | FD023 ทุนวิจัยมหาบัณฑิต วช. ประจำปี 2570 | 25 | 0 | none | 0.2 (approved_profile) | likely_ineligible | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 3 | 8 | FD025 JSPS Postdoctoral Fellowship (Short-term)… | 25 | 0 | none | 0.2 (approved_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 4 | 1 | FD001 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 22 | 0 | none | 0.2 (approved_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 5 | 2 | FD002 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 22 | 0 | none | 0.2 (approved_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 6 | 3 | FD004 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 22 | 0 | none | 0.2 (approved_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 7 | 4 | FD007 สำนักงานพัฒนาการวิจัยการเกษตร (องค์การมหา… | 22 | 0 | sparse_call_title | 0.2 (approved_profile) | insufficient_call_data | — | เติมรายละเอียด/ข้อความแนบก่อนสรุปสิทธิ์ |
| 8 | 5 | FD015 ทุนพัฒนานักวิจัยรุ่นใหม่ มหาวิทยาลัยเชียง… | 22 | 0 | none | 0.2 (approved_profile) | unknown | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 9 | 9 | FD026 กองทุนพัฒนาคณะสังคมศาสตร์ ประจำปีงบประมาณ… | 22 | 0 | none | 0.2 (approved_profile) | likely_eligible | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |

Old Fit Score reasons (top 3):

- FD016: หัวข้อที่ overlap: studies, asian, university; ทุนยังเปิดรับอยู่
- FD023: ทุนยังเปิดรับอยู่
- FD025: ทุนยังเปิดรับอยู่

Eligibility notes:

- FD016: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี
- FD023: likely_ineligible — ประกาศระบุผู้สมัครเป็นนักศึกษาระดับมหาบัณฑิต ในขณะที่รายชื่อนี้เป็นคณาจารย์
- FD025: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD001: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD002: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD004: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD007: insufficient_call_data — ประกาศทุนไม่มีรายละเอียดคุณสมบัติที่อ่านได้ จึงยังตัดสินสิทธิ์ไม่ได้ และไม่ได้แปลว่าไม่มีสิทธิ์
- FD015: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD026: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี

### RS011 ผศ.ดร.มาร์โค เฮนซเกนน

Profile: `ai_analyzed`

| Old rank | New rank | Funding | Fit Score | Relevance | Basis | Evidence confidence | Eligibility | Evidence | Review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 3 | FD004 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 100 | 28 | titles | 0.71 (unverified_profile) | unknown | The Social Implications of Technology Diffusion: Uncovering the Unintended Consequences of People's Health-Related Mobile Phone Use in Rural India and China (2017); The social role of C-reactive protein point-of-care testing to guide antibiotic prescription in Northern Thailand (2018); You've got a friend in me: How social networks and mobile phones facilitate healthcare access among marginalised groups in rural Thailand and Lao PDR (2021); It is time to give social research a voice to tackle antimicrobial resistance? (2018) | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 2 | 8 | FD015 ทุนพัฒนานักวิจัยรุ่นใหม่ มหาวิทยาลัยเชียง… | 100 | 0 | none | 0.71 (unverified_profile) | unknown | — | Fit Score เดิมสูงจากคำทั่วไป — อย่าสลับอันดับจนกว่าจะตรวจหลักฐาน |
| 3 | 7 | FD016 HYI – NUS joint Doctoral Scholarship 2027… | 100 | 6 | expertise | 0.71 (unverified_profile) | likely_eligible | Southeast Asia | Fit Score เดิมสูงจากคำทั่วไป — อย่าสลับอันดับจนกว่าจะตรวจหลักฐาน |
| 4 | 6 | FD025 JSPS Postdoctoral Fellowship (Short-term)… | 100 | 7 | titles | 0.71 (unverified_profile) | unknown | Community engagement for stakeholder and community trust in healthcare: Short-term evaluation findings from a nationwide initiative in Lao PDR (2024) | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 5 | 5 | FD007 สำนักงานพัฒนาการวิจัยการเกษตร (องค์การมหา… | 73 | 14 | sparse_call_title | 0.71 (unverified_profile) | insufficient_call_data | Large expert-curated database for benchmarking document similarity detection in biomedical literature search (2019); Aligning global health policy and research with sustainable development: A strategic market approach (2024) | เติมรายละเอียด/ข้อความแนบก่อนสรุปสิทธิ์ |
| 6 | 9 | FD023 ทุนวิจัยมหาบัณฑิต วช. ประจำปี 2570 | 42 | 0 | none | 0.71 (unverified_profile) | likely_ineligible | — | ใช้เป็นคำอธิบายประกอบ Fit Score ได้ |
| 7 | 1 | FD001 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 33 | 28 | titles | 0.71 (unverified_profile) | unknown | The Social Implications of Technology Diffusion: Uncovering the Unintended Consequences of People's Health-Related Mobile Phone Use in Rural India and China (2017); The social role of C-reactive protein point-of-care testing to guide antibiotic prescription in Northern Thailand (2018); You've got a friend in me: How social networks and mobile phones facilitate healthcare access among marginalised groups in rural Thailand and Lao PDR (2021); It is time to give social research a voice to tackle antimicrobial resistance? (2018) | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 8 | 2 | FD002 วช. ประกาศรับข้อเสนอการวิจัยและนวัตกรรม ป… | 33 | 28 | titles | 0.71 (unverified_profile) | unknown | The Social Implications of Technology Diffusion: Uncovering the Unintended Consequences of People's Health-Related Mobile Phone Use in Rural India and China (2017); The social role of C-reactive protein point-of-care testing to guide antibiotic prescription in Northern Thailand (2018); You've got a friend in me: How social networks and mobile phones facilitate healthcare access among marginalised groups in rural Thailand and Lao PDR (2021); It is time to give social research a voice to tackle antimicrobial resistance? (2018) | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |
| 9 | 4 | FD026 กองทุนพัฒนาคณะสังคมศาสตร์ ประจำปีงบประมาณ… | 29 | 28 | titles | 0.71 (unverified_profile) | likely_eligible | The Social Implications of Technology Diffusion: Uncovering the Unintended Consequences of People's Health-Related Mobile Phone Use in Rural India and China (2017); The social role of C-reactive protein point-of-care testing to guide antibiotic prescription in Northern Thailand (2018); You've got a friend in me: How social networks and mobile phones facilitate healthcare access among marginalised groups in rural Thailand and Lao PDR (2021); It is time to give social research a voice to tackle antimicrobial resistance? (2018) | ผลมาจากชื่อผลงาน ไม่ใช่ความเชี่ยวชาญที่ตรวจแล้ว |

Old Fit Score reasons (top 3):

- FD004: หัวข้อที่ overlap: thailand; Scholarly output สูง (47); ทุนยังเปิดรับอยู่
- FD015: หัวข้อที่ overlap: research, impact, outputs, document; Scholarly output สูง (47); ทุนยังเปิดรับอยู่
- FD016: หัวข้อที่ overlap: research, information, studies, university; Scholarly output สูง (47); ทุนยังเปิดรับอยู่

Eligibility notes:

- FD004: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD015: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD016: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี
- FD025: unknown — มีข้อความคุณสมบัติในประกาศ แต่ข้อมูลนักวิจัยที่มีอยู่ยังไม่พอสำหรับสรุปสิทธิ์ จึงยังไม่ถือว่าไม่มีสิทธิ์
- FD007: insufficient_call_data — ประกาศทุนไม่มีรายละเอียดคุณสมบัติที่อ่านได้ จึงยังตัดสินสิทธิ์ไม่ได้ และไม่ได้แปลว่าไม่มีสิทธิ์
- FD023: likely_ineligible — ประกาศระบุผู้สมัครเป็นนักศึกษาระดับมหาบัณฑิต ในขณะที่รายชื่อนี้เป็นคณาจารย์
- FD001: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD002: unknown — ประกาศระบุขั้นตอนการสมัครหรือกรอบงาน แต่ไม่มีคุณสมบัติผู้สมัครที่ตรวจสอบจากข้อมูลนักวิจัยได้ จึงยังไม่สรุปสิทธิ์
- FD026: likely_eligible — ประกาศรับคณาจารย์ และนักวิจัยนี้อยู่ในคณะสังคมศาสตร์ตามข้อมูลที่มี

## Insufficient-evidence fallback

The core five researchers are unchanged. These extra rows confirm that `insufficient_evidence` profiles are still scored from titles/projects and are not excluded: RS013, RS028.

### RS013 อาจารย์ ดร.มายา คอฟสกายา

Status: `insufficient_evidence`. Publications: 3. Projects: 0.

| Funding | Fit Score | Relevance | Basis | Confidence | Eligibility | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| FD001 | 24 | 0 | none | 0.05 (insufficient_profile) | unknown | — |
| FD002 | 21 | 0 | none | 0.05 (insufficient_profile) | unknown | — |
| FD004 | 32 | 0 | none | 0.05 (insufficient_profile) | unknown | — |
| FD007 | 21 | 0 | sparse_call_title | 0.05 (insufficient_profile) | insufficient_call_data | — |
| FD015 | 21 | 0 | none | 0.05 (insufficient_profile) | unknown | — |

### RS028 อาจารย์ ดร.ชาคริน เพชรานนท์

Status: `insufficient_evidence`. Publications: 2. Projects: 6.

| Funding | Fit Score | Relevance | Basis | Confidence | Eligibility | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| FD004 | 71 | 24 | titles | 0.37 (titles_only) | unknown | กลุ่มวิจัยเพื่อการจัดการสิ่งแวดล้อมและภัยพิบัติเมือง ประจำปี 2566; การประเมินผลลัพธ์และผลกระทบของแผนงานที่มีงบประมาณน้อยกว่า 100 ล้านบาท ของมหาวิทยาลัยแม่โจ้ ที่ได้รับการจัดสรรกองทุนส่งเสริม ววน. ประจำปีงบประมาณ พ.ศ.2563-2565; การประเมินผลลัพธ์และผลกระทบของหน่วยรับงบประมาณ Fundamental Fund ประจำปีงบประมาณ พ.ศ. 2569 |
| FD007 | 49 | 24 | sparse_call_title | 0.37 (titles_only) | insufficient_call_data | การประเมินผลลัพธ์และผลกระทบของแผนงานที่มีงบประมาณน้อยกว่า 100 ล้านบาท ของมหาวิทยาลัยแม่โจ้ ที่ได้รับการจัดสรรกองทุนส่งเสริม ววน. ประจำปีงบประมาณ พ.ศ.2563-2565; การประเมินผลลัพธ์และผลกระทบของแผนงานที่มีงบประมาณน้อยกว่า 100 ล้านบาท ของมหาวิทยาลัยแม่โจ้ ที่ได้รับทุนจัดสรรผ่านกองทุนส่งเสริม ววน.; การประเมินผลลัพธ์และผลกระทบของหน่วยรับงบประมาณ Fundamental Fund ประจำปีงบประมาณ พ.ศ. 2569 |
| FD001 | 47 | 16 | titles | 0.29 (titles_only) | unknown | การประเมินผลลัพธ์และผลกระทบของแผนงานที่มีงบประมาณน้อยกว่า 100 ล้านบาท ของมหาวิทยาลัยแม่โจ้ ที่ได้รับการจัดสรรกองทุนส่งเสริม ววน. ประจำปีงบประมาณ พ.ศ.2563-2565; การประเมินผลลัพธ์และผลกระทบของหน่วยรับงบประมาณ Fundamental Fund ประจำปีงบประมาณ พ.ศ. 2569 |
| FD002 | 47 | 16 | titles | 0.29 (titles_only) | unknown | การประเมินผลลัพธ์และผลกระทบของแผนงานที่มีงบประมาณน้อยกว่า 100 ล้านบาท ของมหาวิทยาลัยแม่โจ้ ที่ได้รับการจัดสรรกองทุนส่งเสริม ววน. ประจำปีงบประมาณ พ.ศ.2563-2565; การประเมินผลลัพธ์และผลกระทบของหน่วยรับงบประมาณ Fundamental Fund ประจำปีงบประมาณ พ.ศ. 2569 |
| FD026 | 49 | 16 | titles | 0.29 (titles_only) | likely_eligible | การประเมินผลลัพธ์และผลกระทบของแผนงานที่มีงบประมาณน้อยกว่า 100 ล้านบาท ของมหาวิทยาลัยแม่โจ้ ที่ได้รับการจัดสรรกองทุนส่งเสริม ววน. ประจำปีงบประมาณ พ.ศ.2563-2565; การประเมินผลลัพธ์และผลกระทบของหน่วยรับงบประมาณ Fundamental Fund ประจำปีงบประมาณ พ.ศ. 2569 |

## Differences

- Fit Score still uses a +20 baseline and scholarly-output boost, so generic overlap can rank first.
- Phase B.1 Relevance requires distinctive tokens; `research`, `science`, `development`, `Thailand`, and host-city geography no longer count by themselves.
- Evidence Confidence stays separate. Title-only matches are labelled `titles_only`.
- Eligibility quotes call text and researcher facts. Missing data is `unknown` or `insufficient_call_data`, never ineligible. Mixed student/faculty wording is `needs_review`.
- Approved/admin-locked profiles still read `display_profile` only.

## Recommendation

- Keep `computeFundingFit` as the Smart Match ranking until this B.1 table is reviewed.
- Prefer Phase B Relevance and evidence when Fit Score is high but basis is `none` or evidence is generic.
- Fill P0/P1 funding records in `docs/phase-b1-funding-data-quality.md` before Phase C ranking changes.
