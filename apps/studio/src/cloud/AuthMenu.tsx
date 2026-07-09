import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  Input,
  Label,
  toast,
} from '@threadwick/core/ui';
import {
  SignInIcon, SignOutIcon, AccountIcon, PasskeyIcon, GoogleIcon, MailIcon,
} from '../icons';
import { cloudEnabled } from './config';
import {
  getSession, onAuthChange, signInWithOAuth, signInWithPasskey, createAccountWithPasskey,
  registerPasskey, addBackupEmail, sendMagicLink, signInWithPassword, signUpWithPassword,
  signOut, type Session, type OAuthProvider,
} from './auth';
import { takeOAuthError } from './oauthError';

// The sign-in / account control in the top bar. Renders nothing when cloud is
// disabled, so a build without Supabase env vars is exactly the local-only app.
export function AuthMenu() {
  if (!cloudEnabled) return null;
  return <AuthControl />;
}

type Step = 'choose' | 'backup';
type AuthForm = { email: string; password: string };

function AuthControl() {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>('choose');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [backup, setBackup] = useState('');
  const { register, handleSubmit, trigger, getValues, reset, formState: { errors } } = useForm<AuthForm>();

  useEffect(() => {
    let active = true;
    getSession().then((s) => { if (active) setSession(s); });
    const off = onAuthChange((s) => setSession(s));
    return () => { active = false; off(); };
  }, []);

  // Surface an OAuth error the provider/Supabase appended to the callback URL,
  // so a failed sign-in shows the real reason instead of silently signing out.
  useEffect(() => {
    const e = takeOAuthError();
    if (e) toast.error(`Sign-in failed: ${e}`);
  }, []);

  // Run an async action with a busy flag and uniform error surfacing.
  const run = async (label: string, fn: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    try { await fn(); return true; }
    catch (e) { toast.error(e instanceof Error && e.message ? e.message : `${label} failed`); return false; }
    finally { setBusy(false); }
  };

  const oauth = (provider: OAuthProvider, label: string) =>
    run(label, () => signInWithOAuth(provider)); // navigates away on success

  const passkeyIn = () => run('Passkey sign-in', async () => {
    await signInWithPasskey();
    setOpen(false);
    toast.success('Signed in.');
  });

  const passkeyCreate = async () => {
    const ok = await run('Create account', createAccountWithPasskey);
    if (ok) { setStep('backup'); toast.success('Passkey saved. Add a backup email so you never get locked out.'); }
  };

  const emailSubmit = handleSubmit((v) =>
    run(mode === 'in' ? 'Sign in' : 'Sign up', async () => {
      if (mode === 'in') { await signInWithPassword(v.email, v.password); setOpen(false); }
      else { await signUpWithPassword(v.email, v.password); setOpen(false); toast.success('Check your email to confirm your account.'); }
    }),
  );

  // Validate only the email — a magic link is the passwordless path, so the
  // password field must not gate it (handleSubmit would validate both).
  const magicLink = async () => {
    if (!(await trigger('email'))) return;
    await run('Magic link', async () => { await sendMagicLink(getValues('email')); toast.success('Sign-in link sent — check your email.'); });
  };

  const saveBackup = () => run('Save backup email', async () => {
    await addBackupEmail(backup.trim());
    setOpen(false); setStep('choose'); setBackup('');
    toast.success('Confirmation link sent — open it to finish adding your backup email.');
  });

  const enrollPasskey = () => run('Passkey setup', async () => {
    await registerPasskey();
    toast.success('Passkey saved — use it to sign in next time.');
  });

  // reset() so a reopened dialog never shows the previous attempt's values or errors.
  const openSignIn = () => { reset(); setStep('choose'); setMode('in'); setOpen(true); };
  const openBackup = () => { setStep('backup'); setOpen(true); };

  // ---- signed in -----------------------------------------------------------
  if (session) {
    const email = session.user.email;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline"><AccountIcon />{email ? 'Account' : 'Finish setup'}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{email ?? 'Passkey account'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!email && (
            <DropdownMenuItem onSelect={openBackup}><MailIcon /> Add backup email</DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => void enrollPasskey()}><PasskeyIcon /> Set up a passkey</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void run('Sign out', signOut)}><SignOutIcon /> Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ---- signed out ----------------------------------------------------------
  return (
    <>
      <Button variant="outline" onClick={openSignIn}><SignInIcon /> Sign in</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{step === 'backup' ? 'Add a backup email' : 'Sign in to threadwick'}</DialogTitle>
          </DialogHeader>
          {step === 'backup' ? (
            <div className="form-stack">
              <p className="text-sm text-muted-foreground">
                So you can still sign in with an email link if a passkey isn’t available on your device.
              </p>
              <div className="form-field">
                <Label htmlFor="backup-email">Email</Label>
                <Input
                  id="backup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={backup}
                  onChange={(e) => setBackup(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="flex gap-2">
                <Button disabled={!backup.trim() || busy} onClick={saveBackup}>Save backup email</Button>
                <Button variant="ghost" onClick={() => setOpen(false)}>Skip for now</Button>
              </div>
            </div>
          ) : (
            <div className="form-stack">
              <div className="flex flex-col gap-2">
                <Button disabled={busy} onClick={passkeyCreate}><PasskeyIcon /> Create an account with a passkey</Button>
                <Button variant="outline" disabled={busy} onClick={passkeyIn}><PasskeyIcon /> Sign in with a passkey</Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">or continue with</p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" disabled={busy} onClick={() => oauth('ravelry', 'Ravelry sign-in')}>Ravelry</Button>
                <Button variant="outline" disabled={busy} onClick={() => oauth('google', 'Google sign-in')}><GoogleIcon /> Google</Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">or use email</p>
              <form className="form-stack" onSubmit={emailSubmit}>
                <div className="form-field">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input id="auth-email" type="email" placeholder="you@example.com" autoComplete="email"
                    {...register('email', { required: 'Enter a valid email', pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' } })} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="form-field">
                  <Label htmlFor="auth-password">Password</Label>
                  <Input id="auth-password" type="password" placeholder="Password"
                    autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                    {...register('password', { required: 'At least 8 characters', minLength: { value: 8, message: 'At least 8 characters' } })} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</Button>
                  <Button type="button" variant="ghost" disabled={busy} onClick={magicLink}>Email me a link</Button>
                </div>
              </form>
              <div className="text-center">
                <Button type="button" variant="link" size="sm" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
                  {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
