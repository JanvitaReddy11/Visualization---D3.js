const { useEffect, useState } = React;

const MatrixView = ({ data }) => {
    const [showMax, setShowMax] = useState(true);
    const width = 1000, height = 600, margin = { top: 50, right: 50, bottom: 50, left: 100 };
    const years = [...new Set(data.map(d => d.year))];
    const months = d3.range(1, 13); // Months 0-11

    // Updated color scale: Yellow (Cool) → Red (Hot)
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.maxTemp)]);

    useEffect(() => {
        // Clear previous SVG content
        d3.select("#matrix").selectAll("*").remove();
    
        // Set up the SVG container
        const svg = d3.select("#matrix").append("svg")
            .attr("width", width + margin.left + margin.right + 150)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Define scales
        const xScale = d3.scaleBand().domain(years).range([0, width]).padding(0.05);
        const yScale = d3.scaleBand().domain(months).range([0, height]).padding(0.05);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
        // Define color scale
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.maxTemp)]);


        svg.append("text")
            .attr("x", width / 2) // Center horizontally
            .attr("y", -margin.top / 2) // Adjust vertical position above the matrix
            .attr("text-anchor", "middle") // Align text to the center
            .attr("font-size", "25px")
            .attr("font-weight", "bold")
            .text(` ${showMax ? "Max" : "Min"} Temperature`);
    
        // Draw heatmap cells
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
                    .html(`Date: ${d.year}-${monthNames[d.month - 1]}<br/>Max: ${d.maxTemp}°C, Min: ${d.minTemp}°C`);
            })
            .on("mousemove", (event) => {
                d3.select("#tooltip")
                    .style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseleave", () => {
                d3.select("#tooltip").style("visibility", "hidden");
            });
    
        // X Axis (Years)
        svg.append("g")
            .attr("transform", `translate(0, 0)`)
            .call(d3.axisTop(xScale));
    
        // Y Axis (Months)
        svg.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => monthNames[d - 1]));
    
        // Add Legend
        const legendWidth = 20, legendHeight = 400;
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 60}, 50)`);
    
        // Create linear gradient for legend
        const legendGradient = legend.append("defs").append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%").attr("y1", "100%") // Gradient starts from bottom
            .attr("x2", "0%").attr("y2", "0%");  // Ends at the top
    
        // Define color stops dynamically
        const colorStops = [
            { offset: "0%", color: d3.interpolateYlOrRd(0) },   // Yellow (cooler)
            { offset: "50%", color: d3.interpolateYlOrRd(0.5) }, // Orange (moderate)
            { offset: "100%", color: d3.interpolateYlOrRd(1) }   // Red (hotter)
        ];
    
        // Append color stops
        colorStops.forEach(stop => {
            legendGradient.append("stop")
                .attr("offset", stop.offset)
                .attr("stop-color", stop.color);
        });
    
        // Create the legend rectangle
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");
    
        // Legend scale & axis
        const legendScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.maxTemp)])
            .range([legendHeight, 0]);
    
        legend.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(d3.axisRight(legendScale).ticks(5))
            .selectAll("text")  
            .style("text-anchor", "middle");
    
    }, [data, showMax]); // Dependency array
     // Ensure vertical text is properly aligned


     const title = showMax ? "Max Temperature" : "Min Temperature";

     return React.createElement("div", null,
         // Display the title dynamically
         React.createElement("button", { onClick: () => setShowMax(!showMax) }, 
             ` Display ${showMax ? "Min" : "Max"} Temperature`
         ),
         React.createElement("div", { id: "matrix" }),
         React.createElement("div", { id: "tooltip", style: { position: "absolute", visibility: "hidden", background: "#fff", padding: "5px", border: "1px solid black", borderRadius: "5px" } })
     );
};

// Function to load and process the CSV file
const loadData = () => {
    d3.csv("temperature_daily.csv").then((data) => {
        data.forEach(d => {
            d.date = new Date(d.date);
            d.year = d.date.getFullYear();
            d.month = d.date.getMonth()+1 ;
            d.minTemp = +d.min_temperature;
            d.maxTemp = +d.max_temperature;
        });

        const processedData = [];
        const groupedData = d3.group(data, d => d.year, d => d.month);

        groupedData.forEach((yearGroup, year) => {
            if (year >= 1997){
            yearGroup.forEach((monthGroup, month) => {
                const minTemp = d3.min(monthGroup, d => d.minTemp);
                const maxTemp = d3.max(monthGroup, d => d.maxTemp);
                processedData.push({ year: +year, month: +month, minTemp, maxTemp });
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
