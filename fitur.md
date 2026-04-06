# Ringkasan Fitur EIS Dinkes Brebes

Sistem Executive Information System (EIS) ini dirancang untuk memudahkan pemantauan data kesehatan di Kabupaten Brebes yang terintegrasi dengan e-Puskesmas.

---

### Peran (Role) Pengguna
Sistem ini mendukung akses berjenjang untuk memastikan keamanan dan relevansi data bagi setiap pengguna:

| No | Peran (Role) | Deskripsi Akses |
|---|---|---|
| 1 | **Kepala Dinas Kesehatan** | Akses penuh seluruh data kabupaten, manajemen pengguna, dan laporan eksekutif. |
| 2 | **Kepala Bidang** | Akses data seluruh kabupaten sesuai bidang terkait untuk pemantauan strategis. |
| 3 | **Kepala Puskesmas** | Akses detail data khusus untuk wilayah kerja Puskesmas yang dipimpin. |

---

### Daftar Fitur Utama
Seluruh fitur utama sistem dirangkum dalam tabel berikut:

| No | Menu / Kategori | Fitur Utama | Penjelasan |
|---|---|---|---|
| 1 | **Dashboard Utama** | Pencapaian KPI | Ringkasan indikator kinerja utama seperti total kunjungan, sebaran penyakit, dan aktivitas puskesmas. |
| 2 | **Dashboard Utama** | Trend Kunjungan | Visualisasi tren kunjungan pasien (harian, mingguan, bulanan) secara real-time. |
| 3 | **Dashboard Utama** | Top Penyakit | Peringkat penyakit yang paling sering didiagnosa di wilayah Kabupaten. |
| 4 | **Dashboard Utama** | Puskesmas Teraktif | Analisis puskesmas dengan volume data dan layanan tertinggi. |
| 5 | **Menu Pencarian** | Pencarian ICD-10 | Mencari data analitik penyakit spesifik berdasarkan nama atau kode standar medis ICD-10. |
| 6 | **Menu Pencarian** | Statistik Penyakit | Grafik tren temuan kasus penyakit tertentu dalam kurun waktu 12 bulan terakhir. |
| 7 | **Menu Pencarian** | Daftar Sebaran | Rincian jumlah pasien per penyakit di setiap puskesmas untuk pemetaan kasus. |
| 8 | **Klaster 1** | Manajemen SDM | Analisis kecukupan dan distribusi tenaga kesehatan (dokter, perawat, bidan). |
| 9 | **Klaster 1** | Persediaan Obat | Pemantauan stok obat esensial dan tren pemakaian obat di seluruh wilayah. |
| 10 | **Klaster 1** | Analisis Keuangan | Monitoring pendapatan dan pengeluaran operasional layanan puskesmas. |
| 11 | **Klaster 2** | Kesehatan Ibu (ANC) | Pemantauan kualitas pemeriksaan kehamilan untuk menekan risiko kematian ibu. |
| 12 | **Klaster 2** | Imunisasi (BIAS) | Monitoring cakupan vaksinasi anak sekolah (BIAS) secara berkala. |
| 13 | **Klaster 3** | Deteksi Dini | Hasil skrining awal kesehatan masyarakat untuk pencegahan penyakit. |
| 14 | **Klaster 3** | Identifikasi Risiko | Analisis faktor risiko penyakit yang berkembang di populasi masyarakat. |
| 15 | **Klaster 3** | Gigi & Mulut | Data spesifik mengenai diagnosa dan tindakan kesehatan gigi dan mulut. |
| 16 | **Klaster 3** | Diagnosis Kronis | Pemantauan berkelanjutan untuk pasien dengan diagnosa penyakit jangka panjang. |
| 17 | **Klaster 4** | Penyakit Prioritas | Analisis mendalam untuk 12 penyakit utama yang membutuhkan perhatian khusus. |
| 18 | **Klaster 4** | Sistem Alert | Peringatan otomatis (Tinggi, Sedang, Rendah) untuk lonjakan kasus penyakit berbahaya. |
| 19 | **Lintas Klaster** | Integrasi Layanan | Analisis korelasi data antar klaster (misal: pengaruh SDM terhadap layanan KIA). |
| 20 | **Lintas Klaster** | Analisis Farmasi | Pemantauan penggunaan obat yang terhubung dengan diagnosa penyakit di tiap klaster. |
| 21 | **Monitoring** | Peta Geografis | Visualisasi sebaran beban penyakit menggunakan peta wilayah Kabupaten Brebes. |
| 22 | **Monitoring** | Diagnosa Wilayah | Pemetaan distribusi penyakit tertentu di tiap kecamatan melalui titik koordinat puskesmas. |
| 23 | **Monitoring** | Visualisasi Layanan | Monitoring sebaran keluhan masyarakat dan pemakaian obat secara geografis. |
| 24 | **Laporan & Ekspor** | Dokumen Periodik | Menghasilkan ringkasan data kesehatan dalam periode waktu mingguan atau bulanan. |
| 25 | **Laporan & Ekspor** | Multi-Format Ekspor | Fasilitas ekspor data lengkap ke format Excel, PDF, dan CSV untuk kebutuhan administratif. |
| 26 | **Integrasi & API** | **Open API** | **Standar OpenAPI 3.0 untuk sinkronisasi data real-time dengan dinas atau sistem pemerintahan lain.** |
| 27 | **Pengaturan & Akun** | **Manajemen Profil** | **Pembaruan informasi pribadi, jabatan, dan kontak pengguna secara mandiri.** |
| 28 | **Pengaturan & Akun** | **Kontrol Akses (ACL)** | **Manajemen hak akses berjenjang (Kepala Dinas, Kabid, Kapus) untuk menjaga kerahasiaan data.** |

---

### Informasi Tambahan Fitur Open API
Fitur **Open API** pada EIS Dinkes Brebes dirancang khusus untuk mewujudkan integrasi data pemerintahan yang transparan dan efisien. Fitur ini memungkinkan:
- **Sinkronisasi Data Lintas Dinas:** Berbagi data agregat kesehatan dengan dinas lain (misal: Dinas Sosial atau Kominfo) guna mendukung kebijakan berbasis data.
- **Standar Keamanan:** Menggunakan autentikasi `X-Epus-Signature` berbasis HMAC-SHA256 untuk menjamin integritas data saat dikirim antar sistem.
- **Efisiensi Kerja:** Mengurangi proses entri data manual melalui teknologi *push-data* yang otomatis dan terstandarisasi.
