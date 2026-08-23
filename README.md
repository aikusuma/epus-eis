# EIS Dinkes Brebes

Executive Information System (EIS) untuk Dinas Kesehatan Kabupaten Brebes. Sistem analitik kesehatan yang mengintegrasikan data dari e-Puskesmas untuk mendukung pengambilan keputusan strategis.

## Tech Stack

- **Framework** - [Next.js 16](https://nextjs.org/16) (App Router)
- **Language** - [TypeScript](https://www.typescriptlang.org)
- **Styling** - [Tailwind CSS v4](https://tailwindcss.com)
- **Components** - [Shadcn-ui](https://ui.shadcn.com)
- **Database** - [PostgreSQL 16](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
- **Authentication** - JWT with [jose](https://github.com/panva/jose)
- **Schema Validations** - [Zod](https://zod.dev)
- **Charts** - [Recharts](https://recharts.org/)
- **State Management** - [Zustand](https://zustand-demo.pmnd.rs)
- **Tables** - [Tanstack Data Tables](https://ui.shadcn.com/docs/components/data-table)
- **Command+K** - [kbar](https://kbar.vercel.app/)

## Features

- 🏥 **Dashboard EIS** - Ringkasan KPI kesehatan (kunjungan, penyakit, puskesmas)
- 🔐 **ACL (Access Control List)** - Role-based access control (Kepala Dinkes, Kabid, Subkor, Kepala Puskesmas, Staf)
- 🌗 **Dark/Light mode** - Theme toggle

## Getting Started

### Prerequisites

- Node.js 18+ / Bun
- Docker & Docker Compose

### Setup

1. Clone the repository

2. Copy environment file:
   ```bash
   cp env.example.txt .env.local
   ```

3. Start databases with Docker:
   ```bash
   docker-compose up -d
   ```

4. Install dependencies:
   ```bash
   bun install
   ```

5. Generate Prisma client and push schema:
   ```bash
   bun db:generate
   bun db:push
   ```

6. Seed initial data:
   ```bash
   bun db:seed
   ```

7. Run the development server:
   ```bash
   bun dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Login

- **Email:** admin@dinkes-brebes.go.id
- **Password:** admin123

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   └── eis/            # EIS analytics endpoints
│   ├── dashboard/          # Dashboard pages
│   │   ├── overview/       # Main dashboard with KPIs
│   │   └── profile/        # User profile
│   └── login/              # Login page
├── components/
│   ├── layout/             # Sidebar, header
│   └── ui/                 # Shadcn UI components
├── features/
│   └── overview/           # Dashboard charts & components
├── lib/
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # JWT utilities
│   └── acl.ts              # ACL middleware
├── types/
│   └── acl.ts              # ACL types & constants
└── prisma/
    ├── schema.prisma       # PostgreSQL schema
    └── seed.ts             # Initial data seeding
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| Kepala Dinkes | Head of Health Department | All puskesmas, all data |
| Kabid | Department Head | All puskesmas, aggregated data |
| Subkor | Sub-coordinator | All puskesmas, aggregated data |
| Kepala Puskesmas | Puskesmas Head | Own puskesmas only |
| Staf | Staff | Own puskesmas, limited access |

## License

MIT


<!-- latest-version --> Latest Version: dev-eb80925
