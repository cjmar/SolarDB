# SolarDB

Work in progress 
ASP Core 3.1
Visual Studios 2019

This web app utilizes data downloaded from [here](https://www.kaggle.com/anikannal/solar-power-generation-data), which can also be found in the Data folder of this project.
There is also a script which fixes an unparsable date format found in Plant_1_Generation_Data.csv. The data is taken from two solar power plants in India over a period of 
34 days.

This webapp parses these 4 files into a database using the schema found in solardb_tables.vsd Visio file.

* Plant_1_Generation_Data.csv
* Plant_1_Weather_Sensor_Data.csv

* Plant_2_Generation_Data.csv
* Plant_1_Weather_Sensor_Data.csv

It has a real time graph which can be used to answer a few questions regarding solar power plants.

1. Can we predict the power generation for next couple of days? - this allows for better grid management
2. Can we identify the need for panel cleaning/maintenance?
3. Can we identify faulty or suboptimally performing equipment?

The framework will also have an API for requesting and adding more data. This will allow for the framework to act as a core comcponent for logging information and managing a power plant in day to day operations.

Static version of this website with 8 days worth of data can be found here: https://cjmar.github.io/
