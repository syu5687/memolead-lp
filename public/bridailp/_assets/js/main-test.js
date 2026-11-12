/*
 *   1. 画面下の固定ボタン（電話する／お問い合わせはこちら）の表示・非表示
 *   2. 電話・メール・ボタンのクリックを GTM（dataLayer）へ送る
 *   3. 要素が画面に入ったら、ぼかしから「ふわっと」表示する
 *   4. CONCEPT のスライダー（slick）。←→やサムネイルで、画像・文章・ぼかし背景を同時に切り替える
 *   5. お問い合わせのアンケート方式フォーム（3ステップ・入力チェック・フォームメーラーへ送信・GTM計測）
 */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- 1. 固定ボタンの表示制御 ---------- */

  var bar = document.querySelector('[data-cta-bar]');
  var hero = document.querySelector('.hero');
  var contact = document.getElementById('contact');


  if (bar && hero && contact && 'IntersectionObserver' in window) {

    var passedHero = false;
    var inContact = false;

    var update = function () {
      bar.classList.toggle('is-visible', passedHero && !inContact);
    };

    // ファーストビューの監視：画面の上へ抜けたら「通過した」とみなす
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        passedHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      });
      update();
    }).observe(hero);

    // お問い合わせエリアの監視：少しでも見えていれば隠す
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        inContact = entry.isIntersecting;
      });
      update();
    }).observe(contact);

  } else if (bar) {
    bar.classList.add('is-visible');
  }

  /* ---------- 2. クリック計測（GTM 連携） ---------- */

  // GTM が読み込まれる前でも push できるように、配列を用意しておく
  window.dataLayer = window.dataLayer || [];

  // data-track 属性が付いたリンクだけを対象にする
  document.querySelectorAll('[data-track]').forEach(function (link) {
    link.addEventListener('click', function () {
      // GTM 側では、イベント名「lp_click」をトリガーにして
      // link_type（tel_click / mail_click / cta_click）と placement（場所）で振り分ける
      window.dataLayer.push({
        event: 'lp_click',
        link_type: link.dataset.track,
        placement: link.dataset.placement || '',
        page_type: 'monitor_lp'
      });
    });
  });

  /* ---------- 3. ふわっと表示（スクロールで出現） ---------- */

  // 対象：class="reveal"（その要素だけ）と class="reveal-group"（中の子要素を順番に）
  // 見た目（透明＋ぼかし → くっきり）は CSS 側で指定。JS は is-in を付けるだけ
  var targets = document.querySelectorAll('.reveal, .reveal-group');

  // 「動きを減らす」設定の人や、古いブラウザでは、最初から全部表示する
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          // 一度表示したら監視をやめる（スクロールで戻っても消さない）
          observer.unobserve(entry.target);
        }
      });
    }, {
      // 画面の下から10%手前に来たタイミングで表示を始める
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    });
    targets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 4. CONCEPT：スライダー（slick） ---------- */

  // jQuery か slick が読み込めなかった場合は何もしない（1枚目だけ表示されたままになる）
  if (window.jQuery && window.jQuery.fn.slick) {
    var $ = window.jQuery;
    var $slider = $('.js-cslider');
    var $current = $('.js-cslider-current');
    var bgImages = document.querySelectorAll('.cslider__bg [data-bg]');
    var thumbs = document.querySelectorAll('.cslider__thumb');

    // 番号を「01」「02」のように2桁にする関数
    var pad = function (n) { return ('0' + n).slice(-2); };

    // 指定した番号のぼかし背景だけを表示する関数
    var setBg = function (index) {
      bgImages.forEach(function (img) {
        img.classList.toggle('is-active', Number(img.dataset.bg) === index);
      });
    };

    // スライドが切り替わり始めた瞬間に、背景と「01 / 04」の数字を先に変える
    // （画像・文章のフェードと同時に背景も変わって見えるようにするため）
    $slider.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
      setBg(nextSlide);
      $current.text(pad(nextSlide + 1));
      // 下のサムネイルも、表示中のものだけ濃く・枠線付きにする
      thumbs.forEach(function (thumb) {
        thumb.classList.toggle('is-active', Number(thumb.dataset.go) === nextSlide);
      });
    });

    // サムネイルを押したら、その番号のスライドへ移動する（data-go="0〜3"）
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        $slider.slick('slickGoTo', Number(thumb.dataset.go));
      });
    });

    $slider.slick({
      fade: true,                 // 横に流すのではなく、ふわっと入れ替える
      speed: reduce ? 0 : 800,    // 切り替えにかける時間（ミリ秒）。動きを減らす設定の人は0
      cssEase: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      infinite: true,             // 04 の次は 01 に戻る
      dots: false,
      adaptiveHeight: false,
      // 矢印は HTML に書いた自前のボタンを使う（見た目を CSS で管理するため）
      prevArrow: $('.cslider__arrow--prev'),
      nextArrow: $('.cslider__arrow--next')
    });
  }

  /* ---------- 5. お問い合わせ：アンケート方式のフォーム ---------- */

  // ★テスト用：送信先は Cloudflare Worker（lp-rcs-monitor）→ Brevo
  // 本番の main.js（フォームメーラー）とは別ファイル。test/index.html だけが読み込む
  var WORKER_URL = 'https://lp-rcs-monitor.mk-cbe.workers.dev/submit';

  var qform = document.querySelector('[data-qform]');
  if (qform) {
    var card = qform.closest('.qform');
    var steps = qform.querySelectorAll('.qstep');
    var bars = card.querySelectorAll('.qform__bars li');
    var currentLabel = card.querySelector('.js-qform-current');
    var done = card.querySelector('.qform__done');
    var progress = card.querySelector('.qform__progress');
    var current = 0;   // 表示中のステップ（0始まり）

    // 指定したステップだけを表示し、上の進み具合（バーと「1 / 3」）も合わせる
    var showStep = function (index) {
      steps.forEach(function (step, i) {
        var active = i === index;
        step.hidden = !active;
        step.classList.toggle('is-active', active);
      });
      bars.forEach(function (bar, i) {
        bar.classList.toggle('is-done', i <= index);
      });
      currentLabel.textContent = index + 1;
      current = index;

      // ステップが変わったらフォームの先頭が見えるようにする（スマホで下の方にいる場合）
      var top = card.getBoundingClientRect().top;
      if (top < 0) {
        card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }

      // GTM：何問目まで進んだかを送る（どこで離脱しているかを見るため）
      window.dataLayer.push({ event: 'form_step', form_step: index + 1, page_type: 'monitor_lp' });
    };

    // エラー文の表示・非表示
    var setError = function (step, show) {
      step.querySelector('.qstep__error').hidden = !show;
    };

    // 電話番号のチェック：全角数字を半角にして、数字だけで10〜11桁ならOK
    var normalizeTel = function (value) {
      return value.replace(/[０-９]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      }).replace(/[^0-9]/g, '');
    };

    // 今のステップの入力が正しいかを調べる。正しければ true
    var validate = function (step) {
      var ok = true;

      // ラジオボタンの質問：どれか1つ選ばれているか
      var radios = step.querySelectorAll('input[type="radio"]');
      if (radios.length && !step.querySelector('input[type="radio"]:checked')) {
        ok = false;
      }

      // 入力欄（お名前・電話番号・メール）
      step.querySelectorAll('.qfield__input').forEach(function (input) {
        var valid = input.value.trim() !== '' && input.checkValidity();
        if (input.name === 'tel') {
          var digits = normalizeTel(input.value);
          valid = digits.length >= 10 && digits.length <= 11;
        }
        input.classList.toggle('is-invalid', !valid);
        input.setAttribute('aria-invalid', valid ? 'false' : 'true');
        if (!valid) { ok = false; }
      });

      // 同意のチェックボックス
      var agree = step.querySelector('input[name="agree"]');
      if (agree) {
        agree.closest('.qagree').classList.toggle('is-invalid', !agree.checked);
        if (!agree.checked) { ok = false; }
      }

      setError(step, !ok);
      return ok;
    };

    // 「次へ」ボタン
    qform.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (validate(steps[current])) {
          showStep(current + 1);
        }
      });
    });

    // 「戻る」ボタン（入力内容はそのまま残る）
    qform.querySelectorAll('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showStep(current - 1);
      });
    });

    // 選択肢を選んだら、少し待って自動で次の質問へ（選んだことが目で分かるように0.35秒待つ）
    qform.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var step = radio.closest('.qstep');
        setError(step, false);
        setTimeout(function () {
          if (steps[current] === step) {
            showStep(current + 1);
          }
        }, 350);
      });
    });

    // 完了画面に切り替える
    var finish = function () {
      qform.hidden = true;
      progress.hidden = true;
      done.hidden = false;
      done.focus();
      // GTM：申し込み完了（CV）。GTM側でこのイベントをコンバージョンに設定する
      window.dataLayer.push({ event: 'form_submit', form_name: 'monitor_entry', page_type: 'monitor_lp' });
    };

    // 入力した名前の欄の値を取り出す（前後の空白は除く）
    var getValue = function (name) {
      var el = qform.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    };

    // 送信（最後のステップの「申し込む」）
    qform.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!validate(steps[current])) { return; }

      var submitBtn = qform.querySelector('.qbtn--submit');
      submitBtn.disabled = true;

      // 送る内容をまとめる（company も送る：Worker 側でスパム判定に使う）
      var data = {};
      new FormData(qform).forEach(function (value, key) { data[key] = value; });
      data.tel = normalizeTel(getValue('tel'));
      data.page = location.href;

      // Worker に JSON で送る。Worker が Brevo で通知メールと自動返信を送る
      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().then(function (result) {
          // テスト中は Worker からの返事をコンソールに表示（原因調査用）
          console.info('[TEST] Worker の返事', res.status, result);
          if (!res.ok || !result.ok) { throw new Error(res.status); }
          finish();
        });
      }).catch(function () {
        // 送信に失敗したら、もう一度押せるように戻してお知らせする
        submitBtn.disabled = false;
        var error = steps[current].querySelector('.qstep__error');
        error.textContent = '送信できませんでした。時間をおいて再度お試しいただくか、お電話でお問い合わせください。';
        error.hidden = false;
      });
    });
  }

});