const width = 550;
const height = 450;
const margin = { top: 20, right: 30, bottom: 30, left: 50 };

const svg = d3.select("#linesvg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 模拟数据  
const data = [160, 176, 256, 306, 358, 565, 670, 800, 848, 911, 930, 936, 969, 1015, 1062, 774, 977, 643, 1002, 911].map((item, i) => {
    return {
        x: 2005 + i,
        y: item
    }
})

// X比例尺  
const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.x))
    .range([0, width]);

// Y比例尺  
const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.y)])
    .range([height, 0]);

// 添加X轴  
svg.append("g")
    .attr("class", "x-axis")
    .attr('stroke','#ddd')
    .attr('font-size',12)
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => d));

// 添加Y轴  
svg.append("g")
    .attr("class", "y-axis")
    .attr('stroke','#ddd')
    .attr('font-size', 12)
    .call(d3.axisLeft(yScale));

svg.select('x-axis').selectAll(".tick line") // 选择刻度线  
    .attr("stroke", "#ddd"); // 设置颜色为  
  
svg.select('y-axis').selectAll(".domain") // 选择坐标轴的主线  
    .attr("stroke", "#ddd"); // 设置颜色为

svg.select('y-axis').selectAll('.domain').attr("stroke", "#ddd"); 

// 添加网格线  
svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(10).tickSize(-height, 0, 0).tickFormat(""));

svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale).ticks(10).tickSize(-width, 0, 0).tickFormat(""));

// 折线图  
const line = d3.line()
    .x(d => xScale(d.x))
    .y(d => yScale(d.y));

svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);

// 工具提示  
let tooltip = d3.select("body").select("#tooltip");
// 折线的点  
const dots = svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 5)
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .on("mouseover", function (d) {
        d3.select(this).classed("highlight", true);
        showTooltip(d); // 显示工具提示  
        addCrosshair(d);
    })
    .on("mouseout", function (d) {
        d3.select(this).classed("highlight", false);
        // hideTooltip(); // 隐藏工具提示  
        // removeCrosshair();  
    });

// 添加十字星和高亮  
let crosshairG = null;

function addCrosshair(d) {
    if (!crosshairG) {
        crosshairG = svg.append("g").attr("class", "crosshair");
    }

    const x = xScale(d.x);
    const y = yScale(d.y);

    crosshairG.selectAll("*").remove();

    crosshairG.append("line")
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", width)
        .attr("y2", y);

    crosshairG.append("line")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", height);

    crosshairG.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5);
}

function removeCrosshair() {
    if (crosshairG) {
        crosshairG.selectAll("*").remove();
    }
}

// 显示工具提示  
function showTooltip(d) {
    console.log(d,d3.event)
    tooltip.style("display", "block")
        .style("left", `${d3.event.clientX - margin.left - (window.document.body.clientWidth / 2 - 500) + 300}px`)
        .style("top", `${d3.event.clientY - 70}px`)
        .html(`
                    <div style="display:flex; flex-direction:column; align-items: flex-start;">
                        <div><b>Year:</b> ${d.x}</div>
                        <div><b>Passenger Flow:</b> ${d.y * 10} thousand</div>
                    </div>
                `);
}

// 隐藏工具提示  
function hideTooltip() {
    tooltip.style("display", "none");
}  