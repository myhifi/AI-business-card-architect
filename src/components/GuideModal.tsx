import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Shield, Library, Layout, Smartphone, Download, Plus, Wand2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuideStep: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="flex gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-colors group">
    <div className="w-12 h-12 shrink-0 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-black text-zinc-900 tracking-tight">{title}</h4>
      <p className="text-xs text-zinc-500 leading-relaxed font-medium">{description}</p>
    </div>
  </div>
);

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row"
          >
            {/* Left Decorative Sidebar */}
            <div className="md:w-1/3 bg-zinc-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#2563eb_0%,transparent_50%)]" />
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
                   <Sparkles className="text-white" size={24} />
                 </div>
                 <h2 className="text-3xl font-black italic tracking-tighter leading-none mb-2">Master the Architect.</h2>
                 <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                   Elevate your professional identity in seconds.
                 </p>
               </div>
               <div className="relative z-10 pt-8 border-t border-white/10">
                 <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Version 2.0 &bull; 2026</p>
               </div>
            </div>

            {/* Right Scrollable Content */}
            <div className="flex-1 p-6 md:p-10 max-h-[80vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-900 z-20 bg-white shadow-sm"
              >
                <X size={20} />
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Core Modules</h3>
                  <div className="grid grid-cols-1 gap-1">
                    <GuideStep 
                      icon={<Wand2 className="text-blue-600" size={20} />} 
                      title="AI Forge Graphics"
                      description="Enter your name and profession. Our AI synthesizes a professional layout and custom branding assets automatically."
                    />
                    <GuideStep 
                      icon={<Layout className="text-indigo-600" size={20} />} 
                      title="Live Editing"
                      description="Click any text on the card to edit it in real-time. Toggle between Standard, Centered, and Modern Split layouts."
                    />
                    <GuideStep 
                      icon={<Shield className="text-emerald-600" size={20} />} 
                      title="Identity Vault"
                      description="Manage multiple profiles. Each profile (Personal, Business, Family) has its own private repository for saved cards."
                    />
                    <GuideStep 
                      icon={<Library className="text-amber-600" size={20} />} 
                      title="The 3-in-1 Package"
                      description="Archive your design into the vault with one click. Use 'Archive All 3 Layouts' to save every variation simultaneously."
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Pro Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        <Smartphone size={12} />
                        Connected Presence
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-tight">
                        Add a URL to generate a dynamic QR Code that connects your physical card to your digital presence.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        <Download size={12} />
                        Logo Assets
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-tight">
                        Use the 'Download Logo Assets' button to export your AI-generated brand mark for use in other documents.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={onClose}
                    className="w-full bg-zinc-950 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-black/10 active:scale-[0.98]"
                  >
                    Got it, Architect
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
