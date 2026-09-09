import { Pool } from 'pg';
import { randomBytes, scrypt, randomInt } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = (await derive(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(arr.length)];
}

function uuid(): string {
  return randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

const PLATFORMS = ['meta', 'google', 'tiktok', 'snapchat'] as const;
const LEAD_STATUSES = ['new', 'contacted', 'qualified'] as const;
const OPP_STAGES = ['prospecting', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const;
const CAMPAIGN_STATUSES = ['active', 'paused', 'ended'] as const;
const NAMES = ['Alex Johnson','Maria Garcia','Wei Zhang','Priya Patel','James Wilson','Sara Ahmed','Tom Brown','Lisa Kim','David Lee','Emma Davis','Chris Martin','Ana Rodriguez','Mike Chen','Sarah Wilson','John Smith'];
const COMPANIES = ['Acme Corp','TechStart Inc','Global Solutions','NextGen Labs','Horizon Media','Vertex AI','Silverline','Brightpath','Skyline Digital','Pinnacle Co'];
const SOURCES = ['Meta Lead Ad','Google Search','TikTok Ad','Snapchat Ad','Website Form','Landing Page','Referral','Event'];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pw = await hashPassword('password123456');

    // Users
    const users = await Promise.all([
      client.query('INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id', ['sarah@leadops.io','Sarah Chen',pw]),
      client.query('INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id', ['james@leadops.io','James Rivera',pw]),
      client.query('INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id', ['mike@leadops.io','Mike Johnson',pw]),
    ]);

    const [sarah, james, mike] = users.map(r => r.rows[0].id);

    // Workspaces
    const ws1 = await client.query("INSERT INTO workspaces(name,currency,timezone) VALUES('LeadOps HQ','USD','America/New_York') RETURNING id");
    const ws2 = await client.query("INSERT INTO workspaces(name,currency,timezone) VALUES('EU Branch','EUR','Europe/London') RETURNING id");
    const ws3 = await client.query("INSERT INTO workspaces(name,currency,timezone) VALUES('APAC','SGD','Asia/Singapore') RETURNING id");
    const [w1, w2, w3] = [ws1.rows[0].id, ws2.rows[0].id, ws3.rows[0].id];

    // Memberships
    await client.query('INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,\'admin\')',[w1,sarah]);
    await client.query('INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,\'agent\')',[w1,james]);
    await client.query('INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,\'admin\')',[w2,sarah]);
    await client.query('INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,\'agent\')',[w3,mike]);

    // Set Sarah's session to ws-1
    await client.query('UPDATE sessions SET workspace_id=$1 WHERE user_id=$2', [w1, sarah]);

    // Campaigns
    const campaignIds: string[] = [];
    const campaignNames = ['Summer Sale 2026','Q3 Brand Awareness','Product Launch Meta','Google Search - High Intent','TikTok Gen Z Push','Snapchat Stories Q3','Retargeting Campaign','Holiday Preview','Lead Magnet Webinar','Referral Program','LinkedIn Thought Leader','Instagram Reels Push','YouTube Pre-Roll','Display Network Q3','Affiliate Partners','Email Nurture Sequence'];
    for (let i = 0; i < 16; i++) {
      const cid = uuid();
      campaignIds.push(cid);
      const platform = PLATFORMS[i % 4];
      const status = CAMPAIGN_STATUSES[i % 3];
      const spend = 2000 + randomInt(18000);
      const impressions = 50000 + randomInt(200000);
      const clicks = Math.round(impressions * (0.01 + Math.random() * 0.04));
      const leads = Math.round(clicks * (0.02 + Math.random() * 0.08));
      const costPerLead = leads > 0 ? spend / leads : 0;
      const wonRevenue = leads > 0 ? leads * (0.3 + Math.random() * 0.7) * 200 : 0;
      await client.query(`INSERT INTO records(id,workspace_id,kind,owner_id,data)
        VALUES($1,$2,'campaigns',$3,$4)`, [
        cid, w1, sarah,
        JSON.stringify({
          name: campaignNames[i],
          platform,
          status,
          spend,
          impressions,
          clicks,
          leads,
          costPerLead: Math.round(costPerLead * 100) / 100,
          wonRevenue: Math.round(wonRevenue),
          startDate: `2026-0${1 + (i % 8)}-0${1 + (i % 28) % 9}`,
        })
      ]);
    }

    // Leads
    const leadIds: string[] = [];
    const owners = [sarah, james];
    for (let i = 0; i < 100; i++) {
      const lid = uuid();
      leadIds.push(lid);
      const owner = pick(owners);
      const campaignId = pick(campaignIds);
      const platform = pick([...PLATFORMS]);
      const status = pick([...LEAD_STATUSES]);
      const name = pick(NAMES);
      const email = `${name.toLowerCase().replace(/\s/g,'.')}+${i}@example.com`;
      const company = pick(COMPANIES);
      const source = pick(SOURCES);
      const daysAgo = randomInt(90);
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

      await client.query(`INSERT INTO records(id,workspace_id,kind,owner_id,data)
        VALUES($1,$2,'leads',$3,$4)`, [
        lid, w1, owner,
        JSON.stringify({
          name,
          email,
          phone: `+1555${String(1000 + randomInt(9000))}`,
          company,
          platform,
          campaignId,
          status,
          source,
          createdAt,
          updatedAt: createdAt,
        })
      ]);

      // Activity for some leads
      if (i % 3 === 0) {
        await client.query(`INSERT INTO records(workspace_id,kind,owner_id,data)
          VALUES($1,'notes',$2,$3)`, [
          w1, owner,
          JSON.stringify({
            leadId: lid,
            content: pick(['Initial outreach sent','Follow-up call completed','Meeting scheduled','Demo requested','Proposal sent','Contract reviewed','Interested in upgrade','Needs budget approval']),
          })
        ]);
      }
    }

    // Opportunities from qualified leads
    const qualifiedLeads = leadIds.filter(() => Math.random() > 0.5);
    for (const lid of qualifiedLeads.slice(0, 25)) {
      const stage = pick([...OPP_STAGES]);
      const value = 5000 + randomInt(50000);
      const probability = stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : 10 + randomInt(80);
      const owner = pick(owners);
      const campaignId = pick(campaignIds);
      const daysAgo = randomInt(60);
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

      await client.query(`INSERT INTO records(id,workspace_id,kind,owner_id,data)
        VALUES($1,$2,'opportunities',$3,$4)`, [
        uuid(), w1, owner,
        JSON.stringify({
          name: `Opportunity: ${pick(NAMES)} - ${pick(COMPANIES)}`,
          leadId: lid,
          campaignId,
          platform: pick([...PLATFORMS]),
          stage,
          value,
          probability,
          expectedCloseDate: new Date(Date.now() + randomInt(90) * 86400000).toISOString().split('T')[0],
          lostReason: stage === 'closed_lost' ? pick(['Budget constraints','Went with competitor','Timeline changed','No response','Not a good fit']) : undefined,
          createdAt,
          updatedAt: createdAt,
        })
      ]);
    }

    // Goals
    await client.query(`INSERT INTO records(workspace_id,kind,owner_id,data)
      VALUES($1,'goals',$2,$3)`, [
      w1, sarah,
      JSON.stringify({ name: 'Q3 Lead Target', metric: 'leads', target: 200, dueDate: '2026-09-30' })
    ]);
    await client.query(`INSERT INTO records(workspace_id,kind,owner_id,data)
      VALUES($1,'goals',$2,$3)`, [
      w1, sarah,
      JSON.stringify({ name: 'Q3 Revenue Target', metric: 'revenue', target: 500000, dueDate: '2026-09-30' })
    ]);

    // Assignment Rules
    await client.query(`INSERT INTO records(workspace_id,kind,owner_id,data)
      VALUES($1,'assignment-rules',$2,$3)`, [
      w1, sarah,
      JSON.stringify({ name: 'Round Robin', enabled: true, strategy: 'round-robin', memberIds: [sarah, james] })
    ]);

    // Audit trail
    await client.query('INSERT INTO audit_events(workspace_id,actor_id,action) VALUES($1,$2,\'seed.completed\')', [w1, sarah]);

    await client.query('COMMIT');
    console.log('Seed completed: 3 users, 3 workspaces, 16 campaigns, 100 leads, 25 opportunities, goals, assignment rules');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
