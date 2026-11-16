/* Buildy IL — cookie consent.
   Ads/measurement tags (Google Ads, Meta Pixel) load ONLY after the visitor accepts.
   Choice is stored in localStorage; window.openCookieSettings() reopens the banner. */
(function () {
  var KEY = 'buildy_consent_v1';
  var GADS = 'AW-16499615813';
  var PIXEL = '1004740478556733';
  var loaded = false;

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadTrackers() {
    if (loaded) return; loaded = true;
    // Google Ads
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GADS;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', GADS);
    // Meta Pixel
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL); window.fbq('track', 'PageView');
  }

  var css = '#ck{position:fixed;z-index:9500;left:12px;right:12px;bottom:12px;max-width:760px;margin:0 auto;background:#0B1220;color:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.35);font-family:Heebo,Arial,sans-serif;direction:rtl;display:flex;gap:16px;align-items:center;flex-wrap:wrap}' +
    '#ck p{flex:1 1 320px;margin:0;font-size:14.5px;line-height:1.6;color:rgba(255,255,255,.88)}' +
    '#ck a{color:#9CC3FF;text-decoration:underline}' +
    '#ck .b{display:flex;gap:10px;flex-wrap:wrap}' +
    '#ck button{font:700 15px Heebo,Arial,sans-serif;padding:12px 20px;border-radius:10px;cursor:pointer;border:1.5px solid #fff;min-height:44px}' +
    '#ck .y{background:#fff;color:#0B1220}#ck .n{background:transparent;color:#fff}' +
    '#ck button:focus-visible{outline:3px solid #9CC3FF;outline-offset:2px}';

  function show() {
    if (document.getElementById('ck')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'ck'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'הסכמה לעוגיות');
    d.innerHTML = '<p>אנחנו משתמשים בעוגיות ובכלי מדידה של Google ו-Meta כדי למדוד את הפרסום שלנו. הם נטענים רק אם תאשרו. ' +
      'עוגיות חיוניות לתפקוד האתר לא דורשות הסכמה. <a href="/privacy.html#cookies">פרטים במדיניות הפרטיות</a></p>' +
      '<div class="b"><button type="button" class="y">אישור הכל</button><button type="button" class="n">חיוניות בלבד</button></div>';
    document.body.appendChild(d);
    d.querySelector('.y').addEventListener('click', function () { set('all'); d.remove(); loadTrackers(); });
    d.querySelector('.n').addEventListener('click', function () { set('essential'); d.remove(); });
  }

  window.openCookieSettings = function () {
    var had = get() === 'all';
    try { localStorage.removeItem(KEY); } catch (e) {}
    show();
    // Trackers already in memory can't be unloaded; a reload clears them.
    if (had) {
      var n = document.querySelector('#ck .n');
      n && n.addEventListener('click', function () { location.reload(); });
    }
  };

  function init() { if (get() === 'all') loadTrackers(); else if (!get()) show(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
