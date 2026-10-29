# Shop OS System

Distributor & wholesale shop operating system built with **Next.js (App Router) + React + TypeScript + MongoDB + JWT**.

Replaces the previous Supabase / single-HTML version with a clean, structured full-stack app.

## Features (current scaffold)

- Email / password authentication with JWT (httpOnly cookie)
- Dashboard with live stock value, low-stock alerts, expiry alerts
- Products list (Brand → Category → Variant)
- Models ready for: Purchase invoices, Stock transfers, POS (retail/wholesale), Sales & profit, Batches with expiry
- Same visual style as the original Distributor OS (green sidebar, metric cards, etc.)

## Tech stack

| Layer        | Choice                          |
|--------------|---------------------------------|
| Frontend     | Next.js 16 + React 19 + Tailwind|
| Backend      | Next.js API Routes              |
| Database     | MongoDB (Mongoose)              |
| Auth         | JWT + bcrypt                    |

## Getting started

### 1. Prerequisites

- Node.js 20.19+ (or 22.13+ / 24)
- A free MongoDB Atlas cluster: https://cloud.mongodb.com

### 2. Clone & install

```bash
git clone https://github.com/xeroxb4/SHOP-OS-SYSTEM.git
cd SHOP-OS-SYSTEM
# if you put the code in a subfolder, adjust
npm install
```

### 3. Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/shop-os?retryWrites=true&w=majority
JWT_SECRET=generate-a-long-random-string-here
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

- First visit (empty database) → the page asks you to **create the first admin account**.
- After that, nobody can register themselves. Admins add staff under **Users** in the sidebar.
- After login you land on the Dashboard. Add your catalogue under **Products**: brand, then type, then product.

## Roles

| Role | Can do |
|---|---|
| `admin` | Everything, including managing users |
| `warehouse` | Add and edit catalogue; stock work (coming) |
| `shop` | Point of sale and shop stock (coming) |
| `viewer` | Read only |

## Security notes

- `JWT_SECRET` is required (32+ random characters). The app refuses to sign anyone in without it.
- Never commit `.env.local`. Only `.env.example` (placeholders) belongs in git.
- Changing a user's role or deactivating them takes effect immediately.

## Project structure

```
src/
├── app/
│   ├── (auth)/login/          # Login / Register
│   ├── (dashboard)/           # Protected pages + sidebar layout
│   │   ├── page.tsx           # Dashboard
│   │   ├── products/
│   │   ├── purchases/
│   │   ├── transfers/
│   │   ├── pos/
│   │   └── reports/
│   └── api/                   # REST API
│       ├── auth/
│       ├── products/
│       ├── brands/
│       ├── categories/
│       └── dashboard/
├── components/                # Shared React components (expand later)
├── lib/
│   ├── db.ts                  # MongoDB connection
│   ├── auth/                  # JWT + password helpers
│   └── models/                # Mongoose schemas
└── types/
```

## Models

- `User` – email, password, fullName, role (admin | warehouse | shop | viewer)
- `Brand` → `Category` → `Product` (cost / wholesale / retail + warehouseQty / shopQty)
- `Batch` – quantity, location, expiryDate (for expiry alerts)
- `Supplier`
- `PurchaseInvoice` + items (adds to warehouse + optional batch)
- `StockTransfer` + items (warehouse → shop)
- `Sale` + items (retail / wholesale from shop stock)

## Next development steps

1. Purchase invoice posting (with batch + expiry)
2. Stock transfer UI
3. Full POS with cart
4. Sales & profit report
5. Docker setup + seed script for installing on any computer

## License

Private – for your business use.
