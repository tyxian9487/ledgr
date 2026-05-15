import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';
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
    : `${yrs}y ${rem}m`;
}

export default function GoalFormPage() {
  const navigate = useNavigate();
  const { addCustomGoal, getCurrencySymbol, formatCurrency } = useApp();

  const [name, setName]                 = useState('');
  const [icon, setIcon]                 = useState(ICON_OPTIONS[0]);
  const [iconExpanded, setIconExpanded] = useState(false);
  const [color, setColor]               = useState(COLOR_OPTIONS[9]); // green default
  const [targetAmount, setTargetAmount] = useState('');
  const [presetIdx, setPresetIdx]       = useState<number | null>(null); // null = nothing chosen yet
  const [customMonths, setCustomMonths] = useState(2);

  const isCustom      = presetIdx === -1;
  const durationMonths = presetIdx === null ? 0 : isCustom ? customMonths : DURATION_PRESETS[presetIdx].months;
  const durationDays   = durationMonths * 30;

  const target   = parseFloat(targetAmount) || 0;
  const monthly  = durationMonths > 0 && target > 0 ? target / durationMonths : 0;

  const isValid  = name.trim().length > 0 && target > 0 && durationMonths > 0;

  const SelectedIcon = iconMap[icon] || PiggyBank;

  function adjustCustomMonths(delta: number) {
    setCustomMonths(prev => Math.max(1, Math.min(60, prev + delta)));
  }

  function handleSave() {
    if (!isValid) return;
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

      {/* All content scrolls — save button lives inside scroll area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-10 space-y-6"
        style={{ overscrollBehavior: 'contain' }}
      >

        {/* Goal name */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
            Goal Name
          </label>
          <input
            type="text"
            placeholder="e.g. New Laptop, Vacation, Emergency Fund"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-semibold dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Icon picker — collapsed pill → expandable grid */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
            Icon
          </label>

          {/* Collapsed trigger */}
          <button
            type="button"
            onClick={() => setIconExpanded(v => !v)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors active:bg-gray-100"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: color + '25' }}
            >
              <SelectedIcon size={18} style={{ color }} />
            </div>
            <span className="flex-1 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
              {iconExpanded ? 'Tap an icon to select' : 'Tap to change icon'}
            </span>
            {iconExpanded
              ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
              : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
          </button>

          {/* Expanded icon grid */}
          {iconExpanded && (
            <div className="mt-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
              <div className="grid grid-cols-8 gap-1">
                {ICON_OPTIONS.map(iconKey => {
                  const Icon = iconMap[iconKey] || PiggyBank;
                  const selected = icon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => { setIcon(iconKey); setIconExpanded(false); }}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                        selected
                          ? 'ring-2 ring-green-500'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={selected ? { background: color + '25' } : undefined}
                    >
                      <Icon
                        size={18}
                        style={{ color: selected ? color : undefined }}
                        className={selected ? '' : 'text-gray-500 dark:text-gray-400'}
                        strokeWidth={1.75}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Color picker */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all active:scale-90 ${
                  color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* Target amount */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
            Target Amount
          </label>
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
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
            Duration
          </label>
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

          {/* Custom month stepper */}
          {isCustom && (
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3">
              <button
                type="button"
                onClick={() => adjustCustomMonths(-1)}
                disabled={customMonths <= 1}
                className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-30 transition-all active:scale-90 shadow-sm"
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
                className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-30 transition-all active:scale-90 shadow-sm"
              >
                <Plus size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
        </div>

        {/* Preview — only when enough info is filled */}
        {name.trim() && target > 0 && durationMonths > 0 && (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 pt-3 pb-2">
              Preview
            </p>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '25' }}
                >
                  <SelectedIcon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold dark:text-white truncate">{name}</p>
                  <p className="text-xs text-gray-400">{formatMonths(durationMonths)} · {formatCurrency(target)} goal</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">0%</span>
                  <span className="text-gray-400">{formatCurrency(0)} / {formatCurrency(target)}</span>
                </div>
                {/* Progress bar — constrained to 100% */}
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-0 rounded-full" style={{ background: color }} />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2.5">
                <span className="text-base">💡</span>
                <p className="text-xs text-green-700 dark:text-green-400 font-semibold leading-snug">
                  Save {formatCurrency(monthly)}/month to reach this goal in {formatMonths(durationMonths)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save button — grey when incomplete, green when ready */}
        <div className="pt-2 pb-4">
          {!isValid && (
            <p className="text-center text-xs text-gray-400 mb-2">
              {!name.trim() ? 'Enter a goal name' : !target ? 'Enter a target amount' : 'Choose a duration'}
            </p>
          )}
          {isValid && monthly > 0 && (
            <p className="text-center text-xs text-gray-400 mb-2">
              {formatCurrency(monthly)}/month will be reserved from your budget
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
              isValid
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 active:scale-[0.98]'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Goal
          </button>
        </div>

      </div>
    </div>
  );
}
