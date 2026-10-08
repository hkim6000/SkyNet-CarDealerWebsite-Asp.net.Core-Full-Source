var HomeJs = (function () {

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
        var s = document.querySelector('.hm-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('hm-nav').classList.add('hm-open');
        el('hm-scrim').classList.add('hm-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('hm-nav').classList.remove('hm-open');
        el('hm-scrim').classList.remove('hm-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.hm-mi');
        if (li) {
            li.classList.toggle('hm-exp');
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
            if (q === lastQ && el('hm-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Home/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('hm-sugg').classList.add('hm-open');
    }

    function closeSugg() {
        el('hm-sugg').classList.remove('hm-open');
    }

    function toast(msg) {
        var t = el('hm-toast');
        t.textContent = msg;
        t.classList.add('hm-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('hm-open');
        }, 3200);
    }

    function openModal() {
        el('hm-modal').classList.add('hm-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'hm-modal') {
            return;
        }
        el('hm-modal').classList.remove('hm-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.hm-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('hm-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('Home/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('hm-qmake') },
            { key: 'body', vlu: val('hm-qbody') },
            { key: 'price', vlu: val('hm-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('hm-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.hm-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.hm-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Home/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('hm-f-' + k);
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
        var fields = document.querySelectorAll('.hm-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.hm-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('hm-filters').classList.toggle('hm-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.hm-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('hm-act');
        }
        btn.classList.add('hm-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('Home/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('hm-down') },
            { key: 'trade', vlu: val('hm-trade') },
            { key: 'term', vlu: val('hm-term') },
            { key: 'tier', vlu: val('hm-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('hm-stock') });
        } else {
            list.push({ key: 'price', vlu: val('hm-price') });
        }
        $ApiRequest('Home/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('Home/Trade', JSON.stringify([
            { key: 'year', vlu: val('hm-tyear') },
            { key: 'body', vlu: val('hm-tbody') },
            { key: 'miles', vlu: val('hm-tmiles') },
            { key: 'cond', vlu: val('hm-tcond') }
        ]));
    }

    function useTrade(v) {
        el('hm-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('Home/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('hm-stock') },
            { key: 'date', vlu: val('hm-ddate') },
            { key: 'time', vlu: val('hm-dtime') },
            { key: 'name', vlu: val('hm-name') },
            { key: 'phone', vlu: val('hm-phone') },
            { key: 'email', vlu: val('hm-email') },
            { key: 'trade', vlu: checked('hm-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('Home/Budget', JSON.stringify([
            { key: 'budget', vlu: val('hm-budget') },
            { key: 'down', vlu: val('hm-bdown') },
            { key: 'term', vlu: val('hm-bterm') },
            { key: 'tier', vlu: val('hm-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('Home/Prequal', JSON.stringify([
            { key: 'name', vlu: val('hm-name') },
            { key: 'phone', vlu: val('hm-phone') },
            { key: 'email', vlu: val('hm-email') },
            { key: 'income', vlu: val('hm-income') },
            { key: 'housing', vlu: val('hm-housing') },
            { key: 'tier', vlu: val('hm-ptier') },
            { key: 'job', vlu: val('hm-job') },
            { key: 'consent', vlu: checked('hm-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('Home/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('hm-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('hm-open', picks.length > 0);
        el('hm-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('hm-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.hm-cmp input');
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
        $ApiRequest('Home/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('hm-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.hm-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="hm-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Home/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('hm-date') },
                { key: 'time', vlu: val('hm-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.hm-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('hm-act');
        }
        btn.classList.add('hm-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('hm-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('Home/Book', JSON.stringify([
            { key: 'year', vlu: val('hm-year') },
            { key: 'make', vlu: val('hm-make') },
            { key: 'model', vlu: val('hm-model') },
            { key: 'miles', vlu: val('hm-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('hm-notes') },
            { key: 'date', vlu: val('hm-date') },
            { key: 'time', vlu: val('hm-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('hm-advisor') },
            { key: 'name', vlu: val('hm-name') },
            { key: 'phone', vlu: val('hm-phone') },
            { key: 'email', vlu: val('hm-email') },
            { key: 'texts', vlu: checked('hm-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('hm-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.hm-main em[id^="hm-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.hm-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('Home/Parts', JSON.stringify([
            { key: 'name', vlu: val('hm-pname') },
            { key: 'email', vlu: val('hm-pemail') },
            { key: 'vehicle', vlu: val('hm-pveh') },
            { key: 'part', vlu: val('hm-part') },
            { key: 'qty', vlu: val('hm-qty') },
            { key: 'ship', vlu: val('hm-ship') }
        ]));
    }

    function partsSent() {
        el('hm-pveh').value = '';
        el('hm-part').value = '';
        el('hm-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.hm-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('hm-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.hm-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('hm-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('hm-lemail').value = 'demo@crestline.example';
        el('hm-lpass').value = 'Drive2026!';
        el('hm-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('Home/SignIn', JSON.stringify([
            { key: 'email', vlu: val('hm-lemail') },
            { key: 'password', vlu: el('hm-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('hm-account');
        a.classList.add('hm-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('Home/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('hm-cfirst') },
            { key: 'last', vlu: val('hm-clast') },
            { key: 'email', vlu: val('hm-cemail') },
            { key: 'password', vlu: el('hm-cpass').value },
            { key: 'confirm', vlu: el('hm-cpass2').value },
            { key: 'terms', vlu: checked('hm-cterms') }
        ]));
    }

    function created() {
        el('hm-cpass').value = '';
        el('hm-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('Home/Reset', JSON.stringify([{ key: 'email', vlu: val('hm-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('Home/Send', JSON.stringify([
            { key: 'name', vlu: val('hm-name') },
            { key: 'phone', vlu: val('hm-phone') },
            { key: 'email', vlu: val('hm-email') },
            { key: 'topic', vlu: val('hm-topic') },
            { key: 'message', vlu: val('hm-msg') }
        ]));
    }

    function sent() {
        var f = el('hm-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Home/Subscribe', JSON.stringify([{ key: 'email', vlu: val('hm-nl-email') }]));
    }

    function subscribed() {
        el('hm-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('hm-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'hm-tr') {
                var m = el('hm-e-transport');
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
            var h = el('hm-head');
            if (h) {
                h.classList.toggle('hm-scrolled', window.pageYOffset > 8);
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

HomeJs.reveal();
