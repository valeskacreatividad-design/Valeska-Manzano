import React, { useState, useEffect } from 'react';
import { X, Copy, Check, MessageCircle, ExternalLink, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { Survey } from '../types.ts';

interface ShareModalProps {
  survey: Survey | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTaker: (id: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  survey,
  isOpen,
  onClose,
  onOpenTaker,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQr, setShowQr] = useState(false);

  if (!isOpen || !survey) return null;

  // Build the clean sharable URL
  const shareUrl = `${window.location.origin}${window.location.pathname}#/s/${survey.id}`;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR:', err));
  }, [shareUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const whatsappMessage = encodeURIComponent(
    `Hola, por favor ayúdame respondiendo esta breve encuesta sobre "${survey.title}". Puedes responderla fácilmente desde tu teléfono o computadora aquí:\n\n${shareUrl}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Compartir Encuesta</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cualquier persona puede responder usando este enlace público
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Enlace Directo para Responder
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 select-all font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar Link
                </>
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-600 font-medium">
              ✓ Enlace copiado al portapapeles. Listo para enviar por chat o correo.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            Enviar por WhatsApp
          </a>

          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            {showQr ? 'Ocultar Código QR' : 'Mostrar Código QR'}
          </button>
        </div>

        {/* QR Section */}
        {showQr && qrDataUrl && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-150">
            <p className="text-xs text-slate-600 text-center">
              Escanea con la cámara del celular para responder en el instante:
            </p>
            <img
              src={qrDataUrl}
              alt="Código QR de la encuesta"
              className="w-44 h-44 rounded-lg bg-white p-2 border border-slate-200"
            />
            <span className="text-[11px] text-slate-400">
              Ideal para proyectar en pantallas o imprimir
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTaker(survey.id);
            }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir vista de encuestado para probarla
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
