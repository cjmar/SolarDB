using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SolarDB.Data;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace SolarDB.Models
{
    public static class SolarDBSeeder
    {
        static bool stampFixed = false;

        public static void Init(IServiceProvider serviceProvider)
        {
            using (var context = new SolarContext(
                serviceProvider.GetRequiredService<DbContextOptions<SolarContext>>()
                    ))
            {
                if(context.WeatherReadings.Any())
                {
                    //If any readings exist, then database is already seeded and missing records added
                    stampFixed = true;
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

        /*  
        *  Input:   String file name, SolarContext database
        *  Output:  None
        *  Desc:    Reads weather sensor data from file_name into database
        */
        static void ReadInWeatherSensorData(string file_in, SolarContext context)
        {
            try
            {
                using (var reader = new StreamReader("Data/" + file_in))
                {
                    string line;
                    bool firstRun = true;
                    System.Diagnostics.Debug.WriteLine("Seeding Database with " + file_in);

                    reader.ReadLine(); //First line is human stuff

                    while ((line = reader.ReadLine()) != null)
                    {
                        var values = line.Split(',');

                        if(firstRun)
                        {
                            AddPlantNumber(values[1], context);
                            firstRun = false;
                        }

                        /*
                        WeatherReading {
                            PK int WeatherReadingID, auto increment
                            DateTime DateAndTime, 
                            double AmbientTemp, 
                            double ModuleTemp, 
                            double Irradiation }
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
                            Irradiation = irrid
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

        /*  
        *  Input:   String file_name, SolarContext database
        *  Output:  None
        *  Desc:    Reads power reading data from file into database
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
                                double Irradiation }
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

        /*  
        *  Input:   string plant number, SolarContext database
        *  Output:  None
        *  Desc:    Reads in plan numbers into database, called from ReadInWeatherSensorData()
        */
        static void AddPlantNumber(string value, SolarContext context)
        {
            int num = int.Parse(value);

            //Get how many facilities exist with PlantNumber 
            int? exists = context.Facilities
                         .Where(f => f.PlantNumber == num)
                         .Count();

            /*
                Facility {
                    PK int FacilityID, auto increment
                    int PlantNumber }
            */
            if (!(exists > 0))
            {
                Facility f = new Facility()
                {
                    PlantNumber = num,
                };
                context.Facilities.Add(f);
                context.SaveChanges();
                System.Diagnostics.Debug.WriteLine("Added Facility " + num + " to Database.");
            }
        }

        /*  
        *  Input:   IServiceProvider - to get database context
        *  Output:  None
        *  Desc:    Original CSV files are missing large chunks of data. This function is called after database seed to add data where its datestamp is missing
        *           This function is a bandaid and is very inefficient, modifications needs to be made to Weather/Power reading functions to more efficiently
        *               fill in this data. On the other hand, this function is only ever ran once so that will probably never happen.
        */
        public static void AddMissingDateStamps(IServiceProvider serviceProvider)
        {
            if(!stampFixed)
            {
                System.Diagnostics.Debug.WriteLine("Searching for and adding missing date values to Database.");

                using (var context = new SolarContext(
                        serviceProvider.GetRequiredService<DbContextOptions<SolarContext>>()
                    ))
                {
                    //Invoking these takes a long time. It scans the entire database
                    addMissingWeather(context);
                    addMissingPower(context);
                }
            }
            stampFixed = true;
        }

        /*  
        *  Input:   SolarContext database
        *  Output:  None
        *  Desc:    Called by AddMissingDatestamps to inefficiently add in missing power readings with -1 values
        */
        static void addMissingPower(SolarContext context)
        {
            int plant1 = 4135001;
            int plant2 = 4136001;
            DateTime firstDate = DateTime.Parse("05-15-2020 00:00");
            DateTime lastDate = DateTime.Parse("06-17-2020 23:45");
            int count = 0;
            int recordsAdded = 0;

            //Each power source array is treated seperately
            Dictionary<string, List<PowerReading>> sources5001 = new Dictionary<string, List<PowerReading>>();
            Dictionary<string, List<PowerReading>> sources6001 = new Dictionary<string, List<PowerReading>>();
            List<PowerSource> src = context.PowerSources.Where(ps => ps.PlantNumber == plant1).ToList();

            //Populate dictionary with source keys and power readings for that source ordered by date
            foreach (PowerSource ps in src)
            {
                sources5001.Add(ps.SourceKey, context.PowerReadings.Where(pr => pr.SourceKey == ps.SourceKey).OrderBy(pr => pr.DateAndTime).ToList());
                count += sources5001[ps.SourceKey].Count();
            }

            src = context.PowerSources.Where(ps => ps.PlantNumber == plant2).ToList();
            foreach (PowerSource ps in src)
            {
                sources6001.Add(ps.SourceKey, context.PowerReadings.Where(pr => pr.SourceKey == ps.SourceKey).OrderBy(pr => pr.DateAndTime).ToList());
                count += sources6001[ps.SourceKey].Count();
            }

            System.Diagnostics.Debug.WriteLine(count + " power records found. Scanning for missing records.");

            //Iterate over all the sourceKeys in each sources list comparing dates
            foreach (KeyValuePair<string, List<PowerReading>> s in sources5001)
            {
                recordsAdded += addMissingArray(firstDate, lastDate, s, context);
            }
            foreach (KeyValuePair<string, List<PowerReading>> s in sources6001)
            {
                recordsAdded += addMissingArray(firstDate, lastDate, s, context);
            }

            count = context.PowerReadings.Count();
            System.Diagnostics.Debug.WriteLine(recordsAdded + " total records were added. " + count + " total records");
        }

        /*  
        *  Input:   DateTime, DateTime, KeyValuePair<string, List>, SolarContext
        *           DateTime fd - firstDate in CSV files
        *           DateTime ld - lastDate in CSV files
        *           KVP<string, List> - List to scan
        *           SolarContext - database
        *  Output:  int - Number of missing records found
        *  Desc:    Scans a List found in KVP<string, list>, adds missing values to database
        */
        static int addMissingArray(DateTime fd, DateTime ld, KeyValuePair<string, List<PowerReading>> s, SolarContext context)
        {
            DateTime currDate = fd;
            int index = 0;
            int records = 0;

            while (currDate != ld)
            {
                if (index > s.Value.Count)  //List doesnt include readings to end of date
                {
                    PowerReading r = new PowerReading()
                    {
                        DateAndTime = currDate,
                        SourceKey = s.Key,
                        DC_Power = -1.0,
                        AC_Power = -1.0,
                        DailyYield = -1.0,
                        TotalYield = -1.0
                    };
                    context.PowerReadings.Add(r);
                    records++;
                }
                else if (currDate != s.Value[index].DateAndTime) //List missing readings in middle 
                {
                    PowerReading r = new PowerReading()
                    {
                        DateAndTime = currDate,
                        SourceKey = s.Key,
                        DC_Power = -1.0,
                        AC_Power = -1.0,
                        DailyYield = -1.0,
                        TotalYield = -1.0
                    };
                    context.PowerReadings.Add(r);
                    records++;
                }
                else index++;   //Continue

                currDate = currDate.AddMinutes(15);
            }
            //Search for missing date values in power table
            context.SaveChanges();
            System.Diagnostics.Debug.WriteLine("Finished power array " + s.Key);

            return records;
        }

        /*  
        *  Input:   SolarContext database
        *  Output:  None
        *  Desc:    Scans all weather readings in the database looking for missing records based on date
        */
        static void addMissingWeather(SolarContext context)
        {
            int plant1 = 4135001;
            int plant2 = 4136001;
            DateTime firstDate = DateTime.Parse("05-15-2020 00:00");
            DateTime lastDate = DateTime.Parse("06-17-2020 23:45");
            int recordsAdded = 0;

            //Search for missing date values in weather table
            List<WeatherReading> readings5001 = context.WeatherReadings.Where(wr => wr.PlantNumber == 4135001).OrderBy(wr => wr.DateAndTime).ToList();
            List<WeatherReading> readings6001 = context.WeatherReadings.Where(wr => wr.PlantNumber == 4136001).OrderBy(wr => wr.DateAndTime).ToList();

            System.Diagnostics.Debug.WriteLine((readings5001.Count + readings6001.Count) + " weather records found. Scanning for missing records.");

            DateTime currDate = firstDate;
            int index5001 = 0;
            int index6001 = 0;



            while (currDate != lastDate)
            {
                if (index5001 > readings5001.Count)  //List doesnt include readings to end of date
                {
                    WeatherReading r = new WeatherReading()
                    {
                        DateAndTime = currDate,
                        PlantNumber = plant1,
                        AmbientTemp = -1,
                        ModuleTemp = -1,
                        Irradiation = -1
                    };
                    context.WeatherReadings.Add(r);
                    recordsAdded++;
                }
                else if (currDate != readings5001[index5001].DateAndTime) //List missing readings in middle 
                {
                    WeatherReading r = new WeatherReading()
                    {
                        DateAndTime = currDate,
                        PlantNumber = plant1,
                        AmbientTemp = -1,
                        ModuleTemp = -1,
                        Irradiation = -1
                    };
                    context.WeatherReadings.Add(r);
                    recordsAdded++;
                }
                else index5001++;   //Continue

                if (index6001 > readings6001.Count)  //List doesnt include readings to end of date
                {
                    WeatherReading r = new WeatherReading()
                    {
                        DateAndTime = currDate,
                        PlantNumber = plant2,
                        AmbientTemp = -1,
                        ModuleTemp = -1,
                        Irradiation = -1
                    };
                    context.WeatherReadings.Add(r);
                    recordsAdded++;
                }
                else if (currDate != readings6001[index6001].DateAndTime) //List missing readings in middle 
                {
                    WeatherReading r = new WeatherReading()
                    {
                        DateAndTime = currDate,
                        PlantNumber = plant2,
                        AmbientTemp = -1,
                        ModuleTemp = -1,
                        Irradiation = -1
                    };
                    context.WeatherReadings.Add(r);
                    recordsAdded++;
                }
                else index6001++;   //Continue

                currDate = currDate.AddMinutes(15); //I don't know why this has to return a DateTime
            }
            //Search for missing date values in weather table
            context.SaveChanges();
            int count = context.WeatherReadings.Count();
            System.Diagnostics.Debug.WriteLine(recordsAdded + " records were added. " + count + " total records");
        }
    }
}
