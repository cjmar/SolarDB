using SolarDB.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SolarDB.ViewModel
{
    public class SolarViewPoint
    {

        public double value { get; set; }    
    }

    public class SolarViewModel
    {
        public IEnumerable<WeatherReading> weatherReadings { get; set; }
        public IEnumerable<PowerReading> powerReadings { get; set; }
        public IEnumerable<PowerSource> powerSources { get; set; }
        public IEnumerable<Facility> facilities { get; set; }

        /*  Constructor so there are no null values passed to View
         * 
         * 
         */
        public SolarViewModel()
        {
            weatherReadings = new List<WeatherReading>();
            powerReadings = new List<PowerReading>();
            powerSources = new List<PowerSource>();
            facilities = new List<Facility>();
        }
    }
}
