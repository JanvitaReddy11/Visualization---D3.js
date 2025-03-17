const { useEffect, useState } = React;

const TemperatureViz = ({ temperatureData }) => {

    const [displayMaxTemp, setDisplayMaxTemp] = useState(true); // Default state is set to display maximum temperature gradient
    
    // Chart dimensions and configuration
    const dimensions = {
        chartWidth: 900,
        chartHeight: 550,
        margin: { top: 60, right: 60, bottom: 60, left: 120 },
        legendWidth: 25,
        legendHeight: 550
    };

    // Prepare data 
    const uniqueYearsList = [...new Set(temperatureData.map(record => record.year))]; // Unique years for X-axis
    const monthIndices = Array.from({ length: 12 }, (_, idx) => idx + 1); // Month indices from 1 to 12
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    
    useEffect(() => {
        // Clear existing chart before rendering
        d3.select("#viz-container").selectAll("*").remove();
        
        // Create SVG element
        const vizCanvas = d3.select("#viz-container")
            .append("svg")
                .attr("width", dimensions.chartWidth + dimensions.margin.left + dimensions.margin.right + 150)
                .attr("height", dimensions.chartHeight + dimensions.margin.top + dimensions.margin.bottom)
            .append("g")
                .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`);
        
        // Create scales for X and Y axis
        const yearScale = d3.scaleBand()
            .domain(uniqueYearsList)
            .range([0, dimensions.chartWidth])
            .padding(0.12);
            
        const monthScale = d3.scaleBand()
            .domain(monthIndices)
            .range([0, dimensions.chartHeight])
            .padding(0.12);
            
        // Define the color scale for the temperature
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([
                d3.min(temperatureData, record => record.minTemp), 
                d3.max(temperatureData, record => record.maxTemp)
            ]);
        
        // Display the title of the chart
        vizCanvas.append("text")
            .attr("x", dimensions.chartWidth / 2)
            .attr("y", -dimensions.margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "22px")
            .attr("font-weight", "bold")
            .text(`${displayMaxTemp ? "Maximum" : "Minimum"} Temperature Visualization`);
        
        // Create heatmap cells based on the temperature data
        const heatmapCells = vizCanvas.selectAll(".temp-cell")
            .data(temperatureData)
            .enter()
            .append("rect")
                .attr("class", "temp-cell")
                .attr("x", record => yearScale(record.year))
                .attr("y", record => monthScale(record.month))
                .attr("width", yearScale.bandwidth())
                .attr("height", monthScale.bandwidth())
                .attr("fill", record => colorScale(displayMaxTemp ? record.maxTemp : record.minTemp))
                .attr("rx", 2)
                .attr("ry", 2);
                
        // Add interactivity to heatmap cells for tooltip display
        heatmapCells
            .on("mouseover", (event, record) => {
                d3.select("#tooltip-element")
                    .style("visibility", "visible")
                    .html(`
                        <strong>${monthNames[record.month - 1]} ${record.year}</strong><br/>
                        Maximum: ${record.maxTemp}°C<br/>
                        Minimum: ${record.minTemp}°C
                    `);
            })
            .on("mousemove", (event) => {
                d3.select("#tooltip-element")
                    .style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseleave", () => {
                d3.select("#tooltip-element").style("visibility", "hidden");
            });  // Tooltip shown on hover with month, year, and temperature data
        
        // Display X-axis (Years) at the top of the chart
        vizCanvas.append("g")
            .attr("transform", `translate(0, 0)`)
            .call(d3.axisTop(yearScale))
            .selectAll("text")
                .style("font-size", "11px");
                
        // Display Y-axis (Months) on the left of the chart with month names
        vizCanvas.append("g")
            .call(d3.axisLeft(monthScale).tickFormat(idx => monthNames[idx - 1]))
            .selectAll("text")
                .style("font-size", "11px");
                
        // Add label to X-axis (Years)
        vizCanvas.append("text")
            .attr("x", dimensions.chartWidth / 2)
            .attr("y", dimensions.chartHeight + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text("Years");
        
        // Add label to Y-axis (Months)
        vizCanvas.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -dimensions.chartHeight / 2)
            .attr("y", -dimensions.margin.left + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text("Months");
        
        // Create and display temperature legend
        const legendGroup = vizCanvas.append("g")
            .attr("transform", `translate(${dimensions.chartWidth + 60}, 0)`);
            
        // Define gradient for the legend
        const tempGradient = legendGroup.append("defs")
            .append("linearGradient")
                .attr("id", "temp-gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "0%")
                .attr("y2", "0%");
                
        // Gradient stops for color legend
        [
            { position: "0%", value: 0 },
            { position: "50%", value: 0.5 },
            { position: "100%", value: 1 }
        ].forEach(stop => {
            tempGradient.append("stop")
                .attr("offset", stop.position)
                .attr("stop-color", d3.interpolateYlOrRd(stop.value));
        });
        

        legendGroup.append("rect")
            .attr("width", dimensions.legendWidth)
            .attr("height", dimensions.legendHeight)
            .style("fill", "url(#temp-gradient)")
            .attr("rx", 3)
            .attr("ry", 3);
            
        // Create scale for the temperature values in the legend
        const legendTempScale = d3.scaleLinear()
            .domain([
                d3.min(temperatureData, record => record.minTemp),
                d3.max(temperatureData, record => record.maxTemp)
            ])
            .range([dimensions.legendHeight, 0]);
            
        // Display temperature values on the legend scale
        legendGroup.append("g")
            .attr("transform", `translate(${dimensions.legendWidth}, 0)`)
            .call(d3.axisRight(legendTempScale)
                .ticks(6)
                .tickFormat(d => `${d}°C`));
                
        // Add title to the temperature legend
        legendGroup.append("text")
            .attr("transform", "rotate(90)")
            .attr("x", dimensions.legendHeight / 2)
            .attr("y", -dimensions.legendWidth - 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text("Temperature (°C)");
            
    }, [temperatureData, displayMaxTemp]);
    
    return (
        React.createElement("div", { className: "temperature-visualization" },
            React.createElement("button", { 
                onClick: () => setDisplayMaxTemp(!displayMaxTemp),
                style: {
                    padding: "8px 15px",
                    margin: "10px 0",
                    backgroundColor: displayMaxTemp ? "#ff7043" : "#5c6bc0",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold"
                }
            }, `Show ${displayMaxTemp ? "Minimum" : "Maximum"} Temperature`),
            React.createElement("div", { id: "viz-container" }),
            React.createElement("div", { 
                id: "tooltip-element", 
                style: { 
                    position: "absolute", 
                    visibility: "hidden", 
                    background: "rgba(255, 255, 255, 0.9)",
                    padding: "10px", 
                    border: "1px solid #ddd", 
                    borderRadius: "5px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                    fontSize: "12px",
                    pointerEvents: "none"
                } 
            })
        )
    );
};

// Load temperature data from CSV and process it
const processTemperatureData = () => {
    d3.csv("temperature_daily.csv").then((rawRecords) => {
        // Creating date objects and extracting temperature values
        rawRecords.forEach(record => {
            record.dateObj = new Date(record.date);
            record.year = record.dateObj.getFullYear();
            record.month = record.dateObj.getMonth() + 1;
            record.minTemp = +record.min_temperature;
            record.maxTemp = +record.max_temperature;
        });
        
        // Group the data by year and month
        const monthlyTempData = [];
        const groupedByYearMonth = d3.group(rawRecords, 
            record => record.year, 
            record => record.month
        );
        
        // Process data from 1997 onwards only
        groupedByYearMonth.forEach((yearData, year) => {
            if (year >= 1997) {
                yearData.forEach((monthData, month) => {
                    monthlyTempData.push({
                        year: +year,
                        month: +month,
                        minTemp: d3.min(monthData, record => record.minTemp),
                        maxTemp: d3.max(monthData, record => record.maxTemp)
                    });
                });
            }
        });
        
        // Render the temperature visualization when data is loaded
        ReactDOM.render(
            React.createElement(TemperatureViz, { temperatureData: monthlyTempData }),
            document.getElementById("root")
        );
    }).catch(error => {
        console.error("Error loading or processing temperature data:", error);
        document.getElementById("root").innerHTML = `
            <div style="color: red; padding: 20px;">
                <h3>Data Loading Error</h3>
                <p>Failed to load temperature data.</p>
            </div>
        `;
    });
};

processTemperatureData();
