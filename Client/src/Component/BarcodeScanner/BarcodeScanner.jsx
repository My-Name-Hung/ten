import React, { useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import {
  configure,
  DataCaptureView,
  Camera,
  DataCaptureContext,
  FrameSourceState,
  Color
} from "@scandit/web-datacapture-core";
import {
  BarcodeBatch,
  BarcodeBatchSettings,
  BarcodeBatchBasicOverlay,
  barcodeCaptureLoader,
  Symbology
} from "@scandit/web-datacapture-barcode";
import './BarcodeScanner.css';
import { LICENSE_KEY_SCANDIT } from '../../config/config';

const BarcodeScanner = ({ onDetected, onClose, settings = {} }) => {
  const viewRef = useRef(null);
  const contextRef = useRef(null);
  const barcodeListRef = useRef(new Set());
  const [showList, setShowList] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  
  const {
    enableMultiScan = true,
    maxMultiScanCount = 150
  } = settings;

  useEffect(() => {
    const setupScanner = async () => {
      try {
        // Create DataCaptureView first
        const view = new DataCaptureView();
        view.connectToElement(viewRef.current);

        // Show loading progress
        view.showProgressBar();
        view.setProgressBarMessage('Đang tải scanner...');

        // Configure SDK
        await configure({
          licenseKey: LICENSE_KEY_SCANDIT,
          libraryLocation: new URL(
            'https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@7.0.0/sdc-lib/',
          ).toString(),
          moduleLoaders: [barcodeCaptureLoader()]
        });

        // Create context
        contextRef.current = await DataCaptureContext.create();

        // Create settings for batch scanning với cấu hình mới
        const settings = new BarcodeBatchSettings();
        
        // Cấu hình để quét nhiều mã hơn
        settings.capacity = maxMultiScanCount; // Số lượng mã tối đa có thể quét
        settings.codeDuplicateFilter = 0; // Tắt bộ lọc trùng lặp
        
        // Bật tất cả các loại mã vạch phổ biến và cấu hình độ dài cho chúng
        const symbologies = [
          Symbology.EAN13UPCA,
          Symbology.EAN8,
          Symbology.UPCE,
          Symbology.Code128,
          Symbology.Code39,
          Symbology.QR,
          Symbology.DataMatrix,
          Symbology.InterleavedTwoOfFive,
          Symbology.Code93
        ];

        // Bật tất cả symbologies
        settings.enableSymbologies(symbologies);

        // Cấu hình riêng cho từng loại mã nếu cần
        symbologies.forEach(symbology => {
          const symbologySettings = settings.settingsForSymbology(symbology);
          if (symbologySettings) {
            // Đặt các cấu hình chung cho tất cả các loại mã
            symbologySettings.enabled = true;
          }
        });

        // Create barcode batch mode
        const barcodeBatch = await BarcodeBatch.forContext(contextRef.current, settings);

        // Setup camera với cấu hình tối ưu
        const camera = Camera.default;
        const cameraSettings = BarcodeBatch.recommendedCameraSettings;
        
        // Tối ưu cài đặt camera
        cameraSettings.preferredResolution = {
          width: 1920,
          height: 1080
        };
        cameraSettings.zoomFactor = 1.0;
        cameraSettings.focusRange = "full";
        
        await camera.applySettings(cameraSettings);
        await contextRef.current.setFrameSource(camera);

        // Connect view to context
        await view.setContext(contextRef.current);

        // Create and customize overlay
        const overlay = await BarcodeBatchBasicOverlay.withBarcodeBatchForView(
          barcodeBatch,
          view
        );

        // Customize overlay appearance
        overlay.listener = {
          brushForTrackedBarcode: () => ({
            fillColor: Color.fromRGBA(0, 255, 0, 0.2),
            strokeColor: Color.fromRGBA(0, 255, 0, 1),
            strokeWidth: 2
          })
        };

        // Add batch mode listener với xử lý tối ưu
        const batchListener = {
          didUpdateSession: (_, session) => {
            session.addedTrackedBarcodes.forEach(trackedBarcode => {
              const barcodeData = trackedBarcode.barcode.data;
              if (barcodeData && !barcodeListRef.current.has(barcodeData)) {
                barcodeListRef.current.add(barcodeData);
                setScannedBarcodes(Array.from(barcodeListRef.current));
              }
            });
          }
        };

        barcodeBatch.addListener(batchListener);

        // Hide progress after loading
        view.hideProgressBar();

        // Switch camera on and enable batch mode
        await camera.switchToDesiredState(FrameSourceState.On);
        await barcodeBatch.setEnabled(true);

      } catch (error) {
        console.error('Scanner initialization error:', error);
        alert('Không thể khởi tạo scanner. Vui lòng thử lại.');
      }
    };

    setupScanner();

    return () => {
      if (contextRef.current) {
        contextRef.current.dispose();
      }
      barcodeListRef.current.clear();
    };
  }, [onDetected, onClose, enableMultiScan, maxMultiScanCount]);

  const handleComplete = () => {
    if (barcodeListRef.current.size > 0) {
      const barcodes = Array.from(barcodeListRef.current);
      onDetected(barcodes);
      onClose();
    } else {
      alert('Chưa có mã vạch nào được quét');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black">
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50">
        <div className="p-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-white hover:text-red-500 transition-colors"
          >
            <FaTimes size={24} />
          </button>
          <div className="text-white text-center">
            <h2 className="text-lg font-medium">Quét mã vạch</h2>
            <p className="text-sm opacity-75">
              Đã quét: {scannedBarcodes.length} mã vạch
            </p>
          </div>
          <button
            onClick={() => setShowList(!showList)}
            className="text-white z-[1000] px-3 py-1 bg-blue-600 rounded"
          >
            Danh sách
          </button>
        </div>
      </div>

      {showList && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-white rounded-lg p-4 max-h-[40vh] overflow-auto">
          <h3 className="font-medium mb-2">Danh sách mã đã quét:</h3>
          {scannedBarcodes.length > 0 ? (
            <ul className="space-y-2">
              {scannedBarcodes.map((code, index) => (
                <li key={code} className="flex justify-between items-center">
                  <span>{code}</span>
                  <span className="text-gray-500">#{index + 1}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có mã nào được quét</p>
          )}
        </div>
      )}

      <div ref={viewRef} className="scanner-container h-full" />

      <div className="absolute bottom-0 left-0 right-0 bg-black/50 z-[1000]">
        <div className="p-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-full font-medium"
            >
              Hủy quét
            </button>
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-full font-medium"
            >
              Hoàn thành
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 