import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Trash2, ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { db, hashPassword } from '../lib/storage';
import { User } from '../types/auth';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, user, onLogout }) => {
  const [newPassword, setNewPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    
    setIsUpdating(true);
    setSuccess(null);
    await new Promise(resolve => setTimeout(resolve, 800));

    db.updatePassword(user.id, hashPassword(newPassword));
    setNewPassword('');
    setSuccess('Password updated successfully');
    setIsUpdating(false);
    
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure? This will permanently delete your account, all profiles, and all archived cards in your vault. This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    db.deleteUser(user.id);
    onLogout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden relative z-10"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-900"
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-12">
              <div className="mb-8 text-center text-zinc-900">
                <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="text-zinc-950" size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Account Settings</h2>
                <p className="text-zinc-500 text-sm mt-1">{user.username}</p>
              </div>

              <div className="space-y-8">
                {/* Update Password */}
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                      <input
                        required
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-4 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold text-center"
                    >
                      {success}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isUpdating || !newPassword.trim()}
                    className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                  </button>
                </form>

                {/* Danger Zone */}
                <div className="pt-8 border-t border-zinc-100">
                  <div className="flex items-center gap-2 text-rose-600 mb-4 px-1">
                    <ShieldAlert size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Danger Zone</span>
                  </div>
                  
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="w-full bg-rose-50 hover:bg-rose-100/80 text-rose-600 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group whitespace-nowrap overflow-hidden"
                  >
                    {isDeleting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Trash2 size={18} className="group-hover:shake" />
                        Delete Account Permanently
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-zinc-400 font-medium text-center mt-3 leading-relaxed">
                    Account deletion is instant and irreversible. You will lose access to all cloud profiles and archived designs.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
