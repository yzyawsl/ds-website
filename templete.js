
// Load the data
const boxTarget = d3.select("#boxplot");
const barTarget = d3.select("#barplot");
const lineTarget = d3.select("#lineplot");

// ===== 1) BOX PLOT: Likes distribution by AgeGroup =====
const socialMedia = d3.csv("socialMedia.csv");

socialMedia.then(function(data) {
  data.forEach(function(d) {
    d.Likes = +d.Likes;
  });

  // Dimensions
  const margin = { top: 30, right: 20, bottom: 60, left: 60 };
  const width = 720;
  const height = 420;

  // SVG
  const svg = boxTarget.append("svg")
    .attr("width", width)
    .attr("height", height);

  // X scale - Age groups
  const ageGroups = [...new Set(data.map(d => d.AgeGroup))];
  const xScale = d3.scaleBand()
    .domain(ageGroups)
    .range([margin.left, width - margin.right])
    .padding(0.35);

  // Y scale - Likes
  const yMin = 0;
  const yMax = d3.max(data, d => d.Likes);
  const yScale = d3.scaleLinear()
    .domain([yMin, yMax]).nice()
    .range([height - margin.bottom, margin.top]);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  // Axis labels
  svg.append("text")
    .attr("x", (width) / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .text("Age Group");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", - (height / 2))
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .text("Likes");

  // Compute quantiles per group
  const rollupFunction = function(groupData) {
    const values = groupData.map(d => d.Likes).sort(d3.ascending);
    const min = d3.min(values);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    const max = d3.max(values);
    return { min, q1, median, q3, max };
  };

  const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.AgeGroup);

  // Draw each box
  quantilesByGroups.forEach((q, group) => {
    const x = xScale(group);
    const boxWidth = xScale.bandwidth();
    const boxCenter = x + boxWidth / 2;

    // Whiskers: min to q1, q3 to max
    svg.append("line")
      .attr("x1", boxCenter)
      .attr("x2", boxCenter)
      .attr("y1", yScale(q.min))
      .attr("y2", yScale(q.q1))
      .attr("stroke", "black");

    svg.append("line")
      .attr("x1", boxCenter)
      .attr("x2", boxCenter)
      .attr("y1", yScale(q.q3))
      .attr("y2", yScale(q.max))
      .attr("stroke", "black");

    // Whisker caps
    svg.append("line")
      .attr("x1", x + boxWidth * 0.2)
      .attr("x2", x + boxWidth * 0.8)
      .attr("y1", yScale(q.min))
      .attr("y2", yScale(q.min))
      .attr("stroke", "black");

    svg.append("line")
      .attr("x1", x + boxWidth * 0.2)
      .attr("x2", x + boxWidth * 0.8)
      .attr("y1", yScale(q.max))
      .attr("y2", yScale(q.max))
      .attr("stroke", "black");

    // Box: q1 to q3
    svg.append("rect")
      .attr("x", x)
      .attr("y", yScale(q.q3))
      .attr("width", boxWidth)
      .attr("height", Math.max(1, yScale(q.q1) - yScale(q.q3)))
      .attr("fill", "#ddd")
      .attr("stroke", "black");

    // Median line
    svg.append("line")
      .attr("x1", x)
      .attr("x2", x + boxWidth)
      .attr("y1", yScale(q.median))
      .attr("y2", yScale(q.median))
      .attr("stroke", "black")
      .attr("stroke-width", 2);
  });
});


// ===== 2) SIDE-BY-SIDE BAR CHART: Avg Likes by Platform & PostType =====
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
  // Cast
  data.forEach(d => d.AvgLikes = +d.AvgLikes);

  // Dimensions
  const margin = { top: 30, right: 160, bottom: 60, left: 60 };
  const width = 760;
  const height = 420;

  // SVG
  const svg = barTarget.append("svg")
    .attr("width", width)
    .attr("height", height);

  const platforms = [...new Set(data.map(d => d.Platform))];
  const types = [...new Set(data.map(d => d.PostType))];

  // Scales
  const x0 = d3.scaleBand()
    .domain(platforms)
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const x1 = d3.scaleBand()
    .domain(types)
    .range([0, x0.bandwidth()])
    .padding(0.15);

  const yMax = d3.max(data, d => d.AvgLikes);
  const y = d3.scaleLinear()
    .domain([0, yMax]).nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
    .domain(types)
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x0));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Axis labels
  svg.append("text")
    .attr("x", (width) / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .text("Platform");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", - (height / 2))
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .text("Average Likes");

  // Grouped bars
  const grouped = d3.group(data, d => d.Platform);

  const gPlatform = svg.append("g")
    .selectAll("g")
    .data(platforms)
    .enter()
    .append("g")
      .attr("transform", d => `translate(${x0(d)},0)`);

  gPlatform.selectAll("rect")
    .data(d => (grouped.get(d) || []))
    .enter()
    .append("rect")
      .attr("x", d => x1(d.PostType))
      .attr("y", d => y(d.AvgLikes))
      .attr("width", x1.bandwidth())
      .attr("height", d => Math.max(0, y(0) - y(d.AvgLikes)))
      .attr("fill", d => color(d.PostType));

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

  types.forEach((type, i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 22)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", color(type));

    legend.append("text")
      .attr("x", 20)
      .attr("y", i * 22 + 11)
      .attr("alignment-baseline", "middle")
      .text(type);
  });
});


// ===== 3) LINE PLOT: Avg Likes by Date =====
const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
  // Parse date
  const parseDate = d3.timeParse("%m/%d/%Y");
  data.forEach(d => {
    d.Date = parseDate(d.Date);
    d.AvgLikes = +d.AvgLikes;
  });

  // Dimensions
  const margin = { top: 30, right: 20, bottom: 60, left: 60 };
  const width = 720;
  const height = 420;

  // SVG
  const svg = lineTarget.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Scales
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.Date))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.AvgLikes)]).nice()
    .range([height - margin.bottom, margin.top]);

  // Axes
  const xAxis = d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%-m/%-d"));
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Axis labels
  svg.append("text")
    .attr("x", (width) / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .text("Date (March 1–7, 2024)");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", - (height / 2))
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .text("Average Likes");

  // Line
  const line = d3.line()
    .x(d => x(d.Date))
    .y(d => y(d.AvgLikes))
    .curve(d3.curveNatural);

  svg.append("path")
    .datum(data.sort((a,b) => a.Date - b.Date))
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Points
  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
      .attr("cx", d => x(d.Date))
      .attr("cy", d => y(d.AvgLikes))
      .attr("r", 3.5)
      .attr("fill", "#1f77b4");
});
