// Data publik: dipakai frontend (visual + UI) dan backend (validasi agentId).
// System prompt ada di server/prompts.js (tidak ikut ke browser).

export const SKIN = ['#f3d2b3', '#e3b48a', '#c98f62', '#a97047', '#8a5a38'];

export const DIVISIONS = [
  { id: 'proposal', name: 'Proposal Writer', short: 'Proposal', color: '#4f7cff', row: 0, col: 0 },
  { id: 'ads', name: 'Ads Copywriter', short: 'Ads', color: '#ff8a3d', row: 0, col: 1 },
  { id: 'social', name: 'Social Media', short: 'Social', color: '#ff5fa2', row: 0, col: 2 },
  { id: 'qa', name: 'Web QA', short: 'QA', color: '#2fbf71', row: 1, col: 0 },
  { id: 'dev', name: 'Developer Helper', short: 'Dev', color: '#8a5cf6', row: 1, col: 1 },
  { id: 'reporting', name: 'Reporting', short: 'Report', color: '#14b8a6', row: 1, col: 2 },
  { id: 'account', name: 'Account Manager', short: 'Account', color: '#f5b82e', row: 2, col: 0 },
  { id: 'finance', name: 'Finance', short: 'Finance', color: '#64748b', row: 2, col: 1 },
];

// look: skin = index SKIN, hair = warna, style = short | long | bun, glasses, hijab = warna
const A = (id, division, name, gender, role, focus, look, quick, leader = false) => ({
  id, division, name, gender, role, focus, look, quick, leader,
});

export const AGENTS = [
  // ---------- Proposal Writer ----------
  A('rina', 'proposal', 'Rina Wulandari', 'F', 'Head of Proposals', 'struktur proposal, review akhir, strategi penawaran',
    { skin: 1, hair: '#2b1d16', style: 'bun', glasses: true },
    ['Review draft proposal gue', 'Struktur proposal website company profile', 'Cara closing client yang ragu'], true),
  A('bagas', 'proposal', 'Bagas Prasetyo', 'M', 'Client Research', 'riset calon klien, analisis brief, pain point',
    { skin: 2, hair: '#1c1c1c', style: 'short' },
    ['Analisis brief client ini', 'Pertanyaan discovery call', 'Riset bisnis klien dari deskripsi']),
  A('siti', 'proposal', 'Siti Nurhaliza', 'F', 'Proposal Writer', 'narasi proposal, value proposition, bahasa penawaran',
    { skin: 1, hair: '#000000', style: 'long', hijab: '#e8d5f2' },
    ['Tulis pembuka proposal', 'Ubah bahasa proposal jadi lebih meyakinkan', 'Draft ringkasan eksekutif']),
  A('dimas', 'proposal', 'Dimas Aryanto', 'M', 'Pricing & Scope', 'paket harga, scope of work, timeline, termin pembayaran',
    { skin: 3, hair: '#2b2118', style: 'short', glasses: true },
    ['Susun 3 paket harga website', 'Scope of work toko Shopify', 'Estimasi timeline project 6 minggu']),

  // ---------- Ads Copywriter ----------
  A('putri', 'ads', 'Putri Maharani', 'F', 'Head of Ads Copy', 'strategi copy iklan, review, angle kampanye',
    { skin: 1, hair: '#3a2417', style: 'long' },
    ['Review copy iklan gue', 'Angle iklan untuk produk baru', 'Struktur kampanye awareness ke konversi'], true),
  A('fajar', 'ads', 'Fajar Nugroho', 'M', 'Meta Ads Copy', 'primary text, headline, hook Facebook/Instagram Ads',
    { skin: 2, hair: '#1c1c1c', style: 'short' },
    ['5 variasi primary text Meta Ads', 'Hook 3 detik untuk Reels Ads', 'Copy retargeting keranjang ditinggal']),
  A('anisa', 'ads', 'Anisa Rahmawati', 'F', 'Google Ads Copy', 'headline & deskripsi RSA, keyword intent, ekstensi iklan',
    { skin: 0, hair: '#000000', style: 'long', hijab: '#f7c6d9' },
    ['15 headline RSA (maks 30 karakter)', 'Deskripsi iklan Google 90 karakter', 'Ide sitelink dan callout']),
  A('yoga', 'ads', 'Yoga Pratama', 'M', 'Landing & CTA Tester', 'hook, CTA, copy landing page, ide A/B test',
    { skin: 3, hair: '#2b1d16', style: 'short', glasses: true },
    ['Copy hero landing page', 'Variasi CTA untuk A/B test', 'Kritik landing page gue']),

  // ---------- Social Media ----------
  A('dewi', 'social', 'Dewi Kartika', 'F', 'Head of Social', 'strategi konten, brand voice, review kalender',
    { skin: 2, hair: '#5a3a22', style: 'bun' },
    ['Review kalender konten gue', 'Tentukan brand voice klien F&B', 'Strategi konten 30 hari'], true),
  A('raka', 'social', 'Raka Wijaya', 'M', 'Content Planner', 'kalender konten, pilar konten, jadwal posting',
    { skin: 2, hair: '#1c1c1c', style: 'short' },
    ['Kalender konten 1 minggu', 'Pilar konten untuk klinik kecantikan', 'Ide konten momen gajian']),
  A('nadia', 'social', 'Nadia Safitri', 'F', 'Caption Writer', 'caption, copy carousel, CTA, hashtag',
    { skin: 1, hair: '#2b1d16', style: 'long' },
    ['5 caption santai untuk produk skincare', 'Copy carousel 7 slide', 'Caption promo akhir bulan']),
  A('eko', 'social', 'Eko Saputra', 'M', 'Video Script', 'script Reels/TikTok, storyboard singkat, hook video',
    { skin: 4, hair: '#101010', style: 'short', glasses: true },
    ['Script Reels 30 detik', 'Ide konten behind the scene', '3 hook video untuk TikTok']),

  // ---------- Web QA ----------
  A('hendra', 'qa', 'Hendra Gunawan', 'M', 'QA Lead', 'checklist handover, prioritas bug, laporan QA',
    { skin: 2, hair: '#222222', style: 'short', glasses: true },
    ['Checklist QA sebelum handover', 'Prioritaskan daftar bug ini', 'Template laporan QA untuk client'], true),
  A('laras', 'qa', 'Laras Ayuningtyas', 'F', 'Visual & Responsive QA', 'tampilan, responsive, konsistensi desain, typo',
    { skin: 0, hair: '#3a2417', style: 'long' },
    ['Checklist responsive mobile dan tablet', 'Cek konsistensi desain homepage', 'Daftar hal yang sering lupa dicek']),
  A('andi', 'qa', 'Andi Kurniawan', 'M', 'Functional QA', 'form, checkout, pembayaran, email notifikasi, tracking',
    { skin: 3, hair: '#1c1c1c', style: 'short' },
    ['Skenario tes checkout Shopify', 'Tes form kontak dan email masuk', 'Cek pixel dan tracking']),
  A('maya', 'qa', 'Maya Anggraini', 'F', 'Performance & SEO QA', 'kecepatan, Core Web Vitals, SEO teknis, gambar',
    { skin: 1, hair: '#000000', style: 'long', hijab: '#cfe8d6' },
    ['Kenapa website WordPress gue lambat?', 'Checklist SEO teknis sebelum launch', 'Optimasi gambar untuk Core Web Vitals']),

  // ---------- Developer Helper ----------
  A('arief', 'dev', 'Arief Setiawan', 'M', 'Tech Lead', 'arsitektur, pilihan solusi, review kode, troubleshooting berat',
    { skin: 2, hair: '#1c1c1c', style: 'short', glasses: true },
    ['Review kode snippet gue', 'Pilih Shopify atau WooCommerce untuk klien ini', 'Debug error 500 WordPress'], true),
  A('citra', 'dev', 'Citra Lestari', 'F', 'WordPress & Elementor', 'WordPress, Elementor, WooCommerce, plugin, CSS Elementor',
    { skin: 1, hair: '#000000', style: 'long', hijab: '#ffd9a8' },
    ['CSS custom untuk tombol Elementor', 'Situs WordPress kena white screen', 'Setup WooCommerce ongkir Indonesia']),
  A('bayu', 'dev', 'Bayu Firmansyah', 'M', 'Shopify Developer', 'Shopify theme, Liquid, metafield, app, checkout',
    { skin: 3, hair: '#2b2118', style: 'short' },
    ['Snippet Liquid tampilkan stok', 'Custom section Shopify', 'Metafield untuk spesifikasi produk']),
  A('tari', 'dev', 'Tari Susanti', 'F', 'Webflow & Frontend', 'Webflow, JavaScript, CSS, animasi, embed, integrasi',
    { skin: 2, hair: '#4a2c1a', style: 'bun' },
    ['Interaksi Webflow scroll reveal', 'JS untuk hitung harga dinamis', 'Embed form ke Webflow']),

  // ---------- Single ----------
  A('kirana', 'reporting', 'Kirana Dewanti', 'F', 'Reporting Analyst', 'laporan bulanan, insight GA4 dan Ads, narasi data',
    { skin: 1, hair: '#2b1d16', style: 'long', glasses: true },
    ['Ringkas data ini jadi laporan klien', 'Template laporan bulanan', 'Jelaskan penurunan traffic dengan bahasa awam']),
  A('rizky', 'account', 'Rizky Ramadhan', 'M', 'Account Manager', 'komunikasi klien, update progres, revisi, deadline',
    { skin: 2, hair: '#1c1c1c', style: 'short' },
    ['Draft update progres ke client', 'Balas client yang minta revisi terus', 'Follow-up client belum approve desain']),
  A('melati', 'finance', 'Melati Handayani', 'F', 'Finance & Admin', 'invoice, termin, reminder tagihan, rekap',
    { skin: 0, hair: '#000000', style: 'long', hijab: '#d9e2f2' },
    ['Draft invoice termin pertama', 'Pesan sopan menagih pembayaran telat', 'Rekap tagihan bulanan']),
];

export const agentById = (id) => AGENTS.find((a) => a.id === id);
export const divisionById = (id) => DIVISIONS.find((d) => d.id === id);
export const agentsOf = (divisionId) => AGENTS.filter((a) => a.division === divisionId);
