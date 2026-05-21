# Translation Issues in Mobile Codebase

This document identifies all hardcoded text strings in the mobile app that should be using translation keys instead.

---

## 1. Category Labels in Budget Groups (CRITICAL)

**File:** [mobile/app/(tabs)/budget.tsx](mobile/app/(tabs)/budget.tsx)

**Lines:** 53-62 (BUDGET_GROUPS array definition)

**Issue:** All category labels are hardcoded English strings in the `label` property:

```typescript
const BUDGET_GROUPS: BudgetGroup[] = [
  { label: 'Housing & Rent',  color: '#14b8a6', categoryId: 'housing',       Icon: Home },
  { label: 'Food & Dining',   color: '#f97316', categoryId: 'food',          Icon: UtensilsCrossed },
  { label: 'Transportation',  color: '#3b82f6', categoryId: 'transport',     Icon: Car },
  { label: 'Health & Medical',color: '#ef4444', categoryId: 'health',        Icon: Heart },
  { label: 'Utilities',       color: '#eab308', categoryId: 'utilities',     Icon: Zap },
  { label: 'Entertainment',   color: '#8b5cf6', categoryId: 'entertainment', Icon: Tv },
  { label: 'Shopping',        color: '#ec4899', categoryId: 'shopping',      Icon: ShoppingBag },
  { label: 'Subscriptions',   color: '#64748b', categoryId: 'subscriptions', Icon: RefreshCw },
  { label: 'Personal Care',   color: '#a855f7', categoryId: 'personal',      Icon: Sparkles },
  { label: 'Others',          color: '#94a3b8', categoryId: 'others',        Icon: MoreHorizontal },
];
```

**Where it's rendered:**
- Line 608: `{categoryLabel(t, alloc.categoryId, alloc.label)}` - falls back to hardcoded label as second argument
- Line 694: `{a.label}` - displays hardcoded label directly without any translation

**Affected Categories:**
- `Housing & Rent` (housing)
- `Food & Dining` (food)
- `Transportation` (transport)
- `Health & Medical` (health)
- `Utilities` (utilities)
- `Entertainment` (entertainment)
- `Shopping` (shopping)
- `Subscriptions` (subscriptions)
- `Personal Care` (personal)
- `Others` (others)

---

## 2. Hardcoded Financial Tips Descriptions

**File:** [mobile/utils/achievements.ts](mobile/utils/achievements.ts)

**Lines:** 199-220 (TIPS array definition)

**Issue:** All tip titles and descriptions are hardcoded English strings. They should be stored as translation keys instead.

The TIPS array contains hardcoded `title` and `body` for 15 different financial tips across three categories:

### Critical Tips (Lines 200-204)
```typescript
{ id: 'c0', tag: 'critical', title: 'Track every purchase for 7 days', body: 'Awareness is the first step to change. For one week, log every single purchase — coffee, snacks, rides. Most people are surprised by what they find once it\'s written down.' },
{ id: 'c1', tag: 'critical', title: 'The 24-hour rule', body: 'Before any non-essential purchase over a small threshold, wait 24 hours. Most impulse urges fade on their own. This one habit can cut unplanned spending by up to 20%.' },
{ id: 'c2', tag: 'critical', title: 'Find one subscription to cancel', body: 'Check your bank statement for recurring charges. Cancel the service you use least — you\'ll rarely notice it\'s gone, but you will notice the money staying in your account.' },
{ id: 'c3', tag: 'critical', title: 'Cook 3 more meals at home this week', body: 'Food is often the largest discretionary expense. Home-cooked meals typically cost 60–70% less than eating out. Start with just 3 extra home meals this week.' },
{ id: 'c4', tag: 'critical', title: 'Set a weekly spending limit', body: 'At the start of each week, decide the maximum you\'ll spend on "wants." Treat it as a hard cap, not a suggestion. Use Kachingo\'s categories to track against it daily.' },
```

### Fair Tips (Lines 206-210)
```typescript
{ id: 'f0', tag: 'fair', title: 'Build a 1-month emergency fund first', body: 'Before thinking about investing, save 1 full month of expenses in a separate account you won\'t touch. This safety net stops one bad week from spiralling into debt.' },
{ id: 'f1', tag: 'fair', title: 'Automate savings on payday', body: '"Pay yourself first" removes willpower from the equation — set up an automatic transfer to savings the moment you\'re paid. The money is gone before you can spend it.' },
{ id: 'f2', tag: 'fair', title: 'Try the 50 / 30 / 20 rule', body: '50% of take-home pay to needs, 30% to wants, 20% to savings and debt. If your wants slice is crowding out savings, that\'s your target to trim.' },
{ id: 'f3', tag: 'fair', title: 'Negotiate one regular bill', body: 'Phone, internet, and insurance providers routinely offer better rates to customers who ask. A 10-minute call can cut a bill by 15–20% — often just by mentioning a competitor\'s price.' },
{ id: 'f4', tag: 'fair', title: 'Review your top spending category', body: 'Open the Trends page and find your biggest expense category this month. Ask: what\'s one specific change that would reduce it by 10%? Small, targeted cuts beat vague intentions.' },
```

### Excellent Tips (Lines 212-220)
```typescript
{ id: 'e0', tag: 'excellent', title: 'Grow your emergency fund to 6 months', body: 'You\'re doing great. The next resilience milestone is 6 months of living expenses in an accessible, low-risk account. This protects you through job loss or a major unexpected cost.' },
{ id: 'e1', tag: 'excellent', title: 'Put your surplus to work', body: 'Money sitting idle in a current account loses real value to inflation every year. Low-cost index funds or ETFs have historically grown wealth significantly over 10+ year horizons.' },
{ id: 'e2', tag: 'excellent', title: 'Maximise tax-advantaged accounts', body: 'Retirement accounts, ISAs, 401(k)s, CPFs — these accounts offer tax benefits that compound dramatically over decades. Max them out before investing in taxable accounts.' },
{ id: 'e3', tag: 'excellent', title: 'Review your insurance annually', body: 'As your wealth grows, your coverage needs change. Over-insuring wastes money; under-insuring hides risk. Schedule a 30-minute insurance review every year.' },
{ id: 'e4', tag: 'excellent', title: 'Make "Future Me" a monthly ritual', body: 'Each month, log one transaction labelled "Future Me" — an extra loan payment, an index fund top-up, or a savings boost. Naming it makes it feel real and keeps momentum going.' },
```

**Where it's rendered:**
- [mobile/app/achievements.tsx](mobile/app/achievements.tsx) Line 139: `{t(`tip.${tip.id}.title` as any)}` - expects translation key
- [mobile/app/achievements.tsx](mobile/app/achievements.tsx) Line 141: `{t(`tip.${tip.id}.body` as any)}` - expects translation key

**Status:** The rendering code correctly uses translation keys, but the TIPS array still contains hardcoded English strings instead of defining the strings in the translation files.

---

## 3. Properly Translated Strings (No Issues)

The following strings are already correctly using translation keys:

### Budget Button Text
- **File:** [mobile/app/(tabs)/budget.tsx](mobile/app/(tabs)/budget.tsx) Line 445
- **Code:** `{t('budget.analyze')}`
- **Translation Key:** `'budget.analyze': 'Analyze Budget'`
- **Status:** ✅ Correct

### "See Progress" Button
- **File:** [mobile/app/(tabs)/budget.tsx](mobile/app/(tabs)/budget.tsx) Line 403
- **Code:** `{t('budget.see_progress')}`
- **Translation Key:** `'budget.see_progress': 'See progress →'`
- **Status:** ✅ Correct

### Budget Status ("On Track")
- **File:** [mobile/app/(tabs)/index.tsx](mobile/app/(tabs)/index.tsx) Line 239
- **Code:** `{t('home.on_track')}`
- **Translation Key:** `'home.on_track': 'On Track'` (in translations.ts)
- **Status:** ✅ Correct

### Percentage Used Text
- **File:** [mobile/app/(tabs)/index.tsx](mobile/app/(tabs)/index.tsx) Line 243
- **Code:** `{budgetUsedPct.toFixed(0)}{t('home.pct_used')}`
- **Translation Key:** `'home.pct_used': '% used'`
- **Status:** ✅ Correct (though the format could be improved with a template)

---

## Summary

**Total Critical Issues:** 2

1. **BUDGET_GROUPS Category Labels** - 10 hardcoded category names that should use translation keys
2. **TIPS Financial Tips** - 15 hardcoded tip descriptions (titles and bodies) that should use translation keys

**Items to Fix:**
- [ ] Replace hardcoded labels in BUDGET_GROUPS with translation key references
- [ ] Move TIPS content to translation files and reference via keys
- [ ] Ensure all 10 category name translations exist in all language files
- [ ] Ensure all 15 tip translations exist for title and body in all language files

