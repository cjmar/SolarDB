// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

//This file is included in the header

//Changes the value attribute depending on checked value
function checkboxValue(id)
{
    let element = document.getElementById(id);

    if (element.checked)
        element.setAttribute("value", "true");

    else element.setAttribute("value", "false");
}

function setCheckbox(id, value)
{
    let element = document.getElementById(id);
    element.checked = value;
    if (value)
        element.setAttribute("value", "true");

    else element.setAttribute("value", "false");
}

//Basic data object 
var data = [];
data.getFac = function (facNum)
{
    return this.find(e => e.facility == facNum)
};
data.getSrc = function (srcStr) //-1 means just grab first src
{
    for (i = 0; i < this.length; i++) {
        if (this[i][srcStr]) {
            return this[i][srcStr];
        }
        else if (srcStr == -1) {
            if (powerSource.length > 0)
            { return powerSource[0].sourceKey;}
        }
    }
};

/*  Reads all the passed @model lists into data[]
 *  data JSON looks like this
 *  data{
 *      obj { 
 *          "facility" : facNum,
 *          "dates" : [],
 *          "weather" : [ {"ambientTemp" : n, "moduleTemp" : n, "irradiation" : n} ], 
 *          "sourceKey of power array to string" : [ {"dC_power" : n, "aC_power" : n, "dailyYield" : n, "totalYield" : n} ]
 *          }//end obj
 *      getFac(facNum); Returns obj where facility = facNum, or undefined
 *      getSrc(srcStr); Returns source array in obj where sourceKey = srcStr, or undefined
 *  }//end data
 * 
 */
function parseData() {
    //Check used to make sure dates arent added multiple times
    let dateAdded = 0;
    data["dates"] = [];     //List of all the dates
    data["facNums"] = [];   //List of all the facility numbers
    data["weatherExists"] = weather.length > 0;
    data["powerExists"] = power.length > 0;

    if (plantSelect == -1)
    {
        plantSelect = 4135001;
    }
    //Add each of the facilities
    for (i = 0; i < facilities.length; i++) {
        data.push({ "facility": facilities[i]["plantNumber"], "weather": [], "srcKeys" : [] });
        data.facNums.push(facilities[i]["plantNumber"]);
    }
    for (i = 0; i < weather.length; i++) {
        let d = data.getFac(weather[i].plantNumber);
        if (d) {
            d.weather.push(
                {
                    "ambientTemp": weather[i].ambientTemp, "moduleTemp": weather[i].moduleTemp, "irradiation": weather[i].irradiation
                });
            if (plantSelect == weather[i].plantNumber)
            {
                data.dates.push(weather[i].dateAndTime);
            }
        }
    }
    if (weather.length > 0)
    {
        dateAdded = 1;
    }
    for (let i = 0; i < powerSource.length; i++) {
        let d = data.getFac(powerSource[i].plantNumber);
        if (d) {
            let key = powerSource[i].sourceKey;
            d.srcKeys.push(key);
            d[key] = [];
        }
    }
    let src;

    for (let i = 0; i < power.length; i++) {
        let d = data.getSrc(power[i].sourceKey);
        if (d)
        {
            if(!src) src = power[i].sourceKey;
            d.push(
            {
                "dC_Power": power[i]["dC_Power"], "aC_Power": power[i]["aC_Power"], "dailyYield": power[i]["dailyYield"], "totalYield": power[i]["totalYield"]
            });
        }
        if (!dateAdded && src == power[i].sourceKey)
        {
            data.dates.push(power[i].dateAndTime);
        }
    }
}

//{"plantNumber":x}
//{"plantNumber":x,"dateAndTime":"x","ambientTemp":x,"moduleTemp":x,"irridation":x}
//{"sourceKey":"x","dateAndTime":"x","dC_Power":x,"aC_Power":x,"dailyYield":x,"totalYield":x}
const charts = (() =>
{
    let chartList = []; //Array of chart
    let canvas;
    let context;
    let offSet = 50;
    let xLabels = [];   //Array of strings for dates
    let dayCount = 1;   //If days are over a value then a special consideration is made for the xLabel
    let daySwitchNum = 3;   //After this many days, it just shows dates instead of time

    //Reads lengths of each data point and inits a chart for it
    const init = (id_in) =>
    {
        canvas = document.getElementById(id_in);
        context = canvas.getContext("2d");
        context.font = "15px Arial";
        context.lineWidth = 1;

        //Prefer weather readings for x axis labels. 
        if (weather && weather.length > 0) {
            regChart("weather");
            populateXlabel(weather, 1);
        } 
        else if (power && power.length > 0)
        {
            let powerArrayNum = 22;
            populateXlabel(power, powerArrayNum);
        }
        if (power && power.length > 0) 
            regChart("power");
        
        update();
    }

    const regChart = (id_in) =>
    {
        chartList.push(chart(id_in));
        chartList[chartList.length - 1].init(canvas, context);
    }

    const getChart = (id_in) =>
    {
        return chartList.find(ch => ch.id == id_in);
    }

    //Draws all the charts and the y axis
    const update = () =>
    {
        renderAxis();
        if (getChart("power")) { getChart("power").plotPower() }
        if (getChart("weather")) { getChart("weather").plotWeather(); }
    }

    const populateXlabel = (arr, step) =>
    {
        for (i = 0; i < arr.length; i += step)
        {
            let text = arr[i]["dateAndTime"];
            var n = text.indexOf("T");
            if (text.substring(n + 1) == "00:00:00")    //Midnight
            {
                dayCount++;
            }
            if (text.substring(n + 4, n + 6) == "00")    //even hour
            {
                xLabels.push([text.substring(5, n), text.substring(n + 1, n + 6)]);
            }
        }
        if (dayCount > daySwitchNum)
        {
            let temp = [];
            for (i = 0; i < xLabels.length; i++)
            {
                if (!temp.find(x => x[0] == xLabels[i][0]))
                    temp.push([xLabels[i][0], xLabels[i][0]]);
            }
            xLabels = temp.slice(0);
        }
    }

    //Draws y axis with date stamps
    const renderAxis = () =>
    {
        context.beginPath();
        //Draw the x axis line
        context.fillRect(offSet, canvas.clientHeight - offSet, canvas.clientWidth, 3);  //lineTo() is blurry,
        context.stroke();
        //Y axis line
        context.fillRect(offSet, 0, 3, canvas.clientHeight - offSet);
        context.stroke();

        //Draw stamps for DateTime data
        //Not every 15 minute interval is accounted for in each day
        let y = canvas.clientHeight;

        if (xLabels.length == 0) { xLabels.push("No Data") }
        let xStep = (canvas.clientWidth - (offSet * 2)) / (xLabels.length);
        if (dayCount > daySwitchNum) { dayCount = 1; }


        for (i = 0; i < xLabels.length; i += dayCount)
        {
            let x = (xStep * i) + offSet;
            draw45DegreeText(xLabels[i][1], x, y);
        }
    }

    //Actually -45 degrees
    //Draws slanted text at the x, y coored passed
    const draw45DegreeText = (text, x, y) =>
    {
        context.save();
        let r = (-45 * Math.PI / 180);
        context.translate(x - 13, y);
        context.rotate(r);
        context.fillText(text, 0, 0);
        context.restore();
        context.fillRect(x, y - 50, 4, 10);
    }

    return {init, getChart, update};
})();

//Factory for a graph
//Allows multiple graphs to be drawn to a single canvas 
const chart = (chartName) =>
{
    let id = chartName;
    let xScale = 1;
    let yScale = 1;

    let context;
    let canvas;

    let chartW;
    let chartH;
    let offSet = 50;        //Space for the x, y axis

    //For now the idea is to graph Irradation along the timeframe of the first day
    const init = (can, ctxt) =>
    {
        canvas = can;
        context = ctxt;
        //context.strokeStyle = "#000000"; // Grid line color
        //context.beginPath();

        chartW = canvas.clientWidth - (offSet * 2);
        chartH = canvas.clientHeight - offSet;
    }

    //Draw power data
    const plotPower = () =>
    {
        xScale = chartW / power.length;

       
    }

    //Draws weather data
    //This basically needs to be completely rewritten
    const plotWeather = () =>
    {
        xScale = chartW / weather.length;

        //Split the data points into seperate facilities
        let fac = [];
        for (i = 0; i < facilities.length; i++) //facilities length is by default always 2 for gui
        {
            let plant = facilities[i]["plantNumber"];
            let ap = [[xScale + offSet + 4, 0], [0, 0], "#ff0000", -1]; //{ [lastX, lastY], [nowX, nowY], color, yscale , plantNum}
            let mp = [[xScale + offSet + 4, 0], [0, 0], "#ffa500", -1]; //#ffa500
            let rp = [[xScale + offSet + 4, 0], [0, 0], "#999900", -1];

            let f = [ap, mp, rp, plant];
            fac.push(f);
        }
        
        let ambPoint = [[xScale + offSet + 4, 0], [0, 0], "#ff0000"]; //{ [lastX, lastY], [nowX, nowY], color, yscale }
        let modPoint = [[xScale + offSet + 4, 0], [0, 0], "#ffa500"]; //#ffa500
        let radPoint = [[xScale + offSet + 4, 0], [0, 0], "#999900"];

        let maxAmb = -1;
        let maxMod = -1;
        let maxRad = -1;

        let facNum = 0;
        //"ambientTemp" ,"moduleTemp", "irradiation"
        //Find the max values for each point type
        for (i = 0; i < weather.length; i++)                    //Linear scan to get setup data. y scaling
        {
            maxAmb = (maxAmb > weather[i]["ambientTemp"]) ? maxAmb : weather[i]["ambientTemp"];
            maxMod = (maxMod > weather[i]["moduleTemp"]) ? maxMod : weather[i]["moduleTemp"];
            maxRad = (maxRad > weather[i]["irradiation"]) ? maxRad : weather[i]["irradiation"];

        }
        //FACILITY SET Y SCALE
        for (i = 0; i < facilities.length; i++) {
            fac[i][0][3] = chartH / maxAmb / 2;
            fac[i][1][3] = chartH / maxMod / 2;
            fac[i][2][3] = chartH / maxRad / 3;
        }
        let maxC = (maxAmb > maxMod) ? maxAmb : maxMod;
        let maxCScale = chartH / 50 / 2;
        let radScale = chartH / 0.5 / 3;

        console.log("Max Ambient " + maxAmb);
        console.log("Max Module  " + maxMod);
        console.log("Max Rad     " + maxRad);

        ambPoint[3] = chartH / maxC / 2; //These scale values to the chart height
        modPoint[3] = chartH / maxC / 2;
        radPoint[3] = chartH / maxRad / 3;

        //drawLabel(ambPoint[2], "Ambient Temp", chartH - maxAmb * ambPoint[3], "right"); //These are close
        //drawLabel(modPoint[2], "Module Temp", chartH - maxMod * modPoint[3], "right");
        //drawLabel(radPoint[2], "Irradiation", chartH - maxRad * radPoint[3], "right");

        //Draw 5 labels for temperature on right side
        for (i = 1; i < 6; i++)
        {
            drawLabel("#ff5200", (i * 10 + " C"), chartH - (i * 10) * maxCScale, "right"); //Temp increments of 25
        }

        for (i = 1; i < 3; i++)
        {
            drawLabel("#999900", (i * 0.5 + " Rad"), chartH - (i * 0.5) / 2 * radScale, "left");
        }

        //Set first values
        ambPoint[0][1] = chartH - (weather[0]["ambientTemp"] * ambPoint[3]);
        modPoint[0][1] = chartH - (weather[0]["moduleTemp"] * modPoint[3]);
        radPoint[0][1] = chartH - (weather[0]["irradiation"] * radPoint[3]);

        for (i = 0; i < weather.length; i++)
        {
            setPoint(ambPoint, i, weather[i]["ambientTemp"]);
            plotPoint(ambPoint);

            setPoint(modPoint, i, weather[i]["moduleTemp"]);
            plotPoint(modPoint);

            setPoint(radPoint, i, weather[i]["irradiation"]);
            plotPoint(radPoint);
        }
    }

    //Draws a colored line to represent a data point and its highest value
    //Drawn at the y coord of the highest value
    //Have 50 pixels to work with, names need to be short
    //color = color of line, name = text drawn, yVal is height, left or right side
    //Text is always black

    const drawLabel = (color, name, yVal, leftOrRight) =>
    {
        let xVal = 0;
        if (leftOrRight == "left")
            xVal = 0;
        if (leftOrRight == "right")
            xVal = chartW + offSet;

        context.beginPath();
        context.fillStyle = "#000000";
        console.log(context.strokeStyle);
        context.fillText(name, xVal, yVal + 15);

        context.fillStyle = color;
        context.fillRect(xVal, yVal, offSet, 3); //Draws the line
        context.stroke();
    }

    const setPoint = (p, i, value) =>
    {
        p[1] = p[0];
        p[0] = [i * xScale + offSet, chartH - value * p[3]]
    }

    const plotPoint = (p) =>
    {
        context.beginPath();
        context.strokeStyle = p[2];         //Set color
        context.moveTo(p[0][0], p[0][1]);   //Start at point[0]
        context.lineTo(p[1][0], p[1][1]);   //Draw line to point[1]
        context.stroke();
    }
    
    return { init, plotWeather, plotPower, id};
};
// Write your JavaScript code.

//######################################################################################################################################
//######################################################################################################################################
//######################################################################################################################################
//######################################################################################################################################

//Gonna just rewrite it all here

/*  Reads all the passed @model lists into data[]
 *  data JSON looks like this
 *  data{
 *      obj {
 *          "facility" : facNum,
 *          "weather" : [ {"ambientTemp" : n, "moduleTemp" : n, "irradiation" : n} ],
 *          "sourceKey of power array to string" : [ {"dC_power" : n, "aC_power" : n, "dailyYield" : n, "totalYield" : n} ]
 *          }//end obj
 *      getFac(facNum); Returns obj where facility = facNum, or undefined
 *      getSrc(srcStr); Returns source array in obj where sourceKey = srcStr, or undefined
 *  }//end data
 *
 */

const chart1 = (() =>
{
    let canvas;
    let context;
    let offSet = 50;
    let xLabel = [];
    let chartH;          
    let chartW;  
    let dayCount = 1;
    //Sets up how much of the chart each item takes up
    let ambientScale = 2;
    let moduleScale = 2;
    let radiateScale = 3;

    let showAmbientData = -1;
    let showModuleData = showAmbientData;
    let showIrridData = showAmbientData;

    let showPowerData = -1;

    const init = (id) =>
    {
        canvas = document.getElementById(id);
        context = canvas.getContext("2d");
        context.font = "15px Arial";
        context.lineWidth = 1;
        chartH = canvas.clientHeight - offSet;         //Space at bottom for labels
        chartW = canvas.clientWidth - offSet - offSet; //Space on left and right for labels

        showAmbientData = data.weatherExists;
        showModuleData = showAmbientData;
        showIrridData = showAmbientData;
        showPowerData = data.powerExists;

        popXlabel();
        draw();
    }

    //Draws the chart
    const draw = () =>
    {
        context.clearRect(0, 0, canvas.width, canvas.height);
        renderXAxis();
        plotData();
    }

    const renderXAxis = () =>
    {
        context.beginPath();
        context.fillStyle = "#000000"
        context.fillRect(offSet, chartH, chartW, 3);
        context.stroke();
        let y = canvas.clientHeight;    //Going to access this a lot
        if (xLabel.lengh == 0) xLabel.push(["No", "Data"]);
        let xStep = chartW / xLabel.length;
        if (dayCount > 3) dayCount = 1;

        for (i = 0; i < xLabel.length; i += dayCount)
        {
            let x = (xStep * i) + offSet;
            draw45DegreeText(xLabel[i][1], x, y);
        }
    }

    //Actually -45 degrees
    //Draws slanted text at the x, y coored passed
    const draw45DegreeText = (text, x, y) => {
        context.save();
        let r = (-45 * Math.PI / 180);
        context.translate(x - 13, y);
        context.rotate(r);
        context.fillText(text, 0, 0);
        context.restore();
        context.fillRect(x, y - 50, 4, 10);
    }

    const popXlabel = () =>
    {
        for (i = 0; i < data.dates.length; i++)
        {
            let text = data.dates[i];
            let n = text.indexOf("T");
            if (text.substring(n + 1) == "00:00:00")
            {
                dayCount++;
            }
            if (text.substring(n + 4, n + 6) == "00")
            {
                //Pushes a pair {date, time} => {"mm-dd", "hh:mm"}
                xLabel.push([text.substring(5, n), text.substring(n + 1, n+ 6)]);
            }
        }
        if (dayCount > 3) //After this many days, it just shows month and day only
        {
            let temp = [];
            for (i = 0; i < xLabel.length; i++)
            {
                if (!temp.find(x => x[0] == xLabel[i][0])) //Adds first item in pair if it doesnt already exist in temp
                    temp.push([xLabel[i][0], xLabel[i][0]]);
            }
            xLabel = temp.slice(0);
        }
    }

    const plotData = () =>
    {
        if (showAmbientData || showModuleData || showIrridData)
            plotWeather();

        if (showPowerData)
            plotPower();
    }

    const plotWeather = () =>
    {
        for (index = 0; index < data.facNums.length; index++)//For each facility. 
        {
            let currPlant = data.facNums[index];
            let d = data.getFac(currPlant);

            if (d.weather.length < 1) continue; //Skip if empty array
            if (!document.getElementById("showPlant" + currPlant).checked) continue;

            let xScale = chartW / d.weather.length;

            //Setup initial point values
            let ap = [[offSet, 0], [0, 0], "#ff0000", -1]; //{ [lastX, lastY], [nowX, nowY], color, yscale}
            let mp = [[offSet, 0], [0, 0], "#ffa500", -1];
            let rp = [[offSet, 0], [0, 0], "#999900", -1];
            let maxC;

            let maxAp = -1;
            let maxMp = -1;
            let maxRp = -1;
            //Linear scan to setup scaling
            for (i = 0; i < d.weather.length; i++)
            {
                maxAp = (maxAp > d.weather[i]["ambientTemp"]) ? maxAp : d.weather[i]["ambientTemp"];
                maxMp = (maxMp > d.weather[i]["moduleTemp"]) ? maxMp : d.weather[i]["moduleTemp"];
                maxRp = (maxRp > d.weather[i]["irradiation"]) ? maxRp : d.weather[i]["irradiation"];

            }//Setup is complete


            maxC = (maxAp > maxMp) ? maxAp : maxMp;
            //Set up the scale values stored in index 3
            ap[3] = chartH / maxC / ambientScale;
            mp[3] = chartH / maxC / moduleScale;
            rp[3] = chartH / maxRp / radiateScale;

            //Set initial y coord
            ap[0][1] = chartH - (d.weather[0]["ambientTemp"] * ap[3]);
            mp[0][1] = chartH - (d.weather[0]["moduleTemp"] * mp[3]);
            rp[0][1] = chartH - (d.weather[0]["irradiation"] * rp[3]);

            for (i = 0; i < d.weather.length; i++)
            {
                //Draw the values
                if (showAmbientData) {
                    setWPoint(ap, i, d.weather[i]["ambientTemp"], xScale);
                    plotPoint(ap);
                }
                if (showModuleData) {
                    setWPoint(mp, i, d.weather[i]["moduleTemp"], xScale);
                    plotPoint(mp);
                }
                if (showIrridData) {
                    setWPoint(rp, i, d.weather[i]["irradiation"], xScale)
                    plotPoint(rp)
                }
                
            }
        }//End for loop
        drawWeatherLabel();
    }

    /*  Temperature values on right side
     *  Irradiation on bottom left side
     *  Line color legend top right
     */
    const drawWeatherLabel = () =>
    {
        let maxCScale = chartH / 50 / ambientScale;
        let radScale = chartH / 0.5 / radiateScale;

        if (showAmbientData || showModuleData)
        {
            //Draw 5 labels for temperature on right side
            for (i = 1; i < 6; i++)
            {
                drawLabel("#ff5200", (i * 10 + " C"), chartH - (i * 10) * maxCScale, "right"); //Temp increments of 25
            }
        }
        if (showIrridData)
        {
            for (i = 1; i < 3; i++)
            {
                drawLabel("#999900", (i * 0.5 + " Rad"), chartH - (i * 0.5) / 2 * radScale, "left");
            }
        }
    }

    //This is very similar to the weather plotting function
    const plotPower = () =>
    {
        for (index = 0; index < data.facNums.length; index++)//For each facility. 
        {
            let currPlant = data.facNums[index];
            let d = data.getFac(currPlant);

            if (d.srcKeys.length < 1) continue;; //No data to show for this plant
            if (!document.getElementById("showPlant" + currPlant).checked) continue;

            let xScale = chartW / d.srcKeys[0].length; //Scale everything to this value

            let ac = [[offSet, 0], [0, 0], "#AA00FF", -1]; //These values go about 400-800
            let dc = [[offSet, 0], [0, 0], "#0000FF", -1]; //These values go about 6k -8k
            let maxAc = -1;
            let maxDc = -1;

            //Linear scan for scaling setup
            for (srcIndex = 0; srcIndex < d.srcKeys.length; srcIndex++) //For each source key in facility
            {
                let sourceStr = d.srcKeys[srcIndex];
                for (i = 0; i < d[sourceStr].length; i++)
                {
                    maxAc = (maxAc > d[sourceStr][i]["aC_Power"]) ? maxAc : d[sourceStr][i]["aC_Power"];
                    maxDc = (maxDc > d[sourceStr][i]["dC_Power"]) ? maxDc : d[sourceStr][i]["dC_Power"];
                }
            }
            //DC power is always much higher
            maxDc = Math.ceil(maxDc / 1000) * 1000;
            maxAc = Math.ceil(maxAc / 100) * 100;

            ac[3] = chartH / maxAc / 2;
            dc[3] = chartH / maxDc / 3;

            //See what they look like just at 0
            //Not minusing chart here so these values are on top
            ac[0][1] = d[d.srcKeys[0]][0]["aC_Power"] * ac[3];
            dc[0][1] = d[d.srcKeys[0]][0]["dC_power"] * dc[3];

            //Plot
            for (srcIndex = 0; srcIndex < d.srcKeys.length; srcIndex++) //For each source key in facility
            {
                let sourceStr = d.srcKeys[srcIndex];
                console.log(d[sourceStr][50]["aC_Power"] * ac[3]);
                for (i = 0; i < d[sourceStr].length; i++) //For each item in d[sourceKey]
                {
                    setPPoint(ac, i, d[sourceStr][i]["aC_Power"], xScale);
                    plotPoint(ac);

                    setPPoint(dc, i, d[sourceStr][i]["dC_Power"], xScale);
                    plotPoint(dc);
                }

            }
        }
    }

    const drawLabel = (color, name, yVal, leftOrRight) => {
        let xVal = 0;
        if (leftOrRight == "left")
            xVal = 0;
        if (leftOrRight == "right")
            xVal = chartW + offSet;

        context.beginPath();
        context.fillStyle = "#000000";
        context.fillText(name, xVal, yVal + 15);

        context.fillStyle = color;
        context.fillRect(xVal, yVal, offSet, 3); //Draws the line
        context.stroke();
    }

    //Shifts the points left for easier line drawing
    const setWPoint = (p, i, value, xScale) =>
    {
        p[1] = p[0];
        if (value < 0) value = 0;
        p[0] = [i * xScale + offSet, chartH - value * p[3]];
    }

    const setPPoint = (p, i, value, xScale) =>
    {
        p[1] = p[0];
        if (value < 0) value = 0;
        p[0] = [i * xScale + offSet, chartH  / 2 - value * p[3]];

    }

    const plotPoint = (p) =>
    {
        context.beginPath();
        context.strokeStyle = p[2];         //Set color
        context.moveTo(p[0][0], p[0][1]);   //Start at point[0]
        context.lineTo(p[1][0], p[1][1]);   //Draw line to point[1]
        context.stroke();
    }

    return { init, draw};
})();