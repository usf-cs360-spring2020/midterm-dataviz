var margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50
};

var svg_width = 1000,
  svg_height = 800;

var padding = 100;

var rScale = d3.scaleSqrt()
  .domain([0, 1000])
  .range([1, 20]);

var width = svg_width - margin.left - margin.right;
var height = svg_height - margin.top - margin.bottom;

var svg = d3.select("body").select("#main-svg")
  .attr("width", svg_width)
  .attr("height", svg_height);

var div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var n_rows = 4;
var space = {
  width: (width - padding),
  height: (height - padding) / n_rows
}


drawCircleLegend();
drawColorLegend();

let csv = 'Fire_Department_Calls_for_Services.csv';

d3.csv(csv, convertRow).then(drawBubblePlotMatrix);

// try: parseColumnName('01/01/2019 12:00:00 AM');
let parseColumnName = d3.timeParse("%m/%d/%Y %H:%M:%S %p");

function convertRow(row, index) {
  let keep = {}

  keep.Battalion = row.Battalion;
  keep.Station_Area = row.Station_Area == "" ? 0 : parseInt(row.Station_Area);
  keep.Incident_Number = parseInt(row.Incident_Number);
  keep.Watch_Date = parseColumnName(row.Watch_Date);
  keep.Call_Type_Group = row.Call_Type_Group;

  return keep;
}

function drawBubblePlotMatrix(data) {
  console.log(data);
  console.log(data[0]);

  var filtereddata = data.filter(function(d, i) {
    return d.Station_Area != 0 && d.Battalion != "B99" &&
      d.Call_Type_Group != "";
  })

  console.log(filtereddata);

  let dataGroup = d3.nest()
    .key(function(d) {
      return d.Call_Type_Group;
    })
    .key(function(d) {
      return d.Battalion;
    })
    .key(function(d) {
      return d.Station_Area;
    })
    .rollup(function(v) {
      return d3.mean(v, function(d) {
        return d.Incident_Number;
      });
    })
    .entries(filtereddata);

  data = dataGroup;

  console.log(data);

  var allCallTypes = d3.map(filtereddata, function(d) {
    return d.Call_Type_Group;
  }).keys();
  var allBatallions = d3.map(filtereddata, function(d) {
    return d.Battalion;
  }).keys().sort(function(a, b) {
    return d3.descending(a, b);
  });
  var allStations = d3.map(filtereddata, function(d) {
      return d.Station_Area;
    }).keys()
    .sort(function(a, b) {
      return parseInt(a) - parseInt(b);
    });

  console.log(allCallTypes);
  console.log(allBatallions);
  console.log(allStations);

  let j = 0;
  for (let i = 0; i < allCallTypes.length; i++) {
    draw_bubbleplot(data,
      margin.left + j * (space.width + padding),
      margin.top + i * (space.height + padding / (n_rows - 1)),
      allBatallions, allStations, allCallTypes, i)
  }

}

function draw_bubbleplot(data, x_start, y_start, allBatallions, allStations, allCallTypes, i) {
  var xScale = d3.scaleBand()
    .domain(allStations)
    .range([0, space.width]);

  var yScale = d3.scaleBand()
    .domain(allBatallions)
    .range([space.height, 0]);

  var xAxis = d3.axisBottom().scale(xScale);
  var yAxis = d3.axisLeft().scale(yScale);

  var g = svg.append('g');

  g.attr('transform', 'translate(' + x_start + ', ' + y_start + ')');

  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', space.width)
    .attr('height', space.height)
    .style('fill', 'none')
    .attr('pointer-events', 'all')

  g.append('g')
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + (space.height) + ")")
    .call(xAxis)
    .append('text')
    .attr('x', space.width - 10)
    .attr('y', 30)
    .attr('class', 'label')
    .style('fill', 'black')
    .text('Stations');

  g.append('g')
    .attr("class", "y-axis")
    .call(yAxis)
    .append('text')
    .attr('x', 8)
    .attr('y', 0)
    .attr('text-anchor', 'end')
    .attr('class', 'label')
    .style('fill', 'black')
    .text('Battalion')
    .attr("dy", "-3.5em")
    .attr("transform", "rotate(-90)");

  // covert map to array
  var out = [];
  var values = [];
  for (let k = 0; k < data[i].values.length; k++) {
    for (let h = 0; h < data[i].values[k].values.length; h++) {
      values = [];
      values.push(data[i].values[k].key, data[i].values[k].values[h].key, data[i].values[k].values[h].value);
      out.push(values);
    }
  }

  var colours = ["#1f77b4", "#d62728", "#ff7f0e", "#17becf"];

  var bubbles = g.selectAll('circle')
    .data(out)
    .enter()
    .append('circle')
    .attr("id", (d, i) => d.id = "c" + i)
    .attr('fill', colours[i])
    .attr('stroke-width', 1)
    .style('opacity', 0.75);

  bubbles.attr('cx', function(d) {
    return xScale(d[1]) + 10;
  });
  bubbles.attr('cy', function(d) {
    return yScale(d[0]) + 7;
  });
  bubbles.attr('r', function(d) {
    return rScale(d[2]);
  });

  bubbles.style('stroke', 'black');
  bubbles.on("mouseover", function(d) {
      d3.selectAll("circle#" + d.id)
        //.raise()
        .transition()
        .style("stroke-width", 1.5);
      showLabel(d, allCallTypes[i]);
      fade(d, .1);
    })
    .on("mousemove", moveLabel)
    .on("mouseout", function(d) {
      d3.selectAll("circle#" + d.id)
        //.lower()
        .transition()
        .style("stroke-width", 0.75);
      hideLabel();
      fadeOut();
    })

}

function showLabel(d, callType) {
  var coords = [d3.event.clientX, d3.event.clientY];
  var top = coords[1] + 15,
    left = coords[0] + 10;

  stationLookUp().then(function(data) {
    let out = new Map();

    for (let i = 0; i < data.length; i++) {
      out.set(data[i].Station_Area, data[i].Station)
    }

    div.transition()
      .duration(200)
      .style("opacity", 1);
    div.html("<b>Battalion:" + d[0] + "</b></br>" +
        "Call Type: " + callType + "</br>" +
        "Station Number: " + d[1] + "</br>" +
        "Station Area: " + out.get(d[1]) + "</br>" +
        "Avg. Incident Number: " + numberFormatter(d[2]))
      .style("top", top + "px")
      .style("left", left + "px");
  });
}

function moveLabel() {
  var coords = [d3.event.clientX, d3.event.clientY];

  var top = coords[1] + 15,
    left = coords[0] + 10;

  div.style("top", top + "px")
    .style("left", left + "px");
}

function hideLabel() {
  div.transition()
    .duration(200)
    .style("opacity", 0);
}

function fade(c, opacity) {
  //to fade all circles of non specific types
  d3.selectAll("#main-svg circle")
    .filter(function(d) {
      return d[0] != c[0];
    })
    .transition()
    .style("opacity", opacity);

  // to highlight circles of specific type
  d3.selectAll("#main-svg circle")
    .filter(function(d) {
      return d[0] == c[0];
    })
    .transition()
    .style("opacity", 0.75);
}

function fadeOut() {
  d3.selectAll("circle")
    .transition()
    .style("opacity", 0.75);
}


function stationLookUp() {
  let csv = 'StationLookUp.csv';

  function convertRow(row, index) {
    let out = {};

    out.Station_Area = row.Station_Area;
    out.Station = row.Station;

    return out;
  }

  return d3.csv(csv, convertRow);
}

function numberFormatter(number) {
  var formatInteger = d3.format(",");
  var formatDecimal = d3.format(",.2f");

  return !(number % 1) ? formatInteger(number) : formatDecimal(number);
}

function drawCircleLegend() {
  const legendWidth = 500;
  const legendHeight = 500;

  let svg = d3.select("body").select("#legend-svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight);
  // place legend into its own group
  const group = svg.append('g').attr('id', 'circle-legend');

  // position legend
  group.attr('transform', translate(margin.right, margin.top))

  // https://d3-legend.susielu.com/#size-linear
  const legendSize = d3.legendSize()
    .scale(rScale)
    .shape('circle')
    .cells(6)
    .ascending(true)
    .shapePadding(4)
    .labelOffset(10)
    .labelFormat("d")
    .title('Average Incident Number')
    .orient('vertical');

  group.call(legendSize);

  // fix the title spacing
  group.select('text.legendTitle').attr('dy', -8);
}

function drawColorLegend() {

  const legendWidth = 500;
  const legendHeight = 500;


  let svg = d3.select("body").select("#legend-svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight);
  // place legend in its own group
  const group = svg.append('g').attr('id', 'color-legend');

  // shift legend to appropriate position
  group.attr('transform', translate(margin.right, 300));

  const title = group.append('text')
    .attr('class', 'axis-title')
    .text('Call Type');

  // fix the title spacing
  title.attr('dy', -8);

  // Color legend
  var colorScale = d3.scaleOrdinal()
    .domain(["Alarm", "Fire", "Non Life-threatening", "Potentially Life-Threatening"])
    .range(["#1f77b4", "#d62728", "#ff7f0e", "#17becf"]);

  // https://d3-legend.susielu.com/#size-linear
  var colorLegend = d3.legendColor()
    .scale(colorScale)
    .shapePadding(5)
    .shapeWidth(20)
    .shapeHeight(20)
    .labelOffset(12);

  group.call(colorLegend);
}

function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}
