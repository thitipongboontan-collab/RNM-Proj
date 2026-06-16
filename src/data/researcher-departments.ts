export const RESEARCHER_DEPARTMENTS = [
  "ภาควิชาภูมิศาสตร์",
  "ภาควิชาสตรีศึกษา",
  "ภาควิชาสังคมวิทยาและมานุษยวิทยา",
  "ภาควิชาสังคมศาสตร์กับการพัฒนา",
] as const;

export type ResearcherDepartment = (typeof RESEARCHER_DEPARTMENTS)[number];

export function isResearcherDepartment(value: string): value is ResearcherDepartment {
  return (RESEARCHER_DEPARTMENTS as readonly string[]).includes(value);
}
