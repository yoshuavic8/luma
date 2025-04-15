# AppIcons untuk Luma

Folder ini berisi ikon aplikasi Luma dalam berbagai ukuran untuk mendukung berbagai platform dan perangkat.

## Struktur Folder

```
AppIcons/
├── ios/                  # Ikon untuk iOS
│   ├── icon-20.png       # 20x20
│   ├── icon-20@2x.png    # 40x40
│   ├── icon-20@3x.png    # 60x60
│   ├── icon-29.png       # 29x29
│   ├── icon-29@2x.png    # 58x58
│   ├── icon-29@3x.png    # 87x87
│   ├── icon-40.png       # 40x40
│   ├── icon-40@2x.png    # 80x80
│   ├── icon-40@3x.png    # 120x120
│   ├── icon-60@2x.png    # 120x120
│   ├── icon-60@3x.png    # 180x180
│   ├── icon-76.png       # 76x76
│   ├── icon-76@2x.png    # 152x152
│   ├── icon-83.5@2x.png  # 167x167
│   └── icon-1024.png     # 1024x1024
├── android/              # Ikon untuk Android
│   ├── mipmap-mdpi/      # ~160dpi
│   │   └── ic_launcher.png  # 48x48
│   ├── mipmap-hdpi/      # ~240dpi
│   │   └── ic_launcher.png  # 72x72
│   ├── mipmap-xhdpi/     # ~320dpi
│   │   └── ic_launcher.png  # 96x96
│   ├── mipmap-xxhdpi/    # ~480dpi
│   │   └── ic_launcher.png  # 144x144
│   └── mipmap-xxxhdpi/   # ~640dpi
│       └── ic_launcher.png  # 192x192
├── favicon/              # Favicon untuk web
│   ├── favicon.ico       # Multi-size favicon
│   ├── favicon-16x16.png # 16x16
│   ├── favicon-32x32.png # 32x32
│   └── favicon-96x96.png # 96x96
└── pwa/                  # Ikon untuk Progressive Web App
    ├── apple-touch-icon.png  # 180x180
    └── maskable-icon.png     # 512x512
```

## Cara Menggunakan

### iOS

Untuk menggunakan ikon iOS dalam aplikasi React Native atau aplikasi iOS native, Anda perlu menambahkan ikon-ikon ini ke `Assets.xcassets` di proyek Xcode Anda.

### Android

Untuk Android, salin file `ic_launcher.png` ke folder `mipmap-*` yang sesuai di proyek Android Anda.

### Web (Favicon)

Untuk menggunakan favicon di aplikasi web, tambahkan tag berikut di bagian `<head>` dari file HTML Anda:

```html
<link rel="icon" type="image/x-icon" href="/assets/images/logo/AppIcons/favicon/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/images/logo/AppIcons/favicon/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/images/logo/AppIcons/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/assets/images/logo/AppIcons/favicon/favicon-96x96.png">
```

### Progressive Web App (PWA)

Untuk PWA, tambahkan informasi berikut ke file `manifest.json` Anda:

```json
{
  "icons": [
    {
      "src": "/assets/images/logo/AppIcons/pwa/maskable-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/assets/images/logo/AppIcons/favicon/favicon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    }
  ]
}
```

Dan tambahkan tag berikut di bagian `<head>` dari file HTML Anda:

```html
<link rel="apple-touch-icon" href="/assets/images/logo/AppIcons/pwa/apple-touch-icon.png">
```

## Menghasilkan Ikon

Untuk menghasilkan semua ukuran ikon yang diperlukan, Anda dapat menggunakan alat seperti:

1. [App Icon Generator](https://appicon.co/) - Alat online untuk menghasilkan ikon iOS dan Android
2. [Favicon Generator](https://realfavicongenerator.net/) - Alat untuk menghasilkan favicon yang kompatibel dengan semua browser
3. [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) - Alat untuk menghasilkan aset PWA

Cukup unggah gambar logo berkualitas tinggi (idealnya 1024x1024 atau lebih besar) ke alat-alat ini, dan mereka akan menghasilkan semua ukuran yang diperlukan.

## Praktik Terbaik

- Gunakan gambar PNG dengan transparansi untuk ikon aplikasi
- Pastikan ikon memiliki padding yang cukup di sekitarnya (biasanya 10-15% dari ukuran total)
- Gunakan gambar dengan resolusi tinggi sebagai sumber (minimal 1024x1024)
- Pastikan ikon terlihat baik pada background terang dan gelap
- Uji ikon pada berbagai perangkat dan platform untuk memastikan tampilan yang konsisten
