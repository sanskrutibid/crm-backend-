import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { SourceResponseDto } from './dto/source-response.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('Sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get('ui')
  @ApiOperation({
    summary: 'Interactive Sources Management UI',
    description: 'Interactive HTML/Web UI to manage, create, and view lead sources live.',
  })
  async getUi(@Res() res: any) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CRM Lead Sources</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f4f6f9;
      --card-bg: #ffffff;
      --border-color: #e5e9f0;
      --primary: #4f46e5;
      --primary-light: #eef2ff;
      --primary-text: #4338ca;
      --text-dark: #0f172a;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      --danger: #ef4444;
      --danger-bg: #fef2f2;
      --success: #10b981;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
      --shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    body {
      background-color: var(--bg);
      color: var(--text-dark);
      min-height: 100vh;
      padding: 24px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-dark);
    }
    .btn-docs {
      background: #ffffff;
      color: #475569;
      border: 1px solid var(--border-color);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }
    .btn-docs:hover {
      background: #f8fafc;
      color: var(--text-dark);
    }

    /* Split Layout */
    .split-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 860px) {
      .split-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Left Side: Master List */
    .left-panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .panel-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-dark);
    }
    .badge-count {
      background: var(--primary-light);
      color: var(--primary-text);
      font-weight: 700;
      font-size: 12px;
      padding: 3px 9px;
      border-radius: 12px;
    }
    .add-form-wrapper {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      background: #fafbfc;
    }
    .add-form {
      display: flex;
      gap: 8px;
    }
    .add-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      background: #ffffff;
    }
    .add-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .btn-add {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .btn-add:hover {
      background: #4338ca;
    }
    .sources-list {
      max-height: calc(100vh - 240px);
      overflow-y: auto;
    }
    .source-item {
      padding: 14px 20px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: background 0.15s;
    }
    .source-item:hover {
      background: #f8fafc;
    }
    .source-item.active {
      background: #eef2ff;
      border-left: 4px solid var(--primary);
    }
    .source-item-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .id-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 26px;
      padding: 0 8px;
      background: var(--primary-light);
      color: var(--primary-text);
      font-weight: 800;
      font-size: 13px;
      border-radius: 6px;
    }
    .source-item-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-dark);
    }

    /* Right Side: Detail View */
    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Search Box (Matching Screenshot) */
    .search-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 14px 18px;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .search-icon {
      color: var(--text-light);
      width: 18px;
      height: 18px;
    }
    .search-input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 14px;
      color: var(--text-dark);
      background: transparent;
    }
    .search-input::placeholder {
      color: var(--text-light);
    }

    /* Main Detail Card (Matching Screenshot Empty State) */
    .detail-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      box-shadow: var(--shadow-sm);
      padding: 40px 30px;
      min-height: 380px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    /* Screenshot Exact Empty State Typography */
    .empty-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f2e3d;
      margin-bottom: 8px;
      letter-spacing: -0.2px;
    }
    .empty-subtitle {
      font-size: 14px;
      color: #64748b;
      max-width: 400px;
      line-height: 1.5;
    }

    /* Add View / Details View */
    .view-card {
      width: 100%;
      text-align: left;
      display: none;
    }
    .btn-create-large {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 26px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
      transition: all 0.2s;
    }
    .btn-create-large:hover {
      background: #4338ca;
      transform: translateY(-1px);
    }
    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid var(--border-color);
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel:hover {
      background: #e2e8f0;
      color: var(--text-dark);
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }
    .detail-heading {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .detail-group {
      margin-bottom: 20px;
    }
    .detail-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 6px;
      display: block;
    }
    .detail-value-input {
      width: 100%;
      max-width: 400px;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-dark);
      outline: none;
    }
    .detail-value-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .detail-actions {
      display: flex;
      gap: 10px;
      margin-top: 24px;
    }
    .btn-save {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-save:hover {
      background: #4338ca;
    .btn-delete {
      background: var(--danger-bg);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-delete:hover {
      background: var(--danger);
      color: white;
    }
    .btn-back {
      background: #ffffff;
      color: #475569;
      border: 1px solid var(--border-color);
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: var(--shadow-sm);
      transition: all 0.15s ease;
    }
    .btn-back:hover {
      background: #f1f5f9;
      color: var(--text-dark);
      border-color: #cbd5e1;
    }

    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e293b;

      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      font-size: 14px;
      font-weight: 500;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
      pointer-events: none;
      z-index: 1000;
    }
    #toast.show { opacity: 1; transform: translateY(0); }
    #toast.success { border-left: 4px solid var(--success); }
    #toast.error { border-left: 4px solid var(--danger); }
  </style>
</head>
<body>
  <div class="container">
    <div class="page-header">
      <div class="page-title">Lead Sources Management</div>
      <a href="/docs#/Sources" target="_blank" class="btn-docs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        API Docs
      </a>
    </div>

    <!-- Master-Detail Split Layout -->
    <div class="split-layout">
      <!-- Left Panel: Add + Source List -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">All Sources</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge-count" id="countBadge">0 Sources</span>
            <button type="button" class="btn-add" onclick="openAddView()" style="padding: 6px 12px; font-size: 13px;">+ Add Source</button>
          </div>
        </div>

        <div class="add-form-wrapper">
          <form class="add-form" onsubmit="handleCreate(event)">
            <input type="text" id="sourceNameInput" class="add-input" placeholder="Enter Source Name..." required autocomplete="off" />
            <button type="submit" class="btn-add" id="addBtn">+ Add</button>
          </form>
        </div>

        <div class="sources-list" id="sourcesList">
          <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px;">
            Loading sources...
          </div>
        </div>
      </div>

      <!-- Right Panel: Search Bar + Detail / Empty Card -->
      <div class="right-panel">
        <!-- Top Search Card (Exact Match to Screenshot) -->
        <div class="search-card">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-input" id="searchInput" placeholder="Search Source" oninput="filterSources()" />
        </div>

        <!-- Main Detail Card -->
        <div class="detail-card" id="detailCard">
          <!-- Initial Empty State (Exact Match to Screenshot) -->
          <div id="emptyState">
            <h2 class="empty-title">No Source Selected</h2>
            <p class="empty-subtitle">Select any source from left side or create a new source.</p>
            <button type="button" class="btn-create-large" onclick="openAddView()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              + Add New Source
            </button>
          </div>

          <!-- Add Source View -->
          <div id="addView" class="view-card">
            <div class="detail-header">
              <div class="detail-heading">
                <span style="background: var(--primary-light); color: var(--primary-text); padding: 4px 10px; border-radius: 8px; font-size: 14px; font-weight: 800;">NEW</span>
                <span>Add Lead Source</span>
              </div>
              <button type="button" class="btn-back" onclick="resetSelection()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                <span>Back</span>
              </button>
            </div>

            <form onsubmit="handleCreateFromCard(event)" style="margin-top: 14px;">
              <div class="detail-group">
                <label class="detail-label">Source Name (Required)</label>
                <input type="text" id="addCardSourceInput" class="detail-value-input" placeholder="e.g. Google Ads, Facebook, Website, Referral" required autocomplete="off" />
                <p style="font-size: 13px; color: var(--text-muted); margin-top: 6px;">
                  The system will automatically assign an autoincrementing Source ID (1, 2, 3...) upon creation.
                </p>
              </div>

              <div class="detail-actions">
                <button type="submit" class="btn-save" id="addCardSubmitBtn">+ Add Source</button>
                <button type="button" class="btn-cancel" onclick="resetSelection()">Cancel</button>
              </div>
            </form>
          </div>

          <!-- Selected Source Details -->
          <div id="selectedView" class="view-card">
            <div class="detail-header">
              <div class="detail-heading">
                <span class="id-badge" id="detailIdBadge">1</span>
                <span id="detailHeadingName">Source Details</span>
              </div>
              <button type="button" class="btn-back" onclick="resetSelection()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                <span>Back</span>
              </button>
            </div>

            <div class="detail-group">
              <label class="detail-label">Source ID (Auto-Incremented)</label>
              <div style="font-size: 16px; font-weight: 700; color: var(--primary-text);" id="detailSourceIdText">#1</div>
            </div>

            <div class="detail-group">
              <label class="detail-label">Source Name</label>
              <input type="text" id="detailNameInput" class="detail-value-input" />
            </div>

            <div class="detail-group">
              <label class="detail-label">Created At</label>
              <div style="font-size: 13px; color: var(--text-muted);" id="detailCreatedAtText">-</div>
            </div>

            <div class="detail-actions">
              <button type="button" class="btn-save" onclick="handleSaveDetails()">Save Changes</button>
              <button type="button" class="btn-delete" onclick="handleDeleteSelected()">Delete Source</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <div id="toast"></div>

  <script>
    let allSources = [];
    let selectedSource = null;

    function getApiEndpoints() {
      const endpoints = [
        'http://localhost:3000/api/v1/sources',
        '/api/v1/sources',
        window.location.origin + '/api/v1/sources'
      ];
      return [...new Set(endpoints)];
    }

    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'show ' + type;
      setTimeout(() => { toast.className = ''; }, 3000);
    }

    async function loadSources(selectId = null) {
      const endpoints = getApiEndpoints();
      let loaded = false;

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (!res.ok) continue;
          const json = await res.json();
          let list = [];
          if (Array.isArray(json)) list = json;
          else if (json && Array.isArray(json.data)) list = json.data;
          else if (json && json.data && Array.isArray(json.data.data)) list = json.data.data;
          else if (json && Array.isArray(json.sources)) list = json.sources;

          allSources = list;
          renderList(allSources);
          loaded = true;

          if (selectId) {
            const item = allSources.find(s => String(s.id || s._id || s.sourceId) === String(selectId));
            if (item) selectSource(item);
          } else if (selectedSource) {
            const item = allSources.find(s => String(s.id || s._id || s.sourceId) === String(selectedSource.id || selectedSource._id || selectedSource.sourceId));
            if (item) selectSource(item);
            else resetSelection();
          }
          break;
        } catch (e) {}
      }

      if (!loaded) {
        document.getElementById('sourcesList').innerHTML =
          '<div style="padding: 20px; text-align: center; color: var(--danger); font-size: 13px;">Failed to connect to API</div>';
      }
    }

    function renderList(sources) {
      const listContainer = document.getElementById('sourcesList');
      const countBadge = document.getElementById('countBadge');
      countBadge.textContent = sources.length + (sources.length === 1 ? ' Source' : ' Sources');

      if (!sources || sources.length === 0) {
        listContainer.innerHTML =
          '<div style="padding: 30px 20px; text-align: center; color: var(--text-muted); font-size: 14px;">No sources found. Add your first source above!</div>';
        return;
      }

      listContainer.innerHTML = sources.map(s => {
        const idVal = s.sourceId !== undefined && s.sourceId !== null ? s.sourceId : (s.source_id || '1');
        const nameVal = s.sourceName || s.name || s.source || s.source_name || '';
        const docId = s.id || s._id || idVal;
        const isActive = selectedSource && (String(selectedSource.id || selectedSource._id || selectedSource.sourceId) === String(docId));

        return \`
          <div class="source-item \${isActive ? 'active' : ''}" onclick="selectSourceById('\${docId}')">
            <div class="source-item-info">
              <span class="id-badge">\${idVal}</span>
              <span class="source-item-name">\${escapeHtml(nameVal)}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        \`;
      }).join('');
    }

    function selectSourceById(id) {
      const found = allSources.find(s => String(s.id || s._id || s.sourceId) === String(id));
      if (found) selectSource(found);
    }

    function openAddView() {
      selectedSource = null;
      renderList(allSources);
      document.getElementById('emptyState').style.display = 'none';
      document.getElementById('selectedView').style.display = 'none';
      const addView = document.getElementById('addView');
      addView.style.display = 'block';
      setTimeout(() => {
        const input = document.getElementById('addCardSourceInput');
        if (input) input.focus();
      }, 100);
    }

    function selectSource(source) {
      selectedSource = source;
      renderList(allSources);

      document.getElementById('emptyState').style.display = 'none';
      document.getElementById('addView').style.display = 'none';
      const selectedView = document.getElementById('selectedView');
      selectedView.style.display = 'block';

      const idVal = source.sourceId !== undefined && source.sourceId !== null ? source.sourceId : (source.source_id || '1');
      const nameVal = source.sourceName || source.name || source.source || '';

      document.getElementById('detailIdBadge').textContent = idVal;
      document.getElementById('detailSourceIdText').textContent = '#' + idVal;
      document.getElementById('detailHeadingName').textContent = nameVal;
      document.getElementById('detailNameInput').value = nameVal;
      document.getElementById('detailCreatedAtText').textContent = source.createdAt ? new Date(source.createdAt).toLocaleString() : 'N/A';
    }

    function resetSelection() {
      selectedSource = null;
      renderList(allSources);
      document.getElementById('emptyState').style.display = 'block';
      document.getElementById('addView').style.display = 'none';
      document.getElementById('selectedView').style.display = 'none';
    }

    function filterSources() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const filtered = allSources.filter(s => {
        const name = (s.sourceName || s.name || s.source || '').toLowerCase();
        const id = String(s.sourceId || s.source_id || '');
        return name.includes(q) || id.includes(q);
      });
      renderList(filtered);
    }

    async function handleCreate(e) {
      e.preventDefault();
      const input = document.getElementById('sourceNameInput');
      const name = input.value.trim();
      if (!name) return;

      const btn = document.getElementById('addBtn');
      btn.disabled = true;
      btn.textContent = 'Adding...';

      await executeCreateSource(name, () => {
        input.value = '';
        btn.disabled = false;
        btn.textContent = '+ Add';
      });
    }

    async function handleCreateFromCard(e) {
      e.preventDefault();
      const input = document.getElementById('addCardSourceInput');
      const name = input.value.trim();
      if (!name) return;

      const btn = document.getElementById('addCardSubmitBtn');
      btn.disabled = true;
      btn.textContent = 'Adding...';

      await executeCreateSource(name, () => {
        input.value = '';
        btn.disabled = false;
        btn.textContent = '+ Add Source';
      });
    }

    async function executeCreateSource(name, callback) {
      const endpoints = getApiEndpoints();
      let created = false;
      let lastErrorMessage = '';

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              name: name,
              sourceName: name,
              source: name,
              source_name: name
            })
          });

          let data = null;
          try {
            data = await res.json();
          } catch (jsonErr) {}

          if (res.ok && data) {
            const item = data.data || data;
            const generatedId = (item.sourceId !== undefined && item.sourceId !== null) ? item.sourceId : (item.source_id || '1');
            showToast('Source "' + name + '" created successfully (ID: ' + generatedId + ')', 'success');
            created = true;
            await loadSources(item.id || item._id || item.sourceId);
            break;
          } else if (data) {
            const msg = data.message || data.error || ('HTTP error ' + res.status);
            lastErrorMessage = Array.isArray(msg) ? msg.join(', ') : String(msg);
            if (res.status === 400 || res.status === 409 || res.status === 500) {
              break;
            }
          }
        } catch (e) {
          lastErrorMessage = e.message || 'Connection error';
        }
      }

      if (!created) {
        showToast(lastErrorMessage || 'Failed to create source', 'error');
        alert('Could not add source: ' + (lastErrorMessage || 'Server returned an error'));
      }

      if (callback) callback();
    }



    async function handleSaveDetails() {
      if (!selectedSource) return;
      const newName = document.getElementById('detailNameInput').value.trim();
      if (!newName) return alert('Please enter source name');

      const id = selectedSource.id || selectedSource._id || selectedSource.sourceId;
      const endpoints = getApiEndpoints();

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep + '/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, sourceName: newName })
          });
          if (res.ok) {
            showToast('Source updated successfully', 'success');
            await loadSources(id);
            break;
          }
        } catch (e) {}
      }
    }

    async function handleDeleteSelected() {
      if (!selectedSource) return;
      const name = selectedSource.sourceName || selectedSource.name || 'Source';
      if (!confirm('Are you sure you want to delete "' + name + '"?')) return;

      const id = selectedSource.id || selectedSource._id || selectedSource.sourceId;
      const endpoints = getApiEndpoints();

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep + '/' + id, {
            method: 'DELETE'
          });
          if (res.ok) {
            showToast('Source deleted successfully', 'success');
            resetSelection();
            await loadSources();
            break;
          }
        } catch (e) {}
      }
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    loadSources();
  </script>
</body>
</html>`;


    res.header('Content-Type', 'text/html');
    res.send(html);
  }

  @Post()
  @Post('add')
  @Post('create')
  @ApiOperation({
    summary: 'Create a new source',
    description:
      'Creates a new lead source. The user only needs to enter the source name (e.g. "Google Ads", "Facebook", "Website"). The system automatically assigns an auto-incrementing integer sourceId (1, 2, 3...).',
  })
  @ApiBody({ type: CreateSourceDto })
  @ApiResponse({
    status: 201,
    description: 'Source created successfully with auto-incremented sourceId',
    type: SourceResponseDto,
  })
  @ResponseMessage('Source created successfully')
  async create(@Body() createSourceDto: CreateSourceDto) {
    return this.sourcesService.create(createSourceDto);
  }

  @Get()
  @Get('list')
  @Get('all')
  @ApiOperation({
    summary: 'Retrieve all sources',
    description:
      'Returns a list of all lead sources ordered by sourceId (1, 2, 3...). Each record includes sourceId, sourceName, and id.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sources retrieved successfully',
    type: [SourceResponseDto],
  })
  @ResponseMessage('Sources retrieved successfully')
  async findAll() {
    return this.sourcesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single source detail',
    description: 'Retrieve a lead source by MongoDB ID, numeric sourceId, or source name.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId, numeric sourceId (e.g. 1, 2), or source name' })
  @ApiResponse({
    status: 200,
    description: 'Source retrieved successfully',
    type: SourceResponseDto,
  })
  @ResponseMessage('Source retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update source details',
    description: 'Update the name of an existing source using its MongoDB ID or numeric sourceId.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId or numeric sourceId (e.g. 1, 2)' })
  @ApiBody({ type: UpdateSourceDto })
  @ApiResponse({
    status: 200,
    description: 'Source updated successfully',
    type: SourceResponseDto,
  })
  @ResponseMessage('Source updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateSourceDto: UpdateSourceDto,
  ) {
    return this.sourcesService.update(id, updateSourceDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a source',
    description: 'Delete a source using its MongoDB ID or numeric sourceId.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId or numeric sourceId (e.g. 1, 2)' })
  @ApiResponse({
    status: 200,
    description: 'Source deleted successfully',
  })
  @ResponseMessage('Source deleted successfully')
  async remove(@Param('id') id: string) {
    await this.sourcesService.remove(id);
    return { success: true };
  }
}




