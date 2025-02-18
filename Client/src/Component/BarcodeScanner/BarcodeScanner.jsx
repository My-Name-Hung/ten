import React, { useEffect, useRef } from 'react';
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

const BarcodeScanner = ({ onDetected, onClose, storeId, eventId }) => {
  const viewRef = useRef(null);
  const contextRef = useRef(null);

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

        // Create settings
        const settings = new BarcodeBatchSettings();
        settings.enableSymbologies([
          Symbology.EAN13UPCA,
          Symbology.EAN8,
          Symbology.UPCE,
          Symbology.Code128,
          Symbology.Code39,
          Symbology.QR
        ]);

        // Create barcode batch mode
        const barcodeBatch = await BarcodeBatch.forContext(contextRef.current, settings);

        // Setup camera with recommended settings
        const camera = Camera.default;
        const cameraSettings = BarcodeBatch.recommendedCameraSettings;
        await camera.applySettings(cameraSettings);
        await contextRef.current.setFrameSource(camera);

        // Connect view to context
        await view.setContext(contextRef.current);

        // Create and customize overlay
        const overlay = await BarcodeBatchBasicOverlay.withBarcodeBatchForView(
          barcodeBatch,
          view
        );

        // Add overlay listener
        overlay.listener = {
          brushForTrackedBarcode: () => ({
            fillColor: Color.fromRGBA(0, 255, 0, 0.2),
            strokeColor: Color.fromRGBA(0, 255, 0, 1),
            strokeWidth: 2
          }),
          didTapTrackedBarcode: (_, trackedBarcode) => {
            if (trackedBarcode.barcode.data) {
              onDetected({
                barcode: trackedBarcode.barcode.data,
                storeId: storeId,
                eventId: eventId,
                timestamp: new Date().toISOString()
              });
            }
          }
        };

        // Add feedback listener
        const feedbackListener = {
          didUpdateSession: (_, session) => {
            if (session.addedTrackedBarcodes.length > 0) {
              // Play beep sound
              const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU");
              beep.play();
              
              // Send first barcode to callback
              const firstBarcode = session.addedTrackedBarcodes[0];
              if (firstBarcode.barcode.data) {
                onDetected({
                  barcode: firstBarcode.barcode.data,
                  storeId: storeId,
                  eventId: eventId,
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        };

        barcodeBatch.addListener(feedbackListener);

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
    };
  }, [onDetected, storeId, eventId]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
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
            <p className="text-sm opacity-75">Hướng camera vào mã vạch sản phẩm</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div 
        ref={viewRef}
        className="scanner-container h-full"
      />

      <div className="absolute bottom-0 left-0 right-0 bg-black/50">
        <div className="p-4">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-full font-medium"
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