# 📖 Tasmi' Juz Amma – Aplikasi Penilaian Hafalan

Aplikasi web interaktif untuk membantu guru/ustadz dalam menilai **tasmi' (setoran hafalan) Juz Amma** (surat 78–114).  
Siswa dapat ditandai kesalahan bacaannya secara langsung, dan nilai otomatis dihitung. Piagam prestasi dapat diekspor ke PDF.

## ✨ Fitur Utama
- ✅ Data siswa (nama, kelas, tanggal, penguji)
- 📜 Daftar lengkap ayat Juz Amma dengan **teks Arab Utsmani**
- 👆 Klik ayat untuk menandai **kesalahan** (warna merah)
- 📊 Hitung nilai otomatis: `Nilai = 100 - (jumlah salah / total ayat × 100)`
- 🏅 Piagam penghargaan elegan yang bisa **diekspor ke PDF** (landscape A4)
- 💾 Semua data tersimpan sementara di halaman (tidak perlu backend)

## 🚀 Cara Menggunakan
1. Buka file `index.html` di browser (Chrome/Edge/Safari modern).
2. Isi identitas siswa di tab **Data Siswa**.
3. Buka tab **Juz Amma** – klik ayat yang dibaca salah.
4. Buka tab **Hasil** untuk melihat nilai dan tentukan status lulus/tidak.
5. Buka tab **Piagam** → klik **Export Piagam ke PDF** untuk menyimpan sertifikat.

## 🔧 Teknologi
- HTML5, CSS3 (Grid, Flexbox, animasi)
- JavaScript (ES6)
- Font: *Uthmanic Hafs*, *Playfair Display*, *DM Sans*
- API Quran: [Al Quran Cloud](https://alquran.cloud/api)
- Library: `html2canvas` + `jsPDF` untuk ekspor PDF

## 🌐 Demo Online
> Jika diunggah ke GitHub Pages, aplikasi bisa diakses langsung.  
> Cukup aktifkan **Pages** dari branch `main` (folder root).

## 📝 Catatan
- Koneksi internet diperlukan untuk memuat **ayat dari API** dan font eksternal.
- Ekspor PDF berjalan sepenuhnya di sisi klien (tidak mengirim data ke server).

## 📄 Lisensi
MIT © 2026 – Bebas digunakan, dimodifikasi, dan disebarluaskan untuk pendidikan.
