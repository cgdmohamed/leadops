"use client";
import { useState } from 'react';
import Link from 'next/link';
import { resetPassword, acceptInvitation } from '@/lib/account-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AccountTokenForm({ purpose }: { purpose: 'reset' | 'invite' }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  return <main className="mx-auto max-w-md p-8 space-y-4">
    <h1 className="text-2xl font-bold">{purpose === 'reset' ? 'Reset password' : 'Accept workspace invitation'}</h1>
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); setPending(true);
      try {
        const token = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
        const result = purpose === 'reset' ? await resetPassword(token, password) : await acceptInvitation(token);
        setMessage(result.success ? 'Success. You can now open LeadOps.' : result.error ?? 'Request failed');
        if (result.success) window.history.replaceState(null, '', window.location.pathname);
      } catch { setMessage('Unable to connect. Please try again.'); }
      finally { setPending(false); }
    }}>
      {purpose === 'reset' && <><Label htmlFor="password">New password</Label><Input id="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} /></>}
      <Button disabled={pending}>{pending ? 'Please wait…' : 'Continue'}</Button>
    </form>
    <p role="status">{message}</p>
    <Link className="text-primary" href="/sign-in">Sign in / create account</Link>
    <Link className="block text-primary" href="/dashboard">Open LeadOps</Link>
  </main>;
}
