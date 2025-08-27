// Annual report popup (one-time; persists via localStorage)
(function yearlyReportPopup() {
  const STORAGE_FILE_PATH = 'reports/SLA 24-25 Annual Report.pdf';
  const REPORT_URL = 'https://firebasestorage.googleapis.com/v0/b/solis-and-luna-arts.appspot.com/o/' + encodeURIComponent(STORAGE_FILE_PATH) + '?alt=media';
  const STORAGE_FLAG = 'yearlyReportPopupDismissed';

  // Skip if user has dismissed before (persisted)
  try { if (localStorage.getItem(STORAGE_FLAG) === '1') return; } catch (_) {}

  // Inject styles once
  const STYLE_ID = 'yearly-report-popup-style';
  if (!document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
      .yearly-report-popup-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:9999; pointer-events:none; }
      .yearly-report-popup { width:100%; max-width:980px; margin:0 20px; background:#29395b; color:#fad783; padding:18px 56px 18px 24px; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.25); font-family:'Karla','Ubuntu',sans-serif; position:relative; pointer-events:auto; animation:yrp-slide-in 450ms cubic-bezier(.16,.84,.44,1); }
      .yearly-report-popup a.report-link { color:#fad783; font-size:1.25rem; font-weight:600; text-decoration:none; }
      .yearly-report-popup a.report-link:hover, .yearly-report-popup a.report-link:focus { text-decoration:underline; }
      .yearly-report-popup button.yrp-close { position:absolute; top:8px; right:12px; background:transparent; border:none; color:#fad783; font-size:1.2rem; line-height:1; cursor:pointer; padding:4px; }
      .yearly-report-popup button.yrp-close:focus { outline:2px solid #fad783; outline-offset:2px; }
      @media (max-width:600px){ .yearly-report-popup { padding:14px 48px 14px 18px; font-size:.95rem; } .yearly-report-popup a.report-link { font-size:1.05rem; } }
      @keyframes yrp-fade-out { to { opacity:0; transform:translateY(-8px); } }
      @keyframes yrp-slide-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    `;
    document.head.appendChild(styleEl);
  }

  // DOM
  const overlay = document.createElement('div');
  overlay.className = 'yearly-report-popup-overlay';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-label','Yearly report announcement');

  const popup = document.createElement('div');
  popup.className = 'yearly-report-popup';

  const link = document.createElement('a');
  link.href = REPORT_URL;
  link.className = 'report-link';
  link.textContent = 'Click here to view our yearly report';
  link.setAttribute('rel','noopener');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'yrp-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label','Close');
  closeBtn.innerHTML = '&times;';

  popup.appendChild(link);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Events
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const a = document.createElement('a');
    a.href = REPORT_URL + (REPORT_URL.includes('?') ? '&' : '?') + 'cacheBust=' + Date.now();
    a.download = 'SLA-Annual-Report.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  dismiss(true);
  });

  closeBtn.addEventListener('click', () => dismiss(true));

  document.addEventListener('keydown', function escHandler(evt) {
    if (evt.key === 'Escape') {
      dismiss(true);
      document.removeEventListener('keydown', escHandler);
    }
  });

  function dismiss(setFlag) {
    popup.style.animation = 'yrp-fade-out 250ms ease forwards';
    setTimeout(() => overlay.remove(), 240);
  if (setFlag) { try { localStorage.setItem(STORAGE_FLAG,'1'); } catch (_) {} }
  }
})();