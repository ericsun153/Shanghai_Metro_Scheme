style.css$(async () => {

    const w_svg = d3.select("#worldSvg svg");
    const w_margin = { top: 20, right: 30, bottom: 30, left: 100 };
    const w_width = +w_svg.attr("width") - w_margin.left - w_margin.right;
    const w_height = +w_svg.attr("height") - w_margin.top - w_margin.bottom;

    let currentYear = 2005; // Start year for the animation  
    const yearsData = [...Array(2024 - 1861).keys()].slice(1).map(it => it + 1861); // Years for which we have w_data  
    console.log(yearsData)
    let yearsIndex = yearsData.indexOf(currentYear); // Index to iterate through yearsData  

    const x = d3.scaleBand()
        .range([0, w_height])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([0, w_width]);

    const g = w_svg.append("g")
        .attr("transform", "translate(" + w_margin.left + "," + w_margin.top + ")");

    // Mock w_data representing metro lengths for different countries over the years  

    async function getData() {
        return world_metro_year
    }

    const w_data = await fetchSync('./data/world_metro_year.json')

    console.log(w_data)

    //  w_data = [
    //     { country: 'Country A', year: 2000, length: 100 },
    //     { country: 'Country B', year: 2000, length: 90 },
    //     { country: 'Country C', year: 2000, length: 75 },
    //     { country: 'Country A', year: 2005, length: 120 },
    //     { country: 'Country B', year: 2005, length: 160 },
    //     { country: 'Country C', year: 2005, length: 90 },
    //     // ... add more w_data for other years and countries  
    // ];

    function updateChart(year) {
        // Filter w_data for the current year  
        // const filteredData = w_data.filter(d => d.year === year);

        const data = w_data.find(w => w.year == year)

        let filteredData = []
        Object.keys(data).forEach(key => {
            if (key !== 'year') {
                filteredData.push({
                    country: key, year, length: data[key]
                })
            }
        })

        // Sort the w_data by length in descending order.  
        filteredData = filteredData.sort((a, b) => b.length - a.length).slice(0, 10);

        // Update domains  
        x.domain(filteredData.map(d => d.country));
        y.domain([0, d3.max(filteredData, d => d.length)]);

        // Join new w_data with old elements  
        const bars = g.selectAll(".bar")
            .data(filteredData, d => d.country + d.year);

        // Exit old elements not present in new w_data  
        bars.exit().remove();

        // Enter new elements present in new w_data  
        const barsEnter = bars.enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => x(d.country))
            .attr("x", 0) // Start bars at the bottom  
            .attr("height", x.bandwidth())
            .attr("width", 0) // Initialize with w_height 0 for transition  
            .append("title") // Tooltip with the length value  
            .text(d => d.country + ": " + d.length + " km");

        // Update both old and new elements to their final positions  
        bars.merge(barsEnter)
            .transition() // Start a transition  
            .duration(1000) // Specify the duration  
            // .attr("x", d => y(d.length)) // Update y position  
            .attr("x", 0) // Update y position  
            .attr("width", d => {
                // console.log(w_height, d, y(d.length))
                return y(d.length)
            }); // Update w_height  

        // Labels for the bars  
        const labels = g.selectAll(".label")
            .data(filteredData, d => d.country + d.year);

        labels.exit().remove();

        labels.enter().append("text")
            .attr("class", "label")
            .attr("y", d => x(d.country) + x.bandwidth() / 2)
            // .attr("x", w_height) // Start labels at the bottom  
            // .attr("x", w_height) // Start labels at the bottom  
            .attr("x", 0) // Start labels at the bottom  
            .attr("text-anchor", "middle")
            .merge(labels)
            .transition()
            .duration(1000)
            .attr("x", d => y(d.length) + 10)
            .text(d => d.length);

        // Update x-axis  
        g.select(".x-axis")
            .transition()
            .call(d3.axisBottom(y));

        // Update y-axis  
        g.select(".y-axis")
            .transition()
            .call(d3.axisLeft(x));
    }

    // Initial chart setup  
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0, -20)");
    // .attr("transform", "translate(0," + w_height + ")");  

    g.append("g")
        .attr("class", "y-axis");

    // Update chart for the initial year  
    updateChart(currentYear);
    updateChart(currentYear);
    $("#year").append(yearsData.map(year => `<option value="${year}">${year}</option>`).join(''))
    $('#year').val(currentYear)

    // Function to advance to the next year in the w_data set  
    function advanceYear() {
        currentYear = yearsData[yearsIndex];
        console.log(currentYear);
        updateChart(currentYear);
        updateChart(currentYear);
        $('#year').text(currentYear)
        yearsIndex = (yearsIndex + 1) % yearsData.length; // Loop back to the start when reaching the end  

        // Recursively call this function after a delay to create the animation effect  
        setTimeout(advanceYear, 2000); // Change w_data every 2 seconds  
    }

    // Start the animation loop  
    // advanceYear();  

    $('#year').on('change', function () {
        currentYear = +$(this).val();
        updateChart(currentYear);
        updateChart(currentYear);
    })
})