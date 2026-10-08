using System.Globalization;
using System.Text;
using System.Text.Json;
using CarDealer.Models;
using SkyNet;

namespace CarDealer.codes
{
    public class Service : WebPage
    {
        public override async Task OnInitialized()
        {
            HtmlDoc.SetTitle("Service & parts | Crestline Motors");
            HtmlDoc.AddMetaElement("viewport", "width=device-width, initial-scale=1");
            HtmlDoc.AddMetaElement("description", "Schedule service online and order genuine parts.");

            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            HtmlDoc.HtmlBodyText = HtmlDoc.HtmlBodyText.Replace("{plhd_open}", StripStatus(site, DateTime.Now));
            List<string> keys = new List<string>();
            string pre = Pick(QueryValue("svc"), site.Services.Select(s => s.Key));
            string html = HtmlDoc.HtmlBodyText;
            if (pre != string.Empty)
            {
                keys.Add(pre);
                html = html.Replace("value=\"" + pre + "\" onchange", "value=\"" + pre + "\" checked onchange");
            }
            int year = Bound(QueryValue("year"), 2005, 2027);
            if (year > 0)
            {
                html = html.Replace("<option value=\"" + year.ToString(Inv) + "\">", "<option value=\"" + year.ToString(Inv) + "\" selected>");
            }
            string make = Pick(QueryValue("make"), site.Makes.Select(m => m.Key).Concat(new[] { "other" }));
            if (make != string.Empty)
            {
                html = html.Replace("<option value=\"" + make + "\">", "<option value=\"" + make + "\" selected>");
            }
            string vmodel = Clip(QueryValue("model"));
            int vmiles = Bound(QueryValue("miles"), 1, 500000);
            List<ServiceItem> chosen = site.Services.Where(s => keys.Contains(s.Key)).ToList();
            DateTime firstOpen = today;
            for (int i = 0; i < 7 && site.ServiceHours.Count == 7 && site.ServiceHours[(int)firstOpen.DayOfWeek].Open == string.Empty; i++)
            {
                firstOpen = firstOpen.AddDays(1);
            }
            HtmlDoc.HtmlBodyText = html
                .Replace("{plhd_vmodel}", HtmlEncode(vmodel))
                .Replace("{plhd_vmiles}", vmiles > 0 ? vmiles.ToString(Inv) : string.Empty)
                .Replace("{plhd_hours}", WeekHours(site.ServiceHours))
                .Replace("{plhd_parts_hours}", WeekHours(site.ServiceHours) + " &middot; " + HtmlEncode(Phone))
                .Replace("{plhd_dates}", DateOptions(site.ServiceHours, FirstDay(site.ServiceHours, DateTime.Now, 150), 21, today))
                .Replace("{plhd_sum}", SummaryHtml(site, chosen))
                .Replace("{plhd_transport}", TransportHtml(site, Minutes(chosen), null, string.Empty))
                .Replace("{plhd_offers}", ServiceOfferCards(site, today));
        }

        private const string Phone = "(555) 017-4410";

        public async Task<ApiResponse> Slots()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            List<ServiceItem> chosen = Chosen(site, GetDataValue("services"));
            int minutes = Minutes(chosen);
            string time = (GetDataValue("time") ?? string.Empty).Trim();
            string transport = (GetDataValue("transport") ?? string.Empty).Trim();
            DateTime date;
            bool okDate = ParseDate(GetDataValue("date"), out date) && date >= today && date <= today.AddDays(21);
            response.SetElementContents("sv-sum", SummaryHtml(site, chosen));
            response.SetElementContents("sv-transport", TransportHtml(site, minutes, okDate ? date : (DateTime?)null, transport));
            if (chosen.Count == 0)
            {
                response.SetElementContents("sv-slots", "<p class=\"sv-fine\">Choose at least one service to see open times.</p>");
                response.ExecuteScript("ServiceJs.slot('', '');");
                return response;
            }
            if (!okDate)
            {
                response.SetElementContents("sv-slots", "<p class=\"sv-err\">Please choose a day in the next three weeks.</p>");
                response.ExecuteScript("ServiceJs.slot('', '');");
                return response;
            }
            List<Slot> list = ServiceSlots(site, date, minutes, DateTime.Now);
            Slot? keep = list.FirstOrDefault(s => s.Time == time && s.Open);
            response.SetElementContents("sv-slots", SlotsHtml(list, date, minutes, keep == null ? string.Empty : keep.Time, today));
            if (keep == null)
            {
                response.ExecuteScript("ServiceJs.slot('', '');");
            }
            return response;
        }

        public async Task<ApiResponse> Book()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            int year = Bound(GetDataValue("year"), 2005, 2027);
            string make = Pick(GetDataValue("make"), site.Makes.Select(m => m.Key).Concat(new[] { "other" }));
            string model = (GetDataValue("model") ?? string.Empty).Trim();
            string ms = (GetDataValue("miles") ?? string.Empty).Trim();
            int miles;
            bool okMiles = int.TryParse(ms, NumberStyles.Integer, Inv, out miles) && miles >= 0 && miles <= 500000;
            List<ServiceItem> chosen = Chosen(site, GetDataValue("services"));
            int minutes = Minutes(chosen);
            DateTime date;
            bool okDate = ParseDate(GetDataValue("date"), out date) && date >= today && date <= today.AddDays(21);
            string time = (GetDataValue("time") ?? string.Empty).Trim();
            string transport = Pick(GetDataValue("transport"), site.Transport.Select(t => t.Key));
            string advisor = Pick(GetDataValue("advisor"), site.Advisors.Select(a => a.Key));
            string name = (GetDataValue("name") ?? string.Empty).Trim();
            string phone = (GetDataValue("phone") ?? string.Empty).Trim();
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            string notes = (GetDataValue("notes") ?? string.Empty).Trim();
            bool texts = GetDataValue("texts") == "1";

            Slot? slot = null;
            if (okDate && chosen.Count > 0)
            {
                slot = ServiceSlots(site, date, minutes, DateTime.Now).FirstOrDefault(s => s.Time == time);
            }
            string eMake = make == string.Empty || year == 0 ? "Please choose the year and make." : string.Empty;
            string eModel = model.Length < 1 || model.Length > 40 ? "Please enter the model." : string.Empty;
            string eMiles = !okMiles ? "Please enter the mileage." : string.Empty;
            string eServices = chosen.Count == 0 ? "Please choose at least one service." : string.Empty;
            string eSlot = chosen.Count == 0 ? string.Empty : !okDate ? "Please choose a day." : slot == null ? "Please choose a time from the list." : !slot.Open ? "Sorry, that time was just taken. Please pick another." : string.Empty;
            string eTransport = TransportError(site, transport, minutes, okDate ? date : (DateTime?)null);
            string eName = name.Length < 2 || name.Length > 60 ? "Please tell us your name." : string.Empty;
            string ePhone = !IsPhone(phone) ? "Please enter a 10-digit phone number." : string.Empty;
            string eEmail = !IsEmail(email) ? "Please enter a valid email address." : string.Empty;
            response.SetElementContents("sv-e-make", eMake);
            response.SetElementContents("sv-e-model", eModel);
            response.SetElementContents("sv-e-miles", eMiles);
            response.SetElementContents("sv-e-services", eServices);
            response.SetElementContents("sv-e-slot", eSlot);
            response.SetElementContents("sv-e-transport", eTransport);
            response.SetElementContents("sv-e-name", eName);
            response.SetElementContents("sv-e-phone", ePhone);
            response.SetElementContents("sv-e-email", eEmail);
            if (eMake + eModel + eMiles + eServices + eSlot + eTransport + eName + ePhone + eEmail != string.Empty || slot == null)
            {
                response.SetElementContents("sv-done", string.Empty);
                response.ExecuteScript("ServiceJs.firstError();");
                return response;
            }
            TimeSpan start = TimeSpan.Parse(slot.Time, Inv);
            string who = advisor == "any" || advisor == string.Empty ? site.Advisors.Where(a => a.Key != "any").Select(a => a.Label).ElementAtOrDefault((int)(Hash(date.ToString("yyyyMMdd", Inv) + slot.Time) % 3)) ?? "Our service team" : LabelOf(site.Advisors, advisor);
            decimal sub = chosen.Sum(s => s.Price);
            decimal tax = Math.Round(sub * site.TaxRate, 2, MidpointRounding.AwayFromZero);
            string code = Code("SV", date.ToString("yyyyMMdd", Inv) + slot.Time + email + string.Join(".", chosen.Select(s => s.Key)));
            string vehicle = year + " " + (make == "other" ? string.Empty : LabelOf(site.Makes, make) + " ") + model;
            StringBuilder sb = new StringBuilder();
            sb.Append("<div class=\"sv-done-h\"><span>&#10003;</span><div><b>You&rsquo;re booked, " + HtmlEncode(name.Split(' ')[0]) + ".</b><small>Confirmation " + code + "</small></div></div><ul>");
            sb.Append("<li><span>Vehicle</span>" + HtmlEncode(vehicle) + " &middot; " + miles.ToString("#,0", Inv) + " mi</li>");
            sb.Append("<li><span>Drop-off</span>" + date.ToString("dddd, MMMM d", Inv) + " at " + slot.Label + "</li>");
            sb.Append("<li><span>Ready by</span>" + ReadyBy(site, date, start, minutes) + "</li>");
            sb.Append("<li><span>Getting around</span>" + HtmlEncode(LabelOf(site.Transport.Select(t => new KeyLabel { Key = t.Key, Label = t.Label }).ToList(), transport)) + "</li>");
            sb.Append("<li><span>Advisor</span>" + HtmlEncode(who) + "</li>");
            sb.Append("<li><span>Estimate</span>" + Money2(sub + tax) + " incl. tax</li>");
            sb.Append("<li class=\"sv-wide\"><span>Services</span>" + HtmlEncode(string.Join(", ", chosen.Select(s => s.Label))) + "</li>");
            if (notes != string.Empty)
            {
                sb.Append("<li class=\"sv-wide\"><span>Notes</span>" + HtmlEncode(notes.Length > 120 ? notes.Substring(0, 120) + "…" : notes) + "</li>");
            }
            sb.Append("</ul><p>We&rsquo;ll email " + HtmlEncode(email) + (texts ? " and text inspection photos to " + HtmlEncode(phone) : string.Empty) + ". This is a demo: no bay was held.</p>");
            response.SetElementContents("sv-done", sb.ToString());
            response.ExecuteScript("ServiceJs.booked();");
            return response;
        }

        public async Task<ApiResponse> Parts()
        {
            ApiResponse response = new ApiResponse();
            
            string name = (GetDataValue("name") ?? string.Empty).Trim();
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            string vehicle = (GetDataValue("vehicle") ?? string.Empty).Trim();
            string part = (GetDataValue("part") ?? string.Empty).Trim();
            string ship = (GetDataValue("ship") ?? string.Empty).Trim();
            int qty = Bound(GetDataValue("qty"), 1, 20);
            string eName = name.Length < 2 || name.Length > 60 ? "Please tell us your name." : string.Empty;
            string eEmail = !IsEmail(email) ? "Please enter a valid email address." : string.Empty;
            string eVeh = vehicle.Length < 4 || vehicle.Length > 60 ? "Please enter the year, make and model, or the 17-character VIN." : string.Empty;
            string ePart = part.Length < 4 || part.Length > 300 ? "Please describe the part you need." : string.Empty;
            string eQty = qty == 0 ? "Please enter a quantity from 1 to 20." : string.Empty;
            response.SetElementContents("sv-e-pname", eName);
            response.SetElementContents("sv-e-pemail", eEmail);
            response.SetElementContents("sv-e-pveh", eVeh);
            response.SetElementContents("sv-e-part", ePart);
            response.SetElementContents("sv-e-qty", eQty);
            if (eName + eEmail + eVeh + ePart + eQty != string.Empty)
            {
                response.SetElementContents("sv-psent", string.Empty);
                return response;
            }
            string code = Code("PT", name + email + vehicle + part);
            response.SetElementContents("sv-psent", "<b>Request " + code + " received, " + HtmlEncode(name.Split(' ')[0]) + ".</b> " + qty + " &times; " + HtmlEncode(part.Length > 60 ? part.Substring(0, 60) + "…" : part) + " for " + HtmlEncode(vehicle) + ", " + (ship == "ship" ? "shipped to you" : "for pickup at the parts counter") + ". The parts desk replies within one business day. <small>Demo only: nothing was sent.</small>");
            response.ExecuteScript("ServiceJs.partsSent();");
            return response;
        }

        private static List<ServiceItem> Chosen(SiteData site, string? value)
        {
            List<string> keys = (value ?? string.Empty).Split('.', StringSplitOptions.RemoveEmptyEntries).ToList();
            return site.Services.Where(s => keys.Contains(s.Key)).ToList();
        }

        private static int Minutes(List<ServiceItem> list)
        {
            if (list.Count == 0)
            {
                return 0;
            }
            int total = list.Sum(s => s.Minutes);
            if (list.Count > 1 && list.Any(s => s.Key == "inspection"))
            {
                total -= 15;
            }
            return Math.Max(30, (int)Math.Ceiling(total / 15.0) * 15);
        }

        private static string Duration(int minutes)
        {
            int h = minutes / 60;
            int m = minutes % 60;
            return h == 0 ? m + " min" : h + " hr" + (m == 0 ? string.Empty : " " + m + " min");
        }

        private static string SummaryHtml(SiteData site, List<ServiceItem> chosen)
        {
            StringBuilder sb = new StringBuilder("<div class=\"sv-sum-h\"><span>Your estimate</span>");
            if (chosen.Count == 0)
            {
                return sb.Append("<b>$0.00</b></div><p>Choose services on the left to see the price and how long it takes.</p>").ToString();
            }
            decimal sub = chosen.Sum(s => s.Price);
            decimal tax = Math.Round(sub * site.TaxRate, 2, MidpointRounding.AwayFromZero);
            int minutes = Minutes(chosen);
            sb.Append("<b>" + Money2(sub + tax) + "</b><small>About " + Duration(minutes) + "</small></div><ul>");
            foreach (ServiceItem s in chosen)
            {
                sb.Append("<li><span>" + HtmlEncode(s.Label) + "</span><b>" + (s.Price == 0 ? "Free" : Money2(s.Price)) + "</b></li>");
            }
            sb.Append("<li><span>Tax (" + (site.TaxRate * 100m).ToString("0.#", Inv) + "%)</span><b>" + Money2(tax) + "</b></li><li class=\"sv-quote-t\"><span>Total</span><b>" + Money2(sub + tax) + "</b></li></ul>");
            sb.Append("<p>" + (minutes > 90 ? "Longer than 90 minutes: take a free loaner or the shuttle." : "Up to 90 minutes: you&rsquo;re welcome to wait in the lounge.") + "</p>");
            return sb.ToString();
        }

        private static int LoanersLeft(DateTime date)
        {
            return (int)(Hash(date.ToString("yyyyMMdd", Inv) + "|loaner") % 5);
        }

        private static string TransportError(SiteData site, string key, int minutes, DateTime? date)
        {
            if (key == string.Empty)
            {
                return "Please choose how you&rsquo;ll get around.";
            }
            if (key == "wait" && minutes > 90)
            {
                return "Waiting is for visits up to 90 minutes. Please choose another option.";
            }
            if (key == "loaner" && minutes > 0 && minutes <= 90)
            {
                return "Loaners are for visits over 90 minutes. Please choose another option.";
            }
            if (key == "loaner" && date.HasValue && LoanersLeft(date.Value) == 0)
            {
                return "No loaners are left that day. Please choose another option.";
            }
            return string.Empty;
        }

        private static string TransportHtml(SiteData site, int minutes, DateTime? date, string chosen)
        {
            StringBuilder sb = new StringBuilder();
            foreach (TransportOption t in site.Transport)
            {
                string note = t.Note;
                bool off = false;
                if (t.Key == "wait" && minutes > 90)
                {
                    off = true;
                    note = "Only for visits up to 90 minutes; yours is about " + Duration(minutes) + ".";
                }
                if (t.Key == "loaner")
                {
                    if (minutes > 0 && minutes <= 90)
                    {
                        off = true;
                        note = "For visits over 90 minutes.";
                    }
                    else if (date.HasValue)
                    {
                        int left = LoanersLeft(date.Value);
                        off = left == 0;
                        note = left == 0 ? "None left on " + date.Value.ToString("ddd, MMM d", Inv) + "." : left + " left on " + date.Value.ToString("ddd, MMM d", Inv) + ".";
                    }
                }
                bool on = t.Key == chosen && !off;
                sb.Append("<label class=\"sv-tr" + (off ? " sv-off" : string.Empty) + "\"><input type=\"radio\" name=\"sv-tr\" value=\"" + t.Key + "\"" + (off ? " disabled" : string.Empty) + (on ? " checked" : string.Empty) + "><span><b>" + HtmlEncode(t.Label) + "</b><small>" + HtmlEncode(note) + "</small></span></label>");
            }
            return sb.ToString();
        }

        private sealed class Slot
        {
            public string Time { get; set; } = string.Empty;
            public string Label { get; set; } = string.Empty;
            public bool Open { get; set; }
        }

        private static List<Slot> ServiceSlots(SiteData site, DateTime date, int minutes, DateTime now)
        {
            List<Slot> list = new List<Slot>();
            if (site.ServiceHours.Count != 7 || minutes <= 0)
            {
                return list;
            }
            DayHours h = site.ServiceHours[(int)date.DayOfWeek];
            TimeSpan open, close;
            if (h.Open == string.Empty || !TimeSpan.TryParse(h.Open, Inv, out open) || !TimeSpan.TryParse(h.Close, Inv, out close))
            {
                return list;
            }
            bool full = minutes > 240;
            TimeSpan step = TimeSpan.FromMinutes(30);
            for (TimeSpan t = open; t < close; t = t.Add(step))
            {
                if (full && t > open.Add(step))
                {
                    break;
                }
                TimeSpan end = t.Add(TimeSpan.FromMinutes(minutes));
                if (!full && end > close)
                {
                    break;
                }
                bool ok = date.Date.Add(t) > now.AddHours(2) && BaysFree(site, date, t, end < close ? end : close);
                list.Add(new Slot { Time = t.ToString(@"hh\:mm", Inv), Label = TimeText(t), Open = ok });
            }
            return list;
        }

        private static bool BaysFree(SiteData site, DateTime date, TimeSpan from, TimeSpan to)
        {
            for (TimeSpan b = from; b < to; b = b.Add(TimeSpan.FromMinutes(30)))
            {
                string k = date.ToString("yyyyMMdd", Inv) + "|" + b.ToString(@"hh\:mm", Inv);
                int used = (int)(Hash(k + "|bay") % 6) + (b.Hours < 10 ? 1 : 0) + (Hash(k + "|x") % 3 == 0 ? 1 : 0) + (date.DayOfWeek == DayOfWeek.Saturday ? 1 : 0);
                if (used >= site.Bays)
                {
                    return false;
                }
            }
            return true;
        }

        private static string SlotsHtml(List<Slot> list, DateTime date, int minutes, string chosen, DateTime today)
        {
            if (list.Count == 0)
            {
                return "<p>The service department is closed " + (date == today ? "today" : "on " + date.ToString("dddd", Inv) + "s") + ". Please choose another day.</p>";
            }
            int open = list.Count(s => s.Open);
            StringBuilder sb = new StringBuilder("<p><b>" + (open == 0 ? "Fully booked" : open + " open " + (open == 1 ? "time" : "times")) + "</b> &middot; " + date.ToString("dddd, MMM d", Inv) + " &middot; about " + Duration(minutes) + (minutes > 240 ? " &middot; morning drop-off" : string.Empty) + "</p><div class=\"sv-times\">");
            foreach (Slot s in list)
            {
                if (s.Open)
                {
                    string label = date.ToString("ddd, MMM d", Inv) + " at " + s.Label;
                    sb.Append("<button type=\"button\" class=\"sv-time" + (s.Time == chosen ? " sv-act" : string.Empty) + "\" data-t=\"" + s.Time + "\" data-l=\"" + HtmlEncode(label) + "\" onclick=\"ServiceJs.pickSlot(this)\">" + s.Label + "</button>");
                }
                else
                {
                    sb.Append("<span class=\"sv-time sv-off\" title=\"All bays booked\">" + s.Label + "</span>");
                }
            }
            sb.Append("</div>");
            if (open == 0)
            {
                sb.Append("<p class=\"sv-fine\">Every bay is booked for that much work. Try another day.</p>");
            }
            return sb.ToString();
        }

        private static string ReadyBy(SiteData site, DateTime date, TimeSpan start, int minutes)
        {
            TimeSpan end = start.Add(TimeSpan.FromMinutes(Math.Ceiling(minutes / 15.0) * 15));
            DayHours h = site.ServiceHours[(int)date.DayOfWeek];
            TimeSpan close = TimeSpan.Parse(h.Close, Inv);
            if (end <= close)
            {
                return "about " + TimeText(end) + " the same day";
            }
            DateTime next = date.AddDays(1);
            for (int i = 0; i < 7 && site.ServiceHours[(int)next.DayOfWeek].Open == string.Empty; i++)
            {
                next = next.AddDays(1);
            }
            TimeSpan open = TimeSpan.Parse(site.ServiceHours[(int)next.DayOfWeek].Open, Inv);
            return next.ToString("dddd", Inv) + " by " + TimeText(open.Add(TimeSpan.FromHours(3)));
        }

        private static string WeekHours(List<DayHours> hours)
        {
            if (hours.Count != 7)
            {
                return string.Empty;
            }
            DayHours wk = hours[1];
            DayHours sat = hours[6];
            return "Mon&ndash;Fri " + TimeText(wk.Open) + "&ndash;" + TimeText(wk.Close) + " &middot; Sat " + (sat.Open == string.Empty ? "closed" : TimeText(sat.Open) + "&ndash;" + TimeText(sat.Close));
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
                sb.Append("<div class=\"sv-sg-none\">No vehicles match &ldquo;" + HtmlEncode(q) + "&rdquo;</div>");
            }
            else
            {
                foreach (string r in rows.Take(7))
                {
                    sb.Append(r);
                }
                sb.Append("<div class=\"sv-sg-foot\">" + total + (total == 1 ? " result" : " results") + " across models and inventory</div>");
            }
            response.SetElementContents("sv-sugg", sb.ToString());
            response.ExecuteScript("ServiceJs.openSugg();");
            return response;
        }

        public async Task<ApiResponse> Subscribe()
        {
            ApiResponse response = new ApiResponse();
            
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            if (!IsEmail(email))
            {
                response.SetElementContents("sv-nl-msg", "<span class=\"sv-err\">Please enter a valid email address.</span>");
                return response;
            }
            response.SetElementContents("sv-nl-msg", "<span class=\"sv-ok\">Thanks! Price drops and specials will go to " + HtmlEncode(email) + ". (Demo only &mdash; nothing was stored.)</span>");
            response.ExecuteScript("ServiceJs.subscribed();");
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
                return "<div class=\"sv-empty\">No vehicles match those filters. <button type=\"button\" class=\"sv-linkb\" onclick=\"ServiceJs.clearAll()\">Clear all filters</button></div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (Car c in list)
            {
                bool used = c.Condition == "used";
                string badge = c.Status == "In transit" ? "<span class=\"sv-badge sv-badge-t\">In transit</span>" : used ? (c.Certified ? "<span class=\"sv-badge sv-badge-c\">Certified</span>" : string.Empty) : "<span class=\"sv-badge\">New</span>";
                sb.Append("<a class=\"sv-car\" href=\"Vehicle?stock=" + c.Stock + "\"><div class=\"sv-car-img\"><img src=\"" + c.Image + "\" alt=\"" + HtmlEncode(Title(site, c)) + "\" loading=\"lazy\">" + badge + "</div>");
                sb.Append("<div class=\"sv-car-b\"><div class=\"sv-car-y\">" + c.Year + " &middot; " + HtmlEncode(LabelOf(site.Makes, c.Make)) + "</div><h3>" + HtmlEncode(c.Name + " " + c.Trim) + "</h3>");
                sb.Append("<div class=\"sv-car-m\">" + HtmlEncode(c.Color) + " &middot; " + HtmlEncode(LabelOf(site.Drives, c.Drive)) + " &middot; " + c.Miles.ToString("#,0", Inv) + " mi</div>");
                sb.Append("<div class=\"sv-car-p\"><b>" + Money(c.Price) + "</b>" + (!used && c.Msrp > c.Price ? "<s>" + Money(c.Msrp) + "</s><small>Save " + Money(c.Msrp - c.Price) + "</small>" : string.Empty) + "</div>");
                sb.Append("<div class=\"sv-car-f\"><span>Est. " + EstMonthly(site, c) + "*</span><span>Stock " + HtmlEncode(c.Stock) + "</span></div></div></a>");
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
                sb.Append("<div class=\"sv-quote-h\"><span>Estimated payment</span><b>$0</b><small>nothing left to finance</small></div>");
                return sb.Append(extra).ToString();
            }
            decimal monthly = Monthly(financed, apr, term);
            decimal totalPaid = monthly * term;
            sb.Append("<div class=\"sv-quote-h\"><span>Estimated payment</span><b>" + Money2(monthly) + "</b><small>a month for " + term + " months at " + apr.ToString("0.00", Inv) + "% APR</small></div><ul>");
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
            sb.Append("<li class=\"sv-quote-t\"><span>Amount financed</span><b>" + Money2(financed) + "</b></li>");
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
                return "<div class=\"sv-empty\">No offers in this group right now.</div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (OfferItem o in list)
            {
                CarModel? m = site.Models.FirstOrDefault(x => x.Key == o.Model);
                string who = m == null ? "Certified pre-owned" : LabelOf(site.Makes, m.Make) + " " + m.Name;
                int n = m == null ? site.Cars.Count(c => c.Certified) : site.Cars.Count(c => c.Model == m.Key && c.Condition == "new");
                string href = m == null ? "PreOwned?certified=1" : "New?model=" + m.Key;
                string tag = o.Kind == "apr" ? "Low APR" : o.Kind == "lease" ? "Lease" : o.Kind == "cash" ? "Cash off" : "Pre-owned";
                sb.Append("<article class=\"sv-offer\"><div class=\"sv-offer-img\"><img src=\"" + o.Image + "\" alt=\"" + HtmlEncode(who) + "\" loading=\"lazy\"><span class=\"sv-ends\">" + EndsText(today) + "</span></div>");
                sb.Append("<div class=\"sv-offer-b\"><div class=\"sv-eyebrow\">" + tag + " &middot; " + HtmlEncode(who) + "</div><h3>" + HtmlEncode(o.Title) + "</h3><p>" + HtmlEncode(o.Text) + "</p>");
                sb.Append("<div class=\"sv-offer-f\"><span>" + n + " in stock</span><a href=\"" + href + "\">Shop now &rarr;</a></div></div></article>");
            }
            return sb.ToString();
        }

        private static string ServiceOfferCards(SiteData site, DateTime today)
        {
            StringBuilder sb = new StringBuilder();
            foreach (ServiceOffer o in site.ServiceOffers)
            {
                sb.Append("<div class=\"sv-soffer\"><b>" + HtmlEncode(o.Price) + "</b><h3>" + HtmlEncode(o.Title) + "</h3><p>" + HtmlEncode(o.Text) + "</p><small>Ends " + EndOfMonth(today).ToString("MMM d", Inv) + "</small><a href=\"Service?svc=" + o.Service + "#book\">Book this &rarr;</a></div>");
            }
            return sb.ToString();
        }

        private static string StripStatus(SiteData site, DateTime now)
        {
            return "<span class=\"sv-strip-st\">Sales &middot; " + HoursStatus(site.SalesHours, now) + "</span>";
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
                    return "<span class=\"sv-dot sv-dot-on\"></span>Opens today at " + TimeText(open);
                }
                if (t < close)
                {
                    return "<span class=\"sv-dot sv-dot-on\"></span>Open now &middot; until " + TimeText(close);
                }
            }
            for (int i = 1; i <= 7; i++)
            {
                DateTime d = now.Date.AddDays(i);
                DayHours n = hours[(int)d.DayOfWeek];
                if (n.Open != string.Empty)
                {
                    return "<span class=\"sv-dot\"></span>Closed &middot; opens " + (i == 1 ? "tomorrow" : d.ToString("dddd", Inv)) + " at " + TimeText(n.Open);
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
            sb.Append("<button type=\"button\" class=\"sv-chip" + (active == string.Empty ? " sv-act" : string.Empty) + "\" onclick=\"ServiceJs.chip(this, '')\">" + HtmlEncode(all) + "</button>");
            foreach (KeyLabel k in items)
            {
                sb.Append("<button type=\"button\" class=\"sv-chip" + (k.Key == active ? " sv-act" : string.Empty) + "\" onclick=\"ServiceJs.chip(this, '" + k.Key + "')\">" + HtmlEncode(k.Label) + "</button>");
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
            return "<a class=\"sv-sg\" href=\"" + href + "\"><img src=\"" + img + "\" alt=\"\"><span><b>" + HtmlEncode(title) + "</b><small>" + HtmlEncode(sub) + "</small></span></a>";
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
