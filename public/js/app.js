/**
 * Portfolio — Main Frontend JavaScript
 * Pure static build (Vercel). No backend API calls.
 *
 * Features:
 *  1. Custom difference cursor (desktop only)
 *  2. Navbar scroll effect
 *  3. Animated stat counters
 *  4. Scroll reveal (IntersectionObserver)
 *  5. Showreel — two-stage lazy loader (proximity load + viewport play/pause)
 *  6. Portfolio grid render from static data
 *  7. Portfolio videos — two-stage lazy loader (proximity load + viewport play/pause)
 *  8. Once loaded, videos stay loaded (no source removal on scroll-out)
 */

/* ═══════════════════════════════════════════════════════════
   STATIC PORTFOLIO DATA
   Source of truth for the static Vercel deployment.
   Edit this array to add/remove/reorder portfolio pieces.
═══════════════════════════════════════════════════════════ */
const PORTFOLIO_VIDEOS = [
  {
    id: 'vid_1',
    title: 'Visual Storytelling',
    description: 'Bold motion graphics edit with visual FX and premium polish.',
    videoUrl: './videos/show reel_motion_graphics.mp4',
    posterUrl: '',
    category: 'Motion Graphics',
    aspectRatio: 'ratio-wide',
    featured: true
  },
  {
    id: 'vid_2',
    title: 'Gym & Nutrition',
    description: 'High-energy fitness and nutrition content crafted to drive attention, motivation, and brand engagement.',
    videoUrl: './videos/gym_diet.mp4',
    posterUrl: '',
    category: 'Fitness / Reels',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_3',
    title: 'Healthcare Content',
    description: 'Visual storytelling crafted to communicate care, trust, wellness, and medical expertise.',
    videoUrl: './videos/5rules final v2.mp4',
    posterUrl: '',
    category: 'Healthcare',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_4',
    title: 'Real Estate Campaigns',
    description: 'Explanatory videos using motion graphics, typography, and visual storytelling without raw footage.',
    videoUrl: './videos/maa spaces.mp4',
    posterUrl: '',
    category: 'Real Estate',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_5',
    title: 'College Fest Highlights',
    description: 'Cinematic live-event montage capturing crowd energy and atmosphere.',
    videoUrl: './videos/even_montage.mp4',
    posterUrl: '',
    category: 'Live Events',
    aspectRatio: 'ratio-wide'
  },
  {
    id: 'vid_6',
    title: 'Brand Campaign',
    description: 'Creative brand campaign videos designed to capture attention and drive audience engagement.',
    videoUrl: './videos/brand_campaign.mp4',
    posterUrl: '',
    category: 'Brand Commercials',
    aspectRatio: 'ratio-wide'
  },
  {
    id: 'vid_7',
    title: 'Podcast Reels',
    description: 'Engaging short-form edits designed to turn conversations into impactful shareable content.',
    videoUrl: './videos/podcast_demo.mp4',
    posterUrl: '',
    category: 'Short-Form',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_8',
    title: 'Marketing Reel',
    description: 'Delivered impactful brand marketing videos focused on audience engagement and strong brand communication.',
    videoUrl: './videos/messi edit_2.mp4',
    posterUrl: '',
    category: 'Commercials',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_9',
    title: 'YouTube Documentary Edit',
    description: 'Deep narrative long-form edit with compelling pacing and structure.',
    videoUrl: './videos/sdg2.mp4',
    posterUrl: '',
    category: 'Documentary',
    aspectRatio: 'ratio-wide'
  },
  {
    id: 'vid_10',
    title: 'Brand Promotions',
    description: 'Professional content created to promote properties and strengthen real estate brand presence.',
    videoUrl: './videos/final_promo_7.mp4',
    posterUrl: '',
    category: 'Promotions',
    aspectRatio: 'ratio-wide'
  }
];

/* ═══════════════════════════════════════════
   BOOT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initNavScroll();
  initStatsCounter();
  initScrollReveal();
  initShowreelLazyLoad();  // showreel-specific two-stage loader
  renderPortfolioGrid();   // render cards from static data, then observe
});

/* ═══════════════════════════════════════════
   1. CUSTOM DIFFERENCE CURSOR (desktop only)
═══════════════════════════════════════════ */
function initCustomCursor() {
  // Only activate on true pointer devices (not touch)
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let curX = mouseX;
  let curY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  (function animateCursor() {
    // Lerp — smooth lag follow
    curX += (mouseX - curX) * 0.16;
    curY += (mouseY - curY) * 0.16;
    cursor.style.left = curX + 'px';
    cursor.style.top  = curY + 'px';
    requestAnimationFrame(animateCursor);
  })();

  refreshCursorListeners();
}

function refreshCursorListeners() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  document.querySelectorAll('a, button, .tag, .chip, .filter-btn, .vid-card, .about-frame, .step')
    .forEach((el) => {
      // Remove previous listeners before re-adding (safe for dynamic elements)
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

/* ═══════════════════════════════════════════
   2. NAVBAR SCROLL EFFECT
═══════════════════════════════════════════ */
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

/* ═══════════════════════════════════════════
   3. ANIMATED STAT COUNTERS
═══════════════════════════════════════════ */
function initStatsCounter() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      let current  = 0;
      const steps  = 60;
      const inc    = target / steps;
      const timer  = setInterval(() => {
        current += inc;
        if (current >= target) {
          el.textContent = target + '+';
          clearInterval(timer);
        } else {
          el.textContent = Math.ceil(current);
        }
      }, 1400 / steps);
      obs.unobserve(el);
    });
  }, { threshold: 0.2 });

  counters.forEach(c => observer.observe(c));
}

/* ═══════════════════════════════════════════
   4. SCROLL REVEAL
═══════════════════════════════════════════ */
function initScrollReveal() {
  const els = document.querySelectorAll('.r');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('on');
      } else {
        // Only the impact statement re-animates on re-entry
        if (entry.target.classList.contains('impact-statement')) {
          entry.target.classList.remove('on');
        }
      }
    });
  }, { threshold: 0.15 });

  els.forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════════
   5. SHOWREEL — TWO-STAGE LAZY LOADER
   The showreel sits in section#services, near
   the top but below the fold. We:
     Stage 1 (proximity): load src when 600px away
     Stage 2 (viewport):  play when ≥10% visible,
                          pause when scrolled out
   Once loaded, source is NEVER removed.
═══════════════════════════════════════════ */
function initShowreelLazyLoad() {
  const video = document.querySelector('.impact-video[data-src]');
  if (!video) return;

  let loaded = false;

  // Stage 1 — Proximity: load when 600px away (showreel is near fold)
  const loadObserver = new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting && !loaded) {
      loaded = true;
      video.src = video.dataset.src;
      video.load();
      // Fade in from dark placeholder once data is ready
      video.addEventListener('loadeddata', () => {
        video.classList.add('loaded');
      }, { once: true });
      obs.disconnect();
    }
  }, { rootMargin: '600px 0px' });

  // Stage 2 — Viewport: play / pause based on visibility
  const playObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      // Only attempt play after src is assigned
      if (video.src) {
        video.play().catch(() => {});
      } else {
        // Wait for canplay then play
        video.addEventListener('canplay', () => {
          video.play().catch(() => {});
        }, { once: true });
      }
    } else {
      video.pause();
    }
  }, { threshold: 0.1 });

  loadObserver.observe(video);
  playObserver.observe(video);
}

/* ═══════════════════════════════════════════
   6. PORTFOLIO GRID — RENDER + OBSERVE
═══════════════════════════════════════════ */
function renderPortfolioGrid() {
  const grid  = document.getElementById('portfolio-grid');
  const count = document.getElementById('work-count');
  if (!grid) return;

  // Clear skeleton placeholders
  grid.innerHTML = '';

  PORTFOLIO_VIDEOS.forEach((item, i) => {
    grid.appendChild(buildCard(item, i + 1));
  });

  if (count) {
    count.textContent = `— ${PORTFOLIO_VIDEOS.length} selected works`;
  }

  // Attach cursor listeners to newly created cards
  refreshCursorListeners();

  // Begin observing cards for lazy-load + playback
  initVideoObservers();
}

/* ─── Build a single card DOM element ─── */
function buildCard(item, index) {
  const card = document.createElement('div');
  card.className = 'vid-card' + (item.featured ? ' featured-card' : '');
  card.setAttribute('data-id', item.id);

  const num   = String(index).padStart(2, '0');
  const ratio = item.aspectRatio || 'ratio-wide';

  // Poster: real image if provided, otherwise gradient placeholder
  const poster = item.posterUrl
    ? `<img src="${esc(item.posterUrl)}" alt="${esc(item.title)}" class="vid-poster" loading="lazy" decoding="async">`
    : `<div class="poster-placeholder">
         <div class="poster-icon">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
         </div>
         <span class="poster-category">${esc(item.category || 'Cinematic Edit')}</span>
       </div>`;

  card.innerHTML = `
    <div class="vid-shell ${ratio}">
      <span class="vid-index">${num}</span>
      ${poster}
      <video
        class="vid-el"
        muted
        loop
        playsinline
        preload="none"
        data-src="${esc(item.videoUrl)}"
        aria-label="${esc(item.title)}"
      ></video>
      <span class="vid-play" aria-hidden="true">
        <svg viewBox="0 0 10 12"><path d="M0 0 L10 6 L0 12 Z"/></svg>
      </span>
    </div>
    <div class="vid-info">
      <div class="vid-meta">
        <span class="vid-cat">${esc(item.category || 'Video Edit')}</span>
      </div>
      <h4 class="vid-title">${esc(item.title)}</h4>
      ${item.description ? `<p class="vid-desc">${esc(item.description)}</p>` : ''}
    </div>`;

  // Click: toggle play / pause
  card.addEventListener('click', () => {
    const v = card.querySelector('video');
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); }
    else          { v.pause(); }
  });

  return card;
}

/* ═══════════════════════════════════════════
   7. TWO-STAGE VIDEO OBSERVER ENGINE
   Stage 1 — Proximity (rootMargin: 350px):
     Read data-src → assign video.src → call load()
     Mark with dataset.loaded = '1'
     Unobserve immediately (load happens once)
   Stage 2 — Viewport (threshold: 25%):
     isIntersecting + src exists → play()
     not intersecting → pause()
   Source is NEVER removed after loading.
═══════════════════════════════════════════ */
function initVideoObservers() {
  const videos = document.querySelectorAll('.vid-el[data-src]');
  if (!videos.length) return;

  /* Stage 1 — Proximity loader */
  const proximityObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;

      // Guard: only load once
      if (video.dataset.loaded) { obs.unobserve(video); return; }
      video.dataset.loaded = '1';

      const src = video.dataset.src;
      if (!src) { obs.unobserve(video); return; }

      video.src = src;
      video.load();

      // Fade in and hide poster once data has loaded
      video.addEventListener('loadeddata', () => {
        video.classList.add('loaded');
        const card = video.closest('.vid-card');
        if (card) {
          const poster = card.querySelector('.vid-poster, .poster-placeholder');
          if (poster) poster.classList.add('hidden');
        }
      }, { once: true });

      obs.unobserve(video);
    });
  }, {
    rootMargin: '350px 0px',
    threshold: 0
  });

  /* Stage 2 — Viewport playback controller */
  const playbackObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        // Only play after src has been assigned
        if (video.src && video.src !== window.location.href) {
          video.play().catch(() => {});
        }
      } else {
        if (!video.paused) video.pause();
      }
    });
  }, {
    threshold: 0.25
  });

  videos.forEach(video => {
    proximityObserver.observe(video);
    playbackObserver.observe(video);
  });
}

/* ═══════════════════════════════════════════
   UTILITY — HTML escape
═══════════════════════════════════════════ */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}
