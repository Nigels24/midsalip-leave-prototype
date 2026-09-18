// Offices of the municipal hall. Rename / add / remove freely.
// headId must match an employee id in employees.ts (the office's department head).

export interface Office {
  id: string;
  name: string;
  short: string;
  headId: string;
}

export const OFFICES: Office[] = [
  { id: "MO", name: "Office of the Municipal Mayor", short: "MO", headId: "E001" },
  { id: "HRMO", name: "Human Resource Management Office", short: "HRMO", headId: "E002" },
  { id: "MTO", name: "Office of the Municipal Treasurer", short: "MTO", headId: "E003" },
  { id: "MACCO", name: "Office of the Municipal Accountant", short: "MACCO", headId: "E004" },
  { id: "MEO", name: "Office of the Municipal Engineer", short: "MEO", headId: "E005" },
  { id: "MSWDO", name: "Municipal Social Welfare and Development Office", short: "MSWDO", headId: "E006" },
  { id: "MHO", name: "Municipal Health Office", short: "MHO", headId: "E007" },
];

export const office = (id: string) => OFFICES.find((o) => o.id === id);
