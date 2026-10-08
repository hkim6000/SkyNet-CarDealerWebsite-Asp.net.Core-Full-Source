using System.Globalization;
using System.Text;
using System.Text.Json;
using CarDealer.Models;
using SkyNet;

namespace CarDealer.codes
{
    public class Vehicle : WebPage
    {
        public override async Task OnInitialized()
        {
            HtmlDoc.SetTitle("Vehicle details | Crestline Motors");
            HtmlDoc.AddMetaElement("viewport", "width=device-width, initial-scale=1");
            HtmlDoc.AddMetaElement("description", "Price, specifications, payment estimate and test drive request.");

            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            HtmlDoc.HtmlBodyText = HtmlDoc.HtmlBodyText.Replace("{plhd_open}", StripStatus(site, DateTime.Now));
            string stock = (QueryValue("stock") ?? string.Empty).Trim().ToUpperInvariant();
            Car? c = site.Cars.FirstOrDefault(x => x.Stock == stock);
            string body = HtmlDoc.HtmlBodyText;
            if (c == null)
            {
                int a = body.IndexOf("{plhd_vstart}", StringComparison.Ordinal);
                int b = body.IndexOf("{plhd_vend}", StringComparison.Ordinal);
                if (a >= 0 && b > a)
                {
                    List<Car> other = site.Cars.Where(x => x.Status == "In stock").OrderBy(x => x.Rank).Take(3).ToList();
                    body = body.Substring(0, a) + "<div class=\"vh-wrap\"><div class=\"vh-missing\"><div class=\"vh-eyebrow\">Stock " + HtmlEncode(stock == string.Empty ? "number missing" : stock) + "</div><h1>We couldn&rsquo;t find that vehicle</h1><p>It may have just been sold. Browse what&rsquo;s on the lot today.</p>"
                        + "<div class=\"vh-vd-btns\"><a class=\"vh-btn\" href=\"New\">New inventory</a><a class=\"vh-btn vh-btn-o\" href=\"PreOwned\">Pre-owned</a></div></div><div class=\"vh-cars vh-cars-3\">" + CarCards(site, other) + "</div></div>" + body.Substring(b + "{plhd_vend}".Length);
                }
                HtmlDoc.HtmlBodyText = body.Replace("{plhd_crumb}", "Vehicle not found");
                return;
            }
            bool used = c.Condition == "used";
            string title = Title(site, c);
            string[] eco = (c.Economy ?? string.Empty).Split(' ', 2);
            StringBuilder quick = new StringBuilder();
            quick.Append("<div><b>" + c.Hp + "</b><span>horsepower</span></div>");
            quick.Append("<div><b>" + HtmlEncode(eco[0]) + "</b><span>" + HtmlEncode(eco.Length > 1 ? eco[1] : string.Empty) + "</span></div>");
            quick.Append("<div><b>" + c.Seats + "</b><span>seats</span></div>");
            quick.Append("<div><b>" + HtmlEncode(LabelOf(site.Drives, c.Drive)) + "</b><span>drivetrain</span></div>");
            StringBuilder specs = new StringBuilder();
            Spec(specs, "Condition", used ? (c.Certified ? "Certified pre-owned" : "Pre-owned") : "New");
            Spec(specs, "Make &amp; model", HtmlEncode(LabelOf(site.Makes, c.Make) + " " + c.Name));
            Spec(specs, "Trim", HtmlEncode(c.Trim));
            Spec(specs, "Year", c.Year.ToString(Inv));
            Spec(specs, "Body style", HtmlEncode(LabelOf(site.Bodies, c.Body)));
            Spec(specs, "Exterior color", HtmlEncode(c.Color));
            Spec(specs, "Fuel", HtmlEncode(LabelOf(site.Fuels, c.Fuel)));
            Spec(specs, "Drivetrain", HtmlEncode(LabelOf(site.Drives, c.Drive)));
            Spec(specs, "Horsepower", c.Hp + " hp");
            Spec(specs, c.Fuel == "electric" ? "Range" : "Fuel economy", HtmlEncode(c.Economy ?? string.Empty));
            Spec(specs, "Seats", c.Seats.ToString(Inv));
            Spec(specs, c.Body == "truck" ? "Bed length" : "Cargo space", HtmlEncode(c.Cargo));
            Spec(specs, "Mileage", c.Miles.ToString("#,0", Inv) + " mi");
            Spec(specs, "VIN", "<code>" + HtmlEncode(c.Vin) + "</code>");
            Spec(specs, "Stock number", HtmlEncode(c.Stock));
            StringBuilder feats = new StringBuilder();
            foreach (string f in c.Features)
            {
                feats.Append("<li>" + HtmlEncode(f) + "</li>");
            }
            string history = "<div class=\"vh-hist\"><div class=\"vh-mtitle\">Included with every new vehicle</div><ul><li>4-year/50,000-mile factory warranty</li><li>24/7 roadside assistance</li><li>First two oil changes free</li><li>A full tank and a delivery walk-through</li></ul></div>";
            if (used)
            {
                history = "<div class=\"vh-hist\"><div class=\"vh-mtitle\">Vehicle history</div><ul><li>" + CountText(c.Owners, "previous owner", "previous owners") + "</li><li>" + (c.Accidents == 0 ? "No accidents reported" : CountText(c.Accidents, "minor accident", "minor accidents") + " reported, repaired") + "</li><li>172-point inspection passed</li><li>" + (c.Certified ? "7-year/100,000-mile powertrain warranty" : "7-day / 500-mile exchange") + "</li></ul></div>";
            }
            string flag = c.Status == "In transit" ? "<span class=\"vh-badge vh-badge-t\">In transit &middot; arrives in about 10 days</span>" : used ? (c.Certified ? "<span class=\"vh-badge vh-badge-c\">Certified pre-owned</span>" : string.Empty) : "<span class=\"vh-badge\">New</span>";
            StringBuilder box = new StringBuilder();
            box.Append("<div class=\"vh-pbox-l\"><span>Crestline price</span><b>" + Money(c.Price) + "</b></div><ul>");
            if (!used && c.Msrp > c.Price)
            {
                box.Append("<li><span>MSRP</span><s>" + Money(c.Msrp) + "</s></li><li class=\"vh-save\"><span>Crestline discount</span><b>&minus;" + Money(c.Msrp - c.Price) + "</b></li>");
            }
            else
            {
                box.Append("<li><span>Mileage</span><b>" + c.Miles.ToString("#,0", Inv) + " mi</b></li><li><span>Owners</span><b>" + c.Owners + "</b></li>");
            }
            box.Append("</ul><div class=\"vh-pbox-m\">Est. <b>" + EstMonthly(site, c) + "</b>* <a href=\"#payment\">Customize &rarr;</a></div>");
            string perk = used ? (c.Certified ? "7-year/100,000-mile powertrain warranty" : "172-point inspection and a 7-day exchange") : "Full factory warranty: 4 years/50,000 miles";
            CreditTier tier = site.Tiers.FirstOrDefault(t => t.Key == "good") ?? site.Tiers.First();
            decimal down = Math.Round(c.Price * 0.10m / 500m, 0, MidpointRounding.AwayFromZero) * 500m;
            DateTime first = c.Status == "In transit" ? today.AddDays(10) : FirstDay(site.SalesHours, DateTime.Now, 90);
            List<Car> similar = site.Cars.Where(x => x.Stock != c.Stock && x.Body == c.Body).OrderBy(x => x.Condition == c.Condition ? 0 : 1).ThenBy(x => Math.Abs(x.Price - c.Price)).Take(3).ToList();
            string list = used ? "PreOwned" : "New";
            HtmlDoc.HtmlBodyText = body
                .Replace("{plhd_vstart}", string.Empty)
                .Replace("{plhd_vend}", string.Empty)
                .Replace("{plhd_crumb}", "<a href=\"" + list + "\">" + (used ? "Pre-Owned" : "New Inventory") + "</a><span>/</span>" + HtmlEncode(title))
                .Replace("{plhd_image}", c.Image)
                .Replace("{plhd_alt}", HtmlEncode(title))
                .Replace("{plhd_flag}", flag)
                .Replace("{plhd_quickspecs}", quick.ToString())
                .Replace("{plhd_eyebrow}", (used ? (c.Certified ? "Certified pre-owned" : "Pre-owned") : "New") + " &middot; Stock " + HtmlEncode(c.Stock))
                .Replace("{plhd_title}", HtmlEncode(title))
                .Replace("{plhd_sub}", HtmlEncode(c.Color) + " &middot; " + HtmlEncode(LabelOf(site.Drives, c.Drive)) + " &middot; " + HtmlEncode(LabelOf(site.Fuels, c.Fuel)) + " &middot; " + c.Miles.ToString("#,0", Inv) + " miles")
                .Replace("{plhd_pricebox}", box.ToString())
                .Replace("{plhd_perk}", perk)
                .Replace("{plhd_specs}", specs.ToString())
                .Replace("{plhd_features}", feats.ToString())
                .Replace("{plhd_history}", history)
                .Replace("{plhd_stock}", HtmlEncode(c.Stock))
                .Replace("{plhd_down}", down.ToString("0", Inv))
                .Replace("{plhd_pay}", PaymentHtml(site, c.Price, down, 0m, 60, tier, used, string.Empty))
                .Replace("{plhd_dates}", DateOptions(site.SalesHours, first, 14, today))
                .Replace("{plhd_morehref}", list + "?body=" + c.Body)
                .Replace("{plhd_similar}", CarCards(site, similar));
        }

        public async Task<ApiResponse> Payment()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            Car? c = site.Cars.FirstOrDefault(x => x.Stock == (GetDataValue("stock") ?? string.Empty).Trim());
            if (c == null)
            {
                return response;
            }
            decimal down = Dec(GetDataValue("down"));
            decimal trade = Dec(GetDataValue("trade"));
            int term = Bound(GetDataValue("term"), 12, 96);
            CreditTier? tier = site.Tiers.FirstOrDefault(t => t.Key == (GetDataValue("tier") ?? string.Empty).Trim());
            string err = down < 0 || trade < 0 ? "Please enter amounts of $0 or more." : down + trade > c.Price ? "Down payment and trade-in can&rsquo;t be more than the price." : !site.Terms.Contains(term) || tier == null ? "Please choose a term and credit range." : string.Empty;
            if (err != string.Empty)
            {
                response.SetElementContents("vh-pay", "<div class=\"vh-quote-e\">" + err + "</div>");
                return response;
            }
            response.SetElementContents("vh-pay", PaymentHtml(site, c.Price, down, trade, term, tier!, c.Condition == "used", string.Empty));
            return response;
        }

        private static readonly Dictionary<string, decimal> TradeBase = new Dictionary<string, decimal>
        {
            { "sedan", 33000m }, { "coupe", 44000m }, { "hatch", 25000m }, { "crossover", 36000m }, { "suv", 46000m }, { "truck", 49000m }
        };

        private static readonly Dictionary<string, decimal> TradeCond = new Dictionary<string, decimal>
        {
            { "excellent", 1.08m }, { "good", 1.0m }, { "fair", 0.86m }, { "rough", 0.7m }
        };

        public async Task<ApiResponse> Trade()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            int year = Bound(GetDataValue("year"), 2000, today.Year + 1);
            string body = Pick(GetDataValue("body"), TradeBase.Keys);
            string cond = Pick(GetDataValue("cond"), TradeCond.Keys);
            string m = (GetDataValue("miles") ?? string.Empty).Trim();
            int miles;
            bool okMiles = int.TryParse(m, NumberStyles.Integer, Inv, out miles) && miles >= 0 && miles <= 400000;
            response.SetElementContents("vh-e-tmiles", okMiles ? string.Empty : "Please enter mileage from 0 to 400,000.");
            if (!okMiles || year == 0 || body == string.Empty || cond == string.Empty)
            {
                response.SetElementContents("vh-tres", string.Empty);
                return response;
            }
            int age = Math.Max(0, today.Year - year);
            decimal value = TradeBase[body] * (decimal)Math.Pow(0.86, age);
            int expected = Math.Max(1, age) * 12000;
            value -= (miles - expected) * 0.06m;
            value *= TradeCond[cond];
            value = Math.Max(500m, value);
            decimal low = Math.Max(500m, Math.Round(value * 0.94m / 100m, 0, MidpointRounding.AwayFromZero) * 100m);
            decimal high = Math.Round(value * 1.06m / 100m, 0, MidpointRounding.AwayFromZero) * 100m;
            decimal mid = Math.Round((low + high) / 200m, 0, MidpointRounding.AwayFromZero) * 100m;
            StringBuilder sb = new StringBuilder();
            sb.Append("<div class=\"vh-tres-h\"><span>Estimated trade-in value</span><b>" + Money(low) + " &ndash; " + Money(high) + "</b></div>");
            sb.Append("<p>A " + year + " " + HtmlEncode(LabelOf(site.Bodies, body).ToLowerInvariant()) + " with " + miles.ToString("#,0", Inv) + " miles in " + cond + " condition. Bring it in for a firm offer in about 30 minutes.</p>");
            sb.Append("<button type=\"button\" class=\"vh-linkb\" onclick=\"VehicleJs.useTrade('" + mid.ToString("0", Inv) + "')\">Use " + Money(mid) + " in my payment &rarr;</button>");
            response.SetElementContents("vh-tres", sb.ToString());
            return response;
        }

        public async Task<ApiResponse> TestDrive()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            DateTime now = DateTime.Now;
            Car? c = site.Cars.FirstOrDefault(x => x.Stock == (GetDataValue("stock") ?? string.Empty).Trim());
            if (c == null)
            {
                return response;
            }
            DateTime first = c.Status == "In transit" ? today.AddDays(10) : FirstDay(site.SalesHours, now, 60);
            DateTime date;
            TimeSpan time;
            string name = (GetDataValue("name") ?? string.Empty).Trim();
            string phone = (GetDataValue("phone") ?? string.Empty).Trim();
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            bool trade = GetDataValue("trade") == "1";
            string eDate = string.Empty;
            string eTime = string.Empty;
            DayHours? h = null;
            if (!ParseDate(GetDataValue("date"), out date) || date < first || date > first.AddDays(13))
            {
                eDate = c.Status == "In transit" ? "This car arrives in about 10 days. Please choose " + first.ToString("MMM d", Inv) + " or later." : "Please choose a day in the next two weeks.";
            }
            else
            {
                h = site.SalesHours.Count == 7 ? site.SalesHours[(int)date.DayOfWeek] : null;
                if (h == null || h.Open == string.Empty)
                {
                    eDate = "We&rsquo;re closed that day. Please choose another.";
                }
            }
            if (!TimeSpan.TryParseExact((GetDataValue("time") ?? string.Empty).Trim(), @"hh\:mm", Inv, out time) || time.Minutes % 30 != 0)
            {
                eTime = "Please choose a time.";
            }
            else if (h != null && eDate == string.Empty)
            {
                TimeSpan open = TimeSpan.Parse(h.Open, Inv);
                TimeSpan close = TimeSpan.Parse(h.Close, Inv);
                if (time < open || time > close.Subtract(TimeSpan.FromMinutes(30)))
                {
                    eTime = "Sales is open " + TimeText(open) + " to " + TimeText(close) + " that day.";
                }
                else if (date.Add(time) < now.AddHours(1))
                {
                    eTime = "Please choose a time at least an hour from now.";
                }
            }
            string eName = name.Length < 2 || name.Length > 60 ? "Please tell us your name." : string.Empty;
            string ePhone = !IsPhone(phone) ? "Please enter a 10-digit phone number." : string.Empty;
            string eEmail = !IsEmail(email) ? "Please enter a valid email address." : string.Empty;
            response.SetElementContents("vh-e-ddate", eDate);
            response.SetElementContents("vh-e-dtime", eTime);
            response.SetElementContents("vh-e-name", eName);
            response.SetElementContents("vh-e-phone", ePhone);
            response.SetElementContents("vh-e-email", eEmail);
            if (eDate + eTime + eName + ePhone + eEmail != string.Empty)
            {
                response.SetElementContents("vh-sent", string.Empty);
                return response;
            }
            string code = Code("TD", c.Stock + date.ToString("yyyyMMdd", Inv) + time + email);
            response.SetElementContents("vh-sent", "<b>Test drive requested, " + HtmlEncode(name.Split(' ')[0]) + ".</b> " + HtmlEncode(Title(site, c)) + " &middot; " + date.ToString("dddd, MMMM d", Inv) + " at " + TimeText(time) + ". Confirmation " + code + ". We&rsquo;ll have the car ready" + (trade ? " and an appraiser on hand for your trade-in" : string.Empty) + ". <small>Demo only: no appointment was made and the car is not held.</small>");
            response.ExecuteScript("VehicleJs.sent();");
            return response;
        }

        private static void Spec(StringBuilder sb, string label, string value)
        {
            sb.Append("<tr><th>" + label + "</th><td>" + value + "</td></tr>");
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
                sb.Append("<div class=\"vh-sg-none\">No vehicles match &ldquo;" + HtmlEncode(q) + "&rdquo;</div>");
            }
            else
            {
                foreach (string r in rows.Take(7))
                {
                    sb.Append(r);
                }
                sb.Append("<div class=\"vh-sg-foot\">" + total + (total == 1 ? " result" : " results") + " across models and inventory</div>");
            }
            response.SetElementContents("vh-sugg", sb.ToString());
            response.ExecuteScript("VehicleJs.openSugg();");
            return response;
        }

        public async Task<ApiResponse> Subscribe()
        {
            ApiResponse response = new ApiResponse();
            await Task.CompletedTask;
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            if (!IsEmail(email))
            {
                response.SetElementContents("vh-nl-msg", "<span class=\"vh-err\">Please enter a valid email address.</span>");
                return response;
            }
            response.SetElementContents("vh-nl-msg", "<span class=\"vh-ok\">Thanks! Price drops and specials will go to " + HtmlEncode(email) + ". (Demo only &mdash; nothing was stored.)</span>");
            response.ExecuteScript("VehicleJs.subscribed();");
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
                return "<div class=\"vh-empty\">No vehicles match those filters. <button type=\"button\" class=\"vh-linkb\" onclick=\"VehicleJs.clearAll()\">Clear all filters</button></div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (Car c in list)
            {
                bool used = c.Condition == "used";
                string badge = c.Status == "In transit" ? "<span class=\"vh-badge vh-badge-t\">In transit</span>" : used ? (c.Certified ? "<span class=\"vh-badge vh-badge-c\">Certified</span>" : string.Empty) : "<span class=\"vh-badge\">New</span>";
                sb.Append("<a class=\"vh-car\" href=\"Vehicle?stock=" + c.Stock + "\"><div class=\"vh-car-img\"><img src=\"" + c.Image + "\" alt=\"" + HtmlEncode(Title(site, c)) + "\" loading=\"lazy\">" + badge + "</div>");
                sb.Append("<div class=\"vh-car-b\"><div class=\"vh-car-y\">" + c.Year + " &middot; " + HtmlEncode(LabelOf(site.Makes, c.Make)) + "</div><h3>" + HtmlEncode(c.Name + " " + c.Trim) + "</h3>");
                sb.Append("<div class=\"vh-car-m\">" + HtmlEncode(c.Color) + " &middot; " + HtmlEncode(LabelOf(site.Drives, c.Drive)) + " &middot; " + c.Miles.ToString("#,0", Inv) + " mi</div>");
                sb.Append("<div class=\"vh-car-p\"><b>" + Money(c.Price) + "</b>" + (!used && c.Msrp > c.Price ? "<s>" + Money(c.Msrp) + "</s><small>Save " + Money(c.Msrp - c.Price) + "</small>" : string.Empty) + "</div>");
                sb.Append("<div class=\"vh-car-f\"><span>Est. " + EstMonthly(site, c) + "*</span><span>Stock " + HtmlEncode(c.Stock) + "</span></div></div></a>");
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
                sb.Append("<div class=\"vh-quote-h\"><span>Estimated payment</span><b>$0</b><small>nothing left to finance</small></div>");
                return sb.Append(extra).ToString();
            }
            decimal monthly = Monthly(financed, apr, term);
            decimal totalPaid = monthly * term;
            sb.Append("<div class=\"vh-quote-h\"><span>Estimated payment</span><b>" + Money2(monthly) + "</b><small>a month for " + term + " months at " + apr.ToString("0.00", Inv) + "% APR</small></div><ul>");
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
            sb.Append("<li class=\"vh-quote-t\"><span>Amount financed</span><b>" + Money2(financed) + "</b></li>");
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
                return "<div class=\"vh-empty\">No offers in this group right now.</div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (OfferItem o in list)
            {
                CarModel? m = site.Models.FirstOrDefault(x => x.Key == o.Model);
                string who = m == null ? "Certified pre-owned" : LabelOf(site.Makes, m.Make) + " " + m.Name;
                int n = m == null ? site.Cars.Count(c => c.Certified) : site.Cars.Count(c => c.Model == m.Key && c.Condition == "new");
                string href = m == null ? "PreOwned?certified=1" : "New?model=" + m.Key;
                string tag = o.Kind == "apr" ? "Low APR" : o.Kind == "lease" ? "Lease" : o.Kind == "cash" ? "Cash off" : "Pre-owned";
                sb.Append("<article class=\"vh-offer\"><div class=\"vh-offer-img\"><img src=\"" + o.Image + "\" alt=\"" + HtmlEncode(who) + "\" loading=\"lazy\"><span class=\"vh-ends\">" + EndsText(today) + "</span></div>");
                sb.Append("<div class=\"vh-offer-b\"><div class=\"vh-eyebrow\">" + tag + " &middot; " + HtmlEncode(who) + "</div><h3>" + HtmlEncode(o.Title) + "</h3><p>" + HtmlEncode(o.Text) + "</p>");
                sb.Append("<div class=\"vh-offer-f\"><span>" + n + " in stock</span><a href=\"" + href + "\">Shop now &rarr;</a></div></div></article>");
            }
            return sb.ToString();
        }

        private static string ServiceOfferCards(SiteData site, DateTime today)
        {
            StringBuilder sb = new StringBuilder();
            foreach (ServiceOffer o in site.ServiceOffers)
            {
                sb.Append("<div class=\"vh-soffer\"><b>" + HtmlEncode(o.Price) + "</b><h3>" + HtmlEncode(o.Title) + "</h3><p>" + HtmlEncode(o.Text) + "</p><small>Ends " + EndOfMonth(today).ToString("MMM d", Inv) + "</small><a href=\"Service?svc=" + o.Service + "#book\">Book this &rarr;</a></div>");
            }
            return sb.ToString();
        }

        private static string StripStatus(SiteData site, DateTime now)
        {
            return "<span class=\"vh-strip-st\">Sales &middot; " + HoursStatus(site.SalesHours, now) + "</span>";
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
                    return "<span class=\"vh-dot vh-dot-on\"></span>Opens today at " + TimeText(open);
                }
                if (t < close)
                {
                    return "<span class=\"vh-dot vh-dot-on\"></span>Open now &middot; until " + TimeText(close);
                }
            }
            for (int i = 1; i <= 7; i++)
            {
                DateTime d = now.Date.AddDays(i);
                DayHours n = hours[(int)d.DayOfWeek];
                if (n.Open != string.Empty)
                {
                    return "<span class=\"vh-dot\"></span>Closed &middot; opens " + (i == 1 ? "tomorrow" : d.ToString("dddd", Inv)) + " at " + TimeText(n.Open);
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
            sb.Append("<button type=\"button\" class=\"vh-chip" + (active == string.Empty ? " vh-act" : string.Empty) + "\" onclick=\"VehicleJs.chip(this, '')\">" + HtmlEncode(all) + "</button>");
            foreach (KeyLabel k in items)
            {
                sb.Append("<button type=\"button\" class=\"vh-chip" + (k.Key == active ? " vh-act" : string.Empty) + "\" onclick=\"VehicleJs.chip(this, '" + k.Key + "')\">" + HtmlEncode(k.Label) + "</button>");
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
            return "<a class=\"vh-sg\" href=\"" + href + "\"><img src=\"" + img + "\" alt=\"\"><span><b>" + HtmlEncode(title) + "</b><small>" + HtmlEncode(sub) + "</small></span></a>";
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
