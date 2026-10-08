var ResearchJs = (function () {

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
        var s = document.querySelector('.rs-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('rs-nav').classList.add('rs-open');
        el('rs-scrim').classList.add('rs-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('rs-nav').classList.remove('rs-open');
        el('rs-scrim').classList.remove('rs-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.rs-mi');
        if (li) {
            li.classList.toggle('rs-exp');
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
            if (q === lastQ && el('rs-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Research/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('rs-sugg').classList.add('rs-open');
    }

    function closeSugg() {
        el('rs-sugg').classList.remove('rs-open');
    }

    function toast(msg) {
        var t = el('rs-toast');
        t.textContent = msg;
        t.classList.add('rs-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('rs-open');
        }, 3200);
    }

    function openModal() {
        el('rs-modal').classList.add('rs-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'rs-modal') {
            return;
        }
        el('rs-modal').classList.remove('rs-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.rs-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('rs-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('Research/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('rs-qmake') },
            { key: 'body', vlu: val('rs-qbody') },
            { key: 'price', vlu: val('rs-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('rs-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.rs-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.rs-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Research/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('rs-f-' + k);
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
        var fields = document.querySelectorAll('.rs-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.rs-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('rs-filters').classList.toggle('rs-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.rs-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('rs-act');
        }
        btn.classList.add('rs-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('Research/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('rs-down') },
            { key: 'trade', vlu: val('rs-trade') },
            { key: 'term', vlu: val('rs-term') },
            { key: 'tier', vlu: val('rs-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('rs-stock') });
        } else {
            list.push({ key: 'price', vlu: val('rs-price') });
        }
        $ApiRequest('Research/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('Research/Trade', JSON.stringify([
            { key: 'year', vlu: val('rs-tyear') },
            { key: 'body', vlu: val('rs-tbody') },
            { key: 'miles', vlu: val('rs-tmiles') },
            { key: 'cond', vlu: val('rs-tcond') }
        ]));
    }

    function useTrade(v) {
        el('rs-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('Research/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('rs-stock') },
            { key: 'date', vlu: val('rs-ddate') },
            { key: 'time', vlu: val('rs-dtime') },
            { key: 'name', vlu: val('rs-name') },
            { key: 'phone', vlu: val('rs-phone') },
            { key: 'email', vlu: val('rs-email') },
            { key: 'trade', vlu: checked('rs-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('Research/Budget', JSON.stringify([
            { key: 'budget', vlu: val('rs-budget') },
            { key: 'down', vlu: val('rs-bdown') },
            { key: 'term', vlu: val('rs-bterm') },
            { key: 'tier', vlu: val('rs-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('Research/Prequal', JSON.stringify([
            { key: 'name', vlu: val('rs-name') },
            { key: 'phone', vlu: val('rs-phone') },
            { key: 'email', vlu: val('rs-email') },
            { key: 'income', vlu: val('rs-income') },
            { key: 'housing', vlu: val('rs-housing') },
            { key: 'tier', vlu: val('rs-ptier') },
            { key: 'job', vlu: val('rs-job') },
            { key: 'consent', vlu: checked('rs-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('Research/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('rs-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('rs-open', picks.length > 0);
        el('rs-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('rs-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.rs-cmp input');
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
        $ApiRequest('Research/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('rs-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.rs-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="rs-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Research/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('rs-date') },
                { key: 'time', vlu: val('rs-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.rs-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('rs-act');
        }
        btn.classList.add('rs-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('rs-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('Research/Book', JSON.stringify([
            { key: 'year', vlu: val('rs-year') },
            { key: 'make', vlu: val('rs-make') },
            { key: 'model', vlu: val('rs-model') },
            { key: 'miles', vlu: val('rs-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('rs-notes') },
            { key: 'date', vlu: val('rs-date') },
            { key: 'time', vlu: val('rs-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('rs-advisor') },
            { key: 'name', vlu: val('rs-name') },
            { key: 'phone', vlu: val('rs-phone') },
            { key: 'email', vlu: val('rs-email') },
            { key: 'texts', vlu: checked('rs-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('rs-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.rs-main em[id^="rs-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.rs-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('Research/Parts', JSON.stringify([
            { key: 'name', vlu: val('rs-pname') },
            { key: 'email', vlu: val('rs-pemail') },
            { key: 'vehicle', vlu: val('rs-pveh') },
            { key: 'part', vlu: val('rs-part') },
            { key: 'qty', vlu: val('rs-qty') },
            { key: 'ship', vlu: val('rs-ship') }
        ]));
    }

    function partsSent() {
        el('rs-pveh').value = '';
        el('rs-part').value = '';
        el('rs-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.rs-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('rs-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.rs-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('rs-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('rs-lemail').value = 'demo@crestline.example';
        el('rs-lpass').value = 'Drive2026!';
        el('rs-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('Research/SignIn', JSON.stringify([
            { key: 'email', vlu: val('rs-lemail') },
            { key: 'password', vlu: el('rs-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('rs-account');
        a.classList.add('rs-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('Research/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('rs-cfirst') },
            { key: 'last', vlu: val('rs-clast') },
            { key: 'email', vlu: val('rs-cemail') },
            { key: 'password', vlu: el('rs-cpass').value },
            { key: 'confirm', vlu: el('rs-cpass2').value },
            { key: 'terms', vlu: checked('rs-cterms') }
        ]));
    }

    function created() {
        el('rs-cpass').value = '';
        el('rs-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('Research/Reset', JSON.stringify([{ key: 'email', vlu: val('rs-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('Research/Send', JSON.stringify([
            { key: 'name', vlu: val('rs-name') },
            { key: 'phone', vlu: val('rs-phone') },
            { key: 'email', vlu: val('rs-email') },
            { key: 'topic', vlu: val('rs-topic') },
            { key: 'message', vlu: val('rs-msg') }
        ]));
    }

    function sent() {
        var f = el('rs-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Research/Subscribe', JSON.stringify([{ key: 'email', vlu: val('rs-nl-email') }]));
    }

    function subscribed() {
        el('rs-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('rs-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'rs-tr') {
                var m = el('rs-e-transport');
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
            var h = el('rs-head');
            if (h) {
                h.classList.toggle('rs-scrolled', window.pageYOffset > 8);
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

ResearchJs.reveal();
