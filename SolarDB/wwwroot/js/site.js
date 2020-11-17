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


/*  Fills out Data[] with a presorted by date JSON
 *  {
 *      facility: int,
 *      weather: 
 *          [{ ambientTemp : double, moduleTemp : double, irradiation : double}]
 *      Source key string as object key 0..n: 
 *          [{ dC_power : double, aC_power : double, dailyYield : double, totalYield : double}]
 *  }
 *  
 *  All of these are pre sorted
 */
var data = [];
data.getFac = function (facNum) { return this.find(e => e.facility == facNum) };
data.getSrc = function (srcStr)
{
    for (i = 0; i < this.length; i++) {
        if (this[i][srcStr]){
            return this[i][srcStr];
        }
    }
};

function parseData() {
    //Add each of the facilities
    for (i = 0; i < facilities.length; i++) {
        data.push({ "facility": facilities[i]["plantNumber"], "weather": [] });
    }
    for (i = 0; i < weather.length; i++) {
        let d = data.getFac(weather[i].plantNumber);
        if (d) {
            d.weather.push(
                {
                    "ambientTemp": weather[i].ambientTemp, "moduleTemp": weather[i].moduleTemp, "irradiation": weather[i].irradiation
                });
        }
    }
    for (let i = 0; i < powerSource.length; i++) {
        let d = data.getFac(powerSource[i].plantNumber);
        if (d) {
            let key = powerSource[i].sourceKey;
            d[key] = [];
        }
    }
    for (let i = 0; i < power.length; i++) {
        let d = data.getSrc(power[i].sourceKey);
        if (d) {
            d.push(
            {
                "dC_Power": power[i]["dC_Power"], "aC_Power": power[i]["aC_Power"], "dailyYield": power[i]["dailyYield"], "totalYield": power[i]["totalYield"]
            });
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
    let xLabels = [];   //Array of strings
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
        let xStep = (canvas.clientWidth - offSet) / (xLabels.length);
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

//Javascript namespace that packages up the JSON into a datastructure
const allData = () =>
    ({
        

    });

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

        chartW = canvas.clientWidth - offSet;
        chartH = canvas.clientHeight - offSet;
    }

    //Draw power data
    const plotPower = () =>
    {
        xScale = chartW / power.length;

       
    }

    //Draws weather data
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
        
        let ambPoint = [[xScale + offSet + 4, 0], [0, 0], "#ff0000", -1]; //{ [lastX, lastY], [nowX, nowY], color, yscale }
        let modPoint = [[xScale + offSet + 4, 0], [0, 0], "#ffa500", -1]; //#ffa500
        let radPoint = [[xScale + offSet + 4, 0], [0, 0], "#999900", -1];

        let maxAmb = ambPoint[3];
        let maxMod = modPoint[3];
        let maxRad = radPoint[3];

        let facNum = 0;
        //"ambientTemp" ,"moduleTemp", "irradiation"
        //Find the max values for each point type
        for (i = 0; i < weather.length; i++)                    //Linear scan to get setup data. y scaling
        {
            ambPoint[3] = (ambPoint[3] > weather[i]["ambientTemp"]) ? ambPoint[3] : weather[i]["ambientTemp"];
            modPoint[3] = (modPoint[3] > weather[i]["moduleTemp"]) ? modPoint[3] : weather[i]["moduleTemp"];
            radPoint[3] = (radPoint[3] > weather[i]["irradiation"]) ? radPoint[3] : weather[i]["irradiation"];

            maxAmb = ambPoint[3];
            maxMod = modPoint[3];
            maxRad = radPoint[3];

            //for (i = 0; i < facilities.length; i++)
            //{
             //   if (weather[i]["plantNumber"] == fac[i][3]) {
              //      console.log("Matching plant");
               // }
            //}
        }
        //FACILITY SET Y SCALE
        for (i = 0; i < facilities.length; i++) {
            fac[i][0][3] = chartH / maxAmb / 2;
            fac[i][1][3] = chartH / maxMod / 2;
            fac[i][2][3] = chartH / maxRad / 3;
        }


        ambPoint[3] = chartH / ambPoint[3] / 2; //These set the max Y values a datapoint can be
        modPoint[3] = chartH / modPoint[3] / 2;
        radPoint[3] = chartH / radPoint[3] / 3;

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

    const setPoint = (p, i, value) =>
    {
        p[1] = p[0];
        p[0] = [i * xScale + offSet + 4, chartH - value * p[3]]
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
