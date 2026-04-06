# Sistem Manajemen Transaksi & Penjualan

Aplikasi web modern untuk manajemen transaksi dan penjualan dengan backend Google Apps Script.

## 🚀 Teknologi

- **Frontend**: Next.js 16 dengan App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: Zustand
- **Backend**: Google Apps Script (GAS)
- **Database**: Google Sheets

## 📋 Fitur

### Dashboard
- Statistik penjualan harian & bulanan
- Grafik tren penjualan
- Top products & customers
- Transaksi terbaru

### Master Data
- **Users**: Manajemen pengguna dengan role-based access
- **Customers**: Database pelanggan
- **Products**: Katalog produk dengan stock management
- **Drivers**: Manajemen driver
- **Vehicles**: Manajemen kendaraan
- **Customer Prices**: Harga khusus per pelanggan

### Transaksi
- Pembuatan invoice
- Multiple items per transaksi
- Perhitungan otomatis (subtotal, PPN, diskon)
- Payment tracking

### Pengiriman
- Status workflow tracking
- Driver & vehicle assignment
- Delivery proof (signature & photo)

### Target Penjualan
- Target per periode
- Achievement visualization
- Progress tracking

### Laporan
- Laporan Harian, Mingguan, Bulanan, Tahunan
- Export data

### Pengaturan
- Konfigurasi nama aplikasi & perusahaan
- Upload logo & banner
- Pengaturan PPN & prefix invoice
- Kategori produk dinamis
- Nama sales dinamis

## 🔧 Konfigurasi

### Environment Variables

Buat file `.env.local` dengan:

```env
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Google Apps Script Setup

1. Deploy script GAS sebagai Web App
2. Copy URL deployment ke `NEXT_PUBLIC_GAS_API_URL`
3. Pastikan konfigurasi CORS di GAS sudah benar

## 📦 Deployment ke Vercel

### Opsi 1: Deploy Manual

1. Push kode ke GitHub repository
2. Login ke [Vercel](https://vercel.com)
3. Import project dari GitHub
4. Set environment variable `NEXT_PUBLIC_GAS_API_URL`
5. Deploy

### Opsi 2: GitHub CI/CD

1. Setup secrets di GitHub repository:
   - `VERCEL_TOKEN`: Token dari Vercel
   - `VERCEL_ORG_ID`: Organization ID dari Vercel
   - `VERCEL_PROJECT_ID`: Project ID dari Vercel
   - `NEXT_PUBLIC_GAS_API_URL`: URL GAS backend

2. Push ke branch `main` atau `master` akan trigger deployment otomatis

## 🏃 Menjalankan Lokal

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run linter
bun run lint
```

## 📁 Struktur Folder

```
src/
├── app/
│   ├── (authenticated)/    # Protected routes
│   │   ├── master/         # Master data pages
│   │   ├── transactions/   # Transaction pages
│   │   ├── deliveries/     # Delivery pages
│   │   ├── targets/        # Target pages
│   │   ├── reports/        # Report pages
│   │   └── settings/       # Settings page
│   ├── (public)/           # Public routes
│   │   └── login/          # Login page
│   └── layout.tsx          # Root layout
├── components/
│   ├── layout/             # Layout components
│   ├── shared/             # Shared components
│   └── ui/                 # UI components (shadcn)
├── lib/
│   ├── api.ts              # API service layer
│   ├── constants.ts        # Constants
│   └── utils.ts            # Utilities
├── stores/
│   ├── auth-store.ts       # Auth state
│   └── app-store.ts        # App state
└── types/
    └── index.ts            # TypeScript types
```

## 🔐 Default Login

Setelah GAS di-setup dan diinisialisasi, gunakan:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ Segera ganti password setelah login pertama!

## 📝 License

MIT License
