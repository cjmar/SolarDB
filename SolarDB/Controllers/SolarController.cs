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
            var readings = from r in _context.WeatherReadings select r;
            readings = readings.OrderBy(d => d.DateAndTime);

            return View(await readings.ToListAsync());
        }

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

        private bool WeatherReadingExists(int id)
        {
            return _context.WeatherReadings.Any(e => e.WeatherReadingID == id);
        }
    }
}
