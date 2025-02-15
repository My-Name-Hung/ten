import React, { useEffect } from 'react';
import './TranslateWidget.css';

const TranslateWidget = () => {
  useEffect(() => {
    // Cấu hình chính xác như yêu cầu
    window.gtranslateSettings = {
      "default_language": "vi",
      "native_language_names": true,
      "languages": ["vi", "en", "ko"],
      "globe_color": "#66aaff",
      "wrapper_selector": ".gtranslate_wrapper",
      "flag_size": 24,
      "horizontal_position": "right",
      "vertical_position": "top",
      "globe_size": 40
    };

    // Thêm GTranslate script
    const script = document.createElement('script');
    script.src = "https://cdn.gtranslate.net/widgets/latest/globe.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup khi component unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return <div className="gtranslate_wrapper"></div>;
};

export default TranslateWidget; 