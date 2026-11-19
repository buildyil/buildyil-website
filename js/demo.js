/* Buildy IL — marks portfolio pages as demo sites.
   Shows a notice bar, and stops demo forms / placeholder phone links from pretending to work. */
(function () {
  var WA = 'https://wa.me/972542603160?text=' + encodeURIComponent('שלום, ראיתי אתר לדוגמה אצלכם ואשמח לאתר כזה לעסק שלי');
  var css = '#dm{position:fixed;z-index:99999;left:0;right:0;bottom:0;background:#0B1220;color:#fff;font:500 14px/1.5 Heebo,Arial,sans-serif;direction:rtl;padding:10px 16px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;box-shadow:0 -6px 24px rgba(0,0,0,.3)}' +
    '#dm a{background:#fff;color:#0B1220;font-weight:700;padding:7px 14px;border-radius:8px;text-decoration:none;white-space:nowrap}' +
    '#dm button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;line-height:1}' +
    '#dm.pulse{animation:dmp .6s 2}@keyframes dmp{50%{background:#1E63E9}}' +
    'body{padding-bottom:64px}';
  function bar(msg) {
    var d = document.getElementById('dm');
    if (!d) {
      var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      d = document.createElement('div'); d.id = 'dm'; d.setAttribute('role', 'status');
      document.body.appendChild(d);
    }
    d.innerHTML = '<span>' + msg + '</span><a href="' + WA + '" target="_blank" rel="noopener">רוצים אתר כזה? דברו איתנו</a>' +
      '<a href="https://buildyil.net/">לאתר Buildy IL</a><button type="button" aria-label="סגירת ההודעה">✕</button>';
    d.querySelector('button').onclick = function () { d.remove(); document.body.style.paddingBottom = '0'; };
    d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse');
  }
  function init() {
    bar('זהו <b>אתר לדוגמה</b> שעיצבה Buildy IL. שם העסק, הפרטים והטפסים אינם אמיתיים.');
    document.addEventListener('submit', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      bar('זהו טופס לדוגמה בלבד, והפרטים <b>לא נשלחו</b> לשום מקום.');
    }, true);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (/0500000000|972500000000|example\.com/.test(h)) {
        e.preventDefault(); e.stopImmediatePropagation();
        bar('זה פרט קשר לדוגמה, ואינו מספר אמיתי.');
      }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
