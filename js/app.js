document.addEventListener('DOMContentLoaded', () => {

    // 1. SISTEM TOAST NOTIFICATION (Global)
    window.tampilkanToast = (pesan, tipe = 'info') => {
        const wadahToast = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipe}`;

        let ikon = 'ph-info';
        if (tipe === 'success') ikon = 'ph-check-circle';
        if (tipe === 'warning') ikon = 'ph-warning';
        if (tipe === 'danger') ikon = 'ph-x-circle';

        toast.innerHTML = `<i class="ph ${ikon}"></i> <span>${pesan}</span>`;
        wadahToast.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    // 2. MESIN ROUTING (FETCH API)
    const itemNavigasi = document.querySelectorAll('.nav-menu .nav-item');
    const kanvasKonten = document.getElementById('app-content');

    window.bukaModul = async (namaFileView) => {
        itemNavigasi.forEach(nav => nav.classList.remove('active'));
        const menuAktif = document.querySelector(`.nav-item[data-target="${namaFileView}"]`);
        if (menuAktif) menuAktif.classList.add('active');

        try {
            // Ambil halaman HTML dari folder views
            const respons = await fetch(`views/${namaFileView}.html`);
            if (!respons.ok) throw new Error('Halaman tidak ditemukan');

            const html = await respons.text();
            kanvasKonten.innerHTML = html;

            // Inisialisasi ulang script khusus untuk halaman tersebut
            inisialisasiHalaman(namaFileView);
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

    // 3. INISIALISASI FITUR PER HALAMAN
    const inisialisasiHalaman = (namaView) => {

        // --- Fitur Halaman Dasbor ---
        if (namaView === 'dashboard') {
            const elemenTanggal = document.getElementById('tanggal-hari-ini');
            if (elemenTanggal) {
                elemenTanggal.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            }
        }

        // --- Fitur Halaman Presensi ---
        if (namaView === 'presensi') {
            const btnEkspor = document.getElementById('btn-ekspor');
            const inputPencarian = document.getElementById('input-pencarian');

            // Logika Pencarian Tabel
            if (inputPencarian) {
                // Hapus event listener lama agar tidak dobel
                const inputBaru = inputPencarian.cloneNode(true);
                inputPencarian.parentNode.replaceChild(inputBaru, inputPencarian);

                inputBaru.addEventListener('keyup', function (e) {
                    const teksCari = e.target.value.toLowerCase();
                    const barisTabel = document.querySelectorAll('#body-tabel-presensi tr');
                    barisTabel.forEach(baris => {
                        const teksBaris = baris.textContent.toLowerCase();
                        baris.style.display = teksBaris.includes(teksCari) ? '' : 'none';
                    });
                });
            }

            // Logika Tombol Ekspor
            if (btnEkspor) {
                btnEkspor.addEventListener('click', function () {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memproses...';
                    this.style.pointerEvents = 'none';
                    setTimeout(() => {
                        eksporTabelKeCSV('tabel-presensi', 'Laporan_Presensi_SD_Jatiwaringin_1.csv');
                        this.innerHTML = originalText;
                        this.style.pointerEvents = 'auto';
                        tampilkanToast('Laporan CSV berhasil diunduh.', 'success');
                    }, 800);
                });
            }
        }
    };

    // 4. FUNGSI EKSPOR CSV (Global)
    window.eksporTabelKeCSV = (idTabel, namaFile) => {
        const tabel = document.getElementById(idTabel);
        if (!tabel) return;
        let csvData = [];
        const barisTabel = tabel.querySelectorAll("tr");
        for (let i = 0; i < barisTabel.length; i++) {
            if (barisTabel[i].style.display === 'none') continue;
            let barisData = [];
            const kolom = barisTabel[i].querySelectorAll("td, th");
            for (let j = 0; j < kolom.length; j++) {
                let teks = kolom[j].innerText.replace(/(\r\n|\n|\r)/gm, "").trim();
                barisData.push(`"${teks.replace(/"/g, '""')}"`);
            }
            csvData.push(barisData.join(","));
        }
        const csvBlob = new Blob(["\uFEFF" + csvData.join("\n")], { type: "text/csv;charset=utf-8;" });
        const tautan = document.createElement("a");
        tautan.href = URL.createObjectURL(csvBlob);
        tautan.download = namaFile;
        tautan.style.display = 'none';
        document.body.appendChild(tautan);
        tautan.click();
        document.body.removeChild(tautan);
    };

    // 5. EVENT LISTENER SIDEBAR & HEADER
    itemNavigasi.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            if (target) bukaModul(target);
        });
    });

    document.getElementById('btn-tambah-data')?.addEventListener('click', () => tampilkanToast('Formulir tambah data dibuka.', 'info'));
    document.getElementById('btn-pengaturan')?.addEventListener('click', (e) => { e.preventDefault(); tampilkanToast('Menu pengaturan sedang dikembangkan.', 'warning'); });
    document.getElementById('btn-keluar')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin keluar?")) {
            tampilkanToast('Sesi Anda telah diakhiri secara aman.', 'success');
        }
    });

    // 6. JALANKAN DASHBOARD SAAT PERTAMA KALI DIBUKA
    bukaModul('dashboard');
});