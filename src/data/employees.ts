// SAMPLE employees — all names are fictional placeholders.
// role decides which menu/screens a user sees:
//   EMPLOYEE   – files leave, views own credits and status
//   DEPT_HEAD  – recommends applications of their office (can also file)
//   HRMO       – system admin; certifies leave credits, manages accounts, reports
//   APPROVER   – approving authority (Municipal Mayor); final action
//
// openingVL / openingSL = balance carried from the old leave card as of OPENING_DATE.
// Monthly accruals after that date are generated in src/data/seed.ts.

export type Role = "EMPLOYEE" | "DEPT_HEAD" | "HRMO" | "APPROVER";

export const ROLE_LABEL: Record<Role, string> = {
  EMPLOYEE: "Employee",
  DEPT_HEAD: "Department Head",
  HRMO: "HRMO (Administrator)",
  APPROVER: "Approving Authority",
};

export interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  sex: "Male" | "Female";
  position: string;
  salaryGrade: number;
  monthlySalary: number;
  officeId: string;
  status: "Permanent" | "Casual" | "Coterminous" | "Elective";
  originalAppointment: string; // YYYY-MM-DD
  role: Role;
  username: string;
  active: boolean;
  openingVL: number;
  openingSL: number;
}

export const OPENING_DATE = "2025-12-31";

export const EMPLOYEES: Employee[] = [
  { id: "E001", employeeNo: "2019-001", firstName: "Ramon", middleInitial: "T", lastName: "Villarosa", sex: "Male", position: "Municipal Mayor", salaryGrade: 27, monthlySalary: 110000, officeId: "MO", status: "Elective", originalAppointment: "2019-06-30", role: "APPROVER", username: "mayor", active: true, openingVL: 0, openingSL: 0 },
  { id: "E002", employeeNo: "2008-014", firstName: "Liza", middleInitial: "M", lastName: "Dalisay", sex: "Female", position: "MGDH I (HRMO)", salaryGrade: 24, monthlySalary: 85000, officeId: "HRMO", status: "Permanent", originalAppointment: "2008-03-01", role: "HRMO", username: "hrmo", active: true, openingVL: 112.5, openingSL: 140.25 },
  { id: "E003", employeeNo: "2010-006", firstName: "Eduardo", middleInitial: "P", lastName: "Salcedo", sex: "Male", position: "Municipal Treasurer", salaryGrade: 24, monthlySalary: 85000, officeId: "MTO", status: "Permanent", originalAppointment: "2010-07-15", role: "DEPT_HEAD", username: "treasurer", active: true, openingVL: 98, openingSL: 120.5 },
  { id: "E004", employeeNo: "2012-021", firstName: "Grace", middleInitial: "L", lastName: "Manalo", sex: "Female", position: "Municipal Accountant", salaryGrade: 24, monthlySalary: 85000, officeId: "MACCO", status: "Permanent", originalAppointment: "2012-01-03", role: "DEPT_HEAD", username: "accountant", active: true, openingVL: 76.75, openingSL: 88 },
  { id: "E005", employeeNo: "2011-009", firstName: "Nestor", middleInitial: "B", lastName: "Alcantara", sex: "Male", position: "Municipal Engineer", salaryGrade: 24, monthlySalary: 85000, officeId: "MEO", status: "Permanent", originalAppointment: "2011-09-01", role: "DEPT_HEAD", username: "engineer", active: true, openingVL: 64.5, openingSL: 95.25 },
  { id: "E006", employeeNo: "2014-017", firstName: "Teresita", middleInitial: "C", lastName: "Robles", sex: "Female", position: "MSWD Officer", salaryGrade: 24, monthlySalary: 85000, officeId: "MSWDO", status: "Permanent", originalAppointment: "2014-02-17", role: "DEPT_HEAD", username: "mswdo", active: true, openingVL: 58, openingSL: 71.5 },
  { id: "E007", employeeNo: "2013-003", firstName: "Arnel", middleInitial: "D", lastName: "Fuentes", sex: "Male", position: "Municipal Health Officer", salaryGrade: 24, monthlySalary: 85000, officeId: "MHO", status: "Permanent", originalAppointment: "2013-05-20", role: "DEPT_HEAD", username: "mho", active: true, openingVL: 45.25, openingSL: 60 },
  { id: "E008", employeeNo: "2018-030", firstName: "Joanna", middleInitial: "R", lastName: "Pepito", sex: "Female", position: "Administrative Officer II", salaryGrade: 11, monthlySalary: 30000, officeId: "HRMO", status: "Permanent", originalAppointment: "2018-08-01", role: "EMPLOYEE", username: "jpepito", active: true, openingVL: 34.5, openingSL: 41.75 },
  { id: "E009", employeeNo: "2020-044", firstName: "Mark", middleInitial: "A", lastName: "Dizon", sex: "Male", position: "Revenue Collection Clerk I", salaryGrade: 5, monthlySalary: 19000, officeId: "MTO", status: "Permanent", originalAppointment: "2020-02-03", role: "EMPLOYEE", username: "mdizon", active: true, openingVL: 18.25, openingSL: 22.5 },
  { id: "E010", employeeNo: "2021-012", firstName: "Kristine", middleInitial: "S", lastName: "Lumbay", sex: "Female", position: "Bookkeeper I", salaryGrade: 8, monthlySalary: 23500, officeId: "MACCO", status: "Permanent", originalAppointment: "2021-06-01", role: "EMPLOYEE", username: "klumbay", active: true, openingVL: 12, openingSL: 14.5 },
  { id: "E011", employeeNo: "2016-025", firstName: "Rodel", middleInitial: "G", lastName: "Tampus", sex: "Male", position: "Engineer II", salaryGrade: 16, monthlySalary: 45000, officeId: "MEO", status: "Permanent", originalAppointment: "2016-10-03", role: "EMPLOYEE", username: "rtampus", active: true, openingVL: 40.75, openingSL: 52 },
  { id: "E012", employeeNo: "2022-008", firstName: "Aileen", middleInitial: "J", lastName: "Bacus", sex: "Female", position: "Social Welfare Assistant", salaryGrade: 8, monthlySalary: 23500, officeId: "MSWDO", status: "Permanent", originalAppointment: "2022-03-14", role: "EMPLOYEE", username: "abacus", active: true, openingVL: 6.5, openingSL: 9.25 },
  { id: "E013", employeeNo: "2017-019", firstName: "Lorna", middleInitial: "F", lastName: "Cabahug", sex: "Female", position: "Nurse II", salaryGrade: 16, monthlySalary: 45000, officeId: "MHO", status: "Permanent", originalAppointment: "2017-01-09", role: "EMPLOYEE", username: "lcabahug", active: true, openingVL: 28, openingSL: 3.5 },
  { id: "E014", employeeNo: "2023-002", firstName: "Jerome", middleInitial: "V", lastName: "Omandam", sex: "Male", position: "Midwife II", salaryGrade: 11, monthlySalary: 30000, officeId: "MHO", status: "Permanent", originalAppointment: "2023-07-03", role: "EMPLOYEE", username: "jomandam", active: true, openingVL: 3.75, openingSL: 4 },
  { id: "E015", employeeNo: "2019-037", firstName: "Cherry", middleInitial: "N", lastName: "Galarrita", sex: "Female", position: "Administrative Aide IV", salaryGrade: 4, monthlySalary: 17500, officeId: "MO", status: "Permanent", originalAppointment: "2019-11-04", role: "EMPLOYEE", username: "cgalarrita", active: true, openingVL: 21, openingSL: 26.75 },
  { id: "E016", employeeNo: "2024-011", firstName: "Paolo", middleInitial: "E", lastName: "Sumalpong", sex: "Male", position: "Utility Worker I", salaryGrade: 1, monthlySalary: 14000, officeId: "MEO", status: "Casual", originalAppointment: "2024-01-15", role: "EMPLOYEE", username: "psumalpong", active: true, openingVL: 2.5, openingSL: 3 },
];

export const fullName = (e: Pick<Employee, "firstName" | "middleInitial" | "lastName">) =>
  `${e.firstName} ${e.middleInitial ? e.middleInitial + ". " : ""}${e.lastName}`;

export const formName = (e: Pick<Employee, "firstName" | "middleInitial" | "lastName">) =>
  `${e.lastName.toUpperCase()}, ${e.firstName} ${e.middleInitial}.`;
