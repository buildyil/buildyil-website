/* דלת נכסים — behaviour. The pages read in full without it. */
(function () {
  var d = document, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // menu
  var top = d.getElementById('top'), mb = top && top.querySelector('.menu-btn');
  if (mb) mb.addEventListener('click', function () {
    var o = top.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.textContent = o ? 'סגירה' : 'תפריט';
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && top && top.classList.contains('open')) mb.click(); });

  // staggered entrance
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
        e.target.style.transitionDelay = Math.min(i, 4) * 80 + 'ms';
        e.target.classList.add('in'); io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // listings: filters, prefilled from the home search
  var grid = d.getElementById('grid'), ff = d.getElementById('filters');
  if (grid && ff) {
    var q = new URLSearchParams(location.search);
    ['hood', 'type', 'rooms', 'price'].forEach(function (k) { var v = q.get(k), s = d.getElementById('f-' + k); if (v && s) s.value = v; });
    var run = function () {
      var h = d.getElementById('f-hood').value, t = d.getElementById('f-type').value,
          r = +d.getElementById('f-rooms').value, p = +d.getElementById('f-price').value, n = 0;
      grid.querySelectorAll('.card').forEach(function (c) {
        var ok = (!h || c.dataset.hood === h) && (!t || c.dataset.type === t) && (+c.dataset.rooms >= r) && (!p || +c.dataset.price <= p);
        c.hidden = !ok; if (ok) n++;
      });
      d.getElementById('count').textContent = n ? n + ' נכסים' : 'אין נכס שמתאים. נסו להרחיב את החיפוש.';
    };
    ff.addEventListener('change', run); run();
  }

  // mortgage estimate
  var calc = d.querySelector('.calc');
  if (calc) {
    var price = +calc.dataset.price, fm = function (n) { return '₪' + Math.round(n).toLocaleString('he-IL'); };
    var dn = d.getElementById('c-down'), yr = d.getElementById('c-years'), rt = d.getElementById('c-rate');
    var go = function () {
      var loan = price * (1 - dn.value / 100), n = yr.value * 12, r = rt.value / 100 / 12;
      d.getElementById('c-down-v').textContent = dn.value + '% · ' + fm(price * dn.value / 100);
      d.getElementById('c-years-v').textContent = yr.value + ' שנים';
      d.getElementById('c-rate-v').textContent = (+rt.value).toFixed(1) + '%';
      d.getElementById('c-pay').textContent = fm(loan * r / (1 - Math.pow(1 + r, -n))) + ' לחודש';
    };
    [dn, yr, rt].forEach(function (x) { x.addEventListener('input', go); }); go();
  }

  // contact: prefill a visit
  var nq = new URLSearchParams(location.search).get('nechas'), msg = d.getElementById('msg');
  if (nq && msg) { d.getElementById('topic').value = 'ביקור בנכס מסוים'; msg.value = 'אשמח לתאם ביקור בנכס: ' + nq.replace(/-/g, ' ') + '.'; }

  // demo forms and placeholder contacts
  d.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; }
      f.querySelector('.msg').classList.add('on');
    });
  });
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"],a[href^="mailto:"]');
    if (a) { e.preventDefault(); var s = d.querySelector('.demo-strip span'); if (s) { s.textContent = 'אלה פרטי קשר לדוגמה. המשרד אינו אמיתי.'; window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); } }
  });

  // cookie notice (the site stores only this choice)
  var KEY = 'delet2_consent';
  function show() {
    if (d.querySelector('.consent-bar')) return;
    var b = d.createElement('div'); b.className = 'consent-bar'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'הודעת עוגיות');
    b.innerHTML = '<p>האתר שומר בדפדפן רק את הבחירה שלכם בהודעה הזו. אין כאן כלי מדידה או פרסום. <a class="link" href="privacy.html">מדיניות הפרטיות</a></p><div class="btns"><button class="btn go" type="button" data-v="ok">הבנתי</button><button class="btn ghost" type="button" data-v="min">חיוניות בלבד</button></div>';
    var st = d.querySelector('.demo-strip'); st.parentNode.insertBefore(b, st.nextSibling);
    b.addEventListener('click', function (e) { var v = e.target.getAttribute('data-v'); if (!v) return; try { localStorage.setItem(KEY, v); } catch (x) {} b.remove(); });
  }
  var has = null; try { has = localStorage.getItem(KEY); } catch (x) {}
  if (!has) show();
  d.querySelectorAll('[data-consent-open]').forEach(function (b) { b.addEventListener('click', show); });
})();
