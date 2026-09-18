# Midsalip Employee Leave Management System — Interactive Prototype

Clickable prototype of the **Web-Based Employee Leave Management System with QR Code Integration for Midsalip Municipal Hall**, built from Chapters 1–3 of the capstone.

Stack (same as Table 3.2): **Next.js + TypeScript + Tailwind CSS**. The prototype has no database yet. All data is sample data kept in the browser (localStorage), so every action (filing, approving, posting credits, adding employees) really works and stays saved in that browser.

---

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. To open it from phones on the same Wi-Fi (for QR scanning), run `npm run dev -- -H 0.0.0.0` and use `http://<your-computer-ip>:3000`.

## Demo accounts (password: `demo123`)

| Username | Role | Use it to show |
|---|---|---|
| `jpepito` | Employee | Filing a leave, checking credits, tracking status |
| `mdizon` | Employee (Treasurer's Office) | Normal 3-level routing |
| `treasurer` | Department Head | Recommending an application |
| `hrmo` | HRMO (system administrator) | Certifying credits, accounts, ledger, reports, audit trail |
| `mayor` | Approving Authority | Final approval, which generates the QR code |

Any other username in `src/data/employees.ts` also works. Use the user menu (top right) → **Demo: switch user** to jump between roles quickly, and **Reset demo data** to start over.

## Suggested demo flow (about 5 minutes)

1. Sign in as **mdizon** → **File Leave** → Vacation Leave, pick dates → Submit.
2. Switch to **treasurer** → **For My Action** → open it → **Recommend for approval**.
3. Switch to **hrmo** → certify the leave credits (the 7.A table is computed automatically).
4. Switch to **mayor** → **Approve** → **Print CS Form No. 6**. The form now has a QR code and a reference number.
5. Open **Verify QR Code** (or scan the QR code with a phone) → shows *AUTHENTIC — APPROVED LEAVE*. Try a fake number to see *No record found*.
6. Back as **mdizon**: the notifications and the leave credit ledger now show the deduction.

## Screens by module (Chapter 1 SOP 3–4)

| Module | Screens |
|---|---|
| User & account management | Login, Employees & Accounts (add/edit, deactivate, reset password), role-based menus |
| Leave credit management | Leave Credits (electronic leave card), monthly accrual posting on HRMO dashboard (1.25 VL + 1.25 SL) |
| Online leave application | File Leave (CS Form 6 fields, working-day count, balance check, overlap check) |
| Multi-level approval workflow | For My Action, application detail with routing timeline and remarks (Dept Head → HRMO → Mayor) |
| In-system notification | Bell dropdown and Notifications page |
| CS Form 6 & reports | Printable CS Form No. 6, leave ledger print, Reports (by employee, office, period, balances) with CSV export |
| QR code verification | QR on approved forms, public Verify page (scan or type the reference number) |
| Extras | Leave Calendar (office staffing), Leave Records, Audit Trail |

## Where to edit what (client change requests)

| Change | File |
|---|---|
| App name, agency, password, holidays | `src/config/app.ts` |
| Colors / theme | `src/app/globals.css` (the `--brand-*` variables) |
| Sidebar menu items per role | `src/config/nav.ts` |
| Offices and department heads | `src/data/offices.ts` |
| Employees, positions, roles, opening balances | `src/data/employees.ts` |
| Leave types, legal basis, which ones deduct VL/SL | `src/data/leaveTypes.ts` |
| Sample applications shown at start | `src/data/seed.ts` |
| Business rules (routing, validation, deduction, accrual) | `src/lib/engine.ts` |
| Buttons, cards, inputs, badges (look of every screen) | `src/components/ui.tsx` |
| LGU seal | `src/components/Seal.tsx` (placeholder; swap in the official seal) |
| A specific screen | `src/app/(app)/<screen>/page.tsx` (login and verify are in `src/app/login` and `src/app/verify`) |

After changing a file in `src/data/` or `src/config/`, click **Reset demo data** in the user menu so the browser reloads the new sample data. If you change the *shape* of the data, also bump `DB_VERSION` in `src/data/seed.ts`.

## Share it online (GitHub Pages)

1. Push this folder to a GitHub repository.
2. In the repo go to **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml` and publishes the site to `https://<user>.github.io/<repo>/`.

Manual build: `NEXT_PUBLIC_BASE_PATH=/<repo> npm run build`. The static site is written to `out/`.

## Prototype limitations

- Data lives in each browser. A leave filed on one computer won't show up on another device. The sample reference numbers are the same on every device, so the sample approved forms can be verified from any phone.
- The login is simulated, and every account uses the same demo password.
- All names are fictional sample data.

## Moving to the real system

The screens stay the same. What changes:

1. Define the Prisma schema from `src/lib/types.ts` and `src/data/*.ts` (Employee, Office, LeaveType, LeaveApplication, WorkflowAction, LedgerEntry, Notification, AuditLog) on MySQL.
2. Move the functions in `src/lib/engine.ts` into server actions or route handlers that use Prisma.
3. Replace `useStore()` in `src/lib/store.tsx` with data fetching, and add real authentication with hashed passwords.
4. Remove `output: "export"` from `next.config.ts` and deploy on the municipal hall's LAN server (`npm run build && npm start`).
