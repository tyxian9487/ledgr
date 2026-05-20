import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfoUpdateListener,
} from 'react-native-purchases';
import type { PAYWALL_RESULT } from 'react-native-purchases-ui';

// ── Safe lazy load — react-native-purchases lacks codegenConfig and may crash
// on New Architecture Android. require() inside try-catch prevents a fatal
// startup crash; the app degrades gracefully (isPro = false, all purchase
// calls are no-ops) instead of exiting to the home screen.
let _Purchases: any = null;
let _RevenueCatUI: any = null;
let _LOG_LEVEL: any = {};
let _PURCHASES_ERROR_CODE: any = {};
let _PAYWALL_RESULT_VALUES: typeof PAYWALL_RESULT = {} as any;

try {
  const m = require('react-native-purchases');
  _Purchases = m.default ?? m.Purchases ?? m;
  _LOG_LEVEL = m.LOG_LEVEL ?? {};
  _PURCHASES_ERROR_CODE = m.PURCHASES_ERROR_CODE ?? {};
} catch (e) {
  console.warn('[RevenueCat] react-native-purchases failed to load:', e);
}

try {
  const m = require('react-native-purchases-ui');
  _RevenueCatUI = m.default ?? m;
  _PAYWALL_RESULT_VALUES = m.PAYWALL_RESULT ?? ({} as any);
} catch (e) {
  console.warn('[RevenueCat] react-native-purchases-ui failed to load:', e);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '';

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
        if (!_Purchases) {
          console.warn('[RevenueCat] SDK not available — purchases disabled');
          return;
        }
        if (!RC_API_KEY) {
          console.warn('[RevenueCat] No API key — purchases disabled');
          return;
        }

        // RevenueCat force-closes the app when a test key is used in a
        // release build. Skip init so the app stays open during testing.
        if (!__DEV__ && RC_API_KEY.startsWith('test_')) {
          console.warn('[RevenueCat] Test key in release build — skipping init');
          return;
        }

        if (__DEV__) {
          _Purchases.setLogLevel(_LOG_LEVEL.DEBUG);
        }

        _Purchases.configure({ apiKey: RC_API_KEY });
        setIsConfigured(true);

        const [info, offerings] = await Promise.all([
          _Purchases.getCustomerInfo(),
          _Purchases.getOfferings(),
        ]);

        setCustomerInfo(info);

        if (offerings.current) {
          setCurrentOffering(offerings.current);
        }

        // Real-time entitlement updates pushed from the store
        listenerRef.current = (updatedInfo: CustomerInfo) => {
          setCustomerInfo(updatedInfo);
        };
        _Purchases.addCustomerInfoUpdateListener(listenerRef.current);
      } catch (e) {
        console.warn('[RevenueCat] init error:', e);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    return () => {
      if (listenerRef.current && _Purchases) {
        _Purchases.removeCustomerInfoUpdateListener(listenerRef.current);
      }
    };
  }, []);

  // Returns true if the purchase granted the Pro entitlement
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!_Purchases) return false;
    const { customerInfo: info } = await _Purchases.purchasePackage(pkg);
    setCustomerInfo(info);
    return !!info.entitlements.active[PRO_ENTITLEMENT_ID];
  }, []);

  // Returns true if restored purchases include Pro entitlement
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!_Purchases) return false;
    const info = await _Purchases.restorePurchases();
    setCustomerInfo(info);
    return !!info.entitlements.active[PRO_ENTITLEMENT_ID];
  }, []);

  const presentPaywall = useCallback((): Promise<PAYWALL_RESULT> => {
    if (!_RevenueCatUI) return Promise.resolve(_PAYWALL_RESULT_VALUES.CANCELLED ?? ('CANCELLED' as any));
    return _RevenueCatUI.presentPaywall(
      currentOffering ? { offering: currentOffering } : undefined,
    );
  }, [currentOffering]);

  // Presents the paywall only if the user does not have the Pro entitlement
  const presentPaywallIfNeeded = useCallback((): Promise<PAYWALL_RESULT> => {
    if (!_RevenueCatUI) return Promise.resolve(_PAYWALL_RESULT_VALUES.NOT_PRESENTED ?? ('NOT_PRESENTED' as any));
    return _RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
      ...(currentOffering ? { offering: currentOffering } : {}),
    });
  }, [currentOffering]);

  const presentCustomerCenter = useCallback((): Promise<void> => {
    if (!_RevenueCatUI) return Promise.resolve();
    return _RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo: info }: { customerInfo: CustomerInfo }) => setCustomerInfo(info),
        onRestoreFailed: ({ error }: { error: unknown }) =>
          console.warn('[RevenueCat] Customer Center restore failed:', error),
      },
    });
  }, []);

  const refreshCustomerInfo = useCallback(async (): Promise<void> => {
    try {
      if (!_Purchases) return;
      const info = await _Purchases.getCustomerInfo();
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
  const cancelCode = _PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ?? 1;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === cancelCode
  );
}
