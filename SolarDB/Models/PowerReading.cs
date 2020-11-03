using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace SolarDB.Models
{
    public class PowerReading
    {
        public int PowerReadingID { get; set; }

        [Display(Name = "Power Array")]
        public string SourceKey { get; set; }
        public DateTime DateAndTime { get; set; }

        [Display(Name = "DC Power")]
        public double DC_Power { get; set; }        //kW
        [Display(Name = "Ac Power")]
        public double AC_Power { get; set; }        //kW
        [Display(Name = "Daily Yield")]
        public double DailyYield { get; set; }      //kW
        [Display(Name = "Total Yield")]
        public double TotalYield { get; set; }      //kW
    }
}
