/* ═══════════════════════════════════════════════════
   ZenAI — app.js
   ═══════════════════════════════════════════════════ */

// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
const S = {
  projects: [], currentProject: null, currentPage: null,
  versions: {}, recent: [],
  // AI
  provider: 'gemini', model: 'gemini-2.0-flash', apiKeys: {},
  persona: 'helpful', lang: 'auto',
  // Appearance
  fontSize: 16, lineHeight: 1.9, editorWidth: 720,
  editorFont: 'jetbrains', paraSpacing: 0.4,
  // Sound
  soundProfile: 'mechanical', soundEnabled: false,
  // Typing
  autoPairs: true, smartQuotes: true, emDash: true,
  continueLists: true, typewriter: false, spellcheck: false,
  // Cursor
  caretShape: 'beam', caretWidth: 2, blinkSpeed: 1.05,
  // Prompts
  customPrompts: [
    { id:'p1', label:'Summarize', prompt:'Summarize in concise bullet points.' },
    { id:'p2', label:'Grammar',   prompt:'Fix grammar and spelling. Return corrected text.' },
    { id:'p3', label:'Expand',    prompt:'Expand key ideas with more detail and examples.' },
    { id:'p4', label:'Simplify',  prompt:'Rewrite in simpler, clearer language.' },
  ],
  collapsed: new Set(),
};

// ══════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════
const FONTS = {
  jetbrains:  { l:'JetBrains Mono', f:"'JetBrains Mono',monospace",  t:'mono'  },
  geistmono:  { l:'Geist Mono',     f:"'Geist Mono',monospace",       t:'mono'  },
  fragmono:   { l:'Fragment Mono',  f:"'Fragment Mono',monospace",    t:'mono'  },
  ibmplex:    { l:'IBM Plex Mono',  f:"'IBM Plex Mono',monospace",    t:'mono'  },
  firacode:   { l:'Fira Code',      f:"'Fira Code',monospace",        t:'mono'  },
  crimson:    { l:'Crimson Pro',    f:"'Crimson Pro',Georgia,serif",  t:'serif' },
  lora:       { l:'Lora',           f:"'Lora',Georgia,serif",         t:'serif' },
  dmsans:     { l:'DM Sans',        f:"'DM Sans',sans-serif",         t:'sans'  },
};

const PROV = {
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-2.0-flash','gemini-2.0-flash-lite','gemini-1.5-pro','gemini-1.5-flash'],
    info: 'Free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--acc)">AI Studio</a>. Very generous free tier.',
    ph: 'AIza…',
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-3.5-turbo'],
    info: 'Key at <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--acc)">OpenAI Platform</a>. Requires credits.',
    ph: 'sk-…',
  },
  claude: {
    name: 'Claude',
    models: ['claude-sonnet-4-5','claude-haiku-4-5','claude-3-5-haiku-20241022'],
    info: 'Key at <a href="https://console.anthropic.com" target="_blank" style="color:var(--acc)">Anthropic Console</a>.',
    ph: 'sk-ant-…',
  },
};

const SHORTCUTS_LIST = [
  ['Ctrl+K','Command palette'],
  ['Ctrl+F','Find & replace'],
  ['Ctrl+S','Save'],
  ['Ctrl+B','Bold'],
  ['Ctrl+I','Italic'],
  ['Ctrl+U','Underline'],
  ['Ctrl+Shift+T','Toggle toolbar'],
  ['Ctrl+Shift+A','Toggle AI sidebar'],
  ['Ctrl+Shift+F','Focus mode'],
  ['Ctrl+E','Explain selection'],
  ['Ctrl+D','Duplicate line'],
  ['Alt+↑ / Alt+↓','Move line up/down'],
  ['Ctrl+Enter','New paragraph below'],
  ['Ctrl+Home','Scroll to top'],
  ['Ctrl+Shift+V','Paste plain text'],
  ['Ctrl+Shift+K','Insert link'],
  ['Ctrl+/','Shortcuts reference'],
  ['/ at line start','Slash command menu'],
  ['# + Space','Heading 1'],
  ['## + Space','Heading 2'],
  ['### + Space','Heading 3'],
  ['> + Space','Blockquote'],
  ['- + Space','Bullet list'],
  ['1. + Space','Numbered list'],
  ['--- + Space','Divider'],
  ['Double-click','Rename file/folder'],
  ['Escape','Exit focus / close palette'],
];

const TEMPLATES = [
  { id:'blank',      name:'Blank',        icon:'file',           desc:'Empty document', html:'' },
  { id:'cornell',    name:'Cornell Notes', icon:'grid-3x3',       desc:'Structured note-taking',
    html:`<h2>Cornell Notes</h2><hr><div style="display:grid;grid-template-columns:1fr 3fr;gap:16px;margin-top:1rem"><div style="border:1px solid #2a2d36;border-radius:8px;padding:12px;min-height:250px"><p style="color:#555963;font-size:.75em;font-weight:700;margin-bottom:8px;text-transform:uppercase">CUES / QUESTIONS</p><p>​</p></div><div style="border:1px solid #2a2d36;border-radius:8px;padding:12px;min-height:250px"><p style="color:#555963;font-size:.75em;font-weight:700;margin-bottom:8px;text-transform:uppercase">NOTES</p><p>​</p></div></div><div style="border:1px solid #2a2d36;border-radius:8px;padding:12px;margin-top:1rem"><p style="color:#555963;font-size:.75em;font-weight:700;margin-bottom:8px;text-transform:uppercase">SUMMARY</p><p>​</p></div>` },
  { id:'essay',      name:'Essay',         icon:'align-left',     desc:'Essay outline',
    html:`<h1>Essay Title</h1><h2>Introduction</h2><ul><li>Hook</li><li>Background</li><li>Thesis</li></ul><h2>Body Paragraph 1</h2><ul><li>Topic sentence</li><li>Evidence</li><li>Analysis</li></ul><h2>Body Paragraph 2</h2><ul><li>Topic sentence</li><li>Evidence</li><li>Analysis</li></ul><h2>Conclusion</h2><ul><li>Restate thesis</li><li>Summarize</li><li>Closing thought</li></ul>` },
  { id:'meeting',    name:'Meeting Notes', icon:'users',           desc:'Agenda & actions',
    html:`<h2>Meeting Notes</h2><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><p><strong>Attendees:</strong> </p><hr><h3>Agenda</h3><ul><li>​</li></ul><h3>Discussion</h3><p>​</p><h3>Action Items</h3><ul><li>[ ] Person — task (due)</li></ul>` },
  { id:'studyguide', name:'Study Guide',   icon:'book-open',      desc:'Chapter reference',
    html:`<h1>Study Guide</h1><p><strong>Subject:</strong> </p><hr><h2>Key Concepts</h2><ul><li>​</li></ul><h2>Definitions</h2><table><thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody><tr><td>​</td><td>​</td></tr></tbody></table><h2>Summary</h2><p>​</p><h2>Practice Questions</h2><ol><li>​</li></ol>` },
  { id:'lab',        name:'Lab Report',    icon:'flask-conical',   desc:'Science report',
    html:`<h1>Lab Report</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><hr><h2>Objective</h2><p>​</p><h2>Hypothesis</h2><p>​</p><h2>Materials</h2><ul><li>​</li></ul><h2>Procedure</h2><ol><li>​</li></ol><h2>Observations</h2><p>​</p><h2>Conclusion</h2><p>​</p>` },
  { id:'review',     name:'Review',        icon:'star',            desc:'Book/article review',
    html:`<h1>Review</h1><p><strong>Title:</strong> </p><p><strong>Author:</strong> </p><p><strong>Rating:</strong> ⭐⭐⭐⭐⭐</p><hr><h2>Summary</h2><p>​</p><h2>Key Themes</h2><ul><li>​</li></ul><h2>My Take</h2><p>​</p>` },
];

const SLASH_COMMANDS = [
  { key:'h1',    icon:'H1',   label:'Heading 1',     hint:'Large',   action:()=>fmt('formatBlock','h1') },
  { key:'h2',    icon:'H2',   label:'Heading 2',     hint:'Section', action:()=>fmt('formatBlock','h2') },
  { key:'h3',    icon:'H3',   label:'Heading 3',     hint:'Sub',     action:()=>fmt('formatBlock','h3') },
  { key:'ul',    icon:'•',    label:'Bullet list',   hint:'List',    action:()=>fmt('insertUnorderedList') },
  { key:'ol',    icon:'1.',   label:'Numbered list', hint:'Ordered', action:()=>fmt('insertOrderedList') },
  { key:'quote', icon:'❝',   label:'Blockquote',    hint:'Quote',   action:()=>fmt('formatBlock','blockquote') },
  { key:'code',  icon:'</>',  label:'Code block',    hint:'Mono',    action:()=>fmt('insertHTML','<pre><code>​</code></pre><p>​</p>') },
  { key:'table', icon:'⊞',   label:'Table',         hint:'3×2',     action:()=>insertTable() },
  { key:'hr',    icon:'—',    label:'Divider',       hint:'Rule',    action:()=>insertHR() },
  { key:'date',  icon:'📅',  label:'Date',          hint:'Today',   action:()=>fmt('insertHTML', new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})) },
  { key:'time',  icon:'⏰',  label:'Time',          hint:'Now',     action:()=>fmt('insertHTML', new Date().toLocaleTimeString()) },
  { key:'img',   icon:'🖼',  label:'Image',         hint:'URL',     action:()=>insertImage() },
];

const COMMANDS_LIST = [
  { l:'New Document',       ico:'file-text',      cat:'Create',     a:()=>newPage(null) },
  { l:'New Folder',         ico:'folder',          cat:'Create',     a:()=>newFolder() },
  { l:'From Template',      ico:'layout-template', cat:'Create',     a:()=>openTemplates() },
  { l:'Focus: Zen',         ico:'moon',            cat:'Focus',      a:()=>enterFocus('zen'),       sc:'Ctrl+Shift+F' },
  { l:'Focus: Sepia',       ico:'sun',             cat:'Focus',      a:()=>enterFocus('sepia') },
  { l:'Focus: Midnight',    ico:'sparkles',        cat:'Focus',      a:()=>enterFocus('midnight') },
  { l:'Focus: Forest',      ico:'tree-pine',       cat:'Focus',      a:()=>enterFocus('forest') },
  { l:'Focus: Paper',       ico:'book-open',       cat:'Focus',      a:()=>enterFocus('paper') },
  { l:'Find & Replace',     ico:'search',          cat:'Edit',       a:()=>openFindModal(),         sc:'Ctrl+F' },
  { l:'Duplicate Line',     ico:'copy',            cat:'Edit',       a:()=>duplicateLine(),         sc:'Ctrl+D' },
  { l:'AI Summary',         ico:'zap',             cat:'AI',         a:()=>insertSummary() },
  { l:'Flashcards',         ico:'layers',          cat:'AI',         a:()=>generateFlashcards() },
  { l:'Quiz',               ico:'circle-help',     cat:'AI',         a:()=>generateQuiz() },
  { l:'Toggle Toolbar',     ico:'type',            cat:'View',       a:()=>toggleToolbar(),         sc:'Ctrl+Shift+T' },
  { l:'Toggle AI',          ico:'sparkles',        cat:'View',       a:()=>toggleAI(),              sc:'Ctrl+Shift+A' },
  { l:'Toggle Sidebar',     ico:'panel-left',      cat:'View',       a:()=>toggleSidebar() },
  { l:'Version History',    ico:'history',         cat:'File',       a:()=>openVersions() },
  { l:'Export TXT',         ico:'download',        cat:'File',       a:()=>exportDoc('txt') },
  { l:'Export HTML',        ico:'download',        cat:'File',       a:()=>exportDoc('html') },
  { l:'Export Markdown',    ico:'download',        cat:'File',       a:()=>exportDoc('md') },
  { l:'Global Search',      ico:'search',          cat:'Navigation', a:()=>openGS() },
  { l:'Settings',           ico:'settings',        cat:'App',        a:()=>openSettings() },
  { l:'Configure AI',       ico:'key',             cat:'App',        a:()=>openApiModal() },
  { l:'Go Home',            ico:'home',            cat:'Navigation', a:()=>goHome() },
];

// DOM refs
const ed  = document.getElementById('ed');
const fed = document.getElementById('fed');

// ══════════════════════════════════════════
//  SOUND ENGINE
// ══════════════════════════════════════════
const SFX = {
  ctx: null, volume: 0.6, pitchVar: true, specialEnter: true,
  get enabled() { return S.soundEnabled; },

  _init()  { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return this.ctx; },
  async _ensure() {
    const c = this._init();
    if (c.state === 'suspended') { try { await c.resume(); } catch(e) {} }
    return c;
  },

  async play(key = 'x') {
    if (!this.enabled) return;
    const ctx = await this._ensure();
    if (!ctx || ctx.state !== 'running') return;
    const isEnter = key === 'Enter';
    const isBack  = key === 'Backspace' || key === 'Delete';
    const p = this.pitchVar ? (0.88 + Math.random() * 0.24) : 1;
    switch (S.soundProfile) {
      case 'mechanical': this._mechanical(ctx, isEnter, isBack, p); break;
      case 'soft':       this._soft(ctx, isEnter, isBack, p);       break;
      case 'typewriter': this._typewriter(ctx, isEnter, isBack, p); break;
      case 'bubble':     this._bubble(ctx, isEnter, p);             break;
      case 'thock':      this._thock(ctx, isEnter, isBack, p);      break;
    }
  },

  _noise(ctx, dur, fc, Q, decay, vol, when = 0) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(Math.max(0, 1 - i/len), decay);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp  = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fc; bp.Q.value = Q;
    const g   = ctx.createGain();
    const wt  = ctx.currentTime + when;
    g.gain.setValueAtTime(this.volume * vol, wt);
    g.gain.exponentialRampToValueAtTime(0.0001, wt + dur + 0.02);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(wt); src.stop(wt + dur + 0.05);
  },

  _osc(ctx, freq, type, dur, vol, startFreq = 0, when = 0) {
    const osc = ctx.createOscillator(); osc.type = type;
    const wt  = ctx.currentTime + when;
    if (startFreq) { osc.frequency.setValueAtTime(startFreq, wt); osc.frequency.exponentialRampToValueAtTime(freq, wt + dur); }
    else osc.frequency.setValueAtTime(freq, wt);
    const g = ctx.createGain();
    g.gain.setValueAtTime(this.volume * vol, wt);
    g.gain.exponentialRampToValueAtTime(0.0001, wt + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(wt); osc.stop(wt + dur + 0.01);
  },

  _mechanical(ctx, isEnter, isBack, p) {
    const dur = isEnter ? .024 : isBack ? .012 : .013;
    const fc  = isEnter ? 2200*p : isBack ? 2800*p : 3400*p;
    const dec = isEnter ? 4 : isBack ? 7 : 8;
    const vol = isEnter ? .18 : isBack ? .1 : .12;
    this._noise(ctx, dur, fc, 2.5, dec, vol);
    if (this.specialEnter && isEnter) this._noise(ctx, .008, 1400, 1.5, 6, .06, .014);
    else this._noise(ctx, .006, fc * 0.7, 1.8, 10, vol * .4, dur * .6);
  },
  _soft(ctx, isEnter, isBack, p) {
    const dur = isEnter ? .018 : .009;
    const fc  = isEnter ? 1200*p : isBack ? 1600*p : 2000*p;
    this._noise(ctx, dur, fc, 2, isEnter ? 5 : 8, isEnter ? .1 : .065);
  },
  _typewriter(ctx, isEnter, isBack, p) {
    if (isEnter && this.specialEnter) {
      this._osc(ctx, 880*p, 'triangle', .1, .12, 1200*p);
      this._noise(ctx, .045, 600, 1.5, 3, .14, .03);
    } else {
      this._noise(ctx, .018, 2000*p, 2, 5, .15);
      this._noise(ctx, .01, 700*p, 1.2, 8, .06, .012);
    }
  },
  _bubble(ctx, isEnter, p) {
    const sf = isEnter ? 560*p : 700*p + Math.random()*200;
    this._osc(ctx, sf * 0.45, 'sine', isEnter ? .12 : .09, isEnter ? .1 : .07, sf);
  },
  _thock(ctx, isEnter, isBack, p) {
    const fc = isEnter ? 900*p : isBack ? 1100*p : 1200*p;
    this._noise(ctx, .022, fc, 3.5, 4, isEnter ? .17 : .13);
    this._osc(ctx, fc * .3, 'triangle', .018, .04, fc * .5, .002);
  },
};

// Bootstrap AudioContext on first interaction
let _sfxBootstrapped = false;
function bootstrapSFX() {
  if (_sfxBootstrapped) return;
  _sfxBootstrapped = true;
  SFX._ensure().catch(() => {});
}
document.addEventListener('keydown', bootstrapSFX, { once: true });
document.addEventListener('click',   bootstrapSFX, { once: true });

// ══════════════════════════════════════════
//  CUSTOM CARET
// ══════════════════════════════════════════
const CARET = {
  el: document.getElementById('zen-caret'),
  smooth: true, glow: true, _raf: null,

  update() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) { this.el.style.display = 'none'; return; }

    // ONLY show caret when focused inside the main editor or focus-mode editor
    const ae = document.activeElement;
    if (ae?.id !== 'ed' && ae?.id !== 'fed') { this.el.style.display = 'none'; return; }

    const range = sel.getRangeAt(0);
    let rect = range.getBoundingClientRect();

    // Empty line — measure via a temporary zero-width span
    if (!rect.height) {
      const sp = document.createElement('span'); sp.innerHTML = '\u200b';
      try {
        const r2 = range.cloneRange(); r2.collapse(true); r2.insertNode(sp);
        rect = sp.getBoundingClientRect();
        sp.parentNode?.removeChild(sp);
        sel.removeAllRanges(); sel.addRange(range);
      } catch(e) { this.el.style.display = 'none'; return; }
    }
    if (!rect.height || rect.top < 0) { this.el.style.display = 'none'; return; }

    this.el.style.display = 'block';
    this.el.style.transition = this.smooth
      ? 'top 0.05s cubic-bezier(0.2,0,0,1), left 0.05s cubic-bezier(0.2,0,0,1)'
      : 'none';
    this.el.style.top  = rect.top  + 'px';
    this.el.style.left = rect.left + 'px';

    const sh = S.caretShape;
    if (sh === 'underline') {
      this.el.style.height = '2px';
      this.el.style.width  = (rect.width > 2 ? rect.width : 8) + 'px';
      this.el.style.top    = (rect.bottom - 2) + 'px';
    } else if (sh === 'block') {
      this.el.style.height = rect.height + 'px';
      this.el.style.width  = Math.max(rect.width, 9) + 'px';
    } else {
      this.el.style.height = rect.height + 'px';
      this.el.style.width  = S.caretWidth + 'px';
    }
  },

  pulse() {
    this.el.classList.remove('typing');
    void this.el.offsetWidth;
    this.el.classList.add('typing');
  },

  applyStyle() {
    this.el.style.background       = 'var(--acc)';
    this.el.style.boxShadow        = this.glow ? '0 0 6px color-mix(in srgb, var(--acc) 55%, transparent)' : 'none';
    this.el.style.animationDuration = S.blinkSpeed + 's';
    document.documentElement.style.setProperty('--ecw', S.caretWidth + 'px');
  },
};

document.addEventListener('selectionchange', () => {
  cancelAnimationFrame(CARET._raf);
  CARET._raf = requestAnimationFrame(() => CARET.update());
});

// Strictly hide caret when focus leaves the writing areas
document.addEventListener('focusin', e => {
  if (e.target.id !== 'ed' && e.target.id !== 'fed') {
    CARET.hide();
  } else {
    // Returning to editor — re-run update on next frame
    cancelAnimationFrame(CARET._raf);
    CARET._raf = requestAnimationFrame(() => CARET.update());
  }
});
document.addEventListener('focusout', e => {
  if (e.target.id === 'ed' || e.target.id === 'fed') {
    CARET.hide();
  }
});

// ══════════════════════════════════════════
//  PERSISTENCE
// ══════════════════════════════════════════
function loadState() {
  try {
    S.projects       = JSON.parse(localStorage.getItem('z_projects')  || '[]');
    S.customPrompts  = JSON.parse(localStorage.getItem('z_prompts')   || 'null') || S.customPrompts;
    S.provider       = localStorage.getItem('z_provider')  || 'gemini';
    S.model          = localStorage.getItem('z_model')     || 'gemini-2.0-flash';
    S.apiKeys        = JSON.parse(localStorage.getItem('z_keys')      || '{}');
    S.persona        = localStorage.getItem('z_persona')   || 'helpful';
    S.lang           = localStorage.getItem('z_lang')      || 'auto';
    S.soundEnabled   = JSON.parse(localStorage.getItem('z_snd')       || 'false');
    S.soundProfile   = localStorage.getItem('z_sndp')      || 'mechanical';
    SFX.volume       = parseFloat(localStorage.getItem('z_vol')       || '0.6');
    SFX.pitchVar     = JSON.parse(localStorage.getItem('z_pv')        || 'true');
    SFX.specialEnter = JSON.parse(localStorage.getItem('z_se')        || 'true');
    S.typewriter     = JSON.parse(localStorage.getItem('z_tw')        || 'false');
    S.spellcheck     = JSON.parse(localStorage.getItem('z_spell')     || 'false');
    S.autoPairs      = JSON.parse(localStorage.getItem('z_pairs')     || 'true');
    S.smartQuotes    = JSON.parse(localStorage.getItem('z_sq')        || 'true');
    S.emDash         = JSON.parse(localStorage.getItem('z_em')        || 'true');
    S.continueLists  = JSON.parse(localStorage.getItem('z_cl')        || 'true');
    S.collapsed      = new Set(JSON.parse(localStorage.getItem('z_col')     || '[]'));
    S.recent         = JSON.parse(localStorage.getItem('z_recent')    || '[]');
    S.versions       = JSON.parse(localStorage.getItem('z_ver')       || '{}');
    S.fontSize       = parseInt(localStorage.getItem('z_fs')          || '16');
    S.lineHeight     = parseFloat(localStorage.getItem('z_lh')        || '1.9');
    S.editorWidth    = parseInt(localStorage.getItem('z_ew')          || '720');
    S.editorFont     = localStorage.getItem('z_ef')     || 'jetbrains';
    S.paraSpacing    = parseFloat(localStorage.getItem('z_ps')        || '0.4');
    S.caretShape     = localStorage.getItem('z_cs')     || 'beam';
    S.caretWidth     = parseInt(localStorage.getItem('z_cw')          || '2');
    S.blinkSpeed     = parseFloat(localStorage.getItem('z_bs')        || '1.05');
    CARET.smooth     = JSON.parse(localStorage.getItem('z_csm')       || 'true');
    CARET.glow       = JSON.parse(localStorage.getItem('z_cgl')       || 'true');
  } catch(e) { console.warn('loadState error:', e); }
}

function persistAll() {
  savePage();
  const kv = {
    z_projects: JSON.stringify(S.projects),    z_prompts: JSON.stringify(S.customPrompts),
    z_provider: S.provider,                    z_model:   S.model,
    z_keys:     JSON.stringify(S.apiKeys),     z_persona: S.persona,
    z_lang:     S.lang,                        z_snd:     S.soundEnabled,
    z_sndp:     S.soundProfile,               z_vol:     SFX.volume,
    z_pv:       SFX.pitchVar,                 z_se:      SFX.specialEnter,
    z_tw:       S.typewriter,                 z_spell:   S.spellcheck,
    z_pairs:    S.autoPairs,                  z_sq:      S.smartQuotes,
    z_em:       S.emDash,                     z_cl:      S.continueLists,
    z_col:      JSON.stringify([...S.collapsed]),
    z_recent:   JSON.stringify(S.recent.slice(0, 20)),
    z_ver:      JSON.stringify(S.versions),
    z_fs:       S.fontSize,                   z_lh:      S.lineHeight,
    z_ew:       S.editorWidth,                z_ef:      S.editorFont,
    z_ps:       S.paraSpacing,                z_cs:      S.caretShape,
    z_cw:       S.caretWidth,                 z_bs:      S.blinkSpeed,
    z_csm:      CARET.smooth,                 z_cgl:     CARET.glow,
  };
  Object.entries(kv).forEach(([k, v]) => localStorage.setItem(k, v));
}

function savePage() {
  if (!S.currentProject || !S.currentPage) return;
  const proj = S.projects.find(p => p.id === S.currentProject);
  const page = proj?.items.find(i => i.id === S.currentPage);
  if (page) { page.content = ed.innerHTML; proj.updated = Date.now(); }
}

function flashSave() {
  ['asd', 'asd-side'].forEach(id => {
    const d = document.getElementById(id);
    if (!d) return;
    d.style.background  = 'var(--acc)';
    d.style.boxShadow   = '0 0 5px color-mix(in srgb, var(--acc) 50%, transparent)';
    setTimeout(() => { d.style.background = 'var(--br2)'; d.style.boxShadow = 'none'; }, 1100);
  });
}

// ══════════════════════════════════════════
//  APPEARANCE
// ══════════════════════════════════════════
function applyAppearance() {
  const f = FONTS[S.editorFont] || FONTS.jetbrains;
  const r = document.documentElement;
  r.style.setProperty('--ef',  f.f);
  r.style.setProperty('--es',  S.fontSize + 'px');
  r.style.setProperty('--elh', S.lineHeight);
  r.style.setProperty('--ew',  S.editorWidth + 'px');
  r.style.setProperty('--ep',  S.paraSpacing + 'em');
  CARET.applyStyle();
}

function pvFS(v) { document.getElementById('fs-val').textContent = v + 'px'; document.documentElement.style.setProperty('--es', v + 'px'); }
function pvLH(v) { document.getElementById('lh-val').textContent = parseFloat(v).toFixed(2); document.documentElement.style.setProperty('--elh', v); }
function pvEW(v) { document.getElementById('ew-val').textContent = v + 'px'; document.documentElement.style.setProperty('--ew', v + 'px'); }
function pvPG(v) {
  const ls = ['min','compact','normal','relaxed','airy'];
  document.getElementById('pg-val').textContent = ls[Math.min(Math.floor(v / 0.45), 4)];
  document.documentElement.style.setProperty('--ep', v + 'em');
}
function pvCW(v) { document.getElementById('cw-val').textContent = v + 'px'; S.caretWidth = +v; CARET.applyStyle(); }
function pvBS(v) { document.getElementById('bs-val').textContent = parseFloat(v).toFixed(2) + 's'; CARET.el.style.animationDuration = v + 's'; }

function buildFontCards() {
  const c = document.getElementById('fontcards'); c.innerHTML = '';
  Object.entries(FONTS).forEach(([k, f]) => {
    const on = S.editorFont === k;
    const btn = document.createElement('button');
    btn.className = 'fcard' + (on ? ' on' : '');
    btn.innerHTML = `<span style="display:block;font-size:.6rem;color:var(--tx3);margin-bottom:3px;font-family:'DM Sans',sans-serif;text-transform:uppercase;letter-spacing:.06em">${f.t}</span><span style="font-family:${f.f};font-size:.85rem;color:${on ? 'var(--acc)' : 'var(--tx)'}">${f.l}</span>`;
    btn.onclick = () => { S.editorFont = k; document.documentElement.style.setProperty('--ef', f.f); buildFontCards(); };
    c.appendChild(btn);
  });
}

function buildSoundCards() {
  const profiles = [
    { k:'mechanical', label:'Mechanical', desc:'Cherry MX style click'       },
    { k:'thock',      label:'Thock',      desc:'Linear with foam mod'         },
    { k:'soft',       label:'Soft',       desc:'Rubber dome, quiet'           },
    { k:'typewriter', label:'Typewriter', desc:'Vintage with carriage bell'   },
    { k:'bubble',     label:'Bubble',     desc:'Smooth oscillator pops'       },
    { k:'none',       label:'Silent',     desc:'No sounds'                    },
  ];
  const c = document.getElementById('snd-cards'); c.innerHTML = '';
  profiles.forEach(p => {
    const on = S.soundProfile === p.k;
    const card = document.createElement('div');
    card.className = 'scard' + (on ? ' on' : '');
    card.innerHTML = `<p style="font-size:.8rem;font-weight:600;color:${on ? 'var(--acc)' : '#fff'};margin-bottom:2px">${p.label}</p><p style="font-size:.68rem;color:var(--tx3)">${p.desc}</p>`;
    card.onclick = () => {
      S.soundProfile = p.k;
      document.querySelectorAll('.scard').forEach(c => c.classList.remove('on'));
      card.classList.add('on');
      card.querySelector('p').style.color = 'var(--acc)';
      if (p.k !== 'none' && !S.soundEnabled) { S.soundEnabled = true; updateSoundUI(); }
      SFX.play('x');
    };
    c.appendChild(card);
  });
}

function buildCaretShapeOpts() {
  const shapes = [
    { k:'beam',      label:'Beam',      desc:'Thin vertical line'    },
    { k:'block',     label:'Block',     desc:'Full character width'  },
    { k:'underline', label:'Underline', desc:'Line under character'  },
  ];
  const c = document.getElementById('caret-shape-opts'); c.innerHTML = '';
  shapes.forEach(s => {
    const on = S.caretShape === s.k;
    const btn = document.createElement('button');
    btn.style.cssText = `padding:8px 14px;background:${on ? 'color-mix(in srgb,var(--acc) 10%,var(--s1))' : 'var(--s1)'};border:1px solid ${on ? 'var(--acc)' : 'var(--br)'};border-radius:8px;color:${on ? 'var(--acc)' : 'var(--tx2)'};cursor:pointer;font-size:.78rem;font-family:'DM Sans',sans-serif;transition:all .15s`;
    btn.textContent = s.label; btn.title = s.desc;
    btn.onclick = () => { S.caretShape = s.k; CARET.applyStyle(); buildCaretShapeOpts(); };
    c.appendChild(btn);
  });
}

function buildTypingToggles() {
  const smart = [
    { key:'autoPairs',    label:'Auto-pairs',    desc:'( ) [ ] { } " " — type opening, get closing'   },
    { key:'smartQuotes',  label:'Smart quotes',  desc:'Converts " to curly quotes'                     },
    { key:'emDash',       label:'Em dash',       desc:'Type -- + Space → — (em dash)'                  },
    { key:'continueLists',label:'Continue lists',desc:'Enter continues - and 1. automatically'         },
  ];
  document.getElementById('typing-toggles').innerHTML = '';
  smart.forEach(t => document.getElementById('typing-toggles').appendChild(mkTogRow(t)));

  const flow = [
    { key:'typewriter', label:'Typewriter mode', desc:'Cursor stays centered while typing' },
    { key:'spellcheck', label:'Spell check',     desc:'Browser spell checker underlines'   },
  ];
  document.getElementById('flow-toggles').innerHTML = '';
  flow.forEach(t => document.getElementById('flow-toggles').appendChild(mkTogRow(t)));
}

function mkTogRow(t) {
  const el = document.createElement('label');
  el.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:var(--bg);border:1px solid var(--br);border-radius:8px;padding:9px 11px;cursor:pointer;gap:10px';
  el.innerHTML = `
    <div>
      <p style="font-size:.78rem;color:#fff;font-weight:500">${t.label}</p>
      <p style="font-size:.7rem;color:var(--tx3);margin-top:1px">${t.desc}</p>
    </div>
    <div class="tog ${S[t.key] ? 'on' : ''}" id="tog-${t.key}"
         onclick="S['${t.key}']=!S['${t.key}'];this.classList.toggle('on',S['${t.key}']);if('${t.key}'==='spellcheck')ed.spellcheck=S.spellcheck">
    </div>`;
  return el;
}

function buildShortcutList() {
  const c = document.getElementById('shortcutlist'); c.innerHTML = '';
  SHORTCUTS_LIST.forEach(([k, l]) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #2a2d3620';
    row.innerHTML = `<span style="font-size:.75rem;color:var(--tx2)">${l}</span><kbd style="background:var(--bg);border:1px solid var(--br);border-radius:4px;padding:2px 6px;font-size:.65rem;color:var(--tx);font-family:'JetBrains Mono',monospace">${k}</kbd>`;
    c.appendChild(row);
  });
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
function init() {
  loadState();
  if (!S.projects.length) seed();
  applyAppearance();
  renderHome();
  renderQuickBtns();
  updateApiUI();
  updateSoundUI();

  document.addEventListener('keydown', gk);

  // Global click: close dropdowns, ctx, slash, modal backdrops
  document.addEventListener('click', e => {
    if (!e.target.closest('#ndd')         && !e.target.closest('[onclick*="toggleNDD"]'))  closeNDD();
    if (!e.target.closest('#edd')         && !e.target.closest('[onclick*="toggleEDD"]'))  document.getElementById('edd').classList.remove('open');
    if (!e.target.closest('#fdd')         && !e.target.closest('[onclick*="toggleFDD"]'))  document.getElementById('fdd').classList.remove('open');
    hideCtx();
    if (!e.target.closest('#slash-menu')) closeSlash();
    // Click on .mo overlay itself (backdrop) closes the modal
    const safeClose = ['api-modal','find-modal','tpl-modal','ver-modal','flash-modal','quiz-modal','gs-modal','set-modal'];
    if (e.target.classList.contains('mo') && safeClose.includes(e.target.id)) closeModal(e.target.id);
  });

  // Close floating menus when editor scrolls
  document.getElementById('escroll')?.addEventListener('scroll', () => { closeDDs(); closeSlash(); });

  // Selection word count in status bar
  document.addEventListener('selectionchange', () => {
    const nb = document.getElementById('nb-w'); if (!nb) return;
    const sel = window.getSelection();
    const txt = sel?.toString() || '';
    if (txt.trim() && wc(txt) > 0) {
      nb.textContent = wc(txt) + ' selected';
      nb.dataset.sel = '1';
    } else if (nb.dataset.sel) {
      nb.textContent = wc(ed?.innerText || '') + ' words';
      delete nb.dataset.sel;
    }
  });

  setInterval(() => { savePage(); persistAll(); flashSave(); }, 10000);
  lucide.createIcons();
}

function seed() {
  S.projects = [{
    id: 'proj_0', title: 'My First Project', updated: Date.now(),
    items: [
      { id:'f1', type:'folder', title:'Notes', parentId:null },
      { id:'p1', type:'page', title:'Welcome', parentId:'f1', tags:[], pinned:false,
        content:`<h2>Welcome to ZenAI 👋</h2>
<p>Power-user writing workspace. Here's how to get started:</p>
<ul>
  <li><strong>Ctrl+K</strong> — command palette</li>
  <li><strong>Ctrl+Shift+F</strong> — focus mode</li>
  <li><strong>Ctrl+Shift+A</strong> — AI copilot</li>
  <li><strong>/ at line start</strong> — slash command menu</li>
  <li><strong>Ctrl+D</strong> — duplicate line</li>
  <li><strong>Alt+↑/↓</strong> — move line up/down</li>
  <li><strong>Click the 🔊 button</strong> in the topbar to cycle typing sounds</li>
</ul>
<p>Go to <strong>Settings</strong> to customise fonts, sounds, cursor, and AI.</p>`
      }
    ]
  }];
  persistAll();
}

function gk(e) {
  const ctrl  = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  if (ctrl && e.key === 'k')                            { e.preventDefault(); openCmd();       return; }
  if (ctrl && e.key === 'f' && S.currentPage)           { e.preventDefault(); openFindModal(); return; }
  if (ctrl && e.key === 's')                            { e.preventDefault(); savePage(); persistAll(); flashSave(); return; }
  if (ctrl && shift && e.key === 'T')                   { e.preventDefault(); toggleToolbar(); return; }
  if (ctrl && shift && (e.key === 'A' || e.key === 'a')){ e.preventDefault(); toggleAI();      return; }
  if (ctrl && shift && (e.key === 'F' || e.key === 'f')){ e.preventDefault(); enterFocus('zen'); return; }
  if (ctrl && e.key === 'e' && S.currentPage) {
    e.preventDefault();
    const s = window.getSelection()?.toString().trim();
    if (s) sendAI(`Explain this: "${s}"`);
    return;
  }
  if (ctrl && e.key === '/') {
    e.preventDefault();
    openSettings();
    setTimeout(() => showStab('shortcuts', document.getElementById('st-shortcuts')), 80);
    return;
  }
  // Ctrl+Home — scroll editor to top
  if (ctrl && e.key === 'Home' && S.currentPage) {
    e.preventDefault();
    const sc = document.getElementById(_foc ? 'fo' : 'escroll');
    sc?.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (e.key === 'Escape') {
    if (document.getElementById('cmdw').classList.contains('open')) { closeCmd(); return; }
    closeSlash(); exitFocus();
  }
}

// ══════════════════════════════════════════
//  HOME
// ══════════════════════════════════════════
function renderHome() {
  const grid = document.getElementById('pgrid'); grid.innerHTML = '';
  let tw = 0, tp = S.projects.length, td = 0;
  S.projects.forEach(p => p.items.filter(i => i.type === 'page').forEach(pg => { td++; tw += wc(pg.content || ''); }));
  document.getElementById('st-w').textContent = `${tw.toLocaleString()} words`;
  document.getElementById('st-p').textContent = `${tp} project${tp !== 1 ? 's' : ''}`;
  document.getElementById('st-d').textContent = `${td} document${td !== 1 ? 's' : ''}`;

  if (S.recent.length) {
    document.getElementById('recent-sec').style.display = 'block';
    const rl = document.getElementById('recent-list'); rl.innerHTML = '';
    S.recent.slice(0, 8).forEach(r => {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:4px 9px;background:var(--s1);border:1px solid var(--br);border-radius:6px;color:var(--tx2);cursor:pointer;font-size:.71rem;font-family:"DM Sans",sans-serif;white-space:nowrap;display:flex;align-items:center;gap:5px;transition:all .15s';
      btn.innerHTML = `<i data-lucide="file-text" style="width:10px;height:10px;color:var(--tx3)"></i>${r.title}`;
      btn.onmouseover = () => { btn.style.borderColor = 'var(--acc)'; btn.style.color = 'var(--acc)'; };
      btn.onmouseout  = () => { btn.style.borderColor = 'var(--br)';  btn.style.color = 'var(--tx2)'; };
      btn.onclick = () => { const proj = S.projects.find(p => p.id === r.projId); if (proj) openProject(r.projId, r.pageId); };
      rl.appendChild(btn);
    });
    lucide.createIcons({ nodes: [rl] });
  }

  if (!S.projects.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;padding:4rem 0;color:var(--tx3)"><i data-lucide="folder-open" style="width:40px;height:40px;opacity:.2;margin-bottom:11px"></i><p style="font-size:.84rem">No projects yet</p></div>`;
    lucide.createIcons({ nodes: [grid] }); return;
  }

  S.projects.sort((a, b) => b.updated - a.updated).forEach(proj => {
    const pages   = proj.items.filter(i => i.type === 'page');
    const folders = proj.items.filter(i => i.type === 'folder');
    const words   = pages.reduce((s, p) => s + wc(p.content || ''), 0);
    const card    = document.createElement('div');
    card.className = 'pc';
    card.innerHTML = `
      <div onclick="openProject('${proj.id}')">
        <div class="row" style="gap:8px;margin-bottom:8px">
          <div style="width:30px;height:30px;background:color-mix(in srgb,var(--acc) 10%,transparent);border:1px solid color-mix(in srgb,var(--acc) 22%,transparent);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i data-lucide="folder" style="width:13px;height:13px;color:var(--acc)"></i>
          </div>
          <div style="min-width:0;flex:1">
            <p style="font-size:.82rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${proj.title}</p>
            <p style="font-size:.68rem;color:var(--tx3);margin-top:1px">${pages.length} docs · ${folders.length} folders · ${words.toLocaleString()} words</p>
          </div>
        </div>
        <p style="font-size:.66rem;color:var(--tx3)">${relTime(proj.updated)}</p>
      </div>
      <div class="pca" style="position:absolute;top:9px;right:9px;display:flex;gap:2px;opacity:0;transition:opacity .15s">
        <button onclick="event.stopPropagation();renameProj('${proj.id}')" style="padding:4px;background:var(--bg);border:1px solid var(--br);border-radius:5px;color:var(--tx3);cursor:pointer;transition:all .15s" onmouseover="this.style.color='var(--acc)'" onmouseout="this.style.color='var(--tx3)'" title="Rename"><i data-lucide="pencil" style="width:10px;height:10px"></i></button>
        <button onclick="event.stopPropagation();deleteProj('${proj.id}')" style="padding:4px;background:var(--bg);border:1px solid var(--br);border-radius:5px;color:var(--tx3);cursor:pointer;transition:all .15s" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--tx3)'" title="Delete"><i data-lucide="trash-2" style="width:10px;height:10px"></i></button>
      </div>`;
    grid.appendChild(card);
  });
  lucide.createIcons({ nodes: [grid] });
}

function createProject(name) { const p = {id:'proj_'+Date.now(),title:name,updated:Date.now(),items:[]}; S.projects.push(p); persistAll(); renderHome(); }
function renameProj(id) { const p = S.projects.find(x => x.id === id); showNameModal('Rename Project', p.title, n => { p.title=n; p.updated=Date.now(); persistAll(); renderHome(); }, 'Save'); }
function deleteProj(id) { const p = S.projects.find(x => x.id === id); showConfirm(`Delete "${p.title}" and all its contents?`, () => { S.projects = S.projects.filter(x => x.id !== id); persistAll(); renderHome(); }); }

// ══════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════
function openProject(id, pageId = null) {
  S.currentProject = id;
  document.getElementById('hv').style.display = 'none';
  document.getElementById('ev').style.display = 'flex';
  const proj = S.projects.find(p => p.id === id);
  document.getElementById('pjtitle').textContent = proj.title;
  renderTree();
  const target = pageId || proj.items.find(i => i.type === 'page')?.id;
  if (target) openPage(target);
  else { ed.innerHTML = ''; S.currentPage = null; updateStats(); }
  lucide.createIcons();
}

function goHome() {
  savePage(); persistAll();
  S.currentProject = null; S.currentPage = null;
  document.getElementById('hv').style.display = 'block';
  document.getElementById('ev').style.display = 'none';
  exitFocus(); renderHome();
}

// ══════════════════════════════════════════
//  TREE
// ══════════════════════════════════════════
function renderTree(filter = '') {
  const c    = document.getElementById('tree'); c.innerHTML = '';
  const proj = S.projects.find(p => p.id === S.currentProject); if (!proj) return;
  const q    = filter.toLowerCase().trim();

  if (q) {
    const hits = proj.items.filter(i => i.type === 'page' && i.title.toLowerCase().includes(q));
    if (!hits.length) c.innerHTML = '<p style="font-size:.68rem;color:var(--tx3);text-align:center;padding:14px">No results</p>';
    else hits.forEach(p => c.appendChild(mkPageEl(p)));
  } else {
    const pinned = proj.items.filter(i => i.type === 'page' && i.pinned && !i.parentId);
    if (pinned.length) {
      addLabel(c, 'Pinned');
      pinned.forEach(p => c.appendChild(mkPageEl(p)));
      const sep = document.createElement('div'); sep.style.cssText = 'height:1px;background:var(--br);margin:4px 4px'; c.appendChild(sep);
    }
    proj.items.filter(i => i.type === 'folder' && !i.parentId).forEach(f => c.appendChild(mkFolderEl(f, proj.items)));
    proj.items.filter(i => i.type === 'page'   && !i.parentId && !i.pinned).forEach(p => c.appendChild(mkPageEl(p)));
  }
  lucide.createIcons({ nodes: [c] });
}

function addLabel(c, text) {
  const l = document.createElement('div');
  l.style.cssText = 'font-size:.58rem;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.09em;padding:7px 7px 2px;font-family:"DM Sans",sans-serif';
  l.textContent = text; c.appendChild(l);
}
function filterTree(q) { renderTree(q); }

function mkFolderEl(folder, all) {
  const closed  = S.collapsed.has(folder.id);
  const wrap    = document.createElement('div'); wrap.id = 'f-' + folder.id;
  const kids    = all.filter(i => i.parentId === folder.id && i.type === 'page');

  const row = document.createElement('div');
  row.className = 'ti'; row.dataset.id = folder.id; row.dataset.type = 'folder';
  row.style.cssText = 'display:flex;align-items:center;gap:5px;padding:5px 5px;margin:1px 0';
  row.innerHTML = `
    <i data-lucide="chevron-right" class="chv ${closed ? '' : 'op'}" style="width:11px;height:11px;color:var(--tx3);flex-shrink:0"></i>
    <i data-lucide="${closed ? 'folder' : 'folder-open'}" class="fldico" style="width:12px;height:12px;color:var(--acc);flex-shrink:0"></i>
    <span class="tn" style="font-size:.72rem;font-weight:600;color:var(--tx3);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${folder.title}</span>
    <div class="ta">
      <button onclick="newPage('${folder.id}');event.stopPropagation()" style="padding:2px 3px;background:none;border:none;cursor:pointer;color:var(--tx3);border-radius:3px" title="Add page" onmouseover="this.style.color='var(--acc)'" onmouseout="this.style.color='var(--tx3)'"><i data-lucide="plus" style="width:10px;height:10px"></i></button>
    </div>`;
  row.onclick        = () => toggleFolder(folder.id);
  row.ondblclick     = e  => { e.stopPropagation(); renameItem(folder.id); };
  row.oncontextmenu  = e => showCtx(e, 'folder', folder.id);

  const kidsEl = document.createElement('div');
  kidsEl.className  = 'fk ' + (closed ? 'cl' : 'op');
  kidsEl.style.cssText = 'padding-left:12px;border-left:1px solid #2a2d3650;margin-left:9px';
  kidsEl.style.maxHeight = closed ? '0' : (kids.length * 28 + 10) + 'px';
  kids.forEach(p => kidsEl.appendChild(mkPageEl(p)));

  kidsEl.ondragover  = e => { e.preventDefault(); kidsEl.style.background = 'var(--hv)'; };
  kidsEl.ondragleave = ()  => { kidsEl.style.background = ''; };
  kidsEl.ondrop      = e => { e.preventDefault(); kidsEl.style.background = ''; handleDrop(e, folder.id); };

  wrap.appendChild(row); wrap.appendChild(kidsEl);
  return wrap;
}

function mkPageEl(page) {
  const active = page.id === S.currentPage;
  const el     = document.createElement('div');
  el.className = 'ti' + (active ? ' act' : '');
  el.style.cssText = 'display:flex;align-items:center;gap:5px;padding:5px 5px;margin:1px 0';
  el.dataset.id = page.id; el.dataset.type = 'page'; el.draggable = true;
  const dots = (page.tags || []).slice(0, 3).map(t => `<span style="width:4px;height:4px;border-radius:50%;background:${tclr(t)};flex-shrink:0;display:inline-block"></span>`).join('');
  el.innerHTML = `
    <i data-lucide="file-text" style="width:11px;height:11px;opacity:.4;flex-shrink:0;color:${active ? 'var(--acc)' : 'var(--tx3)'}"></i>
    <span class="tn" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.76rem;color:${active ? 'var(--acc)' : 'var(--tx2)'}">${page.title}</span>
    ${page.pinned ? `<i data-lucide="pin" style="width:8px;height:8px;color:var(--acc);flex-shrink:0"></i>` : ''}
    ${dots}
    <div class="ta" style="gap:1px"></div>`;
  el.onclick        = () => openPage(page.id);
  el.ondblclick     = e  => { e.stopPropagation(); renameItem(page.id); };
  el.oncontextmenu  = e  => showCtx(e, 'page', page.id);
  el.ondragstart    = e  => { e.dataTransfer.setData('pid', page.id); el.style.opacity = '.4'; };
  el.ondragend      = () => { el.style.opacity = '1'; };
  return el;
}

function toggleFolder(id) {
  const w   = document.getElementById('f-' + id);
  const k   = w?.querySelector('.fk');
  const cv  = w?.querySelector('.chv');
  const ico = w?.querySelector('.fldico');
  const proj = S.projects.find(p => p.id === S.currentProject);
  const n    = proj?.items.filter(i => i.parentId === id).length || 0;

  if (S.collapsed.has(id)) {
    S.collapsed.delete(id); k?.classList.remove('cl'); k?.classList.add('op');
    if (k) k.style.maxHeight = (n * 28 + 10) + 'px';
    cv?.classList.add('op');
    if (ico) { ico.setAttribute('data-lucide','folder-open'); lucide.createIcons({ nodes: [ico] }); }
  } else {
    S.collapsed.add(id); k?.classList.add('cl'); k?.classList.remove('op');
    if (k) k.style.maxHeight = '0';
    cv?.classList.remove('op');
    if (ico) { ico.setAttribute('data-lucide','folder'); lucide.createIcons({ nodes: [ico] }); }
  }
  localStorage.setItem('z_col', JSON.stringify([...S.collapsed]));
}

function showCtx(e, type, id) {
  e.preventDefault(); e.stopPropagation();
  const menu  = document.getElementById('ctx');
  const proj  = S.projects.find(p => p.id === S.currentProject);
  const item  = proj?.items.find(i => i.id === id);
  const items = type === 'folder'
    ? [
        { l:'New document inside', ico:'file-plus', a:()=>newPage(id) },
        { sep:true },
        { l:'Rename folder',       ico:'pencil',    a:()=>renameItem(id) },
        { l:'Delete folder',       ico:'trash-2',   d:true, a:()=>deleteItem(id) },
      ]
    : [
        { l: item?.pinned ? 'Unpin' : 'Pin to top', ico:'pin',     a:()=>togglePin(id) },
        { l:'Rename',                                ico:'pencil',  a:()=>renameItem(id) },
        { l:'Duplicate',                             ico:'copy',    a:()=>duplicatePage(id) },
        { sep:true },
        { l:'Delete',                                ico:'trash-2', d:true, a:()=>deleteItem(id) },
      ];

  menu.innerHTML = items.map((it, i) => it.sep
    ? `<div class="csep"></div>`
    : `<div class="ci${it.d ? ' d' : ''}" id="ci${i}"><i data-lucide="${it.ico}" style="width:11px;height:11px;opacity:.7"></i>${it.l}</div>`
  ).join('');
  menu.style.display = 'block';
  menu.style.left    = Math.min(e.clientX, window.innerWidth  - 185) + 'px';
  menu.style.top     = Math.min(e.clientY, window.innerHeight - items.length * 34 + 10) + 'px';
  lucide.createIcons({ nodes: [menu] });
  items.forEach((it, i) => {
    if (!it.sep) { const el = document.getElementById('ci' + i); if (el) el.onclick = () => { hideCtx(); it.a(); }; }
  });
}
function hideCtx() { document.getElementById('ctx').style.display = 'none'; }
function handleDrop(e, fid) {
  const pid  = e.dataTransfer.getData('pid'); if (!pid) return;
  const proj = S.projects.find(p => p.id === S.currentProject);
  const page = proj?.items.find(i => i.id === pid);
  if (page) { page.parentId = fid; proj.updated = Date.now(); persistAll(); renderTree(); }
}

function togglePin(id)    { const proj=S.projects.find(p=>p.id===S.currentProject); const page=proj?.items.find(i=>i.id===id); if(page){page.pinned=!page.pinned;persistAll();renderTree();} }
function duplicatePage(id){ const proj=S.projects.find(p=>p.id===S.currentProject); const page=proj?.items.find(i=>i.id===id); if(!page)return; const nid='p_'+Date.now(); proj.items.push({...page,id:nid,title:page.title+' (copy)'}); proj.updated=Date.now(); persistAll(); renderTree(); showToast('✓ Page duplicated'); }
function newFolder()      { showNameModal('New Folder','',n=>{const proj=S.projects.find(p=>p.id===S.currentProject);proj.items.push({id:'f_'+Date.now(),type:'folder',title:n,parentId:null});proj.updated=Date.now();persistAll();renderTree();}); }
function newPage(pid)     { showNameModal('New Document','',n=>{const proj=S.projects.find(p=>p.id===S.currentProject);const nid='p_'+Date.now();proj.items.push({id:nid,type:'page',title:n,parentId:pid,content:'',tags:[],pinned:false});proj.updated=Date.now();persistAll();openPage(nid);renderTree();}); }
function newPageFromTemplate(tpl) { showNameModal('New Document',tpl.name,n=>{const proj=S.projects.find(p=>p.id===S.currentProject);const nid='p_'+Date.now();proj.items.push({id:nid,type:'page',title:n,parentId:null,content:tpl.html,tags:[],pinned:false});proj.updated=Date.now();persistAll();openPage(nid);renderTree();closeModal('tpl-modal');},'Create'); }
function renameItem(id)   { const proj=S.projects.find(p=>p.id===S.currentProject);const item=proj?.items.find(i=>i.id===id);showNameModal('Rename',item.title,n=>{item.title=n;proj.updated=Date.now();persistAll();renderTree();if(id===S.currentPage)renderBC();},'Save'); }
function deleteItem(id)   { const proj=S.projects.find(p=>p.id===S.currentProject);const item=proj?.items.find(i=>i.id===id);showConfirm(`Delete "${item?.title}"?`,()=>{const del=new Set([id,...proj.items.filter(i=>i.parentId===id).map(i=>i.id)]);proj.items=proj.items.filter(i=>!del.has(i.id));proj.updated=Date.now();if(del.has(S.currentPage)){S.currentPage=null;ed.innerHTML='';updateStats();}persistAll();renderTree();}); }

// ══════════════════════════════════════════
//  PAGES
// ══════════════════════════════════════════
function openPage(id) {
  savePage(); pushVer();
  S.currentPage = id;
  const proj = S.projects.find(p => p.id === S.currentProject);
  const page = proj?.items.find(i => i.id === id); if (!page) return;
  ed.innerHTML    = page.content || '';
  ed.spellcheck   = S.spellcheck;
  renderBC(); renderPageTags(page); addRecent(proj, page);
  renderTree(); updateStats(); ed.focus();
  addCopyButtons();
  requestAnimationFrame(() => {
    CARET.update();
    document.querySelector('#tree .ti.act')?.scrollIntoView({ block:'nearest', behavior:'smooth' });
  });
}

function renderBC() {
  const proj = S.projects.find(p => p.id === S.currentProject);
  const page = proj?.items.find(i => i.id === S.currentPage); if (!page) return;
  let bc = `<span style="color:var(--tx3)">${proj.title}</span>`;
  if (page.parentId) { const par = proj.items.find(i => i.id === page.parentId); if (par) bc += `<span style="opacity:.2;margin:0 3px">›</span><span style="color:var(--tx3)">${par.title}</span>`; }
  bc += `<span style="opacity:.2;margin:0 3px">›</span><span style="color:var(--acc);font-weight:600">${page.title}</span>`;
  document.getElementById('tbc').innerHTML = bc;
}

function renderPageTags(page) {
  const bar  = document.getElementById('ptbar');
  const list = document.getElementById('ptags');
  bar.style.display = 'flex'; list.innerHTML = '';
  (page.tags || []).forEach(t => {
    const sp = document.createElement('span');
    sp.className  = 'tag';
    sp.style.cssText = `background:${tclr(t)}14;color:${tclr(t)};border:1px solid ${tclr(t)}33`;
    sp.textContent = t; sp.title = 'Remove tag'; sp.onclick = () => removeTag(t);
    list.appendChild(sp);
  });
}

const TC = ['#e2b714','#5ab27a','#5b9cf6','#f9a8d4','#fb923c','#a78bfa','#34d399'];
function tclr(t) { let h=0; for (const c of t) h=(h*31+c.charCodeAt(0))%TC.length; return TC[h]; }
function addTag() { const t=prompt('Tag name:')?.trim(); if(!t)return; const proj=S.projects.find(p=>p.id===S.currentProject); const page=proj?.items.find(i=>i.id===S.currentPage); if(!page)return; if(!page.tags)page.tags=[]; if(!page.tags.includes(t)){page.tags.push(t);renderPageTags(page);renderTree();persistAll();} }
function removeTag(t) { const proj=S.projects.find(p=>p.id===S.currentProject); const page=proj?.items.find(i=>i.id===S.currentPage); if(page){page.tags=page.tags.filter(x=>x!==t);renderPageTags(page);renderTree();persistAll();} }

function addRecent(proj, page) { S.recent=S.recent.filter(r=>r.pageId!==page.id); S.recent.unshift({projId:proj.id,pageId:page.id,title:page.title,ts:Date.now()}); S.recent=S.recent.slice(0,20); localStorage.setItem('z_recent',JSON.stringify(S.recent)); }
function pushVer() { if(!S.currentPage)return; const html=ed.innerHTML; if(!S.versions[S.currentPage])S.versions[S.currentPage]=[]; const h=S.versions[S.currentPage]; if(h.length&&h[h.length-1].html===html)return; h.push({ts:Date.now(),html,words:wc(ed.innerText)}); if(h.length>15)h.shift(); localStorage.setItem('z_ver',JSON.stringify(S.versions)); }

// ══════════════════════════════════════════
//  EDITOR
// ══════════════════════════════════════════
function focusEditor(e) { if (e.target === e.currentTarget) ed.focus(); }
let _copyBtnTimer = null;
function onEdInput() {
  updateStats();
  if (S.typewriter) doTypewriter();
  // Throttle copy button refresh to once per 800ms
  clearTimeout(_copyBtnTimer);
  _copyBtnTimer = setTimeout(addCopyButtons, 800);
  updateFocusCounter();
}
function updateStats()  {
  const t = ed.innerText || '';
  const w = wc(t), m = Math.max(1, Math.ceil(w / 220));
  document.getElementById('nb-w').textContent = w + ' words';
  document.getElementById('nb-t').textContent = '~' + m + ' min';
}
function wc(t) { const s=(t||'').replace(/<[^>]+>/g,' ').trim(); return s ? s.split(/\s+/).filter(w=>w.length>0).length : 0; }

let _slashActive = false, _slashQuery = '', _slashSel = 0, _slashFiltered = [];

function onEdKey(e) {
  SFX.play(e.key);
  CARET.pulse();

  // Auto-pairs
  if (S.autoPairs && !e.ctrlKey && !e.altKey) {
    const pairs = { '(':')','[':']','{':'}','"':'"',"'":"'" };
    if (pairs[e.key]) {
      e.preventDefault();
      const close = pairs[e.key];
      const sel   = window.getSelection();
      if (sel && sel.toString()) document.execCommand('insertText', false, e.key + sel.toString() + close);
      else { document.execCommand('insertText', false, e.key + close); moveCaret(-1); }
      return;
    }
  }

  // Slash trigger
  if (e.key === '/' && !e.ctrlKey && !e.altKey) {
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const range  = sel.getRangeAt(0);
      const node   = range.startContainer;
      const before = (node.nodeType === 3 ? node.textContent.slice(0, range.startOffset) : '').trim();
      if (!before) setTimeout(() => openSlash(range), 10);
    }
  }

  // Slash navigation
  if (_slashActive) {
    if (e.key === 'ArrowDown')  { e.preventDefault(); _slashSel=Math.min(_slashSel+1,_slashFiltered.length-1); renderSlashItems(); return; }
    if (e.key === 'ArrowUp')    { e.preventDefault(); _slashSel=Math.max(0,_slashSel-1); renderSlashItems(); return; }
    if (e.key === 'Enter')      { e.preventDefault(); execSlash(_slashSel); return; }
    if (e.key === 'Escape')     { closeSlash(); return; }
    if (e.key === 'Backspace' && _slashQuery === '') { closeSlash(); return; }
    if (e.key === 'Backspace')  { _slashQuery = _slashQuery.slice(0, -1); filterSlash(); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) { _slashQuery += e.key; filterSlash(); }
    return;
  }

  // Em dash: -- + Space → —
  if (S.emDash && e.key === ' ') {
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const n = sel.anchorNode;
      if (n?.nodeType === 3 && n.textContent.slice(0, sel.anchorOffset).endsWith('--')) {
        e.preventDefault();
        document.execCommand('delete'); document.execCommand('delete');
        document.execCommand('insertText', false, '— ');
        return;
      }
    }
  }

  // Markdown shortcuts on Space
  if (e.key === ' ' && !e.ctrlKey) {
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const node = sel.anchorNode;
      if (node?.nodeType === 3) {
        const txt    = node.textContent.slice(0, sel.anchorOffset);
        const shorts = { '####':'h4','###':'h3','##':'h2','#':'h1','>':'blockquote','-':'ul','1.':'ol','---':'hr' };
        for (const [k, tag] of Object.entries(shorts)) {
          if (txt === k) {
            e.preventDefault();
            for (let i = 0; i < k.length; i++) document.execCommand('delete');
            if (tag === 'hr')  { fmt('insertHTML','<hr><p>\u200b</p>'); return; }
            if (tag === 'ul')  { fmt('insertUnorderedList');             return; }
            if (tag === 'ol')  { fmt('insertOrderedList');               return; }
            fmt('formatBlock', tag); return;
          }
        }
      }
    }
  }

  // Power user keys
  if (e.key === 'Tab')                                    { e.preventDefault(); fmt('insertHTML','&nbsp;&nbsp;&nbsp;&nbsp;'); return; }
  if (e.ctrlKey  && e.key === 'd')                        { e.preventDefault(); duplicateLine();  return; }
  if (e.altKey   && e.key === 'ArrowUp')                  { e.preventDefault(); moveLineUp();      return; }
  if (e.altKey   && e.key === 'ArrowDown')                { e.preventDefault(); moveLineDown();    return; }
  if (e.ctrlKey  && e.shiftKey && e.key === 'V')          { e.preventDefault(); pastePlain();      return; }
  if (e.ctrlKey  && e.shiftKey && (e.key==='K'||e.key==='k')) { e.preventDefault(); insertLink(); return; }
  // Ctrl+Enter → insert new paragraph below current block
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const node  = sel.anchorNode;
      const par   = (node.nodeType===3 ? node.parentElement : node).closest('p,h1,h2,h3,h4,li,blockquote') || node;
      if (par && par !== ed) {
        const newP = document.createElement('p'); newP.innerHTML = '\u200b';
        par.after ? par.after(newP) : par.parentNode.insertBefore(newP, par.nextSibling);
        const r = document.createRange(); r.selectNodeContents(newP); r.collapse(false);
        sel.removeAllRanges(); sel.addRange(r);
        requestAnimationFrame(() => CARET.update());
      }
    }
    return;
  }
}

function onEdKeyUp()  { requestAnimationFrame(() => CARET.update()); }

function onPaste(e) {
  // Image paste from clipboard
  const items = e.clipboardData?.items;
  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file   = item.getAsFile();
        const reader = new FileReader();
        reader.onload = ev => fmt('insertHTML', `<img src="${ev.target.result}" alt="pasted image">`);
        reader.readAsDataURL(file);
        return;
      }
    }
  }
  requestAnimationFrame(() => { updateStats(); CARET.update(); });
}
function pastePlain() {
  navigator.clipboard?.readText()
    .then(txt => document.execCommand('insertText', false, txt))
    .catch(()  => { const t=prompt('Paste plain text:'); if(t) document.execCommand('insertText',false,t); });
}

function duplicateLine() {
  const sel = window.getSelection(); if (!sel.rangeCount) return;
  const node = sel.anchorNode;
  const parent = node.nodeType === 3 ? node.parentElement : node;
  const block  = parent.closest('p,li,h1,h2,h3,h4,blockquote,pre') || parent;
  if (!block) return;
  const clone = block.cloneNode(true);
  block.parentNode.insertBefore(clone, block.nextSibling);
  const r = document.createRange(); r.selectNodeContents(clone); r.collapse(false);
  sel.removeAllRanges(); sel.addRange(r);
  updateStats();
}

function moveLineUp() {
  const sel = window.getSelection(); if (!sel.rangeCount) return;
  const block = (sel.anchorNode.nodeType===3 ? sel.anchorNode.parentElement : sel.anchorNode).closest('p,li,h1,h2,h3,h4,blockquote') || sel.anchorNode;
  if (!block || !block.previousElementSibling) return;
  block.parentNode.insertBefore(block, block.previousElementSibling);
  const r=document.createRange(); r.selectNodeContents(block); r.collapse(false); sel.removeAllRanges(); sel.addRange(r);
}

function moveLineDown() {
  const sel = window.getSelection(); if (!sel.rangeCount) return;
  const block = (sel.anchorNode.nodeType===3 ? sel.anchorNode.parentElement : sel.anchorNode).closest('p,li,h1,h2,h3,h4,blockquote') || sel.anchorNode;
  if (!block || !block.nextElementSibling) return;
  block.parentNode.insertBefore(block.nextElementSibling, block);
  const r=document.createRange(); r.selectNodeContents(block); r.collapse(false); sel.removeAllRanges(); sel.addRange(r);
}

function moveCaret(offset) {
  const sel = window.getSelection(); if (!sel.rangeCount) return;
  const r = sel.getRangeAt(0).cloneRange(); r.collapse(true);
  try { r.setStart(r.startContainer, r.startOffset + offset); } catch(e) {}
  sel.removeAllRanges(); sel.addRange(r);
}

function doTypewriter() {
  const sel = window.getSelection(); if (!sel.rangeCount) return;
  const rect = sel.getRangeAt(0).getBoundingClientRect(); if (!rect.height) return;
  const sc   = document.getElementById('escroll');
  const scr  = sc.getBoundingClientRect();
  sc.scrollTo({ top: rect.top - scr.top + sc.scrollTop - sc.clientHeight / 2, behavior: 'smooth' });
}

// SLASH
function openSlash(range) {
  _slashActive = true; _slashQuery = ''; _slashSel = 0; _slashFiltered = [...SLASH_COMMANDS];
  const rect = range.getBoundingClientRect();
  const m    = document.getElementById('slash-menu');
  m.style.left    = Math.min(rect.left, window.innerWidth - 240) + 'px';
  m.style.top     = (rect.bottom + 4) + 'px';
  m.style.display = 'block';
  renderSlashItems();
}
function renderSlashItems() {
  const m = document.getElementById('slash-menu');
  m.innerHTML = _slashFiltered.length
    ? _slashFiltered.map((c, i) => `<div class="si${i===_slashSel?' sel':''}" onclick="execSlash(${i})"><div class="sico">${c.icon}</div><span style="flex:1">${c.label}</span><span class="shint">${c.hint}</span></div>`).join('')
    : `<div style="padding:8px 12px;font-size:.75rem;color:var(--tx3);font-family:'DM Sans',sans-serif">No match</div>`;
}
function filterSlash() {
  const q = _slashQuery.toLowerCase();
  _slashFiltered = SLASH_COMMANDS.filter(c => c.key.includes(q) || c.label.toLowerCase().includes(q));
  _slashSel = 0; renderSlashItems();
}
function execSlash(idx) {
  closeSlash();
  const del = 1 + _slashQuery.length;
  for (let i = 0; i < del; i++) document.execCommand('delete');
  _slashFiltered[idx]?.action();
  // Add copy button if a code block was just inserted
  requestAnimationFrame(() => addCopyButtons());
}
function closeSlash() { _slashActive = false; document.getElementById('slash-menu').style.display = 'none'; }

// Editor formatting helpers
function fmt(cmd, val = null)  { ed.focus(); document.execCommand(cmd, false, val); }
function hl(color)             { ed.focus(); try { document.execCommand('hiliteColor',false,color); } catch(e) { document.execCommand('backColor',false,color); } }
function removeHl()            { ed.focus(); try { document.execCommand('hiliteColor',false,'transparent'); } catch(e) { document.execCommand('backColor',false,'transparent'); } }
function insertLink()          { const u=prompt('URL:'); if(u) fmt('createLink',u); }
function insertImage()         { const u=prompt('Image URL:'); if(u) fmt('insertHTML',`<img src="${u}" alt="image">`); }
function insertTable()         { fmt('insertHTML',`<table><thead><tr><th>Col 1</th><th>Col 2</th><th>Col 3</th></tr></thead><tbody><tr><td>\u200b</td><td>\u200b</td><td>\u200b</td></tr><tr><td>\u200b</td><td>\u200b</td><td>\u200b</td></tr></tbody></table><p>\u200b</p>`); }
function insertHR()            { fmt('insertHTML','<hr><p>\u200b</p>'); }
function updateRP()            { const sc=document.getElementById('escroll'); if(!sc)return; const pct=sc.scrollHeight===sc.clientHeight?0:(sc.scrollTop/(sc.scrollHeight-sc.clientHeight))*100; document.getElementById('rp').style.width=pct+'%'; }

// Add copy buttons to all <pre> blocks in the editor
function addCopyButtons() {
  ed.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.copy-btn')) return; // already has one
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = '<i data-lucide="copy" style="width:11px;height:11px"></i>';
    btn.title = 'Copy code';
    btn.style.cssText = 'position:absolute;top:8px;right:8px;padding:4px 6px;background:var(--s2);border:1px solid var(--br);border-radius:5px;color:var(--tx3);cursor:pointer;font-size:.65rem;font-family:"DM Sans",sans-serif;display:flex;align-items:center;gap:4px;transition:all .15s;opacity:0';
    btn.onmouseover = () => btn.style.color = 'var(--acc)';
    btn.onmouseout  = () => btn.style.color = 'var(--tx3)';
    btn.onclick     = e  => {
      e.stopPropagation();
      const code = pre.querySelector('code')?.innerText || pre.innerText;
      navigator.clipboard.writeText(code).then(() => {
        btn.innerHTML = '<i data-lucide="check" style="width:11px;height:11px"></i>';
        lucide.createIcons({ nodes: [btn] });
        setTimeout(() => { btn.innerHTML='<i data-lucide="copy" style="width:11px;height:11px"></i>'; lucide.createIcons({nodes:[btn]}); }, 1500);
      });
    };
    // Show on hover of pre block
    pre.style.position = 'relative';
    pre.onmouseover = () => btn.style.opacity = '1';
    pre.onmouseout  = () => btn.style.opacity = '0';
    pre.appendChild(btn);
    lucide.createIcons({ nodes: [btn] });
  });
}

function exportDoc(type) {
  if (!S.currentPage) return;
  const proj  = S.projects.find(p => p.id === S.currentProject);
  const page  = proj?.items.find(i => i.id === S.currentPage);
  const title = page?.title || 'Document';
  let blob, ext;
  if      (type==='txt')  { blob=new Blob([ed.innerText],{type:'text/plain'}); ext='txt'; }
  else if (type==='html') { blob=new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Georgia,serif;max-width:760px;margin:3rem auto;padding:0 1.5rem;line-height:1.85;color:#111}blockquote{border-left:3px solid #e2b714;padding:.4em 1em;color:#555}code{background:#f4f4f4;padding:1px 4px;border-radius:3px;font-family:monospace}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:.45em .7em}</style></head><body><h1>${title}</h1>${ed.innerHTML}</body></html>`],{type:'text/html'}); ext='html'; }
  else                    { blob=new Blob([`# ${title}\n\n${ed.innerText}`],{type:'text/markdown'}); ext='md'; }
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${title}.${ext}`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

async function importFile(e) {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.type==='text/plain' || file.name.endsWith('.md')) fmt('insertHTML',(await file.text()).replace(/\n/g,'<br>'));
    else if (file.type==='application/pdf') {
      const pdf = await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
      let t=''; for(let i=1;i<=pdf.numPages;i++) t+=(await(await pdf.getPage(i)).getTextContent()).items.map(x=>x.str).join(' ')+'<br><br>';
      fmt('insertHTML',t);
    }
  } catch(err) { showToast('⚠️ Failed to read file'); }
  e.target.value = '';
}

// ══════════════════════════════════════════
//  FOCUS MODES
// ══════════════════════════════════════════
let _foc = false;
const FT = {
  zen:      { bg:'#0f1012', tx:'#c9c8bf', xbg:'#16181c', xco:'#c9c8bf', xbr:'#2a2d36' },
  sepia:    { bg:'#f0e8d4', tx:'#3a2b18', xbg:'#e8dcca', xco:'#5c3d1a', xbr:'#c8b090' },
  midnight: { bg:'#0e091a', tx:'#d4c8f0', xbg:'#1a1030', xco:'#a78bfa', xbr:'#3d2d60' },
  forest:   { bg:'#0c1a0e', tx:'#b8d4bc', xbg:'#132016', xco:'#52a870', xbr:'#1e3d22' },
  paper:    { bg:'#fafaf8', tx:'#1a1a18', xbg:'#f0f0ee', xco:'#333',    xbr:'#ccc'    },
};

function enterFocus(mode) {
  savePage(); pushVer();
  const th  = FT[mode] || FT.zen;
  const ov  = document.getElementById('fo');
  const fe  = document.getElementById('fed');
  const xb  = document.getElementById('fexit');
  ov.style.display = 'flex'; ov.style.background = th.bg;
  fe.style.color   = th.tx;  fe.innerHTML = ed.innerHTML;
  xb.style.background = th.xbg; xb.style.color = th.xco; xb.style.borderColor = th.xbr;
  // Word counter pill in focus overlay
  let fc = document.getElementById('focus-wc');
  if (!fc) {
    fc = document.createElement('div');
    fc.id = 'focus-wc';
    document.getElementById('fo').appendChild(fc);
  }
  // Style counter text colour to match theme
  fc.style.color = th.tx;
  document.getElementById('fdd').classList.remove('open');
  _foc = true; fe.focus();
  updateFocusCounter();
  requestAnimationFrame(() => CARET.update());
}

function updateFocusCounter() {
  if (!_foc) return;
  const fc = document.getElementById('focus-wc'); if (!fc) return;
  const src = document.activeElement?.id === 'fed'
    ? document.getElementById('fed')
    : ed;
  const w = wc(src?.innerText || '');
  fc.textContent = w + ' words';
}

function exitFocus() {
  if (!_foc) return;
  ed.innerHTML = document.getElementById('fed').innerHTML;
  savePage(); document.getElementById('fo').style.display = 'none';
  document.getElementById('fed').innerHTML = ''; _foc = false;
  updateStats(); addCopyButtons();
}
function onFedInput() { updateStats(); updateFocusCounter(); }
function onFedKey(e)  { SFX.play(e.key); CARET.pulse(); if (e.key==='Escape') { e.preventDefault(); exitFocus(); } }

// ══════════════════════════════════════════
//  SIDEBARS & DROPDOWNS
// ══════════════════════════════════════════
let _aiOpen = false;
function toggleAI() {
  _aiOpen = !_aiOpen;
  const sb  = document.getElementById('aisb');
  const btn = document.getElementById('aibtn');
  sb.style.display  = _aiOpen ? 'flex' : 'none';
  btn.style.color   = _aiOpen ? 'var(--acc)' : 'var(--tx3)';
  if (_aiOpen) updateApiUI();
}
function toggleSidebar()  { const sb=document.getElementById('sb'); sb.style.display = sb.style.display==='none' ? 'flex' : 'none'; }
function toggleToolbar()  { const tb=document.getElementById('toolbar'); tb.style.display=tb.style.display==='none'||!tb.style.display?'block':'none'; lucide.createIcons(); }
function toggleNDD()      { document.getElementById('ndd').classList.toggle('open'); }
function closeNDD()       { document.getElementById('ndd')?.classList.remove('open'); }
function toggleEDD()      { document.getElementById('edd').classList.toggle('open'); }
function toggleFDD()      { document.getElementById('fdd').classList.toggle('open'); }
function closeDDs()       { ['ndd','edd','fdd'].forEach(id => document.getElementById(id)?.classList.remove('open')); }
function triggerAISplit() { document.getElementById('ai-split-f').click(); }

function updateSoundUI() {
  const ico = document.getElementById('sndico'); if (!ico) return;
  const on  = S.soundEnabled && S.soundProfile !== 'none';
  ico.setAttribute('data-lucide', on ? 'volume-2' : 'volume-x');
  document.getElementById('sndbtn').style.color = on ? 'var(--acc)' : 'var(--tx3)';
  lucide.createIcons({ nodes: [document.getElementById('sndbtn')] });
}
function cycleSoundProfile() {
  const profs = ['mechanical','thock','soft','typewriter','bubble','none'];
  if (!S.soundEnabled) { S.soundEnabled=true; S.soundProfile='mechanical'; updateSoundUI(); SFX.play('x'); showToast('🔊 Sounds on · Mechanical'); return; }
  const ci = profs.indexOf(S.soundProfile);
  S.soundProfile = profs[(ci+1) % profs.length];
  if (S.soundProfile === 'none') { S.soundEnabled=false; updateSoundUI(); showToast('🔇 Sounds off'); return; }
  updateSoundUI(); SFX.play('x');
  showToast('🔊 ' + S.soundProfile.charAt(0).toUpperCase() + S.soundProfile.slice(1));
  localStorage.setItem('z_sndp', S.soundProfile); localStorage.setItem('z_snd', S.soundEnabled);
}

// ══════════════════════════════════════════
//  FIND & REPLACE
// ══════════════════════════════════════════
function openFindModal() { openModal('find-modal'); setTimeout(()=>document.getElementById('findi').focus(),80); }
function doFind() {
  const q = document.getElementById('findi').value, msg = document.getElementById('findmsg');
  if (!q) { msg.style.display='none'; return; }
  const esc   = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const count = (ed.innerText.match(new RegExp(esc,'gi'))||[]).length;
  msg.textContent = count ? `${count} result${count!==1?'s':''} found` : 'Not found';
  msg.style.display = 'block'; if (count) window.find(q);
}
function doReplace()    { const f=document.getElementById('findi').value,r=document.getElementById('repi').value; if(!f)return; if(window.getSelection()?.toString()===f) document.execCommand('insertText',false,r); else window.find(f); }
function doReplaceAll() {
  const f=document.getElementById('findi').value, r=document.getElementById('repi').value; if(!f)return;
  const esc=f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const walker=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  let count=0; nodes.forEach(n=>{const re=new RegExp(esc,'g'); n.nodeValue=n.nodeValue.replace(re,()=>{count++;return r;});});
  document.getElementById('findmsg').textContent=`${count} replacement${count!==1?'s':''} made`;
  savePage();
}

// ══════════════════════════════════════════
//  GLOBAL SEARCH
// ══════════════════════════════════════════
function openGS()  { openModal('gs-modal'); setTimeout(()=>document.getElementById('gsi').focus(),80); }
function doGS(q)   {
  const res = document.getElementById('gsr'); res.innerHTML = '';
  if (!q.trim()) { res.innerHTML='<p style="padding:13px;color:var(--tx3);font-size:.75rem;text-align:center">Start typing…</p>'; return; }
  const hits = [];
  S.projects.forEach(proj => proj.items.filter(i => i.type==='page').forEach(page => {
    const text = (page.content||'').replace(/<[^>]+>/g,' ');
    const re   = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
    if (re.test(page.title) || re.test(text)) {
      const idx = text.search(re);
      hits.push({ proj, page, snippet: idx>=0 ? '...'+text.slice(Math.max(0,idx-50),idx+90)+'...' : '' });
    }
  }));
  if (!hits.length) { res.innerHTML='<p style="padding:13px;color:var(--tx3);font-size:.75rem;text-align:center">No results</p>'; return; }
  hits.forEach(({ proj, page, snippet }) => {
    const el = document.createElement('div');
    el.style.cssText = 'padding:8px 10px;border-radius:7px;cursor:pointer;border:1px solid transparent;margin-bottom:3px;transition:all .1s';
    el.innerHTML = `<div class="row" style="gap:6px;margin-bottom:3px"><i data-lucide="file-text" style="width:11px;height:11px;color:var(--tx3);flex-shrink:0"></i><span style="font-size:.79rem;font-weight:600;color:#fff">${page.title}</span><span style="font-size:.65rem;color:var(--tx3);background:var(--s2);padding:1px 5px;border-radius:4px;border:1px solid var(--br)">${proj.title}</span></div>${snippet?`<p style="font-size:.7rem;color:var(--tx2);line-height:1.5">${snippet}</p>`:''}`;
    el.onmouseover = () => { el.style.background='var(--hv)'; el.style.borderColor='var(--br)'; };
    el.onmouseout  = () => { el.style.background='transparent'; el.style.borderColor='transparent'; };
    el.onclick     = () => { closeModal('gs-modal'); openProject(proj.id, page.id); };
    res.appendChild(el);
  });
  lucide.createIcons({ nodes: [res] });
}

// ══════════════════════════════════════════
//  TEMPLATES
// ══════════════════════════════════════════
function openTemplates() {
  const g = document.getElementById('tplgrid'); g.innerHTML = '';
  TEMPLATES.forEach(tpl => {
    const c = document.createElement('div');
    c.style.cssText = 'padding:12px;background:var(--bg);border:1px solid var(--br);border-radius:8px;cursor:pointer;transition:all .18s;text-align:center';
    c.innerHTML = `<div style="width:30px;height:30px;background:color-mix(in srgb,var(--acc) 10%,transparent);border:1px solid color-mix(in srgb,var(--acc) 24%,transparent);border-radius:7px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px"><i data-lucide="${tpl.icon}" style="width:13px;height:13px;color:var(--acc)"></i></div><p style="font-size:.76rem;font-weight:600;color:#fff;margin-bottom:1px">${tpl.name}</p><p style="font-size:.65rem;color:var(--tx3)">${tpl.desc}</p>`;
    c.onmouseover = () => c.style.borderColor='var(--acc)';
    c.onmouseout  = () => c.style.borderColor='var(--br)';
    c.onclick     = () => newPageFromTemplate(tpl);
    g.appendChild(c);
  });
  openModal('tpl-modal'); lucide.createIcons({ nodes: [g] });
}

// ══════════════════════════════════════════
//  VERSION HISTORY
// ══════════════════════════════════════════
function openVersions() {
  const list = document.getElementById('verl'); list.innerHTML = '';
  const hist = S.versions[S.currentPage] || [];
  if (!hist.length) { list.innerHTML='<p style="padding:13px;color:var(--tx3);font-size:.75rem;text-align:center">No saved versions yet.</p>'; }
  else {
    [...hist].reverse().forEach((v, i) => {
      const el = document.createElement('div');
      el.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;border:1px solid var(--br);margin-bottom:5px;transition:border-color .1s';
      el.innerHTML = `<div><p style="font-size:.77rem;font-weight:600;color:#fff">${new Date(v.ts).toLocaleString()}</p><p style="font-size:.68rem;color:var(--tx3)">${v.words} words · ${relTime(v.ts)}</p></div><button style="padding:4px 8px;background:color-mix(in srgb,var(--acc) 10%,transparent);border:1px solid color-mix(in srgb,var(--acc) 28%,transparent);border-radius:6px;color:var(--acc);font-size:.68rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif" onclick="restoreVer(${hist.length-1-i})">Restore</button>`;
      el.onmouseover = () => el.style.borderColor='var(--acc)'; el.onmouseout = () => el.style.borderColor='var(--br)';
      list.appendChild(el);
    });
  }
  openModal('ver-modal');
}
function restoreVer(idx) { const h=S.versions[S.currentPage]||[]; if(!h[idx])return; showConfirm('Restore this version?',()=>{ed.innerHTML=h[idx].html;savePage();closeModal('ver-modal');updateStats();}); }

// ══════════════════════════════════════════
//  AI
// ══════════════════════════════════════════
function updateApiUI() {
  const ok  = !!(S.apiKeys[S.provider]);
  document.getElementById('apibanner').style.display = ok ? 'none' : 'flex';
  document.getElementById('ainokey').style.display   = ok ? 'none' : 'block';
  const b  = document.getElementById('aibadge');     if (b)  b.textContent = { gemini:'Gemini',openai:'OpenAI',claude:'Claude' }[S.provider] || S.provider;
  const ks = document.getElementById('set-keystatus'); if (ks) ks.textContent = ok ? `✓ ${PROV[S.provider]?.name||S.provider} connected` : 'Configure AI provider →';
}

function aiMsg(role, text) {
  const hist = document.getElementById('aihist');
  const d    = document.createElement('div');
  d.style.cssText = `display:flex;flex-direction:column;align-items:${role==='user'?'flex-end':'flex-start'}`;
  const b = document.createElement('div');
  b.style.cssText = `max-width:92%;padding:7px 10px;border-radius:9px;font-size:.73rem;line-height:1.65;${role==='user'?'background:var(--acc);color:#0f1012;font-weight:500;':'background:var(--bg);color:var(--tx);border:1px solid var(--br);'}`;
  if (role==='ai') b.innerHTML = text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code style="background:var(--s2);padding:1px 4px;border-radius:3px;color:var(--acc);font-size:.85em">$1</code>').replace(/\n/g,'<br>');
  else b.textContent = text;
  d.appendChild(b); hist.appendChild(d); hist.scrollTop = hist.scrollHeight;
}

let _aibusy = false;
async function sendAI(q = document.getElementById('aiinp').value) {
  if (!q.trim() || _aibusy) return;
  if (!S.apiKeys[S.provider]) { openApiModal(); return; }
  if (!_aiOpen) toggleAI();
  aiMsg('user', q); document.getElementById('aiinp').value = '';
  _aibusy = true; document.getElementById('aithinking').style.display = 'block';
  try   { const r = await callAI(q, ed.innerText); aiMsg('ai', r); }
  catch (e) { aiMsg('ai', '⚠️ ' + e.message); }
  finally   { _aibusy=false; document.getElementById('aithinking').style.display='none'; }
}
function clearAIChat() { document.getElementById('aihist').innerHTML='<div style="max-width:92%;padding:7px 10px;border-radius:9px;background:var(--bg);border:1px solid var(--br);font-size:.73rem;color:var(--tx2)">Chat cleared. How can I help?</div>'; }

async function callAI(prompt, docText = '', expectJson = false) {
  const px  = { helpful:'a helpful assistant',creative:'a creative writer',strict:'a strict grammar expert',teacher:'a patient teacher',researcher:'a critical researcher' };
  const sys = `You are ${px[S.persona]||'a helpful assistant'}. Respond ${S.lang==='auto'?'in the same language as the user':'in '+S.lang}. Use Markdown.\n\nDocument:\n"""\n${docText||'(empty)'}\n"""`;
  if (S.provider==='gemini') return callGemini(prompt, sys, S.apiKeys.gemini, expectJson);
  if (S.provider==='openai') return callOpenAI(prompt, sys, S.apiKeys.openai, expectJson);
  if (S.provider==='claude') return callClaude(prompt, sys, S.apiKeys.claude, expectJson);
  throw new Error('Unknown provider');
}

async function callGemini(p, sys, key, json) {
  const url  = `https://generativelanguage.googleapis.com/v1beta/models/${S.model}:generateContent?key=${key}`;
  const body = { contents:[{parts:[{text:p}]}], systemInstruction:{parts:[{text:sys}]}, generationConfig:{temperature:.7,maxOutputTokens:4096,...(json?{responseMimeType:'application/json'}:{})} };
  const r    = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if (!r.ok) { const err=await r.json().catch(()=>({})); throw new Error(err?.error?.message || `HTTP ${r.status}`); }
  const d    = await r.json(); if (d.error) throw new Error(d.error.message);
  const t    = d.candidates?.[0]?.content?.parts?.[0]?.text; if (!t) throw new Error('Empty response');
  return json ? JSON.parse(t) : t;
}
async function callOpenAI(p, sys, key, json) {
  const body = { model:S.model, messages:[{role:'system',content:sys},{role:'user',content:p}], temperature:.7 };
  if (json) body.response_format = { type:'json_object' };
  const r = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(body)});
  const d = await r.json(); if (d.error) throw new Error(d.error.message);
  const t = d.choices?.[0]?.message?.content; return json ? JSON.parse(t) : (t || 'No response');
}
async function callClaude(p, sys, key, json) {
  const body = { model:S.model, max_tokens:4096, system:sys, messages:[{role:'user',content:p}] };
  const r    = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)});
  const d    = await r.json(); if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
  const t    = d.content?.[0]?.text; return json ? JSON.parse(t) : (t || 'No response');
}

async function insertSummary() {
  if (!ed.innerText.trim()) { showToast('⚠️ Document is empty'); return; }
  if (!S.apiKeys[S.provider]) { openApiModal(); return; }
  showLoading('Summarizing…');
  try {
    const s = await callAI('Summarize this document in 3–5 sentences. Return only the summary.', ed.innerText);
    hideLoading();
    ed.innerHTML = `<div class="ai-note"><div class="ai-note-lbl">✦ AI Summary</div>${s}</div><p>\u200b</p>` + ed.innerHTML;
    savePage();
  } catch(e) { hideLoading(); showToast('⚠️ ' + e.message); }
}

// Flashcards
let _fcs = [], _fci = 0;
async function generateFlashcards() {
  if (!ed.innerText.trim()) { showToast('⚠️ Empty document'); return; }
  if (!S.apiKeys[S.provider]) { openApiModal(); return; }
  openModal('flash-modal');
  document.getElementById('fcont').innerHTML = '<p style="color:var(--tx3);font-size:.78rem;text-align:center;padding:2rem">Generating flashcards…</p>';
  try {
    const res = await callAI('Generate 8–12 flashcards. JSON only: {"cards":[{"front":"q","back":"a"}]}', ed.innerText, true);
    _fcs = res.cards || []; _fci = 0; renderFC();
  } catch(e) { document.getElementById('fcont').innerHTML = `<p style="color:var(--red);font-size:.78rem;padding:2rem;text-align:center">Error: ${e.message}</p>`; }
}
function renderFC() {
  if (!_fcs.length) return;
  const c = _fcs[_fci];
  document.getElementById('fprog').textContent = `${_fci+1} / ${_fcs.length}`;
  document.getElementById('fcont').innerHTML = `<div class="fc" id="fc" onclick="flipCard()" style="width:100%;height:200px"><div class="fci"><div class="fcf" style="background:var(--bg);border:1px solid var(--br);font-size:.88rem;color:#fff">${c.front}</div><div class="fcf fcb" style="background:color-mix(in srgb,var(--acc) 8%,var(--bg));border:1px solid color-mix(in srgb,var(--acc) 28%,transparent);font-size:.84rem;color:var(--tx)">${c.back}</div></div></div><p style="font-size:.68rem;color:var(--tx3)">Click or Space to flip</p>`;
}
function flipCard() { document.getElementById('fc')?.classList.toggle('flip'); }
function nextCard() { if (_fci < _fcs.length-1) { _fci++; renderFC(); } }
function prevCard() { if (_fci > 0) { _fci--; renderFC(); } }

// Quiz
let _qd = [], _qi = 0, _qs = 0;
async function generateQuiz() {
  if (!ed.innerText.trim()) { showToast('⚠️ Empty document'); return; }
  if (!S.apiKeys[S.provider]) { openApiModal(); return; }
  openModal('quiz-modal');
  document.getElementById('qcont').innerHTML = '<p style="color:var(--tx3);font-size:.78rem;text-align:center;padding:2rem">Generating quiz…</p>';
  try {
    const res = await callAI('5–8 multiple choice questions. JSON only: {"questions":[{"q":"question","options":["A","B","C","D"],"answer":0}]}', ed.innerText, true);
    _qd = res.questions || []; _qi = 0; _qs = 0; renderQ();
  } catch(e) { document.getElementById('qcont').innerHTML = `<p style="color:var(--red);font-size:.78rem;padding:2rem;text-align:center">Error: ${e.message}</p>`; }
}
function renderQ() {
  if (!_qd.length) return;
  if (_qi >= _qd.length) {
    document.getElementById('qcont').innerHTML = `<div style="text-align:center;padding:2rem"><div style="font-size:2.2rem;margin-bottom:10px">${_qs>=_qd.length*.8?'🎉':'📚'}</div><h3 style="font-size:.94rem;font-weight:700;color:#fff;margin-bottom:4px">Done!</h3><p style="font-size:.82rem;color:var(--tx2)">Score: <strong style="color:var(--acc)">${_qs} / ${_qd.length}</strong> (${Math.round(_qs/_qd.length*100)}%)</p><button onclick="generateQuiz()" style="margin-top:13px;padding:7px 16px;background:var(--acc);border:none;border-radius:7px;color:#0f1012;font-weight:700;cursor:pointer;font-size:.78rem;font-family:'DM Sans',sans-serif">Try again</button></div>`;
    document.getElementById('qprog').textContent = 'Done!'; return;
  }
  const q = _qd[_qi];
  document.getElementById('qprog').textContent = `${_qi+1}/${_qd.length} · ${_qs} pts`;
  document.getElementById('qcont').innerHTML = `<div><p style="font-size:.85rem;font-weight:600;color:#fff;margin-bottom:11px;line-height:1.5">${q.q}</p>${q.options.map((o,i)=>`<button onclick="answerQ(${i})" style="width:100%;text-align:left;padding:8px 12px;background:var(--bg);border:1px solid var(--br);border-radius:7px;color:var(--tx);cursor:pointer;font-size:.77rem;margin-bottom:4px;transition:all .13s;font-family:'DM Sans',sans-serif" onmouseover="this.style.borderColor='var(--acc)'" onmouseout="this.style.borderColor='var(--br)'">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}</div>`;
}
function answerQ(idx) {
  const q=_qd[_qi]; const ok=idx===q.answer; if(ok) _qs++;
  document.querySelectorAll('#qcont button').forEach((b,i)=>{
    b.disabled=true; b.onmouseover=null; b.onmouseout=null;
    if(i===q.answer){b.style.background='#5ab27a20';b.style.borderColor='var(--grn)';b.style.color='var(--grn)';}
    else if(i===idx&&!ok){b.style.background='#e0555520';b.style.borderColor='var(--red)';b.style.color='var(--red)';}
  });
  setTimeout(() => { _qi++; renderQ(); }, 1200);
}

async function doAISplit(e) {
  if (!S.currentProject) return showToast('⚠️ Open a project first');
  if (!S.apiKeys[S.provider]) { openApiModal(); return; }
  const file = e.target.files[0]; if (!file) return;
  showLoading('AI splitting document…');
  try {
    let text = '';
    if (file.type==='text/plain') text = await file.text();
    else if (file.type==='application/pdf') {
      const pdf = await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
      for(let i=1;i<=pdf.numPages;i++) text += (await(await pdf.getPage(i)).getTextContent()).items.map(x=>x.str).join(' ')+'\n';
    }
    if (!text.trim()) throw new Error('Empty or unreadable file');
    const res = await callAI(`Split into sections. JSON only: {"folderName":"name","sections":[{"title":"t","content":"html"}]}\n\n${text.slice(0,80000)}`,'',true);
    if (res?.sections) {
      const proj = S.projects.find(p=>p.id===S.currentProject);
      const fid  = 'f_'+Date.now();
      proj.items.push({id:fid,type:'folder',title:res.folderName||'Import',parentId:null});
      res.sections.forEach((s,i)=>proj.items.push({id:'p_'+Date.now()+'_'+i,type:'page',title:s.title||`Section ${i+1}`,parentId:fid,content:s.content||'',tags:[],pinned:false}));
      proj.updated=Date.now(); persistAll(); renderTree();
      const fp=proj.items.find(i=>i.parentId===fid&&i.type==='page');
      if (fp) openPage(fp.id);
      showToast(`✓ Imported ${res.sections.length} sections`);
    } else throw new Error('Bad AI response format');
  } catch(err) { showToast('⚠️ '+err.message); }
  finally { hideLoading(); e.target.value=''; }
}

// ══════════════════════════════════════════
//  API KEY MODAL
// ══════════════════════════════════════════
let _curProv = 'gemini';
function openApiModal() {
  _curProv = S.provider;
  updateApiTabs(_curProv);
  document.getElementById('apikinp').value = S.apiKeys[_curProv] || '';
  openModal('api-modal');
}
function switchProv(p, btn) {
  _curProv = p; updateApiTabs(p);
  document.getElementById('apikinp').value = S.apiKeys[p] || '';
  document.getElementById('apst').style.display = 'none';
}
function updateApiTabs(p) {
  document.querySelectorAll('.api-tab').forEach(b => {
    const on = b.dataset.prov === p;
    b.style.background = on ? 'var(--acc)' : 'transparent';
    b.style.color      = on ? '#0f1012'    : 'var(--tx3)';
  });
  const prov = PROV[p] || PROV.gemini;
  const ms   = document.getElementById('msel'); ms.innerHTML = '';
  (prov.models||[]).forEach(m => { const o=document.createElement('option'); o.value=m; o.textContent=m; ms.appendChild(o); });
  ms.value = (S.provider===p ? S.model : null) || prov.models[0];
  document.getElementById('apinfo').innerHTML = prov.info || '';
  document.getElementById('apikinp').placeholder = prov.ph || 'API key…';
}

async function saveApiKey() {
  const key   = document.getElementById('apikinp').value.trim();
  const model = document.getElementById('msel').value;
  const st    = document.getElementById('apst');
  if (!key) { showSt(st,'Please enter a key','err'); return; }
  showSt(st,'Validating…','neu');
  try {
    if (_curProv==='gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:'Hi'}]}]})});
      const d = await r.json(); if (d.error) throw new Error(d.error.message);
    } else if (_curProv==='openai') {
      const r = await fetch('https://api.openai.com/v1/models',{headers:{'Authorization':`Bearer ${key}`}});
      const d = await r.json(); if (d.error) throw new Error(d.error.message);
    }
    S.apiKeys[_curProv]=key; S.provider=_curProv; S.model=model;
    localStorage.setItem('z_keys',JSON.stringify(S.apiKeys));
    localStorage.setItem('z_provider',S.provider);
    localStorage.setItem('z_model',S.model);
    showSt(st,'✓ Key saved. AI features active.','ok');
    updateApiUI(); setTimeout(()=>closeModal('api-modal'),1200);
  } catch(err) { showSt(st,'✕ '+err.message,'err'); }
}

function showSt(el, msg, type) {
  const styles = { ok:'#5ab27a18,#5ab27a40,#5ab27a', err:'#e0555518,#e0555540,var(--red)', neu:'var(--bg),var(--br),var(--tx3)' };
  const [bg,br,co] = styles[type].split(',');
  el.textContent = msg;
  el.style.cssText = `display:block;padding:7px 10px;border-radius:7px;font-size:.7rem;margin-bottom:9px;background:${bg};border:1px solid ${br};color:${co}`;
}
function clearApiKey() {
  delete S.apiKeys[_curProv];
  localStorage.setItem('z_keys',JSON.stringify(S.apiKeys));
  document.getElementById('apikinp').value='';
  showSt(document.getElementById('apst'),'Key cleared.','neu');
  updateApiUI();
}

// ══════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════
function openSettings() {
  document.getElementById('persona-sel').value = S.persona;
  document.getElementById('lang-sel').value    = S.lang;
  // Sync range inputs
  const sv = (id, val) => { const el=document.getElementById(id); if(el) el.value=val; };
  sv('fs-r',  S.fontSize);   document.getElementById('fs-val').textContent  = S.fontSize + 'px';
  sv('lh-r',  S.lineHeight); document.getElementById('lh-val').textContent  = S.lineHeight.toFixed(2);
  sv('ew-r',  S.editorWidth);document.getElementById('ew-val').textContent  = S.editorWidth + 'px';
  sv('pg-r',  S.paraSpacing);pvPG(S.paraSpacing);
  sv('cw-r',  S.caretWidth); document.getElementById('cw-val').textContent  = S.caretWidth + 'px';
  sv('bs-r',  S.blinkSpeed); document.getElementById('bs-val').textContent  = S.blinkSpeed.toFixed(2) + 's';
  sv('vol-r', SFX.volume);   document.getElementById('vol-val').textContent = Math.round(SFX.volume*100) + '%';
  document.getElementById('tog-pitchvar').classList.toggle('on', SFX.pitchVar);
  document.getElementById('tog-entkey').classList.toggle('on',   SFX.specialEnter);
  document.getElementById('tog-smoothc').classList.toggle('on',  CARET.smooth);
  document.getElementById('tog-glow').classList.toggle('on',     CARET.glow);
  // Reset panels: hide all, show appearance
  document.querySelectorAll('[id^="sp-"]').forEach(p => { p.style.display='none'; });
  document.getElementById('sp-appearance').style.cssText = 'display:flex;flex-direction:column;gap:15px';
  document.querySelectorAll('.st2').forEach(b => b.classList.remove('on'));
  document.getElementById('st-appearance').classList.add('on');
  buildFontCards(); buildSoundCards(); buildCaretShapeOpts(); buildTypingToggles();
  renderPromptRows(); buildShortcutList();
  openModal('set-modal');
}

function showStab(name, btn) {
  document.querySelectorAll('.st2').forEach(b => b.classList.remove('on'));
  // Hide all panels via style (avoids fighting CSS)
  document.querySelectorAll('[id^="sp-"]').forEach(p => { p.style.display = 'none'; });
  btn.classList.add('on');
  const panel = document.getElementById('sp-' + name);
  if (panel) { panel.style.display = 'flex'; panel.style.flexDirection = 'column'; panel.style.gap = ''; }
}

function saveSettings() {
  S.persona      = document.getElementById('persona-sel').value;
  S.lang         = document.getElementById('lang-sel').value;
  S.fontSize     = parseInt(document.getElementById('fs-r').value);
  S.lineHeight   = parseFloat(document.getElementById('lh-r').value);
  S.editorWidth  = parseInt(document.getElementById('ew-r').value);
  S.paraSpacing  = parseFloat(document.getElementById('pg-r').value);
  S.caretWidth   = parseInt(document.getElementById('cw-r').value);
  S.blinkSpeed   = parseFloat(document.getElementById('bs-r').value);
  SFX.volume     = parseFloat(document.getElementById('vol-r').value);
  S.customPrompts = Array.from(document.querySelectorAll('.prow')).map((r, i) => ({
    id: 'cp_'+i, label: r.querySelector('.pl').value||'Button', prompt: r.querySelector('.pp').value||''
  })).filter(p => p.prompt.trim());
  applyAppearance();
  persistAll(); renderQuickBtns();
  closeModal('set-modal'); showToast('✓ Settings saved');
}

function renderPromptRows() {
  const c = document.getElementById('prompt-rows'); c.innerHTML = '';
  S.customPrompts.forEach(p => c.appendChild(mkPromptRow(p)));
}
function addPromptRow() { const el=mkPromptRow({label:'New button',prompt:''}); document.getElementById('prompt-rows').appendChild(el); el.querySelector('.pl').focus(); }
function mkPromptRow(p) {
  const d = document.createElement('div'); d.className='prow';
  d.style.cssText='display:flex;gap:5px;align-items:flex-start;background:var(--bg);border:1px solid var(--br);border-radius:8px;padding:9px';
  d.innerHTML=`<div style="flex:1;display:flex;flex-direction:column;gap:4px"><input class="pl" value="${p.label}" placeholder="Button name" style="background:var(--s2);border:1px solid var(--br);border-radius:6px;padding:5px 7px;font-size:.73rem;color:var(--tx);outline:none;font-family:'DM Sans',sans-serif" onfocus="this.style.borderColor='var(--acc)'" onblur="this.style.borderColor='var(--br)'"><textarea class="pp" placeholder="AI instruction…" style="background:var(--s2);border:1px solid var(--br);border-radius:6px;padding:5px 7px;font-size:.73rem;color:var(--tx);outline:none;resize:none;height:44px;font-family:'DM Sans',sans-serif" onfocus="this.style.borderColor='var(--acc)'" onblur="this.style.borderColor='var(--br)'">${p.prompt}</textarea></div><button onclick="this.parentElement.remove()" style="padding:5px;background:none;border:none;cursor:pointer;color:var(--tx3);border-radius:4px;margin-top:1px" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--tx3)'"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>`;
  lucide.createIcons({ nodes: [d] }); return d;
}

function renderQuickBtns() {
  const c = document.getElementById('qbtns'); c.innerHTML = '';
  S.customPrompts.forEach(p => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:4px 9px;background:var(--bg);border:1px solid var(--br);border-radius:20px;color:var(--tx3);cursor:pointer;font-size:.7rem;font-family:"DM Sans",sans-serif;display:flex;align-items:center;gap:3px;transition:all .15s';
    btn.innerHTML = `<i data-lucide="zap" style="width:10px;height:10px"></i>${p.label}`;
    btn.onmouseover = () => { btn.style.color='var(--acc)'; btn.style.borderColor='color-mix(in srgb,var(--acc) 40%,transparent)'; };
    btn.onmouseout  = () => { btn.style.color='var(--tx3)'; btn.style.borderColor='var(--br)'; };
    btn.onclick = () => sendAI(p.prompt);
    c.appendChild(btn);
  });
  lucide.createIcons({ nodes: [c] });
}

// ══════════════════════════════════════════
//  COMMAND PALETTE
// ══════════════════════════════════════════
let _cmdSel = 0, _cmdFiltered = COMMANDS_LIST;
function openCmd() {
  document.getElementById('cmd-bd-el').style.display = 'block';
  document.getElementById('cmdw').classList.add('open');
  const inp = document.getElementById('cmdi'); inp.value = '';
  _cmdFiltered = COMMANDS_LIST; _cmdSel = 0; renderCmdList();
  setTimeout(() => inp.focus(), 60);
}
function closeCmd() {
  document.getElementById('cmd-bd-el').style.display = 'none';
  document.getElementById('cmdw').classList.remove('open');
}
function filterCmd(q) {
  _cmdFiltered = q ? COMMANDS_LIST.filter(c => c.l.toLowerCase().includes(q.toLowerCase()) || c.cat.toLowerCase().includes(q.toLowerCase())) : COMMANDS_LIST;
  _cmdSel = 0; renderCmdList();
}
function renderCmdList() {
  const list = document.getElementById('cmdl'); list.innerHTML = '';
  if (!_cmdFiltered.length) { list.innerHTML='<p style="padding:12px;color:var(--tx3);font-size:.78rem;text-align:center">No commands found</p>'; return; }
  let lastCat = '';
  _cmdFiltered.forEach((c, i) => {
    if (c.cat !== lastCat) {
      const grp = document.createElement('div'); grp.className='cmgrp'; grp.textContent=c.cat; list.appendChild(grp); lastCat=c.cat;
    }
    const el = document.createElement('div');
    el.className = 'cmi' + (i === _cmdSel ? ' sel' : '');
    el.innerHTML = `<i data-lucide="${c.ico}" style="width:13px;height:13px;color:var(--tx3);flex-shrink:0"></i><span>${c.l}</span>${c.sc?`<span class="cmcat">${c.sc}</span>`:''}`;
    el.onclick = () => { closeCmd(); c.a(); };
    list.appendChild(el);
  });
  lucide.createIcons({ nodes: [list] });
}
function cmdKey(e) {
  const items = document.querySelectorAll('.cmi');
  if      (e.key==='ArrowDown') { e.preventDefault(); _cmdSel=Math.min(_cmdSel+1,items.length-1); }
  else if (e.key==='ArrowUp')   { e.preventDefault(); _cmdSel=Math.max(0,_cmdSel-1); }
  else if (e.key==='Enter')     { e.preventDefault(); items[_cmdSel]?.click(); return; }
  else if (e.key==='Escape')    { closeCmd(); return; }
  items.forEach((el,i) => el.classList.toggle('sel', i===_cmdSel));
  items[_cmdSel]?.scrollIntoView({ block:'nearest' });
}

// ══════════════════════════════════════════
//  MODAL HELPERS
// ══════════════════════════════════════════
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

let _nameCb = null;
function showNameModal(title, initial, cb, btnLabel='Create') {
  _nameCb = cb;
  document.getElementById('nmt').textContent   = title;
  document.getElementById('nmbtn').textContent = btnLabel;
  const inp = document.getElementById('nmi'); inp.value=initial||''; inp.placeholder='Enter name…';
  openModal('name-modal'); setTimeout(()=>{ inp.focus(); if(initial) inp.select(); }, 80);
}
function confirmName() {
  const v = document.getElementById('nmi').value.trim(); if (!v) return;
  const cb = _nameCb; closeModal('name-modal'); _nameCb = null; if (cb) cb(v);
}

let _confCb = null;
function showConfirm(msg, cb) {
  _confCb = cb;
  document.getElementById('confmsg').textContent = msg;
  document.getElementById('confbtn').onclick = () => { closeModal('confirm-modal'); if(_confCb)_confCb(); _confCb=null; };
  openModal('confirm-modal');
}

function showLoading(msg='Processing…') { document.getElementById('ldmsg').textContent=msg; document.getElementById('ldov').style.display='flex'; }
function hideLoading()                   { document.getElementById('ldov').style.display='none'; }
function showToast(msg) {
  const t = document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2600);
}

// ══════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════
function relTime(ts) {
  const d=Date.now()-ts, m=Math.floor(d/60000), h=Math.floor(d/3600000), days=Math.floor(d/86400000);
  if (d < 60000)  return 'just now';
  if (m < 60)     return `${m}m ago`;
  if (h < 24)     return `${h}h ago`;
  if (days === 1) return 'yesterday';
  return new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}

// ══════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════
init();
