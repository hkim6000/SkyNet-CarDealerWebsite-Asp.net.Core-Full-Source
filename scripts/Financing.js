var FinancingJs = (function () {

    var timer = null;
    var ptimer = null;
    var ttimer = null;
    var lastQ = '';
    var quickCond = 'new';
    var picks = [];

    function el(id) {
        return document.getElementById(id);
    }

    function val(id) {
        var e = el(id);
        return e ? (e.value || '').trim() : '';
    }

    function checked(id) {
        var e = el(id);
        return e && e.checked ? '1' : '';
    }

    function page() {
        var s = document.querySelector('.fi-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('fi-nav').classList.add('fi-open');
        el('fi-scrim').classList.add('fi-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('fi-nav').classList.remove('fi-open');
        el('fi-scrim').classList.remove('fi-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.fi-mi');
        if (li) {
            li.classList.toggle('fi-exp');
        }
    }

    function search(value) {
        var q = (value || '').trim();
        clearTimeout(timer);
        if (q.length < 2) {
            closeSugg();
            lastQ = '';
            return;
        }
        timer = setTimeout(function () {
            if (q === lastQ && el('fi-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Financing/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('fi-sugg').classList.add('fi-open');
    }

    function closeSugg() {
        el('fi-sugg').classList.remove('fi-open');
    }

    function toast(msg) {
        var t = el('fi-toast');
        t.textContent = msg;
        t.classList.add('fi-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('fi-open');
        }, 3200);
    }

    function openModal() {
        el('fi-modal').classList.add('fi-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'fi-modal') {
            return;
        }
        el('fi-modal').classList.remove('fi-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.fi-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('fi-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('Financing/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('fi-qmake') },
            { key: 'body', vlu: val('fi-qbody') },
            { key: 'price', vlu: val('fi-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('fi-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.fi-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.fi-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Financing/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('fi-f-' + k);
        if (!f) {
            return;
        }
        if (f.type === 'checkbox') {
            f.checked = false;
        } else {
            f.value = '';
        }
        filter();
    }

    function clearAll() {
        var fields = document.querySelectorAll('.fi-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.fi-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('fi-filters').classList.toggle('fi-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.fi-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('fi-act');
        }
        btn.classList.add('fi-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('Financing/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('fi-down') },
            { key: 'trade', vlu: val('fi-trade') },
            { key: 'term', vlu: val('fi-term') },
            { key: 'tier', vlu: val('fi-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('fi-stock') });
        } else {
            list.push({ key: 'price', vlu: val('fi-price') });
        }
        $ApiRequest('Financing/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('Financing/Trade', JSON.stringify([
            { key: 'year', vlu: val('fi-tyear') },
            { key: 'body', vlu: val('fi-tbody') },
            { key: 'miles', vlu: val('fi-tmiles') },
            { key: 'cond', vlu: val('fi-tcond') }
        ]));
    }

    function useTrade(v) {
        el('fi-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('Financing/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('fi-stock') },
            { key: 'date', vlu: val('fi-ddate') },
            { key: 'time', vlu: val('fi-dtime') },
            { key: 'name', vlu: val('fi-name') },
            { key: 'phone', vlu: val('fi-phone') },
            { key: 'email', vlu: val('fi-email') },
            { key: 'trade', vlu: checked('fi-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('Financing/Budget', JSON.stringify([
            { key: 'budget', vlu: val('fi-budget') },
            { key: 'down', vlu: val('fi-bdown') },
            { key: 'term', vlu: val('fi-bterm') },
            { key: 'tier', vlu: val('fi-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('Financing/Prequal', JSON.stringify([
            { key: 'name', vlu: val('fi-name') },
            { key: 'phone', vlu: val('fi-phone') },
            { key: 'email', vlu: val('fi-email') },
            { key: 'income', vlu: val('fi-income') },
            { key: 'housing', vlu: val('fi-housing') },
            { key: 'tier', vlu: val('fi-ptier') },
            { key: 'job', vlu: val('fi-job') },
            { key: 'consent', vlu: checked('fi-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('Financing/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('fi-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('fi-open', picks.length > 0);
        el('fi-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('fi-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.fi-cmp input');
        for (var i = 0; i < boxes.length; i++) {
            boxes[i].checked = picks.indexOf(boxes[i].value) >= 0;
        }
        tray();
    }

    function pickCompare(box) {
        var i = picks.indexOf(box.value);
        if (box.checked) {
            if (picks.length >= 3) {
                box.checked = false;
                toast('You can compare up to 3 models.');
                return;
            }
            if (i < 0) {
                picks.push(box.value);
            }
        } else if (i >= 0) {
            picks.splice(i, 1);
        }
        tray();
    }

    function compare() {
        $ApiRequest('Financing/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('fi-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.fi-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="fi-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Financing/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('fi-date') },
                { key: 'time', vlu: val('fi-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.fi-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('fi-act');
        }
        btn.classList.add('fi-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('fi-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('Financing/Book', JSON.stringify([
            { key: 'year', vlu: val('fi-year') },
            { key: 'make', vlu: val('fi-make') },
            { key: 'model', vlu: val('fi-model') },
            { key: 'miles', vlu: val('fi-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('fi-notes') },
            { key: 'date', vlu: val('fi-date') },
            { key: 'time', vlu: val('fi-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('fi-advisor') },
            { key: 'name', vlu: val('fi-name') },
            { key: 'phone', vlu: val('fi-phone') },
            { key: 'email', vlu: val('fi-email') },
            { key: 'texts', vlu: checked('fi-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('fi-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.fi-main em[id^="fi-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.fi-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('Financing/Parts', JSON.stringify([
            { key: 'name', vlu: val('fi-pname') },
            { key: 'email', vlu: val('fi-pemail') },
            { key: 'vehicle', vlu: val('fi-pveh') },
            { key: 'part', vlu: val('fi-part') },
            { key: 'qty', vlu: val('fi-qty') },
            { key: 'ship', vlu: val('fi-ship') }
        ]));
    }

    function partsSent() {
        el('fi-pveh').value = '';
        el('fi-part').value = '';
        el('fi-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.fi-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('fi-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.fi-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('fi-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('fi-lemail').value = 'demo@crestline.example';
        el('fi-lpass').value = 'Drive2026!';
        el('fi-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('Financing/SignIn', JSON.stringify([
            { key: 'email', vlu: val('fi-lemail') },
            { key: 'password', vlu: el('fi-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('fi-account');
        a.classList.add('fi-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('Financing/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('fi-cfirst') },
            { key: 'last', vlu: val('fi-clast') },
            { key: 'email', vlu: val('fi-cemail') },
            { key: 'password', vlu: el('fi-cpass').value },
            { key: 'confirm', vlu: el('fi-cpass2').value },
            { key: 'terms', vlu: checked('fi-cterms') }
        ]));
    }

    function created() {
        el('fi-cpass').value = '';
        el('fi-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('Financing/Reset', JSON.stringify([{ key: 'email', vlu: val('fi-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('Financing/Send', JSON.stringify([
            { key: 'name', vlu: val('fi-name') },
            { key: 'phone', vlu: val('fi-phone') },
            { key: 'email', vlu: val('fi-email') },
            { key: 'topic', vlu: val('fi-topic') },
            { key: 'message', vlu: val('fi-msg') }
        ]));
    }

    function sent() {
        var f = el('fi-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Financing/Subscribe', JSON.stringify([{ key: 'email', vlu: val('fi-nl-email') }]));
    }

    function subscribed() {
        el('fi-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('fi-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'fi-tr') {
                var m = el('fi-e-transport');
                if (m) {
                    m.textContent = '';
                }
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeSugg();
                closeNav();
                closeModal();
            }
        });
        window.addEventListener('scroll', function () {
            var h = el('fi-head');
            if (h) {
                h.classList.toggle('fi-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Service' && services() !== '') {
            plan();
        }
    }

    return {
        reveal: function () { reveal(); },
        openNav: function () { openNav(); },
        closeNav: function () { closeNav(); },
        toggleSub: function (btn) { toggleSub(btn); },
        search: function (v) { search(v); },
        openSugg: function () { openSugg(); },
        closeSugg: function () { closeSugg(); },
        toast: function (m) { toast(m); },
        openModal: function () { openModal(); },
        closeModal: function (e) { closeModal(e); },
        cond: function (c) { cond(c); },
        quick: function () { quick(false); },
        quickHref: function (h) { quickHref(h); },
        filter: function () { filter(); },
        clearF: function (k) { clearF(k); },
        clearAll: function () { clearAll(); },
        toggleFilters: function () { toggleFilters(); },
        chip: function (btn, v) { chip(btn, v); },
        payment: function () { payment(); },
        trade: function () { trade(); },
        useTrade: function (v) { useTrade(v); },
        testDrive: function () { testDrive(); },
        budget: function () { budget(); },
        prequal: function () { prequal(); },
        view: function (k) { view(k); },
        pickCompare: function (b) { pickCompare(b); },
        syncCompare: function () { syncCompare(); },
        compare: function () { compare(); },
        toCompare: function () { toCompare(); },
        clearCompare: function () { clearCompare(); },
        plan: function () { plan(); },
        pickSlot: function (b) { pickSlot(b); },
        slot: function (t, l) { slot(t, l); },
        book: function () { book(); },
        booked: function () { booked(); },
        firstError: function () { firstError(); },
        parts: function () { parts(); },
        partsSent: function () { partsSent(); },
        tab: function (t) { tab(t); },
        demo: function () { demo(); },
        login: function () { login(); },
        signedIn: function () { signedIn(); },
        signOut: function () { signOut(); },
        create: function () { create(); },
        created: function () { created(); },
        reset: function () { reset(); },
        send: function () { send(); },
        sent: function () { sent(); },
        subscribe: function () { subscribe(); },
        subscribed: function () { subscribed(); }
    };

})();

FinancingJs.reveal();
