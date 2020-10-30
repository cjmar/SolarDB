using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SolarDB.Models
{
    public class PowerReading
    {
        public int PowerReadingID { get; set; }

        public string SourceKey { get; set; }
        public DateTime DateAndTime { get; set; }

        public double DC_Power { get; set; }
        public double AC_Power { get; set; }
        public double DailyYield { get; set; }
        public double TotalYield { get; set; }
    }
}
