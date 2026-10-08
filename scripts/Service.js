var ServiceJs = (function () {

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
        var s = document.querySelector('.sv-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('sv-nav').classList.add('sv-open');
        el('sv-scrim').classList.add('sv-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('sv-nav').classList.remove('sv-open');
        el('sv-scrim').classList.remove('sv-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.sv-mi');
        if (li) {
            li.classList.toggle('sv-exp');
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
            if (q === lastQ && el('sv-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Service/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('sv-sugg').classList.add('sv-open');
    }

    function closeSugg() {
        el('sv-sugg').classList.remove('sv-open');
    }

    function toast(msg) {
        var t = el('sv-toast');
        t.textContent = msg;
        t.classList.add('sv-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('sv-open');
        }, 3200);
    }

    function openModal() {
        el('sv-modal').classList.add('sv-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'sv-modal') {
            return;
        }
        el('sv-modal').classList.remove('sv-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.sv-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('sv-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('Service/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('sv-qmake') },
            { key: 'body', vlu: val('sv-qbody') },
            { key: 'price', vlu: val('sv-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('sv-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.sv-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.sv-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Service/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('sv-f-' + k);
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
        var fields = document.querySelectorAll('.sv-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.sv-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('sv-filters').classList.toggle('sv-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.sv-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('sv-act');
        }
        btn.classList.add('sv-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('Service/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('sv-down') },
            { key: 'trade', vlu: val('sv-trade') },
            { key: 'term', vlu: val('sv-term') },
            { key: 'tier', vlu: val('sv-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('sv-stock') });
        } else {
            list.push({ key: 'price', vlu: val('sv-price') });
        }
        $ApiRequest('Service/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('Service/Trade', JSON.stringify([
            { key: 'year', vlu: val('sv-tyear') },
            { key: 'body', vlu: val('sv-tbody') },
            { key: 'miles', vlu: val('sv-tmiles') },
            { key: 'cond', vlu: val('sv-tcond') }
        ]));
    }

    function useTrade(v) {
        el('sv-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('Service/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('sv-stock') },
            { key: 'date', vlu: val('sv-ddate') },
            { key: 'time', vlu: val('sv-dtime') },
            { key: 'name', vlu: val('sv-name') },
            { key: 'phone', vlu: val('sv-phone') },
            { key: 'email', vlu: val('sv-email') },
            { key: 'trade', vlu: checked('sv-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('Service/Budget', JSON.stringify([
            { key: 'budget', vlu: val('sv-budget') },
            { key: 'down', vlu: val('sv-bdown') },
            { key: 'term', vlu: val('sv-bterm') },
            { key: 'tier', vlu: val('sv-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('Service/Prequal', JSON.stringify([
            { key: 'name', vlu: val('sv-name') },
            { key: 'phone', vlu: val('sv-phone') },
            { key: 'email', vlu: val('sv-email') },
            { key: 'income', vlu: val('sv-income') },
            { key: 'housing', vlu: val('sv-housing') },
            { key: 'tier', vlu: val('sv-ptier') },
            { key: 'job', vlu: val('sv-job') },
            { key: 'consent', vlu: checked('sv-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('Service/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('sv-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('sv-open', picks.length > 0);
        el('sv-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('sv-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.sv-cmp input');
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
        $ApiRequest('Service/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('sv-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.sv-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="sv-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Service/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('sv-date') },
                { key: 'time', vlu: val('sv-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.sv-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('sv-act');
        }
        btn.classList.add('sv-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('sv-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('Service/Book', JSON.stringify([
            { key: 'year', vlu: val('sv-year') },
            { key: 'make', vlu: val('sv-make') },
            { key: 'model', vlu: val('sv-model') },
            { key: 'miles', vlu: val('sv-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('sv-notes') },
            { key: 'date', vlu: val('sv-date') },
            { key: 'time', vlu: val('sv-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('sv-advisor') },
            { key: 'name', vlu: val('sv-name') },
            { key: 'phone', vlu: val('sv-phone') },
            { key: 'email', vlu: val('sv-email') },
            { key: 'texts', vlu: checked('sv-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('sv-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.sv-main em[id^="sv-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.sv-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('Service/Parts', JSON.stringify([
            { key: 'name', vlu: val('sv-pname') },
            { key: 'email', vlu: val('sv-pemail') },
            { key: 'vehicle', vlu: val('sv-pveh') },
            { key: 'part', vlu: val('sv-part') },
            { key: 'qty', vlu: val('sv-qty') },
            { key: 'ship', vlu: val('sv-ship') }
        ]));
    }

    function partsSent() {
        el('sv-pveh').value = '';
        el('sv-part').value = '';
        el('sv-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.sv-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('sv-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.sv-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('sv-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('sv-lemail').value = 'demo@crestline.example';
        el('sv-lpass').value = 'Drive2026!';
        el('sv-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('Service/SignIn', JSON.stringify([
            { key: 'email', vlu: val('sv-lemail') },
            { key: 'password', vlu: el('sv-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('sv-account');
        a.classList.add('sv-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('Service/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('sv-cfirst') },
            { key: 'last', vlu: val('sv-clast') },
            { key: 'email', vlu: val('sv-cemail') },
            { key: 'password', vlu: el('sv-cpass').value },
            { key: 'confirm', vlu: el('sv-cpass2').value },
            { key: 'terms', vlu: checked('sv-cterms') }
        ]));
    }

    function created() {
        el('sv-cpass').value = '';
        el('sv-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('Service/Reset', JSON.stringify([{ key: 'email', vlu: val('sv-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('Service/Send', JSON.stringify([
            { key: 'name', vlu: val('sv-name') },
            { key: 'phone', vlu: val('sv-phone') },
            { key: 'email', vlu: val('sv-email') },
            { key: 'topic', vlu: val('sv-topic') },
            { key: 'message', vlu: val('sv-msg') }
        ]));
    }

    function sent() {
        var f = el('sv-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Service/Subscribe', JSON.stringify([{ key: 'email', vlu: val('sv-nl-email') }]));
    }

    function subscribed() {
        el('sv-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('sv-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'sv-tr') {
                var m = el('sv-e-transport');
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
            var h = el('sv-head');
            if (h) {
                h.classList.toggle('sv-scrolled', window.pageYOffset > 8);
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

ServiceJs.reveal();
