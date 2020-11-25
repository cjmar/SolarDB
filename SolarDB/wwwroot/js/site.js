// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

//This file is included in the HTML header

//These two methods change the value attribute depending on checked value
//Used by the form data sent in a POST
function setCheckbox(id, bool)
{
    let e = document.getElementById(id);

    if (e == null)
        console.log(id + " is null in setCheckbox(), tried setting to " + bool);

    e.checked = bool;
    if (bool)
        e.setAttribute("value", "true");

    else e.setAttribute("value", "false");
}

//Really just toggles the value, checking the box toggles the checked = true/false
function toggleCheckbox(id)
{
    let e = document.getElementById(id);
    console.log("Changing " + id + " is checked " + e.checked);
    if (e.checked)
    {
        e.setAttribute("value", "true");
    }
    else
    {
        e.setAttribute("value", "false");
    }
}

function onReadyPOST()
{
    //console.log("Weather is " + showWeather + " type " + typeof(showWeather));
    console.log(data);
    optionsGUI.init("GUIcontrol");
    charts.init("graph"); 
}

//Basic data object 
var data = [];
data.getFac = function (facNum)
{
    return this.find(e => e.facility == facNum)
};
data.getSrc = function (srcStr) 
{
    for (i = 0; i < this.length; i++) {
        if (this[i][srcStr]) {
            return this[i][srcStr];
        }
    }
};
data.getFacBySrc = function (srcStr)
{
    for (i = 0; i < this.length; i++)
        if (this[i][srcStr]) return this[i];
}

/*  Reads all the passed @model lists into data[]
 *  data JSON looks like this
 *  data{
 *      obj { 
     *          "facility" : facNum,
     *          "dates" : [],
     *          "weather" : [ {"ambientTemp" : n, "moduleTemp" : n, "irradiation" : n} ], 
     *          "sourceKey of power array to string" : [ {"dC_power" : n, "aC_power" : n, "dailyYield" : n, "totalYield" : n} ]
     *          "srcKeys" : [] //Array of source key names
     *          "weatherExists" : boolean,
     *          "powerExists" : boolean,
     *          "avgPower" : [] //Averaged power of source keys
 *          }//end obj
 *      getFac(facNum); Returns obj where facility = facNum, or undefined
 *      getSrc(srcStr); Returns source array in obj where sourceKey = srcStr, or undefined
 *  }//end data
 * 
 * 
 *  The idea is that the data is only scanned through once to break it into smaller chunks
 */
function parseData(facilities, weather, power, powerSource, plantSelect) {
    //Check used to make sure dates arent added multiple times
    let dateAdded = 0;
    data["dates"] = [];     //List of all the dates
    data["facNums"] = [];   //List of all the facility numbers
    data["weatherExists"] = weather.length > 0;
    data["powerExists"] = power.length > 0;
    data["plantSelect"] = plantSelect;

    //Add each of the facilities
    for (i = 0; i < facilities.length; i++) {
        data.push({ "facility": facilities[i]["plantNumber"], "weather": [], "srcKeys": [], "avgPower": [] });
        data.facNums.push(facilities[i]["plantNumber"]);
    }
    for (i = 0; i < weather.length; i++) {
        let d = data.getFac(weather[i].plantNumber);
        if (d) {
            d.weather.push(
                {
                    "ambientTemp": weather[i].ambientTemp, "moduleTemp": weather[i].moduleTemp, "irradiation": weather[i].irradiation
                });
            //If all plants are selected (-1) then add weather dates from the first known plant (4135001)
            if (weather[i].plantNumber == 4135001 && plantSelect == -1)
            {
                data.dates.push(weather[i].dateAndTime);
            }
            else //Only one plant being used in data
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

    //Linear scan through all power readings 
    for (let i = 0; i < power.length; i++)
    {
        let d = data.getSrc(power[i].sourceKey);
        if (d)
        {
            if(!src) src = power[i].sourceKey;
            d.push(
            {
                "dC_Power": power[i]["dC_Power"], "aC_Power": power[i]["aC_Power"], "dailyYield": power[i]["dailyYield"], "totalYield": power[i]["totalYield"]
            });
            /*  if avgPower[length of source] != out of bounds. push a new value
             *      else add the value to the current value
             */
            let a = data.getFacBySrc(power[i].sourceKey)
            let len = d.length - 1;
            //Automatic anomaly checking will be done here. Len is an index based on current index of a srcKey array being worked on
            if (a.avgPower.length < d.length)
            {
                let ac = d[len].aC_Power;
                let dc = d[len].dC_Power;
                let day = d[len].dailyYield;
                if (ac < 0) ac = 0; //Below 0 means something went wrong and there was no reading
                if (dc < 0) dc = 0;
                if (day < 0) day = 0;

                a.avgPower.push({ "avgDC" : dc, "avgAC" : ac, "avgDaily" : day });
            }
            else
            {
                let ac = d[len].aC_Power;
                let dc = d[len].dC_Power;
                let day = d[len].dailyYield;
                if (ac < 0) ac = 0; //Below 0 means something went wrong and there was no reading
                if (dc < 0) dc = 0;
                if (day < 0) day = 0;
                a.avgPower[len]["avgAC"] += ac;
                a.avgPower[len]["avgDC"] += dc;
                a.avgPower[len]["avgDaily"] += day;
            }
        }
        //Average out each facilities avgPower array
        if (!dateAdded && src == power[i].sourceKey)
        {
            data.dates.push(power[i].dateAndTime);
        }
    }
    for (index = 0; index < facilities.length; index++)
    {
        let facNum = data.facNums[index];
        let fac = data.getFac(facNum);
        if (fac)//&& fac.avgPower.lengh > 0)
        {
            let avgLen = fac.srcKeys.length; //22
            for (i = 0; i < fac.avgPower.length; i++)
            {
                fac.avgPower[i]["avgAC"] /= avgLen;
                fac.avgPower[i]["avgDC"] /= avgLen;
                fac.avgPower[i]["avgDaily"] /= avgLen;
            }
        }
    }
}
//######################################################################################################################################
//######################################################################################################################################
//######################################              Chart Namespace              #####################################################
//######################################################################################################################################

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
 * 
 *  This namespace dynamically controls the chart based on user input
 *  Call charts.init(HTML DOM id) to connect it to an HTML canvas
 *  Call charts.draw() to redraw the graph
 *  Relies on the data[] object being parsed beforehand
 */

const charts = (() =>
{
    let canvas;
    let context;
    let offSet = 50;
    let xLabel = [];
    let legend = [];
    let chartH;          
    let chartW;  
    let dayCount = 1;
    //Sets up how much of the chart each item takes up
    let ambientScale = 2;
    let moduleScale = 2;
    let radiateScale = 3;

    let showAmbientData;
    let showModuleData;
    let showIrridData;

    const init = (id) =>
    {
        canvas = document.getElementById(id);
        context = canvas.getContext("2d");
        context.font = "15px Arial";
        context.lineWidth = 1;
        chartH = canvas.clientHeight - offSet;         //Space at bottom for labels
        chartW = canvas.clientWidth - offSet - offSet; //Space on left and right for labels

        if (data.weatherExists)
        {
            showAmbientData = true;
            showModuleData = true;
            showIrridData = true;
        }

        popXlabel();
        draw();
    }

    //Draws the chart
    const draw = () =>
    {
        legend = [];
        console.log("Redrawing graph");
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (plotData())
        {
            renderXAxis();
            drawLegend();
        }
        else
            noData();
    }

    const noData = () =>
    {
        let txt = "No Data Loaded";
        let xOffset = context.measureText(txt).width / 2;
        context.save();
        context.font = "50px Arial";
        context.fillStyle = "#000000";
        context.fillText(txt, chartH / 2 - xOffset + offSet, 100);
    }

    const drawLegend = () =>
    {
        //{["name", "color value"]} 15pt arial
        let x = chartW + 50 + 50;
        for (i = 0; i < legend.length; i++)
        {
            let txtWidth = context.measureText(legend[i][0]).width;

            context.beginPath();
            context.fillStyle = legend[i][1];
            context.fillText(legend[i][0], x - txtWidth, (i+2) * 15);
            context.stroke();
        }
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

    /*  Plots data if it exists
     * 
     */ 
    const plotData = () =>
    {
        let dataExists = false;

        if ((showAmbientData || showModuleData || showIrridData) || data.weatherExists)
        {
            plotWeather();
            dataExists = true;
        }
        if (data.powerExists)
        {
            plotPower();
            dataExists = true;
        }
        return dataExists;
    }

    const plotWeather = () =>
    {
        if (!document.getElementById("weatherGraph").checked) return;

        legend.push(["Ambient Temp", "#ff0000"]);
        legend.push(["Module Temp", "#ffa500"]);
        legend.push(["Irradiation", "#999900"]);

        //If power graph isnt being shown, display weather using full chart
        if (!document.getElementById("powerGraph").checked)
        {
            ambientScale = 1;
            moduleScale = 1;
            radiateScale = 2;
        }
        else
        {
            ambientScale = 2;
            moduleScale = 2;
            radiateScale = 3;
        }

        for (index = 0; index < data.facNums.length; index++)//For each facility. 
        {
            let currPlant = data.facNums[index];
            let d = data.getFac(currPlant);

            if (d.weather.length < 1) continue; //Skip if empty array
            if (!document.getElementById("showPlant" + currPlant).checked) continue;

            let xScale = chartW / d.weather.length;

            //Setup initial points
            let ap = [[0, 0], [offSet, 0], "#ff0000", -1]; //{ [lastX, lastY], [nowX, nowY], color, yscale}
            let mp = [[0, 0], [offSet, 0], "#ffa500", -1];
            let rp = [[0, 0], [offSet, 0], "#999900", -1];
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
            ap[1][1] = chartH - (d.weather[0]["ambientTemp"] * ap[3]);
            mp[1][1] = chartH - (d.weather[0]["moduleTemp"] * mp[3]);
            rp[1][1] = chartH - (d.weather[0]["irradiation"] * rp[3]);

            showAmbientData = document.getElementById("showAmbientData").checked;
            showModuleData = document.getElementById("showModuleData").checked;
            showIrridData = document.getElementById("ShowIrridData").checked;

            for (i = 0; i < d.weather.length; i++)
            {
                //Draw the values
                if (showAmbientData) {
                    setPoint(ap, i, d.weather[i]["ambientTemp"], xScale);
                    plotPoint(ap);
                }
                if (showModuleData) {
                    setPoint(mp, i, d.weather[i]["moduleTemp"], xScale);
                    plotPoint(mp);
                }
                if (showIrridData) {
                    setPoint(rp, i, d.weather[i]["irradiation"], xScale)
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
        if (!document.getElementById("powerGraph").checked) return;

        legend.push(["AC Power", "#AA00FF"]);
        legend.push(["DC Power", "#0000FF"]);

        let maxPower = 10000;
        let showAveraged = document.getElementById("showAveragedPower").checked;
        let maxAc = -1;
        let maxDc = -1;
        let powerScale;

        if (!document.getElementById("weatherGraph").checked)
        {
            powerScale = 1;
        }
        else
        {
            powerScale = 2;
        }

        for (index = 0; index < data.facNums.length; index++)//For each facility. 
        {
            let currPlant = data.facNums[index];
            let d = data.getFac(currPlant);

            if (d.srcKeys.length < 1) continue;; //No data to show for this plant
            if (!document.getElementById("showPlant" + currPlant).checked) continue;

            let s = d.srcKeys[0];
            let xScale = chartW / d[s].length; //Scale everything to this value

            //Start halfway up if scale = 2, or bottom
            let ac = [[0, 0], [offSet, chartH / powerScale], "#AA00FF", -1]; //These values go about 400-800
            let dc = [[0, 0], [offSet, chartH / powerScale], "#0000FF", -1]; //These values go about 6k -8k

            if (!showAveraged)
            {
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

                //DC power is always much higher. These values are the max value on the power graph
                maxDc = Math.ceil(maxDc / 1000) * 1000;
                maxAc = Math.ceil(maxAc / 100) * 100;
                maxPower = (maxDc > maxAc) ? maxDc : maxAc;

                //
                ac[3] = dc[3] = chartH / powerScale / maxPower;

                //Not minusing chart here so these values are on top if showing weather
                ac[0][1] = d[d.srcKeys[0]][0]["aC_Power"] * ac[3];
                dc[0][1] = d[d.srcKeys[0]][0]["dC_power"] * dc[3];

                //Plot
                let yOffSet = 0;
                if (document.getElementById("weatherGraph").checked) yOffSet = chartH / powerScale;
                for (srcIndex = 0; srcIndex < d.srcKeys.length; srcIndex++) //For each source key in facility
                {
                    let sourceStr = d.srcKeys[srcIndex];
                    let valueCheck = sourceStr + "select";
                    if (!optionsGUI.powerGUIselectValidate(valueCheck)) continue;


                    //Initial values for this source
                    ac[0][1] = d[sourceStr][0]["aC_Power"] * ac[3];
                    dc[0][1] = d[sourceStr][0]["dC_power"] * dc[3];

                    for (i = 0; i < d[sourceStr].length; i++)
                    {
                        setPoint(ac, i, d[sourceStr][i]["aC_Power"], xScale, yOffSet);
                        plotPoint(ac);

                        setPoint(dc, i, d[sourceStr][i]["dC_Power"], xScale, yOffSet);
                        plotPoint(dc);
                    }
                }
            }
            else //Show averaged
            {
                //Linear scan for scaling setup
                for (i = 0; i < d.avgPower.length; i++) //For each source key in facility
                {
                    maxAc = (maxAc > d.avgPower[i]["avgAC"]) ? maxAc : d.avgPower[i]["avgAC"];
                    maxDc = (maxDc > d.avgPower[i]["avgDC"]) ? maxDc : d.avgPower[i]["avgDC"];
                }
                //DC power is always much higher. These values are the max value on the power graph
                maxDc = Math.ceil(maxDc / 1000) * 1000;
                maxAc = Math.ceil(maxAc / 100) * 100;
                maxPower = (maxDc > maxAc) ? maxDc : maxAc;

                ac[3] = dc[3] = chartH / powerScale / maxPower;

                //Not minusing chart here so these values are on top
                ac[0][1] = d[d.srcKeys[0]][0]["aC_Power"] * ac[3];
                dc[0][1] = d[d.srcKeys[0]][0]["dC_power"] * dc[3];

                //Plot
                let yOffSet = 0;
                if (document.getElementById("weatherGraph").checked) yOffSet = chartH / powerScale;
                for (i = 0; i < d.avgPower.length; i++) //For each source key in facility
                {
                    setPoint(ac, i, d.avgPower[i]["avgAC"], xScale, yOffSet);
                    plotPoint(ac);

                    setPoint(dc, i, d.avgPower[i]["avgDC"], xScale, yOffSet)
                    plotPoint(dc);
                }
            }
        }
        drawPowerLabel(maxPower, powerScale);
    }

    //Weather labels are always on bottom, but power charts move around
    const drawPowerLabel = (maxPower, powerScale) =>
    {
        if (document.getElementById("powerGraph").checked)
        {
            let yOffSet = 0;
            if (document.getElementById("weatherGraph").checked) yOffSet = chartH / powerScale;

            //Draw 5 labels for temperature on right side
            let val = (maxPower + 1000) / 1000;
            let yScale = chartH / powerScale / maxPower;
            for (i = 1; i < val; i++)
            {
                drawLabel("#0000ff", (i * 1000) + " kW", (chartH - yScale * i * 1000) - yOffSet, "left");
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

    /*  p - the point being worked ont
     *  i - expects this to be a % of total length: i/array.length, no offsets
     *  value - actual value of point
     *  xScale - x value in pixels between each point
     */ 
    const setPoint = (p, i, value, xScale, yOffSet = 0) =>
    {
        p[0] = p[1];
        if (value < 0) value = 0;
        p[1] = [i * xScale + offSet, (chartH - value * p[3]) - yOffSet];

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

//######################################################################################################################################
//######################################################################################################################################
//######################################                GUI Namespace                   ################################################
//######################################################################################################################################

/*  Namespace controls the weather and power GUI on the right side of the chart
 *  Drawn below the generic options
 *  Expects the id of a div to work in
 *  Expects data[] to be parsed
 */

const optionsGUI = (() =>
{
    let guiDiv;         //Entire div on right side of chart
    let selectId;       //Id of select element for switching GUI types
    let powerGUIdiv;    //Id of power GUI type
    let powerGUIselect; //Id of power GUI multiple select for srcKeys
    let weatherGUIdiv;  //Id of weather GUI type

    //Add stuff on data load
    const init = (id) =>
    {
        guiDiv = document.getElementById(id);    
        //guiDiv.style.border = "1px black solid";
        //Creates a checkbox for each plant to toggle the data on/off
        if (data.plantSelect == -1)
        {
            let d = document.createElement("div");
            d.classList.add("inlineDiv");
            guiDiv.appendChild(d);
            let textNode = document.createElement("p");
            textNode.innerHTML = "Select which specific plant to display";
            d.appendChild(textNode);
            for (i = 0; i < data.facNums.length; i++)
            {
                let id = "showPlant" + data.facNums[i];
                let txt = "Plant " + data.facNums[i];
                createCheckbox(d, id, txt, "checkBoxContainer");
                setCheckbox(id, true);
            }
        }
        else //Creates a hidden untoggleable checkbox with the right id
        {
            let id = "showPlant" + data.plantSelect;
            let txt = "Plant " + data.plantSelect;
            box = createCheckbox(guiDiv, id, txt);
            document.getElementById(box).style.display = "none";
            setCheckbox(id, true);
        }
        /*  The scaling for each graph is based on whether the other one is being displayed
         *  Both checkboxes need to be created even if only one is being displayed
         *  If only one chart type is being displayed, these check boxes are hidden
         *      and the one with no data is unchecked
         */
        if (data.weatherExists || data.powerExists)
        {
            let id1 = "weatherGraph";
            let txt1 = "Weather Graph"
            let id2 = "powerGraph";
            let txt2 = "Power Graph";

            //Get id's to hide them later if all types arent loaded with data

            let d = document.createElement("div");
            guiDiv.appendChild(d);
            let weatherBox = createCheckbox(d, id1, txt1, "checkBoxContainer");
            let powerBox = createCheckbox(d, id2, txt2, "checkBoxContainer");
            d.classList.add("inlineDiv");

            setCheckbox(id1, true);
            setCheckbox(id2, true);

            if (data.weatherExists) setCheckbox(id1, true);
            if (data.powerExists) setCheckbox(id2, true);

            if (data.powerExists)
            {
                setCheckbox("showPowerReading", true);
                setCheckbox(id2, true);
            }
            else
            {
                toggleHideElement(weatherBox);
                toggleHideElement(powerBox);
                setCheckbox(id2, false);
            }
            if (data.weatherExists)
            {
                setCheckbox("showWeatherReading", true);
                setCheckbox(id1, true)
            }
            else
            {
                toggleHideElement(weatherBox);
                toggleHideElement(powerBox);
                setCheckbox(id1, false);
            }
        }
        createChartGUI();
    }

    //Creates the specific 
    const createChartGUI = () =>
    {
        if (data.powerExists && data.weatherExists)
        {
            console.log("Both power and weather");
            //Get selection from the <select> tag and show it

            //Create the GUI divs and hide the non selected one
            powerGUIdiv = powerGUI();
            weatherGUIdiv = weatherGUI();
        }
        else
        {
            if (data.powerExists)
            {
                powerGUIdiv = powerGUI();
            }
            if (data.weatherExists)
            {
                weatherGUIdiv = weatherGUI();
            }
        }
    }

    //Puts the power GUI into the div
    const powerGUI = () =>
    {
        let id = "powerGUIdiv";
        let powerDiv = document.createElement("div");
        powerDiv.setAttribute("id", id);
        powerDiv.classList.add("inlineDiv");

        createCheckbox(powerDiv, "showAveragedPower", "Show Averaged Power");

        //Create list of every power source for a select,
        //[["powerControls", "Power Controls"], ["weatherControls", "Weather Controls"]];
        let arr = [];
        arr.push({ "name": "Show All", "value" : "allVal"});
        for (index = 0; index < data.facNums.length; index++)
        {
            let fac = data.facNums[index];
            let d = data.getFac(fac);
            if (d)
            {
                for (i = 0; i < d.srcKeys.length; i++)
                {
                    let str = d.srcKeys[i] + "select";  //id of this select
                    arr.push({ "name" : d.srcKeys[i], "value" : str });
                }
            }
        }
        powerGUIselect = createSelect(powerDiv, "powerGUIselect", "Or Select Specific Sources<br>(up/down arrow keys work)", arr);
        guiDiv.appendChild(powerDiv);
        document.getElementById(powerGUIselect).value = "allVal";
        setCheckbox("showAveragedPower", true);
        return id;
    }
    /*  Puts the weather GUI into the div
     *  Pretty simple, only three things
     */
    const weatherGUI = () =>
    {
        let id = "weatherGUIdiv"
        let weatherDiv = document.createElement("div");
        weatherDiv.setAttribute("id", id);
        weatherDiv.classList.add("inlineDiv");

        //Show ambient data
        createCheckbox(weatherDiv, "showAmbientData", "Show Ambient Temp");
        //Show module data
        createCheckbox(weatherDiv, "showModuleData", "Show Module Temp");
        //Show irridation data
        createCheckbox(weatherDiv, "ShowIrridData", "Show Irradiation");

        guiDiv.appendChild(weatherDiv);
        setCheckbox("showAmbientData", true);
        setCheckbox("showModuleData", true);
        setCheckbox("ShowIrridData", true);
        return id;
    }

    const selectEvent = (id) =>
    {
        charts.draw();
    }

    const toggleHideElement = (id) =>
    {
        let e = document.getElementById(id);
        if (e.style.display == "none")
            e.style.display = "block";
        else e.style.display = "none";
    }

    //Creates a dropdown using the provided array. Returns the id 
    //example array: [["powerControls", "Power Controls"], ["weatherControls", "Weather Controls"]];
    const createSelect = (rDiv, id, labelTxt, arr) =>
    {
        let selectDiv = document.createElement("div");

        let textNode = document.createElement("p");
        textNode.innerHTML = labelTxt;

        let selectNode = document.createElement("select");
        selectNode.setAttribute("id", id);
        selectNode.setAttribute("multiple", "multiple");
        selectNode.addEventListener("change", function () { optionsGUI.selectEvent(id); }, false);

        for (i = 0; i < arr.length; i++)
        {
            let optionNode = document.createElement("option");
            optionNode.setAttribute("value", arr[i].value);
            optionNode.innerHTML = arr[i].name;
            selectNode.appendChild(optionNode);
        }

        selectDiv.appendChild(textNode);
        selectDiv.appendChild(selectNode);
        rDiv.appendChild(selectDiv);
        return id;
    }

    //Creates a checkbox with label and adds to end of rDiv element child list
    //Check boxes are checked=true by default
    //Sets id of containing div as "passed_name + "div"
    //Returns id of containing div
    const createCheckbox = (rDiv, id, text, cls = "checkBoxContainerCenter") =>
    {
        let boxNode = document.createElement("div");
        boxNode.classList.add(cls);
        let divId = id + "div";
        boxNode.setAttribute("id", divId);

        let labelNode = document.createElement("label");
        labelNode.setAttribute("for", id);
        labelNode.innerHTML = text;

        let inputNode = document.createElement("input");
        inputNode.setAttribute("type", "checkbox");
        inputNode.setAttribute("id", id);
        inputNode.setAttribute("name", id);
        inputNode.style.marginLeft = "2px";
        //Toggling a checkbox immediately redraws graphs
        inputNode.addEventListener("change", function () { charts.draw(); }, false);
        

        boxNode.appendChild(labelNode);
        boxNode.appendChild(inputNode);
        rDiv.appendChild(boxNode);
        //setCheckbox(id, true);
        return divId;
    }

    //Returns true or false if an srcKey is in powerGUIselect multiple select element
    const powerGUIselectValidate = (value_check) =>
    {
        //powerGUIselect
        let selected = [];
        let opt;
        let ms = document.getElementById(powerGUIselect); //Multiple Select
        if (!ms) console.log("multi select is null?");
        for (i = 0; i < ms.options.length; i++)
        {
            opt = ms.options[i];
            if (opt.selected)
                selected.push(opt);
        }

        let found = selected.find(e => e.value == value_check || e.value == "allVal");
        if (found)
            return true;
        else return false;
    }

    //Deletes everything inside of the guiDiv
    const clearGUIdiv = () =>
    {
        while (guiDiv.firstChild())
        {
            guiDiv.removeChild(guiDiv.lastChild);
        }
    }

    return { init, selectEvent, powerGUIselectValidate};
}
)();