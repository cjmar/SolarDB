using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SolarDB.Models;

namespace SolarDB.Data
{
    public class SolarContext : DbContext
    {
        public SolarContext(DbContextOptions<SolarContext> options) : base(options)
        {
        }

        public DbSet<WeatherReading> WeatherReadings { get; set; }
        public DbSet<PowerSource> PowerSources { get; set; }
        public DbSet<PowerReading> PowerReadings { get; set; }
    }
}
