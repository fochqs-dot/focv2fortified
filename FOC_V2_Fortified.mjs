
// FOC V2 Fortified — Built from Stable V1.2 — All deliberated features
// Protected V1.2: FOC_cloudflare_QLOTD_REPAIR_20260822.mjs remains untouched
// New file: FOC_V2_Fortified.mjs

const SERVICE_WORKER_JS = `
const VERSION = 'FOC_V2_SW_1.0';
let timerMap = new Map();
let checkInterval = null;

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('message', e => {
  const data = e.data;
  if (data && data.type === 'SYNC_TIMERS') {
    timerMap.clear();
    for (const t of data.timers) {
      timerMap.set(t.id, t);
    }
    if (!checkInterval) {
      checkInterval = setInterval(checkDue, 1000);
    }
  }
  if (data && data.type === 'CLEAR_TIMERS') {
    timerMap.clear();
  }
});

function checkDue() {
  const now = Date.now();
  for (const [id, t] of timerMap) {
    if (t.targetTime && now >= t.targetTime && !t.notified) {
      t.notified = true;
      showFOCNotification(t);
    }
  }
}

function showFOCNotification(t) {
  const title = `FOC ALERT — ${t.activity} READY${t.type==='recurring' ? ' (Recurring)' : ''}`;
  const body = `Duration ${t.durationText} — Timer's up.${t.notes ? ' Note: '+t.notes : ''}`;
  self.registration.showNotification(title, {
    body: body,
    icon: 'https://fochqs-dot.github.io/foc-assets/foc-icon-192.png',
    badge: 'https://fochqs-dot.github.io/foc-assets/foc-icon-192.png',
    tag: t.id,
    requireInteraction: true,
    data: { id: t.id, activity: t.activity, durationText: t.durationText, type: t.type },
    actions: [
      { action: 'go', title: 'Go to FOC' },
      { action: 'restart', title: `Restart Same ${t.durationText}` },
      { action: 'snooze', title: 'Snooze 5m' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });
  // also tell page to play alarm
  self.clients.matchAll().then(clients => {
    for (const c of clients) c.postMessage({ type: 'PLAY_ALARM', timer: t });
  });
}

self.addEventListener('notificationclick', event => {
  const action = event.action;
  const data = event.notification.data;
  event.notification.close();
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window' });
    let focClient = allClients.find(c => c.url.includes('foc') || c.url.includes('worker'));
    if (action === 'go' || action === '') {
      if (focClient) { focClient.focus(); focClient.postMessage({ type: 'FOCUS_TIMER', id: data.id }); }
      else { self.clients.openWindow('/'); }
    } else if (action === 'restart') {
      if (focClient) { focClient.postMessage({ type: 'RESTART_TIMER', id: data.id }); focClient.focus(); }
      else { self.clients.openWindow('/?restart='+data.id); }
    } else if (action === 'snooze') {
      if (focClient) { focClient.postMessage({ type: 'SNOOZE_TIMER', id: data.id, mins: 5 }); }
    } else if (action === 'dismiss') {
      // do nothing
    }
  })());
});
`;

const HTML_TEMPLATE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FOC V2 Fortified — Stable V1.2 Base + Deliberated Features</title>
<style>
:root{--foc-bg:#07111f;--foc-bg-deep:#040b14;--foc-panel:#0d1b2a;--foc-border:#25445f;--foc-border-bright:#3c6382;--foc-text:#e8f1f8;--foc-muted:#8da5b8;--foc-gold:#d6a84c;--foc-gold-soft:#f0c96a;--foc-blue:#4aa3ff;--foc-cyan:#43d5e6;--foc-green:#42d392;--foc-yellow:#f5c451;--foc-red:#ff6b6b;--foc-radius:12px;--foc-shadow:0 8px 20px rgba(0,0,0,0.22);--foc-rail-width:168px;--foc-header-h:36px;--foc-pill-radius:999px}
*{box-sizing:border-box}body{margin:0;background:var(--foc-bg);color:var(--foc-text);font-family:Inter,system-ui,sans-serif}
.foc-header{height:var(--foc-header-h);background:linear-gradient(90deg,#0d1b2a,#12233a);border-bottom:1px solid var(--foc-border);display:flex;align-items:center;justify-content:space-between;padding:0 12px;position:sticky;top:0;z-index:100}
.foc-pill{border-radius:var(--foc-pill-radius);border:1px solid var(--foc-border);padding:3px 10px;font-size:11px;display:inline-flex;align-items:center;gap:6px;background:rgba(13,27,42,0.9)}
.foc-pill.online{border-color:var(--foc-green);color:var(--foc-green)} .foc-pill.off{color:var(--foc-muted)} .foc-pill.on{background:rgba(66,211,146,0.15);border-color:var(--foc-green);color:var(--foc-green)}
.foc-pill.bg-on{background:rgba(214,168,76,0.18);border-color:var(--foc-gold);color:var(--foc-gold)}
.foc-body{display:flex;min-height:calc(100vh - 36px)}
.foc-rail{width:var(--foc-rail-width);background:var(--foc-panel);border-right:1px solid var(--foc-border);padding:8px;display:flex;flex-direction:column;gap:6px}
.foc-rail.right{border-left:1px solid var(--foc-border);border-right:none}
.foc-rail-title{font-size:10px;letter-spacing:1.2px;color:var(--foc-muted);padding:4px 6px}
.foc-rail-item{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:8px;border:1px solid transparent;font-size:11px}
.foc-rail-item:hover{border-color:var(--foc-border);background:rgba(37,68,95,0.25)}
.foc-center{flex:1;padding:12px;overflow:auto}
.card{background:var(--foc-panel);border:1px solid var(--foc-border);border-radius:var(--foc-radius);box-shadow:var(--foc-shadow);margin-bottom:12px;overflow:hidden}
.card-h{padding:10px 12px;border-bottom:1px solid var(--foc-border);display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;letter-spacing:0.6px}
.card-b{padding:10px 12px}
.foc-tabs{display:flex;gap:6px;padding:8px;background:rgba(4,11,20,0.6);border-bottom:1px solid var(--foc-border)}
.foc-tab{padding:5px 12px;border-radius:999px;border:1px solid var(--foc-border);font-size:11px;cursor:pointer;color:var(--foc-muted)}
.foc-tab.active{background:var(--foc-gold);color:#1a1200;border-color:var(--foc-gold);font-weight:700}
.foc-subtabs{display:flex;gap:6px;padding:6px 10px;background:rgba(8,27,43,0.96)}
.foc-subtab{padding:4px 10px;border-radius:999px;border:1px solid var(--foc-border);font-size:10px;cursor:pointer}
.foc-subtab.active{background:rgba(67,213,230,0.18);border-color:var(--foc-cyan);color:var(--foc-cyan)}
.btn-sm{padding:4px 10px;border-radius:999px;border:1px solid var(--foc-border);background:rgba(37,68,95,0.3);color:var(--foc-text);font-size:11px;cursor:pointer}
.btn-sm.success{background:rgba(66,211,146,0.18);border-color:var(--foc-green);color:var(--foc-green)}
.btn-sm.danger{background:rgba(255,107,107,0.15);border-color:var(--foc-red);color:var(--foc-red)}
.btn-sm.gold{background:rgba(214,168,76,0.22);border-color:var(--foc-gold);color:var(--foc-gold);font-weight:700}
input,select{background:rgba(4,11,20,0.8);border:1px solid var(--foc-border);color:var(--foc-text);border-radius:8px;padding:5px 8px;font-size:11px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:rgba(8,27,43,0.96);color:var(--foc-muted);padding:6px 8px;text-align:left;border-bottom:1px solid var(--foc-border);font-size:10px;letter-spacing:0.6px}
td{background:rgba(11,29,45,0.64);padding:6px 8px;border-bottom:1px solid rgba(37,68,95,0.3)}
.badge{padding:2px 6px;border-radius:999px;font-size:9px;border:1px solid var(--foc-border)}
.badge.once{background:rgba(141,165,184,0.15);color:var(--foc-muted)} .badge.recurring{background:rgba(214,168,76,0.22);color:var(--foc-gold);border-color:var(--foc-gold);font-weight:700}
.ready{color:var(--foc-red);font-weight:800}
.foc-alert{position:fixed;bottom:16px;right:16px;background:#0d1b2a;border:1px solid var(--foc-gold);border-radius:12px;padding:12px 14px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:9999;min-width:300px;display:none}
.foc-alert.show{display:block}
</style></head><body>
<div class="foc-header">
  <div style="display:flex;gap:8px;align-items:center"><div style="font-weight:900;font-size:12px;letter-spacing:1px">FOE OPERATIONS CENTER</div><div class="foc-pill online">SYSTEM ONLINE</div><div style="font-size:9px;color:var(--foc-muted)">FOC V2 Fortified — V1.2 Base + Deliberated</div></div>
  <div style="display:flex;gap:6px;align-items:center">
    <div class="foc-pill" id="sound-pill"><span id="sound-label">🔊 Sound OFF</span><select id="alarm-select" style="margin-left:6px"><option>Default Alarm</option><option>Custom</option></select><input type="file" id="custom-alarm-file" accept="audio/*" style="display:none"><button class="btn-sm" id="test-sound">Test</button></div>
    <div class="foc-pill off" id="bg-pill"><span id="bg-label">🔔 Background Alert OFF</span></div>
    <div class="foc-pill"><span id="datetime"></span></div>
    <div class="foc-pill">Manila</div>
    <div class="foc-pill" id="ph-pill">P&H Monitor — Pop: — Hap: —</div>
  </div>
</div>
<div class="foc-body">
  <div class="foc-rail"><div class="foc-rail-title">PRODUCTION</div><div id="prod-rail"></div></div>
  <div class="foc-center">
    <div class="foc-tabs"><div class="foc-tab active" data-w="qlotd">QLOTD</div><div class="foc-tab" data-w="inventory">Inventory</div><div class="foc-tab" data-w="population">Population</div><div class="foc-tab" data-w="happiness">Happiness</div><div class="foc-tab" data-w="buildings">Buildings</div><div class="foc-tab" data-w="system">System</div></div>
    <div id="qlotd-workspace">
      <div class="foc-subtabs"><div class="foc-subtab" data-s="timers">TIMERS</div><div class="foc-subtab active" data-s="manual">MANUAL PRIORITIES</div><div class="foc-subtab" data-s="editor">EDITOR</div></div>
      <div class="card"><div class="card-h">MANUAL PRIORITY MONITOR — V2 Fortified — Once|Recurring + Edit/Delete/Restart Same + Enter=Save+Start <div><span class="badge recurring">Recurring = Template, You Restart</span></div></div>
        <div class="card-b">
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
            <input id="mp-activity" list="activity-list" placeholder="Activity or building name" style="min-width:180px"><datalist id="activity-list"></datalist>
            <input id="mp-duration" placeholder="0d 00:10:00" style="width:130px" title="Manual format: 0d HH:MM:SS">
            <div style="display:flex;border:1px solid var(--foc-border);border-radius:999px;overflow:hidden"><button class="btn-sm" id="type-once" style="border-radius:0">Once</button><button class="btn-sm" id="type-recurring" style="border-radius:0">Recurring</button></div>
            <input id="mp-notes" placeholder="Notes" style="min-width:160px">
            <button class="btn-sm success" id="mp-add">Add / Save + Start</button><button class="btn-sm" id="mp-clear">Clear</button>
            <span style="font-size:9px;color:var(--foc-muted)">Press Enter in any field = Save+Start</span>
          </div>
          <table><thead><tr><th>Activity</th><th>Time Remaining</th><th>Notes</th><th>Type</th><th>Actions</th></tr></thead><tbody id="mp-table"></tbody></table>
        </div>
      </div>
      <div class="card"><div class="card-h">QLOTD MONITOR</div><div class="card-b"><table><thead><tr><th>Activity</th><th>Time Remaining</th><th>Resource</th><th>Actions</th></tr></thead><tbody id="qlotd-table"></tbody></table></div></div>
    </div>
    <div id="population-workspace" style="display:none">
      <div class="card"><div class="card-h">POPULATION SIMEX — LIVE vs PLANNED <div style="display:flex;gap:6px"><button class="btn-sm" id="pop-new-scenario">New Scenario</button><button class="btn-sm gold" id="pop-add-building">Add Building</button><button class="btn-sm gold" id="pop-add-all-live">Add ALL LIVE City Instances</button><select id="pop-group"><option>Group: None</option><option>Group: Era</option></select><input id="pop-filter" placeholder="Filter"></div></div>
        <div class="card-b"><div id="pop-scenarios" style="display:flex;gap:6px;margin-bottom:8px"></div><table><thead><tr><th>Building</th><th>Qty</th><th>Pop Provided</th><th>Actions</th></tr></thead><tbody id="pop-table"></tbody></table><div style="margin-top:10px;display:flex;gap:12px"><div class="foc-pill">LIVE Pop Used: <span id="pop-live-used">0</span></div><div class="foc-pill">PLANNED Provided: <span id="pop-planned-prov">0</span></div><div class="foc-pill">Delta: <span id="pop-delta">0</span></div></div></div>
      </div>
    </div>
    <div id="happiness-workspace" style="display:none">
      <div class="card"><div class="card-h">HAPPINESS SIMEX — LIVE vs PLANNED <div style="display:flex;gap:6px"><button class="btn-sm" id="hap-new-scenario">New Scenario</button><button class="btn-sm gold" id="hap-add-building">Add Building</button><button class="btn-sm gold" id="hap-add-all-live">Add ALL LIVE</button><select id="hap-aid"><option>Aid All</option><option>Polish 2X</option></select></div></div>
        <div class="card-b"><table><thead><tr><th>Building</th><th>Qty</th><th>Happiness</th><th>Actions</th></tr></thead><tbody id="hap-table"></tbody></table></div>
      </div>
    </div>
    <div id="system-workspace" style="display:none"><div class="card"><div class="card-h">SYSTEM — V2 Fortified — Background Engine Status</div><div class="card-b"><div id="sys-log" style="font-family:monospace;font-size:11px;white-space:pre-wrap"></div></div></div></div>
  </div>
  <div class="foc-rail right"><div class="foc-rail-title">COMBAT</div><div id="combat-rail"></div></div>
</div>
<div class="foc-alert" id="foc-alert"><div style="font-weight:800;color:var(--foc-gold)" id="alert-title">FOC ALERT</div><div id="alert-body" style="font-size:11px;margin:6px 0"></div><div style="display:flex;gap:6px"><button class="btn-sm success" id="alert-go">Go to FOC</button><button class="btn-sm gold" id="alert-restart">Restart Same</button><button class="btn-sm" id="alert-snooze">Snooze 5m</button><button class="btn-sm" id="alert-dismiss">Dismiss</button></div></div>
<script>
let timers = JSON.parse(localStorage.getItem('foc_v2_timers')||'[]');
let editingId = null;
let mpType = 'once';
let soundOn = false;
let bgOn = false;
let swReg = null;
let currentAlertTimer = null;
const buildingCatalog = { 'Victorian Villa':{pop: 500, hap: 300}, 'Royal Manor':{pop:1200,hap:800}, 'Seed Vault':{pop:0,hap:1500}, 'Coin Factory':{pop:100,hap:50} };
let popScenarios = JSON.parse(localStorage.getItem('foc_v2_pop')||'[{"id":"default","name":"Default","buildings":[]}]');
let popActive = 'default';

function log(m){ const el=document.getElementById('sys-log'); if(el){ el.textContent += m+'\\n'; } }

function formatFOCTime(sec){ sec=Math.max(0,Math.floor(sec)); const d=Math.floor(sec/86400); sec%=86400; const h=Math.floor(sec/3600); sec%=3600; const m=Math.floor(sec/60); const s=sec%60; return d+'d '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }
function parseManualDuration(txt){ const m = txt.trim().match(/^(\\d+)d\\s+(\\d{1,2}):(\\d{2}):(\\d{2})$/); if(!m) return null; const d=parseInt(m[1]), h=parseInt(m[2]), mm=parseInt(m[3]), ss=parseInt(m[4]); if(h>23||mm>59||ss>59) return null; return d*86400+h*3600+mm*60+ss; }

function saveTimers(){ localStorage.setItem('foc_v2_timers', JSON.stringify(timers)); syncToSW(); renderMP(); }

function syncToSW(){ if(!bgOn || !swReg) return; const payload = timers.filter(t=>t.targetTime).map(t=>({id:t.id, activity:t.activity, durationText:t.durationText, targetTime:t.targetTime, type:t.type, notes:t.notes})); if(swReg.active){ swReg.active.postMessage({type:'SYNC_TIMERS', timers: payload}); log('Synced '+payload.length+' timers to SW'); } }

async function initSW(){
  if(!('serviceWorker' in navigator)) { log('SW not supported'); return; }
  try{
    const blob = new Blob([SERVICE_WORKER_JS], {type:'application/javascript'});
    const url = URL.createObjectURL(blob);
    swReg = await navigator.serviceWorker.register(url);
    log('SW registered');
    navigator.serviceWorker.addEventListener('message', e=>{
      if(e.data.type==='PLAY_ALARM'){ playAlarm(); showAlert(e.data.timer); }
      if(e.data.type==='RESTART_TIMER'){ restartTimer(e.data.id); }
      if(e.data.type==='SNOOZE_TIMER'){ snoozeTimer(e.data.id, e.data.mins); }
    });
  }catch(err){ log('SW fail '+err); }
}

function playAlarm(){
  if(!soundOn) return;
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain(); o.type='sine'; o.frequency.value=880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.3, ctx.currentTime); o.start(); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+1.2); o.stop(ctx.currentTime+1.2);
  }catch(e){}
}

function showAlert(t){
  currentAlertTimer = t;
  document.getElementById('alert-title').textContent = 'FOC ALERT — '+t.activity+' READY'+(t.type==='recurring'?' (Recurring)':'');
  document.getElementById('alert-body').textContent = 'Duration '+t.durationText+' — Timer up. '+(t.notes||'');
  document.getElementById('alert-restart').textContent = 'Restart Same '+t.durationText;
  document.getElementById('foc-alert').classList.add('show');
}

function renderMP(){
  const tbody = document.getElementById('mp-table'); tbody.innerHTML='';
  const now = Date.now();
  timers.forEach(t=>{
    const tr=document.createElement('tr');
    let remaining = t.targetTime ? Math.max(0, Math.floor((t.targetTime-now)/1000)) : (t.remaining||0);
    let timeCell = remaining<=0 && t.targetTime ? '<span class=ready>READY</span>' : formatFOCTime(remaining);
    let typeBadge = t.type==='recurring' ? '<span class=badge recurring>Recurring</span>' : '<span class=badge once>Once</span>';
    let actions='';
    if(remaining<=0 && t.targetTime){
      if(t.type==='recurring'){ actions = \`<button class="btn-sm gold" onclick="restartTimer('\${t.id}')">Restart Same \${t.durationText}</button> <button class="btn-sm" onclick="editTimer('\${t.id}')">Edit</button> <button class="btn-sm danger" onclick="deleteTimer('\${t.id}')">Delete</button>\`; }
      else { actions = \`<button class="btn-sm gold" onclick="restartTimer('\${t.id}')">Restart</button> <button class="btn-sm" onclick="editTimer('\${t.id}')">Edit</button> <button class="btn-sm danger" onclick="deleteTimer('\${t.id}')">Delete</button>\`; }
    } else {
      actions = \`<button class="btn-sm" onclick="pauseTimer('\${t.id}')">\${t.paused?'Resume':'Pause'}</button> <button class="btn-sm" onclick="editTimer('\${t.id}')">Edit</button> <button class="btn-sm danger" onclick="deleteTimer('\${t.id}')">Delete</button>\`;
    }
    tr.innerHTML = \`<td>\${t.activity}</td><td>\${timeCell}</td><td>\${t.notes||''}</td><td>\${typeBadge}</td><td>\${actions}</td>\`;
    tbody.appendChild(tr);
  });
}

function addOrSave(){
  const act = document.getElementById('mp-activity').value.trim(); const durText = document.getElementById('mp-duration').value.trim(); const notes = document.getElementById('mp-notes').value.trim();
  if(!act){ alert('Activity required'); return; }
  const secs = parseManualDuration(durText); if(secs===null){ alert('Invalid duration. Use format: 0d 00:10:00'); return; }
  if(editingId){
    const t = timers.find(x=>x.id===editingId); if(t){ t.activity=act; t.durationText=durText; t.duration=secs; t.notes=notes; t.type=mpType; t.targetTime=Date.now()+secs*1000; t.paused=false; t.notified=false; }
    editingId=null;
  } else {
    timers.push({id:'mp_'+Date.now(), activity:act, durationText:durText, duration:secs, notes:notes, type:mpType, targetTime:Date.now()+secs*1000, paused:false});
  }
  document.getElementById('mp-activity').value=''; document.getElementById('mp-duration').value=''; document.getElementById('mp-notes').value='';
  saveTimers();
}

function restartTimer(id){ const t=timers.find(x=>x.id===id); if(!t) return; t.targetTime=Date.now()+t.duration*1000; t.notified=false; t.paused=false; saveTimers(); document.getElementById('foc-alert').classList.remove('show'); }
function snoozeTimer(id, mins){ const t=timers.find(x=>x.id===id); if(!t) return; t.targetTime=Date.now()+mins*60*1000; t.notified=false; saveTimers(); }
function pauseTimer(id){ const t=timers.find(x=>x.id===id); if(!t) return; if(t.paused){ t.targetTime=Date.now()+(t.remaining||0)*1000; t.paused=false; } else { t.remaining=Math.max(0,Math.floor((t.targetTime-Date.now())/1000)); t.targetTime=null; t.paused=true; } saveTimers(); }
function editTimer(id){ const t=timers.find(x=>x.id===id); if(!t) return; document.getElementById('mp-activity').value=t.activity; document.getElementById('mp-duration').value=t.durationText; document.getElementById('mp-notes').value=t.notes||''; mpType=t.type; updateTypeUI(); editingId=id; }
function deleteTimer(id){ if(!confirm('Delete?')) return; timers=timers.filter(x=>x.id!==id); saveTimers(); }
function updateTypeUI(){ document.getElementById('type-once').className = mpType==='once' ? 'btn-sm gold' : 'btn-sm'; document.getElementById('type-recurring').className = mpType==='recurring' ? 'btn-sm gold' : 'btn-sm'; }

document.getElementById('mp-add').addEventListener('click', addOrSave);
document.getElementById('mp-clear').addEventListener('click', ()=>{ document.getElementById('mp-activity').value=''; document.getElementById('mp-duration').value=''; document.getElementById('mp-notes').value=''; editingId=null; });
document.getElementById('type-once').addEventListener('click', ()=>{ mpType='once'; updateTypeUI(); });
document.getElementById('type-recurring').addEventListener('click', ()=>{ mpType='recurring'; updateTypeUI(); });
['mp-activity','mp-duration','mp-notes'].forEach(id=>{ document.getElementById(id).addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); addOrSave(); } }); });

document.getElementById('sound-pill').addEventListener('click', (e)=>{ if(e.target.tagName==='SELECT'||e.target.tagName==='BUTTON'||e.target.tagName==='INPUT') return; soundOn=!soundOn; document.getElementById('sound-label').textContent = soundOn ? '🔊 Sound ON' : '🔊 Sound OFF'; document.getElementById('sound-pill').className = soundOn ? 'foc-pill on' : 'foc-pill off'; if(soundOn) playAlarm(); });
document.getElementById('bg-pill').addEventListener('click', async ()=>{
  if(!bgOn){
    const perm = await Notification.requestPermission();
    if(perm!=='granted'){ alert('Allow notifications for Background Alert'); return; }
    bgOn=true; document.getElementById('bg-label').textContent='🔔 Background Alert ON'; document.getElementById('bg-pill').className='foc-pill bg-on'; await initSW(); syncToSW(); log('Background Alert ON');
  } else {
    bgOn=false; document.getElementById('bg-label').textContent='🔔 Background Alert OFF'; document.getElementById('bg-pill').className='foc-pill off'; if(swReg&&swReg.active){ swReg.active.postMessage({type:'CLEAR_TIMERS'}); } log('Background Alert OFF');
  }
});
document.getElementById('test-sound').addEventListener('click', ()=>{ soundOn=true; document.getElementById('sound-label').textContent='🔊 Sound ON'; document.getElementById('sound-pill').className='foc-pill on'; playAlarm(); });
document.getElementById('alert-dismiss').addEventListener('click', ()=>{ document.getElementById('foc-alert').classList.remove('show'); });
document.getElementById('alert-go').addEventListener('click', ()=>{ document.getElementById('foc-alert').classList.remove('show'); window.scrollTo(0,0); });
document.getElementById('alert-restart').addEventListener('click', ()=>{ if(currentAlertTimer) restartTimer(currentAlertTimer.id); });
document.getElementById('alert-snooze').addEventListener('click', ()=>{ if(currentAlertTimer) snoozeTimer(currentAlertTimer.id,5); document.getElementById('foc-alert').classList.remove('show'); });

// Tick
setInterval(()=>{
  const now=Date.now();
  let needSave=false;
  timers.forEach(t=>{
    if(t.targetTime && now>=t.targetTime && !t.notified){
      t.notified=true; playAlarm(); showAlert(t); needSave=true;
    }
  });
  renderMP();
  if(needSave) localStorage.setItem('foc_v2_timers', JSON.stringify(timers));
  document.getElementById('datetime').textContent = new Date().toLocaleString();
},1000);

// Rails mock
function renderRails(){ const prod=document.getElementById('prod-rail'); prod.innerHTML=['Coins','Supplies','FP','Goods','Special','Guild'].map(n=>\`<div class=foc-rail-item><span>\${n}</span><span style="color:var(--foc-muted)">Loading</span></div>\`).join(''); const combat=document.getElementById('combat-rail'); combat.innerHTML=['Attacking','City Defenders','GBG','GE','QI','QI Boost'].map(n=>\`<div class=foc-rail-item><span>\${n}</span><span>—</span></div>\`).join(''); }
renderRails(); updateTypeUI(); renderMP();
log('FOC V2 Fortified loaded — V1.2 base preserved — Manual Recurring + Background Alert ready');
</script>
</body></html>
`;

const SERVICE_WORKER_JS = `
const VERSION = 'FOC_V2_SW_1.0';
let timerMap = new Map();
let checkInterval = null;
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('message', e => {
  const data = e.data;
  if (data && data.type === 'SYNC_TIMERS') {
    timerMap.clear();
    for (const t of data.timers) { timerMap.set(t.id, t); }
    if (!checkInterval) { checkInterval = setInterval(checkDue, 1000); }
  }
  if (data && data.type === 'CLEAR_TIMERS') { timerMap.clear(); }
});
function checkDue() {
  const now = Date.now();
  for (const [id, t] of timerMap) {
    if (t.targetTime && now >= t.targetTime && !t.notified) {
      t.notified = true;
      const title = \`FOC ALERT — \${t.activity} READY\${t.type==='recurring'?' (Recurring)':''}\`;
      const body = \`Duration \${t.durationText} — Timer's up.\${t.notes ? ' Note: '+t.notes : ''}\`;
      self.registration.showNotification(title, {
        body: body,
        icon: 'https://fochqs-dot.github.io/foc-assets/foc-icon-192.png',
        badge: 'https://fochqs-dot.github.io/foc-assets/foc-icon-192.png',
        tag: t.id,
        requireInteraction: true,
        data: { id: t.id, activity: t.activity, durationText: t.durationText, type: t.type },
        actions: [
          { action: 'go', title: 'Go to FOC' },
          { action: 'restart', title: \`Restart Same \${t.durationText}\` },
          { action: 'snooze', title: 'Snooze 5m' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });
      self.clients.matchAll().then(clients => { for (const c of clients) c.postMessage({ type: 'PLAY_ALARM', timer: t }); });
    }
  }
}
self.addEventListener('notificationclick', event => {
  const action = event.action;
  const data = event.notification.data;
  event.notification.close();
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window' });
    let focClient = allClients.find(c => true);
    if (action === 'go' || action === '') {
      if (focClient) { focClient.focus(); focClient.postMessage({ type: 'FOCUS_TIMER', id: data.id }); }
      else { self.clients.openWindow('/'); }
    } else if (action === 'restart') {
      if (focClient) { focClient.postMessage({ type: 'RESTART_TIMER', id: data.id }); focClient.focus(); }
      else { self.clients.openWindow('/?restart='+data.id); }
    } else if (action === 'snooze') {
      if (focClient) { focClient.postMessage({ type: 'SNOOZE_TIMER', id: data.id, mins: 5 }); }
    }
  })());
});
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/foc-sw.js') {
      return new Response(SERVICE_WORKER_JS, { headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' } });
    }
    if (url.pathname === '/health') {
      return new Response('FOC V2 Fortified OK', { headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response(HTML_TEMPLATE.replace('SERVICE_WORKER_JS', JSON.stringify(SERVICE_WORKER_JS)), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
  }
}
