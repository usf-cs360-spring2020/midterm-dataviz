let csv = 'javascript/Fire_Department_Calls_for_Service3.csv';

const svg_width = 960;
const svg_height = 500;

var margin = {
    top: 10,
    bottom: 35,
    right: 10,
    left: 50
};

var plot = {
    x: margin.left,
    y: margin.top,
    width: svg_width - margin.left - margin.right,
    height: svg_height - margin.top - margin.bottom
};

let svg = d3.select('body').select('#D3Prototype1')
    .attr('width', svg_width)
    .attr('height', svg_height);

var tooltip = d3.select("body").append("div")
    .attr("id", "details")
    .attr("class", "toolTip")
    .style("opacity", 0);

let g = svg.append('g')
    .attr('id', 'plot')
    .attr('transform', translate(plot.x, plot.y));

d3.csv(csv, convert).then(draw);

function draw (data) {
    console.log("data", data);

    var groupedByMonth = d3.nest()
        .key (function (d) {
            return d.month;
        })
        .key (function (d) {
            return d.battalion;
        })
        .rollup (function (v) {
            return d3.sum(v, function (d) {
                return d.incident;
            })
        })
        .entries(data)
        .map(function(group) {
            return {
              "month": group.key,
              "values": group.values.map(function(subgroup) {
                return {
                  "battalion": subgroup.key,
                  "incident": subgroup.value,
                  "month": dateFormatter(group.key)
                }
              })
            }
          });

        data = groupedByMonth;

        let categories = data[0].values.map(value => value.battalion);
        console.log("categories:", categories);

        let months = data.map(function(d) {
            return d.month;
        });
        console.log("months:", months);

        let countMin = 0;
        let countMax = d3.max(data, function(c) {
            return d3.max(c.values, function(d) {
                return d.incident;
            });
        });

        if (isNaN(countMax)) {
            countMax = 0;
        }

        console.log("count bounds:", [countMin, countMax]);

        var x0 = d3.scaleBand()
            .domain(months)
            .rangeRound([0, plot.width])
            .paddingInner(0.1);

        var x1 = d3.scaleBand()
            .domain(categories)
            .range([0, x0.bandwidth()])
            .padding(0.05);

        var y = d3.scaleLinear()
            .domain([countMin, countMax])
            .rangeRound([plot.height, 0])
            .nice();

        var z = d3.scaleOrdinal()
                .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

        let plots = svg.append("g")
            .attr("id", "plots");
        plots.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let xAxis = d3.axisBottom(x0);
        let yAxis = d3.axisLeft(y);

        plots.append("text")
            .style("text-anchor", "end")
            .attr("y", 0)
            .attr("dy", "-2.5em")
            .attr('transform', 'rotate(-90)')
            .text("Number of Incidents");

        plots.append("text")
            .attr("x", plot.width / 2)
            .attr("y", 490)
            .attr("text-anchor", "middle")
            .text("Months (2019)");

        plots.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + plot.height + ")");

        xAxis.tickFormat(dateFormatter);
        yAxis.tickFormat(numFormatter);

        let xGroup = plots.append("g")
            .attr("id", "x-axis");
        xGroup.call(xAxis
            .tickSize(-plot.width, 0, 0));
        xGroup.attr("transform", "translate(0," + plot.height + ")");

        let yGroup = plots.append("g")
            .attr("id", "y-axis")
            .attr("x", 2)
            .attr("y", y(y.ticks().pop()) + 0.5)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .text("No. of Incidents");

        yGroup.call(yAxis
            .tickSize(-plot.width, 0, 0));

        let color = d3.scaleOrdinal(d3.schemeTableau10);

        let slice = plots.selectAll(".slice")
            .data(data)
            .enter().append("g")
            .attr("class", "g")
            .attr("transform", function(d) {
                return "translate(" + x0(d.month) + ",0)";
            });

        console.log("Data final: ", data);

        let bars = slice.selectAll("rect")
            .data(function(d) {
                return d.values;
            });
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("width", x1.bandwidth())
            .attr("x", function(d) {
                return x1(d.battalion);
            })
            .style("fill", function(d) {
                return color(d.battalion);
            })
            .style("opacity", 1)
            .style("stroke", "white")
            .attr("y", function(d) {
                return y(d.incident);
            })
            .attr("height", function(d) {
                return plot.height - y(d.incident);
            })
            .on("mouseover", function(d) {

                tooltip.transition()		
                    .duration(1000)		
                    .style("opacity", .8)
                tooltip
                    .style("left", (d3.event.pageX - 90) + "px")
                    .style("top", (d3.event.pageY - 90) + "px")
                    .style("display", "inline-block")

                d3.selectAll("#D3Prototype1 rect")
                    .filter(e => (d.battalion !== e.battalion))
                    .transition()
                    .style("fill-opacity", "0.2");                
                
                let rows = tooltip.append("table")
                    .attr("id", "tableToolTip")
                    .selectAll("tr")
                    .data(Object.keys(d))
                    .enter()
                    .append("tr");

                console.log("Object.keys(d):",Object.keys(d))
                console.log("incident: ", d.incident)

                rows.append("th").text(key => key);
                rows.append("td").text(key => d[key]);

            })
            .on("mouseout", function(d, i){
                tooltip
                    .transition()		
                    .duration(500)		
                    .style("opacity", 0);

                d3.selectAll("table").remove();
                    
                d3.selectAll("#D3Prototype1 rect").transition()
                    .style("fill-opacity", "1");
            });

        //Legend
        var legend = d3.select('body').select('#legend');

        var test = legend.selectAll(".legend")
            .data(data[0].values.map(function(d) {
                return d.battalion;
            }))
            .enter().append("g")
            .attr("class", "legend")
            .style("opacity", "1")
            .attr("transform", function(d, i) {
                return "translate(-800," + i*25 + ")";
            });

        test.append("rect")
            .attr("x", plot.width - 18)
            .attr("y", 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d) {
                return color(d);
            })
            .style("opacity", 1);

        test.append("text")
            .attr("x", plot.width - 24)
            .attr("y", 25)
            .attr("font-size", 1)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) {
              return d;
            });

        test.transition().duration(500).delay(function(d,i){ return 1300 + 100 * i; }).style("opacity","1");
    
        legend.append("text")
            .attr("class", "label")
            .attr("font-size", 6)
            .attr("x", 30)
            .attr("y", "8")
            .attr("dy", ".35em")
            .style("opacity", "1")
            .transition().duration(500).delay(function(d,i){ return 1300 + 100 * i; }).style("opacity","1")
            .text("Battalion")
};

let parseColumnName = d3.timeParse('%mm%dd%yyyy');

function convert (row) {
    let keep = {};

    if (row["Battalion"] != "B99") {
        keep.battalion = row["Battalion"];

        let splitted = split(row["Watch Date"]);

        keep.date = splitted.date;
        keep.time = splitted.time;
        keep.month = parseInt(splitted.month);
        keep.incident = parseInt(row["Incident Number"]);
        keep.type = row["Call Type Group"];
      } else {
        return null; 
      }

      return keep;
}

function split (string){
    let arr = {};
    let sp = string.split(" ");

    arr.date = sp[0];
    arr.time = sp[1];

    let sp2 = string.split("/");
    arr.month = sp2[0];

    return arr;
}

function dateFormatter (d){
    let month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    
    return month[d-1];
}

function numFormatter (d) {
    let num = parseFloat(d);
    num = num / 1000;
    return num + ' K'
}

function translate(x, y) {
    return 'translate(' + x + ',' + y + ')';
}