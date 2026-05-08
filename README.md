# BRIMS - Border Road Inventory Management System

BRIMS is a comprehensive inventory and maintenance tracking system designed for managing Vehicles, Equipment, and Plant (VEP) in demanding environments. It tracks the complete lifecycle from work order receipt to job card completion, including spare part procurement and voucher management.

## 🚀 Quick Start (Setup on a New Machine)

If you are running this project for the first time or moving to a new computer, follow these steps in order:

### 1. Install Dependencies
Download the required libraries for the application.
```bash
npm install
```

### 2. Generate Prisma Client
**CRITICAL STEP:** This builds the bridge between the application code and the database. Without this, the app will return "500 Internal Server Error" when trying to fetch data.
```bash
npx prisma generate
```

### 3. Initialize Database
Ensure the local SQLite database is created and synchronized with the latest schema.
```bash
npx prisma db push
```

### 4. Run Development Server
Start the application in development mode.
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: [SQLite](https://www.sqlite.org/) via [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: TailwindCSS 4 with custom Design Tokens (Notion-inspired theme)

---

## 📋 Key Modules

- **Dashboard**: Real-time overview of active work orders and job card pipeline.
- **VEP Registry**: Centralized management of Vehicles, Equipment, and Plant units.
- **Work Orders**: Track incoming maintenance requests from different units.
- **Job Cards**: Detailed maintenance tracking including:
  - **IONs**: Internal Office Notes for spare requests.
  - **Spare Scaling**: Granular tracking of spare availability and sources.
  - **NACs**: Non-Availability Certificates for procurement.
  - **Procurement**: Tracking supply orders and vendor interactions.
  - **CRV/RV**: Receipt vouchers for incoming spares.
  - **CIVs**: Issue vouchers for parts installed on equipment.
- **Vouchers**: A global ledger for browsing all document types across the workspace.

---

## 💡 Troubleshooting

### "API Error 500" or HTML code appearing in console
This usually happens if the Prisma Client is out of sync or missing. 
**Solution:**
1. Stop the server (`Ctrl+C`).
2. Run `npx prisma generate`.
3. Restart the server with `npm run dev`.

### Database Schema Changes
If you modify `prisma/schema.prisma`, you must run:
```bash
npx prisma db push
npx prisma generate
```
