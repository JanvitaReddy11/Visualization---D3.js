const { useEffect, useState } = React;

const TemperatureViz = ({ temperatureData }) => {

    const [displayMaxTemp, setDisplayMaxTemp] = useState(true); //Deafult state is set to dsiplay maximum gradient
    
    // Chart dimensions and configuration
    const dimensions = {
        chartWidth: 900,
        chartHeight: 550,
        margin: { top: 60, right: 60, bottom: 60, left: 120 },
        legendWidth: 25,
        legendHeight: 550
    };
    
    // Prepare data arrays
    const uniqueYearsList = [...new Set(temperatureData.map(record => record.year))];
    const monthIndices = Array.from({ length: 12 }, (_, idx) => idx + 1);
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    
    useEffect(() => {
       
        d3.select("#viz-container").selectAll("*").remove();
        
        // Create SVG with proper dimensions
        const vizCanvas = d3.select("#viz-container")
            .append("svg")
                .attr("width", dimensions.chartWidth + dimensions.margin.left + dimensions.margin.right + 150)
                .attr("height", dimensions.chartHeight + dimensions.margin.top + dimensions.margin.bottom)
            .append("g")
                .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`);
        
        // Create scales
        const yearScale = d3.scaleBand()
            .domain(uniqueYearsList)
            .range([0, dimensions.chartWidth])
            .padding(0.12);
            
        const monthScale = d3.scaleBand()
            .domain(monthIndices)
            .range([0, dimensions.chartHeight])
            .padding(0.12);
            
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([
                d3.min(temperatureData, record => record.minTemp), 
                d3.max(temperatureData, record => record.maxTemp)
            ]);
        
        // Display visualization title
        vizCanvas.append("text")
            .attr("x", dimensions.chartWidth / 2)
            .attr("y", -dimensions.margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "22px")
            .attr("font-weight", "bold")
            .text(`${displayMaxTemp ? "Maximum" : "Minimum"} Temperature Visualization`);
        
        // CDisplay heatmap cells
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
                
        // Add interactivity to cells
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
            });  // Hover the mouse pointer to display (Date, Min Temp and Max Temp)
        
        // Display X-axis (Years)
        vizCanvas.append("g")
            .attr("transform", `translate(0, 0)`)
            .call(d3.axisTop(yearScale))
            .selectAll("text")
                .style("font-size", "11px");
                
        // Display Y-axis (Months)
        vizCanvas.append("g")
            .call(d3.axisLeft(monthScale).tickFormat(idx => monthNames[idx - 1]))
            .selectAll("text")
                .style("font-size", "11px");
                
        // Display X axis labels
        vizCanvas.append("text")
            .attr("x", dimensions.chartWidth / 2)
            .attr("y", dimensions.chartHeight + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text("Years");
        // Display Y axis labels
        vizCanvas.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -dimensions.chartHeight / 2)
            .attr("y", -dimensions.margin.left + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text("Months");
        
        // Display temperature legend
        const legendGroup = vizCanvas.append("g")
            .attr("transform", `translate(${dimensions.chartWidth + 60}, 0)`);
            
        // Display gradient for legend
        const tempGradient = legendGroup.append("defs")
            .append("linearGradient")
                .attr("id", "temp-gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "0%")
                .attr("y2", "0%");
                
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
            
        const legendTempScale = d3.scaleLinear()
            .domain([
                d3.min(temperatureData, record => record.minTemp),
                d3.max(temperatureData, record => record.maxTemp)
            ])
            .range([dimensions.legendHeight, 0]);
            
        legendGroup.append("g")
            .attr("transform", `translate(${dimensions.legendWidth}, 0)`)
            .call(d3.axisRight(legendTempScale)
                .ticks(6)
                .tickFormat(d => `${d}°C`));
                
        // Display legend title
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

// Load temperature CSV file
const processTemperatureData = () => {
    d3.csv("temperature_daily.csv").then((rawRecords) => {
        // Parse and transform raw data
        rawRecords.forEach(record => {
            record.dateObj = new Date(record.date);
            record.year = record.dateObj.getFullYear();
            record.month = record.dateObj.getMonth() + 1;
            record.minTemp = +record.min_temperature;
            record.maxTemp = +record.max_temperature;
        });
        
        // Group by month and year
        const monthlyTempData = [];
        const groupedByYearMonth = d3.group(rawRecords, 
            record => record.year, 
            record => record.month
        );
        
        // Process only data from 1997 onwards
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
        
        // Render the visualization component when click on button to change from maximum to minimum heatmap
        ReactDOM.render(
            React.createElement(TemperatureViz, { temperatureData: monthlyTempData }),
            document.getElementById("root")
        );
    }).catch(error => {
        console.error("Error loading or processing temperature data:", error);
        document.getElementById("root").innerHTML = `
            <div style="color: red; padding: 20px;">
                <h3>Data Loading Error</h3>
                <p>Failed to load temperature data. .</p>
            </div>
        `;
    });
};

processTemperatureData();