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
        /*  
        *  Input:   None
        *  Output:  None
        *  Desc:    Information object for the selection form in info.cshtml
        */
    public class DateRange
    {
        public DateTime dateStart { get; set; } //  Shows the first day by default
        public DateTime dateEnd { get; set; }   //

        /*  
        *  Input:   None
        *  Output:  None
        *  Desc:    Default constructor with default values found in form
        */
        public DateRange()
        {
            dateStart = DateTime.Parse("05-15-2020");
            dateEnd = DateTime.Parse("05-16-2020");
        }

        /*  
        *  Input:   None
        *  Output:  None
        *  Desc:    Prints values to the debug console of the server
        */
        public void printDebug()
        {
            System.Diagnostics.Debug.WriteLine("dateStart: " + dateStart.ToString());
            System.Diagnostics.Debug.WriteLine("dateEnd: " + dateEnd.ToString());
        }
    }


    public class SolarController : Controller
    {
        private readonly SolarContext _context;

        public SolarController(SolarContext context)
        {
            _context = context;
        }

        /*  
        *  Input:   None
        *  Output:  Task, View
        *  Desc:    GET: /Solar
        *           Retrieves info.cshtml page with default selection
        */
        public async Task<IActionResult> Info()
        {
            //Get all Facilities for dropdown 
            DateRange info = new DateRange();
            SolarViewModel rtn = await SVMBuilder(info);

            return View(rtn);
        }

        /*
        * Input:    Starting and ending date URL parameters
        * Output:   SolarViewModel serialized to JSON containing data between the two dates
        * Desc:     GET: /Solar/api
        */
        [HttpGet, ActionName("API")]
        public async Task<ActionResult<IEnumerable<string>>> API(string start, string end)
        {
            System.Diagnostics.Debug.WriteLine("api start: " + start + " end: " + end);
            DateRange tgt = new DateRange
            {
                dateStart = DateTime.Parse(start),
                dateEnd = DateTime.Parse(end)
            };

            SolarViewModel rtn = await SVMBuilder(tgt);

            return Json(rtn);
        }

        /*  
        *  Input:   None (Reads HTML header data)
        *  Output:  Task, View
        *  Desc:    POST: /Solar/Info
        *           Reads form data and retrieves page including information based on selection
        */
        [HttpPost, ActionName("Info")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PostInfo()
        {

            DateRange tgt = new DateRange
            {
                dateStart = DateTime.Parse(HttpContext.Request.Form["startDate"]),
                dateEnd = DateTime.Parse(HttpContext.Request.Form["endDate"])
            };

            tgt.printDebug();

            //Create SelectInfo struct from form data
            SolarViewModel rtn = await SVMBuilder(tgt);

            return View(rtn);
        }

        /*  
        *  Input:   SelectTarget object
        *  Output:  Task, SolarViewModel object
        *  Desc:    Creates SolarViewModel object based on parameters in info object
        */
        private async Task<SolarViewModel> SVMBuilder(DateRange info)
        {
            //SVM default values are empty List<T>. Dates and all facilities are grabbed for GUI
            SolarViewModel rtn = new SolarViewModel
            {
                dateStart = info.dateStart,
                dateEnd = info.dateEnd,
                showPower = true,
                showWeather = true,
                plantNum = -1,

                facilities = await _context.Facilities.OrderBy(f => f.PlantNumber)
                                                        .Select(f => new SVMFacility(f))
                                                        .ToListAsync()
            };
            //TODO: These three methods make three seperate accesses to the database and need to probably be one query
            //              execution is deferred until the ToList() when dealing with an IQueryable

            //Populate WeatherReadings
            if (rtn.showWeather)
            {
                rtn.weatherReadings = await PopulateWeatherReadings(info);
            }

            //Populate PowerReadings and sources
            if (rtn.showPower)
            {
                rtn.powerReadings = await PopulatePowerReadings(info);
                rtn.powerSources = await PopulatePowerSources(info);
            }

            return rtn;
        }

        /*  
        *  Input:   SelectTarget object
        *  Output:  Task, List
        *  Desc:    Queries database for list of power readings based on target parameters
        */
        private async Task<List<SVMPower>> PopulatePowerReadings(DateRange info)
        {
            return await _context.PowerReadings.Where(pr => pr.DateAndTime >= info.dateStart && pr.DateAndTime < info.dateEnd)
                                                    .OrderBy(pr => pr.DateAndTime)
                                                    .Select(pr => new SVMPower(pr))
                                                    .ToListAsync();
            /*
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
            */
        }

        /*  
        *  Input:   SelectTarget object
        *  Output:  Task, List
        *  Desc:    Queries database for weather readings based on SelectTarger parameters
        */
        private async Task<List<SVMWeather>> PopulateWeatherReadings(DateRange info)
        {
            //All WeatherReadings
            return await _context.WeatherReadings.Where(wr => wr.DateAndTime >= info.dateStart && wr.DateAndTime < info.dateEnd)
                                                    .OrderBy(wr => wr.DateAndTime)
                                                    .Select(wr => new SVMWeather(wr))
                                                    .ToListAsync();
            /*
            else  //Plant Specific Readings
            {
                return await _context.WeatherReadings.Where(wr => wr.DateAndTime >= info.dateStart && wr.DateAndTime < info.dateEnd)
                                                     .Where(wr => wr.PlantNumber == info.plantNum)
                                                         .OrderBy(wr => wr.DateAndTime)
                                                         .Select(wr => new SVMWeather(wr))
                                                         .ToListAsync();
            }
            */
        }

        /*  
        *  Input:   SelectTarget object
        *  Output:  Task, List
        *  Desc:    Queries database for power sources based on SelectTarget parameters
        */
        private async Task<List<SVMPowerSource>> PopulatePowerSources(DateRange info)
        {
            return await _context.PowerSources
                            .OrderBy(ps => ps.PlantNumber)
                            .Select(ps => new SVMPowerSource(ps))
                            .ToListAsync();
            /*
            else                        //ALL power sources from a specific facility
            {
                return await _context.PowerSources.Where(ps => ps.PlantNumber.Equals(info.plantNum))
                                                    .Select(ps => new SVMPowerSource(ps))
                                                    .ToListAsync();
            }
            */
        }

        /*  
        *  Input:   String
        *  Output:  Boolean
        *  Desc:    Reads string, Returns true or false if string is equal to "true"
        *           Used for parsing checkbox value parameters from forms
        */
        private bool parseCheckBox(string s)
        {
            if (s != null && s.Equals("true"))
            {
                return true;
            }
            return false;
        }

        /*  
        *  Input:   String
        *  Output:  Integer
        *  Desc:    Converts string to an integer, on failure returns -1
        *           Expected to be used for parsing Plant Number from form data
        */
        private int parsePlantNumber(string s)
        {
            if (!int.TryParse(s, out _))    //If s cannot be parsed into an int, return -1
            {
                return -1;
            }
            return int.Parse(s);
        }
    }//End SolarControll
}
