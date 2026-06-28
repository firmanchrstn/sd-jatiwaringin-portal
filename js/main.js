import { formatTglBaku, tampilkanToast, mengunduhFileCSV, sanitize } from './utils.js';
import { DB } from './database.js';
import { Auth } from './auth.js';

window.tampilkanToast = tampilkanToast;

document.addEventListener('DOMContentLoaded', () => {

    const GEMINI_API_KEY = "AQ.Ab8RN6IWF9nu3NObMfv89OSJUfo1oBpV380NdBeYr94GGZEEow";
    const cekKunci = () => { if (!GEMINI_API_KEY) { tampilkanToast('API Key Gemini belum disetel!', 'warning'); return false; } return true; };

    // --- LOGIN SYSTEM ---
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const formLogin = document.getElementById('form-login');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            const btnSubmit = formLogin.querySelector('button');
            btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Verifikasi...';
            btnSubmit.disabled = true;

            try {
                await Auth.login(email, pass);
                tampilkanToast('Berhasil masuk! Menarik data cloud...', 'success');
                if (DB.pullFromCloud) await DB.pullFromCloud();
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                tampilkanToast('Gagal: Email/Sandi salah.', 'danger');
                btnSubmit.innerHTML = '<i class="ph ph-sign-in"></i> Masuk Sistem';
                btnSubmit.disabled = false;
            }
        });
    }

    if (!Auth.isLoggedIn()) {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        return;
    }

    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'flex';

    // --- TEMA & PROFIL GLOBAL ---
    const terapkanTemaGlobal = () => {
        const p = DB.getProfil();
        if (p.tema_gelap) document.body.classList.add('dark-theme');
        else document.body.classList.remove('dark-theme');
    };
    terapkanTemaGlobal();

    const renderProfilGlobal = () => {
        const p = DB.getProfil();
        const headerName = document.querySelector('.user-name');
        if (headerName) headerName.textContent = p.nama || 'Nama Guru';
        const avatar = document.querySelector('.user-profile .avatar');
        if (avatar && p.nama) avatar.textContent = p.nama.substring(0, 2).toUpperCase();
    };
    renderProfilGlobal();

    // --- NAVIGATION LOGIC ---
    const kanvasKonten = document.getElementById('app-content');
    window.bukaModul = async (namaFileView) => {
        document.querySelectorAll('.nav-menu .nav-item').forEach(nav => {
            nav.style.background = 'transparent'; nav.style.color = 'var(--color-text-main)';
        });
        const menuAktif = document.querySelector(`[data-target="${namaFileView}"]`);
        if (menuAktif) {
            menuAktif.style.background = 'var(--color-primary-light)';
            menuAktif.style.color = 'var(--color-primary)';
            menuAktif.style.fontWeight = '700';
        }

        try {
            const respons = await fetch(`views/${namaFileView}.html`);
            if (!respons.ok) throw new Error('Halaman tidak ditemukan');
            kanvasKonten.innerHTML = await respons.text();

            const scripts = kanvasKonten.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) { eval(scripts[i].innerText); }

            inisialisasiHalaman(namaFileView);
        } catch (error) {
            kanvasKonten.innerHTML = `<div style="text-align:center; padding: 50px;"><i class="ph ph-warning-circle text-danger" style="font-size:48px;"></i><h2>Error 404</h2></div>`;
        }
    };

    // --- PAGE INITIALIZATIONS ---
    const inisialisasiHalaman = (namaView) => {

        // 1. DASHBOARD ANALYTICS
        if (namaView === 'dashboard') {
            const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (document.getElementById('tanggal-hari-ini')) document.getElementById('tanggal-hari-ini').textContent = dateStr;

            const dbSiswa = DB.getSiswa(); const dbKelas = DB.getKelas();
            const dbPresensi = DB.getPresensi(); const dbNilai = DB.getNilai();

            if (document.getElementById('dash-total-siswa')) document.getElementById('dash-total-siswa').textContent = dbSiswa.length;
            if (document.getElementById('dash-total-kelas')) document.getElementById('dash-total-kelas').textContent = dbKelas.length;

            const tglHariIni = formatTglBaku(new Date());
            const absenHariIni = dbPresensi.filter(p => p.tanggal === tglHariIni);
            let persenHadir = 100;
            if (absenHariIni.length > 0) {
                const ygHadir = absenHariIni.filter(p => p.status === 'Hadir').length;
                persenHadir = Math.round((ygHadir / absenHariIni.length) * 100);
            } else if (dbPresensi.length > 0) { persenHadir = 0; }

            const elHadir = document.getElementById('dash-hadir-hari-ini');
            if (elHadir) {
                elHadir.textContent = persenHadir + "%";
                if (persenHadir < 70) elHadir.style.color = "var(--color-danger)";
            }

            if (dbNilai.length > 0) {
                const totalSkor = dbNilai.reduce((sum, n) => sum + parseInt(n.skor), 0);
                const rata = (totalSkor / dbNilai.length).toFixed(1);
                if (document.getElementById('dash-rata-nilai')) document.getElementById('dash-rata-nilai').textContent = rata;
            } else {
                if (document.getElementById('dash-rata-nilai')) document.getElementById('dash-rata-nilai').textContent = "-";
            }

            const containerKaldik = document.getElementById('dashboard-kaldik-list');
            if (containerKaldik) {
                containerKaldik.innerHTML = '';
                const agendaMendatang = DB.getKaldik().filter(k => (k.tanggal_akhir || k.tanggal) >= tglHariIni).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(0, 3);

                if (agendaMendatang.length === 0) containerKaldik.innerHTML = '<p style="color:var(--color-text-muted); font-size:13px;">Tidak ada agenda terdekat.</p>';
                else {
                    agendaMendatang.forEach(item => {
                        const tglObj = new Date(item.tanggal);
                        const bln = tglObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                        let bg = 'var(--color-surface-hover)';
                        if (item.tanggal === tglHariIni) bg = 'var(--color-warning-bg)';

                        containerKaldik.innerHTML += `
                            <div style="display:flex; gap:16px; padding:12px; background:${bg}; border-radius:12px; border:1px solid var(--color-border);">
                                <div style="text-align:center; min-width:50px;"><span style="font-size:11px; font-weight:700; color:var(--color-primary);">${bln}</span><br><span style="font-size:20px; font-weight:800;">${tglObj.getDate()}</span></div>
                                <div><h4 style="font-size:14px;">${sanitize(item.kegiatan)}</h4><p style="font-size:12px; color:var(--color-text-muted);">${sanitize(item.ket) || '-'}</p></div>
                            </div>
                        `;
                    });
                }
            }

            const ctx = document.getElementById('dashboard-chart');
            if (ctx && typeof Chart !== 'undefined') {
                if (window.grafikAkademik) window.grafikAkademik.destroy();

                const dataBulan = ['Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
                const dataTrenNilai = [78, 80, 82, 81, 85, 88];

                window.grafikAkademik = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dataBulan,
                        datasets: [{
                            label: 'Rata-rata Nilai Kelas',
                            data: dataTrenNilai,
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#4f46e5',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                titleFont: { family: 'Plus Jakarta Sans', size: 13 },
                                bodyFont: { family: 'Plus Jakarta Sans', size: 14, weight: 'bold' },
                                padding: 12,
                                cornerRadius: 8,
                                displayColors: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false, min: 60, max: 100,
                                grid: { color: 'rgba(226, 232, 240, 0.5)' },
                                border: { display: false }
                            },
                            x: { grid: { display: false }, border: { display: false } }
                        },
                        animation: { y: { duration: 2000, easing: 'easeOutElastic' } }
                    }
                });
            }
        }

        // 2. DATA SISWA
        if (namaView === 'siswa') {
            let dataSiswa = DB.getSiswa();
            const renderTabelSiswa = () => {
                const tbody = document.getElementById('body-tabel-siswa'); const filter = document.getElementById('filter-kelas-siswa').value;
                tbody.innerHTML = '';
                const data = filter !== 'Semua' ? dataSiswa.filter(s => s.kelas === filter) : dataSiswa;
                if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Kosong</td></tr>`; return; }
                [...data].reverse().forEach(d => {
                    tbody.innerHTML += `<tr>
                        <td><strong>${sanitize(d.nama)}</strong><br><span style="font-size:11px; color:var(--color-text-muted);">NIK: ${sanitize(d.nik)}</span></td>
                        <td><span class="badge badge-info">${d.kelas}</span></td>
                        <td>${d.jk === 'Laki-laki' ? 'L' : 'P'}</td><td>${sanitize(d.ayah)}</td>
                        <td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusSiswa('${d.id}')"><i class="ph ph-trash"></i></button></td>
                    </tr>`;
                });
            };
            document.getElementById('filter-kelas-siswa')?.addEventListener('change', renderTabelSiswa);
            document.getElementById('form-tambah-siswa')?.addEventListener('submit', (e) => {
                e.preventDefault();
                dataSiswa.push({ id: Date.now().toString(), nama: sanitize(document.getElementById('s-nama').value), jk: document.getElementById('s-jk').value, kelas: document.getElementById('filter-kelas-siswa').value === 'Semua' ? '1A' : document.getElementById('filter-kelas-siswa').value, nik: sanitize(document.getElementById('s-nik').value), ayah: sanitize(document.getElementById('s-ayah').value) });
                DB.setSiswa(dataSiswa); document.getElementById('form-tambah-siswa').reset(); renderTabelSiswa(); tampilkanToast('Tersimpan', 'success');
            });
            window.hapusSiswa = (id) => { if (confirm('Hapus?')) { dataSiswa = dataSiswa.filter(s => s.id !== id); DB.setSiswa(dataSiswa); renderTabelSiswa(); } };
            renderTabelSiswa();

            // AI SISWA
            document.getElementById('btn-proses-ai-siswa')?.addEventListener('click', async () => {
                if (!cekKunci()) return;
                const teks = document.getElementById('ai-siswa-input').value; const kls = document.getElementById('s-kelas').value;
                if (!teks) return tampilkanToast('Isi teks AI', 'danger');
                const btn = document.getElementById('btn-proses-ai-siswa'); btn.innerHTML = 'Memproses...'; btn.disabled = true;
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `Teks: "${teks}". Ekstrak HANYA ke JSON array murni: "nama", "jk" (Laki-laki/Perempuan), "nik", "ayah".` }] }] }) });
                    const json = await res.json();
                    let textAI = json.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
                    JSON.parse(textAI).forEach(i => dataSiswa.push({ id: Date.now().toString() + Math.random(), nama: i.nama, jk: i.jk, kelas: kls, nik: i.nik || '-', ayah: i.ayah || '-' }));
                    DB.setSiswa(dataSiswa); renderTabelSiswa(); document.getElementById('ai-siswa-input').value = ''; tampilkanToast('Berhasil (AI)', 'success');
                } catch (e) { tampilkanToast('Gagal AI', 'danger'); } finally { btn.innerHTML = '<i class="ph ph-sparkle"></i> Proses'; btn.disabled = false; }
            });

            // === FUNGSI EKSPOR EXCEL SISWA ===
            document.getElementById('btn-ekspor-siswa')?.addEventListener('click', () => {
                if (typeof XLSX === 'undefined') return tampilkanToast('Sistem Excel sedang memuat, tunggu sebentar.', 'info');
                if (dataSiswa.length === 0) return tampilkanToast('Data siswa kosong!', 'warning');

                tampilkanToast('Menyiapkan file Excel...', 'info');
                const dataEkspor = dataSiswa.map((s, index) => ({
                    'No': index + 1,
                    'NIS/NISN': s.nik,
                    'Nama Lengkap': s.nama,
                    'L/P': s.jk,
                    'Kelas': s.kelas,
                    'Nama Orang Tua': s.ayah
                }));
                const ws = XLSX.utils.json_to_sheet(dataEkspor);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Data_Siswa");
                XLSX.writeFile(wb, `Data_Siswa_SD_Jatiwaringin.xlsx`);
                tampilkanToast('File Excel berhasil diunduh!', 'success');
            });

            // === FUNGSI IMPOR EXCEL SISWA ===
            document.getElementById('input-import-siswa')?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                tampilkanToast('Membaca file Excel...', 'info');
                const reader = new FileReader();
                reader.onload = function (evt) {
                    try {
                        const data = evt.target.result;
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const firstSheet = workbook.SheetNames[0];
                        const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

                        let sukses = 0;
                        excelData.forEach(row => {
                            const nama = row['Nama Lengkap'] || row['Nama'] || '';
                            if (nama) {
                                dataSiswa.push({
                                    id: Date.now().toString() + Math.random(),
                                    nama: sanitize(nama),
                                    jk: row['L/P'] || row['Jenis Kelamin'] || 'Laki-laki',
                                    kelas: row['Kelas'] || '1A',
                                    nik: sanitize((row['NIS/NISN'] || row['NIS'] || '').toString()),
                                    ayah: sanitize(row['Nama Orang Tua'] || row['Ayah'] || '')
                                });
                                sukses++;
                            }
                        });
                        DB.setSiswa(dataSiswa); renderTabelSiswa();
                        tampilkanToast(`Berhasil mengimpor ${sukses} data siswa!`, 'success');
                    } catch (err) {
                        tampilkanToast('Gagal membaca file Excel! Pastikan header tabel benar.', 'danger');
                    }
                    e.target.value = "";
                };
                reader.readAsBinaryString(file);
            });
        }

        // 3. PRESENSI
        if (namaView === 'presensi') {
            let dataPresensi = DB.getPresensi(); const dbSiswa = DB.getSiswa(); const dbKelas = DB.getKelas();
            const selMapel = document.getElementById('input-mapel-kelas'); const selSiswa = document.getElementById('input-nama');

            if (selMapel) {
                selMapel.innerHTML = '<option value="" disabled selected>Pilih Jadwal...</option>';
                dbKelas.forEach(k => selMapel.innerHTML += `<option value="${k.mapel} - ${k.namaKelas}" data-k="${k.namaKelas}">${k.mapel} (Kelas ${k.namaKelas})</option>`);
                selMapel.addEventListener('change', function () {
                    const target = this.options[this.selectedIndex].dataset.k;
                    selSiswa.innerHTML = '';
                    dbSiswa.filter(s => s.kelas === target).forEach(s => selSiswa.innerHTML += `<option value="${s.nama}">${s.nama}</option>`);
                    selSiswa.disabled = false;
                });
            }

            const renderPresensi = () => {
                const tbody = document.getElementById('body-tabel-presensi'); const filter = document.getElementById('filter-kelas-presensi').value;
                tbody.innerHTML = '';
                const data = filter !== 'Semua' ? dataPresensi.filter(d => { const s = dbSiswa.find(x => x.nama === d.nama); return s && s.kelas === filter; }) : dataPresensi;
                [...data].reverse().forEach(d => {
                    let b = d.status === 'Hadir' ? 'success' : (d.status === 'Alpha' ? 'danger' : (d.status === 'Terlambat' ? 'warning' : 'info'));
                    tbody.innerHTML += `<tr><td>${formatTglBaku(new Date(d.tanggal))}</td><td>${sanitize(d.mapel)}</td><td><strong>${sanitize(d.nama)}</strong></td><td><span class="badge badge-${b}">${d.status}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusAbsen('${d.id}')"><i class="ph ph-trash"></i></button></td></tr>`;
                });
            };
            document.getElementById('filter-kelas-presensi')?.addEventListener('change', renderPresensi);
            document.getElementById('form-tambah-presensi')?.addEventListener('submit', (e) => {
                e.preventDefault();
                dataPresensi.push({ id: Date.now().toString(), tanggal: document.getElementById('input-tanggal').value, mapel: selMapel.value, nama: selSiswa.value, status: document.getElementById('input-status').value });
                DB.setPresensi(dataPresensi); renderPresensi(); tampilkanToast('Absen Manual Tersimpan', 'success');
            });
            window.hapusAbsen = (id) => { if (confirm('Hapus?')) { dataPresensi = dataPresensi.filter(s => s.id !== id); DB.setPresensi(dataPresensi); renderPresensi(); } };
            renderPresensi();

            document.getElementById('btn-proses-ai')?.addEventListener('click', async () => {
                if (!cekKunci()) return;
                const teks = document.getElementById('ai-absen-input').value; const tgl = document.getElementById('input-tanggal').value; const mapel = selMapel.value;
                if (!mapel) return tampilkanToast('Pilih jadwal dulu', 'danger'); if (!teks) return tampilkanToast('Isi teks', 'danger');
                const targetKls = selMapel.options[selMapel.selectedIndex].dataset.k; const namaAnak = dbSiswa.filter(s => s.kelas === targetKls).map(s => s.nama);
                const btn = document.getElementById('btn-proses-ai'); btn.innerHTML = 'Memproses...'; btn.disabled = true;
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `Murid: ${namaAnak.join(',')}. Chat: "${teks}". Ekstrak JSON array murni: {"nama":"...", "status":"Hadir/Sakit/Izin/Alpha/Terlambat"}.` }] }] }) });
                    const json = await res.json();
                    let textAI = json.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
                    JSON.parse(textAI).forEach(i => dataPresensi.push({ id: Date.now().toString() + Math.random(), tanggal: tgl, mapel: mapel, nama: i.nama, status: i.status }));
                    DB.setPresensi(dataPresensi); renderPresensi(); document.getElementById('ai-absen-input').value = ''; tampilkanToast('Berhasil (AI)', 'success');
                } catch (e) { tampilkanToast('Gagal AI', 'danger'); } finally { btn.innerHTML = '<i class="ph ph-sparkle"></i> Proses'; btn.disabled = false; }
            });

            // === FUNGSI EKSPOR EXCEL PRESENSI ===
            document.getElementById('btn-ekspor-presensi')?.addEventListener('click', () => {
                if (typeof XLSX === 'undefined') return tampilkanToast('Sistem Excel sedang memuat.', 'info');
                if (dataPresensi.length === 0) return tampilkanToast('Data absensi kosong!', 'warning');

                const filter = document.getElementById('filter-kelas-presensi').value;
                const dataTampil = filter !== 'Semua' ? dataPresensi.filter(d => { const s = dbSiswa.find(x => x.nama === d.nama); return s && s.kelas === filter; }) : dataPresensi;

                const dataEkspor = dataTampil.map((p, index) => ({
                    'No': index + 1,
                    'Tanggal': formatTglBaku(new Date(p.tanggal)),
                    'Kelas / Mapel': p.mapel,
                    'Nama Siswa': p.nama,
                    'Status': p.status
                }));
                const ws = XLSX.utils.json_to_sheet(dataEkspor);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Rekap_Absensi");
                XLSX.writeFile(wb, `Rekap_Absensi_${filter === 'Semua' ? 'Global' : filter}.xlsx`);
                tampilkanToast('Rekap Absensi berhasil diunduh!', 'success');
            });
        }

        // 4. NILAI
        if (namaView === 'nilai') {
            let dataNilai = DB.getNilai(); const dbSiswa = DB.getSiswa();
            const renderNilai = () => {
                const tbody = document.getElementById('body-tabel-nilai'); const filter = document.getElementById('filter-kelas-nilai').value;
                tbody.innerHTML = '';
                const data = filter !== 'Semua' ? dataNilai.filter(d => { const s = dbSiswa.find(x => x.nama === d.nama); return s && s.kelas === filter; }) : dataNilai;
                [...data].reverse().forEach(d => {
                    let isTuntas = d.skor >= 75;
                    tbody.innerHTML += `<tr><td><strong>${sanitize(d.nama)}</strong></td><td>${sanitize(d.mapel)}</td><td>${d.jenis}</td><td style="text-align:center; font-weight:800;">${d.skor}</td><td><span class="badge badge-${isTuntas ? 'success' : 'danger'}">${isTuntas ? 'Tuntas' : 'Remedial'}</span></td><td style="text-align:right;"><button class="btn-icon-only text-danger" onclick="hapusNilai('${d.id}')"><i class="ph ph-trash"></i></button></td></tr>`;
                });
            };
            document.getElementById('filter-kelas-nilai')?.addEventListener('change', renderNilai);
            document.getElementById('form-tambah-nilai')?.addEventListener('submit', (e) => {
                e.preventDefault();
                dataNilai.push({ id: Date.now().toString(), nama: document.getElementById('input-nilai-nama').value, mapel: document.getElementById('input-nilai-mapel').value, jenis: document.getElementById('input-nilai-jenis').value, skor: parseInt(document.getElementById('input-nilai-skor').value) });
                DB.setNilai(dataNilai); renderNilai(); document.getElementById('form-tambah-nilai').reset(); tampilkanToast('Nilai Tersimpan', 'success');
            });
            window.hapusNilai = (id) => { if (confirm('Hapus?')) { dataNilai = dataNilai.filter(s => s.id !== id); DB.setNilai(dataNilai); renderNilai(); } };
            renderNilai();

            document.getElementById('btn-cetak-rapor')?.addEventListener('click', () => {
                const dbS = DB.getSiswa();
                const dbN = DB.getNilai();

                if (dbN.length === 0) return tampilkanToast('Belum ada data nilai untuk dicetak!', 'warning');

                const namaAnak = prompt("Masukkan NAMA LENGKAP siswa yang ingin dicetak rapornya:\n(Pastikan huruf besar/kecil sesuai database)");
                if (!namaAnak) return;

                const siswaObj = dbS.find(s => s.nama.toLowerCase() === namaAnak.toLowerCase());
                if (!siswaObj) return tampilkanToast('Data siswa tidak ditemukan di database!', 'danger');

                const nilaiSiswa = dbN.filter(n => n.nama.toLowerCase() === namaAnak.toLowerCase());
                if (nilaiSiswa.length === 0) return tampilkanToast('Siswa ini belum memiliki satupun nilai!', 'warning');

                const rekapMapel = {};
                nilaiSiswa.forEach(n => {
                    if (!rekapMapel[n.mapel]) rekapMapel[n.mapel] = { Tugas: 0, Harian: 0, UTS: 0, UAS: 0 };
                    if (n.jenis === 'Tugas') rekapMapel[n.mapel].Tugas = n.skor;
                    if (n.jenis === 'Harian') rekapMapel[n.mapel].Harian = n.skor;
                    if (n.jenis === 'UTS') rekapMapel[n.mapel].UTS = n.skor;
                    if (n.jenis === 'UAS') rekapMapel[n.mapel].UAS = n.skor;
                });

                const bodyData = [];
                let i = 1;
                for (const [mapel, skor] of Object.entries(rekapMapel)) {
                    const nilaiAkhir = Math.round((skor.Tugas * 0.20) + (skor.Harian * 0.30) + (skor.UTS * 0.25) + (skor.UAS * 0.25));
                    let predikat = 'D';
                    if (nilaiAkhir >= 90) predikat = 'A';
                    else if (nilaiAkhir >= 80) predikat = 'B';
                    else if (nilaiAkhir >= 75) predikat = 'C';
                    bodyData.push([i++, mapel, skor.Tugas || '-', skor.Harian || '-', skor.UTS || '-', skor.UAS || '-', nilaiAkhir, predikat]);
                }

                tampilkanToast('Menyusun PDF Rapor...', 'success');
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                doc.text("RAPOR HASIL BELAJAR SISWA", 105, 20, { align: "center" });
                doc.setFontSize(12);
                doc.text("SD JATIWARINGIN 1 PORTAL", 105, 28, { align: "center" });

                doc.setLineWidth(0.5);
                doc.line(15, 35, 195, 35);

                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                doc.text(`Nama Siswa    : ${siswaObj.nama}`, 15, 45);
                doc.text(`NIS / NISN    : ${siswaObj.nik}`, 15, 52);
                doc.text(`Kelas         : ${siswaObj.kelas}`, 130, 45);

                const thn = new Date().getFullYear();
                const bln = new Date().getMonth();
                const semester = bln >= 6 ? "Ganjil" : "Genap";
                doc.text(`Semester      : ${semester} / ${thn}`, 130, 52);

                doc.autoTable({
                    startY: 60,
                    head: [['No', 'Mata Pelajaran', 'Tugas\n(20%)', 'Harian\n(30%)', 'UTS\n(25%)', 'UAS\n(25%)', 'Nilai\nAkhir', 'Predikat']],
                    body: bodyData,
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle' },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 10 },
                        2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' },
                        6: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] },
                        7: { halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229] }
                    },
                });

                const finalY = doc.lastAutoTable.finalY || 100;
                doc.text("Mengetahui,", 15, finalY + 25);
                doc.text("Orang Tua/Wali,", 15, finalY + 50);

                const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                doc.text(`Bekasi, ${dateStr}`, 130, finalY + 25);
                doc.text("Wali Kelas,", 130, finalY + 50);

                doc.save(`Rapor_${siswaObj.nama.replace(/\s+/g, '_')}_${semester}_${thn}.pdf`);
            });

            document.getElementById('btn-proses-ai-nilai')?.addEventListener('click', async () => {
                if (!cekKunci()) return;
                const teks = document.getElementById('ai-nilai-input').value; const mapel = document.getElementById('ai-mapel-target').value; const jenis = document.getElementById('ai-jenis-target').value;
                if (!mapel || !teks) return tampilkanToast('Isi form AI', 'danger');
                const btn = document.getElementById('btn-proses-ai-nilai'); btn.innerHTML = 'Memproses...'; btn.disabled = true;
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `Chat: "${teks}". Ekstrak HANYA JSON array murni: {"nama":"...", "skor":angka_integer}.` }] }] }) });
                    const json = await res.json();
                    let textAI = json.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
                    JSON.parse(textAI).forEach(i => dataNilai.push({ id: Date.now().toString() + Math.random(), nama: i.nama, mapel: mapel, jenis: jenis, skor: parseInt(i.skor) }));
                    DB.setNilai(dataNilai); renderNilai(); document.getElementById('ai-nilai-input').value = ''; tampilkanToast('Berhasil (AI)', 'success');
                } catch (e) { tampilkanToast('Gagal AI', 'danger'); } finally { btn.innerHTML = '<i class="ph ph-sparkle"></i> Proses'; btn.disabled = false; }
            });
        }

        // 5. PENGATURAN
        if (namaView === 'pengaturan') {
            const p = DB.getProfil();
            if (document.getElementById('setting-nama')) document.getElementById('setting-nama').value = p.nama || '';
            if (document.getElementById('tema-gelap')) document.getElementById('tema-gelap').checked = p.tema_gelap === true;

            document.getElementById('form-pengaturan-profil')?.addEventListener('submit', function (e) { e.preventDefault(); let d = DB.getProfil(); d.nama = sanitize(document.getElementById('setting-nama').value); DB.setProfil(d); renderProfilGlobal(); tampilkanToast('Profil Tersimpan.', 'success'); });
            document.getElementById('form-pengaturan-tema')?.addEventListener('submit', function (e) { e.preventDefault(); let d = DB.getProfil(); d.tema_gelap = document.getElementById('tema-gelap').checked; DB.setProfil(d); terapkanTemaGlobal(); tampilkanToast('Tema diperbarui.', 'success'); });
            document.getElementById('btn-reset-data')?.addEventListener('click', function () { if (DB.resetData()) { tampilkanToast('Sistem diformat...', 'warning'); setTimeout(() => window.location.reload(), 1500); } });
        }
    };

    // --- EVENT LISTENER UTAMA ---
    document.getElementById('btn-profil')?.addEventListener('click', () => bukaModul('pengaturan'));
    document.getElementById('btn-keluar')?.addEventListener('click', (e) => { e.preventDefault(); if (confirm("Keluar sesi?")) Auth.logout(); });

    document.querySelectorAll('.nav-menu .nav-item, .sidebar-footer .nav-item').forEach(item => {
        item.addEventListener('click', function (e) { e.preventDefault(); const t = this.getAttribute('data-target'); if (t) bukaModul(t); });
    });

    bukaModul('dashboard');
});