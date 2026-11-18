# Kaldığımız yer (18 Kasım 2026)

**Durum:** PR [#9](https://github.com/BartuCelik/FilmMatchApp/pull/9) (Worker'a geçiş, Kadife Perde tasarımı, Expo SDK 58) `master`'a birleştirilmeye hazır. Uygulama iPhone'da Expo Go (SDK 58) ile denendi, sorun görülmedi.

**Yapılanlar**
- **Worker canlıda:** `https://filmmatch-curation.bartu-filmmatch.workers.dev/curate`
  - Test isteğine 8 filmlik havuz döndü. Llama'nın JSON çıktısı sorunsuz.
  - Worker TMDB hatalarını logluyor: `cd worker && npx wrangler tail`
- **Gemini kararı:** Gemini aboneliği API erişimi vermiyor. Llama yeterli olduğu için Gemini'ye geçilmedi.
- **"Kadife Perde" yeniden tasarımı:**
  - Bordo zemin `#170E10`, kadife kırmızısı `#D23C43`, altın `#D9A441`. Uygulama sadece koyu temada çalışıyor.
  - Başlıklarda DM Serif Display. "AI Kürasyon" modunun adı **"Bize Seç"** oldu.
  - Tasarım belgesi: `docs/superpowers/specs/2026-11-18-kadife-perde-redesign-design.md`
  - Uygulama planı: `docs/superpowers/plans/2026-11-18-kadife-perde-redesign.md`
- **Expo SDK 58:** App Store'daki Expo Go sadece SDK 58'i açtığı için proje 54'ten yükseltildi. `@react-navigation/stack` 7.12.2'ye çekildi; eski sürüm, RN 0.88'de kaldırılan `InteractionManager` yüzünden açılışta çöküyordu.

**Sıradaki adımlar**
1. Henüz yapılmadıysa Firestore kurallarını yayınla: `npx firebase-tools deploy --only firestore:rules --project <PROJECT_ID>`
2. İki cihazla baştan sona dene: oda kur → katıl → Bize Seç → iki taraf da cevaplasın → swipe.
3. Cihaz testinden gelen geri bildirimler (yeni branch'te).
4. Sonraki özellik: eşleşme animasyonu ve sonuç ekranı.

**Bilinen sınırlar**
- Workers AI'ın ücretsiz kotası günde yaklaşık 50 kürasyona yetiyor (tahmin).
- Oda sahibi film üretilirken ekrandan çıkarsa oda "hazırlanıyor" durumunda kalabilir.
- Mod seçimi ve sorular ekranındaki bazı metinler hâlâ koda gömülü Türkçe/İngilizce.
- Rusça çeviriler karışık: yeni eklenenlerin bir kısmı Kiril alfabesiyle, eskiler Latin harfleriyle yazılmış.
- `graphify-out/` ve `.vscode/` takip edilmiyor; istenirse `.gitignore`'a eklenebilir.
