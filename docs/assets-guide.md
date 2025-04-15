# Panduan Aset Luma

Dokumen ini menjelaskan struktur folder untuk aset statis seperti gambar, logo, dan file media lainnya dalam aplikasi Luma.

## Struktur Folder

Semua aset statis disimpan dalam folder `public` dengan struktur sebagai berikut:

```
public/
└── assets/
    ├── images/
    │   ├── logo/
    │   │   ├── luma-logo.png       # Logo utama (default)
    │   │   ├── luma-logo-light.png # Logo untuk background gelap
    │   │   ├── luma-logo-dark.png  # Logo untuk background terang
    │   │   └── AppIcons/           # Ikon aplikasi untuk berbagai platform
    │   │       ├── ios/            # Ikon untuk iOS
    │   │       │   ├── icon-20.png
    │   │       │   ├── icon-29.png
    │   │       │   ├── icon-40.png
    │   │       │   ├── icon-60.png
    │   │       │   ├── icon-76.png
    │   │       │   └── icon-1024.png
    │   │       ├── android/        # Ikon untuk Android
    │   │       │   ├── mipmap-mdpi/
    │   │       │   ├── mipmap-hdpi/
    │   │       │   ├── mipmap-xhdpi/
    │   │       │   ├── mipmap-xxhdpi/
    │   │       │   └── mipmap-xxxhdpi/
    │   │       ├── favicon/        # Favicon untuk web
    │   │       │   ├── favicon.ico
    │   │       │   ├── favicon-16x16.png
    │   │       │   ├── favicon-32x32.png
    │   │       │   └── favicon-96x96.png
    │   │       └── pwa/            # Ikon untuk Progressive Web App
    │   │           ├── apple-touch-icon.png
    │   │           └── maskable-icon.png
    │   ├── icons/
    │   │   └── ...                 # Ikon-ikon kustom
    │   └── backgrounds/
    │       └── ...                 # Gambar latar belakang
    └── fonts/
        └── ...                     # Font kustom (jika ada)
```

## Menggunakan Logo

Kami telah membuat komponen Logo yang dapat digunakan di seluruh aplikasi. Komponen ini mendukung berbagai ukuran dan varian.

### Contoh Penggunaan

```jsx
import { Logo } from "@/components/ui/logo"

// Logo default dengan ukuran medium
<Logo />

// Logo dengan ukuran kecil
<Logo size="sm" />

// Logo dengan ukuran besar dan varian terang (untuk background gelap)
<Logo size="lg" variant="light" />

// Logo dengan link ke halaman beranda
<Logo href="/" />
```

### Props

Komponen Logo menerima props berikut:

- `variant`: Varian logo yang akan digunakan
  - `"default"`: Logo utama (default)
  - `"light"`: Logo untuk background gelap
  - `"dark"`: Logo untuk background terang

- `size`: Ukuran logo
  - `"sm"`: Kecil (100 x 40 px)
  - `"md"`: Medium (150 x 60 px) - default
  - `"lg"`: Besar (200 x 80 px)

- `href`: URL tujuan jika logo diklik (opsional)
  - Jika disediakan, logo akan dibungkus dalam komponen `Link`
  - Default: `"/"`

## Menambahkan Aset Baru

Untuk menambahkan aset baru:

1. Tempatkan file dalam folder yang sesuai berdasarkan jenisnya
2. Gunakan penamaan yang konsisten dan deskriptif
3. Optimalkan gambar sebelum menambahkannya ke repositori (kompresi, ukuran yang sesuai)

## Mengakses Aset dalam Kode

Aset dalam folder `public` dapat diakses melalui URL relatif:

```jsx
// Menggunakan komponen Image dari Next.js
import Image from "next/image"

<Image
  src="/assets/images/backgrounds/hero.jpg"
  alt="Hero Background"
  width={1200}
  height={600}
/>

// Menggunakan tag img HTML biasa
<img src="/assets/images/icons/custom-icon.svg" alt="Custom Icon" />
```

## Praktik Terbaik

- Gunakan format gambar yang sesuai:
  - PNG untuk gambar dengan transparansi
  - SVG untuk ikon dan logo (jika memungkinkan)
  - JPEG/WebP untuk foto dan gambar kompleks
- Sediakan varian logo untuk background terang dan gelap
- Optimalkan ukuran file untuk performa yang lebih baik

## AppIcons

Folder `AppIcons` berisi ikon aplikasi dalam berbagai ukuran untuk mendukung berbagai platform dan perangkat. Struktur ini penting untuk memastikan aplikasi Anda terlihat profesional di semua platform.

### iOS Icons

iOS memerlukan beberapa ukuran ikon untuk mendukung berbagai perangkat dan konteks:

- `icon-20.png` (20x20) - Digunakan untuk Spotlight di iOS
- `icon-29.png` (29x29) - Digunakan untuk Settings di iOS
- `icon-40.png` (40x40) - Digunakan untuk Spotlight di iOS
- `icon-60.png` (60x60) - Digunakan untuk aplikasi di iPhone
- `icon-76.png` (76x76) - Digunakan untuk aplikasi di iPad
- `icon-1024.png` (1024x1024) - Digunakan untuk App Store

Setiap ukuran juga memiliki versi @2x dan @3x untuk perangkat dengan resolusi tinggi.

### Android Icons

Android menggunakan sistem "mipmap" untuk menyimpan ikon dalam berbagai densitas:

- `mipmap-mdpi` - Untuk perangkat dengan densitas medium (~160dpi)
- `mipmap-hdpi` - Untuk perangkat dengan densitas tinggi (~240dpi)
- `mipmap-xhdpi` - Untuk perangkat dengan densitas sangat tinggi (~320dpi)
- `mipmap-xxhdpi` - Untuk perangkat dengan densitas sangat-sangat tinggi (~480dpi)
- `mipmap-xxxhdpi` - Untuk perangkat dengan densitas sangat-sangat-sangat tinggi (~640dpi)

### Favicon

Favicon adalah ikon kecil yang ditampilkan di tab browser. Beberapa ukuran yang umum digunakan:

- `favicon.ico` - Format tradisional untuk favicon (biasanya berisi beberapa ukuran)
- `favicon-16x16.png` - Untuk browser modern
- `favicon-32x32.png` - Untuk browser modern
- `favicon-96x96.png` - Untuk browser modern

### PWA Icons

Progressive Web App (PWA) memerlukan ikon khusus:

- `apple-touch-icon.png` - Untuk perangkat Apple saat aplikasi ditambahkan ke home screen
- `maskable-icon.png` - Ikon yang dapat dimasking untuk platform yang mendukung
- `splash-screens/` - Gambar splash screen untuk berbagai ukuran perangkat

### Menghasilkan AppIcons

Untuk menghasilkan semua ukuran ikon yang diperlukan, Anda dapat menggunakan alat seperti:

1. [App Icon Generator](https://appicon.co/) - Alat online untuk menghasilkan ikon iOS dan Android
2. [Favicon Generator](https://realfavicongenerator.net/) - Alat untuk menghasilkan favicon yang kompatibel dengan semua browser
3. [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) - Alat untuk menghasilkan aset PWA

Cukup unggah gambar logo berkualitas tinggi (idealnya 1024x1024 atau lebih besar) ke alat-alat ini, dan mereka akan menghasilkan semua ukuran yang diperlukan.
