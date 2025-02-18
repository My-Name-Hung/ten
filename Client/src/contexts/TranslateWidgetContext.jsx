import React, { createContext, useContext, useState } from 'react';

const TranslateWidgetContext = createContext();

export function TranslateWidgetProvider({ children }) {
  const [isWidgetVisible, setIsWidgetVisible] = useState(true);

  return (
    <TranslateWidgetContext.Provider value={{ isWidgetVisible, setIsWidgetVisible }}>
      {children}
    </TranslateWidgetContext.Provider>
  );
}

export function useTranslateWidget() {
  return useContext(TranslateWidgetContext);
} 