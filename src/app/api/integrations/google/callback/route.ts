import { db } from '@/lib/server/db';
import { readSession } from '@/lib/server/session';
import { consumeGoogleOAuthState } from '@/lib/server/oauth-state';
import { encryptJson } from '@/lib/server/secret-json';

const GOOGLE_OAUTH = 'https://oauth2.googleapis.com';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthState = await consumeGoogleOAuthState(state);
    if (!oauthState) throw new Error('Invalid OAuth state');

    const user = await readSession();
    if (!user) return Response.redirect(new URL('/sign-in', process.env.APP_URL ?? request.url).toString());
    if (user.role !== 'admin') return Response.redirect(new URL(oauthState.nextUrl, process.env.APP_URL ?? request.url).toString());

    if (!code) throw new Error('Missing authorization code');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('Google integration is not configured');

    const exchange = await fetch(`${GOOGLE_OAUTH}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: new URL('/api/integrations/google/callback', process.env.APP_URL ?? '').toString(),
        grant_type: 'authorization_code',
      }),
    });
    if (!exchange.ok) throw new Error('Failed to exchange authorization code');
    const tokens = await exchange.json();
    const refreshToken = tokens.refresh_token as string | undefined;
    if (!refreshToken) throw new Error('Google did not return a refresh token. The adwords scope grants offline access, but the account may not allow it.');

    // Resolve the first accessible customer id for the connected account
    let customerId: string | undefined;
    try {
      const customers = await fetch('https://googleads.googleapis.com/v16/customers:listAccessibleCustomers', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (customers.ok) {
        const data = await customers.json();
        const name = (data.resourceNames ?? [])[0] as string | undefined;
        if (name) customerId = name.replace(/^customers\//, '');
      }
    } catch { /* optional enhancement */ }

    await db().query(`INSERT INTO platform_connections(workspace_id,platform,display_name,status,credentials,account_id)
      VALUES($1,'google','Google Ads','connected',$2,$3)
      ON CONFLICT (workspace_id,platform) DO UPDATE SET credentials=EXCLUDED.credentials,status='connected',account_id=EXCLUDED.account_id,last_error=NULL,updated_at=now()`,
      [user.activeWorkspace, JSON.stringify(encryptJson({ refreshToken, customerId, accessToken: tokens.access_token })), customerId ?? null]);

    return Response.redirect(new URL(`${oauthState.nextUrl}?connected=google`, process.env.APP_URL ?? request.url).toString());
  } catch (error) {
    const message = (error as Error).message;
    const base = process.env.APP_URL ?? request.url;
    return Response.redirect(new URL(`/data-sync?error=${encodeURIComponent(message)}`, base).toString());
  }
}
