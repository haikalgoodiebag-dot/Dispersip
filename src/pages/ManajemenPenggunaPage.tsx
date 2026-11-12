import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  Edit,
  Shield,
  Send,
  X,
  SendHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { hashPassword } from '../utils/dateHelper';

export const ManajemenPenggunaPage: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    toggleUserStatus,
    adminResetPassword,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('semua');
  const [bidangFilter, setBidangFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New user form state
  const [newNama, setNewNama] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newPeran, setNewPeran] = useState<UserRole>('Pegawai');
  const [newJabatan, setNewJabatan] = useState('');
  const [newBidang, setNewBidang] = useState('Bidang Perpustakaan');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTempPass, setNewTempPass] = useState('Banjarmasin#2026');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        u.nama.toLowerCase().includes(q) ||
        (u.nip && u.nip.toLowerCase().includes(q)) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.jabatan.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (roleFilter !== 'semua' && u.peran !== roleFilter) return false;
      if (bidangFilter !== 'semua' && u.bidang !== bidangFilter) return false;
      if (statusFilter !== 'semua' && u.status !== statusFilter) return false;

      return true;
    });
  }, [users, searchQuery, roleFilter, bidangFilter, statusFilter]);

  const uniqueBidangList = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.bidang && set.add(u.bidang));
    return Array.from(set);
  }, [users]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!newNama.trim() || !newUsername.trim() || !newEmail.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Nama lengkap, username, dan email wajib diisi.' });
      return;
    }

    const res = addUser({
      nama: newNama.trim(),
      nip: newNip.trim() || undefined,
      peran: newPeran,
      jabatan: newJabatan.trim() || 'Aparatur Sipil Negara',
      unit: 'Dinas Perpustakaan dan Kearsipan Kota Banjarmasin',
      bidang: newBidang,
      username: newUsername.trim().toLowerCase(),
      email: newEmail.trim().toLowerCase(),
      status: 'aktif',
      hashedPassword: hashPassword(newTempPass),
      isFirstLogin: true,
      telegramConnected: false,
    });

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: `Akun untuk ${newNama} berhasil dibuat.` });
      setIsAddModalOpen(false);
      // Reset form
      setNewNama('');
      setNewNip('');
      setNewUsername('');
      setNewEmail('');
    } else {
      setFeedbackMessage({ type: 'error', text: res.message || 'Gagal menambahkan akun.' });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      nama: editingUser.nama,
      nip: editingUser.nip,
      jabatan: editingUser.jabatan,
      bidang: editingUser.bidang,
      peran: editingUser.peran,
      email: editingUser.email,
    });

    setEditingUser(null);
    setFeedbackMessage({ type: 'success', text: 'Data akun berhasil diperbarui.' });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !tempPasswordInput.trim()) return;

    if (tempPasswordInput.length < 8) {
      alert('Kata sandi minimal 8 karakter kombinasi huruf dan angka.');
      return;
    }

    adminResetPassword(resetPassUser.id, tempPasswordInput.trim());
    setResetPassUser(null);
    setTempPasswordInput('');
    setFeedbackMessage({
      type: 'success',
      text: `Kata sandi akun ${resetPassUser.nama} berhasil direset. Wajib diganti saat login pertama.`,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Administrator &bull; Kontrol Hak Akses</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Pengguna &amp; Akun
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun pengguna kedinasan, atur hak akses (role), aktivasi akun, dan atur ulang kata sandi sementara.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedbackMessage(null);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-red-50 border border-red-300 text-red-900'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama lengkap, NIP, username, atau email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
          >
            <option value="semua">Semua Role</option>
            <option value="Administrator">Administrator</option>
            <option value="Staf Sekretariat">Staf Sekretariat</option>
            <option value="Pimpinan">Pimpinan</option>
            <option value="Pegawai">Pegawai</option>
          </select>

          {/* Bidang Filter */}
          <select
            value={bidangFilter}
            onChange={(e) => setBidangFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
          >
            <option value="semua">Semua Bidang</option>
            {uniqueBidangList.map((b, idx) => (
              <option key={idx} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                <th className="py-3 px-4">Nama Lengkap &amp; Gelar</th>
                <th className="py-3 px-4">Username &amp; Email</th>
                <th className="py-3 px-4">Jabatan &amp; Bidang</th>
                <th className="py-3 px-4">Hak Akses (Role)</th>
                <th className="py-3 px-4">Telegram</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{user.nama}</div>
                    {user.nip && (
                      <div className="text-[10px] text-slate-400 font-mono">NIP: {user.nip}</div>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <div className="text-slate-800 font-semibold">@{user.username}</div>
                    <div className="text-[10px] text-slate-400">{user.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-900 font-medium">{user.jabatan}</div>
                    <div className="text-[11px] text-slate-500">{user.bidang}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-300 font-mono">
                      {user.peran}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {user.telegramConnected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        Terhubung
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                        Belum
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {user.status === 'aktif' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        Nonaktif
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailUser(user)}
                        title="Lihat Detail Akun"
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setEditingUser(user)}
                        title="Edit Data Pengguna"
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setResetPassUser(user);
                          setTempPasswordInput('Banjarmasin#2026');
                        }}
                        title="Reset Kata Sandi Akun"
                        className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-700 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          title={user.status === 'aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border ${
                            user.status === 'aktif'
                              ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {user.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Tambah Akun Pengguna Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap beserta Gelar *
                </label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Muhammad Ihsan, S.AP"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={newNip}
                    onChange={(e) => setNewNip(e.target.value)}
                    placeholder="1988..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hak Akses (Role) *</label>
                  <select
                    value={newPeran}
                    onChange={(e) => setNewPeran(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="Pegawai">Pegawai</option>
                    <option value="Staf Sekretariat">Staf Sekretariat</option>
                    <option value="Pimpinan">Pimpinan</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan *</label>
                  <input
                    type="text"
                    value={newJabatan}
                    onChange={(e) => setNewJabatan(e.target.value)}
                    placeholder="Contoh: Arsiparis Ahli Pertama"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bidang *</label>
                  <input
                    type="text"
                    value={newBidang}
                    onChange={(e) => setNewBidang(e.target.value)}
                    placeholder="Bidang Kearsipan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="ihsan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Email *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ihsan@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi Sementara (Wajib diganti saat login pertama) *
                </label>
                <input
                  type="text"
                  value={newTempPass}
                  onChange={(e) => setNewTempPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-amber-700 font-bold"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">Edit Data Pengguna</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingUser.nama}
                  onChange={(e) => setEditingUser({ ...editingUser, nama: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan</label>
                <input
                  type="text"
                  value={editingUser.jabatan}
                  onChange={(e) => setEditingUser({ ...editingUser, jabatan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bidang</label>
                <input
                  type="text"
                  value={editingUser.bidang}
                  onChange={(e) => setEditingUser({ ...editingUser, bidang: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hak Akses (Role)</label>
                <select
                  value={editingUser.peran}
                  onChange={(e) => setEditingUser({ ...editingUser, peran: e.target.value as UserRole })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="Pegawai">Pegawai</option>
                  <option value="Staf Sekretariat">Staf Sekretariat</option>
                  <option value="Pimpinan">Pimpinan</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                >
                  Perbarui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Reset Kata Sandi Akun
            </h3>
            <p className="text-xs text-slate-500">
              Tetapkan kata sandi sementara untuk <strong>{resetPassUser.nama}</strong>. Pengguna wajib menggantinya saat pertama kali login.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Sementara Baru
                </label>
                <input
                  type="text"
                  value={tempPasswordInput}
                  onChange={(e) => setTempPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-700"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30"
                >
                  Konfirmasi Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail User Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">Detail Profil Akun</h3>
              <button
                onClick={() => setDetailUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Nama Lengkap</p>
                <p className="font-bold text-slate-900 text-sm">{detailUser.nama}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">NIP</p>
                  <p className="font-mono text-slate-700">{detailUser.nip || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Role</p>
                  <p className="font-mono font-bold text-blue-700">{detailUser.peran}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Username</p>
                  <p className="font-mono text-slate-800">@{detailUser.username}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Email</p>
                  <p className="font-mono text-slate-800">{detailUser.email}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Jabatan &amp; Bidang</p>
                <p className="text-slate-800">{detailUser.jabatan} &bull; {detailUser.bidang}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-400 font-mono">Status Telegram</p>
                  <p className="font-bold text-slate-700">
                    {detailUser.telegramConnected ? 'Terhubung' : 'Belum'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono">Status Akun</p>
                  <p className="font-bold text-emerald-700">{detailUser.status.toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
