import { formatTglBaku, tampilkanToast, mengunduhFileCSV, sanitize } from './utils.js';
import { DB } from './database.js';
import { Auth } from './auth.js'; // <-- Impor Modul Autentikasi ditambahkan

// Mendaftarkan fungsi ke window agar bisa dipanggil dari HTML (onclick)
window.tampilkanToast = tampilkanToast;

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // SISTEM PENGAMAN (ROUTE GUARD & LOGIN)
    // ==========================================
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');

    // Logika Form Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => { // <-- Perhatikan tambahan kata 'async'
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;

            const btnSubmit = formLogin.querySelector('button');
            btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memverifikasi Server...';
            btnSubmit.disabled = true; // Kunci tombol agar tidak diklik dua kali

            try {
                // Menunggu respons dari server Firebase
                await Auth.login(email, pass);
                tampilkanToast('Otorisasi Firebase Berhasil! Mengalihkan...', 'success');
                setTimeout(() => window.location.reload(), 1200);
            } catch (error) {
                // Jika password salah atau email tidak ada di Firebase
                tampilkanToast('Akses Ditolak! Kredensial tidak valid.', 'danger');
                btnSubmit.innerHTML = '<i class="ph ph-sign-in"></i> Masuk Sistem';
                btnSubmit.disabled = false;
            }
        });
    }

    // Jika belum login, hentikan eksekusi aplikasi dan paksa di layar login
    if (!Auth.isLoggedIn()) {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        return;
    }

    // Jika sudah login, sembunyikan layar login dan tampilkan aplikasi utama
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'flex';


    // ==========================================
    // APLIKASI UTAMA (SETELAH LOGIN)
    // ==========================================

    const terapkanTemaGlobal = () => {
        const p = DB.getProfil();
        if (p.tema_gelap) document.body.classList.add('dark-theme');
        else document.body.classList.remove('dark-theme');
    };
    terapkanTemaGlobal();

    const renderProfilGlobal = () => {
        const p = DB.getProfil();
        const headerName = document.querySelector('.user-name');
        const headerRole = document.querySelector('.user-role');
        const headerAvatar = document.querySelector('.user-profile .avatar');

        if (headerName && headerRole && headerAvatar) {
            headerName.textContent = p.nama || 'Nama Guru';
            headerRole.textContent = p.peran || 'Wali Kelas -';
            const kata = (p.nama || '').trim().split(' ');
            headerAvatar.textContent = kata.length >= 2 ? (kata[0][0] + kata[1][0]).toUpperCase() : (kata[0] !== '' ? kata[0].substring(0, 2).toUpperCase() : 'GP');
        }
    };
    renderProfilGlobal();

    // MESIN ROUTING
    const itemNavigasi = document.querySelectorAll('.nav-menu .nav-item, .sidebar-footer .nav-item[data-target]');
    const kanvasKonten = document.getElementById('app-content');

    window.bukaModul = async (namaFileView) => {
        itemNavigasi.forEach(nav => nav.classList.remove('active'));
        const menuAktif = document.querySelector(`[data-target="${namaFileView}"]`);
        if (menuAktif) menuAktif.classList.add('active');

        try {
            const respons = await fetch(`views/${namaFileView}.html`);
            if (!respons.ok) throw new Error('Halaman tidak ditemukan');
            kanvasKonten.innerHTML = await respons.text();
            inisialisasiHalaman(namaFileView);

            const inputPencarian = document.getElementById('input-pencarian');
            if (inputPencarian) inputPencarian.value = '';

        } catch (error) {
            kanvasKonten.innerHTML = `<div class="empty-state"><i class="ph ph-warning-circle empty-icon text-danger"></i><h2>Modul Belum Tersedia</h2></div>`;
        }
    };

    const inisialisasiHalaman = (namaView) => {

        // --- A. DASBOR ---
        if (namaView === 'dashboard') {
            const elemenTanggal = document.getElementById('tanggal-hari-ini');
            if (elemenTanggal) elemenTanggal.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const elemenSapaan = document.querySelector('.page-header .header-text h1');
            if (elemenSapaan) {
                const p = DB.getProfil();
                const jam = new Date().getHours();
                let teksWaktu = 'Pagi';
                if (jam >= 11 && jam <= 14) teksWaktu = 'Siang'; else if (jam >= 15 && jam <= 18) teksWaktu = 'Sore'; else if (jam > 18 || jam < 4) teksWaktu = 'Malam';
                let teksGender = p.jk === 'L' ? 'Bapak' : (p.jk === 'P' ? 'Ibu' : 'Bapak/Ibu');
                let namaDepan = p.nama ? ' ' + p.nama.trim().split(' ')[0] : '';
                elemenSapaan.textContent = `Selamat ${teksWaktu}, ${teksGender}${namaDepan}! 👋`;
            }

            if (document.getElementById('dash-total-siswa')) document.getElementById('dash-total-siswa').textContent = `${DB.getSiswa().length} Anak`;
            if (document.getElementById('dash-total-kelas')) document.getElementById('dash-total-kelas').textContent = `${DB.getKelas().length} Kelas`;

            const containerKaldik = document.getElementById('dashboard-kaldik-list');
            if (containerKaldik) {
                containerKaldik.innerHTML = '';
                const hariIni = formatTglBaku(new Date());
                const agendaMendatang = DB.getKaldik().filter(k => k.tanggal >= hariIni).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(0, 3);

                if (agendaMendatang.length === 0) {
                    containerKaldik.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 20px;">Tidak ada agenda dalam waktu dekat.</p>';
                } else {
                    agendaMendatang.forEach(item => {
                        const tglObj = new Date(item.tanggal);
                        const bulanSingkat = tglObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                        let bgWarna = 'var(--color-primary-light)'; let txtWarna = 'var(--color-primary)';
                        const isLibur = item.kegiatan.toLowerCase().includes('libur') || tglObj.getDay() === 0;
                        if (item.tanggal === hariIni || isLibur) { bgWarna = 'var(--color-danger-bg)'; txtWarna = 'var(--color-danger)'; }

                        containerKaldik.insertAdjacentHTML('beforeend', `
                            <div style="display: flex; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border);">
                                <div style="background: ${bgWarna}; color: ${txtWarna}; padding: 8px 16px; border-radius: 8px; font-weight: bold; text-align: center; min-width: 70px;">
                                    ${bulanSingkat}<br><span style="font-size: 20px;">${tglObj.getDate()}</span>
                                </div>
                                <div style="display: flex; flex-direction: column; justify-content: center;">
                                    <h4 style="margin-bottom: 4px; font-size: 15px; color: var(--color-text-main);">${sanitize(item.kegiatan)}</h4>
                                    <p style="color: var(--color-text-muted); font-size: 13px;">${sanitize(item.ket) || '-'}</p>
                                </div>
                            </div>
                        `);
                    });
                }
            }
        }

        // --- B. KALDIK ---
        if (namaView === 'kaldik') {
            let dbKaldik = DB.getKaldik();
            let bulanAktif = new Date().getMonth(); let tahunAktif = new Date().getFullYear();
            let tanggalTerpilih = formatTglBaku(new Date());

            const renderKalender = () => {
                const containerDays = document.getElementById('kaldik-days-container');
                if (document.getElementById('kaldik-month-year')) document.getElementById('kaldik-month-year').textContent = new Date(tahunAktif, bulanAktif, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                if (!containerDays) return; containerDays.innerHTML = '';

                const hariPertama = new Date(tahunAktif, bulanAktif, 1).getDay();
                const totalHari = new Date(tahunAktif, bulanAktif + 1, 0).getDate();
                const hariIniBaku = formatTglBaku(new Date());

                for (let i = 0; i < hariPertama; i++) containerDays.innerHTML += `<div class="calendar-cell empty"></div>`;

                for (let i = 1; i <= totalHari; i++) {
                    const dateObj = new Date(tahunAktif, bulanAktif, i);
                    const tglLooping = formatTglBaku(dateObj);
                    const agendaAda = dbKaldik.filter(k => k.tanggal === tglLooping);
                    const titikAgenda = agendaAda.length > 0 ? `<div class="calendar-event-dot"></div>` : '';
                    let isLibur = (dateObj.getDay() === 0) || agendaAda.some(a => a.kegiatan.toLowerCase().includes('libur'));

                    let kelasTambahan = (tglLooping === hariIniBaku) ? ' today' : '';
                    if (tglLooping === tanggalTerpilih) kelasTambahan += ' selected';
                    let styleMerah = (isLibur && tglLooping !== tanggalTerpilih) ? 'color: var(--color-danger); font-weight: 700;' : '';

                    containerDays.innerHTML += `<div class="calendar-cell ${kelasTambahan}" data-tgl="${tglLooping}" style="${styleMerah}">${i}${titikAgenda}</div>`;
                }

                document.querySelectorAll('.calendar-cell:not(.empty)').forEach(cell => {
                    cell.addEventListener('click', function () { tanggalTerpilih = this.getAttribute('data-tgl'); renderKalender(); renderPanelKanan(); });
                });
            };

            const renderPanelKanan = () => {
                const kontainerDetail = document.getElementById('kaldik-agenda-detail');
                if (document.getElementById('kaldik-selected-date-text')) document.getElementById('kaldik-selected-date-text').textContent = `Agenda: ${new Date(tanggalTerpilih).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                if (document.getElementById('kaldik-input-tgl')) document.getElementById('kaldik-input-tgl').value = tanggalTerpilih;

                const agendaDitemukan = dbKaldik.filter(k => k.tanggal === tanggalTerpilih);
                if (kontainerDetail) {
                    if (agendaDitemukan.length === 0) {
                        kontainerDetail.innerHTML = `<div style="text-align: center; padding: 20px 0;"><p style="color: var(--color-text-muted);">Tidak ada jadwal/kegiatan pada tanggal ini.</p></div>`;
                    } else {
                        kontainerDetail.innerHTML = '';
                        agendaDitemukan.forEach(ag => {
                            kontainerDetail.innerHTML += `<div style="background: var(--color-background); border: 1px solid var(--color-border); padding: 16px; border-radius: 8px; margin-bottom: 12px; position: relative;"><button class="btn-icon-only text-danger" onclick="hapusKaldik(${ag.id})" style="position: absolute; top: 12px; right: 12px;"><i class="ph ph-trash"></i></button><h3 style="font-size: 15px; margin-bottom: 4px;">${sanitize(ag.kegiatan)}</h3><p style="font-size: 13px; color: var(--color-text-muted);">${sanitize(ag.ket) || '-'}</p></div>`;
                        });
                    }
                }
            };

            document.getElementById('btn-kaldik-prev')?.addEventListener('click', () => { bulanAktif--; if (bulanAktif < 0) { bulanAktif = 11; tahunAktif--; } renderKalender(); });
            document.getElementById('btn-kaldik-next')?.addEventListener('click', () => { bulanAktif++; if (bulanAktif > 11) { bulanAktif = 0; tahunAktif++; } renderKalender(); });

            document.getElementById('form-tambah-kaldik')?.addEventListener('submit', function (e) {
                e.preventDefault();
                dbKaldik.push({ id: Date.now(), tanggal: document.getElementById('kaldik-input-tgl').value, kegiatan: sanitize(document.getElementById('kaldik-input-kegiatan').value), ket: sanitize(document.getElementById('kaldik-input-ket').value) });
                DB.setKaldik(dbKaldik); this.reset(); document.getElementById('kaldik-input-tgl').value = tanggalTerpilih;
                renderKalender(); renderPanelKanan(); tampilkanToast(`Agenda ditambahkan.`, 'success');
            });

            window.hapusKaldik = (idKaldik) => {
                if (confirm('Hapus agenda ini?')) { dbKaldik = dbKaldik.filter(k => k.id !== idKaldik); DB.setKaldik(dbKaldik); renderKalender(); renderPanelKanan(); tampilkanToast(`Agenda dihapus.`, 'warning'); }
            };

            renderKalender(); renderPanelKanan();
        }

        // --- C. PRESENSI ---
        if (namaView === 'presensi') {
            let dataPresensi = DB.getPresensi();
            const dbKelas = DB.getKelas(); const dbSiswa = DB.getSiswa();

            const tbody = document.getElementById('body-tabel-presensi');
            const selectMapel = document.getElementById('input-mapel-kelas');
            const selectSiswa = document.getElementById('input-nama');
            const filterKelasPresensi = document.getElementById('filter-kelas-presensi');

            if (document.getElementById('input-tanggal')) document.getElementById('input-tanggal').valueAsDate = new Date();

            if (selectMapel) {
                selectMapel.innerHTML = '<option value="" disabled selected>Pilih Jadwal Anda...</option>';
                dbKelas.forEach(k => { selectMapel.innerHTML += `<option value="${k.mapel} - Kelas ${k.namaKelas}" data-kelas-target="${k.namaKelas}">${k.mapel} (Kelas ${k.namaKelas})</option>`; });

                selectMapel.addEventListener('change', function () {
                    const targetKelas = this.options[this.selectedIndex].dataset.kelasTarget;
                    selectSiswa.innerHTML = '<option value="" disabled selected>Pilih Siswa...</option>';
                    const siswaDitemukan = dbSiswa.filter(s => s.kelas === targetKelas);
                    if (siswaDitemukan.length === 0) {
                        selectSiswa.innerHTML = `<option value="" disabled>Belum ada anak di kelas ${targetKelas}</option>`; selectSiswa.disabled = true;
                    } else {
                        siswaDitemukan.sort((a, b) => a.nama.localeCompare(b.nama)).forEach(s => { selectSiswa.innerHTML += `<option value="${s.nama}">${s.nama}</option>`; });
                        selectSiswa.disabled = false; selectSiswa.style.cursor = 'pointer'; selectSiswa.style.background = 'white';
                    }
                });
            }

            const renderTabelPresensi = () => {
                tbody.innerHTML = '';
                const kelasPilihan = filterKelasPresensi ? filterKelasPresensi.value : 'Semua';
                let dataTampil = dataPresensi;
                if (kelasPilihan !== 'Semua') dataTampil = dataPresensi.filter(d => { const s = dbSiswa.find(s => s.nama === d.nama); return s && s.kelas === kelasPilihan; });

                if (dataTampil.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada data kehadiran.</td></tr>`; return; }

                [...dataTampil].reverse().forEach((data) => {
                    let classBadge = data.status === 'Hadir' ? 'badge-success' : (data.status === 'Izin' ? 'badge-warning' : 'badge-danger');
                    tbody.innerHTML += `<tr><td>${formatTglBaku(new Date(data.tanggal))}</td><td class="text-muted">${sanitize(data.mapel) || '-'}</td><td class="font-medium">${sanitize(data.nama)}</td><td><span class="badge ${classBadge}">${data.status}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataPresensi('${data.id}')"><i class="ph ph-trash"></i></button></td></tr>`;
                });
            };

            if (filterKelasPresensi) filterKelasPresensi.addEventListener('change', renderTabelPresensi);

            document.getElementById('form-tambah-presensi')?.addEventListener('submit', function (e) {
                e.preventDefault();
                dataPresensi.push({ id: Date.now().toString(), tanggal: document.getElementById('input-tanggal').value, mapel: sanitize(document.getElementById('input-mapel-kelas').value), nama: sanitize(document.getElementById('input-nama').value), status: document.getElementById('input-status').value });
                DB.setPresensi(dataPresensi);
                const tglAkhir = document.getElementById('input-tanggal').value; const mapelAkhir = selectMapel.value;
                this.reset(); document.getElementById('input-tanggal').value = tglAkhir; selectMapel.value = mapelAkhir;
                if (filterKelasPresensi) filterKelasPresensi.value = 'Semua';
                renderTabelPresensi(); tampilkanToast(`Kehadiran disimpan.`, 'success');
            });

            window.hapusDataPresensi = (id) => { if (confirm('Hapus data ini?')) { dataPresensi = dataPresensi.filter(p => p.id !== id); DB.setPresensi(dataPresensi); renderTabelPresensi(); tampilkanToast(`Data dihapus.`, 'warning'); } };

            document.getElementById('btn-ekspor-presensi')?.addEventListener('click', function () {
                let d = dataPresensi; const k = filterKelasPresensi ? filterKelasPresensi.value : 'Semua';
                if (k !== 'Semua') d = dataPresensi.filter(x => { const s = dbSiswa.find(s => s.nama === x.nama); return s && s.kelas === k; });
                if (d.length === 0) return tampilkanToast('Tidak ada data!', 'danger');
                this.innerHTML = '<i class="ph ph-spinner ph-spin"></i>'; this.style.pointerEvents = 'none';
                setTimeout(() => {
                    let csv = "Tanggal,Mata Pelajaran Binaan,Nama Siswa,Status\n";
                    d.forEach(x => { csv += `"${x.tanggal}","${x.mapel}","${x.nama}","${x.status}"\n`; });
                    mengunduhFileCSV(csv, `Absensi_Kelas_${k}.csv`);
                    this.innerHTML = '<i class="ph ph-download-simple"></i> Ekspor (CSV)'; this.style.pointerEvents = 'auto';
                }, 800);
            });
            renderTabelPresensi();
        }

        // --- D. KELAS SAYA ---
        if (namaView === 'kelas') {
            let dataKelas = DB.getKelas();
            const gridKelas = document.getElementById('grid-kelas');

            const renderGridKelas = () => {
                gridKelas.innerHTML = '';
                if (dataKelas.length === 0) { gridKelas.innerHTML = `<div style="grid-column: 1 / -1;" class="empty-state"><h2>Belum Ada Kelas</h2></div>`; return; }
                [...dataKelas].reverse().forEach((data) => {
                    const badgeWA = data.wa_aktif ? `<span style="font-size:11px; background:#DCFCE7; color:#166534; padding:2px 8px; border-radius:12px; display:inline-block; margin-top:8px;">WA Notif Aktif</span>` : '';
                    gridKelas.innerHTML += `<div class="card" style="padding: 24px; position: relative;">
                        <button class="btn-icon-only text-danger" style="position: absolute; top: 16px; right: 16px;" onclick="hapusDataKelas('${data.id}')"><i class="ph ph-trash"></i></button>
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;"><div class="stat-icon primary-light"><i class="ph ph-books text-primary"></i></div><div><h3 style="font-size: 16px; margin-bottom: 4px;">${sanitize(data.mapel)}</h3><span class="badge badge-success">Kelas ${data.namaKelas}</span>${badgeWA}</div></div>
                        <div style="padding-top: 16px; border-top: 1px dashed var(--color-border);"><div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>HARI</span><strong>${data.hari}</strong></div><div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>JAM KE</span><strong>${data.jamke}</strong></div><div style="display:flex; justify-content:space-between;"><span>WAKTU</span><strong>${data.waktu}</strong></div></div></div>`;
                });
            };

            document.getElementById('form-tambah-kelas')?.addEventListener('submit', function (e) {
                e.preventDefault();
                const waAktif = document.getElementById('input-wa').checked;
                const p = DB.getProfil();
                if (waAktif && (!p.wa || p.wa.trim() === '')) return tampilkanToast('Gagal! Anda wajib melengkapi Nomor WA di menu Pengaturan.', 'danger');

                dataKelas.push({ id: Date.now().toString(), hari: document.getElementById('input-hari').value, jamke: document.getElementById('input-jamke').value, waktu: document.getElementById('input-waktu').value, mapel: sanitize(document.getElementById('input-mapel').value), namaKelas: document.getElementById('input-namakelas').value, wa_aktif: waAktif });
                DB.setKelas(dataKelas); this.reset(); renderGridKelas();
                if (waAktif) tampilkanToast(`Bot WA akan mengirim pengingat ke ${p.wa}.`, 'success'); else tampilkanToast(`Jadwal ditambahkan.`, 'success');
            });

            window.hapusDataKelas = (id) => { if (confirm('Hapus jadwal ini?')) { dataKelas = dataKelas.filter(k => k.id !== id); DB.setKelas(dataKelas); renderGridKelas(); } };
            renderGridKelas();
        }

        // --- E. DATA SISWA ---
        if (namaView === 'siswa') {
            let dataSiswa = DB.getSiswa();
            const tbodySiswa = document.getElementById('body-tabel-siswa');
            const filterKelas = document.getElementById('filter-kelas-siswa');

            const renderTabelSiswa = () => {
                tbodySiswa.innerHTML = '';
                const kelasPilihan = filterKelas ? filterKelas.value : 'Semua';
                let dataTampil = kelasPilihan !== 'Semua' ? dataSiswa.filter(s => s.kelas === kelasPilihan) : dataSiswa;

                if (dataTampil.length === 0) { tbodySiswa.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada siswa.</td></tr>`; return; }
                [...dataTampil].reverse().forEach((d) => {
                    tbodySiswa.innerHTML += `<tr><td><span class="font-medium">${sanitize(d.nama)}</span><br><span style="font-size:11px; color:var(--color-text-muted);">NIK: ${sanitize(d.nik)}</span></td><td><span class="badge" style="background:var(--color-primary-light); color:var(--color-primary);">${d.kelas}</span></td><td>${d.jk === 'Laki-laki' ? 'L' : 'P'}</td><td>${sanitize(d.ayah)}</td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataSiswa('${d.id}')"><i class="ph ph-trash"></i></button></td></tr>`;
                });
            };

            if (filterKelas) filterKelas.addEventListener('change', renderTabelSiswa);

            document.getElementById('form-tambah-siswa')?.addEventListener('submit', function (e) {
                e.preventDefault();
                dataSiswa.push({ id: Date.now().toString(), nama: sanitize(document.getElementById('s-nama').value), jk: document.getElementById('s-jk').value, kelas: document.getElementById('s-kelas').value, nik: sanitize(document.getElementById('s-nik').value), ayah: sanitize(document.getElementById('s-ayah').value), tmplahir: '', tgllahir: '', agama: '', kk: '', kerjaayah: '', ibu: '', kerjaibu: '', alamat: '' });
                DB.setSiswa(dataSiswa); this.reset(); if (filterKelas) filterKelas.value = 'Semua'; renderTabelSiswa(); tampilkanToast(`Data siswa didaftarkan.`, 'success');
            });

            window.hapusDataSiswa = (id) => { if (confirm('Hapus siswa ini?')) { dataSiswa = dataSiswa.filter(s => s.id !== id); DB.setSiswa(dataSiswa); renderTabelSiswa(); } };

            document.getElementById('btn-ekspor-siswa')?.addEventListener('click', function () {
                let d = dataSiswa; const k = filterKelas ? filterKelas.value : 'Semua';
                if (k !== 'Semua') d = dataSiswa.filter(s => s.kelas === k);
                if (d.length === 0) return tampilkanToast('Tidak ada data!', 'danger');
                this.innerHTML = '<i class="ph ph-spinner ph-spin"></i>'; this.style.pointerEvents = 'none';
                setTimeout(() => {
                    let csv = "Nama Lengkap,Jenis Kelamin,Kelas,NIK,Nama Ayah\n";
                    d.forEach(x => { csv += `"${x.nama}","${x.jk}","${x.kelas}","${x.nik}","${x.ayah}"\n`; });
                    mengunduhFileCSV(csv, `Data_Siswa_${k}.csv`);
                    this.innerHTML = '<i class="ph ph-download-simple"></i> Ekspor (CSV)'; this.style.pointerEvents = 'auto';
                }, 800);
            });
            renderTabelSiswa();
        }

        // --- F. NILAI AKADEMIK ---
        if (namaView === 'nilai') {
            let dataNilai = DB.getNilai(); const dbSiswa = DB.getSiswa();
            const tbodyNilai = document.getElementById('body-tabel-nilai');
            const filterKelasNilai = document.getElementById('filter-kelas-nilai');

            const renderTabelNilai = () => {
                tbodyNilai.innerHTML = '';
                const k = filterKelasNilai ? filterKelasNilai.value : 'Semua';
                let dataTampil = k !== 'Semua' ? dataNilai.filter(d => { const s = dbSiswa.find(s => s.nama === d.nama); return s && s.kelas === k; }) : dataNilai;

                if (dataTampil.length === 0) { tbodyNilai.innerHTML = `<tr><td colspan="6" style="text-align:center;">Belum ada nilai.</td></tr>`; return; }
                [...dataTampil].reverse().forEach((data) => {
                    const isTuntas = parseInt(data.skor) >= 75;
                    tbodyNilai.innerHTML += `<tr><td class="font-medium">${sanitize(data.nama)}</td><td class="text-muted">${sanitize(data.mapel)}</td><td>${data.jenis}</td><td style="text-align: center; font-weight: 700;">${data.skor}</td><td><span class="badge ${isTuntas ? 'badge-success' : 'badge-danger'}">${isTuntas ? 'Tuntas' : 'Remedial'}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataNilai('${data.id}')"><i class="ph ph-trash"></i></button></td></tr>`;
                });
            };

            if (filterKelasNilai) filterKelasNilai.addEventListener('change', renderTabelNilai);

            document.getElementById('form-tambah-nilai')?.addEventListener('submit', function (e) {
                e.preventDefault();
                const skor = parseInt(document.getElementById('input-nilai-skor').value);
                if (skor < 0 || skor > 100) return tampilkanToast('Skor tidak valid!', 'danger');

                dataNilai.push({ id: Date.now().toString(), nama: sanitize(document.getElementById('input-nilai-nama').value), mapel: sanitize(document.getElementById('input-nilai-mapel').value), jenis: document.getElementById('input-nilai-jenis').value, skor: skor });
                DB.setNilai(dataNilai); this.reset(); if (filterKelasNilai) filterKelasNilai.value = 'Semua'; renderTabelNilai(); tampilkanToast(`Nilai disimpan.`, 'success');
            });

            window.hapusDataNilai = (id) => { if (confirm('Hapus nilai ini?')) { dataNilai = dataNilai.filter(n => n.id !== id); DB.setNilai(dataNilai); renderTabelNilai(); } };

            document.getElementById('btn-ekspor-nilai')?.addEventListener('click', function () {
                let d = dataNilai; const k = filterKelasNilai ? filterKelasNilai.value : 'Semua';
                if (k !== 'Semua') d = dataNilai.filter(x => { const s = dbSiswa.find(s => s.nama === x.nama); return s && s.kelas === k; });
                if (d.length === 0) return tampilkanToast('Tidak ada data!', 'danger');
                this.innerHTML = '<i class="ph ph-spinner ph-spin"></i>'; this.style.pointerEvents = 'none';
                setTimeout(() => {
                    let csv = "Nama Siswa,Mata Pelajaran,Jenis Evaluasi,Skor\n";
                    d.forEach(x => { csv += `"${x.nama}","${x.mapel}","${x.jenis}","${x.skor}"\n`; });
                    mengunduhFileCSV(csv, `Rekap_Nilai_${k}.csv`);
                    this.innerHTML = '<i class="ph ph-download-simple"></i> Ekspor Rapor Kelas'; this.style.pointerEvents = 'auto';
                }, 800);
            });
            renderTabelNilai();
        }

        // --- G. PENGATURAN ---
        if (namaView === 'pengaturan') {
            const tabLinks = document.querySelectorAll('#menu-tab-pengaturan .nav-item[data-tab]');
            const tabContents = document.querySelectorAll('.tab-pengaturan-area');

            tabLinks.forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    tabLinks.forEach(l => l.classList.remove('active')); this.classList.add('active');
                    tabContents.forEach(c => c.style.display = 'none'); document.getElementById(`tab-konten-${this.getAttribute('data-tab')}`).style.display = 'block';
                });
            });

            const p = DB.getProfil();
            if (document.getElementById('setting-nama')) document.getElementById('setting-nama').value = p.nama || '';
            if (document.getElementById('setting-peran')) document.getElementById('setting-peran').value = p.peran || '';
            if (document.getElementById('setting-wa')) document.getElementById('setting-wa').value = p.wa || '';
            if (document.getElementById('setting-jk')) document.getElementById('setting-jk').value = p.jk || '';
            if (document.getElementById('notif-wa')) document.getElementById('notif-wa').checked = p.notif_wa !== false;
            if (document.getElementById('notif-browser')) document.getElementById('notif-browser').checked = p.notif_browser !== false;
            if (document.getElementById('notif-email')) document.getElementById('notif-email').checked = p.notif_email === true;
            if (document.getElementById('tema-gelap')) document.getElementById('tema-gelap').checked = p.tema_gelap === true;

            document.getElementById('form-pengaturan-profil')?.addEventListener('submit', function (e) {
                e.preventDefault(); let d = DB.getProfil();
                d.nama = sanitize(document.getElementById('setting-nama').value); d.peran = sanitize(document.getElementById('setting-peran').value); d.wa = sanitize(document.getElementById('setting-wa').value); d.jk = document.getElementById('setting-jk').value;
                DB.setProfil(d); renderProfilGlobal(); tampilkanToast('Profil Tersimpan.', 'success');
            });

            document.getElementById('form-pengaturan-notif')?.addEventListener('submit', function (e) {
                e.preventDefault(); let d = DB.getProfil();
                d.notif_wa = document.getElementById('notif-wa').checked; d.notif_browser = document.getElementById('notif-browser').checked; d.notif_email = document.getElementById('notif-email').checked;
                DB.setProfil(d); tampilkanToast('Preferensi Diperbarui.', 'success');
            });

            document.getElementById('form-pengaturan-tema')?.addEventListener('submit', function (e) {
                e.preventDefault(); let d = DB.getProfil();
                d.tema_gelap = document.getElementById('tema-gelap').checked; DB.setProfil(d); terapkanTemaGlobal(); tampilkanToast('Tema diperbarui.', 'success');
            });

            document.getElementById('btn-reset-data')?.addEventListener('click', function () {
                if (DB.resetData()) { tampilkanToast('Sistem diformat...', 'warning'); setTimeout(() => window.location.reload(), 1500); }
            });
        }

        // PENCARIAN GLOBAL
        const inputPencarian = document.getElementById('input-pencarian');
        if (inputPencarian) {
            const inputBaru = inputPencarian.cloneNode(true); inputPencarian.parentNode.replaceChild(inputBaru, inputPencarian); inputBaru.value = '';
            inputBaru.addEventListener('keyup', function (e) {
                const teks = sanitize(e.target.value.toLowerCase());
                document.querySelectorAll('.view-section.active tbody tr').forEach(b => { if (b.cells.length > 1) b.style.display = b.textContent.toLowerCase().includes(teks) ? '' : 'none'; });
            });
        }
    };

    // NAVIGASI STATIS LAINNYA
    document.getElementById('btn-profil')?.addEventListener('click', () => bukaModul('pengaturan'));
    document.getElementById('btn-info-sekolah')?.addEventListener('click', () => bukaModul('info'));

    // Tombol Keluar dengan Autentikasi
    document.getElementById('btn-keluar')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin keluar sesi?")) {
            Auth.logout();
        }
    });

    document.getElementById('btn-notifikasi')?.addEventListener('click', () => {
        const agenda = DB.getKaldik().filter(k => k.tanggal >= formatTglBaku(new Date())).sort((a, b) => a.tanggal.localeCompare(b.tanggal))[0];
        if (agenda) tampilkanToast(`Agenda Terdekat: ${sanitize(agenda.kegiatan)}`, 'info'); else tampilkanToast('Tidak ada agenda baru.', 'info');
    });

    itemNavigasi.forEach(item => {
        item.addEventListener('click', function (e) { e.preventDefault(); const t = this.getAttribute('data-target'); if (t) bukaModul(t); });
    });

    // INIT
    bukaModul('dashboard');
});