# Odoo Reimbursement Management System

A comprehensive, role-based Employee Expense and Reimbursement Management System built with React, Node.js, and Prisma. The application streamlines the process of submitting, tracking, and approving employee expenses, featuring OCR receipt scanning, multi-currency support, and dynamic multi-level approval workflows.

## 🚀 Key Features

* **Role-Based Access Control (RBAC):** Dedicated portals for `Admin`, `Manager`, and `Employee`.
* **Smart Receipt Processing:** Employees can upload receipts (images/PDFs), and the system automatically extracts the total amount.
* **Excel-Style Editing:** Quick inline-table expense entry for rapid bulk expense addition.
* **Multi-Currency Support:** Handles different country currencies with realtime conversion estimates.
* **Dynamic Approval Workflows:** Admins can configure sequential or non-sequential approval rules, minimum approval percentages, and manager hierarchies.
* **Draft & Submit States:** Employees can save drafts and submit them when ready.
* **Secure Authentication:** JWT-based stateless authentication.

## 💻 Tech Stack

### Frontend
- **Framework:** React.js + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **HTTP Client:** Fetch API (encapsulated in an `apiClient.js` wrapper)

### Backend
- **Environment:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma ORM
- **Database:** PostgreSQL / MySQL / SQLite (Configurable via Prisma)
- **Security:** bcrypt (Password Hashing), jsonwebtoken (JWT)

---

## 📂 Project Structure

```
Odoo-Reimbursement-Management/
├── Backend/
│   ├── config/          # Environment & DB configurations
│   ├── prisma/          # Prisma schema and migrations
│   ├── src/
│   │   ├── controllers/ # Route logic (Admin, Auth, Employee, Manager)
│   │   ├── middleware/  # Auth, Roles, and Error handling
│   │   ├── routes/      # Express route definitions
│   │   ├── services/    # Business logic & 3rd-party integrations (Emails, etc.)
│   │   └── utils/       # Helpers (Currency converter, Token generators, OCR extraction)
│   ├── index.js         # Entry point
│   └── package.json
│
└── Frontend/
    ├── public/          # Static assets (images, icons)
    ├── src/
    │   ├── components/  # Reusable UI components (Auth forms, Modals)
    │   ├── pages/       # Dashboard pages for different roles
    │   ├── services/    # API and currency fetching services
    │   ├── utils/       # Utility functions and form validation
    │   ├── App.jsx      # Main Application Router
    │   └── main.jsx     # React Entry point
    ├── vite.config.js
    └── package.json
```

---

## 🛠️ Installation & Setup

### Prerequisites
* Node.js (v16 or higher)
* NPM or Yarn
* A supported SQL Database (if not using local SQLite)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Odoo-Reimbursement-Management.git
cd Odoo-Reimbursement-Management
```

### 2. Backend Setup
```bash
cd Backend

# Install dependencies
npm install

# Initialize Prisma Client and push the schema to the database
npx prisma generate
npx prisma db push
```

**Backend Environment Variables (`Backend/.env`):**
Create a `.env` file in the `Backend` directory and define the following variables:
```env
PORT=5000
DATABASE_URL="file:./dev.db" # Or your PostgreSQL/MySQL connection string
JWT_SECRET="your_super_secret_jwt_key"
JWT_REFRESH_SECRET="your_super_secret_refresh_key"
```

### 3. Frontend Setup
```bash
cd ../Frontend

# Install dependencies
npm install
```

**Frontend Environment Variables (`Frontend/.env`):**
Create a `.env` file in the `Frontend` directory if custom API URLs are needed:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

---

## 🏃‍♂️ Running the Application

**Start the Backend Server:**
```bash
cd Backend
npm run dev
# Server will run on http://localhost:5000
```

**Start the Frontend App:**
```bash
cd Frontend
npm run dev
# Application will usually run on http://localhost:5173
```

## 🔐 User Roles & Permissions

1. **Admin:** Sets up the company workspace, invites Managers and Employees, configures approval constraints, and monitors global platform usage.
2. **Manager:** Approves, rejects, or requests modifications for submitted employee expenses based on workflow definitions.
3. **Employee:** Submits reimbursement claims visually using drag-and-drop receipt scanning, manual entry, or an inline Excel-like ledger.

---

## 📄 License
This project is licensed under the MIT License. See the `LICENSE` file for details.
