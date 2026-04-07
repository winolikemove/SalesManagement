# Soejasch Bali (Cab Bandung) - Sistem Manajemen Transaksi & Penjualan

Aplikasi web modern untuk manajemen transaksi dan penjualan dengan backend Google Apps Script. Dilengkapi dengan fitur tracking fulfillment, manajemen harga khusus customer, dan integrasi pengiriman.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest)

## 🚀 Teknologi

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 dengan App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State Management | Zustand (with persist) |
| Data Fetching | React Query (TanStack Query) |
| Backend | Google Apps Script (GAS) |
| Database | Google Sheets |

## ✨ Fitur Utama

### 🔐 Autentikasi & Otorisasi
- Login dengan username/password
- Remember me functionality
- Token-based authentication dengan refresh token
- Role-based access control (SuperAdmin, Manager, Sales, Driver)
- Session management dengan auto-logout

### 📊 Dashboard
- Statistik penjualan harian & bulanan
- Grafik tren penjualan
- Top products & customers
- Ringkasan fulfillment status (Unfulfilled/Partial items)
- Transaksi terbaru dengan quick actions

### 👥 Master Data

#### Users
- CRUD pengguna dengan role management
- Role: SuperAdmin, Manager, Sales, Driver, Accounting
- Status aktif/non-aktif

#### Customers
- Database pelanggan lengkap
- Alamat dengan integrasi Google Maps
- Kontak PIC dengan telepon
- Kota dan kode customer

#### Products
- Katalog produk dengan stock management
- Kategori produk dinamis
- Harga per unit dan per kg
- Berat per unit
- Stock tracking

#### Drivers
- Manajemen driver dengan status aktif
- Nomor telepon dan KTP

#### Vehicles
- Manajemen kendaraan
- Nomor polisi dan tipe kendaraan
- Status ketersediaan

#### Customer Prices (Harga Khusus)
- Harga spesial per customer per produk
- Persentase diskon per item
- Status aktif/non-aktif
- **Auto-apply saat pembuatan invoice**

### 📝 Transaksi

#### Pembuatan Invoice
- Multiple items per transaksi
- Auto-complete untuk pemilihan customer dan produk
- **Pre-fill harga dari Customer Prices master data**
- **Fallback ke harga normal jika tidak ada harga khusus**
- Perhitungan otomatis (subtotal, PPN, diskon)
- Payment tracking dengan status otomatis

#### Fulfillment Tracking
- Status per item: UNFULFILLED, PARTIAL, FULFILLED
- **Visual card untuk item yang perlu dipenuhi**
- Quick action untuk membuat fulfillment invoice
- Tracking qty terkirim vs qty pesanan
- Auto-update status saat fulfillment invoice dibuat

#### Payment Management
- Update pembayaran incremental
- Auto-calculate payment status (UNPAID, PARTIAL, PAID)
- Multiple payment methods

### 🚚 Pengiriman

#### Delivery Management
- Buat pengiriman dari transaksi
- Assign driver dan kendaraan
- Delivery workflow: PENDING → PROCESSING → DELIVERED
- Delivery proof (receiver name, signature)
- **Auto-update fulfillment status transaksi**

#### Status Workflow
- PENDING: Menunggu proses
- PROCESSING: Sedang dikirim
- DELIVERED: Terkirim dengan bukti

### 🎯 Target Penjualan
- Target per periode (bulan/tahun)
- Per sales atau global
- Achievement visualization
- Progress tracking dengan persentase

### 📈 Laporan
- Laporan Harian, Mingguan, Bulanan, Tahunan
- Filter by date range
- Summary statistics

### ⚙️ Pengaturan

#### Konfigurasi Aplikasi
- Nama aplikasi & perusahaan
- Upload logo & banner
- Pengaturan PPN (persentase)
- Prefix invoice

#### Master Dinamis
- Kategori produk dinamis
- Nama sales dinamis
- Metode pembayaran dinamis

### 🎨 User Experience
- **Responsive design** untuk desktop dan mobile
- Dark/Light mode
- Collapsible sidebar
- Quick search dan filter
- Loading states dan error handling

## 🔧 Konfigurasi

### Environment Variables

Buat file `.env` dengan:

```env
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Mode Development (Mock Mode)

Aplikasi mendukung **Mock Mode** untuk development tanpa backend GAS:
- Data dummy lengkap
- Toggle mode di halaman login
- Semua fitur dapat di-test

### Google Apps Script Setup

1. Deploy script GAS sebagai Web App
2. Copy URL deployment ke `NEXT_PUBLIC_GAS_API_URL`
3. Pastikan konfigurasi CORS di GAS sudah benar

#### Aturan Penting untuk GAS Backend:
- Gunakan metode `POST` untuk semua request
- Gunakan `redirect: 'follow'` di fetch
- Header `Content-Type: text/plain;charset=utf-8` (bukan application/json)
- Payload: `{ action: 'nama.action', data: {...}, auth: { token: '...' } }`

## 📦 Deployment

### Vercel (Recommended)

1. Push kode ke GitHub repository
2. Login ke [Vercel](https://vercel.com)
3. Import project dari GitHub
4. Set environment variable `NEXT_PUBLIC_GAS_API_URL`
5. Deploy

### Docker

```bash
# Build
docker build -t soejasch-bali-app .

# Run
docker run -p 3000:3000 soejasch-bali-app
```

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
│   │   │   ├── customers/  # Customer management
│   │   │   ├── products/   # Product management
│   │   │   ├── drivers/    # Driver management
│   │   │   ├── vehicles/   # Vehicle management
│   │   │   ├── users/      # User management
│   │   │   └── prices/     # Customer prices
│   │   ├── transactions/   # Transaction pages
│   │   ├── deliveries/     # Delivery pages
│   │   ├── targets/        # Target pages
│   │   ├── reports/        # Report pages
│   │   └── settings/       # Settings page
│   ├── (public)/           # Public routes
│   │   └── login/          # Login page
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── layout/             # Layout components (Sidebar, Navbar)
│   ├── shared/             # Shared components (DataTable, ModalForm)
│   └── ui/                 # UI components (shadcn/ui)
├── lib/
│   ├── api.ts              # API service layer (real + mock)
│   ├── mock-api.ts         # Mock API implementation
│   ├── mock-data.ts        # Mock data
│   ├── constants.ts        # Application constants
│   └── utils.ts            # Utility functions
├── stores/
│   ├── auth-store.ts       # Auth state (persisted)
│   └── app-store.ts        # App state (sidebar, mock mode)
├── hooks/
│   ├── use-settings.ts     # Settings hooks
│   ├── use-toast.ts        # Toast notifications
│   └── use-mobile.ts       # Mobile detection
└── types/
    └── index.ts            # TypeScript types
```

## 🔐 Default Login

### Mock Mode (Development)
- **Username**: `admin`
- **Password**: `admin123`
- Role: SuperAdmin

### Other Demo Accounts
| Username | Password | Role |
|----------|----------|------|
| sales1 | admin123 | Sales |
| manager | admin123 | Manager |
| driver1 | admin123 | Driver |

⚠️ Segera ganti password setelah login pertama di production!

## 🔄 Alur Kerja Aplikasi

### Alur Transaksi & Pengiriman

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Invoice 1  │────▶│  Delivery   │────▶│  Fulfilled  │
│  (UNFULFILLED)    │  Process    │     │  Status     │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ Jika partial delivery
       ▼
┌─────────────┐     ┌─────────────┐
│  Invoice 2  │────▶│  PARTIAL    │
│  (Fulfillment)    │  Status     │
└─────────────┘     └─────────────┘
```

### Alur Harga Customer

```
Buat Invoice
     │
     ▼
Pilih Customer
     │
     ▼
Pilih Product
     │
     ├─▶ Cek Customer Prices ─▶ Ada? ─▶ Gunakan Harga Khusus + Diskon
     │                              │
     │                              ▼
     │                           Tidak Ada?
     │                              │
     ▼                              ▼
                           Gunakan Harga Normal Product
```

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Full CRUD master data (Users, Customers, Products, Drivers, Vehicles)
- ✅ Customer Prices management
- ✅ Transaction management dengan fulfillment tracking
- ✅ Delivery management
- ✅ Target penjualan
- ✅ Dashboard dengan statistics
- ✅ Settings page
- ✅ Mock mode untuk development
- ✅ Responsive design (mobile-friendly)
- ✅ Dark/Light mode

## 📄 License

MIT License

---

**Developed with ❤️ using Next.js, TypeScript, and shadcn/ui**
