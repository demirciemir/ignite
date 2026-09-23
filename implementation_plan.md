# Ignite: Major Feature Update Plan

Bu plan; detaylı istatistikler, antrenman geçmişi (history), yeni açılış ekranı (onboarding), tamamlandı ekranı (session complete), ayarlar ve premium özellik altyapısını içerir.

## 1. State Management (Zustand) Güncellemeleri
- **Geçmiş (History) Logları:** Sadece toplam dakikayı tutmak yerine, her tamamlanan seansın detaylı objesini (`WorkoutLog`) tutacağız. Bu obje şunları içerecek: Tarih, Saat, Rutin Adı, Toplam Süre, Çalışma Süresi (Work), Dinlenme Süresi (Rest), Toplam Tur (Rounds). (Veri boyutunu optimize etmek için son 3-6 ayı tutabiliriz, metin tabanlı olduğu için hiç yer kaplamaz).
- **Yeni İstatistik Değişkenleri:** `totalWorkMinutes`, `totalRestMinutes`, `totalRounds`.
- **Kişiselleştirme (Preferences):** `hapticsEnabled` (Titreşim Aç/Kapat), `soundEnabled` (Ses Aç/Kapat), `hasSeenOnboarding` (İlk açılış ekranı görüldü mü?).

## 2. Onboarding (İlk Açılış Ekranı)
- Yeni bir `app/onboarding.tsx` sayfası eklenecek.
- Kullanıcı uygulamayı ilk indirdiğinde bu ekranla karşılaşacak.
- 3 adımda uygulamanın amacı anlatılacak (Odaklan, Serini Koru, Hedefine Ulaş) ve modern illüstrasyon/ikon destekli "Next, Next, Let's Go" yapısı kurulacak.
- Bittiğinde `hasSeenOnboarding = true` olarak işaretlenip ana ekrana geçilecek.

## 3. Session Complete (Tamamlandı Ekranı) Tasarımı
- `app/timer/[id].tsx` içindeki "Finished" durumu tamamen yenilenecek.
- **Üst Kısım:** Canlı ve motive edici bir renk (ör. Başarı Yeşili veya Canlı Kırmızı), devasa bir onay ikonu ve "Tebrikler!" yazısı.
- **Alt Kısım:** Beyaz kart tasarımı içinde, o seansa ait detaylı kırılımlar: Toplam Süre, Sadece Çalışma (Work) Süresi, Dinlenme Süresi, Tamamlanan Tur sayısı.
- Altta iki buton: "Geçmişi Göster" ve "Tamamla / Ana Ekrana Dön".

## 4. History (Geçmiş) Sayfası
- Yeni bir `app/history.tsx` sayfası.
- Geçmişte yapılan tüm idmanların listesi: "Bugün 18:12 - Pomodoro - 25D Çalışma, 5D Mola".
- Liste tasarımı Apple tarzı kartlar şeklinde olacak.

## 5. Stats (İstatistikler) Ekranı Güncellemesi
- `Total Focus` alanı sadece "0m" yerine `00:24` formatında (Saat:Dakika veya Dakika:Saniye) gösterilecek.
- Bento tasarıma yeni kutular eklenecek: "Toplam Çalışma (Work)", "Toplam Tamamlanan Tur (Rounds)".

## 6. Ayarlar ve Kişiselleştirme
- **Haptics (Titreşim):** Aç/Kapat düğmesi (Toggle).
- **Sesler (Sounds):** Zamanlayıcı bitiş ve tık seslerini Aç/Kapat düğmesi.
- Bunlar doğrudan `src/store.ts` içindeki ayarlara bağlanacak ve timer çalışırken bu ayarlara göre ses/titreşim verecek.

## 7. Gelecek Premium Üyelik Planı (Fikir Taraması)
App Store'da abonelik (Premium) satmak için kullanabileceğimiz modeller:
1. **Ads-Free:** (Söylediğin gibi, ücretsiz versiyona banner/interstitial reklam konulup, premiumda kaldırılabilir).
2. **Pro İstatistikler (Advanced Insights):** Haftalık/Aylık grafikler, hangi gün en çok hangi rutini çalışmış (Chart'lar).
3. **Özel Ses ve Temalar:** Zamanlayıcı bittiğinde çalacak Lo-Fi müzikler, farklı alarm sesleri (Gong, Tibet kasesi vb.) ve özel uygulama ikonları (Siyah ikon, Altın ikon vs.).
4. **Sınırsız Rutin:** Ücretsiz versiyonda maksimum 3 rutin ekleme hakkı, Premium'da sınırsız.
5. **Bulut Senkronizasyonu (Cloud Sync):** Cihaz değiştirildiğinde verilerin kaybolmaması.

---
## User Review Required
Yukarıdaki planı onaylıyor musun? Onaylarsan modül modül inşa etmeye başlayacağım (İlk olarak Store güncellemesi, sonra Onboarding, sonra Ekranlar şeklinde).
