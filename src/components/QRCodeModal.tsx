import React, { useState } from 'react';
import { Copy, Check, QrCode, X, Share2, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  roomId: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ roomId, onClose }) => {
  const [copied, setCopied] = useState(false);
  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
    : `https://app.aistudio.build/?room=${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple clean SVG QR code visual approximation generator for URL string
  const qrGoogleApi = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    roomUrl
  )}`;

  return (
    <div
      id="qr-modal-backdrop"
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans"
    >
      <div
        id="qr-modal-card"
        className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] relative"
      >
        <button
          id="qr-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-zinc-950 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-emerald-500/40 shadow-xl">
          <QrCode className="w-7 h-7" />
        </div>

        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Smartphone QR</h3>
        <p className="text-xs text-zinc-400 mt-1 mb-5 font-medium">
          Inquadra il codice QR con la fotocamera per accedere subito alla stanza!
        </p>

        <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border-4 border-zinc-800 mb-5">
          <img
            src={qrGoogleApi}
            alt={`QR Code per la stanza ${roomId}`}
            className="w-48 h-48 rounded-lg"
          />
        </div>

        <div className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between gap-2 mb-4">
          <div className="text-left overflow-hidden">
            <span className="text-[10px] text-zinc-500 block uppercase font-mono font-bold tracking-widest">Codice Stanza</span>
            <span className="text-2xl font-black font-mono text-emerald-400 tracking-wider">
              {roomId}
            </span>
          </div>
          <button
            id="qr-copy-btn"
            onClick={handleCopy}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiato!' : 'Copia Link'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-emerald-400/90 uppercase tracking-wider">
          <Smartphone className="w-4 h-4" />
          <span>Multi-device Ready</span>
        </div>
      </div>
    </div>
  );
};
