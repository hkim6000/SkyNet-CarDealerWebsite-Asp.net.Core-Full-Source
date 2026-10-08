var VehicleJs = (function () {

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
        var s = document.querySelector('.vh-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('vh-nav').classList.add('vh-open');
        el('vh-scrim').classList.add('vh-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('vh-nav').classList.remove('vh-open');
        el('vh-scrim').classList.remove('vh-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.vh-mi');
        if (li) {
            li.classList.toggle('vh-exp');
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
            if (q === lastQ && el('vh-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Vehicle/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('vh-sugg').classList.add('vh-open');
    }

    function closeSugg() {
        el('vh-sugg').classList.remove('vh-open');
    }

    function toast(msg) {
        var t = el('vh-toast');
        t.textContent = msg;
        t.classList.add('vh-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('vh-open');
        }, 3200);
    }

    function openModal() {
        el('vh-modal').classList.add('vh-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'vh-modal') {
            return;
        }
        el('vh-modal').classList.remove('vh-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.vh-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('vh-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('Vehicle/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('vh-qmake') },
            { key: 'body', vlu: val('vh-qbody') },
            { key: 'price', vlu: val('vh-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('vh-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.vh-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.vh-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Vehicle/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('vh-f-' + k);
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
        var fields = document.querySelectorAll('.vh-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.vh-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('vh-filters').classList.toggle('vh-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.vh-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('vh-act');
        }
        btn.classList.add('vh-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('Vehicle/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('vh-down') },
            { key: 'trade', vlu: val('vh-trade') },
            { key: 'term', vlu: val('vh-term') },
            { key: 'tier', vlu: val('vh-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('vh-stock') });
        } else {
            list.push({ key: 'price', vlu: val('vh-price') });
        }
        $ApiRequest('Vehicle/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('Vehicle/Trade', JSON.stringify([
            { key: 'year', vlu: val('vh-tyear') },
            { key: 'body', vlu: val('vh-tbody') },
            { key: 'miles', vlu: val('vh-tmiles') },
            { key: 'cond', vlu: val('vh-tcond') }
        ]));
    }

    function useTrade(v) {
        el('vh-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('Vehicle/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('vh-stock') },
            { key: 'date', vlu: val('vh-ddate') },
            { key: 'time', vlu: val('vh-dtime') },
            { key: 'name', vlu: val('vh-name') },
            { key: 'phone', vlu: val('vh-phone') },
            { key: 'email', vlu: val('vh-email') },
            { key: 'trade', vlu: checked('vh-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('Vehicle/Budget', JSON.stringify([
            { key: 'budget', vlu: val('vh-budget') },
            { key: 'down', vlu: val('vh-bdown') },
            { key: 'term', vlu: val('vh-bterm') },
            { key: 'tier', vlu: val('vh-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('Vehicle/Prequal', JSON.stringify([
            { key: 'name', vlu: val('vh-name') },
            { key: 'phone', vlu: val('vh-phone') },
            { key: 'email', vlu: val('vh-email') },
            { key: 'income', vlu: val('vh-income') },
            { key: 'housing', vlu: val('vh-housing') },
            { key: 'tier', vlu: val('vh-ptier') },
            { key: 'job', vlu: val('vh-job') },
            { key: 'consent', vlu: checked('vh-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('Vehicle/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('vh-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('vh-open', picks.length > 0);
        el('vh-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('vh-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.vh-cmp input');
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
        $ApiRequest('Vehicle/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('vh-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.vh-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="vh-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Vehicle/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('vh-date') },
                { key: 'time', vlu: val('vh-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.vh-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('vh-act');
        }
        btn.classList.add('vh-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('vh-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('Vehicle/Book', JSON.stringify([
            { key: 'year', vlu: val('vh-year') },
            { key: 'make', vlu: val('vh-make') },
            { key: 'model', vlu: val('vh-model') },
            { key: 'miles', vlu: val('vh-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('vh-notes') },
            { key: 'date', vlu: val('vh-date') },
            { key: 'time', vlu: val('vh-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('vh-advisor') },
            { key: 'name', vlu: val('vh-name') },
            { key: 'phone', vlu: val('vh-phone') },
            { key: 'email', vlu: val('vh-email') },
            { key: 'texts', vlu: checked('vh-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('vh-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.vh-main em[id^="vh-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.vh-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('Vehicle/Parts', JSON.stringify([
            { key: 'name', vlu: val('vh-pname') },
            { key: 'email', vlu: val('vh-pemail') },
            { key: 'vehicle', vlu: val('vh-pveh') },
            { key: 'part', vlu: val('vh-part') },
            { key: 'qty', vlu: val('vh-qty') },
            { key: 'ship', vlu: val('vh-ship') }
        ]));
    }

    function partsSent() {
        el('vh-pveh').value = '';
        el('vh-part').value = '';
        el('vh-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.vh-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('vh-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.vh-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('vh-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('vh-lemail').value = 'demo@crestline.example';
        el('vh-lpass').value = 'Drive2026!';
        el('vh-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('Vehicle/SignIn', JSON.stringify([
            { key: 'email', vlu: val('vh-lemail') },
            { key: 'password', vlu: el('vh-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('vh-account');
        a.classList.add('vh-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('Vehicle/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('vh-cfirst') },
            { key: 'last', vlu: val('vh-clast') },
            { key: 'email', vlu: val('vh-cemail') },
            { key: 'password', vlu: el('vh-cpass').value },
            { key: 'confirm', vlu: el('vh-cpass2').value },
            { key: 'terms', vlu: checked('vh-cterms') }
        ]));
    }

    function created() {
        el('vh-cpass').value = '';
        el('vh-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('Vehicle/Reset', JSON.stringify([{ key: 'email', vlu: val('vh-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('Vehicle/Send', JSON.stringify([
            { key: 'name', vlu: val('vh-name') },
            { key: 'phone', vlu: val('vh-phone') },
            { key: 'email', vlu: val('vh-email') },
            { key: 'topic', vlu: val('vh-topic') },
            { key: 'message', vlu: val('vh-msg') }
        ]));
    }

    function sent() {
        var f = el('vh-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Vehicle/Subscribe', JSON.stringify([{ key: 'email', vlu: val('vh-nl-email') }]));
    }

    function subscribed() {
        el('vh-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('vh-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'vh-tr') {
                var m = el('vh-e-transport');
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
            var h = el('vh-head');
            if (h) {
                h.classList.toggle('vh-scrolled', window.pageYOffset > 8);
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

VehicleJs.reveal();
