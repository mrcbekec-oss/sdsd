# Zaman Ötesi Bağlantı (Timeless Connection)

Bu oyun, iki oyuncunun farklı zaman dilimlerinde (Geçmiş ve Gelecek) işbirliği yaparak bulmacaları çözdüğü hikaye tabanlı bir online oyundur.

## Proje Yapısı

- **Root (Ana Dizin)**: Frontend (Vite + React) dosyaları. Vercel/GitHub doğrudan buradan çalışır.
- `server/`: Oyuncular arası bağlantıyı sağlayan Socket.io sunucusu.

## Nasıl Çalıştırılır?

### 1. Sunucuyu Başlatma (Backend)
```bash
cd server
npm install
node server.cjs
```

### 2. Oyunu Başlatma (Frontend)
```bash
npm install
npm run dev -- --host
```

## Yayına Alma (Vercel)
Vercel'e yüklerken hiçbir ayar yapmanıza gerek yok. Projeyi seçin ve **Deploy**'a basın. Ana dizindeki dosyaları otomatik olarak tanıyacaktır.
