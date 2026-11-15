# 🎬 FilmMatchApp

"Ne izlesek?" sorusuna iki kişilik cevap: aynı odaya girin, filmleri sağa/sola kaydırın, ikinizin de beğendiği film eşleşme olsun.

## Özellikler

- **Kayıtsız giriş**: Firebase anonim oturum, isim + avatar yeterli.
- **6 haneli oda kodu**: Biri odayı kurar, diğeri kodla katılır; her şey Firestore üzerinden gerçek zamanlı senkron.
- **Modlar**
  - **Film / Dizi**: TMDB popüler ve en yüksek puanlı listeleri.
  - **AI Kürasyon**: İki kişi de ruh hali, enerji seviyesi ve kırmızı çizgilerini girer; Cloudflare Workers AI ikinize özel 8 filmlik bir havuz hazırlar (2 sizin, 2 partnerinizin, 4 ortak zevk). Filmler TMDB'de doğrulanır, posterler ve izleme platformları gerçek veridir.
- **Eşleşme**: İkinizin de sağa kaydırdığı filmler anında bildirilir.
- **Tema ve dil**: Açık/koyu tema; TR, EN, DE, ES, FR, IT, RU.

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
├── components/   Ortak UI bileşenleri (AppButton, AppText, ...)
├── constants/    Renkler, avatarlar
├── context/      Tema / dil tercihleri
├── hooks/        useI18n, useSessionDisbandSync
├── i18n/         Çeviri metinleri
├── navigation/   Stack navigator
├── screens/      Home, JoinRoomCode, ModeSelection, AiCurationQuestions, Swipe
├── services/     Firebase, TMDB, oturum servisi
└── theme/        Paletler
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

## Yol haritası

- [x] Firebase & anonim giriş
- [x] 6 haneli kod ile oda senkronu
- [x] UI/UX, tema ve çoklu dil
- [x] AI kürasyon kodu (Workers AI + TMDB)
- [ ] AI kürasyon deploy ve canlı test (aşağıya bakın)
- [x] Swipe ve eşleşme mantığı
- [ ] Eşleşme animasyonu ve sonuç ekranı

## Kaldığımız yer (15 Kasım 2026)

**Bugün yapılanlar**
- Firebase Cloud Functions + Claude kürasyonu kaldırıldı (Blaze/kart gerektiriyordu). Yerine ücretsiz Cloudflare Worker + Workers AI (Llama 3.3 70B) geldi: `worker/`.
- Oda sahibinin telefonu Worker'ı çağırıp film havuzunu Firestore'a yazıyor. Firestore kuralları buna göre gevşetildi, `functions/` silindi.
- Worker testleri: 17/17 geçiyor. Android build alınıyor. Tasarım ve plan: `docs/superpowers/`.

**Sıradaki adımlar**
1. Yukarıdaki "AI Kürasyon için" adımlarını uygula (Cloudflare hesabı, `wrangler deploy`, `.env`, Firestore kuralları).
2. Canlı deneme: `curl -X POST <worker-url>/curate -H "content-type: application/json" -d '{"userA":{"moodText":"gerilim"},"userB":{"energy":80}}'`. 4-8 film dönmeli. 502 dönerse `worker/src/index.js` içindeki `response_format` satırını kaldırıp tekrar deploy et.
3. İki telefonla uçtan uca test: oda kur, AI modunu seç, iki taraf da cevaplasın, ikisi de aynı havuzla swipe ekranına geçmeli.
4. Branch'i (`feature/ai-curation-swipe-overhaul`) `master`'a PR olarak aç.
5. Eşleşme animasyonu ve sonuç ekranı.

**Bilinen sınırlar**
- Workers AI ücretsiz kotası günde yaklaşık 50 kürasyona yetiyor (tahmin).
- Oda sahibi film üretilirken ekrandan çıkarsa oda "hazırlanıyor" durumunda kalabilir.

Developed by Bartu Celik
