using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace SolarDB.Migrations
{
    public partial class Init : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Facilities",
                columns: table => new
                {
                    FacilityID = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlantNumber = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Facilities", x => x.FacilityID);
                });

            migrationBuilder.CreateTable(
                name: "PowerReadings",
                columns: table => new
                {
                    PowerReadingID = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SourceKey = table.Column<string>(nullable: true),
                    DateAndTime = table.Column<DateTime>(nullable: false),
                    DC_Power = table.Column<double>(nullable: false),
                    AC_Power = table.Column<double>(nullable: false),
                    DailyYield = table.Column<double>(nullable: false),
                    TotalYield = table.Column<double>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PowerReadings", x => x.PowerReadingID);
                });

            migrationBuilder.CreateTable(
                name: "PowerSources",
                columns: table => new
                {
                    PowerSourceID = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SourceKey = table.Column<string>(nullable: true),
                    PlantNumber = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PowerSources", x => x.PowerSourceID);
                });

            migrationBuilder.CreateTable(
                name: "WeatherReadings",
                columns: table => new
                {
                    WeatherReadingID = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlantNumber = table.Column<int>(nullable: false),
                    DateAndTime = table.Column<DateTime>(nullable: false),
                    AmbientTemp = table.Column<double>(nullable: false),
                    ModuleTemp = table.Column<double>(nullable: false),
                    Irridation = table.Column<double>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeatherReadings", x => x.WeatherReadingID);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Facilities");

            migrationBuilder.DropTable(
                name: "PowerReadings");

            migrationBuilder.DropTable(
                name: "PowerSources");

            migrationBuilder.DropTable(
                name: "WeatherReadings");
        }
    }
}
