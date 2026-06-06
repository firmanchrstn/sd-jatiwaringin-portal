document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // HELPER: Format Tanggal Baku (YYYY-MM-DD)
    // ==========================================
    const formatTglBaku = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // ==========================================
    // 1. SISTEM PROFIL & TOAST NOTIFICATION
    // ==========================================
    const renderProfilGlobal = () => {
        const profilGlobal = JSON.parse(localStorage.getItem('db_profil')) || { nama: 'Nama Guru', peran: 'Wali Kelas -' };
        const headerName = document.querySelector('.user-name');
        const headerRole = document.querySelector('.user-role');
        const headerAvatar = document.querySelector('.user-profile .avatar');

        if (headerName && headerRole && headerAvatar) {
            headerName.textContent = profilGlobal.nama;
            headerRole.textContent = profilGlobal.peran;
            const kata = profilGlobal.nama.trim().split(' ');
            headerAvatar.textContent = kata.length >= 2 ? (kata[0][0] + kata[1][0]).toUpperCase() : (kata[0] !== '' ? kata[0].substring(0, 2).toUpperCase() : 'GP');
        }
    };
    renderProfilGlobal();

    window.tampilkanToast = (pesan, tipe = 'info') => {
        const wadahToast = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipe}`;
        let ikon = tipe === 'success' ? 'ph-check-circle' : tipe === 'warning' ? 'ph-warning' : tipe === 'danger' ? 'ph-x-circle' : 'ph-info';
        toast.innerHTML = `<i class="ph ${ikon}"></i> <span>${pesan}</span>`;
        wadahToast.appendChild(toast);
        setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 400); }, 3000);
    };

    // ==========================================
    // 2. MESIN ROUTING (FETCH API)
    // ==========================================
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
            console.error(error);
            kanvasKonten.innerHTML = `
                <div class="empty-state">
                    <i class="ph ph-warning-circle empty-icon text-danger"></i>
                    <h2>Modul Belum Tersedia</h2>
                    <p>File views/${namaFileView}.html tidak ditemukan.</p>
                </div>`;
        }
    };

    // ==========================================
    // 3. INISIALISASI FITUR PER HALAMAN
    // ==========================================
    const inisialisasiHalaman = (namaView) => {

        // --- A. DASBOR ---
        if (namaView === 'dashboard') {
            const elemenTanggal = document.getElementById('tanggal-hari-ini');
            if (elemenTanggal) elemenTanggal.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const dbSiswa = JSON.parse(localStorage.getItem('db_siswa')) || [];
            const dbKelas = JSON.parse(localStorage.getItem('db_kelas')) || [];
            if (document.getElementById('dash-total-siswa')) document.getElementById('dash-total-siswa').textContent = `${dbSiswa.length} Anak`;
            if (document.getElementById('dash-total-kelas')) document.getElementById('dash-total-kelas').textContent = `${dbKelas.length} Kelas`;

            const dbKaldik = JSON.parse(localStorage.getItem('db_kaldik')) || [];
            const containerKaldik = document.getElementById('dashboard-kaldik-list');

            if (containerKaldik) {
                containerKaldik.innerHTML = '';
                const hariIni = formatTglBaku(new Date());
                const agendaMendatang = dbKaldik.filter(k => k.tanggal >= hariIni).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(0, 3);

                if (agendaMendatang.length === 0) {
                    containerKaldik.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 20px;">Tidak ada agenda dalam waktu dekat.</p>';
                } else {
                    agendaMendatang.forEach(item => {
                        const tglObj = new Date(item.tanggal);
                        const bulanSingkat = tglObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                        const tglAngka = tglObj.getDate();

                        let bgWarna = 'var(--color-primary-light)'; let txtWarna = 'var(--color-primary)';

                        // Cek libur untuk mewarnai badge Dasbor jadi merah
                        const teksKegiatan = item.kegiatan.toLowerCase();
                        const isLibur = teksKegiatan.includes('libur') || teksKegiatan.includes('hari raya') || tglObj.getDay() === 0;

                        if (item.tanggal === hariIni || isLibur) { bgWarna = 'var(--color-danger-bg)'; txtWarna = 'var(--color-danger)'; }

                        const htmlBaris = `
                            <div style="display: flex; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border);">
                                <div style="background: ${bgWarna}; color: ${txtWarna}; padding: 8px 16px; border-radius: 8px; font-weight: bold; text-align: center; min-width: 70px;">
                                    ${bulanSingkat}<br><span style="font-size: 20px;">${tglAngka}</span>
                                </div>
                                <div style="display: flex; flex-direction: column; justify-content: center;">
                                    <h4 style="margin-bottom: 4px; font-size: 15px; color: var(--color-text-main);">${item.kegiatan}</h4>
                                    <p style="color: var(--color-text-muted); font-size: 13px;">${item.ket || 'Agenda Internal SDN Jatiwaringin 1'}</p>
                                </div>
                            </div>
                        `;
                        containerKaldik.insertAdjacentHTML('beforeend', htmlBaris);
                    });
                }
            }
        }

        // --- B. KALENDER PENDIDIKAN (KALDIK) ---
        if (namaView === 'kaldik') {
            let dbKaldik = JSON.parse(localStorage.getItem('db_kaldik'));

            if (!dbKaldik || dbKaldik.length === 0) {
                dbKaldik = [
                    { id: 1, tanggal: '2026-07-14', kegiatan: 'Hari Pertama Masuk Sekolah', ket: 'MPLS dan Transisi PAUD SD' },
                    { id: 2, tanggal: '2026-08-17', kegiatan: 'Libur Hari Proklamasi', ket: 'Kemerdekaan RI' },
                    { id: 3, tanggal: '2026-10-13', kegiatan: 'Kegiatan GELISIA', ket: 'Gebyar Literasi Sekolah Inspiratif Aktif' },
                    { id: 4, tanggal: '2026-12-01', kegiatan: 'Pelaksanaan Sumatif Akhir Semester', ket: 'Ujian Akhir Semester Ganjil' },
                    { id: 5, tanggal: '2026-12-25', kegiatan: 'Libur Hari Raya Natal', ket: 'Tanggal Merah' }
                ];
                localStorage.setItem('db_kaldik', JSON.stringify(dbKaldik));
            }

            let bulanAktif = new Date().getMonth();
            let tahunAktif = new Date().getFullYear();
            let tanggalTerpilih = formatTglBaku(new Date());

            const renderKalender = () => {
                const containerDays = document.getElementById('kaldik-days-container');
                const titleMonth = document.getElementById('kaldik-month-year');

                if (titleMonth) titleMonth.textContent = new Date(tahunAktif, bulanAktif, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                if (containerDays) containerDays.innerHTML = '';

                const hariPertama = new Date(tahunAktif, bulanAktif, 1).getDay();
                const totalHari = new Date(tahunAktif, bulanAktif + 1, 0).getDate();
                const hariIniBaku = formatTglBaku(new Date());

                for (let i = 0; i < hariPertama; i++) {
                    if (containerDays) containerDays.innerHTML += `<div class="calendar-cell empty"></div>`;
                }

                for (let i = 1; i <= totalHari; i++) {
                    const dateObj = new Date(tahunAktif, bulanAktif, i);
                    const tglLooping = formatTglBaku(dateObj);
                    const dayOfWeek = dateObj.getDay(); // 0 = Minggu

                    const agendaAda = dbKaldik.filter(k => k.tanggal === tglLooping);
                    const titikAgenda = agendaAda.length > 0 ? `<div class="calendar-event-dot"></div>` : '';

                    // ====================================================
                    // ALGORITMA CERDAS: DETEKSI HARI LIBUR / TANGGAL MERAH
                    // ====================================================
                    let isLibur = (dayOfWeek === 0); // Otomatis hari Minggu jadi merah

                    if (agendaAda.length > 0) {
                        const teksKegiatan = agendaAda.map(a => a.kegiatan.toLowerCase()).join(' ');
                        // Jika guru mengetik kata libur, hari raya, atau cuti
                        if (teksKegiatan.includes('libur') || teksKegiatan.includes('hari raya') || teksKegiatan.includes('cuti')) {
                            isLibur = true;
                        }
                    }

                    let kelasTambahan = '';
                    if (tglLooping === hariIniBaku) kelasTambahan += ' today';
                    if (tglLooping === tanggalTerpilih) kelasTambahan += ' selected';

                    // Eksekusi warna merah
                    let styleMerah = '';
                    if (isLibur && tglLooping !== tanggalTerpilih) {
                        styleMerah = 'color: var(--color-danger); font-weight: 700;';
                    }

                    if (containerDays) containerDays.innerHTML += `<div class="calendar-cell ${kelasTambahan}" data-tgl="${tglLooping}" style="${styleMerah}">${i}${titikAgenda}</div>`;
                }

                document.querySelectorAll('.calendar-cell:not(.empty)').forEach(cell => {
                    cell.addEventListener('click', function () {
                        tanggalTerpilih = this.getAttribute('data-tgl');
                        renderKalender(); renderPanelKanan();
                    });
                });
            };

            const renderPanelKanan = () => {
                const judulDetail = document.getElementById('kaldik-selected-date-text');
                const kontainerDetail = document.getElementById('kaldik-agenda-detail');
                const inputFormTgl = document.getElementById('kaldik-input-tgl');

                const tglCantik = new Date(tanggalTerpilih).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                if (judulDetail) judulDetail.textContent = `Agenda: ${tglCantik}`;
                if (inputFormTgl) inputFormTgl.value = tanggalTerpilih;

                const agendaDitemukan = dbKaldik.filter(k => k.tanggal === tanggalTerpilih);

                if (kontainerDetail) {
                    if (agendaDitemukan.length === 0) {
                        kontainerDetail.innerHTML = `<div style="text-align: center; padding: 20px 0;"><i class="ph ph-calendar-blank" style="font-size: 48px; color: var(--color-border); margin-bottom: 12px;"></i><p style="color: var(--color-text-muted);">Tidak ada jadwal/kegiatan pada tanggal ini.</p></div>`;
                    } else {
                        kontainerDetail.innerHTML = '';
                        agendaDitemukan.forEach(ag => {
                            kontainerDetail.innerHTML += `<div style="background: var(--color-background); border: 1px solid var(--color-border); padding: 16px; border-radius: 8px; margin-bottom: 12px; position: relative;"><button class="btn-icon-only text-danger" onclick="hapusKaldik(${ag.id})" style="position: absolute; top: 12px; right: 12px;" title="Hapus Agenda"><i class="ph ph-trash"></i></button><h3 style="font-size: 15px; margin-bottom: 4px;">${ag.kegiatan}</h3><p style="font-size: 13px; color: var(--color-text-muted);">${ag.ket || '-'}</p></div>`;
                        });
                    }
                }
            };

            document.getElementById('btn-kaldik-prev')?.addEventListener('click', () => { bulanAktif--; if (bulanAktif < 0) { bulanAktif = 11; tahunAktif--; } renderKalender(); });
            document.getElementById('btn-kaldik-next')?.addEventListener('click', () => { bulanAktif++; if (bulanAktif > 11) { bulanAktif = 0; tahunAktif++; } renderKalender(); });

            const formKaldik = document.getElementById('form-tambah-kaldik');
            if (formKaldik) {
                formKaldik.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const giatInput = document.getElementById('kaldik-input-kegiatan').value;
                    dbKaldik.push({ id: Date.now(), tanggal: document.getElementById('kaldik-input-tgl').value, kegiatan: giatInput, ket: document.getElementById('kaldik-input-ket').value });
                    localStorage.setItem('db_kaldik', JSON.stringify(dbKaldik));
                    formKaldik.reset(); document.getElementById('kaldik-input-tgl').value = tanggalTerpilih;
                    renderKalender(); renderPanelKanan();
                    tampilkanToast(`Agenda "${giatInput}" berhasil ditambahkan.`, 'success');
                });
            }

            window.hapusKaldik = (idKaldik) => {
                if (confirm('Yakin ingin menghapus agenda ini?')) {
                    dbKaldik = dbKaldik.filter(k => k.id !== idKaldik);
                    localStorage.setItem('db_kaldik', JSON.stringify(dbKaldik));
                    renderKalender(); renderPanelKanan(); tampilkanToast(`Agenda dihapus.`, 'warning');
                }
            };

            renderKalender(); renderPanelKanan();
        }

        // --- C. PRESENSI ---
        if (namaView === 'presensi') {
            let dataPresensi = JSON.parse(localStorage.getItem('db_presensi')) || [];
            const tbody = document.getElementById('body-tabel-presensi');
            const formTambah = document.getElementById('form-tambah-presensi');
            const inputTgl = document.getElementById('input-tanggal');

            if (inputTgl) inputTgl.valueAsDate = new Date();

            const renderTabel = () => {
                tbody.innerHTML = '';
                if (dataPresensi.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:32px; color:var(--color-text-muted);">Belum ada data kehadiran.</td></tr>`; return; }
                [...dataPresensi].reverse().forEach((data, index) => {
                    let classBadge = data.status === 'Hadir' ? 'badge-success' : (data.status === 'Izin' ? 'badge-warning' : 'badge-danger');
                    const idAsli = dataPresensi.length - 1 - index;
                    const formatTgl = new Date(data.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    const baris = document.createElement('tr');
                    baris.innerHTML = `<td>${formatTgl}</td><td class="font-medium">${data.nama}</td><td><span class="badge ${classBadge}">${data.status}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataPresensi(${idAsli})"><i class="ph ph-trash"></i></button></td>`;
                    tbody.appendChild(baris);
                });
            };

            if (formTambah) {
                formTambah.addEventListener('submit', function (e) {
                    e.preventDefault();
                    dataPresensi.push({ tanggal: document.getElementById('input-tanggal').value, nama: document.getElementById('input-nama').value, status: document.getElementById('input-status').value });
                    localStorage.setItem('db_presensi', JSON.stringify(dataPresensi));
                    formTambah.reset(); inputTgl.valueAsDate = new Date(); renderTabel(); tampilkanToast(`Kehadiran disimpan.`, 'success');
                });
            }

            window.hapusDataPresensi = (id) => { if (confirm('Hapus data ini?')) { dataPresensi.splice(id, 1); localStorage.setItem('db_presensi', JSON.stringify(dataPresensi)); renderTabel(); tampilkanToast(`Data dihapus.`, 'warning'); } };
            renderTabel();

            document.getElementById('btn-ekspor')?.addEventListener('click', function () {
                if (dataPresensi.length === 0) return tampilkanToast('Tidak ada data!', 'danger');
                this.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memproses...'; this.style.pointerEvents = 'none';
                setTimeout(() => {
                    let csvContent = "Tanggal,Nama Siswa,Status\n";
                    dataPresensi.forEach(d => { csvContent += `"${d.tanggal}","${d.nama}","${d.status}"\n`; });
                    mengunduhFileCSV(csvContent, 'Absensi_Harian.csv');
                    this.innerHTML = '<i class="ph ph-download-simple"></i> Unduh Laporan (CSV)'; this.style.pointerEvents = 'auto';
                }, 800);
            });
        }

        // --- D. KELAS SAYA ---
        if (namaView === 'kelas') {
            let dataKelas = JSON.parse(localStorage.getItem('db_kelas')) || [];
            const gridKelas = document.getElementById('grid-kelas');
            const formTambahKelas = document.getElementById('form-tambah-kelas');

            const renderGridKelas = () => {
                gridKelas.innerHTML = '';
                if (dataKelas.length === 0) { gridKelas.innerHTML = `<div style="grid-column: 1 / -1;" class="empty-state"><i class="ph ph-chalkboard-teacher empty-icon"></i><h2>Belum Ada Kelas</h2></div>`; return; }
                [...dataKelas].reverse().forEach((data, index) => {
                    const idAsli = dataKelas.length - 1 - index;
                    const card = document.createElement('div'); card.className = 'card'; card.style.padding = '24px'; card.style.position = 'relative';
                    const badgeWA = data.wa_aktif ? `<span style="font-size:11px; background:#DCFCE7; color:#166534; padding:2px 8px; border-radius:12px; display:inline-block; margin-top:8px;"><i class="ph ph-whatsapp-logo"></i> WA Notif Aktif</span>` : '';

                    card.innerHTML = `<button class="btn-icon-only text-danger" style="position: absolute; top: 16px; right: 16px; background: var(--color-danger-bg); border-radius: 50%; padding: 4px;" onclick="hapusDataKelas(${idAsli})"><i class="ph ph-trash" style="font-size: 16px;"></i></button>
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                        <div class="stat-icon primary-light"><i class="ph ph-books text-primary"></i></div>
                        <div><h3 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">${data.mapel}</h3><span class="badge badge-success">Kelas ${data.namaKelas}</span>${badgeWA}</div>
                    </div>
                    <div style="padding-top: 16px; border-top: 1px dashed var(--color-border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="color:var(--color-text-muted); font-size:12px;">HARI</span><strong style="font-size:13px;">${data.hari}</strong></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="color:var(--color-text-muted); font-size:12px;">JAM KE</span><strong style="font-size:13px;">${data.jamke}</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span style="color:var(--color-text-muted); font-size:12px;">WAKTU</span><strong style="font-size:13px;">${data.waktu}</strong></div>
                    </div>`;
                    gridKelas.appendChild(card);
                });
            };

            if (formTambahKelas) {
                formTambahKelas.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const waAktif = document.getElementById('input-wa').checked;
                    dataKelas.push({ hari: document.getElementById('input-hari').value, jamke: document.getElementById('input-jamke').value, waktu: document.getElementById('input-waktu').value, mapel: document.getElementById('input-mapel').value, namaKelas: document.getElementById('input-namakelas').value, wa_aktif: waAktif });
                    localStorage.setItem('db_kelas', JSON.stringify(dataKelas));
                    formTambahKelas.reset(); renderGridKelas();

                    if (waAktif) tampilkanToast(`Jadwal disimpan. Bot WA akan mengirim pesan pengingat 30 menit sebelum ${document.getElementById('input-waktu').value}.`, 'success');
                    else tampilkanToast(`Jadwal berhasil ditambahkan.`, 'success');
                });
            }

            window.hapusDataKelas = (id) => { if (confirm('Hapus jadwal ini?')) { dataKelas.splice(id, 1); localStorage.setItem('db_kelas', JSON.stringify(dataKelas)); renderGridKelas(); } };
            renderGridKelas();
        }

        // --- E. DATA SISWA ---
        if (namaView === 'siswa') {
            let dataSiswa = JSON.parse(localStorage.getItem('db_siswa')) || [];
            const tbodySiswa = document.getElementById('body-tabel-siswa');
            const formSiswa = document.getElementById('form-tambah-siswa');

            const renderTabelSiswa = () => {
                tbodySiswa.innerHTML = '';
                if (dataSiswa.length === 0) { tbodySiswa.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px;">Belum ada data siswa.</td></tr>`; return; }
                [...dataSiswa].reverse().forEach((data, index) => {
                    const idAsli = dataSiswa.length - 1 - index;
                    const baris = document.createElement('tr');
                    baris.innerHTML = `<td><span class="font-medium">${data.nama}</span><br><span style="font-size:11px; color:var(--color-text-muted);">NIK: ${data.nik}</span></td><td><span class="badge" style="background:var(--color-primary-light); color:var(--color-primary);">${data.kelas}</span></td><td>${data.jk === 'Laki-laki' ? 'L' : 'P'}</td><td>${data.ayah} & ${data.ibu}</td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataSiswa(${idAsli})"><i class="ph ph-trash"></i></button></td>`;
                    tbodySiswa.appendChild(baris);
                });
            };

            if (formSiswa) {
                formSiswa.addEventListener('submit', function (e) {
                    e.preventDefault();
                    dataSiswa.push({
                        nama: document.getElementById('s-nama').value, jk: document.getElementById('s-jk').value, kelas: document.getElementById('s-kelas').value,
                        tmplahir: document.getElementById('s-tmplahir').value, tgllahir: document.getElementById('s-tgllahir').value, agama: document.getElementById('s-agama').value,
                        nik: document.getElementById('s-nik').value, kk: document.getElementById('s-kk').value, ayah: document.getElementById('s-ayah').value,
                        kerjaayah: document.getElementById('s-kerjaayah').value, ibu: document.getElementById('s-ibu').value, kerjaibu: document.getElementById('s-kerjaibu').value,
                        alamat: document.getElementById('s-alamat').value
                    });
                    localStorage.setItem('db_siswa', JSON.stringify(dataSiswa));
                    formSiswa.reset(); renderTabelSiswa(); tampilkanToast(`Data siswa didaftarkan.`, 'success');
                });
            }
            window.hapusDataSiswa = (id) => { if (confirm('Hapus siswa ini?')) { dataSiswa.splice(id, 1); localStorage.setItem('db_siswa', JSON.stringify(dataSiswa)); renderTabelSiswa(); } };
            renderTabelSiswa();
        }

        // --- F. NILAI AKADEMIK ---
        if (namaView === 'nilai') {
            let dataNilai = JSON.parse(localStorage.getItem('db_nilai')) || [];
            const tbodyNilai = document.getElementById('body-tabel-nilai');
            const formNilai = document.getElementById('form-tambah-nilai');

            const renderTabelNilai = () => {
                tbodyNilai.innerHTML = '';
                if (dataNilai.length === 0) { tbodyNilai.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px;">Belum ada data nilai.</td></tr>`; return; }
                [...dataNilai].reverse().forEach((data, index) => {
                    const idAsli = dataNilai.length - 1 - index;
                    const isTuntas = parseInt(data.skor) >= 75;
                    const baris = document.createElement('tr');
                    baris.innerHTML = `<td class="font-medium">${data.nama}</td><td class="text-muted">${data.mapel}</td><td>${data.jenis}</td><td style="text-align: center; font-weight: 700;">${data.skor}</td><td><span class="badge ${isTuntas ? 'badge-success' : 'badge-danger'}">${isTuntas ? 'Tuntas' : 'Remedial'}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataNilai(${idAsli})"><i class="ph ph-trash"></i></button></td>`;
                    tbodyNilai.appendChild(baris);
                });
            };

            if (formNilai) {
                formNilai.addEventListener('submit', function (e) {
                    e.preventDefault();
                    dataNilai.push({ nama: document.getElementById('input-nilai-nama').value, mapel: document.getElementById('input-nilai-mapel').value, jenis: document.getElementById('input-nilai-jenis').value, skor: document.getElementById('input-nilai-skor').value });
                    localStorage.setItem('db_nilai', JSON.stringify(dataNilai));
                    formNilai.reset(); renderTabelNilai(); tampilkanToast(`Nilai disimpan.`, 'success');
                });
            }

            window.hapusDataNilai = (id) => { if (confirm('Hapus nilai ini?')) { dataNilai.splice(id, 1); localStorage.setItem('db_nilai', JSON.stringify(dataNilai)); renderTabelNilai(); } };
            renderTabelNilai();

            document.getElementById('btn-ekspor-nilai')?.addEventListener('click', function () {
                if (dataNilai.length === 0) return tampilkanToast('Tidak ada nilai untuk diekspor!', 'danger');
                this.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memproses...'; this.style.pointerEvents = 'none';
                setTimeout(() => {
                    let csvContent = "Nama Siswa,Mata Pelajaran,Jenis Evaluasi,Skor\n";
                    dataNilai.forEach(d => { csvContent += `"${d.nama}","${d.mapel}","${d.jenis}","${d.skor}"\n`; });
                    mengunduhFileCSV(csvContent, 'Rekap_Nilai_Akademik.csv');
                    this.innerHTML = '<i class="ph ph-download-simple"></i> Ekspor Rapor Kelas'; this.style.pointerEvents = 'auto';
                }, 800);
            });
        }

        // --- G. PENGATURAN ---
        if (namaView === 'pengaturan') {
            const formProfil = document.getElementById('form-pengaturan-profil');
            const profilTersimpan = JSON.parse(localStorage.getItem('db_profil')) || { nama: '', peran: '' };
            if (document.getElementById('setting-nama')) document.getElementById('setting-nama').value = profilTersimpan.nama;
            if (document.getElementById('setting-peran')) document.getElementById('setting-peran').value = profilTersimpan.peran;

            if (formProfil) {
                formProfil.addEventListener('submit', function (e) {
                    e.preventDefault();
                    localStorage.setItem('db_profil', JSON.stringify({ nama: document.getElementById('setting-nama').value, peran: document.getElementById('setting-peran').value }));
                    renderProfilGlobal(); tampilkanToast('Pendaftaran Profil Berhasil.', 'success');
                });
            }

            document.getElementById('btn-reset-data')?.addEventListener('click', function () {
                if (confirm("PERINGATAN!\n\nHapus seluruh database sistem?")) {
                    ['db_presensi', 'db_kelas', 'db_siswa', 'db_nilai', 'db_kaldik'].forEach(k => localStorage.removeItem(k));
                    tampilkanToast('Sistem diformat...', 'warning'); setTimeout(() => window.location.reload(), 1500);
                }
            });
        }

        // --- H. PENCARIAN GLOBAL ---
        const inputPencarian = document.getElementById('input-pencarian');
        if (inputPencarian) {
            const inputBaru = inputPencarian.cloneNode(true);
            inputPencarian.parentNode.replaceChild(inputBaru, inputPencarian);
            inputBaru.value = '';
            inputBaru.addEventListener('keyup', function (e) {
                const teksCari = e.target.value.toLowerCase();
                const tabelAktif = document.querySelector('.view-section.active tbody');
                if (tabelAktif) {
                    tabelAktif.querySelectorAll('tr').forEach(baris => {
                        if (baris.cells.length > 1) baris.style.display = baris.textContent.toLowerCase().includes(teksCari) ? '' : 'none';
                    });
                }
            });
        }
    }; // Akhir dari inisialisasiHalaman

    // ==========================================
    // 4. MENGAKTIFKAN TOMBOL "MATI" DI HEADER & SIDEBAR
    // ==========================================

    // A. Tombol Profil di Header -> Buka Pengaturan
    document.getElementById('btn-profil')?.addEventListener('click', () => {
        bukaModul('pengaturan');
    });

    // B. Tombol Notifikasi -> Cek Kaldik Terdekat
    document.getElementById('btn-notifikasi')?.addEventListener('click', () => {
        const dbKaldik = JSON.parse(localStorage.getItem('db_kaldik')) || [];
        const hariIni = formatTglBaku(new Date());
        const agendaTerdekat = dbKaldik.filter(k => k.tanggal >= hariIni).sort((a, b) => a.tanggal.localeCompare(b.tanggal))[0];

        if (agendaTerdekat) {
            const tglCantik = new Date(agendaTerdekat.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            tampilkanToast(`Agenda Terdekat: ${agendaTerdekat.kegiatan} pada ${tglCantik}`, 'info');
        } else {
            tampilkanToast('Tidak ada pemberitahuan atau agenda baru.', 'info');
        }
    });

    // C. Tombol Profil Sekolah di Sidebar -> Buka Modul Info
    document.getElementById('btn-info-sekolah')?.addEventListener('click', () => {
        bukaModul('info');
    });

    // D. Tombol Keluar / Logout
    document.getElementById('btn-keluar')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin keluar dari Portal Guru?")) {
            tampilkanToast('Sesi Anda telah diakhiri secara aman.', 'success');
        }
    });

    // ==========================================
    // 5. FUNGSI GLOBAL EKSPOR CSV (BOM UTF-8)
    // ==========================================
    function mengunduhFileCSV(csv, namaFile) {
        const csvBlob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const tautan = document.createElement("a");
        tautan.href = URL.createObjectURL(csvBlob);
        tautan.download = namaFile;
        tautan.style.display = 'none';
        document.body.appendChild(tautan);
        tautan.click();
        document.body.removeChild(tautan);
    }

    itemNavigasi.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            if (target) bukaModul(target);
        });
    });

    // ==========================================
    // 6. MULAI APLIKASI
    // ==========================================
    bukaModul('dashboard');
});