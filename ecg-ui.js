// D3.js animated ECG-style rainfall visualization with labeled R peaks
// Assumes you have d3.js v7 loaded and a CSV file structured like: Date,R_Value,RR_Days
let showFullDate = false;
let showLabels = false;
const toggleContainer = d3.select("body")
  .insert("div", ":first-child")
  .style("position", "fixed")
  .style("top", "10px")
  .style("right", "10px")
  .style("background", "rgba(255,255,255,0.5")
  .style("padding", "5px 10px")
  .style("border-radius", "4px")
  .style("font-family", "sans-serif")
  .style("font-size", "12px")
  .style("z-index", 1000);

toggleContainer.append("label")
  .style("display", "block")
  .style("font-family", "Helvetica Neue")
  .style("text-transform", "uppercase")
  .text("SHOW FULL DATE")
  .append("input")
  .attr("type", "checkbox")
  .property("checked", false)
  .style("margin-left", "8px")
  .on("change", function() {
    showFullDate = d3.select(this).property("checked");
    if (!showLabels) {
      d3.selectAll("text.label-date")
        .text(d => showFullDate ? d.fullDate : d.date);
    }
  });

toggleContainer.append("label")
  .style("display", "block")
  .style("font-family", "Helvetica Neue")
  .style("text-transform", "uppercase")
  .text("HIDE LABELS")
  .append("input")
  .attr("type", "checkbox")
  .property("checked", false)
  .style("margin-left", "8px")
  .on("change", function() {
    showLabels = d3.select(this).property("checked");
    d3.selectAll("text.label-date")
      .style("display", showLabels ? "none" : "block");
  });

// Add data gap marker below toggles
  toggleContainer.append("div").style("font-family", "Helvetica Neue").style("text-transform", "uppercase").style("color", "black").style("font-style", "italic").text("Gap in : 1941–1946");

d3.csv("cleaned_r_rr_by_year.csv").then(data => {
  const lineHeight = 200; // doubled spacing between lines
  const scaleX = 0.13;
  const scaleY = 0.3;

  const width = window.innerWidth;
  // Dynamically calculate height to fit all ECG rows and allow scrolling
  const rows = Math.ceil(data.length / 10); // estimate rows needed
  const height = (lineHeight + 30) * rows + 100;

  const svg = d3.select("body")
    .style("margin", "0")
    .style("padding", "0")
    .style("overflow-y", "auto")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "none"); // remove box, transparent background

  const line = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveBasis);

  let allPaths = [];
  let textLabels = [];
  let x = 0;
  let yBase = 200;
  let currentPoints = [];

  data.forEach((d, i) => {
    const r = +d.R_Value;
    const rawSpacing = +d.RR_Days;
    const cappedSpacing = Math.min(rawSpacing, 500); // cap long gaps
    const spacing = cappedSpacing * scaleX;
    const amp = r * scaleY;
    const chaosFactor = 0.8 + Math.random() * 0.6;
    const points = [];

    for (let j = 0; j < spacing; j++) {
      const px = x + j;
      const sin1 = Math.sin(j * 0.2 + i * 0.2) * 12 * chaosFactor;
      const sin2 = Math.sin(j * 0.5 + i) * 6 * chaosFactor;
      const perlin = Math.sin(j * 0.03 + i * 0.1) * 20 * chaosFactor;
      const drift = Math.sin(j * 0.005 + i) * 15 * chaosFactor;
      const peak = -amp * Math.exp(-Math.pow((j - spacing / 2) / 10, 2));
      const py = yBase + sin1 + sin2 + perlin + drift + peak;
      points.push([px, py]);
    }

    currentPoints = currentPoints.concat(points);

    const year = d.Date ? d.Date.split("-")[0].trim() : "";
    const peakY = d3.min(points.map(p => p[1]));
    textLabels.push({ x: x + spacing / 2, y: peakY - 10, date: year, fullDate: d.Date });

    x += spacing;
    if (x > width) {
      allPaths.push(currentPoints);
      currentPoints = [];
      x = 0;
      yBase += lineHeight + 30;
    }
  });

  if (currentPoints.length > 0) {
    allPaths.push(currentPoints);
  }

  function drawPathSequentially(index) {
    if (index >= allPaths.length) return;

    const points = allPaths[index];
    const path = svg.append("path")
      .datum(points)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .attr("stroke-dasharray", function() {
        const totalLength = this.getTotalLength();
        return `${totalLength} ${totalLength}`;
      })
      .attr("stroke-dashoffset", function() {
        return this.getTotalLength();
      });

    const totalLength = path.node().getTotalLength();

    path.transition()
      .duration(4000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .on("end", () => drawPathSequentially(index + 1));
  }

  

  drawPathSequentially(0);

  // Draw text labels
  textLabels.forEach(label => {
    svg.append("text")
      .attr("class", "label-date")
      .attr("x", label.x)
      .attr("y", label.y)
      .attr("text-anchor", "middle")
      .attr("font-size", "6px")
      .attr("fill", "#333")
      .datum(label)
      .text(showFullDate ? label.fullDate : label.date);
     // .text(data[i].Date);
  });
});
