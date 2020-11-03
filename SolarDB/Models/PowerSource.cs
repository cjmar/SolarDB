﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace SolarDB.Models
{
    public class PowerSource
    {
        public int PowerSourceID { get; set; }

        [Display(Name = "Power Array")]
        public string SourceKey { get; set; }
        [Display(Name = "Facility")]
        public int PlantNumber { get; set; }
    }
}