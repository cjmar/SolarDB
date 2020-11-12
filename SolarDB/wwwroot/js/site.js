// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

//This file is included in the header


function checkboxValue(id)
{
    let val = document.getElementById(id);

    if (val.checked)
        val.setAttribute("value", "true");

    else val.setAttribute("value", "false");
}

//{"facilityID":x,"plantNumber":x}
//{"weatherReadingID":x,"plantNumber":x,"dateAndTime":"x","ambientTemp":x,"moduleTemp":x,"irridation":x}
//{"powerReadingID":x,"sourceKey":"x","dateAndTime":"x","dC_Power":x,"aC_Power":x,"dailyYield":x,"totalYield":x}

const charts = (() =>
{
    let chartList = [];
    let canvas;
    let context;

    //Reads lengths of each data point and inits a chart for it
    const init = (id_in) =>
    {
        canvas = document.getElementById(id_in);
        context = canvas.getContext("2d");
        if (weather !== undefined && weather.length > 0) { regChart("weather"); } 

        alert(power.legnth);
        if (power !== undefined && power.length > 0) { regChart("power"); }                
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

    const update = () =>
    {
        //getChart("weather").plot();
        //renderAxis();
    }

    const renderAxis = () =>
    {
        alert(context);
        context.beginPath();
        //Draw the axis
        context.strokeStyle = "#000000";
        context.lineWidth = 1;
        context.moveTo(offSet, offSet);
        context.lineTo(offSet, chartH);
        context.lineTo(chartW + offSet, chartH);
        context.stroke();
        context.closePath();
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
    let maxVal = 0.0;

    //Allow for the possibility of multiple canvases
    //For now the idea is to graph Irradation along the timeframe of the first day
    const init = (can, ctxt) =>
    {
        canvas = can;
        context = ctxt;
        //context.font = "20 pt Verdana";
        //context.strokeStyle = "#000000"; // Grid line color
        //context.beginPath();

        chartW = canvas.clientWidth - offSet;
        chartH = canvas.clientHeight - offSet;

        let len = weather.length;
        for (i = 0; i < len; i++)
        {
            maxVal = (maxVal < weather[i]["irridation"]) ? weather[i]["irridation"] : maxVal;
        }

        //Draw a line where the value 1 would be
        
        let diff = 1 - maxVal;
        let y = chartH - (chartH - diff * chartW);

        context.strokeStyle = "#ff0000";
        //Draws line where about 1 is
        context.moveTo(offSet, y);
        context.lineTo(chartW + offSet, y);

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

    const plot = () =>
    {
        
    }

    return {init, plot, renderAxis, id};
};
// Write your JavaScript code.
