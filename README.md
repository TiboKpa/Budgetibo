# Budgetibo

A modern budget and wealth management application combining monthly expense tracking, flexible categorization, and annual financial projections.

## Features

- Monthly expense and revenue tracking (fixed and variable)
- Flexible budget allocation by month or year-wide
- Categorization with user-defined subcategories
- Cost mitigation tracking (e.g., carpooling cost reductions)
- Multiple savings accounts with annual rate projections
- Monthly financial snapshots and year-end summary
- Real-time budget distribution visualization
- Export capabilities (CSV, PDF)

## Tech Stack

- Frontend: React 18+
- Backend: Node.js + Express
- Database: SQLite3
- Styling: Modern CSS with Finary UX inspiration

## Project Structure

```
Budgetibo/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── styles/          # CSS modules
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
├── backend/                  # Express server
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Data models
│   │   ├── db/              # Database setup and migrations
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── docs/                     # Documentation
├── README.md
└── .gitignore
```

## Installation (Windows)

### Prerequisites

- Node.js 16+ (download from https://nodejs.org/)
- npm 8+ (comes with Node.js)
- Git (download from https://git-scm.com/)

### Setup Steps

1. Clone the repository
```cmd
git clone https://github.com/TiboKpa/Budgetibo.git
cd Budgetibo
```

2. Install backend dependencies
```cmd
cd backend
npm install
```

3. Setup backend environment variables
```cmd
copy .env.example .env
```
Edit `.env` with your configuration.

4. Initialize SQLite database
```cmd
npm run db:init
```

5. Start backend server (in backend directory)
```cmd
npm run dev
```
The API will run on `http://localhost:5000`

6. In a new terminal, install frontend dependencies
```cmd
cd frontend
npm install
```

7. Start frontend development server
```cmd
npm start
```
The application will open at `http://localhost:3000`

## Available Scripts

### Backend (from `backend/` directory)
- `npm run dev` - Start development server with hot reload
- `npm run db:init` - Initialize SQLite database with schema
- `npm run db:seed` - Load sample data
- `npm test` - Run tests

### Frontend (from `frontend/` directory)
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests

## Core Workflows

### 1. Monthly Navigation
Select year and month to view/edit financial data for that period.

### 2. Copy Fixed Expenses/Revenues
Copy all fixed expenses and revenues from a source month to the current month with one click, then delete individual items as needed.

### 3. Budget Allocation
Define or modify budget allocation percentages for current month. Apply changes to entire year with confirmation dialog.

### 4. Expense Entry
Add variable expenses with category, subcategory, description, amount, and optional cost mitigation. Track cost reductions from shared expenses.

### 5. Month-End Closure
Close the month by recording actual savings amount and distributing it across savings accounts with configured annual rates.

### 6. Annual Summary
View aggregated metrics, compare theoretical vs actual distribution, visualize expense flow, and see projected year-end wealth.

## Database Schema

Key tables:
- `users` - User profiles
- `years` - Year containers
- `months` - Monthly data with allocation settings
- `categories` - Expense/revenue categories
- `fixed_expenses` - Recurring monthly expenses
- `variable_expenses` - Non-recurring expenses with cost tracking
- `revenues` - Income entries (fixed and variable)
- `savings_accounts` - Account definitions with annual rates
- `monthly_savings` - Savings allocation snapshots
- `monthly_summary` - Calculated month-end summaries

## API Endpoints

### Months
- `GET /api/months/:year` - Get all months for a year
- `GET /api/months/:year/:month` - Get month details
- `PATCH /api/months/:year/:month/allocation` - Update budget allocation

### Fixed Expenses
- `GET /api/months/:year/:month/fixed-expenses` - List fixed expenses
- `POST /api/months/:year/:month/fixed-expenses` - Create fixed expense
- `PATCH /api/months/:year/:month/fixed-expenses/:id` - Update fixed expense
- `DELETE /api/months/:year/:month/fixed-expenses/:id` - Delete fixed expense
- `POST /api/months/:year/:month/fixed-expenses/copy-from/:sourceMonth` - Bulk copy

### Variable Expenses
- `GET /api/months/:year/:month/variable-expenses` - List variable expenses
- `POST /api/months/:year/:month/variable-expenses` - Create variable expense
- `PATCH /api/months/:year/:month/variable-expenses/:id` - Update variable expense
- `DELETE /api/months/:year/:month/variable-expenses/:id` - Delete variable expense

### Revenues
- `GET /api/months/:year/:month/revenues` - List revenues
- `POST /api/months/:year/:month/revenues` - Create revenue
- `PATCH /api/months/:year/:month/revenues/:id` - Update revenue
- `DELETE /api/months/:year/:month/revenues/:id` - Delete revenue
- `POST /api/months/:year/:month/revenues/copy-from/:sourceMonth` - Bulk copy

### Savings
- `GET /api/months/:year/:month/savings` - Get month savings data
- `POST /api/months/:year/:month/savings/closure` - Record month-end closure
- `GET /api/years/:year/summary` - Get annual summary with projections

### Savings Accounts
- `GET /api/savings-accounts` - List all savings accounts
- `POST /api/savings-accounts` - Create savings account
- `PATCH /api/savings-accounts/:id` - Update account (rate, etc.)
- `DELETE /api/savings-accounts/:id` - Delete savings account

## Contributing

This is a personal project. For questions or suggestions, open an issue.

## License

MIT

## Author

Tibo Kpa
