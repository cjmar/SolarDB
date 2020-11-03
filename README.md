# SolarDB

Work in progress 
ASP Core 3.1
Visual Studios 2019

This web app utilizes data downloaded from [here](https://www.kaggle.com/anikannal/solar-power-generation-data), which can also be found in the Data folder of this project.
There is also a script which fixes an unparsable date format found in Plant_1_Generation_Data.csv. The data is taken from two solar power plants in India over a period of 
34 days.

Currently all this webapp does is parse these 4 files into a database using the schema found in solardb_tables.vsd Visio file.

* Plant_1_Generation_Data.csv
* Plant_1_Weather_Sensor_Data.csv

* Plant_2_Generation_Data.csv
* Plant_1_Weather_Sensor_Data.csv

The webapp will have interactive graphs for viewing the data and attempt to answer a few questions regarding solar power plants.


1. Can we predict the power generation for next couple of days? - this allows for better grid management
2. Can we identify the need for panel cleaning/maintenance?
3. Can we identify faulty or suboptimally performing equipment?


