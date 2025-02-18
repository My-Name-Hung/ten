import React, { useEffect, useRef } from 'react';
import Quagga from 'quagga';

const BarcodeScanner = ({ onDetected, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          facingMode: "environment",
          width: { min: 450 },
          height: { min: 300 },
          aspectRatio: { min: 1, max: 2 }
        },
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 4,
      decoder: {
        readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader"]
      },
      locate: true
    }, function(err) {
      if (err) {
        console.error(err);
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected((result) => {
      if (result.codeResult.code) {
        onDetected(result.codeResult.code);
      }
    });

    return () => {
      Quagga.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1">
        <div 
          ref={scannerRef} 
          className="w-full h-full"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-red-500 rounded-lg"></div>
          </div>
        </div>
        
        {/* Scanner Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-full"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 