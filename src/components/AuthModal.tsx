import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Loader2, LogIn, UserPlus } from 'lucide-react';
import { db, hashPassword } from '../lib/storage';
import { User as UserType } from '../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const users = db.getUsers();
      const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (isRegister) {
        if (existingUser) {
          throw new Error('Username already exists');
        }
        const newUser: UserType = {
          id: crypto.randomUUID(),
          username,
          passwordHash: hashPassword(password)
        };
        db.saveUsers([...users, newUser]);
        onLogin(newUser);
        onClose();
      } else {
        if (!existingUser || existingUser.passwordHash !== hashPassword(password)) {
          throw new Error('Invalid username or password');
        }
        onLogin(existingUser);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {isRegister ? <UserPlus className="text-blue-600" size={32} /> : <LogIn className="text-blue-600" size={32} />}
                </div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                  {isRegister ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  {isRegister ? 'Join the Architect guild' : 'Manage your professional identity'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-4 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-4 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-950 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-black/10 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? 'Sign Up' : 'Sign In')}
                </button>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-zinc-100 line-clamp-1">
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-sm font-bold text-zinc-400 hover:text-blue-600 transition-colors"
                >
                  {isRegister ? 'Already have an account? Sign in' : 'Don\'t have an account? Create one'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
