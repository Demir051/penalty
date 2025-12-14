# Deployment Guide - Netlify (Frontend) + Render (Backend)

## Environment Variables

### Backend (Render)
Render dashboard'da Environment Variables ekle:
```env
MONGODB_URI=mongodb+srv://dummy:12345@penalty.myusllf.mongodb.net/penalty?retryWrites=true&w=majority
JWT_SECRET=your-very-secure-secret-key-here-change-this
NODE_ENV=production
FRONTEND_URL=https://your-netlify-app.netlify.app
PORT=10000
```

### Frontend (Netlify)
Netlify dashboard'da Site settings > Environment variables:
```env
VITE_API_URL=https://your-render-backend.onrender.com
```

## Backend (Render) Setup

1. Render'da yeni Web Service oluştur
2. Repository'yi bağla
3. Build Command: `cd backend && npm install`
4. Start Command: `cd backend && npm start`
5. Root Directory: `backend` (eğer monorepo ise)
6. Environment variables'ı ekle (yukarıdaki gibi)

**ÖNEMLİ:** Render'da backend URL'i şu formatta olacak:
- `https://your-app-name.onrender.com`

## Frontend (Netlify) Setup

1. Netlify'da yeni site oluştur
2. Repository'yi bağla
3. Build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
4. Environment variables ekle:
   - `VITE_API_URL=https://your-render-backend.onrender.com`

**ÖNEMLİ:** `_redirects` dosyası `frontend/public/` klasöründe olmalı (zaten var)

## CORS Ayarları

Backend'deki `server.js` dosyasında:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

Render'da `FRONTEND_URL` environment variable'ını Netlify URL'in olarak ayarla:
```
FRONTEND_URL=https://your-netlify-app.netlify.app
```

## API URL Yapılandırması

Frontend'de tüm API çağrıları `/api` prefix'i ile yapılıyor:
- `axios.post('/api/auth/login', ...)`
- `axios.get('/api/tasks', ...)`

BaseURL ayarı:
- Development: `http://localhost:5000`
- Production: Render backend URL'i (VITE_API_URL'den gelir)

## Test Checklist

### Backend (Render)
- [ ] Render'da service çalışıyor mu?
- [ ] Health check: `https://your-backend.onrender.com/api/health`
- [ ] MongoDB bağlantısı çalışıyor mu? (Render logs'da "MongoDB connected" görünmeli)
- [ ] CORS ayarları doğru mu?

### Frontend (Netlify)
- [ ] Netlify'da site deploy edildi mi?
- [ ] `_redirects` dosyası build'e dahil mi?
- [ ] Environment variable `VITE_API_URL` ayarlandı mı?
- [ ] Login çalışıyor mu?
- [ ] Tüm route'lar çalışıyor mu? (`/dashboard`, `/dashboard/tasks`, vb.)

## Troubleshooting

### "Route not found" hatası
- Netlify'da `_redirects` dosyası `frontend/public/` klasöründe olmalı
- Build sonrası `dist` klasöründe `_redirects` dosyası olmalı
- Netlify'da "Redirects and rewrites" ayarlarını kontrol et

### "Login failed" hatası
1. Browser console'da API URL'i kontrol et
2. Render backend URL'i doğru mu?
3. CORS hatası var mı? (Network tab'de kontrol et)
4. Backend loglarını kontrol et (Render dashboard)

### CORS hatası
- Render'da `FRONTEND_URL` environment variable'ı Netlify URL'in olarak ayarlı mı?
- Backend'de CORS ayarları doğru mu?

### API bağlantı hatası
- `VITE_API_URL` Netlify'da doğru ayarlı mı?
- Render backend çalışıyor mu?
- Network tab'de istek gidiyor mu?

## Render Özel Notlar

- Render'da free tier'da service 15 dakika idle kalırsa uykuya geçer
- İlk istekte 30-60 saniye gecikme olabilir (cold start)
- Production için paid plan önerilir

## Netlify Özel Notlar

- `_redirects` dosyası otomatik çalışır
- Build sırasında environment variables kullanılır
- Deploy preview'lar için ayrı environment variables ayarlanabilir

## Production Checklist

- [ ] JWT_SECRET güçlü ve unique
- [ ] MongoDB connection string güvenli
- [ ] CORS sadece Netlify domain'ini içeriyor
- [ ] Rate limiting aktif
- [ ] Error messages production'da detaylı bilgi vermiyor
- [ ] Admin şifresi değiştirildi
- [ ] HTTPS kullanılıyor (otomatik)
- [ ] Environment variables güvenli şekilde saklanıyor

## Test Admin User

Eğer admin kullanıcısı yoksa, Render'da backend service'i başlat ve:

```bash
# Render'da shell aç veya local'de test et
cd backend
node scripts/seed.js
```

Bu script admin kullanıcısı oluşturur:
- Username: `admin`
- Password: `123`
- Role: `admin`

**ÖNEMLİ:** Production'da şifreyi değiştirin!

