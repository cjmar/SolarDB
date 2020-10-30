using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SolarDB.Data;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SolarDB.Models
{
    public static class SolarDBSeeder
    {
        public static void Init(IServiceProvider serviceProvider)
        {
            using (var context = new SolarContext(
                serviceProvider.GetRequiredService<DbContextOptions<SolarContext>>()
                    ))
            {
                if(context.WeatherReadings.Any())
                {
                    return;
                }

                /*  Seed the database
                 * 
                 *  Seeds using data from 4 CSV files which can be found in the Data folder
                 *  
                 *  Plant_1_Generation_Data.csv
                 *  Plant_1_Weather_Sensor_Data.csv
                 *  
                 *  Plant_2_Generation_Data.csv
                 *  Plant_1_Weather_Sensor_Data.csv
                 */
                //ReadInWeatherSensorData("Plant_1_Weather_Sensor_Data.csv", context);
                ReadInGenerationData("Plant_1_Generation_Data.csv", context);
                ReadInGenerationData("Plant_2_Generation_Data.csv", context);

                ReadInWeatherSensorData("Plant_1_Weather_Sensor_Data.csv", context);
                ReadInWeatherSensorData("Plant_2_Weather_Sensor_Data.csv", context);
            }
        }

        /*  Expects a csv file containing weather sensor data, in the Data folder
         *  Format: DATE_TIME,PLANT_ID,SOURCE_KEY,AMBIENT_TEMPERATURE,MODULE_TEMPERATURE,IRRADIATION
         *  
         *  Reads one table into database
         *      WeatherReading : DATE_TIME, PLANT_ID, AMBIENT_TEMPERATURE, MODULE_TEMPERATURE, IRRADATION
         *      
         *  Call once per file
         */
        static void ReadInWeatherSensorData(string file_in, SolarContext context)
        {
            try
            {
                using (var reader = new StreamReader("Data/" + file_in))
                {
                    string line;
                    System.Diagnostics.Debug.WriteLine("Seeding Database with " + file_in);

                    reader.ReadLine(); //First line is human stuff

                    while ((line = reader.ReadLine()) != null)
                    {
                        var values = line.Split(',');

                        /*
                        WeatherReading {
                            PK int WeatherReadingID, auto increment
                            DateTime DateAndTime, 
                            double AmbientTemp, 
                            double ModuleTemp, 
                            double Irridation }
                        */

                        DateTime dateTime = DateTime.Parse(values[0]);
                        int plantNum = int.Parse(values[1]);
                        double aTemp = double.Parse(values[3]);
                        double mTemp = double.Parse(values[4]);
                        double irrid = double.Parse(values[5]);

                        WeatherReading r = new WeatherReading()
                        {
                            DateAndTime = dateTime,
                            PlantNumber = plantNum,
                            AmbientTemp = aTemp,
                            ModuleTemp = mTemp,
                            Irridation = irrid
                        };

                        context.WeatherReadings.Add(r);
                    }
                    context.SaveChanges();
                    System.Diagnostics.Debug.WriteLine("Finished successfully.");
                }
            }
            catch (Exception e)
            {
                System.Diagnostics.Debug.WriteLine("Error reading from file '" + file_in + "': " + e.Message);
            }
        }

        /*  Expects a csv file containing Power Generation data, in the Data folder
         *  Format: DATE_TIME,PLANT_ID,SOURCE_KEY,DC_POWER,AC_POWER,DAILY_YIELD,TOTAL_YIELD
         *  
         *  Reads two tables into database
         *      PowerSource  : SOURCE_KEY, PLANT_ID
         *      PowerReading : SOURCE_KEY, DATE_TIME, DC_POWER, AC_POWER, DAILY_YIELD, TOTAL_YIELD
         *      
         *  Call once per file
         */
        static void ReadInGenerationData(string file_in, SolarContext context)
        {
            try
            {
                using (var reader = new StreamReader("Data/" + file_in))
                {
                    string line;
                    System.Diagnostics.Debug.WriteLine("Seeding Database with " + file_in);

                    reader.ReadLine(); //First line is human stuff

                    //Quick lookup for already entered Source_Key's
                    List<string> sourceKeys = new List<string>();

                    while ((line = reader.ReadLine()) != null)
                    {
                        var values = line.Split(',');

                        /*
                            PowerSource {
                                PK int PowerSourceID, auto increment
                                string SourceKey,
                                int PlantNumber }
                          
                            PowerReading {
                                PK int PowerReadingID, auto increment
                                DateTime DateAndTime, 
                                string SourceKey,
                                double DC_Power, 
                                double AC_Power, 
                                double Irridation }
                        */

                        DateTime dateTime = DateTime.Parse(values[0]);
                        int plantNum = int.Parse(values[1]);
                        string sourceKey = values[2];
                        double dc_power = double.Parse(values[3]);
                        double ac_power = double.Parse(values[4]);
                        double daily_y = double.Parse(values[5]);
                        double total_y = double.Parse(values[6]);

                        //Add a new PowerSource to database if it doesnt exist already
                        if (sourceKeys.FirstOrDefault(s => s.Equals(sourceKey)) == null)
                        {
                            PowerSource s = new PowerSource()
                            {
                                SourceKey = sourceKey,
                                PlantNumber = plantNum
                            };

                            context.PowerSources.Add(s);
                            sourceKeys.Add(sourceKey);
                        }

                        PowerReading r = new PowerReading()
                        {
                            DateAndTime = dateTime,
                            SourceKey = sourceKey,
                            DC_Power = dc_power,
                            AC_Power = ac_power,
                            DailyYield = daily_y,
                            TotalYield = total_y
                        };

                        context.PowerReadings.Add(r);
                    }
                    context.SaveChanges();
                    System.Diagnostics.Debug.WriteLine("Finished successfully.");
                }
            }
            catch (Exception e)
            {
                System.Diagnostics.Debug.WriteLine("Error reading from file '" + file_in + "': " + e.Message);
            }
        }
    }
}
