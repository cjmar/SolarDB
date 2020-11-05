using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using SolarDB.Data;
using SolarDB.Models;
using SolarDB.ViewModel;

namespace SolarDB.Controllers
{
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

            var facList = await _context.Facilities.ToListAsync();

            var wReadings1 = await _context.WeatherReadings.Where(wr => wr.PlantNumber == facList.ElementAt(0).PlantNumber)
                                                            .OrderBy(d => d.DateAndTime)
                                                            .Take(50)
                                                            .ToListAsync();

            var wReadings2 = await _context.WeatherReadings.Where(wr => wr.PlantNumber == facList.ElementAt(1).PlantNumber)
                                                            .OrderBy(d => d.DateAndTime)
                                                            .Take(50)
                                                            .ToListAsync();

            return View(new SolarViewModel()
            {
                weatherReadings = wReadings1.Concat(wReadings2),
                facilities = facList
            });
            //return View(await readings.ToListAsync());
        }


        // POST: Solar
        [HttpPost, ActionName("Info")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PostInfo()
        {

            string formText = HttpContext.Request.Form["TestString"];

            System.Diagnostics.Debug.WriteLine("Recieved form data text: " + formText);

            //HttpContext.Request.Form["UserName"] + ". You are " + HttpContext.Request.Form["UserAge"];

            if (!(formText == null))
            {
                DateTime dt = DateTime.Parse(formText);
                ViewBag.form_data = dt.ToString("dd/MM/yyyy HH:mm:ss");
            }
            else
            {
                ViewBag.form_data = "Form text was null";
            }
            

            return View(new SolarViewModel());
        }

        /*

        // GET: Solar/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var weatherReading = await _context.WeatherReadings
                .FirstOrDefaultAsync(m => m.WeatherReadingID == id);
            if (weatherReading == null)
            {
                return NotFound();
            }

            return View(weatherReading);
        }

        // GET: Solar/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Solar/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("WeatherReadingID,time,AmbientTemp,ModuleTemp,Irridation")] WeatherReading weatherReading)
        {
            if (ModelState.IsValid)
            {
                _context.Add(weatherReading);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(weatherReading);
        }

        // GET: Solar/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var weatherReading = await _context.WeatherReadings.FindAsync(id);
            if (weatherReading == null)
            {
                return NotFound();
            }
            return View(weatherReading);
        }

        // POST: Solar/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("WeatherReadingID,time,AmbientTemp,ModuleTemp,Irridation")] WeatherReading weatherReading)
        {
            if (id != weatherReading.WeatherReadingID)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(weatherReading);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!WeatherReadingExists(weatherReading.WeatherReadingID))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            return View(weatherReading);
        }

        // GET: Solar/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var weatherReading = await _context.WeatherReadings
                .FirstOrDefaultAsync(m => m.WeatherReadingID == id);
            if (weatherReading == null)
            {
                return NotFound();
            }

            return View(weatherReading);
        }

        // POST: Solar/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var weatherReading = await _context.WeatherReadings.FindAsync(id);
            _context.WeatherReadings.Remove(weatherReading);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        */


        /*  Creates a SolarViewModel from database
         * 
         *  Expects parameters used to select tables
         *  Null values resort to default parmeters
         *  
         *    Param         ||  Default value
         *  Shared:
         *      Date start      Earliest date in records
         *      Date finish     Latest date in records
         *      PlantNumber     First plant in record (not both)
         *  
         *  PowerArray:
         *      SourceKey
         *      Facility
         *      
         *  PowerReading:
         *      ArrayKey
         *      DC
         *      AC
         *      Daily
         *      Total
         *      
         *  WeatherReading:
         *      Facility
         *      Ambient
         *      Module
         *      Irridation
         *      
         */

        private SolarViewModel SVMBuilder()
        {
            SolarViewModel rtn = new SolarViewModel();

            return rtn;
        }

        private bool WeatherReadingExists(int id)
        {
            return _context.WeatherReadings.Any(e => e.WeatherReadingID == id);
        }
    }
}
