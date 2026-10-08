var ContactJs = (function () {

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
        var s = document.querySelector('.co-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('co-nav').classList.add('co-open');
        el('co-scrim').classList.add('co-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('co-nav').classList.remove('co-open');
        el('co-scrim').classList.remove('co-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.co-mi');
        if (li) {
            li.classList.toggle('co-exp');
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
            if (q === lastQ && el('co-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Contact/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('co-sugg').classList.add('co-open');
    }

    function closeSugg() {
        el('co-sugg').classList.remove('co-open');
    }

    function toast(msg) {
        var t = el('co-toast');
        t.textContent = msg;
        t.classList.add('co-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('co-open');
        }, 3200);
    }

    function openModal() {
        el('co-modal').classList.add('co-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'co-modal') {
            return;
        }
        el('co-modal').classList.remove('co-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.co-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('co-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('Contact/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('co-qmake') },
            { key: 'body', vlu: val('co-qbody') },
            { key: 'price', vlu: val('co-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('co-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.co-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.co-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Contact/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('co-f-' + k);
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
        var fields = document.querySelectorAll('.co-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.co-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('co-filters').classList.toggle('co-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.co-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('co-act');
        }
        btn.classList.add('co-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('Contact/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('co-down') },
            { key: 'trade', vlu: val('co-trade') },
            { key: 'term', vlu: val('co-term') },
            { key: 'tier', vlu: val('co-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('co-stock') });
        } else {
            list.push({ key: 'price', vlu: val('co-price') });
        }
        $ApiRequest('Contact/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('Contact/Trade', JSON.stringify([
            { key: 'year', vlu: val('co-tyear') },
            { key: 'body', vlu: val('co-tbody') },
            { key: 'miles', vlu: val('co-tmiles') },
            { key: 'cond', vlu: val('co-tcond') }
        ]));
    }

    function useTrade(v) {
        el('co-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('Contact/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('co-stock') },
            { key: 'date', vlu: val('co-ddate') },
            { key: 'time', vlu: val('co-dtime') },
            { key: 'name', vlu: val('co-name') },
            { key: 'phone', vlu: val('co-phone') },
            { key: 'email', vlu: val('co-email') },
            { key: 'trade', vlu: checked('co-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('Contact/Budget', JSON.stringify([
            { key: 'budget', vlu: val('co-budget') },
            { key: 'down', vlu: val('co-bdown') },
            { key: 'term', vlu: val('co-bterm') },
            { key: 'tier', vlu: val('co-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('Contact/Prequal', JSON.stringify([
            { key: 'name', vlu: val('co-name') },
            { key: 'phone', vlu: val('co-phone') },
            { key: 'email', vlu: val('co-email') },
            { key: 'income', vlu: val('co-income') },
            { key: 'housing', vlu: val('co-housing') },
            { key: 'tier', vlu: val('co-ptier') },
            { key: 'job', vlu: val('co-job') },
            { key: 'consent', vlu: checked('co-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('Contact/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('co-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('co-open', picks.length > 0);
        el('co-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('co-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.co-cmp input');
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
        $ApiRequest('Contact/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('co-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.co-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="co-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Contact/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('co-date') },
                { key: 'time', vlu: val('co-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.co-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('co-act');
        }
        btn.classList.add('co-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('co-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('Contact/Book', JSON.stringify([
            { key: 'year', vlu: val('co-year') },
            { key: 'make', vlu: val('co-make') },
            { key: 'model', vlu: val('co-model') },
            { key: 'miles', vlu: val('co-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('co-notes') },
            { key: 'date', vlu: val('co-date') },
            { key: 'time', vlu: val('co-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('co-advisor') },
            { key: 'name', vlu: val('co-name') },
            { key: 'phone', vlu: val('co-phone') },
            { key: 'email', vlu: val('co-email') },
            { key: 'texts', vlu: checked('co-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('co-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.co-main em[id^="co-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.co-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('Contact/Parts', JSON.stringify([
            { key: 'name', vlu: val('co-pname') },
            { key: 'email', vlu: val('co-pemail') },
            { key: 'vehicle', vlu: val('co-pveh') },
            { key: 'part', vlu: val('co-part') },
            { key: 'qty', vlu: val('co-qty') },
            { key: 'ship', vlu: val('co-ship') }
        ]));
    }

    function partsSent() {
        el('co-pveh').value = '';
        el('co-part').value = '';
        el('co-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.co-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('co-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.co-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('co-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('co-lemail').value = 'demo@crestline.example';
        el('co-lpass').value = 'Drive2026!';
        el('co-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('Contact/SignIn', JSON.stringify([
            { key: 'email', vlu: val('co-lemail') },
            { key: 'password', vlu: el('co-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('co-account');
        a.classList.add('co-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('Contact/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('co-cfirst') },
            { key: 'last', vlu: val('co-clast') },
            { key: 'email', vlu: val('co-cemail') },
            { key: 'password', vlu: el('co-cpass').value },
            { key: 'confirm', vlu: el('co-cpass2').value },
            { key: 'terms', vlu: checked('co-cterms') }
        ]));
    }

    function created() {
        el('co-cpass').value = '';
        el('co-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('Contact/Reset', JSON.stringify([{ key: 'email', vlu: val('co-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('Contact/Send', JSON.stringify([
            { key: 'name', vlu: val('co-name') },
            { key: 'phone', vlu: val('co-phone') },
            { key: 'email', vlu: val('co-email') },
            { key: 'topic', vlu: val('co-topic') },
            { key: 'message', vlu: val('co-msg') }
        ]));
    }

    function sent() {
        var f = el('co-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Contact/Subscribe', JSON.stringify([{ key: 'email', vlu: val('co-nl-email') }]));
    }

    function subscribed() {
        el('co-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('co-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'co-tr') {
                var m = el('co-e-transport');
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
            var h = el('co-head');
            if (h) {
                h.classList.toggle('co-scrolled', window.pageYOffset > 8);
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

ContactJs.reveal();
