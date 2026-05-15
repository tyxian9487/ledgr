import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ICON_OPTIONS, COLOR_OPTIONS } from '../types';
import { iconMap } from '../components/home/CategoryIcon';
import { PiggyBank } from 'lucide-react';

const DURATION_PRESETS = [
  { label: '1 Month',  months: 1 },
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '1 Year',   months: 12 },
];

function formatMonths(m: number) {
  if (m < 12) return `${m} month${m !== 1 ? 's' : ''}`;
  const yrs = Math.floor(m / 12);
  const rem = m % 12;
  return rem === 0
    ? `${yrs} year${yrs !== 1 ? 's' : ''}`
    : `${yrs} year${yrs !== 1 ? 's' : ''} ${rem} month${rem !== 1 ? 's' : ''}`;
}

export default function GoalFormPage() {
  const navigate = useNavigate();
  const { addCustomGoal, getCurrencySymbol, formatCurrency } = useApp();

  const [name, setName]               = useState('');
  const [icon, setIcon]               = useState(ICON_OPTIONS[0]);
  const [iconExpanded, setIconExpanded] = useState(false);
  const [color, setColor]             = useState(COLOR_OPTIONS[0]);
  const [targetAmount, setTargetAmount] = useState('');
  // preset index 0-3, or -1 = custom
  const [presetIdx, setPresetIdx]     = useState(0);
  const [customMonths, setCustomMonths] = useState(2);
  const [errors, setErrors]           = useState<{ name?: string; amount?: string; duration?: string }>({});

  const isCustom = presetIdx === -1;
  const durationMonths = isCustom ? customMonths : DURATION_PRESETS[presetIdx].months;
  const durationDays   = durationMonths * 30;

  const target    = parseFloat(targetAmount) || 0;
  const monthly   = durationMonths > 0 && target > 0 ? target / durationMonths : 0;

  const SelectedIcon = iconMap[icon] || PiggyBank;

  function adjustCustomMonths(delta: number) {
    setCustomMonths(prev => Math.max(1, Math.min(60, prev + delta)));
  }

  function validate(): boolean {
    const errs: { name?: string; amount?: string; duration?: string } = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!targetAmount || isNaN(target) || target <= 0) errs.amount = 'Enter a valid target amount';
    if (durationMonths <= 0) errs.duration = 'Select a duration';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    addCustomGoal({
      name: name.trim(),
      icon,
      color,
      targetAmount: target,
      savedAmount: 0,
      durationDays,
      startDate: new Date().toISOString(),
    });
    navigate('/budget');
  }

  return (
    <div className="flex flex-col bg-white dark:bg-gray-950" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 px-5 pt-12 pb-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => navigate('/budget')}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-lg font-bold dark:text-white">New Goal</h1>
          <p className="text-xs text-gray-400">Set a custom savings target</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-32 space-y-6" style={{ overscrollBehavior: 'contain' }}>

        {/* Name */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Goal Name</label>
          <input
            type="text"
            placeholder="e.g. New Laptop, Vacation, Emergency Fund"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-semibold dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 outline-none focus:border-green-500 transition-colors"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Icon picker — collapsed by default */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Icon</label>

          {/* Always-visible selected icon pill */}
          <button
            type="button"
            onClick={() => setIconExpanded(v => !v)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 w-full transition-colors hover:border-green-400"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
              <SelectedIcon size={18} style={{ color }} />
            </div>
            <span className="flex-1 text-left text-sm font-semibold dark:text-white">{icon}</span>
            {iconExpanded
              ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
              : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
          </button>

          {/* Expanded grid */}
          {iconExpanded && (
            <div className="mt-2 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="grid grid-cols-7 gap-1.5 max-h-52 overflow-y-auto">
                {ICON_OPTIONS.map(iconKey => {
                  const Icon = iconMap[iconKey] || PiggyBank;
                  const selected = icon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => { setIcon(iconKey); setIconExpanded(false); }}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                        selected ? 'ring-2 ring-green-500' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={selected ? { background: color + '20' } : undefined}
                    >
                      <Icon size={16} style={{ color: selected ? color : undefined }} className={selected ? '' : 'text-gray-500 dark:text-gray-400'} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Color picker */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* Target Amount */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Target Amount</label>
          <div className="flex items-center border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 bg-gray-50 dark:bg-gray-900 gap-2 focus-within:border-green-500 transition-colors">
            <span className="text-gray-400 font-semibold text-lg">{getCurrencySymbol()}</span>
            <input
              type="number"
              placeholder="e.g. 2000"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              className="flex-1 bg-transparent text-xl font-bold outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
              inputMode="decimal"
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Duration</label>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {DURATION_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPresetIdx(idx)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  presetIdx === idx
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPresetIdx(-1)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                presetIdx === -1
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom stepper — no keyboard needed */}
          {isCustom && (
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3">
              <button
                type="button"
                onClick={() => adjustCustomMonths(-1)}
                disabled={customMonths <= 1}
                className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"
              >
                <Minus size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-base font-bold dark:text-white">{formatMonths(customMonths)}</p>
                {monthly > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-0.5">
                    ~{formatCurrency(monthly)}/mo
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => adjustCustomMonths(1)}
                disabled={customMonths >= 60}
                className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"
              >
                <Plus size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}

          {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
        </div>

        {/* Preview / monthly breakdown */}
        {name.trim() && target > 0 && (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 pt-3 pb-2">Preview</p>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
                  <SelectedIcon size={16} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold dark:text-white truncate">{name}</p>
                  <p className="text-xs text-gray-400">{formatMonths(durationMonths)} total</p>
                </div>
              </div>

              {/* Progress bar always within bounds */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-semibold text-gray-500 dark:text-gray-400">{formatCurrency(0)} / {formatCurrency(target)}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '0%', background: color }} />
                </div>
              </div>

              {/* Monthly savings callout */}
              {monthly > 0 && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
                  <span className="text-lg">💡</span>
                  <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                    Save {formatCurrency(monthly)}/month to reach this goal in {formatMonths(durationMonths)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed footer CTA */}
      <div className="flex-shrink-0 px-5 pb-8 pt-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        {monthly > 0 && (
          <p className="text-center text-xs text-gray-400 mb-2">
            {formatCurrency(monthly)}/month will be reserved from your budget
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all"
        >
          Save Goal
        </button>
      </div>
    </div>
  );
}
