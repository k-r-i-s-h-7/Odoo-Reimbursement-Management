<div align="center">
  <h1>💸 Reimbursement Management System</h1>
  <p>An automated, intelligent, and flexible expense reimbursement platform designed to eliminate manual bottlenecks, streamline multi-tiered approvals, and enforce organizational spending policies.</p>

  [![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge&logoColor=white)]()
  [![Hackathon](https://img.shields.io/badge/Hackathon-Project-blue?style=for-the-badge&logoColor=white)]()
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)]()
</div>

---

## 📌 Problem Statement
Companies frequently grapple with manual expense reimbursement pipelines. Traditional workflows are historically slow, highly prone to human error, and suffer from minimal transparency. Specifically, organizations lack straightforward systems to:
- Dynamically **define approval flows** triggered by expense thresholds.
- Intelligently manage **multi-level, hierarchical approvals**.
- Seamlessly enforce **flexible, programmable approval rules** across distributed teams.

**Our Solution:** A comprehensive SaaS-like architecture that enables granular hierarchical structuring, conditional logic approvals, real-time currency conversions, and automated OCR receipt extraction.

---

## 🚀 Key Innovation & Architecture

The core philosophy of this project revolves around a highly customizable workflow state machine designed for complete flexibility in an organizational setting.

### 1️⃣ Intelligent Approval Engine
The system moves beyond static "Manager -> HR" flows. Admins can program exact pathways for an expense to take:
- **Sequential Multi-Level:** e.g., `Manager` ➡️ `Finance Dept` ➡️ `Director`. Expenses only advance through the chain once the preceding authority approves them.
- **Conditional Logic Flags:** Programmatic triggers such as *"If CFO approves, bypass all other queues"* or *"If 60% of assigned approvers give the green light, auto-approve"*.
- **Hybrid Thresholds:** Mixing conditions, e.g., requiring either a direct manager's sign-off *and* 60% of secondary approvers, ensuring security alongside speed.

### 2️⃣ Global AI-Enabled Submissions
- **AI OCR Integration:** Employees no longer manually type out expense details. By scanning physical or digital receipts, the integrated OCR engine extracts metadata (Vendor Name, Category, Date, Line Items, Total Amount).
- **Cross-Border Intelligence:** Using external API aggregators, the system detects an employee's location, converts transaction currencies in real-time, and surfaces the final amounts adjusted to the Company's default currency threshold.

---

## 🔥 Detailed Feature Breakdown

### 🔐 Authentication & Onboarding
Seamless onboarding experience built for immediate scalability.
* **Auto-Provisioning:** An initial signup instantly creates a discrete `Company` tenant in the system. The platform geographically assigns a default operating currency.
* **Master Admin Controls:** The initiating user is assigned the `Admin` root persona, unlocking the management dashboard.
* **Role-Based Access Control (RBAC):** Admins explicitly invite users and provision roles (`Employee`, `Manager`, `Admin`), establishing the exact reporting topology of the organization.

### 💼 Employee Portal (Expense Submission)
* **Creation Pipeline:** Employees submit robust expense payloads encompassing Amount, Category, Description, and Date.
* **Currency Agnostic:** Employees can submit expenses in a local currency (e.g., EUR) while the system automatically handles the conversion to the Company's native currency (e.g., USD) for upper management review.
* **Status Tracking:** A transparent, historical dashboard denoting whether an expense is `Pending`, `Approved`, or `Rejected`.

### ✅ Management Portal (The Approval Loop)
* **Custom Views:** Managers have isolated queues indicating exactly what awaits their individual signature.
* **Direct Escalation:** If checked as the *"Is Manager Approver"*, they receive priority flagging in the queue.
* **Mandatory Auditing:** Approving or rejecting requires documented comments to ensure a permanent audit trail.

---

## 📊 Role Matrix & Permissions Mapping

| Persona | Core Capabilities & Permissions |
| :--- | :--- |
| **👑 Admin** | <ul><li>Creates global company policies and configures complex approval state machines.</li><li>Invites users, defines role hierarchies, and overrides pending escalations globally.</li><li>Accesses an omni-view of all organizational expenses.</li></ul> |
| **🛡️ Manager** | <ul><li>Evaluates and approves/rejects expenses submitted by direct reports.</li><li>Views amounts strictly evaluated in the company's default currency.</li><li>Views holistic team performance and expense metrics.</li></ul> |
| **👤 Employee** | <ul><li>Submits claims using manual entry or AI OCR scanners.</li><li>Monitors the lifecycle status of submitted requests.</li></ul> |

---

## 💻 Tech Stack & Infrastructure

This platform is structured as a decoupled monorepo, maintaining strict separation of concerns between the API engine and the client presentation layer.

**Frontend Presentation Layer:**
- **Framework:** `React.js` (v19) configured via `Vite` for ultra-fast HMR and optimized builds.
- **Styling UI:** `Tailwind CSS` (v4) for rapid, responsive UI composition.
- **Routing:** `React Router DOM`

**Backend API Services:**
- **Runtime:** `Node.js` with `Express.js`
- **Architecture:** Standardized Controller-Service-Route structure for maximum maintainability.
- **Auth:** JWT-based stateless authentication flow.

### 🌐 Ext API Integrations
1. **REST Countries API** (`restcountries.com`): Automatically parses local geographical data to assign proper native currencies upon organization creation.
2. **ExchangeRate API** (`exchangerate-api.com`): Live, highly-available endpoint for accurate currency normalization.

---

## 📁 Repository Structure

```text
Odoo/
├── backend/                  # Server-side logic and REST APIs
│   ├── src/
│   │   ├── controllers/      # Route request/response handlers
│   │   ├── middleware/       # Auth and Role guards (e.g. RoleMiddleware.js)
│   │   ├── routes/           # API Endpoint definitions
│   │   ├── services/         # Core business logic & external API fetches
│   │   └── utils/            # Hash/Crypto and payload helpers
│   ├── server.js             # Express application initialization
│   └── .env                  # Environment configurations
│
└── frontend/                 # Client-side presentation application
    ├── src/
    │   ├── components/       # Reusable UI fragments (Buttons, Modals, Cards)
    │   ├── pages/            # Parent structural views (Dashboard, Login, Forms)
    │   ├── services/         # Axios/Fetch hooks communicating with backend
    │   └── utils/            # Formatter and UI helper scripts
    ├── index.html            # Main HTML document
    └── vite.config.js        # Vite build configuration
```

---

## ⚙️ Local Development Guide

Follow these instructions to boot both the frontend and backend servers locally.

### Prerequisites
- Node.js `v18+`
- Package Manager (`npm` or `yarn`)

### 1. Initial Setup
Clone the repository to your local machine:
```bash
git clone <your-repository-url>
cd Odoo
```

### 2. Backend Initialization
```bash
cd backend
npm install

# Create a .env file based on .env.example (or manually configure)
# PORT=5000
# JWT_SECRET=your_super_secret_key

npm run dev
```
*The API will boot and listen on port 5000 (or the port defined in `.env`).*

### 3. Frontend Initialization
In a new terminal window / tab:
```bash
cd frontend
npm install
npm run dev
```
*Vite will boot the development server, accessible usually at `http://localhost:5173`.*

---

## 🎨 System Mockup & UX Flow
Our UX emphasizes low cognitive-load data entry and high-visibility status tracking.
👉 **[View Initial Wireframes & Excalidraw UI Mockups](https://link.excalidraw.com/l/65VNwvy7c4X/4WSLZDTrhkA)**

---

<div align="center">
  <p>Built for efficiency, engineered for scale.</p>
</div>
