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
    let dayCount = 0;

    //Reads lengths of each data point and inits a chart for it
    const init = (id_in) =>
    {
        canvas = document.getElementById(id_in);
        context = canvas.getContext("2d");
        context.font = "15px Arial";

        if (weather !== undefined && weather.length > 0) {
            regChart("weather");
            //Prefer weather readings for x axis labels.
            //Count how many hours and use that instead?
            for (i = 0; i < weather.length; i++)
            {
                let text = weather[i]["dateAndTime"];
                var n = text.indexOf("T");
                if (text.substring(n + 1) == "00:00:00")    //Midnight
                {
                    dayCount++;
                }
                if(text.substring(n + 4, n + 6) == "00")    //even hour
                {
                    xLabels.push(text.substring(n+1, n+6)); 
                }
            }
        } 
        else if (power !== undefined && power.length > 0)
        {
            regChart("power");

            let powerArrayNum = 22; 
            for (i = 0; i < power.length; i += powerArrayNum)
            {

                let text = power[i]["dateAndTime"];
                var n = text.indexOf("T");
                if (text.substring(n + 1) == "00:00:00")    //Midnight
                {
                    dayCount++;
                }
                if (text.substring(n + 4, n + 6) == "00")    //even hour
                {
                    xLabels.push(text.substring(n + 1, n + 6));
                }
            }
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
        if (getChart("weather") !== undefined) { getChart("weather").plotWeather() }
    }

    //Draws y axis with date stamps
    const renderAxis = () =>
    {
        context.beginPath();
        //Draw the x axis line
        context.fillRect(offSet, canvas.clientHeight - offSet, canvas.clientWidth, 3);  //lineTo() is blurry,
        context.stroke();
        context.closePath();

        //Draw label. Either time or days


        //Draw 12 stamps for DateTime data
        //Depends on length of time being show. A single day will be 2 hour intervals. 2 days will be 4 hour intervals. 12 days will be one day intervals
        let xVal = (canvas.clientWidth - 50) / 24;
        let y = canvas.clientHeight;

        if (xLabels.length == 0) { xLabels.push("No Date") }

        for (i = 0; i < 24; i++)
        {
            let x = xVal * i;

            draw45DegreeText(xLabels[i * dayCount], x + offSet, y);
        }
    }

    //Actually -45 degrees
    const draw45DegreeText = (text, x, y) =>
    {
        context.save();
        let r = (-45 * Math.PI / 180);
        context.translate(x - 13, y);
        context.rotate(r);
        context.fillText(text, 0, 0);
        context.restore();
        context.fillRect(x, y - 50, 10, 10);
    }

    return {init, getChart, update};

})();

//Javascript factory for a graph
//Allows possibility of multiple canvases/graphs
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
        let maxVal = 0.0;

        let len = weather.length;
        for (i = 0; i < len; i++)
        {
            maxVal = (maxVal < weather[i]["irridation"]) ? weather[i]["irridation"] : maxVal;
        }

        //Draw a line where the value 1 would be
        
        let diff = 1 - maxVal;
        let y = chartH - (chartH - diff * chartW);

        let lineColor = "#ff0000";
        context.strokeStyle = lineColor;
        //Draws line where about 1 is
        //context.moveTo(offSet, y);
        //context.lineTo(chartW + offSet, y);

        maxVal *= 1.25;

        xScale = chartW / weather.length;
        yScale = chartH / maxVal;

        //Starting point
        context.moveTo(offSet, chartH);
        context.lineWidth = 3;

        for (i = 0; i < weather.length - 1; i++)    //For the size of weather
        {
            context.lineTo((i * xScale) + offSet, chartH - weather[i]["irridation"] * yScale);
        }
        context.stroke();
        context.closePath();

        context.beginPath();
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

    //Plots the actual data
    const plotWeather = () =>
    {
        
    }

    return { init, plotWeather, renderAxis, id};
};
// Write your JavaScript code.
