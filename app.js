'use strict';

/*
  CFA Study Hub v3
  - Keeps the original progress, activity, wrong-answer, and chat storage keys.
  - Replaces fragile prompt-only JSON with server-side structured outputs.
  - Makes the Ahmed Study Guide the main learning path.
*/

const CURRICULUM = {
  QM: { name: 'Quantitative Methods', weightPct: '6–9%', readings: [
    ['1.1','Interest Rates and Return Measurement',25],
    ['1.2','Time-Weighted and Money-Weighted Returns',15],
    ['1.3','Common Measures of Return',20],
    ['2.1','Discounted Cash Flow Valuation',25],
    ['2.2','Implied Returns and Cash Flow Additivity',30],
    ['3.1','Central Tendency and Dispersion',35],
    ['3.2','Skewness, Kurtosis, and Correlation',30],
    ['4.1','Probability Models, Expected Values, and Bayes\' Formula',20],
    ['5.1','Probability Models for Portfolio Return and Risk',30],
    ['6.1','Lognormal Distributions and Simulation Techniques',10],
    ['7.1','Sampling Techniques and the Central Limit Theorem',25],
    ['8.1','Hypothesis Testing Basics',20],
    ['8.2','Types of Hypothesis Tests',60],
    ['9.1','Tests for Independence',15],
    ['10.1','Linear Regression Basics',40],
    ['10.2','Analysis of Variance (ANOVA) and Goodness of Fit',25],
    ['10.3','Predicted Values and Functional Forms of Regression',15],
    ['11.1','Introduction to Fintech',20]
  ]},
  ECO: { name: 'Economics', weightPct: '6–9%', readings: [
    ['12.1','Breakeven, Shutdown, and Scale',25],
    ['12.2','Characteristics of Market Structures',40],
    ['12.3','Identifying Market Structures',10],
    ['13.1','Business Cycles',25],
    ['14.1','Fiscal Policy Objectives',10],
    ['14.2','Fiscal Policy Tools and Implementation',20],
    ['15.1','Central Bank Objectives and Tools',20],
    ['15.2','Monetary Policy Effects and Limitations',20],
    ['16.1','Geopolitics',30],
    ['17.1','International Trade',30],
    ['18.1','The Foreign Exchange Market',20],
    ['18.2','Managing Exchange Rates',15],
    ['19.1','Foreign Exchange Rates',20]
  ]},
  CI: { name: 'Corporate Issuers', weightPct: '6–9%', readings: [
    ['21.1','Stakeholders and ESG Factors',25],
    ['22.1','Corporate Governance',30],
    ['23.1','Liquidity Measures and Management',30],
    ['24.1','Capital Investments and Project Measures',30],
    ['24.2','Capital Allocation Principles and Real Options',10],
    ['25.1','Weighted-Average Cost of Capital',10],
    ['25.2','Capital Structure Theories',40],
    ['26.1','Business Model Features and Types',15]
  ]},
  FSA: { name: 'Financial Statement Analysis', weightPct: '11–14%', readings: [
    ['27.1','Financial Statement Roles',40],
    ['28.1','Revenue Recognition',20],
    ['28.2','Expense Recognition',55],
    ['28.3','Nonrecurring Items',10],
    ['28.4','Earnings Per Share',35],
    ['28.5','Ratios and Common-Size Income Statements',10],
    ['29.1','Intangible Assets and Marketable Securities',35],
    ['29.2','Common-Size Balance Sheets',15],
    ['30.1','Cash Flow Introduction and Direct Method CFO',35],
    ['30.2','Indirect Method CFO',20],
    ['30.3','Investing and Financing Cash Flows and IFRS/U.S. GAAP Differences',45],
    ['31.1','Analyzing Statements of Cash Flows II',35],
    ['32.1','Inventory Measurement',15],
    ['32.2','Inflation Impact on FIFO and LIFO',25],
    ['32.3','Presentation and Disclosure',25],
    ['33.1','Intangible Long-Lived Assets',10],
    ['33.2','Impairment and Derecognition',20],
    ['33.3','Long-Term Asset Disclosures',15],
    ['34.1','Leases',40],
    ['34.2','Deferred Compensation and Disclosures',35],
    ['35.1','Differences Between Accounting Profit and Taxable Income',25],
    ['35.2','Deferred Tax Assets and Liabilities',20],
    ['35.3','Tax Rates and Disclosures',20],
    ['36.1','Reporting Quality',30],
    ['36.2','Accounting Choices and Estimates',20],
    ['36.3','Warning Signs',10],
    ['37.1','Introduction to Financial Ratios',25],
    ['37.2','Financial Ratios, Part 1',20],
    ['37.3','Financial Ratios, Part 2',35],
    ['37.4','DuPont Analysis',20],
    ['37.5','Industry-Specific Financial Ratios',10],
    ['38.1','Financial Statement Modeling',30]
  ]},
  EI: { name: 'Equity Investments', weightPct: '11–14%', readings: [
    ['39.1','Markets, Assets, and Intermediaries',45],
    ['39.2','Positions and Leverage',15],
    ['39.3','Order Execution and Validity',40],
    ['40.1','Index Weighting Methods',35],
    ['40.2','Uses and Types of Indexes',25],
    ['41.1','Market Efficiency',40],
    ['42.1','Types of Equity Investments',10],
    ['42.2','Foreign Equities and Equity Risk',25],
    ['43.1','Company Research Reports',5],
    ['43.2','Revenue, Profitability, and Capital',20],
    ['44.1','Industry Analysis',30],
    ['44.2','Industry Structure and Competitive Positioning',30],
    ['45.1','Forecasting in Company Analysis',35],
    ['46.1','Dividends, Splits, and Repurchases',15],
    ['46.2','Dividend Discount Models',45],
    ['46.3','Relative Valuation Measures',45]
  ]},
  FI: { name: 'Fixed Income', weightPct: '11–14%', readings: [
    ['47.1','Fixed-Income Instrument Features',20],
    ['48.1','Fixed-Income Cash Flows and Types',35],
    ['49.1','Fixed-Income Issuance and Trading',25],
    ['50.1','Fixed-Income Markets for Corporate Issuers',35],
    ['51.1','Fixed-Income Markets for Government Issuers',15],
    ['52.1','Fixed-Income Bond Valuation: Prices and Yields',35],
    ['53.1','Yield and Yield Spread Measures for Fixed-Rate Bonds',35],
    ['54.1','Yield and Yield Spread Measures for Floating-Rate Instruments',15],
    ['55.1','The Term Structure of Interest Rates: Spot, Par, and Forward Curves',35],
    ['56.1','Interest Rate Risk and Return',35],
    ['57.1','Yield-Based Bond Duration Measures and Properties',20],
    ['58.1','Yield-Based Bond Convexity and Portfolio Properties',25],
    ['59.1','Curve-Based and Empirical Fixed-Income Risk Measures',25],
    ['60.1','Credit Risk',40],
    ['61.1','Credit Analysis for Government Issuers',10],
    ['62.1','Credit Analysis for Corporate Issuers',30],
    ['63.1','Fixed-Income Securitization',20],
    ['64.1','Asset-Backed Security (ABS) Instrument and Market Features',25],
    ['65.1','Mortgage-Backed Security (MBS) Instrument and Market Features',40]
  ]},
  DER: { name: 'Derivatives', weightPct: '5–8%', readings: [
    ['66.1','Derivatives Markets',25],
    ['67.1','Forwards and Futures',10],
    ['67.2','Swaps and Options',30],
    ['68.1','Uses, Benefits, and Risks of Derivatives',20],
    ['69.1','Arbitrage, Replication, and Carrying Costs',20],
    ['70.1','Forward Contract Valuation',15],
    ['71.1','Futures Valuation',10],
    ['72.1','Swap Valuation',10],
    ['73.1','Option Valuation',30],
    ['74.1','Put-Call Parity',15],
    ['75.1','Binomial Model for Option Values',25]
  ]},
  AI: { name: 'Alternative Investments', weightPct: '7–10%', readings: [
    ['76.1','Alternative Investment Structures',20],
    ['77.1','Performance Appraisal and Return Calculations',35],
    ['78.1','Private Capital',20],
    ['79.1','Real Estate',15],
    ['79.2','Infrastructure',5],
    ['80.1','Farmland, Timberland, and Commodities',15],
    ['81.1','Hedge Funds',20],
    ['82.1','Distributed Ledger Technology',20],
    ['82.2','Digital Asset Characteristics',20]
  ]},
  PM: { name: 'Portfolio Management', weightPct: '8–12%', readings: [
    ['83.1','Historical Risk and Return',5],
    ['83.2','Risk Aversion',15],
    ['83.3','Portfolio Standard Deviation',15],
    ['83.4','The Efficient Frontier',15],
    ['84.1','Systematic Risk and Beta',40],
    ['84.2','The CAPM and the SML',45],
    ['85.1','Portfolio Management Process',15],
    ['85.2','Asset Management and Pooled Investments',15],
    ['86.1','Portfolio Planning and Construction',35],
    ['87.1','Cognitive Errors vs. Emotional Biases',30],
    ['87.2','Emotional Biases',20],
    ['88.1','Introduction to Risk Management',30]
  ]},
  ETH: { name: 'Ethical and Professional Standards', weightPct: '15–20%', readings: [
    ['89.1','Ethics and Trust',20],
    ['90.1','Code and Standards',30],
    ['91.1','Guidance for Standards I(A) and I(B)',20],
    ['91.2','Guidance for Standards I(C), I(D), and I(E)',10],
    ['91.3','Guidance for Standard II',5],
    ['91.4','Guidance for Standards III(A) and III(B)',10],
    ['91.5','Guidance for Standards III(C), III(D), and III(E)',10],
    ['91.6','Guidance for Standard IV',15],
    ['91.7','Guidance for Standard V',15],
    ['91.8','Guidance for Standard VI',10],
    ['91.9','Guidance for Standard VII',5],
    ['92.1','Introduction to GIPS',10],
    ['93.1','Ethics Application',25]
  ]}
};

const LOOKUP = {};
for (const [areaCode, area] of Object.entries(CURRICULUM)) {
  area.readings = area.readings.map(([num, title, minutes]) => ({ num, title, minutes }));
  for (const reading of area.readings) LOOKUP[reading.num] = { ...reading, areaCode, areaName: area.name };
}

const STAGES = [
  ['Map','Where this topic sits'],
  ['Problem','Why the concept exists'],
  ['Intuition','Plain English first'],
  ['Mechanism','Every cause-and-effect link'],
  ['Formula Lab','Build formulas from logic'],
  ['Worked Example','Expose every step'],
  ['Understanding Check','Reason before calculating'],
  ['CFA Translation','Convert intuition into exam wording'],
  ['Practice','Progressive CFA questions'],
  ['Mistake Diagnosis','Find the exact missing layer'],
  ['Teach It Back','Prove the mental model'],
  ['Exam Summary','Compress what you now understand']
];

const K = {
  progress: 'study:cfa:progress',
  activity: 'study:activity',
  freeze: 'study:freeze',
  wrong: 'study:wrong:',
  chat: 'study:chat:',
  guide: 'study:guide:',
  practice: 'study:practice:',
  stages: 'study:stages:',
  teachback: 'study:teachback:',
  auth: 'study:auth_token',
  worker: 'study:worker_base',
  seeded: 'study:seeded_v3'
};

const DEFAULT_WORKER = 'https://cfa-study-hub.ahmed1979fcb.workers.dev';
const PRESEED_COMPLETE = ['12.1','12.2','12.3','13.1','14.1','14.2','15.1','15.2','16.1','17.1','18.1','18.2','19.1','83.1','83.2','83.3','83.4','87.1','87.2','76.1','47.1','48.1','49.1','21.1','22.1'];
const PRESEED_IN_PROGRESS = ['23.1'];

const state = {
  tab: 'today',
  view: 'home',
  readingId: null,
  guideStage: 0,
  areaOpen: {},
  loading: null,
  error: null,
  retry: null,
  quiz: null,
  chatOpen: false,
  syncedOnce: false
};

const app = document.getElementById('app');
const toastRoot = document.getElementById('toast-root');
let noteSaveTimer = null;
let syncTimer = null;
const syncQueue = new Map();

function dom(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined && options.text !== null) element.textContent = String(options.text);
  if (options.type) element.type = options.type;
  if (options.value !== undefined) element.value = options.value;
  if (options.placeholder) element.placeholder = options.placeholder;
  if (options.title) element.title = options.title;
  if (options.name) element.name = options.name;
  if (options.id) element.id = options.id;
  if (options.href) element.href = options.href;
  if (options.min !== undefined) element.min = options.min;
  if (options.max !== undefined) element.max = options.max;
  if (options.rows !== undefined) element.rows = options.rows;
  if (options.disabled !== undefined) element.disabled = options.disabled;
  if (options.checked !== undefined) element.checked = options.checked;
  if (options.autocomplete) element.autocomplete = options.autocomplete;
  if (options.dataset) Object.assign(element.dataset, options.dataset);
  if (options.attrs) for (const [key, value] of Object.entries(options.attrs)) element.setAttribute(key, value);
  if (options.onClick) element.addEventListener('click', options.onClick);
  if (options.onInput) element.addEventListener('input', options.onInput);
  if (options.onChange) element.addEventListener('change', options.onChange);
  if (options.onSubmit) element.addEventListener('submit', options.onSubmit);
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function getJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.error('Storage read failed', key, error);
    return fallback;
  }
}
function setJSON(key, value, sync = true) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { console.error('Storage write failed', key, error); toast('Could not save locally', 'bad'); }
  if (sync && key.startsWith('study:') && ![K.auth, K.worker].includes(key)) queueCloudSync(key, JSON.stringify(value));
}
function getText(key, fallback = '') { return localStorage.getItem(key) || fallback; }
function setText(key, value) { localStorage.setItem(key, value); }
function todayString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function workerBase() { return getText(K.worker, DEFAULT_WORKER).replace(/\/$/, ''); }
function authToken() { return getText(K.auth, '').trim(); }
function reading(id) { return LOOKUP[id]; }
function allReadings() { return Object.values(CURRICULUM).flatMap(area => area.readings); }
function statusLabel(status) { return (status || 'not_started').replaceAll('_', ' '); }
function fingerprint(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}-${(hash >>> 0).toString(16)}`;
}
function escapeForLog(value) { return String(value || '').slice(0, 1200); }

function toast(message, type = '') {
  const item = dom('div', { className: `toast ${type}`, text: message });
  toastRoot.append(item);
  window.setTimeout(() => item.remove(), 3200);
}

function headerBlock(eyebrow, title, body) {
  return dom('div', {}, [
    dom('div', { className: 'eyebrow', text: eyebrow }),
    dom('h1', { text: title }),
    body ? dom('p', { className: 'muted', text: body }) : null
  ]);
}

function button(label, style = 'primary', onClick, extraClass = '') {
  return dom('button', { className: `btn ${style} ${extraClass}`.trim(), type: 'button', text: label, onClick });
}

function card(children, extra = '') { return dom('section', { className: `card ${extra}`.trim() }, children); }
function pill(text, kind = '') { return dom('span', { className: `pill ${kind}`.trim(), text }); }

async function ensureProgress() {
  const progress = getJSON(K.progress, {});
  let changed = false;
  for (const item of allReadings()) {
    if (!progress[item.num]) {
      progress[item.num] = { status: 'not_started', notes: '', wrongCount: 0 };
      changed = true;
    } else {
      if (!progress[item.num].status) { progress[item.num].status = 'not_started'; changed = true; }
      if (typeof progress[item.num].notes !== 'string') { progress[item.num].notes = ''; changed = true; }
      if (!Number.isFinite(progress[item.num].wrongCount)) { progress[item.num].wrongCount = 0; changed = true; }
    }
  }
  if (!getJSON(K.seeded, false)) {
    for (const id of PRESEED_COMPLETE) if (progress[id] && progress[id].status === 'not_started') progress[id].status = 'complete';
    for (const id of PRESEED_IN_PROGRESS) if (progress[id] && progress[id].status === 'not_started') progress[id].status = 'in_progress';
    setJSON(K.seeded, true);
    changed = true;
  }
  if (changed) setJSON(K.progress, progress);
  return progress;
}

function recordActivity(points, areaCode) {
  const activity = getJSON(K.activity, {});
  const key = todayString();
  const day = activity[key] || { total: 0, areas: {} };
  day.total += points;
  if (areaCode) day.areas[areaCode] = (day.areas[areaCode] || 0) + points;
  activity[key] = day;
  setJSON(K.activity, activity);
}

function computeStreak() {
  const activity = getJSON(K.activity, {});
  let streak = 0;
  const cursor = new Date();
  if (!activity[todayString(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const key = todayString(cursor);
    if (activity[key] && activity[key].total > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

function queueCloudSync(key, value) {
  if (!authToken()) return;
  syncQueue.set(key, value);
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(flushCloudSync, 700);
}

async function flushCloudSync() {
  if (!authToken() || syncQueue.size === 0) return;
  const batch = [...syncQueue.entries()];
  syncQueue.clear();
  for (const [key, value] of batch) {
    try {
      await apiRequest('/sync/set', { key, value }, { timeoutMs: 15000 });
    } catch (error) {
      console.error('Cloud sync failed', key, error);
      syncQueue.set(key, value);
    }
  }
}

async function pullFromCloud({ silent = false } = {}) {
  if (!authToken()) return false;
  try {
    const data = await apiRequest('/sync/list', null, { method: 'GET', timeoutMs: 30000 });
    for (const [key, value] of Object.entries(data?.items || {})) {
      if (key.startsWith('study:') && typeof value === 'string') localStorage.setItem(key, value);
    }
    state.syncedOnce = true;
    return true;
  } catch (error) {
    console.error('Cloud pull failed', error);
    if (silent) return false;
    throw error;
  }
}

async function readSSEBody(body) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let assembled = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        let evt;
        try { evt = JSON.parse(raw); } catch { continue; }
        if (evt.type === 'content_block_delta') {
          if (evt.delta?.type === 'text_delta') {
            assembled += evt.delta.text || '';
          } else if (evt.delta?.type === 'input_json_delta') {
            assembled += evt.delta.partial_json || '';
          }
        } else if (evt.type === 'error') {
          const err = new Error(evt.error?.message || 'AI stream error');
          err.code = 'AI_STREAM_ERROR';
          err.status = 502;
          throw err;
        }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  return assembled;
}

async function apiRequest(path, payload, options = {}) {
  const token = authToken();
  if (!token) {
    const error = new Error('Your private app access key is not set. Open Settings and enter the APP_TOKEN configured in Cloudflare.');
    error.code = 'AUTH_MISSING';
    throw error;
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || 90000);
  try {
    const response = await fetch(`${workerBase()}${path}`, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: (options.method === 'GET' || payload === null) ? undefined : JSON.stringify(payload),
      signal: controller.signal
    });
    const requestId = response.headers.get('x-request-id') || '';

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      if (!response.ok) {
        const err = new Error(`Request failed with HTTP ${response.status}`);
        err.status = response.status;
        err.code = 'HTTP_ERROR';
        err.requestId = requestId;
        throw err;
      }
      const assembled = await readSSEBody(response.body);
      if (!assembled) {
        const err = new Error('The AI returned an empty response. Please try again.');
        err.code = 'EMPTY_AI_RESPONSE';
        err.requestId = requestId;
        throw err;
      }
      let data;
      try { data = JSON.parse(assembled); } catch {
        const err = new Error('The AI response could not be parsed. Please try again.');
        err.code = 'INVALID_AI_JSON';
        err.requestId = requestId;
        throw err;
      }
      return data;
    }

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!response.ok) {
      const message = (typeof data?.error === 'string' ? data.error : data?.error?.message) || data?.message || `Request failed with HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.code = data?.code || data?.error?.code || 'HTTP_ERROR';
      error.requestId = requestId || data?.requestId || '';
      error.details = data?.details || data?.error?.details || '';
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('The request timed out before the Worker returned a complete response. No automatic paid retry was made.');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function setError(error, retry) {
  state.error = {
    message: error?.message || 'Unknown error',
    code: error?.code || 'UNKNOWN',
    requestId: error?.requestId || '',
    details: error?.details || ''
  };
  state.retry = retry || null;
  state.loading = null;
  state.view = 'error';
  render();
}

function goHome(tab = state.tab) {
  state.tab = tab;
  state.view = 'home';
  state.readingId = null;
  state.error = null;
  state.loading = null;
  state.chatOpen = false;
  render();
}

function topbar() {
  return dom('header', { className: 'topbar' }, [
    dom('div', { className: 'brand' }, [
      dom('div', { className: 'brand-mark', text: 'A' }),
      dom('div', {}, [dom('h1', { text: 'CFA Study Hub' }), dom('p', { text: 'Understand the mechanism. Then learn the exam.' })])
    ]),
    dom('div', { className: 'top-actions' }, [
      pill(`${computeStreak()} day streak`, computeStreak() ? 'complete' : '')
    ])
  ]);
}

function bottomNav() {
  const nav = dom('nav', { className: 'bottom-nav', attrs: { 'aria-label': 'Primary navigation' } });
  const tabs = [['today','Today'],['cfa','CFA'],['stats','Stats'],['settings','Settings']];
  for (const [key, label] of tabs) {
    nav.append(dom('button', {
      className: `nav-btn ${state.tab === key && state.view === 'home' ? 'active' : ''}`,
      type: 'button', text: label,
      onClick: () => goHome(key)
    }));
  }
  return nav;
}

async function render() {
  clear(app);
  app.append(topbar());
  const main = dom('main');
  app.append(main);

  if (state.loading) renderLoading(main);
  else if (state.view === 'error') renderError(main);
  else if (state.view === 'reading') await renderReading(main);
  else if (state.view === 'guide') await renderGuide(main);
  else if (state.tab === 'today') await renderToday(main);
  else if (state.tab === 'cfa') await renderCFA(main);
  else if (state.tab === 'stats') await renderStats(main);
  else if (state.tab === 'settings') renderSettings(main);

  app.append(bottomNav());
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderLoading(main) {
  const labels = state.loading.steps || [];
  const wrap = dom('div', { className: 'loading-wrap' }, [
    dom('div', {}, [
      dom('div', { className: 'spinner' }),
      dom('h2', { text: state.loading.title || 'Building your lesson' }),
      dom('p', { className: 'muted', text: state.loading.message || 'The app is building a structured explanation without skipping logical steps.' })
    ])
  ]);
  if (labels.length) {
    const stepWrap = dom('div', { className: 'loading-steps' });
    labels.forEach((label, index) => stepWrap.append(dom('div', {
      className: `loading-step ${index < state.loading.active ? 'done' : index === state.loading.active ? 'active' : ''}`,
      text: `${index < state.loading.active ? '✓' : index === state.loading.active ? '●' : '○'} ${label}`
    })));
    wrap.firstChild.append(stepWrap);
  }
  main.append(wrap);
}

function renderError(main) {
  main.append(headerBlock('Something failed', 'The app stopped at the failing layer', 'It did not silently retry or charge for another request.'));
  const panel = dom('div', { className: 'error-panel' }, [
    dom('strong', { text: state.error?.message || 'Unknown error' }),
    dom('code', { text: [
      `Code: ${state.error?.code || 'UNKNOWN'}`,
      state.error?.requestId ? `Request ID: ${state.error.requestId}` : '',
      state.error?.details ? `Details: ${state.error.details}` : ''
    ].filter(Boolean).join('\n') })
  ]);
  main.append(panel);
  main.append(dom('div', { className: 'btn-row', attrs: { style: 'margin-top:14px' } }, [
    state.retry ? button('Retry manually', 'primary', state.retry) : null,
    button('Back to reading', 'secondary', () => {
      state.view = state.readingId ? 'reading' : 'home';
      state.error = null;
      render();
    }),
    button('Open Settings', 'ghost', () => goHome('settings'))
  ]));
}

async function renderToday(main) {
  const progress = await ensureProgress();
  const readings = allReadings();
  const complete = readings.filter(r => progress[r.num]?.status === 'complete').length;
  const inProgress = readings.find(r => progress[r.num]?.status === 'in_progress');
  const next = inProgress || readings.find(r => progress[r.num]?.status === 'not_started');
  const pct = Math.round((complete / readings.length) * 100);

  const hero = dom('section', { className: 'hero' }, [
    dom('div', { className: 'eyebrow', text: 'Today' }),
    dom('h1', { text: next ? `Continue ${next.num}` : 'Curriculum complete' }),
    dom('p', { text: next ? `${next.title}. Start with why the concept exists, then build the mechanism before formulas or CFA wording.` : 'Review weak areas and keep your mental models active.' }),
    next ? button('Open reading', 'secondary', () => openReading(next.num)) : null
  ]);
  main.append(hero);

  main.append(dom('div', { className: 'grid three' }, [
    card([dom('div', { className: 'stat' }, [dom('div', { className: 'value', text: `${pct}%` }), dom('div', { className: 'label', text: 'curriculum complete' })])]),
    card([dom('div', { className: 'stat' }, [dom('div', { className: 'value', text: computeStreak() }), dom('div', { className: 'label', text: 'day streak' })])]),
    card([dom('div', { className: 'stat' }, [dom('div', { className: 'value', text: readings.reduce((n,r) => n + (progress[r.num]?.wrongCount || 0), 0) }), dom('div', { className: 'label', text: 'diagnosed mistakes' })])])
  ]));

  const progressCard = card([
    dom('div', { className: 'area-head' }, [dom('h3', { text: 'Overall progress' }), pill(`${complete}/${readings.length}`, 'complete')]),
    dom('div', { className: 'progress-track' }, [dom('div', { className: 'progress-bar', attrs: { style: `width:${pct}%` } })]),
    dom('p', { className: 'muted small', text: 'A reading counts as complete only when you mark it complete. Generated lessons and questions remain saved separately.' })
  ]);
  progressCard.style.marginTop = '16px';
  main.append(progressCard);

  if (!authToken()) {
    const authCard = card([
      dom('div', { className: 'eyebrow', text: 'One-time setup' }),
      dom('h3', { text: 'Connect the private Worker access key' }),
      dom('p', { className: 'muted', text: 'The old public token has been removed. Enter your private APP_TOKEN in Settings before generating lessons or syncing.' }),
      button('Open Settings', 'primary', () => goHome('settings'))
    ], 'accent');
    authCard.style.marginTop = '16px';
    main.append(authCard);
  }
}

async function renderCFA(main) {
  const progress = await ensureProgress();
  main.append(headerBlock('Curriculum', 'CFA Level I', 'Open a reading, paste your notes, and build the Ahmed Study Guide in dependency order.'));

  for (const [code, area] of Object.entries(CURRICULUM)) {
    const completed = area.readings.filter(r => progress[r.num]?.status === 'complete').length;
    const pct = Math.round((completed / area.readings.length) * 100);
    const expanded = Boolean(state.areaOpen[code]);
    const section = card([], 'area-card');
    const head = dom('button', { className: 'area-head reading-row', type: 'button', onClick: () => { state.areaOpen[code] = !expanded; render(); } }, [
      dom('div', { className: 'area-title' }, [
        dom('div', { className: 'area-code', text: code }),
        dom('div', {}, [
          dom('h3', { text: area.name }),
          dom('div', { className: 'reading-meta' }, [dom('span', { text: `${area.weightPct} exam weight` }), dom('span', { text: `${completed}/${area.readings.length} complete` })])
        ])
      ]),
      dom('span', { className: 'mono muted', text: expanded ? '−' : '+' })
    ]);
    section.append(head);
    section.append(dom('div', { className: 'progress-track', attrs: { style: 'margin-top:12px' } }, [dom('div', { className: 'progress-bar', attrs: { style: `width:${pct}%` } })]));
    if (expanded) {
      const list = dom('div', { className: 'reading-list' });
      for (const item of area.readings) {
        const entry = progress[item.num] || {};
        const guide = getJSON(K.guide + item.num, null);
        list.append(dom('button', { className: 'reading-row', type: 'button', onClick: () => openReading(item.num) }, [
          dom('div', {}, [
            dom('strong', { text: `${item.num} · ${item.title}` }),
            dom('div', { className: 'reading-meta' }, [
              dom('span', { text: `${item.minutes || 20} min` }),
              entry.notes?.trim() ? dom('span', { text: 'notes saved' }) : null,
              guide ? dom('span', { text: 'guide built' }) : null
            ])
          ]),
          pill(statusLabel(entry.status), entry.status || 'not_started')
        ]));
      }
      section.append(list);
    }
    main.append(section);
  }
}

async function renderStats(main) {
  const progress = await ensureProgress();
  const readings = allReadings();
  const totalMinutes = readings.reduce((sum, r) => sum + (r.minutes || 20), 0);
  const completeMinutes = readings.reduce((sum, r) => sum + (progress[r.num]?.status === 'complete' ? (r.minutes || 20) : 0), 0);
  const wrong = readings.reduce((sum, r) => sum + (progress[r.num]?.wrongCount || 0), 0);
  main.append(headerBlock('Progress', 'Stats', 'Use these numbers to choose what to review—not as a substitute for understanding.'));
  main.append(dom('div', { className: 'grid three' }, [
    card([dom('div', { className: 'stat' }, [dom('div', { className: 'value', text: `${Math.round(completeMinutes / 60)}h` }), dom('div', { className: 'label', text: 'estimated completed time' })])]),
    card([dom('div', { className: 'stat' }, [dom('div', { className: 'value', text: `${Math.round(totalMinutes / 60)}h` }), dom('div', { className: 'label', text: 'curriculum estimate' })])]),
    card([dom('div', { className: 'stat' }, [dom('div', { className: 'value', text: wrong }), dom('div', { className: 'label', text: 'mistakes classified' })])])
  ]));

  const areaGrid = dom('div', { className: 'grid two', attrs: { style: 'margin-top:16px' } });
  for (const [code, area] of Object.entries(CURRICULUM)) {
    const completed = area.readings.filter(r => progress[r.num]?.status === 'complete').length;
    const pct = Math.round((completed / area.readings.length) * 100);
    areaGrid.append(card([
      dom('div', { className: 'area-head' }, [dom('h3', { text: area.name }), pill(`${pct}%`, completed ? 'complete' : '')]),
      dom('div', { className: 'progress-track' }, [dom('div', { className: 'progress-bar', attrs: { style: `width:${pct}%` } })]),
      dom('p', { className: 'muted small', text: `${completed} of ${area.readings.length} readings complete · ${area.weightPct} exam weight` })
    ]));
  }
  main.append(areaGrid);
}

function renderSettings(main) {
  main.append(headerBlock('Configuration', 'Settings', 'The access key stays in this browser. It is never committed to the public GitHub repository.'));
  const workerInput = dom('input', { className: 'input', type: 'url', value: workerBase(), autocomplete: 'off' });
  const tokenInput = dom('input', { className: 'input', type: 'password', value: authToken(), placeholder: 'Enter the private APP_TOKEN', autocomplete: 'off' });
  const status = dom('p', { className: 'muted small', text: authToken() ? 'An access key is saved on this device.' : 'No access key is set.' });

  main.append(card([
    dom('div', { className: 'field' }, [dom('label', { className: 'label', text: 'Cloudflare Worker URL' }), workerInput]),
    dom('div', { className: 'field' }, [dom('label', { className: 'label', text: 'Private app access key' }), tokenInput]),
    status,
    dom('div', { className: 'btn-row' }, [
      button('Save and test', 'primary', async () => {
        setText(K.worker, workerInput.value.trim() || DEFAULT_WORKER);
        setText(K.auth, tokenInput.value.trim());
        status.textContent = 'Testing connection…';
        try {
          await apiRequest('/auth/check', null, { method: 'GET', timeoutMs: 15000 });
          status.textContent = 'Connected. Pulling your cloud data…';
          await pullFromCloud();
          await ensureProgress();
          status.textContent = 'Connected and synced.';
          toast('Worker connected', 'good');
        } catch (error) {
          status.textContent = `Connection failed: ${error.message}`;
          toast('Connection failed', 'bad');
        }
      }),
      button('Sync now', 'secondary', async () => {
        try {
          await flushCloudSync();
          await pullFromCloud();
          await ensureProgress();
          toast('Cloud data pulled', 'good');
          render();
        } catch (error) { toast(error.message, 'bad'); }
      }),
      button('Clear key on this device', 'danger', () => {
        localStorage.removeItem(K.auth);
        tokenInput.value = '';
        status.textContent = 'No access key is set.';
        toast('Access key removed');
      })
    ])
  ]));

  main.append(card([
    dom('h3', { text: 'Data migration' }),
    dom('p', { className: 'muted', text: 'Your original notes and progress use the same storage keys, so they remain available after replacing the repository files. The revised Worker can read legacy un-namespaced KV data once and then writes into a private token-specific namespace.' })
  ], 'accent'));
}

function openReading(id) {
  state.readingId = id;
  state.view = 'reading';
  state.tab = 'cfa';
  state.error = null;
  state.chatOpen = false;
  render();
}

async function renderReading(main) {
  const item = reading(state.readingId);
  if (!item) return goHome('cfa');
  const progress = await ensureProgress();
  const entry = progress[item.num];
  const guide = getJSON(K.guide + item.num, null);
  const stale = guide && guide.sourceFingerprint !== fingerprint(entry.notes || '');

  main.append(dom('button', { className: 'back-link', type: 'button', text: '← Back to curriculum', onClick: () => goHome('cfa') }));
  main.append(headerBlock(item.areaName, `${item.num} · ${item.title}`, `${item.minutes || 20} minutes · The lesson starts with the problem and mechanism, not the formula.`));

  const statusSelect = dom('select', { className: 'select', value: entry.status });
  [['not_started','Not started'],['in_progress','In progress'],['complete','Complete']].forEach(([value,label]) => statusSelect.append(dom('option', { value, text: label })));
  statusSelect.value = entry.status;
  statusSelect.addEventListener('change', () => {
    const latest = getJSON(K.progress, {});
    latest[item.num] = { ...latest[item.num], status: statusSelect.value };
    setJSON(K.progress, latest);
    recordActivity(1, item.areaCode);
    toast('Status saved', 'good');
  });

  const notes = dom('textarea', {
    className: 'textarea',
    value: entry.notes || '',
    placeholder: 'Paste Schweser notes, your own notes, LOS text, examples, or the section you are currently studying…',
    rows: 14
  });
  const saveStatus = dom('span', { className: 'muted small', text: 'Saved locally' });
  const saveNotes = () => {
    const latest = getJSON(K.progress, {});
    latest[item.num] = { ...latest[item.num], notes: notes.value, status: latest[item.num]?.status === 'not_started' ? 'in_progress' : latest[item.num]?.status };
    setJSON(K.progress, latest);
    saveStatus.textContent = 'Saved';
  };
  notes.addEventListener('input', () => {
    saveStatus.textContent = 'Saving…';
    window.clearTimeout(noteSaveTimer);
    noteSaveTimer = window.setTimeout(saveNotes, 450);
  });
  notes.addEventListener('blur', saveNotes);

  main.append(card([
    dom('div', { className: 'grid two' }, [
      dom('div', { className: 'field' }, [dom('label', { className: 'label', text: 'Study status' }), statusSelect]),
      dom('div', { className: 'field' }, [dom('label', { className: 'label', text: 'Current guide' }), guide ? pill(stale ? 'notes changed' : 'ready', stale ? 'in_progress' : 'complete') : pill('not built')])
    ]),
    dom('div', { className: 'field' }, [dom('label', { className: 'label', text: 'Your source notes' }), notes, dom('div', { className: 'area-head', attrs: { style: 'margin-top:7px' } }, [saveStatus, dom('span', { className: 'muted small', text: 'Notes only leave the browser when you generate or ask the tutor.' })])]),
    dom('div', { className: 'btn-row', attrs: { style: 'margin-top:16px' } }, [
      guide ? button(stale ? 'Rebuild from updated notes' : 'Open Ahmed Study Guide', 'primary', async () => {
        saveNotes();
        if (stale) await buildCoreGuide(item, notes.value);
        else openGuide(item.num);
      }) : button('Build Ahmed Study Guide', 'primary', async () => { saveNotes(); await buildCoreGuide(item, notes.value); }),
      guide && !stale ? button('Regenerate guide', 'ghost', async () => { saveNotes(); await buildCoreGuide(item, notes.value); }) : null
    ])
  ], 'accent'));

  main.append(card([
    dom('div', { className: 'eyebrow', text: 'Learning architecture' }),
    dom('h3', { text: 'The app will not start in the middle anymore' }),
    dom('p', { className: 'muted', text: 'Every reading follows: Map → Problem → Intuition → Mechanism → Formula → Example → Understanding Check → CFA Translation → Practice → Mistake Diagnosis → Teach Back → Exam Summary.' })
  ]));
}

async function buildCoreGuide(item, notes) {
  if (!authToken()) {
    state.tab = 'settings'; state.view = 'home';
    toast('Set the private access key first', 'bad');
    return render();
  }
  const payload = {
    readingTitle: item.title,
    topicArea: item.areaName,
    notes: notes || ''
  };
  state.loading = {
    title: 'Building the Ahmed Study Guide',
    message: 'One schema-validated response is building the mental model. The app will stop clearly if the model reaches its token limit.',
    steps: ['Map the dependencies','Find the real-world problem','Build the causal mechanism','Derive formulas and examples','Translate into CFA language','Compress the exam summary'],
    active: 2
  };
  render();
  try {
    const core = await apiRequest('/v1/lesson-core', payload, { timeoutMs: 150000 });
    setJSON(K.guide + item.num, {
      version: 3,
      generatedAt: new Date().toISOString(),
      sourceFingerprint: fingerprint(notes || ''),
      core
    });
    recordActivity(5, item.areaCode);
    state.loading = null;
    openGuide(item.num);
  } catch (error) {
    setError(error, () => buildCoreGuide(item, notes));
  }
}

function openGuide(id, stage = 0) {
  state.readingId = id;
  state.guideStage = stage;
  state.view = 'guide';
  state.tab = 'cfa';
  state.loading = null;
  state.quiz = null;
  render();
}

async function renderGuide(main) {
  const item = reading(state.readingId);
  const saved = getJSON(K.guide + state.readingId, null);
  if (!item || !saved?.core) {
    state.view = 'reading';
    return render();
  }
  const practice = getJSON(K.practice + state.readingId, null);
  const visited = getJSON(K.stages + state.readingId, []);
  if (!visited.includes(state.guideStage)) {
    visited.push(state.guideStage);
    setJSON(K.stages + state.readingId, visited);
  }

  main.append(dom('button', { className: 'back-link', type: 'button', text: '← Back to reading', onClick: () => { state.view = 'reading'; render(); } }));
  main.append(headerBlock(item.areaName, `${item.num} · ${item.title}`, 'Move forward only when each arrow in the mechanism feels necessary rather than memorized.'));

  const layout = dom('div', { className: 'guide-shell' });
  const nav = dom('aside', { className: 'stage-nav', attrs: { 'aria-label': 'Ahmed Study Guide stages' } });
  STAGES.forEach(([name, description], index) => {
    nav.append(dom('button', {
      className: `stage-btn ${state.guideStage === index ? 'active' : ''} ${visited.includes(index) ? 'done' : ''}`,
      type: 'button',
      onClick: () => { state.guideStage = index; state.quiz = null; render(); }
    }, [dom('span', { className: 'num', text: visited.includes(index) && state.guideStage !== index ? '✓' : index + 1 }), dom('span', {}, [dom('strong', { text: name }), dom('div', { className: 'muted small', text: description })])]));
  });
  layout.append(nav);

  const content = dom('div');
  renderGuideStage(content, saved.core, practice, item);
  content.append(renderTutorCard(item));
  layout.append(content);
  main.append(layout);
}

function stageIntro(number, title, prompt) {
  return dom('div', {}, [
    dom('div', { className: 'eyebrow', text: `Stage ${number} of 12` }),
    dom('h2', { text: title }),
    dom('p', { className: 'muted', text: prompt })
  ]);
}

function renderGuideStage(content, core, practiceSaved, item) {
  const stage = state.guideStage;
  if (stage === 0) renderMap(content, core);
  else if (stage === 1) renderProblem(content, core);
  else if (stage === 2) renderIntuition(content, core);
  else if (stage === 3) renderMechanism(content, core);
  else if (stage === 4) renderFormulaLab(content, core);
  else if (stage === 5) renderWorkedExamples(content, core);
  else if (stage === 6) renderUnderstandingChecks(content, practiceSaved, item);
  else if (stage === 7) renderCFATranslation(content, core);
  else if (stage === 8) renderPractice(content, practiceSaved, item);
  else if (stage === 9) renderMistakeDiagnosis(content, item);
  else if (stage === 10) renderTeachBack(content, practiceSaved, item);
  else if (stage === 11) renderExamSummary(content, core, item);
}

function renderMap(content, core) {
  content.append(stageIntro(1, 'Topic Map', 'See the dependency structure before learning isolated details.'));
  content.append(card([
    dom('div', { className: 'grid two' }, [
      dom('div', {}, [dom('div', { className: 'eyebrow', text: 'Depends on' }), dom('p', { text: core.meta.prerequisite })]),
      dom('div', {}, [dom('div', { className: 'eyebrow', text: 'Unlocks' }), dom('p', { text: core.meta.destination })])
    ])
  ], 'accent'));
  const map = dom('div', { className: 'concept-map' });
  for (const node of core.map || []) {
    map.append(dom('div', { className: 'concept-node' }, [
      dom('strong', { text: node.concept }),
      dom('p', { className: 'muted small', text: `Needs: ${node.depends_on}` }),
      dom('p', { className: 'small', text: `Then allows you to understand: ${node.unlocks}` })
    ]));
  }
  content.append(card([dom('h3', { text: 'Reading structure' }), map]));
}

function renderProblem(content, core) {
  content.append(stageIntro(2, 'The Real-World Problem', 'Feel the problem first. The formal concept should arrive as the solution.'));
  content.append(card([
    dom('div', { className: 'eyebrow', text: 'Scenario' }),
    dom('h3', { text: core.problem.scenario }),
    dom('p', { text: core.problem.tension }),
    dom('div', { className: 'divider' }),
    dom('div', { className: 'eyebrow', text: 'Why this concept exists' }),
    dom('p', { text: core.problem.why_concept_exists })
  ], 'accent'));
}

function renderIntuition(content, core) {
  content.append(stageIntro(3, 'Intuition Before Terminology', 'Understand it without CFA vocabulary, then attach the official language.'));
  content.append(card([
    dom('div', { className: 'eyebrow', text: 'Plain English' }),
    dom('p', { text: core.intuition.plain_english }),
    dom('div', { className: 'divider' }),
    dom('div', { className: 'eyebrow', text: 'Analogy' }),
    dom('p', { text: core.intuition.analogy }),
    dom('div', { className: 'divider' }),
    dom('div', { className: 'eyebrow', text: 'Bridge to CFA language' }),
    dom('p', { text: core.intuition.formal_bridge })
  ]));
}

function renderMechanism(content, core) {
  content.append(stageIntro(4, 'Mechanism Chain', 'Every arrow must include the reason it leads to the next step.'));
  const chain = dom('div', { className: 'chain' });
  (core.mechanism || []).forEach((step, index) => {
    chain.append(dom('div', { className: 'chain-step' }, [
      dom('div', { className: 'index', text: index + 1 }),
      dom('strong', { text: step.step }),
      dom('div', { className: 'because', text: `Why: ${step.because}` }),
      dom('p', { className: 'small', text: `Therefore: ${step.leads_to}` })
    ]));
  });
  content.append(chain);
}

function renderFormula(container, expression) {
  clear(container);
  if (window.katex) {
    try {
      window.katex.render(expression || '', container, { throwOnError: false, displayMode: true, trust: false });
      return;
    } catch (error) { console.error('KaTeX failed', error); }
  }
  container.textContent = expression || 'No expression';
}

function renderFormulaLab(content, core) {
  content.append(stageIntro(5, 'Formula Lab', 'The formula is a compressed version of the mechanism—not a separate fact to memorize.'));
  if (!core.formulas?.length) {
    content.append(card([dom('h3', { text: 'This reading is mainly conceptual' }), dom('p', { className: 'muted', text: 'No formula was forced into the lesson. Focus on the rule, causal chain, and CFA wording.' })]));
    return;
  }
  for (const formula of core.formulas) {
    const formulaNode = dom('div', { className: 'formula-box', text: formula.expression });
    window.setTimeout(() => renderFormula(formulaNode, formula.expression), 0);
    const variables = dom('div', { className: 'variable-grid' });
    for (const variable of formula.variables || []) {
      variables.append(dom('div', { className: 'variable-row' }, [
        dom('strong', { className: 'mono', text: variable.symbol }),
        dom('div', {}, [dom('div', { text: variable.meaning }), dom('div', { className: 'muted small', text: `Direction: ${variable.direction}` })])
      ]));
    }
    const derivation = dom('ol', { className: 'numbered-list' });
    for (const step of formula.derivation || []) derivation.append(dom('li', { text: step }));
    content.append(card([
      dom('div', { className: 'eyebrow', text: formula.purpose }),
      dom('h3', { text: formula.name }),
      formulaNode,
      dom('h3', { text: 'What every variable physically represents', attrs: { style: 'margin-top:16px' } }),
      variables,
      dom('h3', { text: 'Derivation from the mechanism', attrs: { style: 'margin-top:16px' } }),
      derivation
    ]));
  }
}

function renderWorkedExamples(content, core) {
  content.append(stageIntro(6, 'Worked Example', 'Expose the arithmetic and then check whether the answer makes economic sense.'));
  if (!core.formulas?.length) {
    content.append(card([dom('p', { text: core.problem.scenario }), dom('p', { className: 'muted', text: 'Use the mechanism chain to predict what should happen before looking at a rule or answer choice.' })]));
    return;
  }
  for (const formula of core.formulas) {
    const steps = dom('ol', { className: 'numbered-list' });
    for (const step of formula.worked_steps || []) steps.append(dom('li', { text: step }));
    content.append(card([
      dom('h3', { text: formula.name }),
      steps,
      dom('div', { className: 'card good tight', attrs: { style: 'margin-top:12px' } }, [dom('strong', { text: `Answer: ${formula.answer}` }), dom('p', { className: 'small', text: `Sanity check: ${formula.sanity_check}` })])
    ]));
  }
}

function practiceData(practiceSaved) { return practiceSaved?.practice || practiceSaved || null; }

function requirePractice(content, practiceSaved, item, title) {
  const practice = practiceData(practiceSaved);
  if (practice) return practice;
  content.append(card([
    dom('h3', { text: title }),
    dom('p', { className: 'muted', text: 'Practice is generated separately so you do not pay for quiz tokens before you have built the conceptual model.' }),
    button('Generate understanding checks and practice', 'primary', () => buildPractice(item))
  ], 'accent'));
  return null;
}

async function buildPractice(item) {
  const progress = await ensureProgress();
  const guide = getJSON(K.guide + item.num, null);
  if (!guide?.core) return;
  state.loading = {
    title: 'Building progressive practice',
    message: 'The questions move from mechanism recognition to full CFA-style application.',
    steps: ['Reasoning checks','Direction-of-change questions','Calculation and interpretation','CFA-style mixed questions','Teach-back rubric'],
    active: 2
  };
  render();
  try {
    const response = await apiRequest('/v1/lesson-practice', {
      readingTitle: item.title,
      topicArea: item.areaName,
      core: guide.core
    }, { timeoutMs: 150000 });
    setJSON(K.practice + item.num, { version: 3, generatedAt: new Date().toISOString(), practice: response });
    recordActivity(4, item.areaCode);
    state.loading = null;
    render();
  } catch (error) {
    setError(error, () => buildPractice(item));
  }
}

function renderUnderstandingChecks(content, practiceSaved, item) {
  content.append(stageIntro(7, 'Understanding Check', 'Predict and explain the mechanism before touching a full CFA question.'));
  const practice = requirePractice(content, practiceSaved, item, 'Generate the reasoning checks');
  if (!practice) return;
  (practice.understanding_checks || []).forEach((check, index) => {
    const answer = dom('div', { className: 'card good tight hidden' }, [
      dom('strong', { text: 'Expected reasoning' }),
      dom('p', { text: check.expected_reasoning }),
      dom('strong', { text: 'Answer' }),
      dom('p', { text: check.answer })
    ]);
    content.append(card([
      dom('div', { className: 'eyebrow', text: `Check ${index + 1}` }),
      dom('h3', { text: check.question }),
      button('Reveal reasoning', 'secondary small', () => answer.classList.toggle('hidden')),
      answer
    ]));
  });
}

function renderCFATranslation(content, core) {
  content.append(stageIntro(8, 'CFA Translation Layer', 'Convert the mental model into the exact language and traps the exam uses.'));
  for (const row of core.cfa_translation || []) {
    content.append(card([
      dom('div', { className: 'eyebrow', text: 'Plain-English idea' }),
      dom('p', { text: row.plain_english }),
      dom('div', { className: 'eyebrow', text: 'CFA wording' }),
      dom('p', { text: row.cfa_wording }),
      dom('div', { className: 'card bad tight' }, [dom('strong', { text: 'Trap' }), dom('p', { className: 'small', text: row.trap })])
    ]));
  }
}

function renderPractice(content, practiceSaved, item) {
  content.append(stageIntro(9, 'Progressive Practice', 'Move from identification to mechanism, direction, calculation, interpretation, and mixed CFA questions.'));
  const practice = requirePractice(content, practiceSaved, item, 'Generate CFA practice');
  if (!practice) return;
  const questions = practice.practice_questions || [];
  if (!questions.length) {
    content.append(card([dom('p', { text: 'No practice questions were returned.' })], 'bad'));
    return;
  }
  if (!state.quiz || state.quiz.readingId !== item.num) state.quiz = { readingId: item.num, index: 0, selected: null, answered: false };
  const qIndex = Math.min(state.quiz.index, questions.length - 1);
  const question = questions[qIndex];
  const questionCard = card([
    dom('div', { className: 'area-head' }, [pill(`Level ${question.level}`), dom('span', { className: 'muted small', text: `${qIndex + 1}/${questions.length}` })]),
    dom('h3', { text: question.stem, attrs: { style: 'margin-top:13px' } })
  ]);
  (question.choices || []).forEach((choice, index) => {
    const selected = state.quiz.selected === index;
    let cls = selected ? 'selected' : '';
    if (state.quiz.answered && choice.correct) cls = 'correct';
    else if (state.quiz.answered && selected && !choice.correct) cls = 'incorrect';
    const choiceBtn = dom('button', {
      className: `choice ${cls}`,
      type: 'button',
      disabled: state.quiz.answered,
      onClick: () => { state.quiz.selected = index; render(); }
    }, [
      dom('span', { className: 'choice-label', text: String.fromCharCode(65 + index) }),
      dom('span', {}, [dom('span', { text: choice.text }), state.quiz.answered ? dom('div', { className: 'explanation', text: choice.explanation }) : null])
    ]);
    questionCard.append(choiceBtn);
  });
  const controls = dom('div', { className: 'btn-row', attrs: { style: 'margin-top:14px' } });
  if (!state.quiz.answered) {
    controls.append(button('Check answer', 'primary', async () => {
      if (state.quiz.selected === null) return toast('Choose an answer first', 'bad');
      state.quiz.answered = true;
      const chosen = question.choices[state.quiz.selected];
      if (!chosen.correct) await recordWrongAnswer(item, question, chosen);
      else recordActivity(1, item.areaCode);
      render();
    }));
  } else if (qIndex < questions.length - 1) {
    controls.append(button('Next question', 'primary', () => { state.quiz.index += 1; state.quiz.selected = null; state.quiz.answered = false; render(); }));
  } else {
    controls.append(button('Review mistake diagnosis', 'primary', () => { state.guideStage = 9; state.quiz = null; render(); }));
    controls.append(button('Restart practice', 'secondary', () => { state.quiz = { readingId: item.num, index: 0, selected: null, answered: false }; render(); }));
  }
  questionCard.append(controls);
  content.append(questionCard);
}

async function recordWrongAnswer(item, question, chosen) {
  const bank = getJSON(K.wrong + item.num, []);
  bank.push({
    at: new Date().toISOString(),
    stem: question.stem,
    chosen: chosen.text,
    correct: question.choices.find(choice => choice.correct)?.text || '',
    diagnostic_type: question.diagnostic_type,
    explanation: chosen.explanation
  });
  setJSON(K.wrong + item.num, bank.slice(-100));
  const progress = await ensureProgress();
  progress[item.num].wrongCount = (progress[item.num].wrongCount || 0) + 1;
  setJSON(K.progress, progress);
  recordActivity(1, item.areaCode);
}

function renderMistakeDiagnosis(content, item) {
  content.append(stageIntro(10, 'Mistake Diagnosis', 'A wrong answer is routed to the exact layer that failed instead of being treated as generic weakness.'));
  const bank = getJSON(K.wrong + item.num, []);
  if (!bank.length) {
    content.append(card([dom('h3', { text: 'No diagnosed mistakes yet' }), dom('p', { className: 'muted', text: 'Complete practice questions. Any wrong answer will be classified as a concept, mechanism, formula, calculation, wording, exception, or confusion gap.' })]));
    return;
  }
  const counts = {};
  for (const mistake of bank) counts[mistake.diagnostic_type] = (counts[mistake.diagnostic_type] || 0) + 1;
  const summary = dom('div', { className: 'btn-row' });
  Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([type,count]) => summary.append(pill(`${type}: ${count}`, 'error')));
  content.append(card([dom('h3', { text: 'Your recurring gap types' }), summary], 'bad'));
  [...bank].reverse().slice(0, 10).forEach(mistake => {
    content.append(card([
      pill(mistake.diagnostic_type, 'error'),
      dom('h3', { text: mistake.stem, attrs: { style: 'margin-top:10px' } }),
      dom('p', { className: 'small', text: `You chose: ${mistake.chosen}` }),
      dom('p', { className: 'small', text: `Correct: ${mistake.correct}` }),
      dom('p', { className: 'muted small', text: `Why the choice failed: ${mistake.explanation}` })
    ]));
  });
}

function renderTeachBack(content, practiceSaved, item) {
  content.append(stageIntro(11, 'Teach It Back', 'Recognition is not enough. Explain the mechanism without hiding behind the conclusion.'));
  const practice = requirePractice(content, practiceSaved, item, 'Generate the teach-back rubric');
  if (!practice) return;
  const savedAssessment = getJSON(K.teachback + item.num, null);
  const responseBox = dom('textarea', { className: 'textarea', rows: 8, placeholder: 'Explain the concept in your own words. Include every cause-and-effect step.', value: savedAssessment?.response || '' });
  const result = dom('div');
  if (savedAssessment?.assessment) result.append(renderTeachBackAssessment(savedAssessment.assessment));
  content.append(card([
    dom('h3', { text: practice.teach_back.prompt }),
    dom('p', { className: 'muted small', text: `Do not skip this likely missing link: ${practice.teach_back.common_missing_link}` }),
    responseBox,
    dom('div', { className: 'btn-row', attrs: { style: 'margin-top:12px' } }, [
      button('Assess my explanation', 'primary', async () => {
        if (responseBox.value.trim().length < 30) return toast('Explain a little more before assessment', 'bad');
        await assessTeachBack(item, practice, responseBox.value, result);
      })
    ]),
    result
  ]));
}

function renderTeachBackAssessment(assessment) {
  const missing = dom('ul');
  for (const idea of assessment.missing_ideas || []) missing.append(dom('li', { text: idea }));
  return dom('div', { className: `card ${assessment.passed ? 'good' : 'bad'} tight`, attrs: { style: 'margin-top:14px' } }, [
    dom('strong', { text: assessment.passed ? 'Mental model passed' : 'One or more links are still missing' }),
    dom('p', { text: assessment.feedback }),
    assessment.missing_ideas?.length ? dom('div', {}, [dom('strong', { text: 'Missing ideas' }), missing]) : null,
    dom('p', { className: 'small', text: `Next explanation: ${assessment.next_prompt}` })
  ]);
}

async function assessTeachBack(item, practice, response, target) {
  const progress = await ensureProgress();
  target.append(dom('div', { className: 'loading-step active', text: 'Assessing the causal chain…' }));
  try {
    const assessment = await apiRequest('/v1/teach-back', {
      readingTitle: item.title,
      requiredIdeas: practice.teach_back.required_ideas,
      answer: response
    }, { timeoutMs: 90000 });
    setJSON(K.teachback + item.num, { response, assessment, assessedAt: new Date().toISOString() });
    recordActivity(2, item.areaCode);
    clear(target);
    target.append(renderTeachBackAssessment(assessment));
  } catch (error) {
    clear(target);
    target.append(dom('div', { className: 'error-panel', text: error.message }));
  }
}

function renderExamSummary(content, core, item) {
  content.append(stageIntro(12, 'Final CFA Summary', 'Compress understanding only after the full mechanism exists.'));
  const summary = core.exam_summary;
  const chain = dom('ol', { className: 'numbered-list' });
  for (const step of summary.chain || []) chain.append(dom('li', { text: step }));
  const formulas = dom('ul');
  for (const formula of summary.formulas || []) formulas.append(dom('li', { text: formula }));
  const traps = dom('ul');
  for (const trap of summary.traps || []) traps.append(dom('li', { text: trap }));
  const pressure = dom('ul');
  for (const tip of summary.under_pressure || []) pressure.append(dom('li', { text: tip }));
  content.append(card([
    dom('div', { className: 'eyebrow', text: 'One-sentence core idea' }),
    dom('h3', { text: summary.core_idea }),
    dom('h3', { text: 'Mechanism chain', attrs: { style: 'margin-top:18px' } }), chain,
    dom('h3', { text: 'Essential formulas', attrs: { style: 'margin-top:18px' } }), formulas,
    dom('h3', { text: 'Common CFA traps', attrs: { style: 'margin-top:18px' } }), traps,
    dom('h3', { text: 'Under exam pressure', attrs: { style: 'margin-top:18px' } }), pressure,
    dom('div', { className: 'btn-row', attrs: { style: 'margin-top:16px' } }, [
      button('Mark reading complete', 'primary', async () => {
        const progress = await ensureProgress();
        progress[item.num].status = 'complete';
        setJSON(K.progress, progress);
        recordActivity(3, item.areaCode);
        toast('Reading marked complete', 'good');
      })
    ])
  ], 'accent'));
}

function renderTutorCard(item) {
  const wrapper = card([], 'accent');
  wrapper.style.marginTop = '18px';
  const toggle = dom('button', { className: 'area-head reading-row', type: 'button', onClick: () => { state.chatOpen = !state.chatOpen; render(); } }, [
    dom('div', {}, [dom('strong', { text: 'Ask the missing step' }), dom('div', { className: 'muted small', text: 'The tutor must explain cause and effect rather than repeat a rule.' })]),
    dom('span', { className: 'mono', text: state.chatOpen ? '−' : '+' })
  ]);
  wrapper.append(toggle);
  if (!state.chatOpen) return wrapper;

  const history = getJSON(K.chat + item.num, []);
  const log = dom('div', { className: 'chat-log', attrs: { style: 'margin-top:12px' } });
  history.slice(-20).forEach(message => log.append(dom('div', { className: `chat-msg ${message.role}`, text: message.text })));
  const input = dom('textarea', { className: 'textarea', rows: 3, placeholder: 'Which exact step does not feel inevitable yet?' });
  const send = button('Ask tutor', 'primary', async () => {
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    await sendTutorQuestion(item, question);
  });
  wrapper.append(log, input, dom('div', { className: 'btn-row', attrs: { style: 'margin-top:10px' } }, [send]));
  return wrapper;
}

async function sendTutorQuestion(item, question) {
  const progress = await ensureProgress();
  const history = getJSON(K.chat + item.num, []);
  history.push({ role: 'user', text: question, at: new Date().toISOString() });
  setJSON(K.chat + item.num, history);
  render();
  try {
    const response = await apiRequest('/v1/tutor', {
      readingTitle: item.title,
      context: [
        `Topic area: ${item.areaName}`,
        `Current stage: ${STAGES[state.guideStage][0]}`,
        `Source notes: ${progress[item.num]?.notes || '[none]'}`
      ].join('\n'),
      history: history.slice(0, -1).slice(-8).map(message => ({ role: message.role, content: message.text })),
      question
    }, { timeoutMs: 90000 });
    const latest = getJSON(K.chat + item.num, []);
    latest.push({ role: 'assistant', text: response.text, at: new Date().toISOString() });
    setJSON(K.chat + item.num, latest);
    recordActivity(1, item.areaCode);
    render();
  } catch (error) {
    const latest = getJSON(K.chat + item.num, []);
    latest.push({ role: 'assistant', text: `Tutor request failed: ${error.message}`, at: new Date().toISOString() });
    setJSON(K.chat + item.num, latest);
    render();
  }
}

async function bootstrap() {
  await ensureProgress();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(error => console.error('Service worker registration failed', error));
  if (authToken()) {
    await pullFromCloud({ silent: true });
    await ensureProgress();
  }
  render();
}

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection', event.reason);
});
window.addEventListener('error', event => {
  console.error('Runtime error', event.error || event.message);
});

document.addEventListener('DOMContentLoaded', bootstrap);
