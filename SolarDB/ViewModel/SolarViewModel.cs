using SolarDB.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


/*  This model allows for multiple items to be passed to a view as a JSON
 * 
 *  Uses different objects from the models to strip database ids
 * 
 */
namespace SolarDB.ViewModel
{
    public class SVMWeather
    {
 
        public int PlantNumber { get; set; }
        public DateTime DateAndTime { get; set; }
        public double AmbientTemp { get; set; }     //C
        public double ModuleTemp { get; set; }      //C
        public double Irridation { get; set; }      //Best guess: Solar radiation sensor. Measures power of light and heat from sun

        public SVMWeather(WeatherReading wr)
        {
            PlantNumber = wr.PlantNumber;
            DateAndTime = wr.DateAndTime;
            AmbientTemp = wr.AmbientTemp;
            ModuleTemp = wr.ModuleTemp;
            Irridation = wr.Irridation;
        }
    }

    public class SVMPower
    {

        public string SourceKey { get; set; }
        public DateTime DateAndTime { get; set; }
        public double DC_Power { get; set; }        //kW
        public double AC_Power { get; set; }        //kW
        public double DailyYield { get; set; }      //kW
        public double TotalYield { get; set; }      //kW

        public SVMPower(PowerReading pr)
        {
            SourceKey = pr.SourceKey;
            DateAndTime = pr.DateAndTime;
            DC_Power = pr.DC_Power;
            AC_Power = pr.AC_Power;
            DailyYield = pr.DailyYield;
            TotalYield = pr.TotalYield;
        }
    }

    public class SVMFacility
    {
        public int PlantNumber { get; set; }

        public SVMFacility(Facility fc)
        {
            PlantNumber = fc.PlantNumber;
        }
    }

    public class SolarViewModel
    {
        //Using these dates are used to remember GUI selections
        public DateTime dateStart { get; set; }
        public DateTime dateEnd { get; set; } 

        public IEnumerable<SVMWeather> weatherReadings { get; set; }
        public IEnumerable<SVMPower> powerReadings { get; set; }
        public IEnumerable<SVMFacility> facilities { get; set; }

        /*  Constructor so there are no null Lists passed to View
         * 
         * 
         */
        public SolarViewModel()
        {
            dateStart = DateTime.Parse("05-15-2020 00:00"); //By default set to the first days worth of data
            dateEnd = DateTime.Parse("05-16-2020 00:00");
            weatherReadings = new List<SVMWeather>();
            powerReadings = new List<SVMPower>();
            facilities = new List<SVMFacility>();
        }
    }
}
