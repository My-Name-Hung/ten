import React, { useEffect, useRef } from 'react';
import Quagga from 'quagga';
import { FaTimes, FaBarcode } from 'react-icons/fa';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onDetected, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const startScanner = () => {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment"
          },
        },
        frequency: 10,
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        }
      }, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("QuaggaJS initialization succeeded");
        Quagga.start();
      });

      // Xử lý kết quả quét
      Quagga.onDetected((data) => {
        if (data.codeResult.code) {
          // Phát âm thanh beep
          const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU");
          beep.play();

          // Hiển thị overlay thành công
          const successOverlay = document.createElement('div');
          successOverlay.className = 'success-scan-overlay';
          successOverlay.innerHTML = `
            <div class="success-content">
              <div class="success-icon">✓</div>
              <div class="barcode-number">${data.codeResult.code}</div>
            </div>
          `;
          scannerRef.current.appendChild(successOverlay);

          // Gọi callback sau 1 giây
          setTimeout(() => {
            onDetected(data.codeResult.code);
          }, 1000);
        }
      });

      // Xử lý lỗi
      Quagga.onProcessed((result) => {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(
              0,
              0,
              parseInt(drawingCanvas.getAttribute("width")),
              parseInt(drawingCanvas.getAttribute("height"))
            );
            result.boxes.filter((box) => box !== result.box).forEach((box) => {
              Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                color: "green",
                lineWidth: 2
              });
            });
          }

          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
              color: "#00F",
              lineWidth: 2
            });
          }

          if (result.codeResult && result.codeResult.code) {
            Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, {
              color: 'red',
              lineWidth: 3
            });
          }
        }
      });
    };

    startScanner();

    return () => {
      Quagga.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="relative p-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-white hover:text-red-500 transition-colors p-2"
          >
            <FaTimes size={24} />
          </button>
          <div className="text-white text-center flex-1">
            <h2 className="text-lg font-medium">Quét mã vạch sản phẩm</h2>
            <p className="text-sm opacity-75">Đưa mã vạch vào khung hình để quét</p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Scanner View */}
      <div className="relative flex-1">
        <div 
          ref={scannerRef} 
          className="absolute inset-0 scanner-container"
        >
          <div className="viewport" />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm">
        <div className="p-4">
          <div className="text-white text-center mb-4">
            <p className="text-sm">Đảm bảo mã vạch nằm trong khung và đủ ánh sáng</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
            >
              Hủy quét
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 