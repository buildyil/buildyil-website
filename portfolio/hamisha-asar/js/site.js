/* החמישה־עשר (demo site by Buildy IL). Every page reads in full without this file. */
(function () {
  'use strict';
  var DATES=[[1,"2026-02-16","2026-02-16","2026-02-23"],[2,"2026-03-16","2026-03-16","2026-03-26"],[3,"2026-04-27","2026-04-27","2026-04-27"],[4,"2026-05-18","2026-05-18","2026-05-26"],[5,"2026-06-15","2026-06-16","2026-06-23"],[6,"2026-07-15","2026-07-16","2026-07-27"],[7,"2026-08-17","2026-08-17","2026-08-24"],[8,"2026-09-24","2026-09-24","2026-09-24"],[9,"2026-10-19","2026-10-19","2026-10-26"],[10,"2026-11-16","2026-11-16","2026-11-23"],[11,"2026-12-15","2026-12-16","2026-12-23"],[12,"2027-01-18","2027-01-18","2027-01-26"]];
var MONTHS=["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
var WEEKDAYS=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
var KINDS=["מע\"מ רגיל ומקדמות מס הכנסה","ניכויים","דוח מע\"מ מפורט"];
function calendarModel(DATES, MONTHS, WEEKDAYS, KINDS, freq, today) {
  const parse = iso => iso.split('-').map(Number);
  const short = iso => { const [, m, d] = parse(iso); return d + '.' + m; };
  const span = n => freq === 'b' ? MONTHS[n - 2] + ' ו' + MONTHS[n - 1] : MONTHS[n - 1];
  const rows = DATES.filter(r => freq === 'm' || r[0] % 2 === 0);

  let at = rows.findIndex(r => r[1] >= today);
  const expired = at < 0;
  if (expired) at = rows.length - 1;
  const row = rows[at];

  // A later date of the previous period can still be ahead of the visitor.
  let pending = null;
  const before = expired ? row : rows[at - 1];
  if (before) {
    for (const k of [2, 3]) {
      if (before[k] >= today) {
        pending = { date: short(before[k]), name: KINDS[k - 1], period: span(before[0]) };
        break;
      }
    }
  }

  const [y, m, d] = parse(row[1]);
  const marks = row.slice(1).map(parse).filter(x => x[1] === m).map(x => x[2]);
  return {
    day: d,
    title: MONTHS[m - 1] + ' ' + y,
    weekday: 'יום ' + WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()],
    period: span(row[0]),
    offset: new Date(Date.UTC(y, m - 1, 1)).getUTCDay(),
    length: new Date(Date.UTC(y, m, 0)).getUTCDate(),
    marks,
    due: KINDS.map((name, i) => ({ name, date: short(row[i + 1]), iso: row[i + 1] })),
    month: row[0],
    expired,
    pending,
  };
}
function monthGrid(x) {
  let h = 'אבגדהוש'.split('').map(c => '<em>' + c + '</em>').join('') + '<span></span>'.repeat(x.offset);
  for (let i = 1; i <= x.length; i++) h += x.marks.includes(i) ? '<mark>' + i + '</mark>' : '<span>' + i + '</span>';
  return h;
}
function dueRows(x) {
  return x.due.map(r => '<li><span>' + r.name + '</span><b>' + r.date + '</b></li>').join('');
}
function sendLine(x) {
  if (x.expired && !x.pending) return 'לוח 2026 הסתיים.<br>המועדים כאן הם דוגמה.';
  if (x.pending) return 'עוד לפני כן, ב־' + x.pending.date + ':<br>' + x.pending.name + ' על ' + x.pending.period + '.';
  return 'עד ה־5 בחודש אתם שולחים קבלות.<br>מכאן זה עלינו.';
}

  var doc = document, root = doc.documentElement;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  root.classList.add('js');

  /* menu */
  var menu = $('.menu-btn'), top = $('.top');
  function setMenu(open) {
    top.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'סגירה' : 'תפריט';
  }
  if (menu) {
    menu.addEventListener('click', function () { setMenu(!top.classList.contains('open')); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && top.classList.contains('open')) { setMenu(false); menu.focus(); }
    });
  }

  /* storage notice: the only thing this site stores is that it was closed */
  var KEY = 'hamisha_asar_notice', notice = $('.notice');
  function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  if (notice) {
    notice.hidden = seen();
    $('button', notice).addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) { /* private window */ }
      notice.hidden = true;
      $('.logo').focus();
    });
    $$('[data-notice]').forEach(function (b) {
      b.addEventListener('click', function () {
        notice.hidden = false;
        scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
        $('button', notice).focus({ preventScroll: true });
      });
    });
  }

  /* the calendar */
  function isoToday() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var today = isoToday(), cal = $('[data-cal]');

  function periodName(m, freq) {
    return freq === 'b' && m % 2 === 0 ? MONTHS[m - 2] + ' ו' + MONTHS[m - 1] : MONTHS[m - 1];
  }
  function draw(freq, animate) {
    var x = calendarModel(DATES, MONTHS, WEEKDAYS, KINDS, freq, today);
    if (cal) {
      $('.num', cal).textContent = x.day;
      $('.month b', cal).textContent = x.title;
      $('.month .when', cal).textContent = x.weekday + ', על ' + x.period;
      $('.days', cal).innerHTML = monthGrid(x);
      $('.due', cal).innerHTML = dueRows(x);
      $('.send', cal).innerHTML = sendLine(x);
      if (animate && !still) {
        var page = $('.page', cal);
        page.classList.remove('turn'); void page.offsetWidth; page.classList.add('turn');
      }
    }
    $$('.year tbody tr').forEach(function (tr) {
      var m = +tr.dataset.month;
      tr.hidden = freq === 'b' && m % 2 !== 0;
      if (!tr.hidden) $('th', tr).textContent = periodName(m, freq);
      tr.classList.toggle('next', !x.expired && m === x.month);
    });
  }

  var radios = $$('input[name="freq"]');
  function currentFreq() {
    var r = radios.filter(function (i) { return i.checked; })[0];
    return r ? r.value : 'm';
  }
  radios.forEach(function (r) {
    r.addEventListener('change', function () { draw(r.value, true); });
  });
  if (cal) draw(currentFreq(), false);

  /* add the remaining dates to the visitor's own calendar */
  var ics = $('[data-ics]');
  if (ics) {
    ics.hidden = false;
    ics.addEventListener('click', function () {
      var freq = currentFreq(), status = $('#ics-status'), n = 0;
      var now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      var out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Buildy IL demo//Hamisha Asar//HE', 'CALSCALE:GREGORIAN'];
      DATES.forEach(function (r) {
        if (freq === 'b' && r[0] % 2) return;
        KINDS.forEach(function (name, i) {
          var iso = r[i + 1];
          if (iso < today) return;
          var next = new Date(iso + 'T00:00:00Z');
          next.setUTCDate(next.getUTCDate() + 1);
          n++;
          out.push('BEGIN:VEVENT', 'UID:' + r[0] + '-' + i + '-2026@hamisha-asar.demo', 'DTSTAMP:' + now,
            'DTSTART;VALUE=DATE:' + iso.replace(/-/g, ''),
            'DTEND;VALUE=DATE:' + next.toISOString().slice(0, 10).replace(/-/g, ''),
            'SUMMARY:' + name + ' (' + periodName(r[0], freq) + ')', 'TRANSP:TRANSPARENT', 'END:VEVENT');
        });
      });
      out.push('END:VCALENDAR');
      if (!n) { status.textContent = 'לא נשארו מועדים בלוח של 2026.'; return; }
      var a = doc.createElement('a'), url = URL.createObjectURL(new Blob([out.join('\r\n') + '\r\n'], { type: 'text/calendar' }));
      a.href = url; a.download = 'moadim-2026.ics';
      doc.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      status.textContent = 'הקובץ מוכן, עם ' + n + ' מועדים. פותחים אותו ביומן. כדאי לוודא מול רשות המסים.';
    });
  }

  /* signature move: the month's pages tear off with the scroll */
  var story = $('.story');
  if (story && !still) {
    var sheets = $$('.sheet', story), queued = false;
    var run = function () {
      queued = false;
      if (!story.classList.contains('live')) return;
      var box = story.getBoundingClientRect();
      var travel = box.height - $('.stage', story).offsetHeight;
      var p = travel > 0 ? Math.min(1, Math.max(0, -box.top / travel)) : 0;
      sheets.forEach(function (s, i) {
        var t = i === sheets.length - 1 ? 0 : Math.min(1, Math.max(0, (p - (0.22 + i * 0.38)) / 0.17));
        var e = t * t;
        s.style.transform = 'translate3d(' + (-125 * e) + '%,' + (-45 * e) + '%,0) rotate(' + (-16 * t) + 'deg)';
        // a page shows once the one above it starts to lift
        var covered = i > 0 && p <= 0.22 + (i - 1) * 0.38;
        s.style.opacity = t === 1 || covered ? '0' : '1';
      });
    };
    // Very short screens (and large browser zoom) get the plain list instead of a held stage.
    var fit = function () {
      var on = innerHeight >= 560;
      story.classList.toggle('live', on);
      if (!on) sheets.forEach(function (s) { s.style.transform = ''; s.style.opacity = ''; });
      run();
    };
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', fit);
    fit();
  }

  /* entrances */
  var rv = $$('.rv');
  if (!still && 'IntersectionObserver' in window) {
    root.classList.add('motion');
    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = Math.min(i++, 5) * 70 + 'ms';
        en.target.classList.add('in');
        io.unobserve(en.target);
        // clear the delay so hover and press respond immediately afterwards
        setTimeout(function () { en.target.style.transitionDelay = ''; }, 1100);
      });
    });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* demo form: checks the fields, sends nothing */
  var form = $('form[data-demo]');
  if (form) {
    var submit = $('button[type="submit"]', form), msg = $('.form-msg', form);
    var check = function (input) {
      var err = doc.getElementById(input.id + '-err'), v = input.value.trim(), text = '';
      if (input.id === 'f-name' && v.length < 2) text = 'כתבו שם.';
      if (input.id === 'f-phone' && !/^(0|\+972)\d{8,9}$/.test(v.replace(/[\s()-]/g, ''))) text = 'כתבו מספר טלפון ישראלי מלא.';
      if (input.id === 'f-kind' && !v) text = 'בחרו סוג עסק.';
      input.setAttribute('aria-invalid', String(!!text));
      err.textContent = text;
      return !text;
    };
    var fields = $$('input,select', form);
    submit.disabled = false;
    fields.forEach(function (f) {
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.textContent = '';
      var bad = fields.filter(function (f) { return !check(f); });
      if (bad.length) { bad[0].focus(); return; }
      msg.textContent = 'זה אתר לדוגמה, ולכן שום פרט לא נשלח ולא נשמר. באתר אמיתי הייתה נקבעת פגישה.';
    });
  }

  /* placeholder phone and mail must not pretend to work */
  var live = $('#contact-note');
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"],a[href^="mailto:"]');
    if (!a) return;
    e.preventDefault();
    live.textContent = 'אלה פרטי קשר לדוגמה. המשרד אינו אמיתי.';
    live.hidden = false;
    clearTimeout(live._t);
    live._t = setTimeout(function () { live.hidden = true; }, 5000);
  });
})();
