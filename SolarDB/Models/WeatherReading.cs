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

        [Display(Name = "Facility")]
        public int PlantNumber { get; set; }

        [Display(Name = "Date Time")]
        public DateTime DateAndTime { get; set; }

        [Display(Name = "Ambient Temperature")]
        public double AmbientTemp { get; set; }     //C
        [Display(Name = "Module Temperature")]
        public double ModuleTemp { get; set; }      //C
        [Display(Name = "Irradiation")]
        public double Irradiation { get; set; }      //Measures power of light and heat from sun
    }
}
