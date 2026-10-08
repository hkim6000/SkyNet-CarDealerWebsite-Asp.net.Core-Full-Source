var SpecialsJs = (function () {

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
        var s = document.querySelector('.sp-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('sp-nav').classList.add('sp-open');
        el('sp-scrim').classList.add('sp-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('sp-nav').classList.remove('sp-open');
        el('sp-scrim').classList.remove('sp-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.sp-mi');
        if (li) {
            li.classList.toggle('sp-exp');
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
            if (q === lastQ && el('sp-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Specials/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('sp-sugg').classList.add('sp-open');
    }

    function closeSugg() {
        el('sp-sugg').classList.remove('sp-open');
    }

    function toast(msg) {
        var t = el('sp-toast');
        t.textContent = msg;
        t.classList.add('sp-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('sp-open');
        }, 3200);
    }

    function openModal() {
        el('sp-modal').classList.add('sp-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'sp-modal') {
            return;
        }
        el('sp-modal').classList.remove('sp-open');
        document.body.style.overflow = '';
    }

    function cond(c) {
        quickCond = c;
        var b = document.querySelectorAll('.sp-seg-b[data-c]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('sp-act', b[i].getAttribute('data-c') === c);
        }
        quick(true);
    }

    function quick(swap) {
        $ApiRequest('Specials/Quick', JSON.stringify([
            { key: 'cond', vlu: quickCond },
            { key: 'make', vlu: val('sp-qmake') },
            { key: 'body', vlu: val('sp-qbody') },
            { key: 'price', vlu: val('sp-qprice') },
            { key: 'swap', vlu: swap === true ? '1' : '' }
        ]));
    }

    function quickHref(h) {
        el('sp-qgo').setAttribute('href', h);
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.sp-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        var boxes = document.querySelectorAll('.sp-fc');
        for (var j = 0; j < boxes.length; j++) {
            list.push({ key: boxes[j].getAttribute('data-k'), vlu: boxes[j].checked ? '1' : '' });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Specials/Filter', JSON.stringify(values()));
    }

    function clearF(k) {
        var f = el('sp-f-' + k);
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
        var fields = document.querySelectorAll('.sp-fv');
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getAttribute('data-k') !== 'sort') {
                fields[i].value = '';
            }
        }
        var boxes = document.querySelectorAll('.sp-fc');
        for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
        }
        filter();
    }

    function toggleFilters() {
        el('sp-filters').classList.toggle('sp-open');
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.sp-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('sp-act');
        }
        btn.classList.add('sp-act');
        var k = page() === 'Research' ? 'make' : 'kind';
        $ApiRequest('Specials/Filter', JSON.stringify([{ key: k, vlu: value }]));
    }

    function payment() {
        var list = [
            { key: 'down', vlu: val('sp-down') },
            { key: 'trade', vlu: val('sp-trade') },
            { key: 'term', vlu: val('sp-term') },
            { key: 'tier', vlu: val('sp-tier') }
        ];
        if (page() === 'Vehicle') {
            list.push({ key: 'stock', vlu: val('sp-stock') });
        } else {
            list.push({ key: 'price', vlu: val('sp-price') });
        }
        $ApiRequest('Specials/Payment', JSON.stringify(list));
    }

    function trade() {
        $ApiRequest('Specials/Trade', JSON.stringify([
            { key: 'year', vlu: val('sp-tyear') },
            { key: 'body', vlu: val('sp-tbody') },
            { key: 'miles', vlu: val('sp-tmiles') },
            { key: 'cond', vlu: val('sp-tcond') }
        ]));
    }

    function useTrade(v) {
        el('sp-trade').value = v;
        payment();
        el('payment').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function testDrive() {
        $WaitOn();
        $ApiRequest('Specials/TestDrive', JSON.stringify([
            { key: 'stock', vlu: val('sp-stock') },
            { key: 'date', vlu: val('sp-ddate') },
            { key: 'time', vlu: val('sp-dtime') },
            { key: 'name', vlu: val('sp-name') },
            { key: 'phone', vlu: val('sp-phone') },
            { key: 'email', vlu: val('sp-email') },
            { key: 'trade', vlu: checked('sp-dtrade') }
        ]));
    }

    function budget() {
        $ApiRequest('Specials/Budget', JSON.stringify([
            { key: 'budget', vlu: val('sp-budget') },
            { key: 'down', vlu: val('sp-bdown') },
            { key: 'term', vlu: val('sp-bterm') },
            { key: 'tier', vlu: val('sp-btier') }
        ]));
    }

    function prequal() {
        $WaitOn();
        $ApiRequest('Specials/Prequal', JSON.stringify([
            { key: 'name', vlu: val('sp-name') },
            { key: 'phone', vlu: val('sp-phone') },
            { key: 'email', vlu: val('sp-email') },
            { key: 'income', vlu: val('sp-income') },
            { key: 'housing', vlu: val('sp-housing') },
            { key: 'tier', vlu: val('sp-ptier') },
            { key: 'job', vlu: val('sp-job') },
            { key: 'consent', vlu: checked('sp-consent') }
        ]));
    }

    function view(key) {
        $ApiRequest('Specials/View', JSON.stringify([{ key: 'key', vlu: key }]));
    }

    function tray() {
        var t = el('sp-tray');
        if (!t) {
            return;
        }
        t.classList.toggle('sp-open', picks.length > 0);
        el('sp-tray-t').textContent = picks.length === 0 ? 'Choose up to 3 models to compare' : picks.length + (picks.length === 1 ? ' model selected · pick one more' : ' models selected');
        el('sp-tray-b').disabled = picks.length < 2;
    }

    function syncCompare() {
        var boxes = document.querySelectorAll('.sp-cmp input');
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
        $ApiRequest('Specials/Compare', JSON.stringify([{ key: 'keys', vlu: picks.join('.') }]));
    }

    function toCompare() {
        el('compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearCompare() {
        picks = [];
        syncCompare();
        el('sp-compare').innerHTML = '';
    }

    function services() {
        var list = [];
        var boxes = document.querySelectorAll('.sp-svcb:checked');
        for (var i = 0; i < boxes.length; i++) {
            list.push(boxes[i].value);
        }
        return list.join('.');
    }

    function transportValue() {
        var r = document.querySelector('input[name="sp-tr"]:checked');
        return r ? r.value : '';
    }

    function plan() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Specials/Slots', JSON.stringify([
                { key: 'services', vlu: services() },
                { key: 'date', vlu: val('sp-date') },
                { key: 'time', vlu: val('sp-time') },
                { key: 'transport', vlu: transportValue() }
            ]));
        }, 160);
    }

    function pickSlot(btn) {
        var t = document.querySelectorAll('.sp-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('sp-act');
        }
        btn.classList.add('sp-act');
        slot(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
    }

    function slot(time, label) {
        var h = el('sp-time');
        if (h) {
            h.value = time || '';
            h.setAttribute('data-l', label || '');
        }
    }

    function bookService() {
        $WaitOn();
        $ApiRequest('Specials/Book', JSON.stringify([
            { key: 'year', vlu: val('sp-year') },
            { key: 'make', vlu: val('sp-make') },
            { key: 'model', vlu: val('sp-model') },
            { key: 'miles', vlu: val('sp-miles') },
            { key: 'services', vlu: services() },
            { key: 'notes', vlu: val('sp-notes') },
            { key: 'date', vlu: val('sp-date') },
            { key: 'time', vlu: val('sp-time') },
            { key: 'transport', vlu: transportValue() },
            { key: 'advisor', vlu: val('sp-advisor') },
            { key: 'name', vlu: val('sp-name') },
            { key: 'phone', vlu: val('sp-phone') },
            { key: 'email', vlu: val('sp-email') },
            { key: 'texts', vlu: checked('sp-texts') }
        ]));
    }

    function book() {
        bookService();
    }

    function booked() {
        var d = el('sp-done');
        if (d) {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function firstError() {
        var e = document.querySelectorAll('.sp-main em[id^="sp-e-"]');
        for (var i = 0; i < e.length; i++) {
            if (e[i].textContent.trim() !== '') {
                var box = e[i].closest('.sp-form') || e[i];
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    function parts() {
        $WaitOn();
        $ApiRequest('Specials/Parts', JSON.stringify([
            { key: 'name', vlu: val('sp-pname') },
            { key: 'email', vlu: val('sp-pemail') },
            { key: 'vehicle', vlu: val('sp-pveh') },
            { key: 'part', vlu: val('sp-part') },
            { key: 'qty', vlu: val('sp-qty') },
            { key: 'ship', vlu: val('sp-ship') }
        ]));
    }

    function partsSent() {
        el('sp-pveh').value = '';
        el('sp-part').value = '';
        el('sp-qty').value = '1';
    }

    function tab(t) {
        var tabs = document.querySelectorAll('.sp-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('sp-act', tabs[i].getAttribute('data-t') === t);
        }
        var panes = document.querySelectorAll('.sp-pane');
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('sp-hide', panes[j].getAttribute('data-p') !== t);
        }
    }

    function demo() {
        tab('signin');
        el('sp-lemail').value = 'demo@crestline.example';
        el('sp-lpass').value = 'Drive2026!';
        el('sp-lpass').focus();
    }

    function login() {
        $WaitOn();
        $ApiRequest('Specials/SignIn', JSON.stringify([
            { key: 'email', vlu: val('sp-lemail') },
            { key: 'password', vlu: el('sp-lpass').value }
        ]));
    }

    function signedIn() {
        var a = el('sp-account');
        a.classList.add('sp-in');
        a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function signOut() {
        window.location.reload();
    }

    function create() {
        $ApiRequest('Specials/CreateAccount', JSON.stringify([
            { key: 'first', vlu: val('sp-cfirst') },
            { key: 'last', vlu: val('sp-clast') },
            { key: 'email', vlu: val('sp-cemail') },
            { key: 'password', vlu: el('sp-cpass').value },
            { key: 'confirm', vlu: el('sp-cpass2').value },
            { key: 'terms', vlu: checked('sp-cterms') }
        ]));
    }

    function created() {
        el('sp-cpass').value = '';
        el('sp-cpass2').value = '';
    }

    function reset() {
        $ApiRequest('Specials/Reset', JSON.stringify([{ key: 'email', vlu: val('sp-remail') }]));
    }

    function send() {
        $WaitOn();
        $ApiRequest('Specials/Send', JSON.stringify([
            { key: 'name', vlu: val('sp-name') },
            { key: 'phone', vlu: val('sp-phone') },
            { key: 'email', vlu: val('sp-email') },
            { key: 'topic', vlu: val('sp-topic') },
            { key: 'message', vlu: val('sp-msg') }
        ]));
    }

    function sent() {
        var f = el('sp-form') || el('drive');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Specials/Subscribe', JSON.stringify([{ key: 'email', vlu: val('sp-nl-email') }]));
    }

    function subscribed() {
        el('sp-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('sp-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'sp-tr') {
                var m = el('sp-e-transport');
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
            var h = el('sp-head');
            if (h) {
                h.classList.toggle('sp-scrolled', window.pageYOffset > 8);
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

SpecialsJs.reveal();
