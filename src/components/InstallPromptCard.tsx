import { useEffect, useState } from 'react';

import { Button } from './Button';

/**
 * Chrome / Android fire the `beforeinstallprompt` event when the app meets
 * the install criteria.  We capture and stash it so we can show our own
 * custom install button instead of relying on the browser UI.
 *
 * iOS Safari never fires this event - users have to "Tap Share -> Add to
 * Home Screen" manually.  We detect iOS and surface those instructions
 * inline instead.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isiOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  // iPad Pro reports as Mac; check for touch to disambiguate.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Macintosh') && 'ontouchend' in document)
  );
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPromptCard(): JSX.Element | null {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const onBeforeInstall = (event: Event): void => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const ios = isiOS();
  const canPrompt = deferred !== null;

  // Nothing to show on desktop browsers that aren't iOS-flavoured and where
  // no beforeinstallprompt has fired yet.
  if (!canPrompt && !ios) return null;

  const handleInstall = async (): Promise<void> => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferred(null);
  };

  return (
    <section className="rounded-2xl bg-gradient-to-br from-brand-50 to-white p-4 shadow-card ring-1 ring-brand-100">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <rect x="4" y="17" width="16" height="4" rx="1.5" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">Install this app on your phone</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            Install this app on your phone for offline use.
          </p>
        </div>
      </div>

      {canPrompt ? (
        <div className="mt-3">
          <Button variant="primary" fullWidth onClick={handleInstall}>
            Install App
          </Button>
        </div>
      ) : null}

      {ios && !canPrompt ? (
        <div className="mt-3">
          <Button variant="secondary" fullWidth onClick={() => setShowIosHelp((s) => !s)}>
            {showIosHelp ? 'Hide instructions' : 'Show iPhone install steps'}
          </Button>
          {showIosHelp ? (
            <ol className="mt-3 space-y-2 rounded-xl bg-white p-3 text-sm text-slate-700">
              <li>
                <span className="font-semibold">1.</span> Tap the Share button in Safari
                (the square with an up-arrow).
              </li>
              <li>
                <span className="font-semibold">2.</span> Scroll down and tap{' '}
                <span className="font-semibold">Add to Home Screen</span>.
              </li>
              <li>
                <span className="font-semibold">3.</span> Tap <span className="font-semibold">Add</span>{' '}
                in the top-right corner.
              </li>
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
