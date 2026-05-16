import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  type CustomerInfoUpdateListener,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

// ── Constants ─────────────────────────────────────────────────────────────────

const RC_API_KEY = 'test_jdNazyDihlTksmhfYXGXAjslWhl';

export const PRO_ENTITLEMENT_ID = 'Kachingo Pro';

// Product identifiers matching offerings on the RevenueCat dashboard
export const OFFERING_MONTHLY = 'monthly';
export const OFFERING_YEARLY = 'yearly';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PurchasesContextType {
  isConfigured: boolean;
  isPro: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  presentCustomerCenter: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const PurchasesContext = createContext<PurchasesContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const listenerRef = useRef<CustomerInfoUpdateListener | null>(null);

  const isPro = !!customerInfo?.entitlements.active[PRO_ENTITLEMENT_ID];

  useEffect(() => {
    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        Purchases.configure({ apiKey: RC_API_KEY });
        setIsConfigured(true);

        const [info, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);

        setCustomerInfo(info);

        if (offerings.current) {
          setCurrentOffering(offerings.current);
        }

        // Real-time entitlement updates pushed from the store
        listenerRef.current = (updatedInfo: CustomerInfo) => {
          setCustomerInfo(updatedInfo);
        };
        Purchases.addCustomerInfoUpdateListener(listenerRef.current);
      } catch (e) {
        console.warn('[RevenueCat] init error:', e);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    return () => {
      if (listenerRef.current) {
        Purchases.removeCustomerInfoUpdateListener(listenerRef.current);
      }
    };
  }, []);

  // Returns true if the purchase granted the Pro entitlement
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    const { customerInfo: info } = await Purchases.purchasePackage(pkg);
    setCustomerInfo(info);
    return !!info.entitlements.active[PRO_ENTITLEMENT_ID];
  }, []);

  // Returns true if restored purchases include Pro entitlement
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    const info = await Purchases.restorePurchases();
    setCustomerInfo(info);
    return !!info.entitlements.active[PRO_ENTITLEMENT_ID];
  }, []);

  const presentPaywall = useCallback((): Promise<PAYWALL_RESULT> => {
    return RevenueCatUI.presentPaywall(
      currentOffering ? { offering: currentOffering } : undefined,
    );
  }, [currentOffering]);

  // Presents the paywall only if the user does not have the Pro entitlement
  const presentPaywallIfNeeded = useCallback((): Promise<PAYWALL_RESULT> => {
    return RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
      ...(currentOffering ? { offering: currentOffering } : {}),
    });
  }, [currentOffering]);

  const presentCustomerCenter = useCallback((): Promise<void> => {
    return RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo: info }) => setCustomerInfo(info),
        onRestoreFailed: ({ error }) =>
          console.warn('[RevenueCat] Customer Center restore failed:', error),
      },
    });
  }, []);

  const refreshCustomerInfo = useCallback(async (): Promise<void> => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (e) {
      console.warn('[RevenueCat] refresh error:', e);
    }
  }, []);

  return (
    <PurchasesContext.Provider
      value={{
        isConfigured,
        isPro,
        isLoading,
        customerInfo,
        currentOffering,
        purchasePackage,
        restorePurchases,
        presentPaywall,
        presentPaywallIfNeeded,
        presentCustomerCenter,
        refreshCustomerInfo,
      }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePurchases(): PurchasesContextType {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used inside PurchasesProvider');
  return ctx;
}

// ── Error helpers ─────────────────────────────────────────────────────────────

export function isUserCancelledError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}
