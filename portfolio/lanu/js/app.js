/* לנו · אתר לדוגמה. שום מידע לא נשלח ולא נשמר. */
(function () {
  'use strict';
  var D = window.LANU;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var MONTHS = ['בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני', 'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function today() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function nice(d) { return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function short(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function money(n) { return '₪' + Math.round(n).toLocaleString('he-IL'); }
  function nightsWord(n) { return n === 1 ? 'לילה אחד' : n + ' לילות'; }
  function guestsWord(a, c) {
    var s = a === 1 ? 'מבוגר אחד' : a + ' מבוגרים';
    if (c) s += c === 1 ? ', ילד אחד' : ', ' + c + ' ילדים';
    return s;
  }

  // ברירת מחדל: חמישי הקרוב עד שבת
  function defaults() {
    var t = today(), d = (4 - t.getDay() + 7) % 7;
    if (d === 0) d = 7;
    var i = addDays(t, d);
    return { in: i, out: addDays(i, 2) };
  }

  function readState(qs) {
    var p = new URLSearchParams(qs || location.search), def = defaults();
    var i = parse(p.get('in')), o = parse(p.get('out')), t = today();
    if (!i || i < t) i = def.in;
    if (!o || o <= i || (o - i) / 864e5 > 30) o = addDays(i, Math.max(1, def.out - def.in > 0 ? 2 : 1));
    var a = Math.min(8, Math.max(1, parseInt(p.get('a'), 10) || 2));
    var c = Math.min(6, Math.max(0, parseInt(p.get('c'), 10) || 0));
    return { q: (p.get('q') || '').trim(), in: i, out: o, a: a, c: c, nights: Math.round((o - i) / 864e5), params: p };
  }

  function byId(id) { for (var i = 0; i < D.properties.length; i++) if (D.properties[i].id === id) return D.properties[i]; return null; }

  function fits(room, a, c) { return a <= room.adults && a + c <= room.adults + room.kids; }

  // מחיר סופי לכל הלילות: לילות חמישי ושישי בתוספת סוף שבוע, ודמי ניקיון לדירות
  function price(p, room, st) {
    var lines = [], sub = 0, d = new Date(st.in), wk = 0;
    for (var n = 0; n < st.nights; n++) {
      var w = d.getDay() === 4 || d.getDay() === 5;
      var amt = Math.round(room.price * (w ? 1 + p.weekend : 1) / 10) * 10;
      if (w) wk++;
      lines.push({ date: new Date(d), amount: amt, weekend: w });
      sub += amt;
      d = addDays(d, 1);
    }
    var fee = p.fee || 0, until = null, free = false;
    if (room.cancel > 0) { until = addDays(st.in, -room.cancel); free = until >= today(); }
    return { lines: lines, sub: sub, fee: fee, total: sub + fee, weekendNights: wk, until: until, free: free };
  }
  function cancelText(pr, room) {
    if (room.cancel === 0) return 'ללא החזר';
    return pr.free ? 'ביטול חינם עד ' + short(pr.until) : 'כבר אין ביטול חינם';
  }
  function minOk(p, st) { return st.nights >= (p.minNights || 1); }

  function best(p, st) {
    var b = null;
    p.rooms.forEach(function (r, i) {
      if (!fits(r, st.a, st.c)) return;
      var pr = price(p, r, st);
      if (!b || pr.total < b.pr.total) b = { room: r, idx: i, pr: pr };
    });
    return b;
  }

  function norm(s) { return (s || '').replace(/[״"׳'\-–]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function matches(p, q) {
    q = norm(q);
    if (!q || q === 'כל הארץ') return true;
    var reg = D.regions[p.region];
    var hay = norm([p.name, p.town, reg.name, D.types[p.type], p.region].join(' | '));
    return hay.indexOf(q) > -1 || norm(reg.name).indexOf(q) > -1 || q.indexOf(norm(p.town)) > -1 || q.indexOf(norm(reg.name)) > -1;
  }

  function qsFrom(st, extra) {
    var p = new URLSearchParams();
    if (st.q) p.set('q', st.q);
    p.set('in', iso(st.in)); p.set('out', iso(st.out)); p.set('a', st.a);
    if (st.c) p.set('c', st.c);
    if (extra) Object.keys(extra).forEach(function (k) { if (extra[k] !== '' && extra[k] != null) p.set(k, extra[k]); });
    return p.toString();
  }

  /* ---------- טופסי חיפוש ---------- */
  function initSearch(st) {
    $$('form.search').forEach(function (f) {
      var q = $('[name=q]', f), i = $('[name=in]', f), o = $('[name=out]', f), a = $('[name=a]', f), c = $('[name=c]', f);
      var t = iso(today());
      if (q && st.q) q.value = st.q;
      if (i) { i.min = t; i.value = iso(st.in); }
      if (o) { o.min = iso(addDays(st.in, 1)); o.value = iso(st.out); }
      if (a) a.value = String(st.a);
      if (c) c.value = String(st.c);
      if (i && o) i.addEventListener('change', function () {
        var d = parse(i.value); if (!d) return;
        o.min = iso(addDays(d, 1));
        var od = parse(o.value);
        if (!od || od <= d) o.value = iso(addDays(d, 2));
      });
      var note = $('.note', f);
      function upd() {
        if (!note || !i || !o) return;
        var di = parse(i.value), dn = parse(o.value);
        if (di && dn && dn > di) note.textContent = nightsWord(Math.round((dn - di) / 864e5)) + ', מ' + nice(di).replace(/^/, 'יום ') + ' עד ' + nice(dn).replace(/^/, 'יום ') + '.';
      }
      [i, o].forEach(function (el) { if (el) el.addEventListener('change', upd); });
      upd();
    });
  }

  /* ---------- דף הבית ---------- */
  function initHome(st) {
    var list = $('.rlist'), show = $('.rshow');
    if (list && show) {
      var imgs = $$('img', show), cap = $('figcaption', show);
      $$('a', list).forEach(function (a, n) {
        function on() {
          imgs.forEach(function (im, k) { im.classList.toggle('on', k === n); });
          $$('a', list).forEach(function (x, k) { x.classList.toggle('on', k === n); });
          if (cap) cap.textContent = a.getAttribute('data-name');
        }
        a.addEventListener('mouseenter', on);
        a.addEventListener('focus', on);
      });
    }
    var wk = defaults(), wst = { in: wk.in, out: wk.out, a: 2, c: 0, nights: 2 };
    var when = $('[data-weekend-dates]');
    if (when) when.textContent = 'חמישי עד שבת, ' + wk.in.getDate() + '–' + short(wk.out) + ', לשני מבוגרים.';
    $$('[data-card]').forEach(function (el) {
      var p = byId(el.getAttribute('data-card')), b = p && best(p, wst);
      if (!b) return;
      $('.price', el).innerHTML = '<b class="num">' + money(b.pr.total) + '</b> לשני לילות, כולל הכל';
      el.href = el.getAttribute('href').split('?')[0] + '?' + qsFrom(wst);
    });
  }

  /* ---------- תוצאות ---------- */
  function initResults(st) {
    var list = $('.list'); if (!list) return;
    var form = $('#filters'), sort = $('#sort'), count = $('.count'), empty = $('.empty');
    var P = st.params;
    // מצב סינון מה־URL
    ['type', 'region', 'amen'].forEach(function (k) {
      var vals = P.getAll(k).join(',').split(',').filter(Boolean);
      vals.forEach(function (v) { var el = $('[name=' + k + '][value="' + v + '"]', form); if (el) el.checked = true; });
    });
    if (P.get('free') === '1') $('[name=free]', form).checked = true;
    if (P.get('max')) $('[name=max]', form).value = P.get('max');
    if (P.get('sort')) sort.value = P.get('sort');

    var rows = $$('.row', list);
    rows.forEach(function (li) {
      var p = byId(li.getAttribute('data-id')), b = best(p, st), buy = $('.buy', li);
      li._p = p; li._b = b;
      var link = 'makom-' + p.id + '.html?' + qsFrom(st);
      $$('a', li).forEach(function (a) { a.href = link; });
      if (!b) {
        li.classList.add('off');
        $('.room', buy).textContent = 'אין חדר שמתאים ל' + guestsWord(st.a, st.c);
        $('.total', buy).textContent = '';
        $('.per', buy).textContent = '';
        $('.cx', buy).textContent = '';
        return;
      }
      if (!minOk(p, st)) {
        li.classList.add('off');
        $('.room', buy).textContent = 'מינימום ' + p.minNights + ' לילות';
      } else {
        $('.room', buy).textContent = b.room.name + ', ' + nightsWord(st.nights);
      }
      $('.total', buy).textContent = money(b.pr.total);
      $('.per', buy).textContent = 'מחיר סופי, ' + guestsWord(st.a, st.c) + (b.pr.fee ? ', כולל ניקיון' : '');
      $('.cx', buy).textContent = cancelText(b.pr, b.room) + (b.room.breakfast ? ' · ארוחת בוקר כלולה' : '');
    });

    var out = $('#maxout'), max = $('[name=max]', form);
    function readF() {
      var fd = new FormData(form);
      return { type: fd.getAll('type'), region: fd.getAll('region'), amen: fd.getAll('amen'), free: !!fd.get('free'), max: +fd.get('max') };
    }
    function apply(push) {
      var f = readF(), shown = 0, so = sort.value;
      out.textContent = +max.value >= +max.max ? 'ללא הגבלה' : 'עד ' + money(+max.value) + ' ללילה';
      rows.forEach(function (li) {
        var p = li._p, b = li._b, ok = matches(p, st.q);
        if (ok && f.type.length) ok = f.type.indexOf(p.type) > -1;
        if (ok && f.region.length) ok = f.region.indexOf(p.region) > -1;
        if (ok && f.amen.length) ok = f.amen.every(function (a) { return p.amenities.indexOf(a) > -1; });
        if (ok && f.free) ok = !!(b && b.pr.free);
        if (ok && +max.value < +max.max) ok = !!(b && b.pr.sub / st.nights <= +max.value);
        li.hidden = !ok;
        if (ok && !li.classList.contains('off')) shown++;
      });
      var arr = rows.slice().sort(function (x, y) {
        var ox = x.classList.contains('off'), oy = y.classList.contains('off');
        if (ox !== oy) return ox ? 1 : -1;
        var bx = x._b ? x._b.pr.total : 1e9, by = y._b ? y._b.pr.total : 1e9;
        if (so === 'low') return bx - by;
        if (so === 'high') return by - bx;
        if (so === 'size') return (y._b ? y._b.room.size : 0) - (x._b ? x._b.room.size : 0);
        return (+x.getAttribute('data-rank')) - (+y.getAttribute('data-rank'));
      });
      arr.forEach(function (li) { list.appendChild(li); });
      var where = st.q && st.q !== 'כל הארץ' ? ' ב' + st.q.replace(/^ב/, '') : '';
      count.textContent = (shown === 1 ? 'מקום אחד' : shown + ' מקומות') + where + ' · ' + nightsWord(st.nights) + ' · ' + guestsWord(st.a, st.c);
      empty.hidden = shown > 0;
      if (push) {
        var extra = { sort: so === 'rec' ? '' : so, free: f.free ? '1' : '', max: +max.value < +max.max ? max.value : '' };
        var p = new URLSearchParams(qsFrom(st, extra));
        f.type.forEach(function (v) { p.append('type', v); });
        f.region.forEach(function (v) { p.append('region', v); });
        f.amen.forEach(function (v) { p.append('amen', v); });
        history.replaceState(null, '', '?' + p.toString());
      }
    }
    form.addEventListener('input', function () { apply(true); });
    form.addEventListener('change', function () { apply(true); });
    sort.addEventListener('change', function () { apply(true); });
    $('#clearf').addEventListener('click', function () { form.reset(); apply(true); });
    var fb = $('.filters'), open = $('.openf'), close = $('.filters .close button');
    open.addEventListener('click', function () { fb.classList.add('open'); open.setAttribute('aria-expanded', 'true'); var fi = $('input', fb); if (fi) fi.focus(); });
    close.addEventListener('click', function () { fb.classList.remove('open'); open.setAttribute('aria-expanded', 'false'); open.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && fb.classList.contains('open')) close.click(); });
    apply(false);
    var h1 = $('.pagehead h1');
    if (h1 && st.q) h1.textContent = 'מקומות לינה ב' + st.q.replace(/^ב/, '');
  }

  /* ---------- דף נכס ---------- */
  function initPlace(st) {
    var id = document.body.getAttribute('data-place'); if (!id) return;
    var p = byId(id), cheapest = null;
    $$('.rooms tbody tr').forEach(function (tr) {
      var i = +tr.getAttribute('data-room'), r = p.rooms[i], pr = price(p, r, st), ok = fits(r, st.a, st.c) && minOk(p, st);
      $('.tot', tr).textContent = money(pr.total);
      $('.nights', tr).textContent = nightsWord(st.nights) + (pr.weekendNights ? ', מתוכם ' + (pr.weekendNights === 1 ? 'לילה אחד' : pr.weekendNights + ' לילות') + ' בסוף שבוע' : '') + (pr.fee ? ', כולל ניקיון ' + money(pr.fee) : '');
      $('.cx', tr).textContent = cancelText(pr, r);
      var btn = $('.btn', tr);
      tr.classList.toggle('nofit', !ok);
      if (ok) {
        btn.href = 'booking.html?' + qsFrom(st, { p: p.id, r: i });
        btn.textContent = 'להזמנת החדר';
        btn.removeAttribute('aria-disabled');
        if (!cheapest || pr.total < cheapest) cheapest = pr.total;
      } else {
        btn.removeAttribute('href');
        btn.setAttribute('aria-disabled', 'true');
        btn.textContent = !minOk(p, st) ? 'מינימום ' + p.minNights + ' לילות' : 'לא מתאים ל' + guestsWord(st.a, st.c);
      }
    });
    var sum = $('.side .sum');
    if (sum) sum.innerHTML = cheapest ? 'מ־<b class="num">' + money(cheapest) + '</b> ל' + nightsWord(st.nights) + ', מחיר סופי.' : 'אין חדר פנוי שמתאים לחיפוש הזה. נסו לשנות תאריכים או מספר אורחים.';
    $$('.crumbs a[data-back]').forEach(function (a) { a.href = 'search.html?' + qsFrom(st); });

    // גלריה במסך מלא
    var dlg = $('dialog.lb'); if (!dlg || !dlg.showModal) return;
    var im = $('img', dlg), cap = $('figcaption', dlg), cur = 0, ph = p.photos, last = null;
    function show(n) {
      cur = (n + ph.length) % ph.length;
      im.src = 'https://images.unsplash.com/photo-' + ph[cur][0] + '?w=2000&q=80&auto=format&fit=crop';
      im.alt = ph[cur][1];
      cap.textContent = ph[cur][1] + ' · ' + (cur + 1) + ' מתוך ' + ph.length;
    }
    $$('.gallery button').forEach(function (b, n) {
      b.addEventListener('click', function () { last = b; show(n); dlg.showModal(); $('.x', dlg).focus(); });
    });
    $('.prev', dlg).addEventListener('click', function () { show(cur - 1); });
    $('.next', dlg).addEventListener('click', function () { show(cur + 1); });
    $('.x', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { if (last) last.focus(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(cur + 1);
      if (e.key === 'ArrowRight') show(cur - 1);
    });
  }

  /* ---------- הזמנה ---------- */
  function initBooking(st) {
    var box = $('.book'); if (!box) return;
    var P = st.params, p = byId(P.get('p')), ri = parseInt(P.get('r'), 10), r = p && p.rooms[ri];
    if (!p || !r) { $('.nobook').hidden = false; box.hidden = true; return; }
    var pr = price(p, r, st);
    var sm = $('.summary');
    $('img', sm).src = 'https://images.unsplash.com/photo-' + p.photos[0][0] + '?w=900&q=80&auto=format&fit=crop';
    $('img', sm).alt = p.photos[0][1];
    $('h3', sm).textContent = p.name;
    $('.where', sm).textContent = D.types[p.type] + ' · ' + p.town;
    $('[data-s=room]', sm).textContent = r.name;
    $('[data-s=in]', sm).textContent = nice(st.in) + ', מ־' + p.checkin;
    $('[data-s=out]', sm).textContent = nice(st.out) + ', עד ' + p.checkout;
    $('[data-s=guests]', sm).textContent = guestsWord(st.a, st.c);
    var html = '';
    pr.lines.forEach(function (l) { html += '<span>' + DAYS[l.date.getDay()] + ' ' + l.date.getDate() + '.' + (l.date.getMonth() + 1) + (l.weekend ? ' (סוף שבוע)' : '') + '</span><span class="num">' + money(l.amount) + '</span>'; });
    if (pr.fee) html += '<span>דמי ניקיון</span><span class="num">' + money(pr.fee) + '</span>';
    html += '<span class="tot">סך הכל</span><span class="tot num">' + money(pr.total) + '</span>';
    $('.lines', sm).innerHTML = html;
    $('.cx', sm).textContent = cancelText(pr, r) + (r.breakfast ? ' · ארוחת בוקר כלולה' : '') + ' · התשלום במקום, ביום ההגעה';
    var back = $('[data-back-place]'); if (back) back.href = 'makom-' + p.id + '.html?' + qsFrom(st);
    if (!fits(r, st.a, st.c) || !minOk(p, st)) { $('.mismatch').hidden = false; }

    var f = $('form', box), btn = $('button[type=submit]', f);
    btn.disabled = false;
    var rules = {
      first: function (v) { return v.trim().length > 1 || 'כתבו שם פרטי'; },
      last: function (v) { return v.trim().length > 1 || 'כתבו שם משפחה'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'כתובת המייל לא נראית תקינה'; },
      phone: function (v) { return /^0\d{8,9}$/.test(v.replace(/[\s\-]/g, '')) || 'מספר טלפון ישראלי, 9 או 10 ספרות'; },
    };
    function check(el) {
      var fn = rules[el.name]; if (!fn) return true;
      var res = fn(el.value), wrap = el.closest('.field'), err = $('#' + el.name + '-err');
      var ok = res === true;
      wrap.classList.toggle('bad', !ok);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      err.textContent = ok ? '' : res;
      return ok;
    }
    Object.keys(rules).forEach(function (k) { var el = f.elements[k]; el.addEventListener('blur', function () { if (el.value) check(el); }); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      Object.keys(rules).forEach(function (k) { var el = f.elements[k]; if (!check(el) && !bad) bad = el; });
      var ag = f.elements.agree, agErr = $('#agree-err');
      if (!ag.checked) { agErr.textContent = 'צריך לאשר את תנאי הביטול'; if (!bad) bad = ag; } else agErr.textContent = '';
      if (bad) { bad.focus(); return; }
      var done = $('.done');
      $('[data-d=name]', done).textContent = f.elements.first.value.trim();
      $('[data-d=place]', done).textContent = r.name + ' ב' + p.name;
      $('[data-d=dates]', done).textContent = nice(st.in) + ' עד ' + nice(st.out);
      $('[data-d=total]', done).textContent = money(pr.total);
      f.reset();
      f.hidden = true; $('.formhead').hidden = true;
      done.hidden = false;
      var h = $('h2', done); h.setAttribute('tabindex', '-1'); h.focus();
    });
  }

  /* ---------- כניסה מדורגת ---------- */
  function initMotion() {
    var els = $$('.rise');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  var st = readState();
  initSearch(st);
  initHome(st);
  initResults(st);
  initPlace(st);
  initBooking(st);
  initMotion();
})();
