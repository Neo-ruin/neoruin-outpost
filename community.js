/* NEORUINS Outpost — Community shared library
   Requires: supabase-js CDN + auth.js (ObserverAuth) loaded first.
   NOTE: never redeclare SUPABASE_URL / SUPABASE_KEY here (auth.js owns them).
*/
const GOLD = '#c9a227';

const AVATAR_BGS = {
  void:  '#0b0a08',
  ember: '#1a0e06',
  dusk:  '#0c0e1a',
  ash:   '#161310',
};

function drawSeal(x, kind, cx, cy, R) {
  x.strokeStyle = GOLD; x.lineWidth = Math.max(2, R * 0.045);
  if (kind === 'diamond') {
    for (const r of [R, R * 0.68, R * 0.38]) {
      x.beginPath();
      x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy);
      x.closePath(); x.stroke();
    }
    x.fillStyle = GOLD;
    x.beginPath(); x.arc(cx, cy, R * 0.09, 0, Math.PI * 2); x.fill();
  } else if (kind === 'rings') {
    for (const r of [R, R * 0.7, R * 0.42]) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke(); }
    x.beginPath(); x.moveTo(cx - R, cy); x.lineTo(cx + R, cy); x.stroke();
    x.beginPath(); x.moveTo(cx, cy - R); x.lineTo(cx, cy + R); x.stroke();
    x.fillStyle = GOLD;
    x.beginPath(); x.arc(cx, cy, R * 0.08, 0, Math.PI * 2); x.fill();
  } else { // bars
    const n = 5, gap = R * 2 / n;
    for (let i = 0; i < n; i++) {
      const bx = cx - R + i * gap + gap * 0.18, bw = gap * 0.64;
      const bh = (i % 2 === 0 ? R * 1.5 : R * 0.9);
      x.strokeRect(bx, cy - bh / 2, bw, bh);
    }
    x.beginPath(); x.arc(cx, cy, R * 0.09, 0, Math.PI * 2); x.fillStyle = GOLD; x.fill();
  }
}

/* Render a profile avatar deterministically from stored params. */
function renderAvatar(canvas, opts) {
  const o = Object.assign({ style: 'diamond', bg: 'void', label: '' }, opts || {});
  const x = canvas.getContext('2d');
  const S = canvas.width;
  x.fillStyle = AVATAR_BGS[o.bg] || AVATAR_BGS.void;
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(201,162,39,0.08)';
  x.lineWidth = Math.max(1, S * 0.004);
  for (let r = S * 0.14; r < S * 0.72; r += S * 0.11) {
    x.beginPath(); x.arc(S / 2, S / 2, r, 0, Math.PI * 2); x.stroke();
  }
  drawSeal(x, o.style, S / 2, S / 2 - S * 0.03, S * 0.26);
  if (o.label) {
    x.fillStyle = GOLD;
    x.font = '600 ' + Math.round(S * 0.062) + 'px ui-monospace, Menlo, monospace';
    x.textAlign = 'center';
    x.fillText(String(o.label).slice(0, 18).toUpperCase(), S / 2, S * 0.9);
  }
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const Community = {
  get client() { return ObserverAuth.client; },

  async myProfile() {
    if (!ObserverAuth.user) return null;
    const { data } = await ObserverAuth.client
      .from('community_profiles')
      .select('*')
      .eq('user_id', ObserverAuth.user.id)
      .maybeSingle();
    return data || null;
  },

  async saveProfile(patch) {
    if (!ObserverAuth.user) return { error: 'Not signed in.' };
    const clean = {
      user_id: ObserverAuth.user.id,
      display_name: String(patch.display_name || '').trim().slice(0, 30),
      bio: String(patch.bio || '').trim().slice(0, 280),
      avatar_style: ['diamond', 'rings', 'bars'].includes(patch.avatar_style) ? patch.avatar_style : 'diamond',
      avatar_bg: ['void', 'ember', 'dusk', 'ash'].includes(patch.avatar_bg) ? patch.avatar_bg : 'void',
      banner_style: ['gold', 'ember', 'dusk', 'signal'].includes(patch.banner_style) ? patch.banner_style : 'gold',
    };
    const { data, error } = await ObserverAuth.client
      .from('community_profiles')
      .upsert(clean, { onConflict: 'user_id' })
      .select()
      .single();
    return { data, error };
  },

  async card(userId) {
    const { data } = await ObserverAuth.client
      .from('community_cards')
      .select('user_id, codename, clearance')
      .eq('user_id', userId)
      .maybeSingle();
    return data || null;
  },

  async cardByCodename(codename) {
    const { data } = await ObserverAuth.client
      .from('community_cards')
      .select('user_id, codename, clearance')
      .eq('codename', String(codename).toUpperCase())
      .maybeSingle();
    return data || null;
  },

  async profileById(userId) {
    const { data } = await ObserverAuth.client
      .from('community_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data || null;
  },

  async directory(limit) {
    const { data } = await ObserverAuth.client
      .from('community_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit || 48);
    return data || [];
  },
};
