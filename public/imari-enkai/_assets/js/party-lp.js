/* @version v0003 | 2026-10-01 | RCI宴会LP | https://rc-imari.jp/party/ ・ /party/houji/ 共通
   v0003：data-default-purpose（法事ページ）でフォームの目的を初期選択 */
/* (v0002 の記録)
   依存なし（Vanilla JS）。GA4イベントは dataLayer.push → GTM（GTM-5L2RLKLP）で GA4 に送信
   v0002：期限切れプランの自動非表示（data-expire）／早期特典の締切目安を当日基準で表示／
          PDFクリックの二重計測を解消（party_pdf_click に分離）／人数の初期値は未選択のときだけ入れる */
(function () {
  'use strict';
  var root = document.getElementById('rpl');
  if (!root) return;
  window.dataLayer = window.dataLayer || [];

  function track(event, params) {
    var p = params || {};
    p.event = event;
    window.dataLayer.push(p);
  }

  /* ---------- 日本時間の「今日」 ---------- */
  function todayJST() {
    var now = new Date();
    var jst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
    return new Date(jst.getFullYear(), jst.getMonth(), jst.getDate());
  }
  function parseYMD(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  var today = todayJST();

  /* ---------- 期限切れの季節プランを隠す（data-expire="YYYY-MM-DD" の翌日0時以降） ---------- */
  root.querySelectorAll('[data-expire]').forEach(function (el) {
    var d = parseYMD(el.getAttribute('data-expire'));
    if (d && today > d) el.hidden = true;
  });

  /* ---------- 早期予約特典：今日予約した場合の対象日（1か月後の同日以降）を表示 ---------- */
  var dl = root.querySelector('[data-deadline]');
  if (dl && !dl.hidden) {
    var planStart = new Date(2026, 9, 1), planEnd = new Date(2027, 1, 28);
    var y = today.getFullYear(), mo = today.getMonth() + 1;
    var last = new Date(y, mo + 1, 0).getDate();
    var target = new Date(y, mo, Math.min(today.getDate(), last));
    if (target < planStart) target = planStart;
    if (target > planEnd) {
      dl.hidden = true; // 特典の対象になる日が期間内に残っていない
    } else {
      var w = '日月火水木金土'.charAt(target.getDay());
      dl.innerHTML = '目安：本日ご予約の場合、<b>' + (target.getMonth() + 1) + '月' + target.getDate() + '日（' + w + '）以降</b>のご宴会が特典の対象です。';
    }
  }

  /* ---------- フォーム要素（CF7 id=4304 の既存 name をそのまま使う） ---------- */
  var form = root.querySelector('.rpl-form form');
  function setIntent(intent, purpose) {
    if (!form) return;
    if (intent) {
      var r = form.querySelector('input[name="party-contents"][value="' + intent + '"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    if (purpose) {
      var s = form.querySelector('select[name="party-plan"]');
      if (s && !s.value) {
        for (var i = 0; i < s.options.length; i++) {
          if (s.options[i].value === purpose) { s.selectedIndex = i; break; }
        }
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
  /* 下層ページ（法事など）：ページの目的をフォームの「ご利用目的」に最初から入れる（v0003） */
  if (root.dataset.defaultPurpose) setIntent('', root.dataset.defaultPurpose);

  var pendingRange = '';
  function setPeople(range) {
    if (!form || !range) return;
    /* 15-40 はフォームの「〜20名」「21〜40名」にまたがるため、誤選択を避けて入れない */
    var map = { '40-80': '41〜80名', '80-150': '81〜150名', '150-224': '151〜224名', '225-500': '225名以上' };
    var s = form.querySelector('select[name="party-plannumber"]');
    if (!s || !map[range] || s.value) return; // 入力済みなら上書きしない
    for (var i = 0; i < s.options.length; i++) {
      if (s.options[i].value === map[range]) { s.selectedIndex = i; break; }
    }
  }

  /* ---------- クリック計測 ---------- */
  root.addEventListener('click', function (e) {
    var a = e.target.closest('a,button');
    if (!a || !root.contains(a)) return;
    var href = a.getAttribute('href') || '';

    if (/\.pdf($|\?)/.test(href)) {
      track('party_pdf_click', { cta_location: a.dataset.cta || 'purpose', plan_type: a.textContent.trim() });
      return;
    }
    if (a.dataset.cta) {
      track('party_cta_click', { cta_location: a.dataset.cta, plan_type: a.dataset.purpose || '' });
      if (href === '#rpl-contact') {
        setIntent(a.dataset.intent, a.dataset.purpose);
        if (pendingRange) setPeople(pendingRange);
      }
    }
    if (a.dataset.tel) track('party_tel_click', { cta_location: a.dataset.tel });
    if (a.dataset.line) track('party_line_click', { cta_location: a.dataset.line });
  });

  /* ---------- 人数から選ぶ → 会場ハイライト ---------- */
  var venue = document.getElementById('rpl-venue');
  var filterBar = venue && venue.querySelector('.rpl-venue__filter');
  function clearFilter() {
    if (!venue) return;
    venue.classList.remove('is-filtered');
    venue.querySelectorAll('[data-venue]').forEach(function (el) { el.classList.remove('is-match'); });
    if (filterBar) filterBar.hidden = true;
    root.querySelectorAll('.rpl-people__list button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  }
  root.querySelectorAll('.rpl-people__list button').forEach(function (btn) {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      if (!venue) return;
      var ids = (btn.dataset.venues || '').split(/\s+/);
      clearFilter();
      venue.classList.add('is-filtered');
      venue.querySelectorAll('[data-venue]').forEach(function (el) {
        if (ids.indexOf(el.dataset.venue) > -1) el.classList.add('is-match');
      });
      btn.setAttribute('aria-pressed', 'true');
      pendingRange = btn.dataset.range;
      if (filterBar) {
        filterBar.querySelector('span').textContent = btn.querySelector('.rpl-people__num').textContent + 'のおすすめ会場';
        filterBar.hidden = false;
      }
      track('party_cta_click', { cta_location: 'people_selector', people_range: btn.dataset.range });
      var first = venue.querySelector('.is-match') || venue;
      var top = first.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
  if (filterBar) filterBar.querySelector('.rpl-venue__clear').addEventListener('click', clearFilter);

  /* ---------- フォーム開始・送信完了 ---------- */
  if (form) {
    var started = false;
    form.addEventListener('focusin', function () {
      if (started) return;
      started = true;
      track('party_form_start', {});
    });
  }
  document.addEventListener('wpcf7mailsent', function (e) {
    if (!e.detail || String(e.detail.contactFormId) !== '4304') return;
    var get = function (n) {
      var f = (e.detail.inputs || []).filter(function (x) { return x.name === n; })[0];
      return f ? f.value : '';
    };
    track('party_form_submit', {
      plan_type: get('party-plan'),
      people_range: get('party-plannumber'),
      inquiry_type: get('party-contents')
    });
  }, false);

  /* ---------- SP固定CTA：フォーム表示中は隠す ---------- */
  var sticky = root.querySelector('.rpl-sticky');
  var contact = document.getElementById('rpl-contact');
  if (sticky && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { sticky.classList.toggle('is-hidden', en.isIntersecting); });
    }, { rootMargin: '0px 0px -30% 0px' }).observe(contact);
  }

  /* ---------- 控えめなフェードイン ---------- */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var targets = root.querySelectorAll('.rpl-h2, .rpl-plan__body, .rpl-bonus, .rpl-people__list, .rpl-venue__main, .rpl-venue__item, .rpl-purpose__item, .rpl-food__row, .rpl-houji__body, .rpl-support__list, .rpl-faq__list');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { t.classList.add('rpl-io'); io.observe(t); });
  }
})();
