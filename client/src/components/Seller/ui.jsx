// Shared building blocks for the seller console so every page looks and feels the same.
import React from 'react';

export const ICONS = {
  home: 'M3 10.5L12 3l9 7.5M5 9v10.5a1.5 1.5 0 001.5 1.5H9.75v-6h4.5v6h3.25A1.5 1.5 0 0019 19.5V9',
  orders: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  truck: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h2m8 0h2m-2 0H9m10 0h1a1 1 0 001-1v-3.65a1 1 0 00-.22-.62l-3.48-4.35A1 1 0 0016.52 6H13M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  plus: 'M12 5v14m7-7H5',
  tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 18L18 6M6 6l12 12',
  money: 'M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.6 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.4-2.6-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  search: 'M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  check: 'M5 13l4 4L19 7',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  key: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  ban: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  pencil: 'M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 16.5 9 17.25l.75-3.5z',
  upload: 'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12',
  image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  chevronDown: 'M19 9l-7 7-7-7',
  chevronRight: 'M9 5l7 7-7 7',
  alert: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  printer: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4',
  spark: 'M13 10V3L4 14h7v7l9-11h-7z',
  layers: 'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5m-18 4l9 5 9-5',
  chart: 'M7 17V10m5 7V7m5 10v-4M4 21h16',
};

export const Icon = ({ name, d, className = 'w-5 h-5', strokeWidth = 1.8 }) => (
  <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={d || ICONS[name]} />
  </svg>
);

/* ---------- Layout ---------- */

export const Page = ({ children, max = 'max-w-[1400px]', className = '' }) => (
  <div className={`px-4 py-6 md:px-8 md:py-8 ${max} mx-auto space-y-6 ${className}`}>{children}</div>
);

export const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && <p className="text-xs font-semibold text-green-700 mb-1.5">{eyebrow}</p>}
      <h1 className="text-2xl md:text-[28px] font-semibold text-slate-900 tracking-tight leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card = ({ title, subtitle, action, children, className = '', bodyClass = '' }) => (
  <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
    {(title || action) && (
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </header>
    )}
    <div className={bodyClass}>{children}</div>
  </section>
);

/* ---------- Data display ---------- */

const TONES = {
  green: 'bg-green-50 text-green-700 ring-green-600/10',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/10',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/10',
  red: 'bg-red-50 text-red-700 ring-red-600/10',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/10',
  slate: 'bg-slate-100 text-slate-700 ring-slate-600/10',
};

export const StatCard = ({ label, value, hint, icon, tone = 'green', valueClass = 'text-slate-900', hintClass = 'text-slate-500' }) => (
  <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5">
    <div className="flex items-center justify-between gap-3">
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      {icon && (
        <span className={`w-9 h-9 rounded-xl ring-1 ring-inset flex items-center justify-center ${TONES[tone]}`}>
          <Icon name={icon} className="w-[18px] h-[18px]" />
        </span>
      )}
    </div>
    <p className={`text-[26px] font-semibold tracking-tight mt-2 leading-none tabular-nums ${valueClass}`}>{value}</p>
    {hint && <p className={`text-xs mt-2.5 truncate ${hintClass}`}>{hint}</p>}
  </div>
);

export const Badge = ({ tone = 'slate', children, dot, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}>
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

export const Avatar = ({ name = '', size = 'md', tone = 'green' }) => {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const sz = { sm: 'w-8 h-8 text-[11px]', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  const bg = {
    green: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white',
    slate: 'bg-slate-200 text-slate-600',
    red: 'bg-gradient-to-br from-red-400 to-red-500 text-white',
    violet: 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white',
  }[tone];
  return <span className={`${sz} ${bg} rounded-full font-semibold flex items-center justify-center shrink-0`}>{initials}</span>;
};

export const EmptyState = ({ icon = 'box', title, text, action }) => (
  <div className="flex flex-col items-center text-center px-6 py-14">
    <span className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
      <Icon name={icon} className="w-6 h-6" />
    </span>
    <p className="text-sm font-semibold text-slate-900">{title}</p>
    {text && <p className="text-sm text-slate-500 mt-1 max-w-sm">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Spinner = ({ className = 'h-[60vh]' }) => (
  <div className={`flex justify-center items-center ${className}`}>
    <div className="w-9 h-9 rounded-full border-[3px] border-green-100 border-t-green-600 animate-spin" />
  </div>
);

export const LivePill = ({ children }) => (
  <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <span className="relative flex w-2 h-2">
      <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping" />
      <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
    </span>
    {children}
  </span>
);

/* ---------- Controls ---------- */

const BTN_VARIANTS = {
  primary: 'bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-600/20',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20',
  'danger-soft': 'bg-red-50 text-red-700 hover:bg-red-100',
  warning: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-500/20',
  soft: 'bg-green-50 text-green-700 hover:bg-green-100',
};
const BTN_SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-xl',
};

export const Button = ({ variant = 'primary', size = 'md', icon, iconClass = 'w-4 h-4', loading, children, className = '', ...props }) => (
  <button
    {...props}
    disabled={props.disabled || loading}
    className={`inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500/20 ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
  >
    {loading ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon && <Icon name={icon} className={iconClass} strokeWidth={2} />}
    {children}
  </button>
);

export const inputCls =
  'w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/10';

export const Field = ({ label, hint, htmlFor, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">{label}</label>}
    {children}
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
);

export const SearchInput = ({ className = '', ...props }) => (
  <div className={`relative ${className}`}>
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Icon name="search" className="w-4 h-4" strokeWidth={2} /></span>
    <input type="text" {...props} className={`${inputCls} pl-9`} />
  </div>
);

export const Segmented = ({ options, value, onChange }) => (
  <div className="w-full overflow-x-auto no-scrollbar">
    <div className="inline-flex min-w-max gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {o.label ?? o.key}
            {o.count > 0 && (
              <span className={`min-w-5 px-1.5 rounded-md text-[11px] font-semibold tabular-nums ${active ? 'bg-green-600 text-white' : 'bg-slate-200/80 text-slate-600'}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
