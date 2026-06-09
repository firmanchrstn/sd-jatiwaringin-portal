// ==========================================
// PUSAT ALAT BANTU (UTILITIES)
// ==========================================

export const formatTglBaku = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const tampilkanToast = (pesan, tipe = 'info') => {
    const wadahToast = document.getElementById('toast-container');
    if (!wadahToast) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipe}`;
    let ikon = tipe === 'success' ? 'ph-check-circle' : tipe === 'warning' ? 'ph-warning' : tipe === 'danger' ? 'ph-x-circle' : 'ph-info';
    toast.innerHTML = `<i class="ph ${ikon}"></i> <span>${pesan}</span>`;
    wadahToast.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 400); }, 4000);
};

export const mengunduhFileCSV = (csv, namaFile) => {
    const csvBlob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const tautan = document.createElement("a");
    tautan.href = URL.createObjectURL(csvBlob);
    tautan.download = namaFile;
    tautan.style.display = 'none';
    document.body.appendChild(tautan);
    tautan.click();
    document.body.removeChild(tautan);
};

// FITUR KEAMANAN: Membersihkan input dari script jahat (Anti-XSS)
export const sanitize = (str) => {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};