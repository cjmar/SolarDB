using SolarDB.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SolarDB.ViewModel
{
    public class SolarViewModel
    {
        public IEnumerable<WeatherReading> weatherReadings { get; set; }
        public IEnumerable<PowerReading> powerReadings { get; set; }
        public IEnumerable<PowerSource> powerSources { get; set; }
        public IEnumerable<Facility> facilities { get; set; }
    }
}
