using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace SolarDB.Models
{
    public class WeatherReading
    {
        public int WeatherReadingID { get; set; }

        public int PlantNumber { get; set; }
        public DateTime DateAndTime { get; set; }

        public double AmbientTemp { get; set; }
        public double ModuleTemp { get; set; }
        public double Irridation { get; set; }
    }
}
