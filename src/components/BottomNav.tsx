import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  Icon: React.ComponentType<{ active: boolean }>;
  /** Routes that should mark this item as active in addition to `to`. */
  match?: (pathname: string) => boolean;
}

const ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    Icon: DashboardIcon,
    match: (p) => p === '/' || p === '/categories',
  },
  {
    to: '/stocks',
    label: 'Stocks',
    Icon: StocksIcon,
    match: (p) => p.startsWith('/stocks') || p === '/create' || p.startsWith('/stock/'),
  },
];

/**
 * Sticky bottom tab bar with the two primary destinations.  Lives inside
 * the centred 430px column so it stays aligned with the app shell on
 * tablet / desktop.
 */
export function BottomNav(): JSX.Element {
  return (
    <nav
      aria-label="Main navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-app border-t border-slate-200 bg-white/95 px-2 backdrop-blur safe-pb">
        <ul className="flex">
          {ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium transition-colors',
                    isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <item.Icon active={isActive} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function DashboardIcon({ active }: { active: boolean }): JSX.Element {
  const stroke = active ? '#1d4ed8' : '#64748b';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function StocksIcon({ active }: { active: boolean }): JSX.Element {
  const stroke = active ? '#1d4ed8' : '#64748b';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M9 7h6M9 12h6M9 17h4" />
    </svg>
  );
}
