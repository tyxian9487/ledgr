import React, { createContext, useContext, useState, useCallback } from 'react';
import SubscriptionSheet from '../components/SubscriptionSheet';
import { trackEvent } from '../utils/analytics';

interface PaywallContextType {
  showPaywall: () => void;
}

const PaywallContext = createContext<PaywallContextType>({ showPaywall: () => {} });

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const showPaywall = useCallback(() => {
    trackEvent('paywall_viewed');
    setVisible(true);
  }, []);
  return (
    <PaywallContext.Provider value={{ showPaywall }}>
      {children}
      {visible && <SubscriptionSheet onClose={() => setVisible(false)} />}
    </PaywallContext.Provider>
  );
}

export function usePaywall(): PaywallContextType {
  return useContext(PaywallContext);
}
