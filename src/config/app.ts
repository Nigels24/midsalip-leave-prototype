// ─────────────────────────────────────────────────────────────
// APP SETTINGS — edit names/labels here and they update everywhere.
// Colors live in src/app/globals.css (the --brand-* variables).
// ─────────────────────────────────────────────────────────────

export const APP = {
  shortName: "MMH Leave",
  fullName: "Employee Leave Management System",
  agency: "Municipal Government of Midsalip",
  province: "Province of Zamboanga del Sur",
  office: "Human Resource Management Office",
  // Shown on the login page footer
  footer: "Web-Based Employee Leave Management System with QR Code Integration",
  // Monthly accrual prescribed by the Omnibus Rules on Leave
  monthlyAccrual: 1.25,
  // Password that works for every demo account on the login page
  demoPassword: "demo123",
};

// Philippine non-working holidays used when counting working days.
// Add or remove dates freely (format YYYY-MM-DD).
export const HOLIDAYS: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-04-02": "Maundy Thursday",
  "2026-04-03": "Good Friday",
  "2026-04-09": "Araw ng Kagitingan",
  "2026-05-01": "Labor Day",
  "2026-06-12": "Independence Day",
  "2026-08-21": "Ninoy Aquino Day",
  "2026-08-31": "National Heroes Day",
  "2026-11-01": "All Saints' Day",
  "2026-11-02": "All Souls' Day",
  "2026-11-30": "Bonifacio Day",
  "2026-12-08": "Feast of the Immaculate Conception",
  "2026-12-24": "Christmas Eve",
  "2026-12-25": "Christmas Day",
  "2026-12-30": "Rizal Day",
  "2026-12-31": "Last Day of the Year",
};
