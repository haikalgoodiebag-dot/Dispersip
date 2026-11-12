import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Save,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Building2,
  FileText,
  Eye,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GeminiExtractedData, TingkatKeyakinan } from '../types';

export const PembacaanSuratAiPage: React.FC = () => {
  const { saveSurat, setActiveTab } = useApp();

  const [nomorSurat, setNomorSurat] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [perihal, setPerihal] = useState('');
  const [tanggalKegiatan, setTanggalKegiatan] = useState('');
  const [waktuKegiatan, setWaktuKegiatan] = useState('');
  const [tempatKegiatan, setTempatKegiatan] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [fileName, setFileName] = useState('surat_masuk.pdf');

  const [confidence, setConfidence] = useState<Record<string, TingkatKeyakinan>>({
    nomor_surat: 'tinggi',
    pengirim: 'tinggi',
    perihal: 'tinggi',
    tanggal_kegiatan: 'tinggi',
    waktu_kegiatan: 'tinggi',
    tempat_kegiatan: 'tinggi',
    ringkasan: 'tinggi',
  });

  const [isSuccessNotification, setIsSuccessNotification] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load from sessionStorage if available
  useEffect(() => {
    const saved = sessionStorage.getItem('dispersip_temp_extracted');
    const savedFileName = sessionStorage.getItem('dispersip_temp_filename');

    if (saved) {
      try {
        const data: GeminiExtractedData = JSON.parse(saved);
        setNomorSurat(data.nomor_surat || '');
        setPengirim(data.pengirim || '');
        setPerihal(data.perihal || '');
        setTanggalKegiatan(data.tanggal_kegiatan || '');
        setWaktuKegiatan(data.waktu_kegiatan || '');
        setTempatKegiatan(data.tempat_kegiatan || '');
        setRingkasan(data.ringkasan || '');
        setCatatan(data.catatan || '');
        if (data.tingkat_keyakinan) {
          setConfidence(data.tingkat_keyakinan);
        }
      } catch (err) {
        console.error('Failed to parse cached extracted data:', err);
      }
    } else {
      // Default initial mock for manual entry or first open
      setNomorSurat('005/142-Dispusipda/2026');
      setPengirim('Dinas Perpustakaan dan Kearsipan Daerah Provinsi Kalimantan Selatan');
      setPerihal('Undangan Workshop Konservasi Naskah Kuno dan Preservasi Arsip Statis');
      setTanggalKegiatan('24-11-2026');
      setWaktuKegiatan('08:30');
      setTempatKegiatan('Aula Kertak Hanyar Dispusipda Prov Kalsel, Km 6 Banjarmasin');
      setRingkasan('Pelaksanaan workshop konservasi dan alih media digital manuskrip Banjar serta teknik preservasi naskah kuno bagi perangkat daerah se-Kalsel.');
      setCatatan('Jadwal sesi khusus SKPD Kota Banjarmasin pada sesi pagi.');
    }

    if (savedFileName) {
      setFileName(savedFileName);
    }
  }, []);

  // Check if date is in the past
  const isDateInPast = (tglStr: string): boolean => {
    if (!tglStr) return false;
    let targetDate: Date | null = null;
    if (tglStr.includes('-')) {
      const parts = tglStr.split('-');
      if (parts[0].length === 4) {
        targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        targetDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    if (targetDate && !isNaN(targetDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return targetDate < today;
    }
    return false;
  };

  const isPast = isDateInPast(tanggalKegiatan);

  // Field validation and confidence checkers
  const isFieldWarning = (fieldKey: string, value: string) => {
    const conf = confidence[fieldKey];
    return conf === 'rendah' || !value || value.toLowerCase() === 'tidak ditemukan';
  };

  const hasAnyLowConfidence =
    isFieldWarning('nomor_surat', nomorSurat) ||
    isFieldWarning('pengirim', pengirim) ||
    isFieldWarning('perihal', perihal) ||
    isFieldWarning('tanggal_kegiatan', tanggalKegiatan);

  const handleSubmit = (sendToPimpinan: boolean) => {
    setValidationError(null);

    if (!nomorSurat.trim()) {
      setValidationError('Nomor surat wajib diisi.');
      return;
    }
    if (!pengirim.trim()) {
      setValidationError('Nama instansi pengirim surat wajib diisi.');
      return;
    }
    if (!perihal.trim()) {
      setValidationError('Perihal kegiatan wajib diisi.');
      return;
    }

    // Convert DD-MM-YYYY to YYYY-MM-DD if needed
    let cleanTanggalKegiatan = tanggalKegiatan;
    if (tanggalKegiatan.includes('-') && tanggalKegiatan.split('-')[0].length === 2) {
      const [d, m, y] = tanggalKegiatan.split('-');
      cleanTanggalKegiatan = `${y}-${m}-${d}`;
    }

    saveSurat(
      {
        nomorSurat: nomorSurat.trim(),
        pengirim: pengirim.trim(),
        asalInstansi: pengirim.trim(),
        perihal: perihal.trim(),
        tanggalKegiatan: cleanTanggalKegiatan,
        waktuKegiatan: waktuKegiatan.trim() || '09:00',
        tempatKegiatan: tempatKegiatan.trim() || 'Dispersip Kota Banjarmasin',
        ringkasan: ringkasan.trim(),
        tingkatKeyakinan: confidence,
        catatanAi: catatan ? [catatan] : [],
        fileName,
      },
      sendToPimpinan
    );

    // Clear temp storage
    sessionStorage.removeItem('dispersip_temp_extracted');
    sessionStorage.removeItem('dispersip_temp_filename');

    setIsSuccessNotification(true);
    setTimeout(() => {
      setActiveTab('arsip_surat');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ekstraksi AI Gemini &bull; Model Multimodal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Verifikasi Hasil Pembacaan Surat AI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Periksa data surat masuk hasil ekstraksi otomatis. Kolom berkeyakinan rendah diberi penanda kuning untuk diverifikasi sebelum diteruskan ke pimpinan.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('upload_surat')}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Upload className="w-4 h-4 text-slate-500" />
          <span>Unggah Berkas Lain</span>
        </button>
      </div>

      {/* Success Notification */}
      {isSuccessNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Surat Berhasil Didaftarkan!</span>
            <p className="text-emerald-700 text-[11px] mt-0.5">
              Status naskah telah diperbarui menjadi Menunggu Disposisi dan pimpinan telah menerima notifikasi. Mengalihkan ke Arsip Surat...
            </p>
          </div>
        </div>
      )}

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      {/* Past Date Warning Alert */}
      {isPast && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Peringatan: Jadwal Kegiatan Telah Lewat!</span>
            <p className="text-amber-800 text-[11px] mt-0.5">
              Tanggal kegiatan yang tertera ({tanggalKegiatan}) telah berlalu dari tanggal hari ini. Harap pastikan kembali kebenaran jadwal naskah dinas ini.
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side: Document Preview on Left / Editable Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Document Preview Pane */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">
                Pratinjau Dokumen Naskah
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
              {fileName}
            </span>
          </div>

          {/* Visual Document Mockup Frame */}
          <div className="flex-1 min-h-[380px] bg-slate-50 border border-slate-200 rounded-2xl p-5 overflow-y-auto space-y-4 font-serif text-slate-800 text-xs shadow-inner">
            {/* Kop Mockup */}
            <div className="text-center pb-3 border-b-2 border-slate-900 leading-tight space-y-0.5">
              <p className="font-sans font-bold text-[10px] tracking-widest uppercase text-slate-500">
                Pemerintah Provinsi Kalimantan Selatan
              </p>
              <h3 className="font-sans font-black text-xs uppercase text-slate-900">
                {pengirim || 'Dinas Perpustakaan & Kearsipan'}
              </h3>
              <p className="font-sans text-[9px] text-slate-500">
                Jl. A. Yani Km 6 Banjarmasin &bull; Kotak Pos 70249
              </p>
            </div>

            {/* Letter Meta */}
            <div className="space-y-1 text-[11px] font-sans">
              <div className="flex justify-between">
                <span>Nomor: <strong>{nomorSurat || '-'}</strong></span>
                <span>Banjarmasin</span>
              </div>
              <p>Sifat: <strong>Penting / Segera</strong></p>
              <p>Lampiran: <strong>1 Berkas Jadwal</strong></p>
              <p>Perihal: <strong className="text-blue-900">{perihal || '-'}</strong></p>
            </div>

            {/* Letter Body Summary */}
            <div className="space-y-2 pt-2 border-t border-slate-200 font-sans text-xs text-slate-700 leading-relaxed">
              <p>Kepada Yth.</p>
              <p className="font-bold text-slate-900">
                Kepala Dinas Perpustakaan dan Kearsipan Kota Banjarmasin
              </p>
              <p className="text-justify indent-4 mt-2">
                {ringkasan || 'Dengan hormat, sehubungan dengan pelaksanaan agenda kedinasan, kami mengharapkan kehadiran Bapak/Ibu atau pejabat yang ditugaskan untuk hadir pada kegiatan berikut:'}
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-[11px] font-sans">
                <p>📅 <strong>Hari/Tanggal:</strong> {tanggalKegiatan || '-'}</p>
                <p>⏰ <strong>Waktu:</strong> {waktuKegiatan || '-'} WITA</p>
                <p>📍 <strong>Tempat:</strong> {tempatKegiatan || '-'}</p>
              </div>
              {catatan && (
                <p className="text-[11px] text-amber-700 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Catatan naskah: {catatan}
                </p>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-sans">
            Sesi pratinjau aktif &bull; Berkas tidak diunggah ke server
          </p>
        </div>

        {/* Right Side: Form Verifikasi & Koreksi Petugas */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Formulir Ekstraksi &amp; Verifikasi
            </h3>
            {hasAnyLowConfidence && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Perlu Periksa Kolom Kuning
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Nomor Surat & Pengirim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Surat *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => {
                      setNomorSurat(e.target.value);
                      setConfidence((prev) => ({ ...prev, nomor_surat: 'tinggi' }));
                    }}
                    placeholder="Contoh: 005/142-Dispusipda/2026"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono transition-all border ${
                      isFieldWarning('nomor_surat', nomorSurat)
                        ? 'bg-amber-50 border-amber-400 focus:ring-amber-500'
                        : 'bg-slate-50 border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                  {confidence.nomor_surat === 'rendah' && (
                    <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
                      Periksa
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instansi Pengirim *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pengirim}
                    onChange={(e) => {
                      setPengirim(e.target.value);
                      setConfidence((prev) => ({ ...prev, pengirim: 'tinggi' }));
                    }}
                    placeholder="Contoh: Dinas Perpustakaan dan Kearsipan Prov Kalsel"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 transition-all border ${
                      isFieldWarning('pengirim', pengirim)
                        ? 'bg-amber-50 border-amber-400 focus:ring-amber-500'
                        : 'bg-slate-50 border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                  {confidence.pengirim === 'rendah' && (
                    <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
                      Periksa
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Perihal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Perihal / Nama Kegiatan *
              </label>
              <textarea
                rows={2}
                value={perihal}
                onChange={(e) => {
                  setPerihal(e.target.value);
                  setConfidence((prev) => ({ ...prev, perihal: 'tinggi' }));
                }}
                placeholder="Perihal surat atau nama kegiatan kedinasan"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-slate-900 transition-all border ${
                  isFieldWarning('perihal', perihal)
                    ? 'bg-amber-50 border-amber-400 focus:ring-amber-500'
                    : 'bg-slate-50 border-slate-300 focus:ring-blue-500'
                }`}
              />
            </div>

            {/* Jadwal: Tanggal, Waktu, Tempat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Kegiatan (DD-MM-YYYY)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tanggalKegiatan}
                    onChange={(e) => {
                      setTanggalKegiatan(e.target.value);
                      setConfidence((prev) => ({ ...prev, tanggal_kegiatan: 'tinggi' }));
                    }}
                    placeholder="Contoh: 24-11-2026"
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono border ${
                      isFieldWarning('tanggal_kegiatan', tanggalKegiatan)
                        ? 'bg-amber-50 border-amber-400 text-amber-950'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Waktu (24 Jam WITA)
                </label>
                <input
                  type="text"
                  value={waktuKegiatan}
                  onChange={(e) => {
                    setWaktuKegiatan(e.target.value);
                    setConfidence((prev) => ({ ...prev, waktu_kegiatan: 'tinggi' }));
                  }}
                  placeholder="Contoh: 08:30"
                  className={`w-full rounded-xl px-3 py-2 text-xs font-mono border ${
                    isFieldWarning('waktu_kegiatan', waktuKegiatan)
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempat Kegiatan
                </label>
                <input
                  type="text"
                  value={tempatKegiatan}
                  onChange={(e) => {
                    setTempatKegiatan(e.target.value);
                    setConfidence((prev) => ({ ...prev, tempat_kegiatan: 'tinggi' }));
                  }}
                  placeholder="Contoh: Aula Dispusipda Kalsel"
                  className={`w-full rounded-xl px-3 py-2 text-xs border ${
                    isFieldWarning('tempat_kegiatan', tempatKegiatan)
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Ringkasan Isi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ringkasan Surat (Maksimal 3 Kalimat)
              </label>
              <textarea
                rows={2}
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder="Ringkasan naskah dinas hasil analisis AI"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
              />
            </div>

            {/* Catatan / Ambiguity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Petugas / AI
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan tambahan lampiran atau hal ambigu"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Simpan Draf Surat</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <span>Kirim ke Pimpinan</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
