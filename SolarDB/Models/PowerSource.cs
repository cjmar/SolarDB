using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SolarDB.Models
{
    public class PowerSource
    {
        public int PowerSourceID { get; set; }

        public string SourceKey { get; set; }
        public int PlantNumber { get; set; }
    }
}
