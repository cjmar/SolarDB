using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace SolarDB.Models
{
    public class Facility
    {
        public int FacilityID { get; set; }

        [Display(Name = "Facility")]
        public int PlantNumber { get; set; }
    }
}
