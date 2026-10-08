namespace CarDealer.Models
{
    public class SiteData
    {
        public List<KeyLabel> Makes { get; set; } = new List<KeyLabel>();
        public List<KeyLabel> Bodies { get; set; } = new List<KeyLabel>();
        public List<KeyLabel> Fuels { get; set; } = new List<KeyLabel>();
        public List<KeyLabel> Drives { get; set; } = new List<KeyLabel>();
        public List<Car> Cars { get; set; } = new List<Car>();
        public List<CarModel> Models { get; set; } = new List<CarModel>();
        public List<OfferItem> Offers { get; set; } = new List<OfferItem>();
        public List<ServiceOffer> ServiceOffers { get; set; } = new List<ServiceOffer>();
        public List<CreditTier> Tiers { get; set; } = new List<CreditTier>();
        public List<int> Terms { get; set; } = new List<int>();
        public decimal TaxRate { get; set; }
        public decimal DocFee { get; set; }
        public List<ServiceItem> Services { get; set; } = new List<ServiceItem>();
        public List<DayHours> ServiceHours { get; set; } = new List<DayHours>();
        public List<DayHours> SalesHours { get; set; } = new List<DayHours>();
        public int Bays { get; set; }
        public List<TransportOption> Transport { get; set; } = new List<TransportOption>();
        public List<KeyLabel> Advisors { get; set; } = new List<KeyLabel>();
    }

    public class KeyLabel
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
    }

    public class Car
    {
        public string Stock { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Trim { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Body { get; set; } = string.Empty;
        public string Fuel { get; set; } = string.Empty;
        public string Drive { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Msrp { get; set; }
        public int Miles { get; set; }
        public bool Certified { get; set; }
        public int Owners { get; set; }
        public int Accidents { get; set; }
        public int Hp { get; set; }
        public string Economy { get; set; } = string.Empty;
        public int Seats { get; set; }
        public string Cargo { get; set; } = string.Empty;
        public List<string> Features { get; set; } = new List<string>();
        public string Status { get; set; } = string.Empty;
        public string Vin { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public int Rank { get; set; }
    }

    public class CarModel
    {
        public string Key { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Fuel { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Hp { get; set; }
        public string Economy { get; set; } = string.Empty;
        public int Seats { get; set; }
        public string Cargo { get; set; } = string.Empty;
        public string Drive { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<TrimItem> Trims { get; set; } = new List<TrimItem>();
        public string Image { get; set; } = string.Empty;
    }

    public class TrimItem
    {
        public string Label { get; set; } = string.Empty;
        public decimal Add { get; set; }
    }

    public class OfferItem
    {
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Kind { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public int Term { get; set; }
        public decimal Amount { get; set; }
        public string Text { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
    }

    public class ServiceOffer
    {
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string Service { get; set; } = string.Empty;
    }

    public class CreditTier
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public decimal Rate { get; set; }
    }

    public class ServiceItem
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Minutes { get; set; }
        public string Group { get; set; } = string.Empty;
    }

    public class DayHours
    {
        public string Day { get; set; } = string.Empty;
        public string Open { get; set; } = string.Empty;
        public string Close { get; set; } = string.Empty;
    }

    public class TransportOption
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
    }
}
