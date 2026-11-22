'use client';

import { useT } from '@/components/i18n/locale-provider';
import { SignInForm } from '@/components/auth/sign-in-form';
import type { AuthSession } from '@/lib/auth';

type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Why sign-in is needed right now, e.g. "save", "ask", "monitor". */
  reason?: string;
  /** Where Google sends the reader back to (an app page); defaults to this page, else /ask. */
  returnTo?: string;
  /** Called after an in-page (email) sign-in, before the dialog closes. */
  onSignedIn?: (session: AuthSession) => void;
};

export default function LoginDialog({ open, onClose, reason, returnTo, onSignedIn }: LoginDialogProps) {
  const t = useT().login;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid min-h-screen place-items-center bg-black/60 px-4 text-left backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="login-title" className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-border bg-card text-foreground shadow-[0_30px_80px_rgba(0,128,255,0.2)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-muted p-2 text-muted-foreground transition hover:bg-primary-soft hover:text-foreground cursor-pointer"
          aria-label={t.close}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="space-y-6 px-8 py-9">
          <div className="space-y-3 text-center">
            <h2 id="login-title" className="text-3xl font-semibold text-foreground">{t.title}</h2>
            <p className="text-sm text-muted-foreground">{reason && t.reasons[reason] ? t.reasons[reason] : t.subtitle}</p>
          </div>

          <ul className="space-y-2 text-sm text-foreground">
            {t.benefits.map(feature => (
              <li key={feature} className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-xs text-success">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <SignInForm
            returnTo={returnTo}
            onSignedIn={session => {
              onSignedIn?.(session);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
