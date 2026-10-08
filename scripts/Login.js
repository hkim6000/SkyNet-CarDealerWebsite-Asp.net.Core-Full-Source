var LoginJs = (function () {

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
        var s = document.querySelector('.lg-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('lg-nav').classList.add('lg-open');
        el('lg-scrim').classList.add('lg-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('lg-nav').classList.remove('lg-open');
        el('lg-scrim').classList.remove('lg-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.lg-mi');
        if (li) {
            li.classList.toggle('lg-exp');
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
            if (q === lastQ && el('lg-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Login/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('lg-sugg').classList.add('lg-open');
    }

    function closeSugg() {
        el('lg-sugg').classList.remove('lg-open');
    }

    function toast(msg) {
        var t = el('lg-toast');
        t.textContent = msg;
        t.classList.add('lg-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('lg-open');
        }, 3200);
    }

    function openModal() {
        el('lg-modal').classList.add('lg-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'lg-modal') {
            return;
        }
        el('lg-modal').classList.remove('lg-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.lg-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('lg-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('Login/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('lg-qmake') },
            { key: 'body', vlu: val('lg-qbody') },
            { key: 'price', vlu: val('lg-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('lg-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.lg-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.lg-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Login/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('lg-f-' + k);
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
        var fields = document.querySelectorAll('.lg-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.lg-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('lg-filters').classList.toggle('lg-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.lg-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('lg-act');
        }
        btn.classList.add('lg-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('Login/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('lg-down') },
            { key: 'trade', vlu: val('lg-trade') },
            { key: 'term', vlu: val('lg-term') },
            { key: 'tier', vlu: val('lg-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('lg-stock') });
        } else {
            list.push({ key: 'price', vlu: val('lg-price') });
        }
        $ApiRequest('Login/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('Login/Trade', JSON.stringify([
            { key: 'year', vlu: val('lg-tyear') },
            { key: 'body', vlu: val('lg-tbody') },
            { key: 'miles', vlu: val('lg-tmiles') },
            { key: 'cond', vlu: val('lg-tcond') }
        ]));
    }

    function useTrade(v) {
        el('lg-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('Login/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('lg-stock') },
            { key: 'date', vlu: val('lg-ddate') },
            { key: 'time', vlu: val('lg-dtime') },
            { key: 'name', vlu: val('lg-name') },
            { key: 'phone', vlu: val('lg-phone') },
            { key: 'email', vlu: val('lg-email') },
            { key: 'trade', vlu: checked('lg-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('Login/Budget', JSON.stringify([
            { key: 'budget', vlu: val('lg-budget') },
            { key: 'down', vlu: val('lg-bdown') },
            { key: 'term', vlu: val('lg-bterm') },
            { key: 'tier', vlu: val('lg-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('Login/Prequal', JSON.stringify([
            { key: 'name', vlu: val('lg-name') },
            { key: 'phone', vlu: val('lg-phone') },
            { key: 'email', vlu: val('lg-email') },
            { key: 'income', vlu: val('lg-income') },
            { key: 'housing', vlu: val('lg-housing') },
            { key: 'tier', vlu: val('lg-ptier') },
            { key: 'job', vlu: val('lg-job') },
            { key: 'consent', vlu: checked('lg-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('Login/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('lg-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('lg-open', picks.length > 0);
        el('lg-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('lg-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.lg-cmp input');
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
        $ApiRequest('Login/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('lg-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.lg-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="lg-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Login/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('lg-date') },
                { key: 'time', vlu: val('lg-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.lg-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('lg-act');
        }
        btn.classList.add('lg-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('lg-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('Login/Book', JSON.stringify([
            { key: 'year', vlu: val('lg-year') },
            { key: 'make', vlu: val('lg-make') },
            { key: 'model', vlu: val('lg-model') },
            { key: 'miles', vlu: val('lg-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('lg-notes') },
            { key: 'date', vlu: val('lg-date') },
            { key: 'time', vlu: val('lg-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('lg-advisor') },
            { key: 'name', vlu: val('lg-name') },
            { key: 'phone', vlu: val('lg-phone') },
            { key: 'email', vlu: val('lg-email') },
            { key: 'texts', vlu: checked('lg-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('lg-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.lg-main em[id^="lg-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.lg-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('Login/Parts', JSON.stringify([
            { key: 'name', vlu: val('lg-pname') },
            { key: 'email', vlu: val('lg-pemail') },
            { key: 'vehicle', vlu: val('lg-pveh') },
            { key: 'part', vlu: val('lg-part') },
            { key: 'qty', vlu: val('lg-qty') },
            { key: 'ship', vlu: val('lg-ship') }
        ]));
    }

    function partsSent() {
        el('lg-pveh').value = '';
        el('lg-part').value = '';
        el('lg-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.lg-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('lg-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.lg-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('lg-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('lg-lemail').value = 'demo@crestline.example';
        el('lg-lpass').value = 'Drive2026!';
        el('lg-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('Login/SignIn', JSON.stringify([
            { key: 'email', vlu: val('lg-lemail') },
            { key: 'password', vlu: el('lg-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('lg-account');
        a.classList.add('lg-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('Login/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('lg-cfirst') },
            { key: 'last', vlu: val('lg-clast') },
            { key: 'email', vlu: val('lg-cemail') },
            { key: 'password', vlu: el('lg-cpass').value },
            { key: 'confirm', vlu: el('lg-cpass2').value },
            { key: 'terms', vlu: checked('lg-cterms') }
        ]));
    }

    function created() {
        el('lg-cpass').value = '';
        el('lg-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('Login/Reset', JSON.stringify([{ key: 'email', vlu: val('lg-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('Login/Send', JSON.stringify([
            { key: 'name', vlu: val('lg-name') },
            { key: 'phone', vlu: val('lg-phone') },
            { key: 'email', vlu: val('lg-email') },
            { key: 'topic', vlu: val('lg-topic') },
            { key: 'message', vlu: val('lg-msg') }
        ]));
    }

    function sent() {
        var f = el('lg-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Login/Subscribe', JSON.stringify([{ key: 'email', vlu: val('lg-nl-email') }]));
    }

    function subscribed() {
        el('lg-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('lg-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'lg-tr') {
                var m = el('lg-e-transport');
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
            var h = el('lg-head');
            if (h) {
                h.classList.toggle('lg-scrolled', window.pageYOffset > 8);
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

LoginJs.reveal();
