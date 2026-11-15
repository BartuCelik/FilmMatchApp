# AI Kürasyon: Firebase Functions + Claude → Cloudflare Worker + Workers AI

## Neden
Firebase Cloud Functions, Blaze (kartlı) plan istiyor. Claude da ücretli. Hedef: AI Kürasyon modunu kart ve ücret gerektirmeden çalıştırmak, kullanıcının yazdığı serbest metni anlamaya devam etmek.

## Hedefler / Kapsam dışı
- Hedef: Kart gerektirmeyen, sıfır maliyetli kürasyon. Mevcut soru ekranı, swipe akışı ve havuz formatı aynı kalır.
- Hedef: TMDB anahtarı yeni bir yere sızmaz, Worker'da secret olarak tutulur.
- Kapsam dışı: Kullanıcı başına kota, Firebase token doğrulaması, web (CORS) desteği.
- Başarısızlık sayılır: Ücretli bir plana zorlanmak veya istemcide AI/LLM anahtarı bulunması.

## Yaklaşımlar
- **A) Worker sadece havuzu döner, istemci Firestore'a yazar (seçilen).** Az kod, kart yok. Bedeli: Firestore kuralları gevşer, oturum katılımcıları havuzu yazabilir. Kötüye kullanım IP başına istek sınırıyla, en kötü durumda da Workers AI'ın günlük ücretsiz kotasıyla sınırlı kalır. Para riski yok.
- B) Worker servis hesabıyla Firestore'a kendisi yazar. Bugünkü güvenlik modelini korur ama 2-3 kat daha fazla kod ve kurulum gerektirir. Ödeme riski olmadığı için bu bedele değmez.
- (Elendi) Kural tabanlı TMDB discover: serbest metni anlayamıyor.

## Tasarım
**Worker (`worker/`)**
- `POST /curate`, gövde `{ userA, userB }`. Her biri `{ moodPreset, moodText, energy, redLines, redLinesText }` alanlarından oluşur.
- Sırasıyla:
  1. IP başına rate limit binding uygulanır (60 sn'de 5 istek).
  2. Girdiler `pickSignals` ile temizlenir (güven sınırı).
  3. `env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', …)` çağrılır. Mevcut `CURATOR_SYSTEM` prompt'u ve JSON şeması kullanılır.
  4. Sonuç `parsePicks` ile doğrulanır.
  5. Her film TMDB'de aranır (`TMDB_API_KEY` secret'ı ile), ardından `finalizePool` uygulanır.
- Yanıt: `200 { moviePool }`. Rate limit aşımında veya AI kotası bittiğinde `429`, diğer hatalarda `502`.
- `functions/curation.js` içindeki saf yardımcılar ve testleri `worker/` altına taşınır. Firestore'a özgü kısımlar (`planClaim`, `isReadyForCuration`, günlük sayaç) silinir.

**İstemci**
- `.env`: `EXPO_PUBLIC_CURATION_URL`.
- `sessionService.generateAiPool(sessionId, session)`:
  1. `aiStatus: 'generating'` yazılır.
  2. Worker çağrılır.
  3. Başarılıysa `moviePool` ve `aiStatus: 'ready'` yazılır.
  4. Hata olursa `aiAttempts` +1 artırılır. Durum 429'da `'limit'`, 3 denemeden sonra `'failed'`, diğer durumlarda `'error'` olur.
- `AiCurationQuestionsScreen`: İki taraf cevapladığında, `aiStatus === 'idle'` ise ve havuz boşsa sadece **oda sahibi** (`participants[0]`) `generateAiPool` çağırır. Böylece çift çağrı olmaz. "Tekrar dene" butonu durumu bugünkü gibi `idle`'a çeker.

**Firestore kuralları**
- Katılımcılar için `moviePool`, `aiAttempts` ve `aiStatus` yasakları kaldırılır. `hostId` ve `code` korunmaya devam eder.

**Silinenler**
- `functions/` klasörü, `firebase.json` içindeki `functions` bloğu, Anthropic SDK bağımlılığı.

## Kotalar (doğrulanmış kaynaklara göre, 2026-11)
- Workers AI ücretsiz kotası günde 10.000 neuron, her gün 00:00 UTC'de sıfırlanıyor.
- Llama 3.3 70B'nin maliyeti 1M girdi token için ~26.7k, 1M çıktı token için ~205k neuron. Oturum başına ~1k girdi ve ~0.8k çıktı token'la hesaplandığında oturum başına ~190 neuron eder. Bu da **günde yaklaşık 50 kürasyon** demek.
- Kota yetmezse aynı Worker'da daha küçük bir modele geçmek tek satırlık değişiklik.

## Uygulayıcıya kalanlar
- JSON şema modu bu model için resmi dokümanda net değil. Önce `response_format: json_schema` denenecek. Desteklenmiyorsa metin içinden JSON ayıklanacak (`parsePicks` zaten doğruluyor).

## Kullanıcının adımları (deploy)
1. Ücretsiz bir Cloudflare hesabı aç (kart gerekmez).
2. `npx wrangler login`
3. `npx wrangler secret put TMDB_API_KEY`
4. `npx wrangler deploy`
5. Çıkan URL'yi `.env` dosyasına `EXPO_PUBLIC_CURATION_URL` olarak yaz.
6. `firebase deploy --only firestore:rules` (Spark planında çalışır).
