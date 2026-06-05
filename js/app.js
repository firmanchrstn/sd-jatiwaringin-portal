document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // A. INISIALISASI PROFIL GLOBAL DI HEADER
    // ==========================================
    const renderProfilGlobal = () => {
        const profilGlobal = JSON.parse(localStorage.getItem('db_profil')) || { nama: 'Guru Pengajar', peran: 'Wali Kelas 4B' };
        const headerName = document.querySelector('.user-name');
        const headerRole = document.querySelector('.user-role');
        const headerAvatar = document.querySelector('.user-profile .avatar');

        if (headerName && headerRole && headerAvatar) {
            headerName.textContent = profilGlobal.nama;
            headerRole.textContent = profilGlobal.peran;

            const kata = profilGlobal.nama.trim().split(' ');
            let inisial = kata.length >= 2 ? (kata[0][0] + kata[1][0]).toUpperCase() : (kata[0] !== '' ? kata[0].substring(0, 2).toUpperCase() : 'GP');
            headerAvatar.textContent = inisial;
        }
    };
    renderProfilGlobal(); // Panggil saat aplikasi pertama kali dimuat

    // ==========================================
    // B. SISTEM TOAST NOTIFICATION (Global)
    // ==========================================
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
    // C. MESIN ROUTING (FETCH API)
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
        } catch (error) {
            console.error(error);
            kanvasKonten.innerHTML = `<div class="empty-state"><i class="ph ph-warning-circle empty-icon text-danger"></i><h2>Modul Belum Tersedia</h2><p>File views/${namaFileView}.html tidak ditemukan.</p></div>`;
        }
    };

    // ==========================================
    // D. INISIALISASI FITUR PER HALAMAN
    // ==========================================
    const inisialisasiHalaman = (namaView) => {

        // --- 1. DASBOR ---
        if (namaView === 'dashboard') {
            const elemenTanggal = document.getElementById('tanggal-hari-ini');
            if (elemenTanggal) elemenTanggal.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }

        // --- 2. PRESENSI ---
        if (namaView === 'presensi') {
            let dataPresensi = JSON.parse(localStorage.getItem('db_presensi')) || [];
            const tbody = document.getElementById('body-tabel-presensi');
            const formTambah = document.getElementById('form-tambah-presensi');

            const renderTabel = () => {
                tbody.innerHTML = '';
                if (dataPresensi.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--color-text-muted);">Belum ada data kehadiran.</td></tr>`; return; }
                [...dataPresensi].reverse().forEach((data, index) => {
                    let classBadge = data.status === 'Sakit' ? 'badge-danger' : (data.status === 'Terlambat' ? 'badge-warning' : (data.status === 'Alpa' ? 'badge-danger' : 'badge-success'));
                    const idAsli = dataPresensi.length - 1 - index;
                    const baris = document.createElement('tr');
                    baris.innerHTML = `<td class="font-medium">${data.nama}</td><td class="text-muted">${data.nisn || '-'}</td><td>${data.waktu}</td><td><span class="badge ${classBadge}">${data.status}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataPresensi(${idAsli})"><i class="ph ph-trash"></i></button></td>`;
                    tbody.appendChild(baris);
                });
            };

            if (formTambah) {
                formTambah.addEventListener('submit', function (e) {
                    e.preventDefault();
                    dataPresensi.push({ nama: document.getElementById('input-nama').value, nisn: document.getElementById('input-nisn').value, status: document.getElementById('input-status').value, waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' });
                    localStorage.setItem('db_presensi', JSON.stringify(dataPresensi));
                    formTambah.reset(); renderTabel(); tampilkanToast(`Kehadiran berhasil dicatat.`, 'success');
                });
            }

            window.hapusDataPresensi = (id) => { if (confirm('Hapus data ini?')) { dataPresensi.splice(id, 1); localStorage.setItem('db_presensi', JSON.stringify(dataPresensi)); renderTabel(); tampilkanToast(`Data dihapus.`, 'warning'); } };
            renderTabel();

            document.getElementById('btn-ekspor')?.addEventListener('click', function () {
                if (dataPresensi.length === 0) { tampilkanToast('Tidak ada data!', 'danger'); return; }
                this.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memproses...'; this.style.pointerEvents = 'none';
                setTimeout(() => {
                    let csvContent = "Nama Siswa,NISN,Waktu Catat,Status\n";
                    dataPresensi.forEach(d => { csvContent += `"${d.nama}","${d.nisn}","${d.waktu}","${d.status}"\n`; });
                    mengunduhFileCSV(csvContent, 'Laporan_Presensi.csv');
                    this.innerHTML = '<i class="ph ph-download-simple"></i> Unduh Laporan (CSV)'; this.style.pointerEvents = 'auto'; tampilkanToast('CSV diunduh.', 'success');
                }, 800);
            });
        }

        // --- 3. KELAS SAYA ---
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
                    card.innerHTML = `<button class="btn-icon-only text-danger" style="position: absolute; top: 16px; right: 16px; background: var(--color-danger-bg); border-radius: 50%; padding: 4px;" onclick="hapusDataKelas(${idAsli})"><i class="ph ph-trash" style="font-size: 16px;"></i></button><div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;"><div class="stat-icon primary-light"><i class="ph ph-books text-primary"></i></div><div><h3 style="font-size: 16px; font-weight: 700; color: var(--color-text-main); margin-bottom: 4px;">${data.mapel}</h3><span class="badge badge-success" style="background: var(--color-primary-light); color: var(--color-primary);">Kelas ${data.namaKelas}</span></div></div><div style="display: flex; flex-direction: column; gap: 12px; padding-top: 16px; border-top: 1px dashed var(--color-border);"><div style="display: flex; align-items: center; gap: 12px; color: var(--color-text-muted);"><i class="ph ph-clock" style="font-size: 18px;"></i><span style="font-size: 13px; font-weight: 500;">${data.jadwal}</span></div><div style="display: flex; align-items: center; gap: 12px; color: var(--color-text-muted);"><i class="ph ph-door" style="font-size: 18px;"></i><span style="font-size: 13px; font-weight: 500;">${data.ruangan}</span></div></div>`;
                    gridKelas.appendChild(card);
                });
            };

            if (formTambahKelas) {
                formTambahKelas.addEventListener('submit', function (e) {
                    e.preventDefault();
                    dataKelas.push({ mapel: document.getElementById('input-mapel').value, namaKelas: document.getElementById('input-namakelas').value, jadwal: document.getElementById('input-jadwal').value, ruangan: document.getElementById('input-ruangan').value });
                    localStorage.setItem('db_kelas', JSON.stringify(dataKelas));
                    formTambahKelas.reset(); renderGridKelas(); tampilkanToast(`Jadwal ditambahkan.`, 'success');
                });
            }

            window.hapusDataKelas = (id) => { if (confirm('Hapus jadwal ini?')) { dataKelas.splice(id, 1); localStorage.setItem('db_kelas', JSON.stringify(dataKelas)); renderGridKelas(); tampilkanToast(`Jadwal dihapus.`, 'warning'); } };
            renderGridKelas();
        }

        // --- 4. DATA SISWA ---
        if (namaView === 'siswa') {
            let dataSiswa = JSON.parse(localStorage.getItem('db_siswa')) || [];
            const tbodySiswa = document.getElementById('body-tabel-siswa');
            const formSiswa = document.getElementById('form-tambah-siswa');

            const renderTabelSiswa = () => {
                tbodySiswa.innerHTML = '';
                if (dataSiswa.length === 0) { tbodySiswa.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--color-text-muted);">Belum ada data siswa.</td></tr>`; return; }
                [...dataSiswa].reverse().forEach((data, index) => {
                    const idAsli = dataSiswa.length - 1 - index;
                    const kata = data.nama.trim().split(' ');
                    let inisial = kata.length >= 2 ? (kata[0][0] + kata[1][0]).toUpperCase() : (kata[0] !== '' ? kata[0].substring(0, 2).toUpperCase() : '??');
                    const baris = document.createElement('tr');
                    baris.innerHTML = `<td class="font-medium text-muted">${data.nisn}</td><td><div style="display: flex; align-items: center; gap: 12px;"><div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700;">${inisial}</div><span class="font-medium" style="color: var(--color-text-main);">${data.nama}</span></div></td><td><span class="badge" style="background: var(--color-background); border: 1px solid var(--color-border);">${data.jk === 'Laki-laki' ? 'L' : 'P'}</span></td><td>${data.wali}</td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataSiswa(${idAsli})"><i class="ph ph-trash"></i></button></td>`;
                    tbodySiswa.appendChild(baris);
                });
            };

            if (formSiswa) {
                formSiswa.addEventListener('submit', function (e) {
                    e.preventDefault();
                    dataSiswa.push({ nisn: document.getElementById('input-siswa-nisn').value, nama: document.getElementById('input-siswa-nama').value, jk: document.getElementById('input-siswa-jk').value, wali: document.getElementById('input-siswa-wali').value });
                    localStorage.setItem('db_siswa', JSON.stringify(dataSiswa));
                    formSiswa.reset(); renderTabelSiswa(); tampilkanToast(`Siswa didaftarkan.`, 'success');
                });
            }

            window.hapusDataSiswa = (id) => { if (confirm('Hapus siswa ini?')) { dataSiswa.splice(id, 1); localStorage.setItem('db_siswa', JSON.stringify(dataSiswa)); renderTabelSiswa(); tampilkanToast(`Data dihapus.`, 'warning'); } };
            renderTabelSiswa();
        }

        // --- 5. NILAI AKADEMIK ---
        if (namaView === 'nilai') {
            let dataNilai = JSON.parse(localStorage.getItem('db_nilai')) || [];
            const tbodyNilai = document.getElementById('body-tabel-nilai');
            const formNilai = document.getElementById('form-tambah-nilai');

            const renderTabelNilai = () => {
                tbodyNilai.innerHTML = '';
                if (dataNilai.length === 0) { tbodyNilai.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--color-text-muted);">Belum ada data nilai.</td></tr>`; return; }
                [...dataNilai].reverse().forEach((data, index) => {
                    const idAsli = dataNilai.length - 1 - index;
                    const isTuntas = parseInt(data.skor) >= 75;
                    const baris = document.createElement('tr');
                    baris.innerHTML = `<td class="font-medium">${data.nama}</td><td class="text-muted">${data.mapel}</td><td>${data.jenis}</td><td style="text-align: center; font-weight: 700; font-size: 16px;">${data.skor}</td><td><span class="badge ${isTuntas ? 'badge-success' : 'badge-danger'}">${isTuntas ? 'Tuntas' : 'Remedial'}</span></td><td style="text-align: right;"><button class="btn-icon-only text-danger" onclick="hapusDataNilai(${idAsli})"><i class="ph ph-trash"></i></button></td>`;
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

            window.hapusDataNilai = (id) => { if (confirm('Hapus data nilai ini?')) { dataNilai.splice(id, 1); localStorage.setItem('db_nilai', JSON.stringify(dataNilai)); renderTabelNilai(); tampilkanToast(`Nilai dihapus.`, 'warning'); } };
            renderTabelNilai();

            document.getElementById('btn-ekspor-nilai')?.addEventListener('click', function () {
                if (dataNilai.length === 0) { tampilkanToast('Tidak ada nilai untuk diekspor!', 'danger'); return; }
                this.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memproses...'; this.style.pointerEvents = 'none';
                setTimeout(() => {
                    let csvContent = "Nama Siswa,Mata Pelajaran,Jenis Evaluasi,Skor\n";
                    dataNilai.forEach(d => { csvContent += `"${d.nama}","${d.mapel}","${d.jenis}","${d.skor}"\n`; });
                    mengunduhFileCSV(csvContent, 'Rekap_Nilai.csv');
                    this.innerHTML = '<i class="ph ph-download-simple"></i> Ekspor Rapor (CSV)'; this.style.pointerEvents = 'auto'; tampilkanToast('Rapor diunduh.', 'success');
                }, 800);
            });
        }

        // --- 6. PENGATURAN (TAMBAHAN BARU) ---
        if (namaView === 'pengaturan') {
            const formProfil = document.getElementById('form-pengaturan-profil');
            const inputNama = document.getElementById('setting-nama');
            const inputPeran = document.getElementById('setting-peran');
            const btnResetData = document.getElementById('btn-reset-data');

            // Muat Data Saat Ini ke Formulir
            const profilTersimpan = JSON.parse(localStorage.getItem('db_profil')) || { nama: 'Guru Pengajar', peran: 'Wali Kelas 4B' };
            if (inputNama && inputPeran) {
                inputNama.value = profilTersimpan.nama;
                inputPeran.value = profilTersimpan.peran;
            }

            // Aksi Simpan Profil
            if (formProfil) {
                formProfil.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const profilBaru = { nama: inputNama.value, peran: inputPeran.value };
                    localStorage.setItem('db_profil', JSON.stringify(profilBaru));

                    renderProfilGlobal(); // Perbarui header secara instan!
                    tampilkanToast('Informasi profil berhasil diperbarui.', 'success');
                });
            }

            // Aksi Format Ulang Database (Reset LocalStorage)
            if (btnResetData) {
                btnResetData.addEventListener('click', function () {
                    const konfirmasi = confirm("PERINGATAN KERAS!\n\nApakah Anda yakin ingin menghapus SELURUH data Sistem Informasi ini (Presensi, Kelas, Siswa, Nilai)?\n\nTindakan ini bersifat permanen dan tidak dapat dibatalkan.");
                    if (konfirmasi) {
                        localStorage.removeItem('db_presensi');
                        localStorage.removeItem('db_kelas');
                        localStorage.removeItem('db_siswa');
                        localStorage.removeItem('db_nilai');
                        // Sengaja db_profil tidak dihapus agar nama yang presentasi tidak hilang

                        tampilkanToast('Sistem sedang diformat ulang...', 'warning');

                        // Memuat ulang keseluruhan website setelah 1.5 detik
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                });
            }
        }

        // --- 7. ADAPTASI PENCARIAN GLOBAL ---
        const inputPencarian = document.getElementById('input-pencarian');
        if (inputPencarian) {
            const inputBaru = inputPencarian.cloneNode(true);
            inputPencarian.parentNode.replaceChild(inputBaru, inputPencarian);
            inputBaru.placeholder = "Ketik untuk memfilter tabel di modul ini...";
            inputBaru.value = '';

            inputBaru.addEventListener('keyup', function (e) {
                const teksCari = e.target.value.toLowerCase();
                const tabelAktif = document.querySelector('.view-section.active tbody');
                if (tabelAktif) {
                    const barisTabel = tabelAktif.querySelectorAll('tr');
                    barisTabel.forEach(baris => {
                        if (baris.cells.length === 1) return;
                        baris.style.display = baris.textContent.toLowerCase().includes(teksCari) ? '' : 'none';
                    });
                }
            });
        }
    }; // ================= AKHIR DARI inisialisasiHalaman =================

    // ==========================================
    // E. FUNGSI EKSPOR CSV (BOM UTF-8)
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

    // ==========================================
    // F. EVENT LISTENER SIDEBAR & HEADER UMUM
    // ==========================================
    itemNavigasi.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            if (target) bukaModul(target);
        });
    });

    document.getElementById('btn-tambah-data')?.addEventListener('click', () => tampilkanToast('Pilih modul (Siswa/Kelas/Nilai) terlebih dahulu.', 'info'));
    document.getElementById('btn-keluar')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin keluar dari Portal Guru?")) {
            tampilkanToast('Sesi Anda telah diakhiri secara aman.', 'success');
        }
    });

    // ==========================================
    // G. JALANKAN DASHBOARD SAAT APLIKASI DIBUKA
    // ==========================================
    bukaModul('dashboard');
});