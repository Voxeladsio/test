
// public/js/app.js
document.addEventListener('DOMContentLoaded', () => {
  const jobsList     = document.getElementById('jobs-list');
  const kwInput      = document.getElementById('filter-keyword');
  const rateInput    = document.getElementById('filter-rate');
  const applyBtn     = document.getElementById('filter-apply');
  const clearBtn     = document.getElementById('filter-clear');
  const endIndicator = document.getElementById('end-of-listing');
  const jobsGrid     = document.getElementById('jobs-list');

  let allJobs = []; // master list

  function renderPlaceholder(text) {
    endIndicator.style.opacity = '0';
    jobsList.innerHTML = `
      <div class="job-card placeholder">${text}</div>
    `;
  }

  // helper up top
function truncate(text, maxChars = 120) {
  if (text.length <= maxChars) return { short: text, truncated: false };
  const short = text.slice(0, maxChars).trimEnd() + '…';
  return { short, truncated: true };
}

// inside your DOMContentLoaded…
function renderJobs(jobs) {
  if (!jobs.length) return renderPlaceholder('No jobs match your filters.');
  endIndicator.style.opacity = '0';

  jobsList.innerHTML = jobs.map(job => {
    const date = new Date(job.createdAt)
      .toLocaleDateString(undefined, {
        year:  'numeric',
        month: 'short',
        day:   'numeric'
      });

    // get truncated text + flag
    const { short: descShort, truncated } = truncate(job.description, 150);

    return `
      <article class="job-card">
        <h2>
          <a href="/job.html?slug=${job.slug}" class="job-title-link">
            ${job.title}
          </a>
        </h2>
        <div class="company">${job.company}</div>
        <div class="meta">
          <span class="date">Posted on ${date}</span>
        </div>
        <p class="description">
          ${descShort}
          ${truncated
            ? `<a href="/job.html?slug=${job.slug}" class="read-more">Read more</a>`
            : ''}
        </p>
        <div class="rate">
          <img src="/icons/coin.svg" alt="" class="coin-icon" />
          Rate: $${job.rate}/hr
        </div>
      </article>
    `;
  }).join('');

  checkScrollEnd();
}


  function applyFilters() {
    const kwRaw   = kwInput.value.trim();
    const kw      = kwRaw.toLowerCase();
    const rateRaw = rateInput.value.trim();
    const minR    = rateRaw === '' ? null : Number(rateRaw);

    let filtered = allJobs;

    if (kw) {
      filtered = filtered.filter(job => {
        const t = job.title.toLowerCase();
        const c = job.company.toLowerCase();
        const d = job.description.toLowerCase();
        return t.includes(kw) || c.includes(kw) || d.includes(kw);
      });
    }

    if (minR !== null && !isNaN(minR)) {
      filtered = filtered.filter(job => {
        const rate = typeof job.rate === 'number' ? job.rate : Number(job.rate);
        return rate >= minR;
      });
    }

    renderJobs(filtered);
  }

  async function loadJobs() {
    renderPlaceholder('Loading…');
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allJobs = await res.json();
      renderJobs(allJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
      renderPlaceholder('Error loading jobs.');
    }
  }

  // fade-in end-of-listing when you hit bottom
  function checkScrollEnd() {
    const { scrollTop, scrollHeight, clientHeight } = jobsGrid;
    if (scrollTop + clientHeight >= scrollHeight - 2) {
      endIndicator.style.opacity = '1';
    } else {
      endIndicator.style.opacity = '0';
    }
  }
  jobsGrid.addEventListener('scroll', checkScrollEnd);

  // wire up filter buttons & Enter key
  applyBtn.addEventListener('click', applyFilters);
  [kwInput, rateInput].forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFilters();
      }
    });
  });
  clearBtn.addEventListener('click', () => {
    kwInput.value   = '';
    rateInput.value = '';
    renderJobs(allJobs);
  });

  // kick things off
  loadJobs();
});


  const helpIcon  = document.getElementById('help-icon');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-close');

  helpIcon.addEventListener('click', () => {
    helpModal.classList.add('open');
  });

  helpClose.addEventListener('click', () => {
    helpModal.classList.remove('open');
  });

  // clicking outside the content also closes
  helpModal.addEventListener('click', e => {
    if (e.target === helpModal) {
      helpModal.classList.remove('open');
    }
  });

  // close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && helpModal.classList.contains('open')) {
      helpModal.classList.remove('open');
    }
  });


  const spinner = document.getElementById('loading-spinner');
const jobsGrid = document.getElementById('jobs-list');

async function loadJobs() {
  spinner.style.display = 'block';
  // clear old cards (if any)
  jobsGrid.querySelectorAll('.job-card')?.forEach(el => el.remove());

  try {
    const jobs = await fetch('/api/jobs').then(r => r.json());
    // renderJobs(jobs) — your existing function
  } finally {
    spinner.style.display = 'none';
  }
}

// call on page load & on filter change
loadJobs();




