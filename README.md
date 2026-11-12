# 🎬 FilmMatchApp

"Ne izlesek?" sorusuna iki kişilik cevap: aynı odaya girin, filmleri sağa/sola kaydırın, ikinizin de beğendiği film eşleşme olsun.

## Özellikler

- **Kayıtsız giriş**: Firebase anonim oturum, isim + avatar yeterli.
- **6 haneli oda kodu**: Biri odayı kurar, diğeri kodla katılır; her şey Firestore üzerinden gerçek zamanlı senkron.
- **Modlar**
  - **Film / Dizi**: TMDB popüler ve en yüksek puanlı listeleri.
  - **AI Kürasyon**: İki kişi de ruh hali, enerji seviyesi ve kırmızı çizgilerini girer; Claude (Haiku 5.5) ikinize özel 8 filmlik bir havuz hazırlar (2 sizin, 2 partnerinizin, 4 ortak zevk). Filmler TMDB'de doğrulanır, posterler ve izleme platformları gerçek veridir.
- **Eşleşme**: İkinizin de sağa kaydırdığı filmler anında bildirilir.
- **Tema ve dil**: Açık/koyu tema; TR, EN, DE, ES, FR, IT, RU.

## Teknik yapı

| Katman | Teknoloji |
|---|---|
| Uygulama | React Native (Expo SDK 54) |
| Veri / Auth | Firebase Firestore + Anonymous Auth |
| AI Kürasyon | Claude API, Firebase Cloud Function içinde (`functions/`) |
| Film verisi | TMDB API |

AI anahtarı uygulamaya hiç girmez: iki kullanıcının cevapları Firestore'a yazılınca `curateMoviePool` fonksiyonu tetiklenir, Claude'dan film listesini alır, TMDB'de eşler ve `moviePool` alanına yazar. Firestore kuralları (`firestore.rules`) havuzu yalnızca sunucunun yazmasına izin verir.

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
functions/        Cloud Function: AI kürasyon (Claude + TMDB)
```

## Kurulum

1. Bağımlılıklar: `npm install` ve `cd functions && npm install`
2. `.env.example` dosyasını `.env` olarak kopyalayıp Firebase ve TMDB değerlerini girin.
3. Uygulama: `npx expo start`

### AI Kürasyon için (bir kez)

Cloud Functions, Firebase **Blaze** (kullandıkça öde) planı gerektirir.

```bash
npm install -g firebase-tools
firebase login
firebase use --add                               # Firebase projenizi seçin
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set TMDB_API_KEY
firebase deploy --only functions,firestore:rules
```

Fonksiyon testleri: `cd functions && npm test`

## Yol haritası

- [x] Firebase & anonim giriş
- [x] 6 haneli kod ile oda senkronu
- [x] UI/UX, tema ve çoklu dil
- [x] AI kürasyon (Claude + TMDB)
- [x] Swipe ve eşleşme mantığı
- [ ] Eşleşme animasyonu ve sonuç ekranı

Developed by Bartu Celik
