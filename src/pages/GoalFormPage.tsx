import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ICON_OPTIONS, COLOR_OPTIONS } from '../types';
import { iconMap } from '../components/home/CategoryIcon';
import { PiggyBank } from 'lucide-react';

const DURATION_CHIPS = [
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
  { label: 'Custom', days: 0 },
];

export default function GoalFormPage() {
  const navigate = useNavigate();
  const { addCustomGoal, getCurrencySymbol } = useApp();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [targetAmount, setTargetAmount] = useState('');
  const [durationIdx, setDurationIdx] = useState(0);
  const [customEndDate, setCustomEndDate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; amount?: string; duration?: string }>({});

  const isCustom = DURATION_CHIPS[durationIdx].label === 'Custom';

  function getDurationDays(): number {
    if (!isCustom) return DURATION_CHIPS[durationIdx].days;
    if (!customEndDate) return 0;
    const end = new Date(customEndDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.round((end - now) / 86400000));
  }

  function validate(): boolean {
    const errs: { name?: string; amount?: string; duration?: string } = {};
    if (!name.trim()) errs.name = 'Name is required';
    const amt = parseFloat(targetAmount);
    if (!targetAmount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid target amount';
    const days = getDurationDays();
    if (days <= 0) {
      if (isCustom && !customEndDate) errs.duration = 'Select an end date';
      else if (isCustom) errs.duration = 'End date must be in the future';
      else errs.duration = 'Select a duration';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    addCustomGoal({
      name: name.trim(),
      icon,
      color,
      targetAmount: parseFloat(targetAmount),
      savedAmount: 0,
      durationDays: getDurationDays(),
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

        {/* Icon picker */}
        <div>
          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {ICON_OPTIONS.map(iconKey => {
              const Icon = iconMap[iconKey] || PiggyBank;
              const selected = icon === iconKey;
              return (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => setIcon(iconKey)}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                    selected
                      ? 'ring-2 ring-offset-1 ring-green-500'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                  style={selected ? { background: color + '20' } : undefined}
                >
                  <Icon size={18} style={{ color: selected ? color : undefined }} className={selected ? '' : 'text-gray-500 dark:text-gray-400'} />
                </button>
              );
            })}
          </div>
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
          <div className="flex flex-wrap gap-2">
            {DURATION_CHIPS.map((chip, idx) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setDurationIdx(idx)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  durationIdx === idx
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          {isCustom && (
            <div className="mt-3">
              <input
                type="date"
                value={customEndDate}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-semibold dark:text-white outline-none focus:border-green-500 transition-colors"
              />
            </div>
          )}
          {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
        </div>

        {/* Preview */}
        {name.trim() && parseFloat(targetAmount) > 0 && (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 pt-3 pb-2">Preview</p>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
                  {(() => {
                    const PreviewIcon = iconMap[icon] || PiggyBank;
                    return <PreviewIcon size={16} style={{ color }} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold dark:text-white truncate">{name}</p>
                  <p className="text-xs text-gray-400">
                    {getCurrencySymbol()}0 / {getCurrencySymbol()}{parseFloat(targetAmount).toLocaleString()} · {getDurationDays()}d total
                  </p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '0%', background: color }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed footer CTA */}
      <div className="flex-shrink-0 px-5 pb-8 pt-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
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
