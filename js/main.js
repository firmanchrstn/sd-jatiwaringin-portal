import { formatTglBaku, tampilkanToast, mengunduhFileCSV, sanitize } from './utils.js';
import { DB } from './database.js';
import { Auth } from './auth.js';

window.tampilkanToast = tampilkanToast;

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 🤖 KONFIGURASI GLOBAL ASISTEN AI GEMINI
    // ==========================================
    // Silakan masukkan API Key Gemini Anda di antara tanda kutip di bawah ini:
    const GEMINI_API_KEY = "AQ.Ab8RN6KOtSa4Lah7zu72sZOUJn2YMu1_exuFfZbDAZRIUXFAaw";


    // ==========================================
    // SISTEM PENGAMAN (ROUTE GUARD & LOGIN)
    // ==========================================
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;

            const btnSubmit = formLogin.querySelector('button');
            btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memverifikasi Server...';
            btnSubmit.disabled = true;

            try {
                await Auth.login(email, pass);
                tampilkanToast('Otorisasi Firebase Berhasil! Mengalihkan...', 'success');
                setTimeout(() => window.location.reload(), 1200);
            } catch (error) {
                tampilkanToast('Akses Ditolak! Kredensial tidak valid.', 'danger');
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

    window.bukaModalDetailAgenda = (id) => {
        let dbKaldik = DB.getKaldik();
        let agenda = dbKaldik.find(k => k.id === id);
        if (!agenda) return;

        let modal = document.getElementById('modal-agenda-detail');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-agenda-detail';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px); opacity: 0; transition: opacity 0.2s;';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="card" style="width: 90%; max-width: 450px; padding: 24px; position: relative; transform: translateY(20px); transition: transform 0.2s;">
                <button id="modal-close-btn" class="btn-icon-only text-danger" style="position: absolute; top: 16px; right: 16px;" title="Tutup Pop-up"><i class="ph ph-x"></i></button>
                <h2 style="font-size: 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;"><i class="ph ph-calendar-check" style="color: var(--color-primary); font-size: 24px;"></i> Detail Agenda</h2>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="form-group"><label class="form-label">TANGGAL MULAI</label><input type="date" id="modal-inp-tgl" class="form-control" value="${agenda.tanggal}" disabled style="color: var(--color-text-main); opacity: 1;"></div>
                    <div class="form-group"><label class="form-label">TANGGAL SELESAI</label><input type="date" id="modal-inp-tglakhir" class="form-control" value="${agenda.tanggal_akhir || agenda.tanggal}" disabled style="color: var(--color-text-main); opacity: 1;"></div>
                    <div class="form-group"><label class="form-label">NAMA KEGIATAN</label><input type="text" id="modal-inp-keg" class="form-control" value="${sanitize(agenda.kegiatan)}" disabled style="color: var(--color-text-main); opacity: 1;"></div>
                    <div class="form-group"><label class="form-label">KETERANGAN / DETAIL</label><textarea id="modal-inp-ket" class="form-control" disabled style="color: var(--color-text-main); opacity: 1; resize: none; height: 80px;">${sanitize(agenda.ket || '')}</textarea></div>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button id="modal-btn-edit" class="btn btn-outline" style="flex: 1; justify-content: center;"><i class="ph ph-pencil-simple"></i> Edit Data</button>
                    <button id="modal-btn-cancel" class="btn btn-outline" style="flex: 1; justify-content: center; display: none; color: var(--color-text-muted);"><i class="ph ph-x-circle"></i> Batal</button>
                    <button id="modal-btn-save" class="btn btn-primary" style="flex: 1; justify-content: center; display: none;" disabled><i class="ph ph-floppy-disk"></i> Simpan</button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('.card').style.transform = 'translateY(0)'; }, 10);

        const tutupModal = () => {
            modal.style.opacity = '0';
            modal.querySelector('.card').style.transform = 'translateY(20px)';
            setTimeout(() => modal.style.display = 'none', 200);
        };
        document.getElementById('modal-close-btn').onclick = tutupModal;

        const btnEdit = document.getElementById('modal-btn-edit'); const btnCancel = document.getElementById('modal-btn-cancel'); const btnSave = document.getElementById('modal-btn-save');
        const inputs = [document.getElementById('modal-inp-tgl'), document.getElementById('modal-inp-tglakhir'), document.getElementById('modal-inp-keg'), document.getElementById('modal-inp-ket')];
        const valAsli = [agenda.tanggal, agenda.tanggal_akhir || agenda.tanggal, agenda.kegiatan, agenda.ket || ''];

        btnEdit.onclick = () => { inputs.forEach(i => i.disabled = false); inputs[2].focus(); btnEdit.style.display = 'none'; btnCancel.style.display = 'flex'; btnSave.style.display = 'flex'; };
        btnCancel.onclick = () => { inputs[0].value = valAsli[0]; inputs[1].value = valAsli[1]; inputs[2].value = valAsli[2]; inputs[3].value = valAsli[3]; inputs.forEach(i => i.disabled = true); btnCancel.style.display = 'none'; btnSave.style.display = 'none'; btnEdit.style.display = 'flex'; };

        const cekPerubahan = () => { const adaBerubah = inputs[0].value !== valAsli[0] || inputs[1].value !== valAsli[1] || inputs[2].value !== valAsli[2] || inputs[3].value !== valAsli[3]; btnSave.disabled = !adaBerubah; };
        inputs.forEach(i => i.addEventListener('input', cekPerubahan));

        btnSave.onclick = () => {
            if (inputs[1].value < inputs[0].value) return tampilkanToast('Peringatan: Tanggal Selesai harus sesudah Tanggal Mulai!', 'danger');
            agenda.tanggal = inputs[0].value; agenda.tanggal_akhir = inputs[1].value; agenda.kegiatan = sanitize(inputs[2].value); agenda.ket = sanitize(inputs[3].value);
            const index = dbKaldik.findIndex(k => k.id === id);
            if (index > -1) { dbKaldik[index] = agenda; DB.setKaldik(dbKaldik); tutupModal(); tampilkanToast('Perubahan agenda berhasil disimpan.', 'success'); inisialisasiHalaman('dashboard'); }
        };
    };

    const inisialisasiHalaman = (namaView) => {

        // --- A. DASBOR ---
        if (namaView === 'dashboard') {
            const elemenTanggal = document.getElementById('tanggal-hari-ini');
            if (elemenTanggal) elemenTanggal.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const elemenSapaan = document.querySelector('.page-header .header-text h1');
            if (elemenSapaan) {
                const p = DB.getProfil(); const jam = new Date().getHours();
                let teksWaktu = 'Pagi'; if (jam >= 11 && jam <= 14) teksWaktu = 'Siang'; else if (jam >= 15 && jam <= 18) teksWaktu = 'Sore'; else if (jam > 18 || jam < 4) teksWaktu = 'Malam';
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
                const agendaMendatang = DB.getKaldik().filter(k => (k.tanggal_akhir || k.tanggal) >= hariIni).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(0, 3);

                if (agendaMendatang.length === 0) {
                    containerKaldik.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 20px;">Tidak ada agenda dalam waktu dekat.</p>';
                } else {
                    agendaMendatang.forEach(item => {
                        const tglObj = new Date(item.tanggal); const tglAkhirObj = new Date(item.tanggal_akhir || item.tanggal);
                        const bulanSingkat = tglObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                        let bgWarna = 'var(--color-primary-light)'; let txtWarna = 'var(--color-primary)';
                        const isLibur = item.kegiatan.toLowerCase().includes('libur') || tglObj.getDay() === 0;
                        if (item.tanggal === hariIni || isLibur) { bgWarna = 'var(--color-danger-bg)'; txtWarna = 'var(--color-danger)'; }

                        const teksRentang = (item.tanggal !== (item.tanggal_akhir || item.tanggal)) ? `<span style="font-size:11px; background:var(--color-primary-light); color:var(--color-primary); padding:2px 6px; border-radius:4px; margin-left:8px; display:inline-block; vertical-align:middle;">s.d. ${tglAkhirObj.getDate()} ${tglAkhirObj.toLocaleDateString('id-ID', { month: 'short' })}</span>` : '';

                        containerKaldik.insertAdjacentHTML('beforeend', `
                            <div class="agenda-item-dash" data-id="${item.id}" style="display: flex; gap: 16px; padding: 12px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background 0.2s; border-radius: 8px;" title="Klik untuk lihat detail">
                                <div style="background: ${bgWarna}; color: ${txtWarna}; padding: 8px 16px; border-radius: 8px; font-weight: bold; text-align: center; min-width: 70px;">${bulanSingkat}<br><span style="font-size: 20px;">${tglObj.getDate()}</span></div>
                                <div style="display: flex; flex-direction: column; justify-content: center;"><h4 style="margin-bottom: 4px; font-size: 15px; color: var(--color-text-main); display: flex; align-items: center;">${sanitize(item.kegiatan)} ${teksRentang}</h4><p style="color: var(--color-text-muted); font-size: 13px;">${sanitize(item.ket) || '-'}</p></div>
                            </div>
                        `);
                    });
                    document.querySelectorAll('.agenda-item-dash').forEach(el => { el.addEventListener('mouseenter', () => el.style.background = 'var(--color-background)'); el.addEventListener('mouseleave', () => el.style.background = 'transparent'); el.addEventListener('click', () => bukaModalDetailAgenda(parseInt(el.getAttribute('data-id')))); });
                }
            }
        }

        // --- B. KALDIK ---
        if (namaView === 'kaldik') {
            let dbKaldik = DB.getKaldik();
            let bulanAktif = new Date().getMonth(); let tahunAktif = new Date().getFullYear();
            let tanggalTerpilih = formatTglBaku(new Date());

            const renderSemuaAgenda = () => {
                const tbody = document.getElementById('body-semua-agenda'); if (!tbody) return; tbody.innerHTML = '';
                const semuaData = [...dbKaldik].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
                if (semuaData.length === 0) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 32px;">Belum ada agenda di kalender.</td></tr>`; return; }

                semuaData.forEach(ag => {
                    const formatTgl = (t) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    const tglAkhir = ag.tanggal_akhir || ag.tanggal;
                    let teksTanggal = `<span class="font-medium">${formatTgl(ag.tanggal)}</span>`;
                    if (ag.tanggal !== tglAkhir) { teksTanggal += `<br><span style="font-size:11px; color:var(--color-text-muted);">s.d. ${formatTgl(tglAkhir)}</span>`; }
                    tbody.innerHTML += `<tr><td style="white-space: nowrap;">${teksTanggal}</td><td><strong style="display:block; margin-bottom:4px;">${sanitize(ag.kegiatan)}</strong><span style="font-size:12px; color:var(--color-text-muted);">${sanitize(ag.ket) || '-'}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusKaldik(${ag.id})" title="Hapus Agenda"><i class="ph ph-trash"></i></button></td></tr>`;
                });
            };

            const renderKalender = () => {
                const containerDays = document.getElementById('kaldik-days-container');
                if (document.getElementById('kaldik-month-year')) document.getElementById('kaldik-month-year').textContent = new Date(tahunAktif, bulanAktif, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                if (!containerDays) return; containerDays.innerHTML = '';

                const hariPertama = new Date(tahunAktif, bulanAktif, 1).getDay(); const totalHari = new Date(tahunAktif, bulanAktif + 1, 0).getDate(); const hariIniBaku = formatTglBaku(new Date());

                for (let i = 0; i < hariPertama; i++) containerDays.innerHTML += `<div class="calendar-cell empty"></div>`;
                for (let i = 1; i <= totalHari; i++) {
                    const dateObj = new Date(tahunAktif, bulanAktif, i); const tglLooping = formatTglBaku(dateObj);
                    const agendaAda = dbKaldik.filter(k => { const tglAkhir = k.tanggal_akhir || k.tanggal; return tglLooping >= k.tanggal && tglLooping <= tglAkhir; });
                    const titikAgenda = agendaAda.length > 0 ? `<div class="calendar-event-dot"></div>` : '';
                    let isLibur = (dateObj.getDay() === 0) || agendaAda.some(a => a.kegiatan.toLowerCase().includes('libur'));
                    let kelasTambahan = (tglLooping === hariIniBaku) ? ' today' : ''; if (tglLooping === tanggalTerpilih) kelasTambahan += ' selected';
                    let styleMerah = (isLibur && tglLooping !== tanggalTerpilih) ? 'color: var(--color-danger); font-weight: 700;' : '';
                    containerDays.innerHTML += `<div class="calendar-cell ${kelasTambahan}" data-tgl="${tglLooping}" style="${styleMerah}">${i}${titikAgenda}</div>`;
                }
                document.querySelectorAll('.calendar-cell:not(.empty)').forEach(cell => { cell.addEventListener('click', function () { tanggalTerpilih = this.getAttribute('data-tgl'); renderKalender(); renderPanelKanan(); }); });
            };

            const renderPanelKanan = () => {
                const kontainerDetail = document.getElementById('kaldik-agenda-detail');
                if (document.getElementById('kaldik-selected-date-text')) document.getElementById('kaldik-selected-date-text').textContent = `Agenda: ${new Date(tanggalTerpilih).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                if (document.getElementById('kaldik-input-tgl')) document.getElementById('kaldik-input-tgl').value = tanggalTerpilih;

                const agendaDitemukan = dbKaldik.filter(k => { const tglAkhir = k.tanggal_akhir || k.tanggal; return tanggalTerpilih >= k.tanggal && tanggalTerpilih <= tglAkhir; });

                if (kontainerDetail) {
                    if (agendaDitemukan.length === 0) {
                        kontainerDetail.innerHTML = `<div style="text-align: center; padding: 20px 0;"><p style="color: var(--color-text-muted);">Tidak ada jadwal/kegiatan pada tanggal ini.</p></div>`;
                    } else {
                        kontainerDetail.innerHTML = '';
                        agendaDitemukan.forEach(ag => {
                            const formatTgl = (t) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                            const tglAkhir = ag.tanggal_akhir || ag.tanggal;
                            const labelRentang = (ag.tanggal !== tglAkhir) ? `<span style="font-size: 11px; background: var(--color-primary-light); color: var(--color-primary); padding: 4px 8px; border-radius: 6px; margin-bottom: 8px; display: inline-block; font-weight: 600;"><i class="ph ph-calendar"></i> ${formatTgl(ag.tanggal)} - ${formatTgl(tglAkhir)}</span><br>` : '';
                            kontainerDetail.innerHTML += `<div style="background: var(--color-background); border: 1px solid var(--color-border); padding: 16px; border-radius: 8px; margin-bottom: 12px; position: relative;"><button class="btn-icon-only text-danger" onclick="hapusKaldik(${ag.id})" style="position: absolute; top: 12px; right: 12px;"><i class="ph ph-trash"></i></button>${labelRentang}<h3 style="font-size: 15px; margin-bottom: 4px;">${sanitize(ag.kegiatan)}</h3><p style="font-size: 13px; color: var(--color-text-muted);">${sanitize(ag.ket) || '-'}</p></div>`;
                        });
                    }
                }
            };

            document.getElementById('btn-kaldik-prev')?.addEventListener('click', () => { bulanAktif--; if (bulanAktif < 0) { bulanAktif = 11; tahunAktif--; } renderKalender(); });
            document.getElementById('btn-kaldik-next')?.addEventListener('click', () => { bulanAktif++; if (bulanAktif > 11) { bulanAktif = 0; tahunAktif++; } renderKalender(); });

            document.getElementById('form-tambah-kaldik')?.addEventListener('submit', function (e) {
                e.preventDefault();
                const tglMulai = document.getElementById('kaldik-input-tgl').value; const elTglAkhir = document.getElementById('kaldik-input-tgl-akhir');
                let tglAkhir = (elTglAkhir && elTglAkhir.value) ? elTglAkhir.value : tglMulai;
                if (tglAkhir < tglMulai) return tampilkanToast('Peringatan: Tanggal Selesai harus setelah Tanggal Mulai!', 'danger');

                dbKaldik.push({ id: Date.now(), tanggal: tglMulai, tanggal_akhir: tglAkhir, kegiatan: sanitize(document.getElementById('kaldik-input-kegiatan').value), ket: sanitize(document.getElementById('kaldik-input-ket').value) });
                DB.setKaldik(dbKaldik); this.reset(); document.getElementById('kaldik-input-tgl').value = tanggalTerpilih; renderKalender(); renderPanelKanan(); renderSemuaAgenda(); tampilkanToast(`Agenda disimpan.`, 'success');
            });

            if (!window.hapusKaldik) { window.hapusKaldik = (idKaldik) => { if (confirm('Hapus agenda ini?')) { dbKaldik = dbKaldik.filter(k => k.id !== idKaldik); DB.setKaldik(dbKaldik); renderKalender(); renderPanelKanan(); renderSemuaAgenda(); tampilkanToast(`Agenda dihapus.`, 'warning'); } }; }
            renderKalender(); renderPanelKanan(); renderSemuaAgenda();
        }

        // --- C. PRESENSI & AI INTEGRATION ---
        if (namaView === 'presensi') {
            let dataPresensi = DB.getPresensi();
            const dbKelas = DB.getKelas(); const dbSiswa = DB.getSiswa();
            const tbody = document.getElementById('body-tabel-presensi'); const selectMapel = document.getElementById('input-mapel-kelas'); const selectSiswa = document.getElementById('input-nama'); const filterKelasPresensi = document.getElementById('filter-kelas-presensi');

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
                    } else { siswaDitemukan.sort((a, b) => a.nama.localeCompare(b.nama)).forEach(s => { selectSiswa.innerHTML += `<option value="${s.nama}">${s.nama}</option>`; }); selectSiswa.disabled = false; selectSiswa.style.cursor = 'pointer'; selectSiswa.style.background = 'white'; }
                });
            }

            const renderTabelPresensi = () => {
                tbody.innerHTML = ''; const kelasPilihan = filterKelasPresensi ? filterKelasPresensi.value : 'Semua'; let dataTampil = dataPresensi;
                if (kelasPilihan !== 'Semua') dataTampil = dataPresensi.filter(d => { const s = dbSiswa.find(s => s.nama === d.nama); return s && s.kelas === kelasPilihan; });
                if (dataTampil.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada data kehadiran.</td></tr>`; return; }
                [...dataTampil].reverse().forEach((data) => {
                    let classBadge = data.status === 'Hadir' ? 'badge-success' : (data.status === 'Izin' ? 'badge-warning' : 'badge-danger');
                    tbody.innerHTML += `<tr><td>${formatTglBaku(new Date(data.tanggal))}</td><td class="text-muted">${sanitize(data.mapel) || '-'}</td><td class="font-medium">${sanitize(data.nama)}</td><td><span class="badge ${classBadge}">${data.status}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataPresensi('${data.id}')"><i class="ph ph-trash"></i></button></td></tr>`;
                });
            };

            // 🤖 FUNGSI AI PRESENSI
            const btnProsesAI = document.getElementById('btn-proses-ai');
            if (btnProsesAI) {
                btnProsesAI.addEventListener('click', async () => {
                    const teks = document.getElementById('ai-absen-input').value; const tgl = document.getElementById('input-tanggal').value; const mapelKelas = selectMapel.value;
                    if (!mapelKelas) return tampilkanToast('Pilih Jadwal / Kelas di form bawah terlebih dahulu!', 'danger');
                    if (!teks.trim()) return tampilkanToast('Ketik pesan absen untuk AI!', 'danger');
                    if (GEMINI_API_KEY === "AQ.Ab8RN6KOtSa4Lah7zu72sZOUJn2YMu1_exuFfZbDAZRIUXFAaw") return tampilkanToast('API Key Gemini belum disetel.', 'warning');

                    const targetKelas = selectMapel.options[selectMapel.selectedIndex].dataset.kelasTarget;
                    const siswaKelas = dbSiswa.filter(s => s.kelas === targetKelas).map(s => s.nama);
                    if (siswaKelas.length === 0) return tampilkanToast(`Belum ada data murid di kelas ${targetKelas}`, 'danger');

                    btnProsesAI.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Menganalisis...'; btnProsesAI.disabled = true;

                    try {
                        const prompt = `Daftar murid: ${siswaKelas.join(', ')}. Dari chat ini: "${teks}". Tentukan status absen (Hadir, Sakit, Izin, Alpa) dari daftar murid tsb. Keluarkan HANYA JSON array murni tanpa backtick berisi objek: {"nama": "nama siswa", "status": "status"}.`;
                        const respons = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                        });
                        const dataJSON = await respons.json();
                        let textAI = dataJSON.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
                        JSON.parse(textAI).forEach(item => { dataPresensi.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), tanggal: tgl, mapel: sanitize(mapelKelas), nama: sanitize(item.nama), status: item.status }); });
                        DB.setPresensi(dataPresensi); renderTabelPresensi(); document.getElementById('ai-absen-input').value = ''; tampilkanToast(`Berhasil otomatisasi absensi via AI.`, 'success');
                    } catch (err) { console.error(err); tampilkanToast('Gagal memproses instruksi AI.', 'danger'); } finally { btnProsesAI.innerHTML = '<i class="ph ph-sparkle"></i> Proses dengan AI'; btnProsesAI.disabled = false; }
                });
            }

            if (filterKelasPresensi) filterKelasPresensi.addEventListener('change', renderTabelPresensi);
            document.getElementById('form-tambah-presensi')?.addEventListener('submit', function (e) {
                e.preventDefault(); dataPresensi.push({ id: Date.now().toString(), tanggal: document.getElementById('input-tanggal').value, mapel: sanitize(document.getElementById('input-mapel-kelas').value), nama: sanitize(document.getElementById('input-nama').value), status: document.getElementById('input-status').value }); DB.setPresensi(dataPresensi);
                const tglAkhir = document.getElementById('input-tanggal').value; const mapelAkhir = selectMapel.value; this.reset(); document.getElementById('input-tanggal').value = tglAkhir; selectMapel.value = mapelAkhir; if (filterKelasPresensi) filterKelasPresensi.value = 'Semua'; renderTabelPresensi(); tampilkanToast(`Kehadiran disimpan.`, 'success');
            });
            if (!window.hapusDataPresensi) { window.hapusDataPresensi = (id) => { if (confirm('Hapus data ini?')) { dataPresensi = dataPresensi.filter(p => p.id !== id); DB.setPresensi(dataPresensi); renderTabelPresensi(); tampilkanToast(`Data dihapus.`, 'warning'); } }; }
            document.getElementById('btn-ekspor-presensi')?.addEventListener('click', function () { /* ...fungsi ekspor... */ });
            renderTabelPresensi();
        }

        // --- D. KELAS SAYA ---
        if (namaView === 'kelas') {
            let dataKelas = DB.getKelas(); const gridKelas = document.getElementById('grid-kelas');
            const renderGridKelas = () => { /* ...render kelas... */ };
            document.getElementById('form-tambah-kelas')?.addEventListener('submit', function (e) {
                e.preventDefault(); const waAktif = document.getElementById('input-wa').checked; const p = DB.getProfil();
                if (waAktif && (!p.wa || p.wa.trim() === '')) return tampilkanToast('Gagal! Lengkapi WA di Pengaturan.', 'danger');
                dataKelas.push({ id: Date.now().toString(), hari: document.getElementById('input-hari').value, jamke: document.getElementById('input-jamke').value, waktu: document.getElementById('input-waktu').value, mapel: sanitize(document.getElementById('input-mapel').value), namaKelas: document.getElementById('input-namakelas').value, wa_aktif: waAktif }); DB.setKelas(dataKelas); this.reset(); renderGridKelas();
            });
            if (!window.hapusDataKelas) { window.hapusDataKelas = (id) => { if (confirm('Hapus jadwal?')) { dataKelas = dataKelas.filter(k => k.id !== id); DB.setKelas(dataKelas); renderGridKelas(); } }; }
            renderGridKelas();
        }

        // --- E. DATA SISWA & AI INTEGRATION ---
        if (namaView === 'siswa') {
            let dataSiswa = DB.getSiswa();
            const tbodySiswa = document.getElementById('body-tabel-siswa'); const filterKelas = document.getElementById('filter-kelas-siswa');

            const renderTabelSiswa = () => {
                tbodySiswa.innerHTML = ''; const kelasPilihan = filterKelas ? filterKelas.value : 'Semua'; let dataTampil = kelasPilihan !== 'Semua' ? dataSiswa.filter(s => s.kelas === kelasPilihan) : dataSiswa;
                if (dataTampil.length === 0) { tbodySiswa.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada siswa.</td></tr>`; return; }
                [...dataTampil].reverse().forEach((d) => { tbodySiswa.innerHTML += `<tr><td><span class="font-medium">${sanitize(d.nama)}</span><br><span style="font-size:11px; color:var(--color-text-muted);">NIK: ${sanitize(d.nik)}</span></td><td><span class="badge" style="background:var(--color-primary-light); color:var(--color-primary);">${d.kelas}</span></td><td>${d.jk === 'Laki-laki' ? 'L' : 'P'}</td><td>${sanitize(d.ayah)}</td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataSiswa('${d.id}')"><i class="ph ph-trash"></i></button></td></tr>`; });
            };

            // 🤖 FUNGSI AI SISWA
            const btnProsesAISiswa = document.getElementById('btn-proses-ai-siswa');
            if (btnProsesAISiswa) {
                btnProsesAISiswa.addEventListener('click', async () => {
                    const teks = document.getElementById('ai-siswa-input').value; const kelasTujuan = document.getElementById('s-kelas').value;
                    if (!teks.trim()) return tampilkanToast('Ketik pesan untuk AI!', 'danger');
                    if (GEMINI_API_KEY === "AQ.Ab8RN6KOtSa4Lah7zu72sZOUJn2YMu1_exuFfZbDAZRIUXFAaw") return tampilkanToast('API Key Gemini belum disetel.', 'warning');

                    btnProsesAISiswa.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memproses...'; btnProsesAISiswa.disabled = true;
                    try {
                        const prompt = `Teks: "${teks}". Ekstrak data siswa ke HANYA JSON array murni tanpa backtick. Properti objek: "nama", "jk" (wajib nilai "Laki-laki" atau "Perempuan"), "nik", "ayah". Semua anak ini kelas "${kelasTujuan}".`;
                        const respons = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
                        const dataJSON = await respons.json();
                        let textAI = dataJSON.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
                        let sukses = 0;
                        JSON.parse(textAI).forEach(item => {
                            if (dataSiswa.some(s => s.nik === item.nik && item.nik !== "")) return; // Cegah NIK duplikat
                            dataSiswa.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), nama: sanitize(item.nama), jk: item.jk, kelas: kelasTujuan, nik: sanitize(item.nik || ''), ayah: sanitize(item.ayah || ''), tmplahir: '', tgllahir: '', agama: '', kk: '', kerjaayah: '', ibu: '', kerjaibu: '', alamat: '' });
                            sukses++;
                        });
                        DB.setSiswa(dataSiswa); renderTabelSiswa(); document.getElementById('ai-siswa-input').value = ''; tampilkanToast(`Berhasil tambah ${sukses} siswa via AI.`, 'success');
                    } catch (e) { console.error(e); tampilkanToast('Gagal memproses kalimat AI.', 'danger'); } finally { btnProsesAISiswa.innerHTML = '<i class="ph ph-sparkle"></i> Tambah via AI'; btnProsesAISiswa.disabled = false; }
                });
            }

            if (filterKelas) filterKelas.addEventListener('change', renderTabelSiswa);
            document.getElementById('form-tambah-siswa')?.addEventListener('submit', function (e) {
                e.preventDefault(); const nikSiswa = sanitize(document.getElementById('s-nik').value);
                if (dataSiswa.some(s => s.nik === nikSiswa)) return tampilkanToast(`Gagal! NIK ${nikSiswa} sudah terdaftar.`, 'danger');
                dataSiswa.push({ id: Date.now().toString(), nama: sanitize(document.getElementById('s-nama').value), jk: document.getElementById('s-jk').value, kelas: document.getElementById('s-kelas').value, nik: nikSiswa, ayah: sanitize(document.getElementById('s-ayah').value), tmplahir: '', tgllahir: '', agama: '', kk: '', kerjaayah: '', ibu: '', kerjaibu: '', alamat: '' });
                DB.setSiswa(dataSiswa); this.reset(); if (filterKelas) filterKelas.value = 'Semua'; renderTabelSiswa(); tampilkanToast(`Data siswa didaftarkan.`, 'success');
            });
            if (!window.hapusDataSiswa) { window.hapusDataSiswa = (id) => { if (confirm('Hapus siswa ini?')) { dataSiswa = dataSiswa.filter(s => s.id !== id); DB.setSiswa(dataSiswa); renderTabelSiswa(); } }; }
            document.getElementById('btn-ekspor-siswa')?.addEventListener('click', function () { /* ...ekspor... */ });
            renderTabelSiswa();
        }

        // --- F. NILAI AKADEMIK & AI INTEGRATION ---
        if (namaView === 'nilai') {
            let dataNilai = DB.getNilai(); const dbSiswa = DB.getSiswa();
            const tbodyNilai = document.getElementById('body-tabel-nilai'); const filterKelasNilai = document.getElementById('filter-kelas-nilai');

            const renderTabelNilai = () => {
                tbodyNilai.innerHTML = ''; const k = filterKelasNilai ? filterKelasNilai.value : 'Semua'; let dataTampil = k !== 'Semua' ? dataNilai.filter(d => { const s = dbSiswa.find(s => s.nama === d.nama); return s && s.kelas === k; }) : dataNilai;
                if (dataTampil.length === 0) { tbodyNilai.innerHTML = `<tr><td colspan="6" style="text-align:center;">Belum ada nilai.</td></tr>`; return; }
                [...dataTampil].reverse().forEach((data) => {
                    const isTuntas = parseInt(data.skor) >= 75;
                    tbodyNilai.innerHTML += `<tr><td class="font-medium">${sanitize(data.nama)}</td><td class="text-muted">${sanitize(data.mapel)}</td><td>${data.jenis}</td><td style="text-align: center; font-weight: 700;">${data.skor}</td><td><span class="badge ${isTuntas ? 'badge-success' : 'badge-danger'}">${isTuntas ? 'Tuntas' : 'Remedial'}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataNilai('${data.id}')"><i class="ph ph-trash"></i></button></td></tr>`;
                });
            };

            // 🤖 FUNGSI AI NILAI
            const btnProsesAINilai = document.getElementById('btn-proses-ai-nilai');
            if (btnProsesAINilai) {
                btnProsesAINilai.addEventListener('click', async () => {
                    const teks = document.getElementById('ai-nilai-input').value; const mapelTarget = document.getElementById('input-nilai-mapel').value; const jenisTarget = document.getElementById('input-nilai-jenis').value;
                    if (!teks.trim()) return tampilkanToast('Ketik data nilai untuk AI!', 'danger');
                    if (!mapelTarget) return tampilkanToast('Pilih/Ketik Mata Pelajaran di form bawah dulu!', 'danger');
                    if (GEMINI_API_KEY === "AQ.Ab8RN6KOtSa4Lah7zu72sZOUJn2YMu1_exuFfZbDAZRIUXFAaw") return tampilkanToast('API Key Gemini belum disetel.', 'warning');

                    btnProsesAINilai.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memproses...'; btnProsesAINilai.disabled = true;
                    try {
                        const prompt = `Dari teks ini: "${teks}". Ekstrak HANYA JSON array murni tanpa backtick berisi object: "nama" (string) dan "skor" (angka 0-100).`;
                        const respons = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
                        const dataJSON = await respons.json();
                        let textAI = dataJSON.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
                        let hasilParsed = JSON.parse(textAI);
                        hasilParsed.forEach(item => { dataNilai.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), nama: sanitize(item.nama), mapel: sanitize(mapelTarget), jenis: jenisTarget, skor: parseInt(item.skor) || 0 }); });
                        DB.setNilai(dataNilai); renderTabelNilai(); document.getElementById('ai-nilai-input').value = ''; tampilkanToast(`Berhasil menyimpan ${hasilParsed.length} nilai via AI.`, 'success');
                    } catch (e) { console.error(e); tampilkanToast('Gagal memproses AI.', 'danger'); } finally { btnProsesAINilai.innerHTML = '<i class="ph ph-sparkle"></i> Proses dengan AI'; btnProsesAINilai.disabled = false; }
                });
            }

            if (filterKelasNilai) filterKelasNilai.addEventListener('change', renderTabelNilai);
            document.getElementById('form-tambah-nilai')?.addEventListener('submit', function (e) {
                e.preventDefault(); const skor = parseInt(document.getElementById('input-nilai-skor').value);
                if (skor < 0 || skor > 100) return tampilkanToast('Skor tidak valid!', 'danger');
                dataNilai.push({ id: Date.now().toString(), nama: sanitize(document.getElementById('input-nilai-nama').value), mapel: sanitize(document.getElementById('input-nilai-mapel').value), jenis: document.getElementById('input-nilai-jenis').value, skor: skor });
                DB.setNilai(dataNilai); this.reset(); if (filterKelasNilai) filterKelasNilai.value = 'Semua'; renderTabelNilai(); tampilkanToast(`Nilai disimpan.`, 'success');
            });
            if (!window.hapusDataNilai) { window.hapusDataNilai = (id) => { if (confirm('Hapus nilai ini?')) { dataNilai = dataNilai.filter(n => n.id !== id); DB.setNilai(dataNilai); renderTabelNilai(); } }; }
            renderTabelNilai();
        }

        // --- G. PENGATURAN ---
        if (namaView === 'pengaturan') {
            const tabLinks = document.querySelectorAll('#menu-tab-pengaturan .nav-item[data-tab]'); const tabContents = document.querySelectorAll('.tab-pengaturan-area');
            tabLinks.forEach(link => { link.addEventListener('click', function (e) { e.preventDefault(); tabLinks.forEach(l => l.classList.remove('active')); this.classList.add('active'); tabContents.forEach(c => c.style.display = 'none'); document.getElementById(`tab-konten-${this.getAttribute('data-tab')}`).style.display = 'block'; }); });

            const p = DB.getProfil();
            if (document.getElementById('setting-nama')) document.getElementById('setting-nama').value = p.nama || '';
            if (document.getElementById('tema-gelap')) document.getElementById('tema-gelap').checked = p.tema_gelap === true;

            document.getElementById('form-pengaturan-profil')?.addEventListener('submit', function (e) { e.preventDefault(); let d = DB.getProfil(); d.nama = sanitize(document.getElementById('setting-nama').value); DB.setProfil(d); renderProfilGlobal(); tampilkanToast('Profil Tersimpan.', 'success'); });
            document.getElementById('form-pengaturan-tema')?.addEventListener('submit', function (e) { e.preventDefault(); let d = DB.getProfil(); d.tema_gelap = document.getElementById('tema-gelap').checked; DB.setProfil(d); terapkanTemaGlobal(); tampilkanToast('Tema diperbarui.', 'success'); });
            document.getElementById('btn-reset-data')?.addEventListener('click', function () { if (DB.resetData()) { tampilkanToast('Sistem diformat...', 'warning'); setTimeout(() => window.location.reload(), 1500); } });
        }

        const inputPencarian = document.getElementById('input-pencarian');
        if (inputPencarian) {
            const inputBaru = inputPencarian.cloneNode(true); inputPencarian.parentNode.replaceChild(inputBaru, inputPencarian); inputBaru.value = '';
            inputBaru.addEventListener('keyup', function (e) { const teks = sanitize(e.target.value.toLowerCase()); document.querySelectorAll('.view-section.active tbody tr').forEach(b => { if (b.cells.length > 1) b.style.display = b.textContent.toLowerCase().includes(teks) ? '' : 'none'; }); });
        }
    };

    document.getElementById('btn-profil')?.addEventListener('click', () => bukaModul('pengaturan'));
    document.getElementById('btn-keluar')?.addEventListener('click', (e) => { e.preventDefault(); if (confirm("Keluar sesi?")) Auth.logout(); });
    itemNavigasi.forEach(item => { item.addEventListener('click', function (e) { e.preventDefault(); const t = this.getAttribute('data-target'); if (t) bukaModul(t); }); });

    bukaModul('dashboard');
});