const { useEffect, useState } = React;

const MatrixView = ({ data }) => {
    const [showMax, setShowMax] = useState(true);
    const width = 1200, height = 600, margin = { top: 50, right: 200, bottom: 50, left: 60 };
    const years = [...new Set(data.map(d => d.year))];
    const months = d3.range(1, 13);

    useEffect(() => {
        d3.select("#matrix").selectAll("*").remove();

        const svg = d3.select("#matrix").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand().domain(years).range([0, width]).padding(0.05);
        const yScale = d3.scaleBand().domain(months).range([0, height]).padding(0.05);
        const colorScale = d3.scaleSequential(d3.interpolateRainbow)
    .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.maxTemp)]);

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        svg.append("text")
            .attr("x", width / 2) // Center horizontally
            .attr("y", -margin.top / 2) // Adjust vertical position above the matrix
            .attr("text-anchor", "middle") // Align text to the center
            .attr("font-size", "25px")
            .attr("font-weight", "bold")
            .text(` ${showMax ? "Max" : "Min"} Temperature`);
        // Heatmap cells
        svg.selectAll(".cell")
            .data(data)
            .enter().append("rect")
            .attr("x", d => xScale(d.year))
            .attr("y", d => yScale(d.month))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(showMax ? d.maxTemp : d.minTemp))
            .on("mouseover", (event, d) => {
                d3.select("#tooltip")
                    .style("visibility", "visible")
                    .html(`Year: ${d.year}, Month: ${monthNames[d.month - 1]}<br/> Max: ${d.maxTemp}°C, Min: ${d.minTemp}°C`);
            })
            .on("mousemove", (event) => {
                d3.select("#tooltip")
                    .style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => {
                d3.select("#tooltip").style("visibility", "hidden");
            });

        // Mini-line chart inside each cell
        data.forEach(d => {


            const miniX = d3.scaleLinear()
                .domain([1, 31]) // Days of the month
                .range([0, xScale.bandwidth()]);
            
            const miniY = d3.scaleLinear()
                .domain([d3.min(d.dailyTemps, t => t.min), d3.max(d.dailyTemps, t => t.max)])
                .range([yScale.bandwidth(), 0]);

            const lineMax = d3.line()
                .x((t, i) => miniX(i + 1))
                .y(t => miniY(t.max));

            const lineMin = d3.line()
                .x((t, i) => miniX(i + 1))
                .y(t => miniY(t.min));

            const cellGroup = svg.append("g")
                .attr("transform", `translate(${xScale(d.year)}, ${yScale(d.month)})`);

            cellGroup.append("path")
                .datum(d.dailyTemps)
                .attr("d", lineMax)
                .attr("stroke", "green")
                .attr("stroke-width", 1)
                .attr("fill", "none");

            cellGroup.append("path")
                .datum(d.dailyTemps)
                .attr("d", lineMin)
                .attr("stroke", "blue")
                .attr("stroke-width", 1)
                .attr("fill", "none");
        });

        // Year and Month axes
        svg.append("g").attr("transform", `translate(0,0)`).call(d3.axisTop(xScale));
        svg.append("g").call(d3.axisLeft(yScale).tickFormat(d => monthNames[d - 1]));

        // Add legend for min/max temperature lines
        /*const legendGroup = svg.append("g")
            .attr("transform", `translate(${width + 20}, 20)`); // Position the legend

        legendGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "green");

        legendGroup.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text("Max Temperature")
            .style("font-size", "12px")
            .style("font-weight", "bold") 
            .style("fill", "black")
            .attr("alignment-baseline", "middle");

        legendGroup.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "blue");

        legendGroup.append("text")
            .attr("x", 30)
            .attr("y", 45)
            .text("Min Temperature")
            .style("font-size", "12px")
            .style("font-weight", "bold") 
            .style("fill", "black")
            .attr("alignment-baseline", "middle");//*/

        // Add color scale legend for temperature intensity

       
        
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20}, 50)`);
        const legendWidth = 20, legendHeight = 400;

        const legendGradient = legend.append("defs").append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%").attr("y1", "100%")
            .attr("x2", "0%").attr("y2", "0%");
                
        const colorStops = [
            { offset: "0%", color: d3.interpolateRainbow(0) },
            { offset: "50%", color: d3.interpolateRainbow(0.5) },
            { offset: "100%", color: d3.interpolateRainbow(1) }
        ];
                
        colorStops.forEach(stop => {
            legendGradient.append("stop")
                .attr("offset", stop.offset)
                .attr("stop-color", stop.color);
        });

        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        const legendScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.maxTemp)])
            .range([legendHeight, 0]);

        legend.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(d3.axisRight(legendScale).ticks(5));

    }, [data, showMax]);

    return React.createElement("div", null,
        React.createElement("button", { onClick: () => setShowMax(!showMax) }, 
            `Display ${showMax ? "Min" : "Max"} Temperature`
        ),
        React.createElement("div", { id: "matrix" }),
        React.createElement("div", { id: "tooltip", 
            style: { position: "absolute", visibility: "hidden", background: "white", padding: "5px", border: "1px solid black" } })
    );
};

// Function to load and process the CSV file
const loadData = () => {
    d3.csv("temperature_daily.csv").then((data) => {
        data.forEach(d => {
            d.date = new Date(d.date);
            d.year = d.date.getFullYear();
            d.month = d.date.getMonth() + 1;
            d.minTemp = +d.min_temperature;
            d.maxTemp = +d.max_temperature;
        });

        // Process the data for min/max values and store daily temperatures
        const processedData = [];
        const groupedData = d3.group(data, d => d.year, d => d.month);

        groupedData.forEach((yearGroup, year) => {
            if (year >= 2007){
            yearGroup.forEach((monthGroup, month) => {
                const minTemp = d3.min(monthGroup, d => d.minTemp);
                const maxTemp = d3.max(monthGroup, d => d.maxTemp);
                const dailyTemps = monthGroup.map(d => ({ day: d.date.getDate(), min: d.minTemp, max: d.maxTemp }));

                processedData.push({
                    year: +year,
                    month: +month,
                    minTemp,
                    maxTemp,
                    dailyTemps
                });
            
            });
        }
        });

        ReactDOM.render(
            React.createElement(MatrixView, { data: processedData }),
            document.getElementById("root")
        );
    });
};

loadData();
