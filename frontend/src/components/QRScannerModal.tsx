import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, ShieldAlert } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (text: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) return;

    // Reset error state
    setCameraError(null);
    setIsScanning(false);

    // Small delay to ensure DOM element is rendered
    const timer = setTimeout(() => {
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: (width, height) => {
            const minSize = Math.min(width, height);
            const size = Math.floor(minSize * 0.7);
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          // Play a gentle confirmation sound or vibrate if supported
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          // Stop scanning and trigger success
          stopScanner().then(() => {
            onScanSuccess(decodedText);
          });
        },
        () => {
          // Silent failure for scanner scanning frames
        }
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        console.error('Failed to start camera:', err);
        setCameraError(
          'Could not access your camera. Please ensure camera permissions are granted and no other app is using it.'
        );
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanner-viewfinder {
          position: relative;
          width: 100%;
          max-width: 320px;
          aspect-ratio: 1;
          margin: 0 auto;
          border-radius: 24px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          border: 2.5px solid #8B5CF6;
        }
        .scan-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #EC4899, #8B5CF6, #EC4899, transparent);
          box-shadow: 0 0 10px #8B5CF6, 0 0 20px #EC4899;
          animation: scan 2.5s infinite linear;
          z-index: 10;
        }
        .scanner-corner {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 4px solid #8B5CF6;
          z-index: 11;
        }
        .top-left { top: 12px; left: 12px; border-right: none; border-bottom: none; border-top-left-radius: 12px; }
        .top-right { top: 12px; right: 12px; border-left: none; border-bottom: none; border-top-right-radius: 12px; }
        .bottom-left { bottom: 12px; left: 12px; border-right: none; border-top: none; border-bottom-left-radius: 12px; }
        .bottom-right { bottom: 12px; right: 12px; border-left: none; border-top: none; border-bottom-right-radius: 12px; }
      `}</style>

      <div style={{
        backgroundColor: '#1E1B18',
        color: '#FFFFFF',
        width: '90%',
        maxWidth: 400,
        borderRadius: 28,
        padding: 24,
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '1.5px solid rgba(255,255,255,0.08)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Header */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: 36,
            height: 36,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A1A1AA',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FFF'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#A1A1AA'}
        >
          <X size={20} />
        </button>

        <div style={{
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          padding: 12,
          borderRadius: '50%',
          display: 'inline-flex',
          marginBottom: 12
        }}>
          <Camera size={24} style={{ color: '#A78BFA' }} />
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px 0', fontFamily: 'system-ui, sans-serif' }}>
          Scan UPI QR Code
        </h3>
        <p style={{ fontSize: 13, color: '#A1A1AA', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Point your camera at a printed UPI QR code (table standee or cashier screen) to pay.
        </p>

        {/* Viewfinder Wrapper */}
        <div style={{ width: '100%', position: 'relative', minHeight: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {cameraError ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 24,
              borderRadius: 20,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.2)',
              maxWidth: 320
            }}>
              <ShieldAlert size={36} style={{ color: '#F87171', marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 1.5, margin: 0 }}>
                {cameraError}
              </p>
              <button
                onClick={() => {
                  setCameraError(null);
                  onClose();
                }}
                style={{
                  marginTop: 16,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFF',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Close & Enter UPI Manually
              </button>
            </div>
          ) : (
            <div className="scanner-viewfinder">
              {isScanning && <div className="scan-laser" />}
              <div className="scanner-corner top-left" />
              <div className="scanner-corner top-right" />
              <div className="scanner-corner bottom-left" />
              <div className="scanner-corner bottom-right" />
              <div id={scannerId} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: '#71717A', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔒 Secure camera access runs entirely locally on your device
        </div>
      </div>
    </div>
  );
}
