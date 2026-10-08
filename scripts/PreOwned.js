var PreOwnedJs = (function () {

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
        var s = document.querySelector('.po-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('po-nav').classList.add('po-open');
        el('po-scrim').classList.add('po-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('po-nav').classList.remove('po-open');
        el('po-scrim').classList.remove('po-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.po-mi');
        if (li) {
            li.classList.toggle('po-exp');
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
            if (q === lastQ && el('po-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('PreOwned/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('po-sugg').classList.add('po-open');
    }

    function closeSugg() {
        el('po-sugg').classList.remove('po-open');
    }

    function toast(msg) {
        var t = el('po-toast');
        t.textContent = msg;
        t.classList.add('po-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('po-open');
        }, 3200);
    }

    function openModal() {
        el('po-modal').classList.add('po-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'po-modal') {
            return;
        }
        el('po-modal').classList.remove('po-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.po-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('po-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('PreOwned/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('po-qmake') },
            { key: 'body', vlu: val('po-qbody') },
            { key: 'price', vlu: val('po-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('po-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.po-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.po-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('PreOwned/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('po-f-' + k);
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
        var fields = document.querySelectorAll('.po-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.po-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('po-filters').classList.toggle('po-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.po-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('po-act');
        }
        btn.classList.add('po-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('PreOwned/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('po-down') },
            { key: 'trade', vlu: val('po-trade') },
            { key: 'term', vlu: val('po-term') },
            { key: 'tier', vlu: val('po-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('po-stock') });
        } else {
            list.push({ key: 'price', vlu: val('po-price') });
        }
        $ApiRequest('PreOwned/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('PreOwned/Trade', JSON.stringify([
            { key: 'year', vlu: val('po-tyear') },
            { key: 'body', vlu: val('po-tbody') },
            { key: 'miles', vlu: val('po-tmiles') },
            { key: 'cond', vlu: val('po-tcond') }
        ]));
    }

    function useTrade(v) {
        el('po-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('PreOwned/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('po-stock') },
            { key: 'date', vlu: val('po-ddate') },
            { key: 'time', vlu: val('po-dtime') },
            { key: 'name', vlu: val('po-name') },
            { key: 'phone', vlu: val('po-phone') },
            { key: 'email', vlu: val('po-email') },
            { key: 'trade', vlu: checked('po-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('PreOwned/Budget', JSON.stringify([
            { key: 'budget', vlu: val('po-budget') },
            { key: 'down', vlu: val('po-bdown') },
            { key: 'term', vlu: val('po-bterm') },
            { key: 'tier', vlu: val('po-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('PreOwned/Prequal', JSON.stringify([
            { key: 'name', vlu: val('po-name') },
            { key: 'phone', vlu: val('po-phone') },
            { key: 'email', vlu: val('po-email') },
            { key: 'income', vlu: val('po-income') },
            { key: 'housing', vlu: val('po-housing') },
            { key: 'tier', vlu: val('po-ptier') },
            { key: 'job', vlu: val('po-job') },
            { key: 'consent', vlu: checked('po-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('PreOwned/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('po-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('po-open', picks.length > 0);
        el('po-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('po-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.po-cmp input');
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
        $ApiRequest('PreOwned/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('po-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.po-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="po-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('PreOwned/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('po-date') },
                { key: 'time', vlu: val('po-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.po-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('po-act');
        }
        btn.classList.add('po-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('po-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('PreOwned/Book', JSON.stringify([
            { key: 'year', vlu: val('po-year') },
            { key: 'make', vlu: val('po-make') },
            { key: 'model', vlu: val('po-model') },
            { key: 'miles', vlu: val('po-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('po-notes') },
            { key: 'date', vlu: val('po-date') },
            { key: 'time', vlu: val('po-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('po-advisor') },
            { key: 'name', vlu: val('po-name') },
            { key: 'phone', vlu: val('po-phone') },
            { key: 'email', vlu: val('po-email') },
            { key: 'texts', vlu: checked('po-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('po-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.po-main em[id^="po-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.po-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('PreOwned/Parts', JSON.stringify([
            { key: 'name', vlu: val('po-pname') },
            { key: 'email', vlu: val('po-pemail') },
            { key: 'vehicle', vlu: val('po-pveh') },
            { key: 'part', vlu: val('po-part') },
            { key: 'qty', vlu: val('po-qty') },
            { key: 'ship', vlu: val('po-ship') }
        ]));
    }

    function partsSent() {
        el('po-pveh').value = '';
        el('po-part').value = '';
        el('po-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.po-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('po-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.po-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('po-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('po-lemail').value = 'demo@crestline.example';
        el('po-lpass').value = 'Drive2026!';
        el('po-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('PreOwned/SignIn', JSON.stringify([
            { key: 'email', vlu: val('po-lemail') },
            { key: 'password', vlu: el('po-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('po-account');
        a.classList.add('po-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('PreOwned/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('po-cfirst') },
            { key: 'last', vlu: val('po-clast') },
            { key: 'email', vlu: val('po-cemail') },
            { key: 'password', vlu: el('po-cpass').value },
            { key: 'confirm', vlu: el('po-cpass2').value },
            { key: 'terms', vlu: checked('po-cterms') }
        ]));
    }

    function created() {
        el('po-cpass').value = '';
        el('po-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('PreOwned/Reset', JSON.stringify([{ key: 'email', vlu: val('po-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('PreOwned/Send', JSON.stringify([
            { key: 'name', vlu: val('po-name') },
            { key: 'phone', vlu: val('po-phone') },
            { key: 'email', vlu: val('po-email') },
            { key: 'topic', vlu: val('po-topic') },
            { key: 'message', vlu: val('po-msg') }
        ]));
    }

    function sent() {
        var f = el('po-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('PreOwned/Subscribe', JSON.stringify([{ key: 'email', vlu: val('po-nl-email') }]));
    }

    function subscribed() {
        el('po-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('po-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'po-tr') {
                var m = el('po-e-transport');
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
            var h = el('po-head');
            if (h) {
                h.classList.toggle('po-scrolled', window.pageYOffset > 8);
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

PreOwnedJs.reveal();
