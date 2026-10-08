var NewJs = (function () {

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
        var s = document.querySelector('.nw-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('nw-nav').classList.add('nw-open');
        el('nw-scrim').classList.add('nw-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('nw-nav').classList.remove('nw-open');
        el('nw-scrim').classList.remove('nw-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.nw-mi');
        if (li) {
            li.classList.toggle('nw-exp');
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
            if (q === lastQ && el('nw-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('New/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('nw-sugg').classList.add('nw-open');
    }

    function closeSugg() {
        el('nw-sugg').classList.remove('nw-open');
    }

    function toast(msg) {
        var t = el('nw-toast');
        t.textContent = msg;
        t.classList.add('nw-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('nw-open');
        }, 3200);
    }

    function openModal() {
        el('nw-modal').classList.add('nw-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'nw-modal') {
            return;
        }
        el('nw-modal').classList.remove('nw-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.nw-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('nw-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('New/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('nw-qmake') },
            { key: 'body', vlu: val('nw-qbody') },
            { key: 'price', vlu: val('nw-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('nw-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.nw-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.nw-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('New/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('nw-f-' + k);
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
        var fields = document.querySelectorAll('.nw-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.nw-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('nw-filters').classList.toggle('nw-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.nw-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('nw-act');
        }
        btn.classList.add('nw-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('New/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('nw-down') },
            { key: 'trade', vlu: val('nw-trade') },
            { key: 'term', vlu: val('nw-term') },
            { key: 'tier', vlu: val('nw-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('nw-stock') });
        } else {
            list.push({ key: 'price', vlu: val('nw-price') });
        }
        $ApiRequest('New/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('New/Trade', JSON.stringify([
            { key: 'year', vlu: val('nw-tyear') },
            { key: 'body', vlu: val('nw-tbody') },
            { key: 'miles', vlu: val('nw-tmiles') },
            { key: 'cond', vlu: val('nw-tcond') }
        ]));
    }

    function useTrade(v) {
        el('nw-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('New/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('nw-stock') },
            { key: 'date', vlu: val('nw-ddate') },
            { key: 'time', vlu: val('nw-dtime') },
            { key: 'name', vlu: val('nw-name') },
            { key: 'phone', vlu: val('nw-phone') },
            { key: 'email', vlu: val('nw-email') },
            { key: 'trade', vlu: checked('nw-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('New/Budget', JSON.stringify([
            { key: 'budget', vlu: val('nw-budget') },
            { key: 'down', vlu: val('nw-bdown') },
            { key: 'term', vlu: val('nw-bterm') },
            { key: 'tier', vlu: val('nw-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('New/Prequal', JSON.stringify([
            { key: 'name', vlu: val('nw-name') },
            { key: 'phone', vlu: val('nw-phone') },
            { key: 'email', vlu: val('nw-email') },
            { key: 'income', vlu: val('nw-income') },
            { key: 'housing', vlu: val('nw-housing') },
            { key: 'tier', vlu: val('nw-ptier') },
            { key: 'job', vlu: val('nw-job') },
            { key: 'consent', vlu: checked('nw-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('New/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('nw-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('nw-open', picks.length > 0);
        el('nw-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('nw-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.nw-cmp input');
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
        $ApiRequest('New/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('nw-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.nw-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="nw-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('New/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('nw-date') },
                { key: 'time', vlu: val('nw-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.nw-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('nw-act');
        }
        btn.classList.add('nw-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('nw-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('New/Book', JSON.stringify([
            { key: 'year', vlu: val('nw-year') },
            { key: 'make', vlu: val('nw-make') },
            { key: 'model', vlu: val('nw-model') },
            { key: 'miles', vlu: val('nw-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('nw-notes') },
            { key: 'date', vlu: val('nw-date') },
            { key: 'time', vlu: val('nw-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('nw-advisor') },
            { key: 'name', vlu: val('nw-name') },
            { key: 'phone', vlu: val('nw-phone') },
            { key: 'email', vlu: val('nw-email') },
            { key: 'texts', vlu: checked('nw-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('nw-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.nw-main em[id^="nw-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.nw-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('New/Parts', JSON.stringify([
            { key: 'name', vlu: val('nw-pname') },
            { key: 'email', vlu: val('nw-pemail') },
            { key: 'vehicle', vlu: val('nw-pveh') },
            { key: 'part', vlu: val('nw-part') },
            { key: 'qty', vlu: val('nw-qty') },
            { key: 'ship', vlu: val('nw-ship') }
        ]));
    }

    function partsSent() {
        el('nw-pveh').value = '';
        el('nw-part').value = '';
        el('nw-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.nw-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('nw-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.nw-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('nw-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('nw-lemail').value = 'demo@crestline.example';
        el('nw-lpass').value = 'Drive2026!';
        el('nw-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('New/SignIn', JSON.stringify([
            { key: 'email', vlu: val('nw-lemail') },
            { key: 'password', vlu: el('nw-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('nw-account');
        a.classList.add('nw-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('New/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('nw-cfirst') },
            { key: 'last', vlu: val('nw-clast') },
            { key: 'email', vlu: val('nw-cemail') },
            { key: 'password', vlu: el('nw-cpass').value },
            { key: 'confirm', vlu: el('nw-cpass2').value },
            { key: 'terms', vlu: checked('nw-cterms') }
        ]));
    }

    function created() {
        el('nw-cpass').value = '';
        el('nw-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('New/Reset', JSON.stringify([{ key: 'email', vlu: val('nw-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('New/Send', JSON.stringify([
            { key: 'name', vlu: val('nw-name') },
            { key: 'phone', vlu: val('nw-phone') },
            { key: 'email', vlu: val('nw-email') },
            { key: 'topic', vlu: val('nw-topic') },
            { key: 'message', vlu: val('nw-msg') }
        ]));
    }

    function sent() {
        var f = el('nw-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('New/Subscribe', JSON.stringify([{ key: 'email', vlu: val('nw-nl-email') }]));
    }

    function subscribed() {
        el('nw-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('nw-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'nw-tr') {
                var m = el('nw-e-transport');
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
            var h = el('nw-head');
            if (h) {
                h.classList.toggle('nw-scrolled', window.pageYOffset > 8);
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

NewJs.reveal();
