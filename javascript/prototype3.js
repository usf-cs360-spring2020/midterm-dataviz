
// set the dimensions and margins of the graph
var margin = { top: 40, right: 10, bottom: 40, left: 125 },
    width = 960 - margin.left - margin.right,
    height = 360 - margin.top - margin.bottom;

// append the svg objects to the body of the page
var title1 = d3.select("#prototype3").append("div")
    .style("text-align", "center").style("width", "960px")
    .append("h4")
var svg = d3.select("#prototype3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

d3.select("#prototype3").append("h1");

var title2 = d3.select("#prototype3").append("div")
    .style("text-align", "center").style("width", "960px")
    .append("h4")
var svg2 = d3.select("#prototype3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Labels of row and columns
var calltypes = ['Alarm', 'Fire', 'Potentially Life-Threatening', 'Non Life-threatening', 'All']
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'All']
var hoods = ['All Neighborhoods', 'Western Addition', 'Tenderloin', 'South of Market', 'Mission', 'Hayes Valley']

// Build heatmap scales and axis:
var x = d3.scaleBand()
    .range([0, width])
    .domain(months)
    .padding(0.01);

var y = d3.scaleBand()
    .range([height, 0])
    .domain(hoods)
    .padding(0.01);

// Build barchart scales and axis:
var x2 = d3.scaleBand()
    .range([0, width])
    .domain(calltypes)
    .padding(0.01);

var y2 = d3.scaleLinear()
    .range([height, 0])
    .domain([0, 20])

// Build color scale
var myColor = d3.scaleLinear()
    .range(["#ffffff", "#ff3010", "#600"])
    .domain([3, 12, 17]);
var myColorSel = d3.scaleLinear()
    .range(["#ffffff", "#f00090", "#605"])
    .domain([3, 12, 17]);

svg.append('g').attr('id', 'chart');
svg.append('g').attr('id', 'xaxis');
svg.append('g').attr('id', 'yaxis');
svg2.append('g').attr('id', 'chart');
svg2.append('g').attr('id', 'xaxis');
svg2.append('g').attr('id', 'yaxis');
// X axis label:
svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2)
    .attr("y", height + margin.top + 25)
    .text("Month");
// Y axis label:
svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 10)
    .attr("x", -margin.top - height / 2 + 50)
    .text("Neighborhood")
// X axis label:
svg2.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2)
    .attr("y", height + margin.top + 25)
    .text("Call Type");
// Y axis label:
svg2.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 30)
    .attr("x", -margin.top)
    .text("Average response time (min)")

var gdata = [{ "color": "#ffffff", "value": 3 }, { "color": "#ff3010", "value": 12 }, { "color": "#600", "value": 17 }];
var extent = d3.extent(gdata, d => d.value);

var innerWidth = 150;
var barHeight = 10;

var xScale = d3.scaleLinear()
    .range([0, innerWidth])
    .domain(extent);

var xTicks = gdata.filter(f => f.value != 12).map(d => d.value);

var xAxis = d3.axisBottom(xScale)
    .tickSize(barHeight * 2)
    .tickValues(xTicks);

var g = svg.append("g").attr("transform", "translate(680, -40)");

var defs = svg.append("defs");
var linearGradient = defs.append("linearGradient").attr("id", "myGradient");
linearGradient.selectAll("stop")
    .data(gdata)
    .enter().append("stop")
    .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
    .attr("stop-color", d => d.color);

g.append("rect")
    .attr("width", innerWidth)
    .attr("height", barHeight)
    .style("fill", "url(#myGradient)");

g.append("g")
    .call(xAxis).select(".domain").remove();

var selected_calltype = 'All'
var selected_month = 'All'
var selected_hood = 'All Neighborhoods'

var rawcsv;
var dataheat = [];
var databar = [];

function friendlyname(col) {
    return {
        'calltype': 'Call type group',
        'month': 'Month',
        'hood': 'Neighborhood',
        'avgtime': 'Average response time&nbsp;&nbsp;',
        'count': 'Number of calls',
    }[col];
}
function ttip(d) {
    let div = d3.select("body").append("div")
        .attr("id", "details")
        .attr("class", "tooltip")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
    let rows = div.append("table")
        .selectAll("tr")
        .data(Object.keys(d))
        .enter()
        .append("tr");
    rows.append("th").html(key => friendlyname(key));
    rows.append("td").text(key => key == 'avgtime' ? (Math.round(d[key] * 10) / 10 + ' minutes') : d[key]);
}

function query(data, calltype, month, hood) {
    var weightedsum = 0;
    var count = 0;

    for (const row of data) {
        if ([row.calltype, 'All'].includes(calltype) &&
            [row.month, 'All'].includes(month) &&
            [row.hood, 'All Neighborhoods'].includes(hood)) {
            weightedsum += row.avgtime * row.count;
            count += 1 * row.count;
        }
    }
    avg = count ? weightedsum / count : 0;
    return [avg, count];
}

function filter_heat() {
    dataheat = [];
    for (hood of hoods) {
        for (month of months) {
            [avgtime, count] = query(rawcsv, selected_calltype, month, hood)
            dataheat.push({
                month: month,
                hood: hood,
                avgtime: avgtime,
                count: count
            });
        }
    }
}
function filter_bar() {
    databar = [];
    for (calltype of calltypes) {
        [avgtime, count] = query(rawcsv, calltype, selected_month, selected_hood)
        databar.push({
            calltype: calltype,
            avgtime: avgtime,
            count: count
        });
    }
}

function redraw() {
    title1.html("Average Response Time for Station 36 for <font color=\"blue\">" + selected_calltype + "</font> Calls in 2019");
    title2.html("Average Response Time for Station 36 in <font color=\"blue\">" + selected_hood + "</font> in <font color=\"blue\">" + selected_month + "</font> 2019");

    filter_heat();
    filter_bar();

    d3.selectAll("div#details").remove();
    data = rawcsv;

    // Heatmap
    svg.select("g#chart").selectAll('rect').remove()
        .data(dataheat, function (d) { return d.group + ':' + d.variable; })
        .join("rect")
        .attr("x", function (d) { return x(d.month) })
        .attr("y", function (d) { return y(d.hood) })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function (d) {
            return (d.month == selected_month || d.hood == selected_hood) ?
                myColorSel(d.avgtime) : myColor(d.avgtime)
        });

    rects = svg.select("g#chart").selectAll('rect');
    rects.on("mouseover", function (d) {
        d3.select(this)
            .raise() // bring to front
            .style("stroke", "green")
            .style("stroke-width", 2);
        ttip(d);
    });
    rects.on("mouseout", function (d) {
        d3.select(this).style("stroke", null);
        d3.selectAll("div#details").remove();
    });
    rects.on("click", function (d) {
        if (d.month == selected_month && d.hood == selected_hood) {
            selected_month = 'All';
            selected_hood = 'All Neighborhoods';
        } else {
            selected_month = d.month;
            selected_hood = d.hood;
        }
        redraw();
    });

    // Bar chart
    svg2.select("g#chart").selectAll('rect').remove()
        .data(databar, function (d) { return d.group + ':' + d.variable; })
        .join("rect")
        .attr("x", function (d) { return x2(d.calltype) + x2.bandwidth()*0.1 })
        .attr("y", function (d) { return y2(d.avgtime) })
        .attr("width", x2.bandwidth()*0.8)
        .attr("height", function (d) { return height - y2(d.avgtime) })
        .style("fill", function (d) {
            return (d.calltype == selected_calltype) ?
                myColorSel(d.avgtime) : myColor(d.avgtime)
        });
    rects = svg2.select("g#chart").selectAll('rect');
    rects.on("mouseover", function (d) {
        d3.select(this)
            .raise() // bring to front
            .style("stroke", "green")
            .style("stroke-width", 2);
        ttip(d);
        d3.select(status).text("highlight: " + d.letter);
    });
    rects.on("mouseout", function (d) {
        d3.select(this).style("stroke", null);
        d3.selectAll("div#details").remove();
    });
    rects.on("click", function (d) {
        if (d.calltype == selected_calltype) {
            selected_calltype = 'All';
        } else {
            selected_calltype = d.calltype;
        }
        redraw();
    });


    // Axes
    svg.select("g#xaxis").html(null)
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", 13)
        .filter(x => x == selected_month)
        .style("font-weight", "bold")
        .style("color", "blue")
    svg.select("g#yaxis").html(null)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", 13)
        .filter(x => x == selected_hood)
        .style("font-weight", "bold")
        .style("color", "blue")
    svg2.select("g#xaxis").html(null)
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x2))
        .selectAll("text")
        .style("font-size", 13)
        .filter(x => x == selected_calltype)
        .style("font-weight", "bold")
        .style("color", "blue")
    svg2.select("g#yaxis").html(null)
        .call(d3.axisLeft(y2))
        .selectAll("text")
        .style("font-size", 13)

}

//Read the data
d3.tsv("station36.csv")
    .then(function (data) {
        rawcsv = data;
        console.log(query(data, 'Fire', 'January', 'Tenderloin'))
        redraw();
    })
