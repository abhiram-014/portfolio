/**
 * Admin Panel Controller
 * Handles authentication, video management, file uploads with progress, and stats.
 */

let authToken = localStorage.getItem('portfolio_auth_token') || null;
let currentVideos = [];
let videoToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initModals();
  initUploadDropzones();
  initSearch();
  initPasswordForm();
});

// Helper for authenticated API requests
async function authFetch(url, options = {}) {
  const headers = options.headers || {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  options.headers = headers;
  options.credentials = 'include';

  const res = await fetch(url, options);
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired or unauthorized');
  }
  return res;
}

/* ═══════════════════════════════════════════
   1. AUTHENTICATION & SESSION
═══════════════════════════════════════════ */
async function initAuth() {
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const btnLogout = document.getElementById('btn-logout');

  // Verify existing session
  try {
    const res = await fetch('/api/auth/me', {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      credentials: 'include'
    });

    if (res.ok) {
      showDashboard();
      return;
    }
  } catch (err) {
    // Not authenticated
  }

  showLogin();

  // Login submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-login');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Authenticating...`;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      authToken = data.token;
      if (authToken) localStorage.setItem('portfolio_auth_token', authToken);

      showToast('Signed in successfully', 'success');
      showDashboard();
      loginForm.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-lock"></i> <span>Sign In to Dashboard</span>`;
    }
  });

  // Logout
  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {}
    authToken = null;
    localStorage.removeItem('portfolio_auth_token');
    showLogin();
    showToast('Logged out successfully', 'info');
  });
}

function showLogin() {
  document.getElementById('login-section').style.display = 'flex';
  document.getElementById('dashboard-section').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'flex';
  fetchVideos();
}

function handleUnauthorized() {
  authToken = null;
  localStorage.removeItem('portfolio_auth_token');
  showLogin();
  showToast('Session expired. Please sign in again.', 'error');
}

/* ═══════════════════════════════════════════
   2. VIDEO DATA FETCHING & RENDERING
═══════════════════════════════════════════ */
async function fetchVideos() {
  const tbody = document.getElementById('videos-table-body');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
        <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Loading portfolio works...
      </td>
    </tr>
  `;

  try {
    const res = await authFetch('/api/admin/videos');
    const json = await res.json();
    currentVideos = json.data || [];
    renderVideosTable(currentVideos);
    updateStats(currentVideos);
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: #f87171;">
          <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i> Failed to load videos. ${escapeHTML(err.message)}
        </td>
      </tr>
    `;
  }
}

function updateStats(videos) {
  const total = videos.length;
  const published = videos.filter(v => v.published !== false).length;
  const hidden = total - published;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-published').textContent = published;
  document.getElementById('stat-hidden').textContent = hidden;
}

function renderVideosTable(videos) {
  const tbody = document.getElementById('videos-table-body');
  tbody.innerHTML = '';

  if (videos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          No videos found. Click "Add New Video" to create your first portfolio entry.
        </td>
      </tr>
    `;
    return;
  }

  videos.forEach((video) => {
    const tr = document.createElement('tr');
    tr.dataset.id = video.id;

    // Aspect ratio badge label
    const ratioLabel = getRatioLabel(video.aspectRatio);

    // Poster or Fallback Icon
    let thumbHtml = '';
    if (video.posterUrl) {
      thumbHtml = `<img src="${video.posterUrl}" alt="" class="vid-thumb">`;
    } else {
      thumbHtml = `<div class="vid-thumb"><i class="fas fa-play"></i></div>`;
    }

    tr.innerHTML = `
      <td data-label="Order">
        <span class="order-badge">#${video.order || 0}</span>
      </td>
      <td data-label="Work & Title">
        <div class="vid-preview-cell">
          ${thumbHtml}
          <div>
            <div class="vid-cell-title">${escapeHTML(video.title)}</div>
            <div class="vid-cell-desc">${escapeHTML(video.description || 'No description')}</div>
          </div>
        </div>
      </td>
      <td data-label="Category">
        <span style="font-size: 0.8rem; font-weight: 500;">${escapeHTML(video.category || 'General')}</span>
      </td>
      <td data-label="Ratio">
        <span class="badge badge-ratio">${ratioLabel}</span>
      </td>
      <td data-label="Status">
        <button type="button" class="badge ${video.published !== false ? 'badge-published' : 'badge-hidden'}" onclick="togglePublish('${video.id}', ${video.published !== false})" style="cursor: pointer; border: none;">
          <i class="fas ${video.published !== false ? 'fa-check-circle' : 'fa-eye-slash'}" style="margin-right: 4px;"></i>
          ${video.published !== false ? 'Published' : 'Hidden'}
        </button>
      </td>
      <td data-label="Actions" style="text-align: right;">
        <div class="actions-cell" style="justify-content: flex-end;">
          <button type="button" class="btn-action" onclick="openEditModal('${video.id}')" title="Edit Video">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button type="button" class="btn-action delete" onclick="confirmDeleteVideo('${video.id}', '${escapeHTML(video.title)}')" title="Delete Video">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getRatioLabel(ratioClass) {
  switch (ratioClass) {
    case 'ratio-vertical': return '9:16 Vertical';
    case 'ratio-wide': return '16:9 Wide';
    case 'ratio-portrait': return '4:5 Portrait';
    case 'ratio-square': return '1:1 Square';
    case 'ratio-cinematic': return '21:9 Cinematic';
    default: return '16:9';
  }
}

/* ═══════════════════════════════════════════
   3. MODAL MANAGEMENT (Add / Edit / Delete)
═══════════════════════════════════════════ */
function initModals() {
  const videoModal = document.getElementById('video-modal');
  const deleteModal = document.getElementById('delete-modal');
  const passwordModal = document.getElementById('password-modal');
  const btnAdd = document.getElementById('btn-add-video');
  const btnOpenPassword = document.getElementById('btn-open-password-modal');
  const videoForm = document.getElementById('video-form');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  // Open Add Video Modal
  btnAdd.addEventListener('click', () => {
    document.getElementById('modal-video-title').textContent = 'Add New Video';
    videoForm.reset();
    document.getElementById('video-id').value = '';
    document.getElementById('video-input-order').value = (currentVideos.length + 1);
    document.getElementById('video-input-published').checked = true;
    document.getElementById('video-input-featured').checked = false;
    openModal('video-modal');
  });

  // Open Password Modal
  btnOpenPassword.addEventListener('click', () => {
    document.getElementById('password-form').reset();
    openModal('password-modal');
  });

  // Close modals via data-close
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Close when clicking backdrop
  [videoModal, deleteModal, passwordModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  // Video Form Submission (Create or Update)
  videoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById('btn-save-video');
    const id = document.getElementById('video-id').value;

    const payload = {
      title: document.getElementById('video-input-title').value.trim(),
      category: document.getElementById('video-input-category').value.trim() || 'General',
      aspectRatio: document.getElementById('video-input-ratio').value,
      videoUrl: document.getElementById('video-input-url').value.trim(),
      posterUrl: document.getElementById('video-input-poster').value.trim(),
      description: document.getElementById('video-input-desc').value.trim(),
      order: Number(document.getElementById('video-input-order').value) || (currentVideos.length + 1),
      published: document.getElementById('video-input-published').checked,
      featured: document.getElementById('video-input-featured').checked
    };

    if (!payload.title) {
      showToast('Title is required', 'error');
      return;
    }
    if (!payload.videoUrl) {
      showToast('Video URL or upload is required', 'error');
      return;
    }

    btnSave.disabled = true;
    btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

    try {
      let res;
      if (id) {
        // Update existing
        res = await authFetch(`/api/admin/videos/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        // Create new
        res = await authFetch('/api/admin/videos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save video');

      showToast(id ? 'Video updated successfully' : 'Video added successfully', 'success');
      closeModal('video-modal');
      fetchVideos();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnSave.disabled = false;
      btnSave.innerHTML = `<i class="fas fa-save"></i> <span>Save Video</span>`;
    }
  });

  // Delete confirmation action
  btnConfirmDelete.addEventListener('click', async () => {
    if (!videoToDeleteId) return;
    btnConfirmDelete.disabled = true;
    btnConfirmDelete.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting...`;

    try {
      const res = await authFetch(`/api/admin/videos/${videoToDeleteId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete video');

      showToast('Video deleted successfully', 'success');
      closeModal('delete-modal');
      fetchVideos();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnConfirmDelete.disabled = false;
      btnConfirmDelete.innerHTML = `<i class="fas fa-trash"></i> <span>Delete Video</span>`;
      videoToDeleteId = null;
    }
  });
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

window.openEditModal = function(id) {
  const video = currentVideos.find(v => String(v.id) === String(id));
  if (!video) return;

  document.getElementById('modal-video-title').textContent = 'Edit Video';
  document.getElementById('video-id').value = video.id;
  document.getElementById('video-input-title').value = video.title || '';
  document.getElementById('video-input-category').value = video.category || '';
  document.getElementById('video-input-ratio').value = video.aspectRatio || 'ratio-wide';
  document.getElementById('video-input-url').value = video.videoUrl || '';
  document.getElementById('video-input-poster').value = video.posterUrl || '';
  document.getElementById('video-input-desc').value = video.description || '';
  document.getElementById('video-input-order').value = video.order || 1;
  document.getElementById('video-input-published').checked = video.published !== false;
  document.getElementById('video-input-featured').checked = Boolean(video.featured);

  openModal('video-modal');
};

window.confirmDeleteVideo = function(id, title) {
  videoToDeleteId = id;
  document.getElementById('delete-video-title').textContent = title;
  openModal('delete-modal');
};

window.togglePublish = async function(id, currentStatus) {
  try {
    const res = await authFetch(`/api/admin/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ published: !currentStatus })
    });
    if (res.ok) {
      showToast(!currentStatus ? 'Video published to live site' : 'Video set to hidden (draft)', 'success');
      fetchVideos();
    }
  } catch (err) {
    showToast('Failed to update visibility', 'error');
  }
};

/* ═══════════════════════════════════════════
   4. FILE UPLOADS (Video & Poster)
═══════════════════════════════════════════ */
function initUploadDropzones() {
  setupDropzone('video-dropzone', 'video-file-input', 'video-input-url', 'video-progress', 'video-progress-bar');
  setupDropzone('poster-dropzone', 'poster-file-input', 'video-input-poster', 'poster-progress', 'poster-progress-bar');
}

function setupDropzone(zoneId, inputId, targetInputId, progressId, progressBarId) {
  const dropzone = document.getElementById(zoneId);
  const fileInput = document.getElementById(inputId);
  const targetInput = document.getElementById(targetInputId);
  const progress = document.getElementById(progressId);
  const progressBar = document.getElementById(progressBarId);

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0], targetInput, progress, progressBar);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      uploadFile(fileInput.files[0], targetInput, progress, progressBar);
    }
  });
}

function uploadFile(file, targetInput, progress, progressBar) {
  const formData = new FormData();
  formData.append('file', file);

  progress.style.display = 'block';
  progressBar.style.width = '0%';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/admin/upload', true);
  if (authToken) {
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
  }

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = `${percent}%`;
    }
  };

  xhr.onload = () => {
    progress.style.display = 'none';
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        targetInput.value = response.file.url;
        showToast(`Uploaded ${file.name} successfully`, 'success');
      } catch (err) {
        showToast('Error parsing upload response', 'error');
      }
    } else {
      try {
        const errJson = JSON.parse(xhr.responseText);
        showToast(errJson.error || 'Upload failed', 'error');
      } catch {
        showToast('Upload failed', 'error');
      }
    }
  };

  xhr.onerror = () => {
    progress.style.display = 'none';
    showToast('Network error during file upload', 'error');
  };

  xhr.send(formData);
}

/* ═══════════════════════════════════════════
   5. SEARCH FILTERING
═══════════════════════════════════════════ */
function initSearch() {
  const searchInput = document.getElementById('search-videos');
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderVideosTable(currentVideos);
      return;
    }

    const filtered = currentVideos.filter(v => 
      (v.title && v.title.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
    renderVideosTable(filtered);
  });
}

/* ═══════════════════════════════════════════
   6. CHANGE PASSWORD
═══════════════════════════════════════════ */
function initPasswordForm() {
  const form = document.getElementById('password-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      showToast('Password updated successfully', 'success');
      closeModal('password-modal');
      form.reset();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/* ═══════════════════════════════════════════
   7. TOAST NOTIFICATIONS
═══════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';

  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
