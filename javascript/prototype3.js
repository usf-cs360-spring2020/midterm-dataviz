
// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 30, left: 100},
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
var calltypes = ['Alarm', 'Fire', 'Potentially Life-Threatening', 'Non Life-Threatening']
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
var hoods = ['Hayes Valley', 'Mission', 'South of Market', 'Tenderloin', 'Western Addition']

// Build heatmap scales and axis:
var x = d3.scaleBand()
  .range([ 0, width ])
  .domain(months)
  .padding(0.01);
svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x))

// Build X scales and axis:
var y = d3.scaleBand()
  .range([ height, 0 ])
  .domain(hoods)
  .padding(0.01);
svg.append("g")
  .call(d3.axisLeft(y));

// Build barchart scales and axis:
var x2 = d3.scaleBand()
  .range([ 0, width ])
  .domain(calltypes)
  .padding(0.01);
svg2.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x2))

var y2 = d3.scaleLinear()
  .range([ height, 0 ])
  .domain([0, 20])
svg2.append("g")
  .call(d3.axisLeft(y2))

// svg.append('g_heat');
// svg.append("gbar");

var rawcsv;

function query(data, calltype, month, hood) {
    var weightedsum = 0;
    var count = 0;

    for (const row of data) {
        if ([row.calltype, ''].includes(calltype) &&
            [row.month, ''].includes(month) &&
            [row.hood, ''].includes(hood)) {
            weightedsum += row.avgtime * row.count;
            count += 1*row.count;
        }
    }
    avg = count ? weightedsum/count : 0;
    return [avg, count];
}
var selected_calltype = ''
var selected_month = ''
var selected_hood = ''

var dataheat = [];
var databar = [];

function filter_heat() {
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
    for (calltype of calltypes) {
        [avgtime, count] = query(rawcsv, calltype, selected_month, selected_hood)
        databar.push({
            calltype: calltype,
            avgtime: avgtime,
            count: count
        });
    }
}

// Build color scale
var myColor = d3.scaleLinear()
  .range(["white", "#69b3a2"])
  .domain([5, 10])

  function redraw() {
    data = rawcsv;

    // Heatmap
    svg.append('g').selectAll('rect')
      .data(dataheat, function(d) {return d.group+':'+d.variable;})
      .join("rect")
      .attr("x", function(d) { return x(d.month) })
      .attr("y", function(d) { return y(d.hood) })
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return myColor(d.avgtime)} );

    // Bar chart
    svg2.append('g').selectAll('rect')
      .data(databar, function(d) {return d.group+':'+d.variable;})
      .join("rect")
      .attr("x", function(d) { return x2(d.calltype) })
      .attr("y", function(d) { return y2(d.avgtime) })
      .attr("width", x2.bandwidth() )
      .attr("height", function(d) {return height - y2(d.avgtime) } )
      .style("fill", function(d) { return myColor(d.avgtime)} );
  }

//Read the data
d3.tsv("station36.csv")
  .then(function(data) {
    rawcsv = data;
    console.log(query(data, 'Fire', 'January', 'Tenderloin'))
    filter_heat();
    filter_bar();
    redraw();
})