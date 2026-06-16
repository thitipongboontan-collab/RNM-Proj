import { RESEARCHER_DEPARTMENTS } from "@/data/researcher-departments";

type ResearcherDepartmentFieldProps = {
  defaultDepartment?: string;
};

export function ResearcherDepartmentField({
  defaultDepartment = "",
}: ResearcherDepartmentFieldProps) {
  const isPreset = (RESEARCHER_DEPARTMENTS as readonly string[]).includes(defaultDepartment);
  const selected = isPreset ? defaultDepartment : "";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-brand-dark">สังกัด/ภาควิชา</span>
      <select
        name="department"
        defaultValue={selected}
        required
        className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
      >
        <option value="">-- เลือกภาควิชา --</option>
        {RESEARCHER_DEPARTMENTS.map((department) => (
          <option key={department} value={department}>
            {department}
          </option>
        ))}
        {defaultDepartment && !isPreset ? (
          <option value={defaultDepartment}>{defaultDepartment} (ข้อมูลเดิม)</option>
        ) : null}
      </select>
      {defaultDepartment && !isPreset ? (
        <p className="mt-2 text-xs text-[#B45309]">
          สังกัดเดิมไม่อยู่ในรายการมาตรฐาน กรุณาเลือกภาควิชาใหม่ก่อนบันทึก
        </p>
      ) : null}
    </label>
  );
}
