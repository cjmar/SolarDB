// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

//This file is included in the header

const charts = (() =>
{
    let chartList = [];

    const regChart = (id_in) =>
    {
        chartList.push(chart(id_in));
        chartList[chartList.length - 1].init();
    }

    const getChart = (id_in) =>
    {
        return chartList.find(ch => ch.id == id_in);
    }
    return {regChart, getChart};

})();

function checkboxValue(id)
{
    let val = document.getElementById(id);

    if (val.checked)
        val.setAttribute("value", "true");

    else val.setAttribute("value", "false");
}

//Javascript factory for a graph
//Allows possibility of multiple canvases/graphs
const chart = (canvas_id) =>
{
    let id = canvas_id;
    let canvas;             //Actual canvas
    let context;            //Drawing context init to "2d"
    let maxVal = 1;
    let minVal = 0;

    //Allow for the possibility of multiple canvases
    //For now the idea is to graph Irradation along the timeframe of the first day
    const init = () =>
    {
        alert("Init chart " + id);
        canvas = document.getElementById(id);
        context = canvas.getContext("2d");
        context.fillStyle = "0099ff";
        context.font = "20 pt Verdana";
        context.strokeStyle = "#009933"; // Grid line color
        context.beginPath();
        context.moveTo(0, 0);

        //context.lineTo(300, 150);
        //context.stroke();

        for (i = 0; i < weather.length; i++)    //For the size of weather
        {
            context.lineTo(i, i+1);
        }
        context.stroke();
    }

    const plotWeather = () =>
    {

}

    return {init, plotWeather};
};
// Write your JavaScript code.
