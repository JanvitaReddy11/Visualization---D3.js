const { useEffect, useState } = React;

const TemperatureViz = ({ temperatureData }) => {
   //Default state  is setting the display to Maximum heatmap
    const [displayMaxTemp, setDisplayMaxTemp] = useState(true);
    const dimensions = {
        chartWidth: 1000,
        chartHeight: 600,
        margin: { top: 50, right: 250, bottom: 50, left: 100 },
        legendWidth: 20,
        legendHeight: 400
    };
    
    // Prepare data arrays
    const uniqueYearsList = [...new Set(temperatureData.map(record => record.year))];
    const monthIndices = d3.range(1, 13);
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
       
        d3.select("#matrix").selectAll("*").remove();

        // Create SVG with proper dimensions
        const vizCanvas = d3.select("#matrix")
            .append("svg")
            .attr("width", dimensions.chartWidth + dimensions.margin.left + dimensions.margin.right)
            .attr("height", dimensions.chartHeight + dimensions.margin.top + dimensions.margin.bottom)
            .append("g")
            .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`);

        // Display X axis
        const yearScale = d3.scaleBand()
            .domain(uniqueYearsList)
            .range([0, dimensions.chartWidth])
            .padding(0.05);
        //Display Y axis
            
        const monthScale = d3.scaleBand()
            .domain(monthIndices)
            .range([0, dimensions.chartHeight])
            .padding(0.05);
            
        // Dfining gradient scale
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([
                d3.min(temperatureData, record => record.minTemp), 
                d3.max(temperatureData, record => record.maxTemp)
            ]);

        // Display visualization title
        vizCanvas.append("text")
            .attr("x", dimensions.chartWidth / 2) 
            .attr("y", -dimensions.margin.top / 1.5) 
            .attr("text-anchor", "middle")
            .attr("font-size", "25px")
            .attr("font-weight", "bold")
            .text(`${displayMaxTemp ? "Max" : "Min"} Temperature`);

        // Create heatmap cells 
        const heatmapCells = vizCanvas.selectAll(".temp-cell")
            .data(temperatureData)
            .enter()
            .append("rect")
            .attr("class", "temp-cell")
            .attr("x", record => yearScale(record.year))
            .attr("y", record => monthScale(record.month))
            .attr("width", yearScale.bandwidth())
            .attr("height", monthScale.bandwidth())
            .attr("fill", record => colorScale(displayMaxTemp ? record.maxTemp : record.minTemp));

        // Add hover display (Date,min temp,max temp)
        heatmapCells
            .on("mouseover", (event, record) => {
                d3.select("#tooltip")
                    .style("visibility", "visible")
                    .html(`Date: ${monthNames[record.month - 1]} ${record.year}<br/>Max: ${record.maxTemp}°C, Min: ${record.minTemp}°C`);
            })
            .on("mousemove", (event) => {
                d3.select("#tooltip")
                    .style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => {
                d3.select("#tooltip").style("visibility", "hidden");
            });

        // Add mini-line charts inside each cell 
        temperatureData.forEach(record => {
            if (record.dailyTemps && record.dailyTemps.length > 0) {
                // Create scales for the mini-charts
                const miniX = d3.scaleLinear()
                    .domain([1, record.dailyTemps.length])
                    .range([0, yearScale.bandwidth()]);
                
                const miniY = d3.scaleLinear()
                    .domain([
                        d3.min(record.dailyTemps, t => t.min), 
                        d3.max(record.dailyTemps, t => t.max)
                    ])
                    .range([monthScale.bandwidth(), 0]);

                // Create line for max and min temperatures
                const lineMax = d3.line()
                    .x((t, i) => miniX(i + 1))
                    .y(t => miniY(t.max));

                const lineMin = d3.line()
                    .x((t, i) => miniX(i + 1))
                    .y(t => miniY(t.min));

                const cellGroup = vizCanvas.append("g")
                    .attr("transform", `translate(${yearScale(record.year)}, ${monthScale(record.month)})`);

                cellGroup.append("path")
                    .datum(record.dailyTemps)
                    .attr("d", lineMax)
                    .attr("stroke", "green")
                    .attr("stroke-width", 1)
                    .attr("fill", "none");

                cellGroup.append("path")
                    .datum(record.dailyTemps)
                    .attr("d", lineMin)
                    .attr("stroke", "blue")
                    .attr("stroke-width", 1)
                    .attr("fill", "none");
            }
        });

        // Display  years on Y axis
        vizCanvas.append("g")
            .attr("transform", `translate(0,0)`)
            .call(d3.axisTop(yearScale));
        //Display  years on X axis
            
        vizCanvas.append("g")
            .call(d3.axisLeft(monthScale)
                .tickFormat(m => monthNames[m - 1]));

        // Add axis labels
        vizCanvas.append("text")
            .attr("x", dimensions.chartWidth / 2)
            .attr("y", dimensions.chartHeight + dimensions.margin.bottom - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Years");

        vizCanvas.append("text")
            .attr("x", -dimensions.chartHeight / 2)
            .attr("y", -dimensions.margin.left + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("transform", "rotate(-90)")
            .text("Months");

        const legendGroup = vizCanvas.append("g")
            .attr("transform", `translate(${dimensions.chartWidth + 100}, 50)`);

        // Max temperature legend item
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
            .attr("alignment-baseline", "middle");

      
        const legend = vizCanvas.append("g")
            .attr("transform", `translate(${dimensions.chartWidth + 20}, 50)`);

        const legendGradient = legend.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%").attr("y1", "100%")
            .attr("x2", "0%").attr("y2", "0%");
                
        // Define color in gradient legend
        const colorStops = [
            { offset: "0%", color: d3.interpolateYlOrRd(0) },
            { offset: "50%", color: d3.interpolateYlOrRd(0.5) },
            { offset: "100%", color: d3.interpolateYlOrRd(1) }
        ];
                
        colorStops.forEach(stop => {
            legendGradient.append("stop")
                .attr("offset", stop.offset)
                .attr("stop-color", stop.color);
        });

        legend.append("rect")
            .attr("width", dimensions.legendWidth)
            .attr("height", dimensions.legendHeight)
            .style("fill", "url(#legend-gradient)");

        const legendScale = d3.scaleLinear()
            .domain([
                d3.min(temperatureData, record => record.minTemp), 
                d3.max(temperatureData, record => record.maxTemp)
            ])
            .range([dimensions.legendHeight, 0]);


        legend.append("g")
            .attr("transform", `translate(${dimensions.legendWidth}, 0)`)
            .call(d3.axisRight(legendScale).ticks(5));

    }, [temperatureData, displayMaxTemp]);

    // Render the viualization
    return React.createElement("div", null,
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
        }, 
            `Display ${displayMaxTemp ? "Min" : "Max"} Temperature`
        ),
        React.createElement("div", { id: "matrix" }),
        React.createElement("div", { 
            id: "tooltip", 
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
    );
};

// Function to load and process the CSV file
const processTemperatureData = () => {
    d3.csv("temperature_daily.csv").then((rawRecords) => {
        rawRecords.forEach(record => {
            record.dateObj = new Date(record.date);
            record.year = record.dateObj.getFullYear();
            record.month = record.dateObj.getMonth() + 1;
            record.minTemp = +record.min_temperature;
            record.maxTemp = +record.max_temperature;
        });
        
        const monthlyTempData = [];
        const groupedByYearMonth = d3.group(rawRecords, 
            record => record.year, 
            record => record.month
        );
        
        // Process last 10 years data
        groupedByYearMonth.forEach((yearData, year) => {
            if (year >= 2007) {
                yearData.forEach((monthData, month) => {
                    const dailyTemps = monthData.map(record => ({
                        day: record.dateObj.getDate(),
                        min: record.minTemp,
                        max: record.maxTemp
                    }));
                    
                    dailyTemps.sort((a, b) => a.day - b.day);
                    
                    monthlyTempData.push({
                        year: +year,
                        month: +month,
                        minTemp: d3.min(monthData, record => record.minTemp),
                        maxTemp: d3.max(monthData, record => record.maxTemp),
                        dailyTemps: dailyTemps
                    });
                });
            }
        });
        
        // Render the visualization upon clicking on button
        ReactDOM.render(
            React.createElement(TemperatureViz, { temperatureData: monthlyTempData }),
            document.getElementById("root")
        );
    }).catch(error => {
        console.error("Error loading or processing temperature data:", error);
        document.getElementById("root").innerHTML = `
            <div style="color: red; padding: 20px;">
                <h3>Data Loading Error</h3>
                <p>Failed to load temperature data: ${error.message}</p>
            </div>
        `;
    });
};


processTemperatureData();