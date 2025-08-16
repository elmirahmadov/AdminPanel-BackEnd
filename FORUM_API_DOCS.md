# Anime Hunt API Dokümantasyonu

## Genel Bilgiler

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT token gerekli (Authorization header)
- **Content-Type**: `application/json`

---

# Forum Sistemi API Dokümantasyonu

## Genel Bilgiler

- **Base URL**: `http://localhost:5000/api/forums`
- **Authentication**: JWT token gerekli (Authorization header)
- **Content-Type**: `application/json`

## 🔐 Admin Panel API'ları (Sadece Admin/Moderatör)

### Forum Yönetimi

```http
GET    /api/forums/admin                    # Tüm forumları getir (aktif + pasif)
POST   /api/forums/admin                    # Forum oluştur
PUT    /api/forums/admin/:id                # Forum güncelle
DELETE /api/forums/admin/:id                # Forum sil
```

**Request Body (Forum Oluştur):**

```json
{
  "title": "Yeni Forum",
  "description": "Forum açıklaması",
  "category": "anime",
  "rules": "Forum kuralları",
  "icon": "forum-icon.png",
  "order": 1
}
```

### Forum Kategorileri

```http
POST   /api/forums/admin/categories         # Kategori oluştur
PUT    /api/forums/admin/categories/:id     # Kategori güncelle
DELETE /api/forums/admin/categories/:id     # Kategori sil
```

**Request Body (Kategori Oluştur):**

```json
{
  "name": "Kategori Adı",
  "description": "Kategori açıklaması",
  "order": 1
}
```

### İçerik Moderasyonu

```http
DELETE /api/forums/admin/topics/:id         # Konu sil (Moderatör)
DELETE /api/forums/admin/posts/:id          # Yanıt sil (Moderatör)
```

---

# Period (Mevsim) API Dokümantasyonu

## Genel Bilgiler

- **Base URL**: `http://localhost:5000/api/periods`
- **Authentication**: JWT token gerekli (Admin/Moderator işlemleri için)
- **Content-Type**: `application/json`

## 📋 Period Endpoints

### Tüm Dönemleri Listele

```http
GET /api/periods
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "İlkbahar 2024",
    "slug": "ilkbahar-2024",
    "description": "2024 İlkbahar anime sezonu",
    "startYear": 2024,
    "endYear": null,
    "imageUrl": "spring-2024.jpg",
    "order": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "animeCount": 45,
    "episodeCount": 540
  }
]
```

### Belirli Dönemi Getir

```http
GET /api/periods/:id
```

**Response:**

```json
{
  "id": 1,
  "name": "İlkbahar 2024",
  "slug": "ilkbahar-2024",
  "description": "2024 İlkbahar anime sezonu",
  "startYear": 2024,
  "endYear": null,
  "imageUrl": "spring-2024.jpg",
  "order": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "animes": [
    {
      "id": 1,
      "title": "Anime Adı",
      "categories": [...],
      "episodes": [...],
      "seasons": [...]
    }
  ],
  "animeCount": 45,
  "episodeCount": 540
}
```

### Yeni Dönem Oluştur (Admin)

```http
POST /api/periods
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**

```json
{
  "name": "Yaz 2024",
  "slug": "yaz-2024",
  "description": "2024 Yaz anime sezonu",
  "startYear": 2024,
  "endYear": null,
  "order": 2
}
```

**File Upload:**

- `image`: Dönem görseli (opsiyonel)

### Dönem Güncelle (Admin)

```http
PUT /api/periods/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Dönem Sil (Admin)

```http
DELETE /api/periods/:id
Authorization: Bearer <token>
```

### Döneme Anime Ekle (Moderator)

```http
POST /api/periods/:id/animes/:animeId
Authorization: Bearer <token>
```

### Dönemden Anime Çıkar (Moderator)

```http
DELETE /api/periods/:id/animes/:animeId
Authorization: Bearer <token>
```

---

## 👥 Client API'ları (Tüm Kullanıcılar)

### Forum Görüntüleme

```http
GET    /api/forums                    # Forum listesi
GET    /api/forums/search             # Forum arama
GET    /api/forums/categories         # Kategori listesi
```

**Query Parameters (Arama):**

```
?category=anime&search=anime&page=1&limit=20
```

### Konu İşlemleri

```http
GET    /api/forums/categories/:id/topics  # Kategoriye ait konular
GET    /api/forums/topics                 # Tüm konular
POST   /api/forums/topics                 # Konu oluştur
PUT    /api/forums/topics/:id             # Konu güncelle (sadece kendi konusu)
```

**Request Body (Konu Oluştur):**

```json
{
  "categoryId": 1, // Opsiyonel: Kategori ID'si
  "forumId": "forum_id", // Opsiyonel: Forum ID'si (en az biri gerekli)
  "title": "Konu Başlığı",
  "content": "Konu içeriği",
  "tags": ["anime", "favori"] // Opsiyonel: Etiketler
}
```

### Yanıt İşlemleri

```http
GET    /api/forums/topics/:id/posts   # Konudaki yanıtlar
GET    /api/forums/posts              # Tüm yanıtlar
POST   /api/forums/posts              # Yanıt oluştur
PUT    /api/forums/posts/:id          # Yanıt güncelle (sadece kendi yanıtı)
```

**Request Body (Yanıt Oluştur):**

```json
{
  "topicId": 1,
  "content": "Yanıt içeriği"
}
```

---

## 📊 Response Örnekleri

### Forum Listesi

```json
[
  {
    "id": "forum_id",
    "title": "Anime Tartışma",
    "description": "Anime hakkında tartışmalar",
    "category": "anime",
    "isActive": true,
    "topicCount": 15,
    "postCount": 120,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### Konu Listesi

```json
[
  {
    "id": 1,
    "title": "En sevdiğiniz anime?",
    "content": "Hangi animeyi en çok seviyorsunuz?",
    "userId": 1,
    "categoryId": 1,
    "viewCount": 25,
    "postCount": 8,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

## 🔒 Güvenlik ve Yetkilendirme

| İşlem                | Gerekli Rol | Açıklama                  |
| -------------------- | ----------- | ------------------------- |
| Forum görüntüleme    | -           | Herkes erişebilir         |
| Konu oluşturma       | USER        | Giriş yapmış kullanıcılar |
| Konu güncelleme      | USER        | Sadece kendi konusu       |
| Admin forum yönetimi | ADMIN       | Sadece admin              |
| Admin konu yönetimi  | MODERATOR   | Moderatör ve üstü         |
| Admin içerik silme   | MODERATOR   | Moderatör ve üstü         |

---

## 📝 Kullanım Örnekleri

### 1. Forum Listesi Getirme

```javascript
const forums = await fetch("/api/forums", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 2. Yeni Konu Oluşturma

```javascript
const topic = await fetch("/api/forums/topics", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    categoryId: 1,
    title: "En sevdiğiniz anime?",
    content: "Hangi animeyi en çok seviyorsunuz?",
  }),
});
```

### 3. Admin: Tüm Forumları Getirme

```javascript
const forums = await fetch("/api/forums/admin", {
  method: "GET",
  headers: {
    Authorization: "Bearer " + adminToken,
    "Content-Type": "application/json",
  },
});
```

### 4. Admin: Forum Oluşturma

```javascript
const forum = await fetch("/api/forums/admin", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + adminToken,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Manga Tartışma",
    description: "Manga hakkında tartışmalar",
    category: "manga",
  }),
});
```

### 5. Admin: Konu Oluşturma

```javascript
const topic = await fetch("/api/forums/admin/topics", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + moderatorToken,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    forumId: "cmecqii520001ugcktkzar6dv", // Forum ID'si
    title: "Admin Konusu",
    content: "Admin tarafından oluşturulan konu",
    tags: ["admin", "önemli"],
  }),
});
```

### 6. Admin: İçerik Silme

```javascript
// Tüm konuları getir (admin için)
const topics = await fetch("/api/forums/admin/topics", {
  method: "GET",
  headers: {
    Authorization: "Bearer " + adminToken,
    "Content-Type": "application/json",
  },
});

// Belirli konuyu getir
const topic = await fetch("/api/forums/admin/topics/123", {
  method: "GET",
  headers: {
    Authorization: "Bearer " + moderatorToken,
    "Content-Type": "application/json",
  },
});

// Konu güncelle (admin için)
const updatedTopic = await fetch("/api/forums/admin/topics/123", {
  method: "PUT",
  headers: {
    Authorization: "Bearer " + moderatorToken,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Güncellenmiş Başlık",
    content: "Güncellenmiş içerik",
  }),
});

// Konu silme (Moderatör)
await fetch("/api/forums/admin/topics/123", {
  method: "DELETE",
  headers: {
    Authorization: "Bearer " + moderatorToken,
  },
});

// Yanıt silme (Moderatör)
await fetch("/api/forums/admin/posts/456", {
  method: "DELETE",
  headers: {
    Authorization: "Bearer " + moderatorToken,
  },
});
```

### 7. Admin: Konu Moderasyonu

```javascript
// Konu sabitle/kaldır
await fetch("/api/forums/admin/topics/123/pin", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer " + moderatorToken,
    "Content-Type": "application/json",
  },
});

// Konu kilitle/aç
await fetch("/api/forums/admin/topics/123/lock", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer " + moderatorToken,
    "Content-Type": "application/json",
  },
});

// Konu yapışkan yap/kaldır
await fetch("/api/forums/admin/topics/123/sticky", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer " + moderatorToken,
    "Content-Type": "application/json",
  },
});
```

---

## ⚠️ Hata Kodları

| HTTP Status | Açıklama                         |
| ----------- | -------------------------------- |
| 200         | Başarılı                         |
| 201         | Oluşturuldu                      |
| 400         | Hatalı istek                     |
| 401         | Yetkilendirme gerekli            |
| 403         | Erişim reddedildi (rol yetersiz) |
| 404         | Bulunamadı                       |
| 500         | Sunucu hatası                    |

---

## 🎯 Özet

**Toplam Endpoint Sayısı: 23**

### **Client API'ları (12 endpoint)**

- **Base URL**: `/api/forums`
- Forum görüntüleme, konu işlemleri, yanıt işlemleri

### **Admin API'ları (11 endpoint)**

- **Base URL**: `/api/forums/admin`
- Forum yönetimi, konu yönetimi, konu moderasyonu, içerik moderasyonu

### **Avantajlar:**

✅ **Güvenlik**: Admin endpoint'leri ayrı, daha güvenli
✅ **Organizasyon**: Client ve admin işlemleri net ayrılmış
✅ **Bakım**: Admin işlemleri tek yerden yönetilebilir
✅ **Monitoring**: Admin API'ları ayrı izlenebilir
✅ **Rate Limiting**: Admin ve client için farklı limitler uygulanabilir

Bu yapı ile admin panel ve client tarafı tamamen ayrılmış, güvenlik maksimum seviyeye çıkarılmıştır! 🚀
