using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using SolarDB.Data;
using SolarDB.Models;
using SolarDB.ViewModel;

namespace SolarDB.Controllers
{
    public class SelectTarget
    {
        public DateTime dateStart { get; set; } //  Shows the first day by default
        public DateTime dateEnd { get; set; }   //
        public int plantNum { get; set; }       //  -1 means all. Shows "Plant_1" first
        public bool showWeather { get; set; }   //  Show weather readings
        public bool showPower { get; set; }     //  Show power readings

        public SelectTarget()
        {
            dateStart = DateTime.Parse("05-15-2020");
            dateEnd = DateTime.Parse("05-16-2020");
            plantNum = 4135001;
            showWeather = false;
            showPower = false;
        }

        public void printDebug()
        {
            System.Diagnostics.Debug.WriteLine("dateStart: " + dateStart.ToString());
            System.Diagnostics.Debug.WriteLine("dateEnd: " + dateEnd.ToString());
            System.Diagnostics.Debug.WriteLine("plantNum: " + plantNum);
            System.Diagnostics.Debug.WriteLine("showWeather: " + showWeather);
            System.Diagnostics.Debug.WriteLine("showPower: " + showPower);
        }
    }

    public class SolarController : Controller
    {
        private readonly SolarContext _context;

        public SolarController(SolarContext context)
        {
            _context = context;
        }

        // GET: Solar
        public async Task<IActionResult> Info()
        {
            //Get all Facilities for dropdown 
            SelectTarget info = new SelectTarget
            {
                plantNum = -1,
            };

            SolarViewModel rtn = await SVMBuilder(info);

            return View(rtn);
        }

        // POST: Solar/Info
        [HttpPost, ActionName("Info")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PostInfo()
        {

            SelectTarget tgt = new SelectTarget
            {
                dateStart = DateTime.Parse(HttpContext.Request.Form["startDate"]),
                dateEnd = DateTime.Parse(HttpContext.Request.Form["endDate"]),
                plantNum = parsePlantNumber(HttpContext.Request.Form["plantNum"]),
                showWeather = parseCheckBox(HttpContext.Request.Form["showWeather"]),
                showPower = parseCheckBox(HttpContext.Request.Form["showPower"]),
            };

            tgt.printDebug();

            //Create SelectInfo struct from form data
            SolarViewModel rtn = await SVMBuilder(tgt);

            return View(rtn);
        }

        /*  Creates a SolarViewModel from database
         * 
         *  Expects parameters used to select database entries
         *
         *      
         *  Returns a SolarViewModel filled with data based on SelectTarget parameters
         */
        private async Task<SolarViewModel> SVMBuilder(SelectTarget info)
        {
            //SVM default values are empty List<T>. Dates and all facilities are grabbed for GUI
            SolarViewModel rtn = new SolarViewModel
            {
                dateStart = info.dateStart,
                dateEnd = info.dateEnd,
                showPower = info.showPower,
                showWeather = info.showWeather,
                

                facilities = await _context.Facilities.OrderBy(f => f.PlantNumber)
                                                        .Select(f => new SVMFacility(f))
                                                        .ToListAsync()
            };
            //TODO: These three methods make three seperate accesses to the database and need to probably be one query
            //              execution is deferred until the ToList() when dealing with an IQueryable

            //Populate WeatherReadings
            if (info.showWeather)
            {
                rtn.weatherReadings = await PopulateWeatherReadings(info);
            }

            //Populate PowerReadings and sources
            if (info.showPower)
            {
                rtn.powerReadings = await PopulatePowerReadings(info);
                rtn.powerSources = await PopulatePowerSources(info);
            }

            System.Diagnostics.Debug.WriteLine("Facility count: " + rtn.facilities.Count() + " selected " + info.plantNum);
            System.Diagnostics.Debug.WriteLine("Weather reading count: " + rtn.weatherReadings.Count() + " show " + info.showWeather);
            System.Diagnostics.Debug.WriteLine("Power readings count: " + rtn.powerReadings.Count() + " show " + info.showPower);
            System.Diagnostics.Debug.WriteLine("Power Sources count: " + rtn.powerSources.Count());

            return rtn;
        }

        /*  Returns a Task<List<PowerReading>> based on DateTime, Plant number (or all), and power source
         *              within a date period
         * 
         */
        private async Task<List<SVMPower>> PopulatePowerReadings(SelectTarget info)
        {
            //Empty string means get all sources
            if (info.plantNum == -1)    //ALL power readings from ALL facilities
            {
                return await _context.PowerReadings.Where(pr => pr.DateAndTime >= info.dateStart && pr.DateAndTime < info.dateEnd)
                                                        .OrderBy(pr => pr.DateAndTime)
                                                        .Select(pr => new SVMPower(pr))
                                                        .ToListAsync();
            }
            else                        //power readings from a specific facility
            {
                //Join PowerSource and PowerReading where (PS.SourceKey == PR.SourceKey) from there take PR where DateTime is within bounds
                return await (from reading in _context.PowerReadings
                                join source in _context.PowerSources on reading.SourceKey equals source.SourceKey
                                where (source.PlantNumber == info.plantNum)
                                select reading)
                                .Where(pr => pr.DateAndTime >= info.dateStart && pr.DateAndTime <= info.dateEnd)
                                .OrderBy(pr => pr.DateAndTime)
                                .Select(pr => new SVMPower(pr))
                                .ToListAsync();
            }   
        }

        /*  Returns a Task<List<WeatherReading>> based on DateTime and Plant number (or all)
         *              within a date period
         * 
         */
        private async Task<List<SVMWeather>> PopulateWeatherReadings(SelectTarget info)
        {
            //All WeatherReadings
            if (info.plantNum == -1)
            {
                return await _context.WeatherReadings.Where(wr => wr.DateAndTime >= info.dateStart && wr.DateAndTime < info.dateEnd)
                                                        .OrderBy(wr => wr.DateAndTime)
                                                        .Select(wr => new SVMWeather(wr))
                                                        .ToListAsync();
            }
            else  //Plant Specific Readings
            {
                return await _context.WeatherReadings.Where(wr => wr.DateAndTime >= info.dateStart && wr.DateAndTime < info.dateEnd)
                                                     .Where(wr => wr.PlantNumber == info.plantNum)
                                                         .OrderBy(wr => wr.DateAndTime)
                                                         .Select(wr => new SVMWeather(wr))
                                                         .ToListAsync();
            }
        }

        /*
         * 
         * 
         */
        private async Task<List<SVMPowerSource>> PopulatePowerSources(SelectTarget info)
        {
            //Empty string means get all sources

            if (info.plantNum != -1)    //ALL power sources from ALL facilities
            {
                return await _context.PowerSources
                                .OrderBy(ps => ps.PlantNumber)
                                .Select(ps => new SVMPowerSource(ps))
                                .ToListAsync();
            }
            else                        //ALL power sources from a specific facility
            {
                return await _context.PowerSources.Where(ps => ps.PlantNumber.Equals(info.plantNum))
                                                    .Select(ps => new SVMPowerSource(ps))
                                                    .ToListAsync();
            }
        }

        private bool parseCheckBox(string s)
        {
            if (s != null && s.Equals("true"))
            {
                return true;
            }
            return false;
        }

        private int parsePlantNumber(string s)
        {
            if (!int.TryParse(s, out _))    //If s cannot be parsed into an int, return -1
            {
                return -1;
            }
            return int.Parse(s);
        }

        private bool WeatherReadingExists(int id)
        {
            return _context.WeatherReadings.Any(e => e.WeatherReadingID == id);
        }
    }
}
