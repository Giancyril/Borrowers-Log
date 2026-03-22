import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import {
  FaUser, FaShieldAlt, FaUserPlus, FaTrash, FaEye, FaEyeSlash,
  FaKey, FaAt, FaIdBadge, FaCog,
} from "react-icons/fa";
import {
  useChangePasswordMutation,
  useChangeEmailMutation,
  useChangeUsernameMutation,
  useGetAdminsQuery,
  useRegisterAdminMutation,
  useDeleteAdminMutation,
} from "../../redux/api/api";
import { useAdminUser, signOut } from "../../auth/auth";

type Tab = "account" | "security" | "admins";

const InputField = React.forwardRef(function InputField(
  { className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string },
  ref: React.Ref<HTMLInputElement>
) {
  return (
    <input
      ref={ref}
      {...props}
      className={`w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm
        placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    />
  );
});

const SubmitButton = ({ loading, children }: { loading?: boolean; children: React.ReactNode }) => (
  <button type="submit" disabled={loading}
    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500
      disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl
      transition-all shadow-lg shadow-blue-900/30">
    {loading ? (
      <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
    ) : children}
  </button>
);

export default function SettingsPage() {
  const navigate    = useNavigate();
  const currentUser = useAdminUser();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [showPw,    setShowPw]    = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);

  const [changePassword, { isLoading: pwLoading }]       = useChangePasswordMutation();
  const [changeEmail,    { isLoading: emailLoading }]    = useChangeEmailMutation();
  const [changeUsername, { isLoading: usernameLoading }] = useChangeUsernameMutation();
  const [registerAdmin,  { isLoading: regLoading }]      = useRegisterAdminMutation();
  const [deleteAdmin,    { isLoading: delLoading }]      = useDeleteAdminMutation();
  const { data: adminsData, isLoading: adminsLoading }   = useGetAdminsQuery(undefined);
  const admins = adminsData?.data ?? [];

  const pwForm       = useForm();
  const emailForm    = useForm();
  const usernameForm = useForm();
  const regForm      = useForm();

  const handleChangePassword = async (data: any) => {
    try {
      const res: any = await changePassword(data);
      if (res?.error) { toast.error(res.error?.data?.message ?? "Failed"); return; }
      toast.success("Password changed! Please sign in again.");
      pwForm.reset();
      setTimeout(() => signOut(navigate), 1500);
    } catch { toast.error("Failed to change password"); }
  };

  const handleChangeEmail = async (data: any) => {
    try {
      const res: any = await changeEmail(data);
      if (res?.error) { toast.error(res.error?.data?.message ?? "Failed"); return; }
      toast.success("Email changed! Please sign in again.");
      emailForm.reset();
      setTimeout(() => signOut(navigate), 1500);
    } catch { toast.error("Failed to change email"); }
  };

  const handleChangeUsername = async (data: any) => {
    try {
      const res: any = await changeUsername(data);
      if (res?.error) { toast.error(res.error?.data?.message ?? "Failed"); return; }
      toast.success("Username changed!");
      usernameForm.reset();
    } catch { toast.error("Failed to change username"); }
  };

  const handleRegister = async (data: any) => {
    try {
      const res: any = await registerAdmin(data);
      if (res?.error) { toast.error(res.error?.data?.message ?? "Failed"); return; }
      toast.success("Admin account created!");
      regForm.reset();
    } catch { toast.error("Failed to create admin"); }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    try {
      await deleteAdmin(id).unwrap();
      toast.success("Admin deleted");
    } catch (err: any) { toast.error(err?.data?.message ?? "Failed to delete"); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "account",  label: "Account",  icon: <FaUser size={13} />      },
    { key: "security", label: "Security", icon: <FaShieldAlt size={13} /> },
    { key: "admins",   label: "Admins",   icon: <FaUserPlus size={13} />  },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center shrink-0">
            <FaCog size={16} className="text-gray-400" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Settings</h1>
            <p className="text-gray-500 text-xs mt-0.5">Manage your account and system</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1">
        {tabs.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === key ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}>
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── ACCOUNT tab ── */}
      {activeTab === "account" && (
        <div className="space-y-4">

          {/* Current info */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-lg">
                {currentUser?.name?.charAt(0)?.toUpperCase() || currentUser?.username?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate">{currentUser?.name || currentUser?.username}</p>
              <p className="text-gray-400 text-sm truncate">{currentUser?.email}</p>
              <p className="text-gray-600 text-xs mt-0.5">{currentUser?.role}</p>
            </div>
          </div>

          {/* Change username */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <FaIdBadge size={13} className="text-blue-400" />
              <h2 className="text-sm font-bold text-white">Change Username</h2>
            </div>
            <form onSubmit={usernameForm.handleSubmit(handleChangeUsername)} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  New Username
                </label>
                <InputField
                  {...usernameForm.register("username", { required: true })}
                  placeholder="new_username"
                />
              </div>
              <SubmitButton loading={usernameLoading}>
                <FaIdBadge size={12} /> Update Username
              </SubmitButton>
            </form>
          </div>

          {/* Change email */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <FaAt size={13} className="text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Change Email</h2>
            </div>
            <form onSubmit={emailForm.handleSubmit(handleChangeEmail)} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  New Email
                </label>
                <InputField
                  type="email"
                  {...emailForm.register("email", { required: true })}
                  placeholder="new@nbsc.edu.ph"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Current Password
                </label>
                <InputField
                  type="password"
                  {...emailForm.register("password", { required: true })}
                  placeholder="••••••••"
                />
              </div>
              <SubmitButton loading={emailLoading}>
                <FaAt size={12} /> Update Email
              </SubmitButton>
            </form>
          </div>
        </div>
      )}

      {/* ── SECURITY tab ── */}
      {activeTab === "security" && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <FaKey size={13} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white">Change Password</h2>
          </div>
          <form onSubmit={pwForm.handleSubmit(handleChangePassword)} className="p-5 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <InputField
                  type={showPw ? "text" : "password"}
                  {...pwForm.register("oldPassword", { required: true })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                New Password
              </label>
              <div className="relative">
                <InputField
                  type={showNewPw ? "text" : "password"}
                  {...pwForm.register("newPassword", { required: true, minLength: 8 })}
                  placeholder="Min. 8 characters"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showNewPw ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </button>
              </div>
              {pwForm.formState.errors.newPassword && (
                <p className="text-red-400 text-xs mt-1">Minimum 8 characters required</p>
              )}
            </div>
            <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
              <p className="text-amber-400/80 text-xs">You will be signed out after changing your password.</p>
            </div>
            <SubmitButton loading={pwLoading}>
              <FaKey size={12} /> Change Password
            </SubmitButton>
          </form>
        </div>
      )}

      {/* ── ADMINS tab ── */}
      {activeTab === "admins" && (
        <div className="space-y-4">

          {/* Register new admin */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <FaUserPlus size={13} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Register New Admin</h2>
            </div>
            <form onSubmit={regForm.handleSubmit(handleRegister)} className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Full Name
                  </label>
                  <InputField
                    {...regForm.register("name", { required: true })}
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Username
                  </label>
                  <InputField
                    {...regForm.register("username", { required: true })}
                    placeholder="jdelacruz"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <InputField
                  type="email"
                  {...regForm.register("email", { required: true })}
                  placeholder="admin@nbsc.edu.ph"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <InputField
                    type={showRegPw ? "text" : "password"}
                    {...regForm.register("password", { required: true, minLength: 8 })}
                    placeholder="Min. 8 characters"
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowRegPw(!showRegPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showRegPw ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>
              <SubmitButton loading={regLoading}>
                <FaUserPlus size={12} /> Create Admin Account
              </SubmitButton>
            </form>
          </div>

          {/* Admin list */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">Existing Admins</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {admins.length} admin account{admins.length !== 1 ? "s" : ""}
              </p>
            </div>
            {adminsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : admins.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">No admins found</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {admins.map((admin: any) => (
                  <div key={admin.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-xs">
                        {admin.name?.charAt(0)?.toUpperCase() || admin.username?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{admin.name || admin.username}</p>
                      <p className="text-gray-500 text-xs truncate">{admin.email}</p>
                    </div>
                    {admin.id === currentUser?.id ? (
                      <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold shrink-0">
                        You
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.name || admin.username)}
                        disabled={delLoading}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors disabled:opacity-50 shrink-0">
                        <FaTrash size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}