﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SolarDB.Data;

namespace SolarDB.Migrations
{
    [DbContext(typeof(SolarContext))]
    partial class SolarContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "3.1.9")
                .HasAnnotation("Relational:MaxIdentifierLength", 128)
                .HasAnnotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn);

            modelBuilder.Entity("SolarDB.Models.PowerReading", b =>
                {
                    b.Property<int>("PowerReadingID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn);

                    b.Property<double>("AC_Power")
                        .HasColumnType("float");

                    b.Property<double>("DC_Power")
                        .HasColumnType("float");

                    b.Property<double>("DailyYield")
                        .HasColumnType("float");

                    b.Property<DateTime>("DateAndTime")
                        .HasColumnType("datetime2");

                    b.Property<string>("SourceKey")
                        .HasColumnType("nvarchar(max)");

                    b.Property<double>("TotalYield")
                        .HasColumnType("float");

                    b.HasKey("PowerReadingID");

                    b.ToTable("PowerReadings");
                });

            modelBuilder.Entity("SolarDB.Models.PowerSource", b =>
                {
                    b.Property<int>("PowerSourceID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn);

                    b.Property<int>("PlantNumber")
                        .HasColumnType("int");

                    b.Property<string>("SourceKey")
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("PowerSourceID");

                    b.ToTable("PowerSources");
                });

            modelBuilder.Entity("SolarDB.Models.WeatherReading", b =>
                {
                    b.Property<int>("WeatherReadingID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasAnnotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn);

                    b.Property<double>("AmbientTemp")
                        .HasColumnType("float");

                    b.Property<DateTime>("DateAndTime")
                        .HasColumnType("datetime2");

                    b.Property<double>("Irridation")
                        .HasColumnType("float");

                    b.Property<double>("ModuleTemp")
                        .HasColumnType("float");

                    b.Property<int>("PlantNumber")
                        .HasColumnType("int");

                    b.HasKey("WeatherReadingID");

                    b.ToTable("WeatherReadings");
                });
#pragma warning restore 612, 618
        }
    }
}
