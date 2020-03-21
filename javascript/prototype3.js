
// set the dimensions and margins of the graph
var margin = { top: 10, right: 10, bottom: 30, left: 120 },
    width = 960 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#prototype3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// append the svg object to the body of the page
var svg2 = d3.select("#prototype3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Labels of row and columns
var calltypes = ['Alarm', 'Fire', 'Potentially Life-Threatening', 'Non Life-threatening', 'All Call Types']
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Total']
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

svg.append('g').attr('id', 'chart');
svg.append('g').attr('id', 'xaxis');
svg.append('g').attr('id', 'yaxis');
svg2.append('g').attr('id', 'chart');
svg2.append('g').attr('id', 'xaxis');
svg2.append('g').attr('id', 'yaxis');

var selected_calltype = 'All Call Types'
var selected_month = 'Total'
var selected_hood = 'All Neighborhoods'

var rawcsv;
var dataheat = [];
var databar = [];

// Build color scale
var myColor = d3.scaleLinear()
    .range(["#ffffff", "#ff4010"])
    .domain([3, 13]);
var myColorSel = d3.scaleLinear()
    .range(["#ffffff", "#ff0080"])
    .domain([3, 13]);

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
        if ([row.calltype, 'All Call Types'].includes(calltype) &&
            [row.month, 'Total'].includes(month) &&
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
            selected_month = 'Total';
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
        .attr("x", function (d) { return x2(d.calltype) })
        .attr("y", function (d) { return y2(d.avgtime) })
        .attr("width", x2.bandwidth())
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
            selected_calltype = 'All Call Types';
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
