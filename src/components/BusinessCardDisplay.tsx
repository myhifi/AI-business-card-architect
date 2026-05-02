import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { BusinessCard } from '../types/card';
import { Mail, Phone, Globe, Trash2, Download, FileText, Smartphone } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { getContrastColor } from '../lib/colors';
import { QRCodeSVG } from 'qrcode.react';

interface BusinessCardDisplayProps {
  card: BusinessCard;
  onDelete?: (id: string) => void;
  onUpdate?: (updatedCard: BusinessCard) => void;
  compact?: boolean;
}

export const BusinessCardDisplay: React.FC<BusinessCardDisplayProps> = ({ card, onDelete, onUpdate, compact = false }) => {
  const isDark = card.theme === 'dark';
  const bgColor = card.customBgColor || (isDark ? '#18181b' : '#ffffff');
  const textColor = card.customTextColor || (getContrastColor(bgColor) === 'black' ? '#18181b' : '#ffffff');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleUpdate = (field: keyof BusinessCard, value: any) => {
    if (onUpdate) {
      onUpdate({ ...card, [field]: value });
    }
  };

  const updatePhone = (index: number, value: string) => {
    if (onUpdate) {
      const newPhones = [...card.phones];
      newPhones[index] = value;
      onUpdate({ ...card, phones: newPhones });
    }
  };
  
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3, 
      });
      const link = document.createElement('a');
      link.download = `${card.name.replace(/\s+/g, '_')}_Business_Card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: [3.5, 2]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, 3.5, 2);
      pdf.save(`${card.name.replace(/\s+/g, '_')}_Business_Card.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
    }
  };

  const containerClasses = compact
    ? "relative w-full max-w-[400px] aspect-[1.75/1] rounded-lg shadow-lg overflow-hidden group border border-zinc-200 dark:border-zinc-800"
    : "relative w-full max-w-[500px] aspect-[1.75/1] rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800";

  // Dynamic font size logic for many phone numbers
  const phoneCount = card.phones.length;
  const phoneFontSize = phoneCount > 3 ? 'text-[8px]' : 'text-[10px]';

  const renderContactInfo = () => (
    <div className="space-y-1">
      {card.email && card.email.trim() !== '' && (
        <div className="flex items-center gap-2 text-[10px] opacity-70">
          <Mail size={10} style={{ color: card.layout === 'split' ? 'inherit' : textColor }} />
          <input
            value={card.email}
            onChange={(e) => handleUpdate('email', e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 w-full"
            style={{ color: 'inherit' }}
            placeholder="Email"
            readOnly={!onUpdate}
          />
        </div>
      )}
      
      <div className={`grid ${phoneCount > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-4 gap-y-1`}>
        {card.phones.map((phone, idx) => (
          <div key={idx} className={`flex items-center gap-2 ${phoneFontSize} opacity-70`}>
            <Smartphone size={10} style={{ color: card.layout === 'split' ? 'inherit' : textColor }} />
            <input
              value={phone}
              onChange={(e) => updatePhone(idx, e.target.value)}
              className="bg-transparent border-none p-0 focus:ring-0 w-full"
              style={{ color: 'inherit' }}
              placeholder="Phone"
              readOnly={!onUpdate}
            />
          </div>
        ))}
      </div>

      {card.website && card.website.trim() !== '' && (
        <div className="flex items-center gap-2 text-[10px] opacity-70">
          <Globe size={10} style={{ color: card.layout === 'split' ? 'inherit' : textColor }} />
          <input
            value={card.website}
            onChange={(e) => handleUpdate('website', e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 w-full"
            style={{ color: 'inherit' }}
            placeholder="Website"
            readOnly={!onUpdate}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] opacity-70">
        <Globe size={10} style={{ color: card.layout === 'split' ? 'inherit' : textColor }} />
        <input
          value={card.company}
          onChange={(e) => handleUpdate('company', e.target.value)}
          className="bg-transparent border-none p-0 focus:ring-0 w-full uppercase"
          style={{ color: 'inherit' }}
          placeholder="Company"
          readOnly={!onUpdate}
        />
      </div>
    </div>
  );

  const renderQRCode = (size = 40) => {
    if (!card.qrLink || card.qrLink.trim() === '') return null;
    return (
      <div className="p-1 self-end bg-white/10 rounded-lg backdrop-blur-sm">
        <QRCodeSVG 
          value={card.qrLink} 
          size={size} 
          level="H" 
          bgColor="transparent"
          fgColor={textColor}
          includeMargin={false}
        />
      </div>
    );
  };

  const renderIdentity = (align: "left" | "center" = "left") => (
    <div className={`space-y-1 ${align === 'center' ? 'text-center' : ''}`}>
      <input
        value={card.name}
        onChange={(e) => handleUpdate('name', e.target.value)}
        className={`w-full bg-transparent border-none p-0 text-xl font-bold tracking-tight focus:ring-0 placeholder:opacity-30 ${align === 'center' ? 'text-center' : ''}`}
        style={{ color: 'inherit' }}
        placeholder="Name"
        readOnly={!onUpdate}
      />
      <input
        value={card.jobTitle}
        onChange={(e) => handleUpdate('jobTitle', e.target.value)}
        className={`w-full bg-transparent border-none p-0 text-xs font-medium uppercase tracking-widest focus:ring-0 placeholder:opacity-30 ${align === 'center' ? 'text-center' : ''}`}
        style={{ color: textColor }}
        placeholder="Job Title"
        readOnly={!onUpdate}
      />
    </div>
  );

  const renderLogo = (size: string = "w-16 h-16") => (
    <div className={`${size} bg-white rounded-lg shadow-sm border border-zinc-100 overflow-hidden p-1 flex-shrink-0`}>
      <img 
        src={card.logoUrl} 
        alt={card.company} 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
      className={containerClasses}
      id={`card-${card.id}`}
    >
      <div 
        ref={cardRef}
        className={`w-full h-full p-6 relative transition-colors duration-500 overflow-hidden`}
        style={{ 
          aspectRatio: '1.75/1',
          backgroundColor: card.customBgColor || (isDark ? '#18181b' : '#ffffff'),
          color: textColor,
          backgroundImage: card.backgroundUrl ? `url(${card.backgroundUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Semi-transparent overlay if there's a background image */}
        {card.backgroundUrl && (
          <div className={`absolute inset-0 pointer-events-none ${isDark ? 'bg-black/60' : 'bg-white/60'}`} />
        )}

        {card.layout === 'standard' && (
          <>
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5 z-10" 
              style={{ backgroundColor: card.accentColor }} 
            />
            <div className="flex w-full h-full gap-4 z-10 relative">
              <div className="flex-grow flex flex-col justify-between">
                {renderIdentity()}
                {renderContactInfo()}
                <textarea
                  value={card.catchphrase}
                  onChange={(e) => handleUpdate('catchphrase', e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-[10px] italic opacity-50 border-t pt-2 border-zinc-500/20 focus:ring-0 resize-none overflow-hidden uppercase tracking-tighter"
                  style={{ color: 'inherit' }}
                  rows={1}
                  placeholder="Professional Catchphrase"
                  readOnly={!onUpdate}
                />
              </div>
              <div className="w-1/3 flex flex-col items-end justify-between">
                {renderLogo()}
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm font-black tracking-tighter uppercase leading-none opacity-80" style={{ color: 'inherit' }}>{card.company}</p>
                  {renderQRCode(45)}
                </div>
              </div>
            </div>
          </>
        )}

        {card.layout === 'centered' && (
          <div className="w-full h-full flex flex-col items-center justify-between z-10 relative">
            <div className="flex flex-col items-center gap-2">
              {renderLogo("w-12 h-12")}
              {renderIdentity("center")}
            </div>
            
            <div className="flex w-full justify-around items-center px-4">
              {renderContactInfo()}
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] font-black uppercase tracking-tighter opacity-80">{card.company}</p>
                {renderQRCode(35)}
              </div>
            </div>

            <textarea
              value={card.catchphrase}
              onChange={(e) => handleUpdate('catchphrase', e.target.value)}
              className="w-full bg-transparent border-none p-0 text-[10px] italic opacity-50 border-t pt-2 border-zinc-500/20 focus:ring-0 resize-none overflow-hidden uppercase tracking-tighter text-center"
              style={{ color: 'inherit' }}
              rows={1}
              placeholder="Professional Catchphrase"
              readOnly={!onUpdate}
            />
          </div>
        )}

        {card.layout === 'split' && (
          <div className="absolute inset-0 flex z-10">
            {/* Left bar with logo */}
            <div 
              className="w-1/3 h-full flex flex-col items-center justify-center gap-4 relative px-4"
              style={{ backgroundColor: card.accentColor }}
            >
              <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[size:10px_10px]" />
              {renderLogo("w-20 h-20 shadow-xl")}
              <input
                value={card.company}
                onChange={(e) => handleUpdate('company', e.target.value)}
                className="w-full bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-tighter text-center leading-tight focus:ring-0 placeholder:text-white/30 cursor-text relative z-20"
                style={{ color: getContrastColor(card.accentColor) === 'black' ? '#18181b' : '#ffffff' }}
                placeholder="Company"
                readOnly={!onUpdate}
              />
            </div>

            {/* Right content area */}
            <div className="flex-grow h-full p-6 flex flex-col justify-between">
              {renderIdentity()}
              <div className="flex justify-between items-end">
                {renderContactInfo()}
                {renderQRCode(50)}
              </div>
              <textarea
                value={card.catchphrase}
                onChange={(e) => handleUpdate('catchphrase', e.target.value)}
                className="w-full bg-transparent border-none p-0 text-[10px] italic opacity-50 border-t pt-2 border-zinc-500/20 focus:ring-0 resize-none overflow-hidden uppercase tracking-tighter"
                style={{ color: 'inherit' }}
                rows={1}
                placeholder="Professional Catchphrase"
                readOnly={!onUpdate}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Controls (Outside ref to exclude from capture) */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10 translate-y-1 group-hover:translate-y-0">
        <button
          onClick={handleDownloadImage}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-transform hover:scale-110"
          title="Download PNG"
        >
          <Download size={14} />
        </button>
        <button
          onClick={handleDownloadPDF}
          className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-lg transition-transform hover:scale-110"
          title="Download PDF"
        >
          <FileText size={14} />
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-transform hover:scale-110"
            title="Delete Card"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
};
