import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  FileText,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Edit3,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAMPLE_LETTERS } from '../data/initialData';
import { GeminiExtractedData } from '../types';

interface UploadSuratPageProps {
  onAiExtracted?: (data: GeminiExtractedData, previewUrl: string, file: File | null) => void;
}

export const UploadSuratPage: React.FC<UploadSuratPageProps> = ({ onAiExtracted }) => {
  const { setActiveTab } = useApp();

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);

  const [processStep, setProcessStep] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Resize image if > 2MB using client-side canvas
  const resizeImageIfNeeded = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // If image is under 2MB, no downscale needed
        if (file.size <= 2 * 1024 * 1024) {
          resolve(dataUrl);
          return;
        }

        // Downscale with canvas (max longest side 2000px, quality 0.85)
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 2000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(resizedDataUrl);
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);

    // 1. Validate format
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Format berkas tidak didukung. Harap unggah dokumen PDF, JPG, PNG, atau WEBP.');
      return;
    }

    // 2. Validate max size 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas melebihi batas maksimal 10 MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFileType(file.type === 'application/pdf' ? 'pdf' : 'image');

    // Run stepwise Gemini extraction
    setIsProcessing(true);
    try {
      setProcessStep('Membaca file…');
      let base64Data = '';
      let mimeType = file.type;

      if (file.type === 'application/pdf') {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        base64Data = await resizeImageIfNeeded(file);
        if (base64Data.startsWith('data:image/jpeg')) {
          mimeType = 'image/jpeg';
        }
      }

      setProcessStep('Mengirim ke AI…');
      const res = await fetch('/api/gemini/analyze-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType,
          fileName: file.name,
        }),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || 'AI Gemini tidak dapat mengekstrak teks surat.');
      }

      setProcessStep('Mengisi formulir…');
      const data: GeminiExtractedData = resJson.data;

      // Save into sessionStorage for PembacaanSuratAiPage
      sessionStorage.setItem('dispersip_temp_extracted', JSON.stringify(data));
      sessionStorage.setItem('dispersip_temp_filename', file.name);

      if (onAiExtracted) {
        onAiExtracted(data, objectUrl, file);
      } else {
        setActiveTab('pembacaan_ai');
      }
    } catch (err: any) {
      console.error('Error in handleProcessFile:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses surat dengan AI Gemini.');
    } finally {
      setIsProcessing(false);
      setProcessStep(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = (sample: typeof SAMPLE_LETTERS[0]) => {
    // Immediate pre-population for evaluators
    const extractedData: GeminiExtractedData = {
      nomor_surat: sample.nomorSurat,
      pengirim: sample.pengirim,
      perihal: sample.perihal,
      tanggal_kegiatan: sample.tanggalKegiatan,
      waktu_kegiatan: sample.waktuKegiatan,
      tempat_kegiatan: sample.tempatKegiatan,
      ringkasan: sample.ringkasan,
      tingkat_keyakinan: sample.tingkatKeyakinan,
      catatan: sample.catatan,
    };

    sessionStorage.setItem('dispersip_temp_extracted', JSON.stringify(extractedData));
    sessionStorage.setItem('dispersip_temp_filename', `${sample.name}.pdf`);
    setActiveTab('pembacaan_ai');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            Sekretariat &bull; Surat Masuk
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Unggah Surat Masuk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah berkas naskah dinas untuk pembacaan otomatis nomor, pengirim, dan jadwal acara oleh AI Gemini.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('pembacaan_ai')}
          className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Edit3 className="w-4 h-4 text-slate-500" />
          <span>Isi Manual / Buka Form</span>
        </button>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Gagal Memproses Surat</p>
            <p className="mt-0.5">{errorMessage}</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => selectedFile && handleProcessFile(selectedFile)}
                className="px-3 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-[11px] cursor-pointer"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => setActiveTab('pembacaan_ai')}
                className="px-3 py-1 rounded-lg border border-red-300 text-red-800 font-semibold text-[11px] hover:bg-red-100 cursor-pointer"
              >
                Isi Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Drag and Drop Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white relative overflow-hidden ${
          dragOver ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-slate-300 hover:border-blue-400'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        {/* Processing Indicator */}
        {isProcessing ? (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-600/30 animate-bounce">
              <Sparkles className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {processStep || 'Memproses berkas...'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                AI Gemini sedang menganalisis naskah dinas untuk mendeteksi nomor surat, pengirim, dan jadwal kegiatan kedinasan.
              </p>
            </div>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Seret dan Jatuhkan Berkas Surat di Sini
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mendukung dokumen <strong>PDF, JPG, PNG, WEBP</strong> (Maksimal 10 MB).
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pemrosesan aman langsung di peramban tanpa mengunggah berkas ke penyimpanan server.
              </p>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Pilih Berkas Surat</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Buka Kamera (Ponsel)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Samples for Evaluators */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Uji Coba Cepat Surat Masuk Resmi (Sampel Siap Pakai)</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Pilih salah satu contoh naskah dinas Pemerintah Kota Banjarmasin di bawah untuk menguji otomatisasi ekstraksi AI Gemini tanpa perlu mengunggah berkas eksternal:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {SAMPLE_LETTERS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSampleSelect(sample)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left flex flex-col justify-between gap-2 cursor-pointer group"
            >
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {sample.nomorSurat}
                </span>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 mt-2 line-clamp-2">
                  {sample.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {sample.perihal}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
                <span>Gunakan Sampel Ini</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
