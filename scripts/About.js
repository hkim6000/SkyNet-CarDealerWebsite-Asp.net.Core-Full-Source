var AboutJs = (function () {

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
        var s = document.querySelector('.ab-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('ab-nav').classList.add('ab-open');
        el('ab-scrim').classList.add('ab-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('ab-nav').classList.remove('ab-open');
        el('ab-scrim').classList.remove('ab-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.ab-mi');
        if (li) {
            li.classList.toggle('ab-exp');
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
            if (q === lastQ && el('ab-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('About/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('ab-sugg').classList.add('ab-open');
    }

    function closeSugg() {
        el('ab-sugg').classList.remove('ab-open');
    }

    function toast(msg) {
        var t = el('ab-toast');
        t.textContent = msg;
        t.classList.add('ab-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('ab-open');
        }, 3200);
    }

    function openModal() {
        el('ab-modal').classList.add('ab-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'ab-modal') {
            return;
        }
        el('ab-modal').classList.remove('ab-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.ab-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('ab-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('About/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('ab-qmake') },
            { key: 'body', vlu: val('ab-qbody') },
            { key: 'price', vlu: val('ab-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('ab-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.ab-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.ab-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('About/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('ab-f-' + k);
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
        var fields = document.querySelectorAll('.ab-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.ab-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('ab-filters').classList.toggle('ab-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.ab-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('ab-act');
        }
        btn.classList.add('ab-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('About/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('ab-down') },
            { key: 'trade', vlu: val('ab-trade') },
            { key: 'term', vlu: val('ab-term') },
            { key: 'tier', vlu: val('ab-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('ab-stock') });
        } else {
            list.push({ key: 'price', vlu: val('ab-price') });
        }
        $ApiRequest('About/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('About/Trade', JSON.stringify([
            { key: 'year', vlu: val('ab-tyear') },
            { key: 'body', vlu: val('ab-tbody') },
            { key: 'miles', vlu: val('ab-tmiles') },
            { key: 'cond', vlu: val('ab-tcond') }
        ]));
    }

    function useTrade(v) {
        el('ab-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('About/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('ab-stock') },
            { key: 'date', vlu: val('ab-ddate') },
            { key: 'time', vlu: val('ab-dtime') },
            { key: 'name', vlu: val('ab-name') },
            { key: 'phone', vlu: val('ab-phone') },
            { key: 'email', vlu: val('ab-email') },
            { key: 'trade', vlu: checked('ab-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('About/Budget', JSON.stringify([
            { key: 'budget', vlu: val('ab-budget') },
            { key: 'down', vlu: val('ab-bdown') },
            { key: 'term', vlu: val('ab-bterm') },
            { key: 'tier', vlu: val('ab-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('About/Prequal', JSON.stringify([
            { key: 'name', vlu: val('ab-name') },
            { key: 'phone', vlu: val('ab-phone') },
            { key: 'email', vlu: val('ab-email') },
            { key: 'income', vlu: val('ab-income') },
            { key: 'housing', vlu: val('ab-housing') },
            { key: 'tier', vlu: val('ab-ptier') },
            { key: 'job', vlu: val('ab-job') },
            { key: 'consent', vlu: checked('ab-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('About/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('ab-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('ab-open', picks.length > 0);
        el('ab-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('ab-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.ab-cmp input');
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
        $ApiRequest('About/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('ab-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.ab-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="ab-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('About/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('ab-date') },
                { key: 'time', vlu: val('ab-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.ab-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('ab-act');
        }
        btn.classList.add('ab-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('ab-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('About/Book', JSON.stringify([
            { key: 'year', vlu: val('ab-year') },
            { key: 'make', vlu: val('ab-make') },
            { key: 'model', vlu: val('ab-model') },
            { key: 'miles', vlu: val('ab-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('ab-notes') },
            { key: 'date', vlu: val('ab-date') },
            { key: 'time', vlu: val('ab-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('ab-advisor') },
            { key: 'name', vlu: val('ab-name') },
            { key: 'phone', vlu: val('ab-phone') },
            { key: 'email', vlu: val('ab-email') },
            { key: 'texts', vlu: checked('ab-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('ab-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.ab-main em[id^="ab-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.ab-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('About/Parts', JSON.stringify([
            { key: 'name', vlu: val('ab-pname') },
            { key: 'email', vlu: val('ab-pemail') },
            { key: 'vehicle', vlu: val('ab-pveh') },
            { key: 'part', vlu: val('ab-part') },
            { key: 'qty', vlu: val('ab-qty') },
            { key: 'ship', vlu: val('ab-ship') }
        ]));
    }

    function partsSent() {
        el('ab-pveh').value = '';
        el('ab-part').value = '';
        el('ab-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.ab-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('ab-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.ab-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('ab-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('ab-lemail').value = 'demo@crestline.example';
        el('ab-lpass').value = 'Drive2026!';
        el('ab-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('About/SignIn', JSON.stringify([
            { key: 'email', vlu: val('ab-lemail') },
            { key: 'password', vlu: el('ab-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('ab-account');
        a.classList.add('ab-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('About/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('ab-cfirst') },
            { key: 'last', vlu: val('ab-clast') },
            { key: 'email', vlu: val('ab-cemail') },
            { key: 'password', vlu: el('ab-cpass').value },
            { key: 'confirm', vlu: el('ab-cpass2').value },
            { key: 'terms', vlu: checked('ab-cterms') }
        ]));
    }

    function created() {
        el('ab-cpass').value = '';
        el('ab-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('About/Reset', JSON.stringify([{ key: 'email', vlu: val('ab-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('About/Send', JSON.stringify([
            { key: 'name', vlu: val('ab-name') },
            { key: 'phone', vlu: val('ab-phone') },
            { key: 'email', vlu: val('ab-email') },
            { key: 'topic', vlu: val('ab-topic') },
            { key: 'message', vlu: val('ab-msg') }
        ]));
    }

    function sent() {
        var f = el('ab-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('About/Subscribe', JSON.stringify([{ key: 'email', vlu: val('ab-nl-email') }]));
    }

    function subscribed() {
        el('ab-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('ab-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'ab-tr') {
                var m = el('ab-e-transport');
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
            var h = el('ab-head');
            if (h) {
                h.classList.toggle('ab-scrolled', window.pageYOffset > 8);
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

AboutJs.reveal();
