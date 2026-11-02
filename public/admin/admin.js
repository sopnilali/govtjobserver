// Admin SPA - all CRUD via /api/v1
let GRADES = [], CATS = [], INSTS = [], AUTHORS = [];
let editingJobId = null;

$$2('[data-v]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); $$2('[data-v]').forEach((x) => x.classList.remove('active')); a.classList.add('active'); show(a.dataset.v); }));
function $$2(s) { return [...document.querySelectorAll(s)]; }
async function ensureAuth() {
  try { await apiGet('/auth/me'); } catch { location.href = '/admin/login.html'; }
}
$('#logout').onclick = async (e) => { e.preventDefault(); await apiSend('/auth/logout'); location.href = '/admin/login.html'; };

async function preload() {
  try { GRADES = await apiGet('/job-grades'); } catch { GRADES = []; }
  try { CATS = await apiGet('/admin/categories'); } catch { CATS = await apiGet('/categories'); }
  try { INSTS = await apiGet('/admin/institutions'); } catch { INSTS = []; }
  try { AUTHORS = await apiGet('/admin/authors'); } catch { AUTHORS = []; }
}

async function show(v) {
  $('#title').textContent = v;
  const el = $('#view'); el.innerHTML = '<p>Loading...</p>';
  await preload();
  if (v === 'dashboard') return vDashboard(el);
  if (v === 'jobs') return vJobs(el);
  if (v === 'jobform') return vJobForm(el);
  if (v === 'grades') return vGrades(el);
  if (v === 'categories') return vSimple(el, 'categories', '/admin/categories', ['name', 'slug', 'description', 'icon', 'sortOrder', 'isActive']);
  if (v === 'institutions') return vSimple(el, 'institutions', '/admin/institutions', ['name', 'slug', 'logo', 'type', 'description', 'address', 'website', 'isActive']);
  if (v === 'authors') return vSimple(el, 'authors', '/admin/authors', ['name', 'slug', 'profileImage', 'designation', 'bio', 'website', 'isActive']);
  if (v === 'blocks') return vBlocks(el);
  if (v === 'notices') return vSimple(el, 'notices', '/admin/notices', ['title', 'slug', 'content', 'fileUrl', 'status']);
  if (v === 'pages') return vSimple(el, 'pages', '/admin/pages', ['title', 'slug', 'content', 'status', 'seoTitle', 'seoDescription']);
  if (v === 'media') return vMedia(el);
  if (v === 'settings') return vSettings(el);
}

async function vDashboard(el) {
  const s = await apiGet('/admin/dashboard/summary');
  const recent = await apiGet('/admin/dashboard/recent-jobs');
  el.innerHTML = `<div class="row">${['totalJobs|Total Jobs', 'publishedJobs|Published', 'draftJobs|Drafts', 'totalInstitutions|Institutions', 'totalCategories|Categories', 'totalAuthors|Authors'].map((x) => { const [k, l] = x.split('|'); return `<div class="col-md-2"><div class="card p-3 text-center"><h3>${s[k] ?? 0}</h3><small>${l}</small></div></div>`; }).join('')}</div>
  <div class="mt-3"><button class="btn btn-success btn-sm" onclick="nav('jobform')">+ Add Job</button> <button class="btn btn-outline-success btn-sm" onclick="nav('grades')">Grades</button></div>
  <h5 class="mt-3">Recent Jobs</h5><table class="table table-bordered"><tr><th>Title</th><th>Status</th><th>Updated</th></tr>${recent.map((j) => `<tr><td>${esc(j.title)}</td><td>${j.status}</td><td>${new Date(j.updatedAt).toLocaleString()}</td></tr>`).join('')}</table>`;
}
function nav(v) { document.querySelector(`[data-v="${v}"]`).click(); }

async function vJobs(el) {
  const jobs = await apiGet('/admin/jobs');
  el.innerHTML = `<input id="q" class="form-control mb-2" placeholder="Search..."><table class="table table-bordered table-sm">
  <tr><th>Title</th><th>Status</th><th>Grade</th><th>Actions</th></tr>
  ${jobs.map((j) => `<tr><td>${esc(j.title)}</td><td>${j.status}</td><td>${esc(j.grade?.name || '')}</td>
  <td><button class="btn btn-sm btn-primary" onclick="editJob(${j.id})">Edit</button>
  <button class="btn btn-sm btn-secondary" onclick="dupJob(${j.id})">Duplicate</button>
  <button class="btn btn-sm btn-success" onclick="pubJob(${j.id},'${j.status}')">Pub/Unpub</button>
  <button class="btn btn-sm btn-danger" onclick="delJob(${j.id})">Delete</button></td></tr>`).join('')}</table>`;
  $('#q').oninput = (e) => { const v = e.target.value.toLowerCase(); $$2('table tr').forEach((r, i) => { if (i > 0) r.style.display = r.textContent.toLowerCase().includes(v) ? '' : 'none'; }); };
}
window.editJob = async (id) => { editingJobId = id; nav('jobform'); };
window.dupJob = async (id) => { await apiSend(`/admin/jobs/${id}/duplicate`); toast('Duplicated'); show('jobs'); };
window.pubJob = async (id, st) => { await apiSend(`/admin/jobs/${id}/${st === 'published' ? 'unpublish' : 'publish'}`); toast('Status changed'); show('jobs'); };
window.delJob = async (id) => { if (!confirm('Delete job?')) return; await apiSend(`/admin/jobs/${id}`, 'DELETE'); toast('Deleted'); show('jobs'); };

async function vJobForm(el) {
  const grades = await apiGet('/job-grades').catch(() => []);
  let adminGrades = [];
  try { adminGrades = await apiGet('/admin/job-grades'); } catch {}
  const all = adminGrades.length ? adminGrades : grades;
  let j = {};
  if (editingJobId) { j = await apiGet(`/admin/jobs/${editingJobId}`); }
  const gradeOpts = all.filter((g) => g.isActive || g.id === j.gradeId).map((g) => `<option value="${g.id}" ${j.gradeId === g.id ? 'selected' : ''}>${esc(g.name)} ${g.label ? '(' + esc(g.label) + ')' : ''} ৳${g.salaryMin ?? ''}-${g.salaryMax ?? ''}</option>`).join('');
  el.innerHTML = `<div class="card p-3"><h5>${editingJobId ? 'Edit Job #' + editingJobId : 'Add New Job'}</h5>
  <div class="row g-2">
  <div class="col-md-8"><label>Title*</label><input id="f_title" class="form-control" value="${esc(j.title || '')}"></div>
  <div class="col-md-4"><label>Slug</label><input id="f_slug" class="form-control" value="${esc(j.slug || '')}"></div>
  <div class="col-md-12"><label>Short info</label><textarea id="f_short" class="form-control">${esc(j.shortInfo || '')}</textarea></div>
  <div class="col-md-3"><label>Total posts</label><input id="f_posts" type="number" class="form-control" value="${j.totalPosts ?? ''}"></div>
  <div class="col-md-3"><label>Job type</label><select id="f_type" class="form-select"><option>full-time</option><option ${j.jobType === 'part-time' ? 'selected' : ''}>part-time</option><option ${j.jobType === 'contract' ? 'selected' : ''}>contract</option></select></div>
  <div class="col-md-6"><label>Grade* (dynamic from /job-grades)</label><select id="f_grade" class="form-select"><option value="">-- none --</option>${gradeOpts}</select>
  <small class="text-muted">New grades appear here automatically after refresh.</small></div>
  <div class="col-md-3"><label>Salary override (optional)</label><input id="f_sal" type="number" class="form-control" value="${j.salaryOverride ?? ''}" placeholder="Official amount if different"></div>
  <div class="col-md-3"><label>Institution</label><select id="f_inst" class="form-select"><option value="">--</option>${INSTS.map((i) => `<option value="${i.id}" ${j.institutionId === i.id ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select></div>
  <div class="col-md-3"><label>Author</label><select id="f_auth" class="form-select"><option value="">--</option>${AUTHORS.map((a) => `<option value="${a.id}" ${j.authorId === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
  <div class="col-md-3"><label>Status</label><select id="f_status" class="form-select"><option value="draft" ${j.status === 'draft' ? 'selected' : ''}>draft</option><option value="published" ${j.status === 'published' ? 'selected' : ''}>published</option></select></div>
  <div class="col-md-12"><label>Categories (multi)</label><div>${CATS.map((c) => `<label class="me-3"><input type="checkbox" class="ck-cat" value="${c.id}" ${(j.categories || []).some((x) => x.categoryId === c.id) ? 'checked' : ''}> ${esc(c.name)}</label>`).join('')}</div></div>
  <div class="col-md-6"><label>Education</label><textarea id="f_edu" class="form-control">${esc(j.education || '')}</textarea></div>
  <div class="col-md-3"><label>Age limit</label><input id="f_age" class="form-control" value="${esc(j.ageLimit || '')}"></div>
  <div class="col-md-3"><label>Experience</label><input id="f_exp" class="form-control" value="${esc(j.experience || '')}"></div>
  <div class="col-md-4"><label>Fee</label><input id="f_fee" class="form-control" value="${esc(j.applicationFee || '')}"></div>
  <div class="col-md-8"><label>Apply URL (official)</label><input id="f_url" class="form-control" value="${esc(j.applyUrl || '')}"></div>
  <div class="col-md-6"><label>Circular image URL</label><input id="f_img" class="form-control" value="${esc(j.circularImage || '')}"></div>
  <div class="col-md-6"><label>Circular PDF URL</label><input id="f_pdf" class="form-control" value="${esc(j.circularPdf || '')}"></div>
  <div class="col-md-4"><label>Apply start</label><input id="f_s" type="date" class="form-control" value="${j.applyStart ? j.applyStart.slice(0, 10) : ''}"></div>
  <div class="col-md-4"><label>Deadline</label><input id="f_d" type="date" class="form-control" value="${j.applyDeadline ? j.applyDeadline.slice(0, 10) : ''}"></div>
  <div class="col-md-4"><label>Featured</label><input id="f_feat" type="checkbox" ${j.isFeatured ? 'checked' : ''}></div>
  <div class="col-12 mt-2"><button class="btn btn-success" id="save">Save</button> <button class="btn btn-secondary" onclick="editingJobId=null;show('jobform')">New</button>
  ${editingJobId ? `<button class="btn btn-outline-primary" onclick="nav('blocks')">Manage Content Blocks →</button>` : ''}</div>
  <div id="msg"></div></div></div>`;
  // grade prefill salary
  $('#f_grade').onchange = (e) => {
    const g = all.find((x) => String(x.id) === e.target.value);
    if (g && !$('#f_sal').value) $('#f_sal').value = g.salaryMin || '';
  };
  $('#save').onclick = async () => {
    const body = {
      title: $('#f_title').value, slug: $('#f_slug').value || undefined, shortInfo: $('#f_short').value,
      totalPosts: $('#f_posts').value ? Number($('#f_posts').value) : null, jobType: $('#f_type').value,
      gradeId: $('#f_grade').value ? Number($('#f_grade').value) : null,
      salaryOverride: $('#f_sal').value ? Number($('#f_sal').value) : null,
      institutionId: $('#f_inst').value ? Number($('#f_inst').value) : null,
      authorId: $('#f_auth').value ? Number($('#f_auth').value) : null,
      status: $('#f_status').value, education: $('#f_edu').value, ageLimit: $('#f_age').value,
      experience: $('#f_exp').value, applicationFee: $('#f_fee').value, applyUrl: $('#f_url').value || null,
      circularImage: $('#f_img').value || null, circularPdf: $('#f_pdf').value || null,
      applyStart: $('#f_s').value || null, applyDeadline: $('#f_d').value || null,
      isFeatured: $('#f_feat').checked,
      categoryIds: $$2('.ck-cat').filter((c) => c.checked).map((c) => Number(c.value)),
    };
    try {
      if (editingJobId) await apiSend(`/admin/jobs/${editingJobId}`, 'PUT', body);
      else { const r = await apiSend('/admin/jobs', 'POST', body); editingJobId = r.id; }
      toast('Saved'); show('jobs');
    } catch (e) { toast('Save failed: ' + e.message, false); }
  };
}

async function vGrades(el) {
  const list = await apiGet('/admin/job-grades');
  el.innerHTML = `<div class="card p-3 mb-2"><h5>Add/Edit Grade</h5>
  <div class="row g-2"><div class="col"><input id="g_name" class="form-control" placeholder="Name e.g. Grade 9"></div>
  <div class="col"><input id="g_label" class="form-control" placeholder="Label e.g. ৯ম গ্রেড"></div>
  <div class="col"><input id="g_code" class="form-control" placeholder="Code e.g. G9"></div>
  <div class="col"><input id="g_min" type="number" class="form-control" placeholder="Min"></div>
  <div class="col"><input id="g_max" type="number" class="form-control" placeholder="Max"></div>
  <div class="col"><button id="g_add" class="btn btn-success">Add</button></div></div></div>
  <table class="table table-bordered table-sm"><tr><th>Order</th><th>Name</th><th>Code</th><th>Salary</th><th>Jobs</th><th>Active</th><th>Actions</th></tr>
  ${list.map((g) => `<tr><td>${g.sortOrder}</td><td>${esc(g.name)} ${esc(g.label || '')}</td><td>${esc(g.code)}</td><td>${g.salaryMin}-${g.salaryMax}</td><td>${g._count?.jobs ?? 0}</td><td>${g.isActive ? 'Yes' : 'No'}</td>
  <td><button class="btn btn-sm btn-warning" onclick="toggleGrade(${g.id},${!g.isActive})">${g.isActive ? 'Deactivate' : 'Activate'}</button>
  <button class="btn btn-sm btn-danger" onclick="delGrade(${g.id})">Delete</button></td></tr>`).join('')}</table>
  <small class="text-muted">Deletion blocked when jobs use the grade — deactivate instead.</small>`;
  $('#g_add').onclick = async () => {
    try { await apiSend('/admin/job-grades', 'POST', { name: $('#g_name').value, label: $('#g_label').value, code: $('#g_code').value, salaryMin: Number($('#g_min').value) || null, salaryMax: Number($('#g_max').value) || null }); toast('Grade added'); show('grades'); }
    catch (e) { toast(e.message, false); }
  };
}
window.toggleGrade = async (id, v) => { await apiSend(`/admin/job-grades/${id}/status`, 'PATCH', { isActive: v }); show('grades'); };
window.delGrade = async (id) => { if (!confirm('Delete grade?')) return; try { await apiSend(`/admin/job-grades/${id}`, 'DELETE'); show('grades'); } catch (e) { toast(e.message, false); } };

async function vSimple(el, name, base, fields) {
  const list = await apiGet(base);
  el.innerHTML = `<div class="card p-3 mb-2"><h5>Add ${name}</h5><div class="row g-2">
  ${fields.map((f) => `<div class="col-md-3"><input id="n_${f}" class="form-control" placeholder="${f}"></div>`).join('')}
  <div class="col-md-2"><button id="n_add" class="btn btn-success">Add</button></div></div></div>
  <table class="table table-bordered table-sm"><tr><th>ID</th><th>Name/Title</th><th>Slug</th><th>Actions</th></tr>
  ${list.map((x) => `<tr><td>${x.id}</td><td>${esc(x.name || x.title)}</td><td>${esc(x.slug || '')}</td>
  <td><button class="btn btn-sm btn-danger" onclick="delSimple('${base}',${x.id},'${name}')">Delete</button></td></tr>`).join('')}</table>
  <small class="text-muted">Edit: use PUT ${base}/:id via API docs. Inline edit omitted for simplicity.</small>`;
  $('#n_add').onclick = async () => {
    const body = {}; fields.forEach((f) => { const v = $('#n_' + f).value; if (v !== '') body[f] = (f === 'sortOrder' ? Number(v) : (f === 'isActive' ? v === 'true' || v === '1' || v === 'true' : v)); });
    try { await apiSend(base, 'POST', body); toast('Added'); show(name); } catch (e) { toast(e.message, false); }
  };
}
window.delSimple = async (base, id, view) => { if (!confirm('Delete?')) return; try { await apiSend(`${base}/${id}`, 'DELETE'); show(view); } catch (e) { toast(e.message, false); } };

async function vBlocks(el) {
  const jobs = await apiGet('/admin/jobs');
  el.innerHTML = `<label>Select Job</label><select id="b_job" class="form-select">${jobs.map((j) => `<option value="${j.id}" ${editingJobId === j.id ? 'selected' : ''}>${esc(j.title)}</option>`).join('')}</select>
  <div id="blist" class="mt-2"></div>
  <div class="card p-2 mt-2"><div class="row g-2"><div class="col"><select id="b_type" class="form-select">${['heading', 'paragraph', 'richtext', 'image', 'gallery', 'table', 'list', 'notice', 'warning', 'download', 'button', 'faq', 'video'].map((t) => `<option>${t}</option>`).join('')}</select></div>
  <div class="col"><input id="b_title" class="form-control" placeholder="Title"></div><div class="col"><input id="b_content" class="form-control" placeholder="Content/HTML"></div>
  <div class="col"><button id="b_add" class="btn btn-success">Add Block</button></div></div></div>`;
  async function load() {
    const id = $('#b_job').value; const blocks = await apiGet(`/admin/jobs/${id}/content-blocks`);
    $('#blist').innerHTML = blocks.map((b, i) => `<div class="card p-2 mb-1">[${b.sortOrder}] <b>${esc(b.type)}</b> ${esc(b.title || '')}
    <button class="btn btn-sm btn-danger float-end" onclick="delBlock(${$('#b_job').value},${b.id})">Delete</button></div>`).join('') || '<p>No blocks.</p>';
  }
  $('#b_job').onchange = load; await load();
  $('#b_add').onclick = async () => { await apiSend(`/admin/jobs/${$('#b_job').value}/content-blocks`, 'POST', { type: $('#b_type').value, title: $('#b_title').value, content: $('#b_content').value, sortOrder: Date.now() % 100000 }); load(); };
}
window.delBlock = async (jobId, id) => { await apiSend(`/admin/content-blocks/${id}`, 'DELETE'); show('blocks'); };

async function vMedia(el) {
  const list = await apiGet('/admin/uploads');
  el.innerHTML = `<input type="file" id="m_file" class="form-control mb-2"><button id="m_up" class="btn btn-success btn-sm mb-2">Upload (jpg/png/pdf, max 10MB)</button>
  <div class="row">${list.map((m) => `<div class="col-md-3"><div class="card p-2 mb-2"><small>${esc(m.filename)}</small><br><a href="${esc(m.url)}" target="_blank">${esc(m.url)}</a><br><button class="btn btn-sm btn-danger mt-1" onclick="delMedia(${m.id})">Delete</button></div></div>`).join('')}</div>`;
  $('#m_up').onclick = async () => {
    const f = $('#m_file').files[0]; if (!f) return toast('Choose file', false);
    const fd = new FormData(); fd.append('file', f);
    await apiSend('/admin/uploads', 'POST', fd, true); toast('Uploaded'); show('media');
  };
}
window.delMedia = async (id) => { await apiSend(`/admin/uploads/${id}`, 'DELETE'); show('media'); };

async function vSettings(el) {
  const s = await apiGet('/admin/settings'); const seo = await apiGet('/admin/seo/global').catch(() => ({}));
  const obj = {}; s.forEach((x) => (obj[x.key] = x.value));
  el.innerHTML = `<div class="card p-3"><h5>Website Settings (key/value)</h5>
  <label>Site name</label><input id="s_name" class="form-control" value="${esc(obj.site_name || '')}">
  <label class="mt-2">Tagline</label><input id="s_tag" class="form-control" value="${esc(obj.site_tagline || '')}">
  <button id="s_save" class="btn btn-success mt-2">Save Settings</button>
  <h5 class="mt-3">Global SEO</h5><input id="seo_t" class="form-control mb-1" placeholder="SEO title" value="${esc(seo?.title || '')}">
  <input id="seo_d" class="form-control" placeholder="Meta description" value="${esc(seo?.description || '')}">
  <button id="seo_save" class="btn btn-success mt-2">Save SEO</button></div>`;
  $('#s_save').onclick = async () => { await apiSend('/admin/settings', 'PUT', { settings: { site_name: $('#s_name').value, site_tagline: $('#s_tag').value } }); toast('Saved'); };
  $('#seo_save').onclick = async () => { await apiSend('/admin/seo/global', 'PUT', { title: $('#seo_t').value, description: $('#seo_d').value }); toast('SEO saved'); };
}

ensureAuth().then(show.bind(null, 'dashboard'));
