// components/QRScanner.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface QRScannerProps {
  onClose: () => void;
  onScan: (sku: string | string[]) => void;
  multiScan?: boolean;
}

export default function QRScanner({ onClose, onScan, multiScan = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedSKUs, setScannedSKUs] = useState<string[]>([]);

  useEffect(() => {
    if (!("BarcodeDetector" in window)) {
      setError("Barcode scanning not supported in this browser");
      return;
    }

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const barcodeDetector = new BarcodeDetector({
          formats: ["qr_code"]
        });

        const detectBarcode = async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0 && isScanning) {
              const barcode = barcodes[0];
              handleScanResult(barcode.rawValue);
            }
          } catch (err) {
            console.error("Barcode detection error:", err);
          }
          if (isScanning) {
            requestAnimationFrame(detectBarcode);
          }
        };
        detectBarcode();
      } catch (err) {
        setError("Camera access denied. Please enable camera permissions.");
        console.error("Camera error:", err);
      }
    };
    startScanner();
    return () => {
      setIsScanning(false);
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isScanning]);

  const handleScanResult = (result: string) => {
    let sku = result;
    try {
      const url = new URL(result);
      const pathParts = url.pathname.split("/");
      sku = pathParts[pathParts.length - 1];
    } catch {}
    if (multiScan) {
      setScannedSKUs((prev) => prev.includes(sku) ? prev : [...prev, sku]);
    } else {
      onScan(sku);
      onClose();
    }
  };

  const handleFinishMultiScan = () => {
    if (scannedSKUs.length > 0) {
      onScan(scannedSKUs);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Scan QR Code{multiScan ? 's' : ''}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={24} />
          </button>
        </div>
        <div className="relative aspect-square">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-500 p-4">
              {error}
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-4 border-blue-500 rounded-xl w-64 h-64" />
              </div>
            </>
          )}
        </div>
        {multiScan && (
          <div className="p-4">
            <div className="mb-2 text-gray-700 font-semibold">Scanned SKUs:</div>
            <ul className="mb-2 max-h-24 overflow-y-auto text-sm">
              {scannedSKUs.map((sku) => (
                <li key={sku} className="py-1 px-2 bg-gray-100 rounded mb-1 break-all">{sku}</li>
              ))}
            </ul>
            <button
              onClick={handleFinishMultiScan}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              disabled={scannedSKUs.length === 0}
            >
              Finish & Show Products
            </button>
          </div>
        )}
        <div className="p-4 text-center text-gray-500">
          {error ? "Try another browser" : "Point your camera at a product QR code"}
        </div>
      </div>
    </div>
  );
}

// Add this at the top of your file (before your component)
declare global {
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }
  // Minimal BarcodeDetector type for QR codes
  class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(video: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
    static getSupportedFormats(): Promise<string[]>;
  }
}

