using System.Globalization;
using System.Text;
using System.Text.Json;
using CarDealer.Models;
using SkyNet;

namespace CarDealer.codes
{
    public class Specials : WebPage
    {
        public override async Task OnInitialized()
        {
            HtmlDoc.SetTitle("Specials | Crestline Motors");
            HtmlDoc.AddMetaElement("viewport", "width=device-width, initial-scale=1");
            HtmlDoc.AddMetaElement("description", "New-car finance, lease and cash offers, plus service specials.");

            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            HtmlDoc.HtmlBodyText = HtmlDoc.HtmlBodyText.Replace("{plhd_open}", StripStatus(site, DateTime.Now));
            HtmlDoc.HtmlBodyText = HtmlDoc.HtmlBodyText
                .Replace("{plhd_count}", CountText(site.Offers.Count, "offer", "offers"))
                .Replace("{plhd_grid}", OfferCards(site, site.Offers, today))
                .Replace("{plhd_service}", ServiceOfferCards(site, today))
                .Replace("{plhd_fine}", "All offers end " + EndOfMonth(today).ToString("MMMM d, yyyy", Inv) + ". APR offers are with approved credit through Crestline Financial (fictional); lease offers are for 10,000 miles a year, plus tax, title and fees. Cash offers can&rsquo;t be combined with APR or lease offers. Offers are examples for this template.");
        }

        private static readonly string[] Kinds = { "apr", "lease", "cash", "cpo" };

        public async Task<ApiResponse> Filter()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            string kind = Pick(GetDataValue("kind"), Kinds);
            List<OfferItem> list = site.Offers.Where(o => kind == string.Empty || o.Kind == kind).ToList();
            response.SetElementContents("sp-grid", OfferCards(site, list, DateTime.Today));
            response.SetElementContents("sp-count", CountText(list.Count, "offer", "offers"));
            return response;
        }

        private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

        public async Task<ApiResponse> Search()
        {
            ApiResponse response = new ApiResponse();
            string q = Clip(GetDataValue("q"));
            SiteData site = await LoadSite();
            List<string> rows = new List<string>();
            int total = 0;
            if (q.Length >= 2)
            {
                foreach (CarModel m in site.Models.Where(m => Has(LabelOf(site.Makes, m.Make) + " " + m.Name, q) || Has(LabelOf(site.Bodies, m.Body), q) || Has(LabelOf(site.Fuels, m.Fuel), q)))
                {
                    total++;
                    int n = site.Cars.Count(c => c.Model == m.Key && c.Condition == "new");
                    rows.Add(Sugg(m.Image, LabelOf(site.Makes, m.Make) + " " + m.Name, "Model · from " + Money(m.Price) + " · " + n + " new in stock", "New?model=" + m.Key));
                }
                foreach (Car c in site.Cars.Where(c => Has(Title(site, c), q) || Has(c.Stock, q) || Has(c.Color, q) || Has(LabelOf(site.Bodies, c.Body), q) || Has(LabelOf(site.Fuels, c.Fuel), q)).OrderBy(c => c.Rank))
                {
                    total++;
                    rows.Add(Sugg(c.Image, Title(site, c), (c.Condition == "new" ? "New" : c.Certified ? "Certified" : "Pre-owned") + " · " + Money(c.Price) + " · " + c.Color, "Vehicle?stock=" + c.Stock));
                }
            }
            StringBuilder sb = new StringBuilder();
            if (total == 0)
            {
                sb.Append("<div class=\"sp-sg-none\">No vehicles match &ldquo;" + HtmlEncode(q) + "&rdquo;</div>");
            }
            else
            {
                foreach (string r in rows.Take(7))
                {
                    sb.Append(r);
                }
                sb.Append("<div class=\"sp-sg-foot\">" + total + (total == 1 ? " result" : " results") + " across models and inventory</div>");
            }
            response.SetElementContents("sp-sugg", sb.ToString());
            response.ExecuteScript("SpecialsJs.openSugg();");
            return response;
        }

        public async Task<ApiResponse> Subscribe()
        {
            ApiResponse response = new ApiResponse();
            
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            if (!IsEmail(email))
            {
                response.SetElementContents("sp-nl-msg", "<span class=\"sp-err\">Please enter a valid email address.</span>");
                return response;
            }
            response.SetElementContents("sp-nl-msg", "<span class=\"sp-ok\">Thanks! Price drops and specials will go to " + HtmlEncode(email) + ". (Demo only &mdash; nothing was stored.)</span>");
            response.ExecuteScript("SpecialsJs.subscribed();");
            return response;
        }

        private static List<Car> FilterCars(SiteData site, string cond, string make, string body, string price, string fuel, string drive, string model, int year, int miles, bool certified, string sort)
        {
            IEnumerable<Car> q = site.Cars.Where(c => c.Condition == cond
                && (make == string.Empty || c.Make == make)
                && (body == string.Empty || c.Body == body)
                && (price == string.Empty || PriceOk(c.Price, price))
                && (fuel == string.Empty || c.Fuel == fuel)
                && (drive == string.Empty || c.Drive == drive)
                && (model == string.Empty || c.Model == model)
                && (year == 0 || c.Year >= year)
                && (miles == 0 || c.Miles < miles)
                && (!certified || c.Certified));
            switch (sort)
            {
                case "low":
                    return q.OrderBy(c => c.Price).ToList();
                case "high":
                    return q.OrderByDescending(c => c.Price).ToList();
                case "year":
                    return q.OrderByDescending(c => c.Year).ThenBy(c => c.Miles).ToList();
                case "miles":
                    return q.OrderBy(c => c.Miles).ToList();
                default:
                    return q.OrderBy(c => c.Status == "In stock" ? 0 : 1).ThenBy(c => c.Rank).ToList();
            }
        }

        private static List<KeyLabel> Prices(bool used)
        {
            string[][] p = used
                ? new[] { new[] { "u20", "Under $20,000" }, new[] { "20-30", "$20,000 to $30,000" }, new[] { "30-40", "$30,000 to $40,000" }, new[] { "40", "Over $40,000" } }
                : new[] { new[] { "u30", "Under $30,000" }, new[] { "30-40", "$30,000 to $40,000" }, new[] { "40-50", "$40,000 to $50,000" }, new[] { "50", "Over $50,000" } };
            return p.Select(x => new KeyLabel { Key = x[0], Label = x[1] }).ToList();
        }

        private static bool PriceOk(decimal price, string key)
        {
            int a, b;
            if (key.StartsWith("u", StringComparison.Ordinal))
            {
                return int.TryParse(key.Substring(1), NumberStyles.Integer, Inv, out a) && price < a * 1000m;
            }
            string[] p = key.Split('-');
            if (p.Length == 2 && int.TryParse(p[0], NumberStyles.Integer, Inv, out a) && int.TryParse(p[1], NumberStyles.Integer, Inv, out b))
            {
                return price >= a * 1000m && price < b * 1000m;
            }
            return int.TryParse(key, NumberStyles.Integer, Inv, out a) && price >= a * 1000m;
        }

        private static string Title(SiteData site, Car c)
        {
            return c.Year + " " + LabelOf(site.Makes, c.Make) + " " + c.Name + " " + c.Trim;
        }

        private static string CarCards(SiteData site, List<Car> list)
        {
            if (list.Count == 0)
            {
                return "<div class=\"sp-empty\">No vehicles match those filters. <button type=\"button\" class=\"sp-linkb\" onclick=\"SpecialsJs.clearAll()\">Clear all filters</button></div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (Car c in list)
            {
                bool used = c.Condition == "used";
                string badge = c.Status == "In transit" ? "<span class=\"sp-badge sp-badge-t\">In transit</span>" : used ? (c.Certified ? "<span class=\"sp-badge sp-badge-c\">Certified</span>" : string.Empty) : "<span class=\"sp-badge\">New</span>";
                sb.Append("<a class=\"sp-car\" href=\"Vehicle?stock=" + c.Stock + "\"><div class=\"sp-car-img\"><img src=\"" + c.Image + "\" alt=\"" + HtmlEncode(Title(site, c)) + "\" loading=\"lazy\">" + badge + "</div>");
                sb.Append("<div class=\"sp-car-b\"><div class=\"sp-car-y\">" + c.Year + " &middot; " + HtmlEncode(LabelOf(site.Makes, c.Make)) + "</div><h3>" + HtmlEncode(c.Name + " " + c.Trim) + "</h3>");
                sb.Append("<div class=\"sp-car-m\">" + HtmlEncode(c.Color) + " &middot; " + HtmlEncode(LabelOf(site.Drives, c.Drive)) + " &middot; " + c.Miles.ToString("#,0", Inv) + " mi</div>");
                sb.Append("<div class=\"sp-car-p\"><b>" + Money(c.Price) + "</b>" + (!used && c.Msrp > c.Price ? "<s>" + Money(c.Msrp) + "</s><small>Save " + Money(c.Msrp - c.Price) + "</small>" : string.Empty) + "</div>");
                sb.Append("<div class=\"sp-car-f\"><span>Est. " + EstMonthly(site, c) + "*</span><span>Stock " + HtmlEncode(c.Stock) + "</span></div></div></a>");
            }
            return sb.ToString();
        }

        private static decimal Apr(CreditTier tier, int term, bool used)
        {
            decimal adj = term == 36 ? -0.5m : term == 48 ? -0.25m : term == 72 ? 0.5m : 0m;
            return tier.Rate + adj + (used ? 1.0m : 0m);
        }

        private static decimal Monthly(decimal principal, decimal apr, int months)
        {
            if (principal <= 0 || months <= 0)
            {
                return 0m;
            }
            if (apr <= 0)
            {
                return Math.Round(principal / months, 2, MidpointRounding.AwayFromZero);
            }
            double r = (double)apr / 1200.0;
            double p = (double)principal * r / (1.0 - Math.Pow(1.0 + r, -months));
            return Math.Round((decimal)p, 2, MidpointRounding.AwayFromZero);
        }

        private static decimal Principal(decimal payment, decimal apr, int months)
        {
            double r = (double)apr / 1200.0;
            double pv = r == 0 ? (double)payment * months : (double)payment * (1.0 - Math.Pow(1.0 + r, -months)) / r;
            return Math.Round((decimal)pv, 2, MidpointRounding.AwayFromZero);
        }

        private static string EstMonthly(SiteData site, Car c)
        {
            CreditTier? tier = site.Tiers.FirstOrDefault();
            if (tier == null)
            {
                return string.Empty;
            }
            decimal down = Math.Round(c.Price * 0.10m, 0, MidpointRounding.AwayFromZero);
            decimal financed = c.Price + Math.Round(c.Price * site.TaxRate, 2, MidpointRounding.AwayFromZero) + site.DocFee - down;
            return Money(Math.Ceiling(Monthly(financed, Apr(tier, 72, c.Condition == "used"), 72))) + "/mo";
        }

        private static string PayFoot(SiteData site)
        {
            CreditTier? tier = site.Tiers.FirstOrDefault();
            if (tier == null)
            {
                return string.Empty;
            }
            return "*Estimated payment for 72 months with 10% down and excellent credit (" + Apr(tier, 72, false).ToString("0.0#", Inv) + "% APR new, " + Apr(tier, 72, true).ToString("0.0#", Inv) + "% pre-owned), including " + (site.TaxRate * 100m).ToString("0.#", Inv) + "% tax and fees. Example only.";
        }

        private static string PaymentHtml(SiteData site, decimal price, decimal down, decimal trade, int term, CreditTier tier, bool used, string extra)
        {
            decimal tax = Math.Round(Math.Max(0m, price - trade) * site.TaxRate, 2, MidpointRounding.AwayFromZero);
            decimal financed = price + tax + site.DocFee - down - trade;
            decimal apr = Apr(tier, term, used);
            StringBuilder sb = new StringBuilder();
            if (financed <= 0)
            {
                sb.Append("<div class=\"sp-quote-h\"><span>Estimated payment</span><b>$0</b><small>nothing left to finance</small></div>");
                return sb.Append(extra).ToString();
            }
            decimal monthly = Monthly(financed, apr, term);
            decimal totalPaid = monthly * term;
            sb.Append("<div class=\"sp-quote-h\"><span>Estimated payment</span><b>" + Money2(monthly) + "</b><small>a month for " + term + " months at " + apr.ToString("0.00", Inv) + "% APR</small></div><ul>");
            sb.Append("<li><span>Vehicle price</span><b>" + Money2(price) + "</b></li>");
            sb.Append("<li><span>Sales tax (" + (site.TaxRate * 100m).ToString("0.#", Inv) + "%" + (trade > 0 ? ", after trade-in" : string.Empty) + ")</span><b>" + Money2(tax) + "</b></li>");
            sb.Append("<li><span>Documentation fee</span><b>" + Money2(site.DocFee) + "</b></li>");
            if (down > 0)
            {
                sb.Append("<li><span>Down payment</span><b>&minus;" + Money2(down) + "</b></li>");
            }
            if (trade > 0)
            {
                sb.Append("<li><span>Trade-in</span><b>&minus;" + Money2(trade) + "</b></li>");
            }
            sb.Append("<li class=\"sp-quote-t\"><span>Amount financed</span><b>" + Money2(financed) + "</b></li>");
            sb.Append("<li><span>Total interest</span><b>" + Money2(totalPaid - financed) + "</b></li><li><span>Total of payments</span><b>" + Money2(totalPaid) + "</b></li></ul>");
            sb.Append(extra);
            sb.Append("<p>An estimate with approved credit. Your rate depends on your credit history and lender.</p>");
            return sb.ToString();
        }

        private static DateTime FirstDay(List<DayHours> hours, DateTime now, int lead)
        {
            TimeSpan close;
            if (hours.Count == 7 && hours[(int)now.DayOfWeek].Open != string.Empty && TimeSpan.TryParse(hours[(int)now.DayOfWeek].Close, Inv, out close) && now.TimeOfDay.Add(TimeSpan.FromMinutes(lead)) <= close)
            {
                return now.Date;
            }
            return now.Date.AddDays(1);
        }

        private static DateTime EndOfMonth(DateTime today)
        {
            return new DateTime(today.Year, today.Month, 1).AddMonths(1).AddDays(-1);
        }

        private static string EndsText(DateTime today)
        {
            int days = (EndOfMonth(today) - today).Days;
            return "Ends " + EndOfMonth(today).ToString("MMM d", Inv) + (days == 0 ? " &middot; last day" : " &middot; " + days + (days == 1 ? " day" : " days") + " left");
        }

        private static string OfferCards(SiteData site, List<OfferItem> list, DateTime today)
        {
            if (list.Count == 0)
            {
                return "<div class=\"sp-empty\">No offers in this group right now.</div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (OfferItem o in list)
            {
                CarModel? m = site.Models.FirstOrDefault(x => x.Key == o.Model);
                string who = m == null ? "Certified pre-owned" : LabelOf(site.Makes, m.Make) + " " + m.Name;
                int n = m == null ? site.Cars.Count(c => c.Certified) : site.Cars.Count(c => c.Model == m.Key && c.Condition == "new");
                string href = m == null ? "PreOwned?certified=1" : "New?model=" + m.Key;
                string tag = o.Kind == "apr" ? "Low APR" : o.Kind == "lease" ? "Lease" : o.Kind == "cash" ? "Cash off" : "Pre-owned";
                sb.Append("<article class=\"sp-offer\"><div class=\"sp-offer-img\"><img src=\"" + o.Image + "\" alt=\"" + HtmlEncode(who) + "\" loading=\"lazy\"><span class=\"sp-ends\">" + EndsText(today) + "</span></div>");
                sb.Append("<div class=\"sp-offer-b\"><div class=\"sp-eyebrow\">" + tag + " &middot; " + HtmlEncode(who) + "</div><h3>" + HtmlEncode(o.Title) + "</h3><p>" + HtmlEncode(o.Text) + "</p>");
                sb.Append("<div class=\"sp-offer-f\"><span>" + n + " in stock</span><a href=\"" + href + "\">Shop now &rarr;</a></div></div></article>");
            }
            return sb.ToString();
        }

        private static string ServiceOfferCards(SiteData site, DateTime today)
        {
            StringBuilder sb = new StringBuilder();
            foreach (ServiceOffer o in site.ServiceOffers)
            {
                sb.Append("<div class=\"sp-soffer\"><b>" + HtmlEncode(o.Price) + "</b><h3>" + HtmlEncode(o.Title) + "</h3><p>" + HtmlEncode(o.Text) + "</p><small>Ends " + EndOfMonth(today).ToString("MMM d", Inv) + "</small><a href=\"Service?svc=" + o.Service + "#book\">Book this &rarr;</a></div>");
            }
            return sb.ToString();
        }

        private static string StripStatus(SiteData site, DateTime now)
        {
            return "<span class=\"sp-strip-st\">Sales &middot; " + HoursStatus(site.SalesHours, now) + "</span>";
        }

        private static string HoursStatus(List<DayHours> hours, DateTime now)
        {
            if (hours.Count != 7)
            {
                return string.Empty;
            }
            DayHours h = hours[(int)now.DayOfWeek];
            TimeSpan open, close;
            if (h.Open != string.Empty && TimeSpan.TryParse(h.Open, Inv, out open) && TimeSpan.TryParse(h.Close, Inv, out close))
            {
                TimeSpan t = now.TimeOfDay;
                if (t < open)
                {
                    return "<span class=\"sp-dot sp-dot-on\"></span>Opens today at " + TimeText(open);
                }
                if (t < close)
                {
                    return "<span class=\"sp-dot sp-dot-on\"></span>Open now &middot; until " + TimeText(close);
                }
            }
            for (int i = 1; i <= 7; i++)
            {
                DateTime d = now.Date.AddDays(i);
                DayHours n = hours[(int)d.DayOfWeek];
                if (n.Open != string.Empty)
                {
                    return "<span class=\"sp-dot\"></span>Closed &middot; opens " + (i == 1 ? "tomorrow" : d.ToString("dddd", Inv)) + " at " + TimeText(n.Open);
                }
            }
            return string.Empty;
        }

        private static string TimeText(string hhmm)
        {
            TimeSpan t;
            return TimeSpan.TryParse(hhmm, Inv, out t) ? TimeText(t) : hhmm;
        }

        private static string TimeText(TimeSpan t)
        {
            int h = t.Hours % 12 == 0 ? 12 : t.Hours % 12;
            return h + ":" + t.Minutes.ToString("00", Inv) + (t.Hours < 12 ? " am" : " pm");
        }

        private static string DateOptions(List<DayHours> hours, DateTime start, int days, DateTime today)
        {
            StringBuilder sb = new StringBuilder();
            bool picked = false;
            for (int i = 0; i < days; i++)
            {
                DateTime d = start.AddDays(i);
                bool closed = hours.Count == 7 && hours[(int)d.DayOfWeek].Open == string.Empty;
                string label = (d == today ? "Today, " : d == today.AddDays(1) ? "Tomorrow, " : d.ToString("ddd, ", Inv)) + d.ToString("MMM d", Inv) + (closed ? " · closed" : string.Empty);
                bool sel = !closed && !picked;
                picked = picked || sel;
                sb.Append("<option value=\"" + d.ToString("yyyy-MM-dd", Inv) + "\"" + (closed ? " disabled" : string.Empty) + (sel ? " selected" : string.Empty) + ">" + label + "</option>");
            }
            return sb.ToString();
        }

        private static bool ParseDate(string? v, out DateTime date)
        {
            return DateTime.TryParseExact((v ?? string.Empty).Trim(), "yyyy-MM-dd", Inv, DateTimeStyles.None, out date);
        }

        private static string Options(List<KeyLabel> items, string selected, string any)
        {
            StringBuilder sb = new StringBuilder("<option value=\"\">" + HtmlEncode(any) + "</option>");
            foreach (KeyLabel k in items)
            {
                sb.Append("<option value=\"" + k.Key + "\"" + (k.Key == selected ? " selected" : string.Empty) + ">" + HtmlEncode(k.Label) + "</option>");
            }
            return sb.ToString();
        }

        private static string Chips(List<KeyLabel> items, string active, string all)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<button type=\"button\" class=\"sp-chip" + (active == string.Empty ? " sp-act" : string.Empty) + "\" onclick=\"SpecialsJs.chip(this, '')\">" + HtmlEncode(all) + "</button>");
            foreach (KeyLabel k in items)
            {
                sb.Append("<button type=\"button\" class=\"sp-chip" + (k.Key == active ? " sp-act" : string.Empty) + "\" onclick=\"SpecialsJs.chip(this, '" + k.Key + "')\">" + HtmlEncode(k.Label) + "</button>");
            }
            return sb.ToString();
        }

        private static uint Hash(string s)
        {
            uint h = 2166136261;
            foreach (char c in s)
            {
                h ^= c;
                h *= 16777619;
            }
            return h;
        }

        private static string Code(string prefix, string seed)
        {
            const string abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            uint h = Hash(seed);
            StringBuilder sb = new StringBuilder(prefix + "-");
            for (int i = 0; i < 6; i++)
            {
                sb.Append(abc[(int)(h % (uint)abc.Length)]);
                h = h / (uint)abc.Length + Hash(seed + i) % 7919;
            }
            return sb.ToString();
        }

        private static string Sugg(string img, string title, string sub, string href)
        {
            return "<a class=\"sp-sg\" href=\"" + href + "\"><img src=\"" + img + "\" alt=\"\"><span><b>" + HtmlEncode(title) + "</b><small>" + HtmlEncode(sub) + "</small></span></a>";
        }

        private async Task<SiteData> LoadSite()
        {
            string file = Path.Combine(DataPath ?? string.Empty, "site.json");
            if (!File.Exists(file))
            {
                file = Path.Combine(Directory.GetCurrentDirectory(), "data", "site.json");
            }
            if (!File.Exists(file))
            {
                return new SiteData();
            }
            string json = await File.ReadAllTextAsync(file);
            JsonSerializerOptions options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<SiteData>(json, options) ?? new SiteData();
        }

        private static string Clip(string? value)
        {
            string q = (value ?? string.Empty).Trim();
            return q.Length > 40 ? q.Substring(0, 40) : q;
        }

        private static string Pick(string? value, IEnumerable<string> allowed)
        {
            string v = (value ?? string.Empty).Trim().ToLowerInvariant();
            return allowed.Contains(v) ? v : string.Empty;
        }

        private static int Bound(string? value, int min, int max)
        {
            int v;
            return int.TryParse((value ?? string.Empty).Trim(), NumberStyles.Integer, Inv, out v) && v >= min && v <= max ? v : 0;
        }

        private static decimal Dec(string? value)
        {
            decimal v;
            return decimal.TryParse((value ?? string.Empty).Trim(), NumberStyles.Number, Inv, out v) ? Math.Round(v, 2, MidpointRounding.AwayFromZero) : -1m;
        }

        private static bool Has(string text, string q)
        {
            return (text ?? string.Empty).Contains(q, StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsEmail(string v)
        {
            if (v.Length < 5 || v.Length > 80 || v.Contains(' '))
            {
                return false;
            }
            int at = v.IndexOf('@');
            int dot = v.LastIndexOf('.');
            return at > 0 && at == v.LastIndexOf('@') && dot > at + 1 && dot < v.Length - 1;
        }

        private static bool IsPhone(string v)
        {
            string digits = new string(v.Where(char.IsDigit).ToArray());
            return digits.Length == 10 || (digits.Length == 11 && digits[0] == '1');
        }

        private static string Money(decimal v)
        {
            return "$" + (v == Math.Floor(v) ? v.ToString("#,0", Inv) : v.ToString("#,0.00", Inv));
        }

        private static string Money2(decimal v)
        {
            return "$" + v.ToString("#,0.00", Inv);
        }

        private static string CountText(int n, string one, string many)
        {
            return n + " " + (n == 1 ? one : many);
        }

        private static string LabelOf(List<KeyLabel> list, string key)
        {
            return list.Where(x => x.Key == key).Select(x => x.Label).FirstOrDefault() ?? key;
        }
    }
}
