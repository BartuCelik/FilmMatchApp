# 🎬 FilmMatchApp

"Ne izlesek?" sorusuna iki kişilik cevap: aynı odaya girin, filmleri sağa/sola kaydırın, ikinizin de beğendiği film eşleşme olsun.

## Özellikler

- **Kayıtsız giriş**: Firebase anonim oturum, isim + avatar yeterli.
- **6 haneli oda kodu**: Biri odayı kurar, diğeri kodla katılır; her şey Firestore üzerinden gerçek zamanlı senkron.
- **Modlar**
  - **Film / Dizi**: TMDB popüler ve en yüksek puanlı listeleri.
  - **Bize Seç** (AI kürasyon): İki kişi de ruh hali, enerji seviyesi ve kırmızı çizgilerini girer; Cloudflare Workers AI ikinize özel 8 filmlik bir havuz hazırlar (2 sizin, 2 partnerinizin, 4 ortak zevk). Filmler TMDB'de doğrulanır, posterler ve izleme platformları gerçek veridir.
- **Eşleşme**: İkinizin de sağa kaydırdığı filmler anında bildirilir.
- **Görünüm ve dil**: "Kadife Perde" koyu tema (bordo, kadife kırmızısı, altın; başlıklarda DM Serif Display); TR, EN, DE, ES, FR, IT, RU.

## Teknik yapı

| Katman | Teknoloji |
|---|---|
| Uygulama | React Native (Expo SDK 54) |
| Veri / Auth | Firebase Firestore + Anonymous Auth |
| AI Kürasyon | Cloudflare Worker + Workers AI (`worker/`, ücretsiz plan) |
| Film verisi | TMDB API |

AI anahtarı uygulamaya hiç girmez: host cihaz iki kullanıcının cevaplarını Worker'a (`POST /curate`) gönderir, Worker Workers AI'dan film listesini alır, TMDB'de doğrular ve havuzu döner; host bunu `moviePool` alanına yazar.

```
src/
├── components/   Ortak UI bileşenleri (AppButton, AppText, IconSquare, SurfaceCard, WedgeBackground, ...)
├── constants/    Renkler (tek renk kaynağı: Colors.js), fontlar, avatarlar
├── context/      Dil tercihi
├── hooks/        useI18n, useSessionDisbandSync
├── i18n/         Çeviri metinleri
├── navigation/   Stack navigator
├── screens/      Home, JoinRoomCode, ModeSelection, AiCurationQuestions, Swipe
└── services/     Firebase, TMDB, oturum servisi
worker/           Cloudflare Worker: AI kürasyon (Workers AI + TMDB)
```

## Kurulum

1. Bağımlılıklar: `npm install` ve `cd worker && npm install`
2. `.env.example` dosyasını `.env` olarak kopyalayıp Firebase ve TMDB değerlerini girin.
3. Uygulama: `npx expo start`

### AI Kürasyon için (bir kez)

1. Ücretsiz bir Cloudflare hesabı açın (kart gerekmez).
2. `cd worker && npx wrangler login`
3. `npx wrangler secret put TMDB_API_KEY`
4. `npx wrangler deploy`
5. Çıkan URL'yi `.env` dosyasına `EXPO_PUBLIC_CURATION_URL` olarak yazın (sonu `/curate` olmalı).
6. `npm install -g firebase-tools`
7. `firebase login`
8. `firebase use --add`
9. `firebase deploy --only firestore:rules` (Spark planında çalışır).

Worker testleri: `cd worker && npm test`
Renk kontrolü: `npm run check:theme` (`Colors.js` dışında hex renk / indigo olmamalı, mod çevirileri 7 dilde olmalı)

## Yol haritası

- [x] Firebase & anonim giriş
- [x] 6 haneli kod ile oda senkronu
- [x] UI/UX ve çoklu dil
- [x] AI kürasyon (Workers AI + TMDB), Worker canlıda
- [x] Kadife Perde yeniden tasarımı (kod tamam)
- [ ] Cihazda uçtan uca test (aşağıya bakın)
- [x] Swipe ve eşleşme mantığı
- [ ] Eşleşme animasyonu ve sonuç ekranı

## Kaldığımız yer (18 Kasım 2026)

**Durum:** Kod tamam, PR açık ama taslak: [#9](https://github.com/BartuCelik/FilmMatchApp/pull/9) (branch `feature/ai-curation-swipe-overhaul`). Eksik olan tek şey cihazda deneme.

**Bugün yapılanlar**
- **Worker canlıda:** `https://filmmatch-curation.bartu-filmmatch.workers.dev/curate`
  - Test isteğine 8 filmlik havuz döndü. Llama'nın JSON çıktısı sorunsuz.
  - İlk denemedeki 502 hatası, TMDB secret'ının yanlış yapıştırılmasından kaynaklanıyordu. Secret düzeltildi.
  - Worker artık TMDB hatalarını logluyor: `cd worker && npx wrangler tail`
- **Gemini kararı:** alınan Gemini aboneliği API erişimi vermiyor. Llama yeterli olduğu için Gemini'ye geçilmedi.
- **"Kadife Perde" yeniden tasarımı:**
  - Indigo "yapay zeka uygulaması" görünümü kaldırıldı; yerine bordo zemin `#170E10`, kadife kırmızısı `#D23C43` ve altın `#D9A441` geldi.
  - Uygulama artık sadece koyu temada çalışıyor; tema düğmesi kaldırıldı.
  - Başlıklarda DM Serif Display kullanılıyor.
  - Ekranlarda çapraz kırmızı kesit, kartlar ve kare ikon butonlar var.
  - "AI Kürasyon" modunun adı **"Bize Seç"** oldu.
  - Swipe ekranında arkada üst üste kartlar var ve kart yüksekliği ekrana göre ayarlanıyor.
  - Tasarım belgesi: `docs/superpowers/specs/2026-11-18-kadife-perde-redesign-design.md`
  - Uygulama planı: `docs/superpowers/plans/2026-11-18-kadife-perde-redesign.md`
- **Kontroller:** `npm run check:theme` geçiyor, Android derlemesi alınıyor, worker testleri 17/17 geçiyor.

**Sıradaki adımlar**
1. `.env` dosyasına şunu ekle: `EXPO_PUBLIC_CURATION_URL=https://filmmatch-curation.bartu-filmmatch.workers.dev/curate`
2. Firestore kurallarını yayınla: `npx firebase-tools login`, sonra `npx firebase-tools use --add` (projeyi seç), sonra `npx firebase-tools deploy --only firestore:rules`
3. `npx expo start -c` ile uygulamayı açıp iki cihazla dene: oda kur → katıl → Bize Seç → iki taraf da cevaplasın → swipe. Bir kez de Türkçe dışında bir dil seç.
4. Görünüme bak:
   - Liste ekranlarındaki kırmızı kesit fazla soluk mu? Ayarı `src/components/common/WedgeBackground.js` içinde, `OPACITY.list` şu an 0.3.
   - Küçük ekranlı bir telefonda swipe kartı düzgün görünüyor mu?
5. Her şey yolundaysa PR #9'da "Ready for review" de ve `master`'a birleştir.
6. Sonraki özellik: eşleşme animasyonu ve sonuç ekranı.

**Bilinen sınırlar ve küçük notlar**
- Workers AI'ın ücretsiz kotası günde yaklaşık 50 kürasyona yetiyor (tahmin).
- Oda sahibi film üretilirken ekrandan çıkarsa oda "hazırlanıyor" durumunda kalabilir.
- Mod seçimi ve sorular ekranındaki bazı metinler hâlâ koda gömülü Türkçe/İngilizce.
- Rusça çeviriler karışık: yeni eklenenlerin bir kısmı Kiril alfabesiyle, eskiler Latin harfleriyle yazılmış.
- `graphify-out/` ve `.vscode/` takip edilmiyor. VS Code'da görünen "19 değişiklik" bunlar; istenirse `.gitignore`'a eklenebilir.

Developed by Bartu Celik
