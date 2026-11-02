const API = '/api/v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function apiGet(path) { const r = await fetch(API + path, { credentials: 'include' }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
async function apiSend(path, method = 'POST', body, isForm = false) {
  const opts = { method, credentials: 'include' };
  if (body && !isForm) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
  else if (body) opts.body = body;
  const r = await fetch(API + path, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
function toast(msg, ok = true) {
  let w = $('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
  const d = document.createElement('div');
  d.className = `alert alert-${ok ? 'success' : 'danger'} shadow`;
  d.textContent = msg; w.appendChild(d); setTimeout(() => d.remove(), 3500);
}
function jobCard(j) {
  const cats = (j.categories || []).map((c) => c.category?.name || c.name).filter(Boolean).join(', ');
  return `<div class="col-md-6 col-lg-4 mb-3"><div class="card job-card h-100">
    <div class="card-body">
      <span class="badge bg-success mb-2">${esc(j.institution?.name || 'Govt')}</span>
      <span class="badge badge-status-${esc(j.applicationStatus || '')} ms-1">${esc(j.applicationStatus || j.status)}</span>
      <h5 class="card-title mt-2"><a href="/job-details.html?slug=${esc(j.slug)}" class="text-decoration-none text-dark">${esc(j.title)}</a></h5>
      <p class="text-muted small mb-1">${esc(cats)} ${j.grade ? '• ' + esc(j.grade.name) : ''}</p>
      <p class="small mb-1"><i class="fa fa-users"></i> ${j.totalPosts ?? '-'} posts ${j.salaryOverride ? '• ৳' + j.salaryOverride : ''}</p>
      <p class="small text-danger mb-2"><i class="fa fa-clock"></i> Deadline: ${j.applyDeadline ? new Date(j.applyDeadline).toLocaleDateString() : '-'}</p>
      <a class="btn btn-sm btn-success" href="/job-details.html?slug=${esc(j.slug)}">View Details</a>
    </div></div></div>`;
}
async function loadSettings() {
  try { const s = await apiGet('/settings/public'); if (s.site_name) $$('[data-site-name]').forEach((e) => (e.textContent = s.site_name)); } catch {}
}
loadSettings();
