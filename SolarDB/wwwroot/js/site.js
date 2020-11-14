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
            regChart("power");
            let powerArrayNum = 22;
            populateXlabel(power, powerArrayNum);
        }
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
        //if (getChart("power") !== undefined) { getChart("power").plotPower() }
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

        if (xLabels.length == 0) { xLabels.push("No Date") }
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

//Javascript factory for a graph
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
    //Custom y axis for the data points
    const renderAxis = () =>
    {
        context.strokeStyle = "#000000";
        context.lineWidth = 1;
        context.moveTo(offSet, offSet);
        context.lineTo(offSet, chartH);
        context.lineTo(chartW + offSet, chartH);
        context.stroke();
        context.closePath();
    }

    //Draw power data
    const plotPower = () =>
    {

    }

    //Draws weather data
    const plotWeather = () =>
    {
        let irriPoint = [[0, 0], [0, 0], "#ffff00"];

        for (i = 0; i < weather.length; i++)
        {
            //let p = {[0, 0], [10, 10]};
            //plotPoint(irriColor, irriPoint);
        }
    }

    /*
    const plotPoint = (color, points) =>
    {
        //context.beginPath();
        //context.moveTo(points[0][0], points[0][1]);
        //context.strokeStyle = color;
        //context.lineTo(points[1][0], points[1][1]);
        //context.stroke();
    }
    */
    return { init, plotWeather, plotPower, renderAxis, id};
};
// Write your JavaScript code.
