// URL to fetch the data from
const dataUrl = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

// Fetch the data
fetch(dataUrl)
	.then((response) => {
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return response.json(); // Parse the JSON response
	})
	.then((data) => {
		createChart(data.baseTemperature, data.monthlyVariance); // Pass base temp and dataset to createChart
	})
	.catch((error) => {
		console.error("Error fetching the data:", error);
	});

// Function to create the heat map
function createChart(baseTemperature, dataset) {
	const width = 1200; // Width of the SVG
	const height = 500; // Height of the SVG
	const padding = 100; // Padding around the chart

	// Create and append the tooltip dynamically
	const tooltip = d3.select("body").append("div").attr("id", "tooltip");

	// Add Title (#1)
	d3.select("body").append("h1").attr("id", "title").text("Monthly Global Land-Surface Temperature");

	// Add Description (#2)
	d3.select("body").append("p").attr("id", "description").text("1753 - 2015: Base temperature 8.66°C");

	// X and Y scales
	const years = [...new Set(dataset.map((d) => d.year))];
	const xScale = d3
		.scaleBand()
		.domain(years)
		.range([padding, width - padding]);

	const yScale = d3
		.scaleBand()
		.domain(d3.range(1, 13)) // Months from 1 to 12
		.range([padding, height - padding]);

	const colorScale = d3
		.scaleSequential(d3.interpolateRdBu)
		.domain([
			baseTemperature + d3.max(dataset, (d) => d.variance),
			baseTemperature + d3.min(dataset, (d) => d.variance),
		]);

	// SVG container
	const svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

	// X-axis (#3)
	svg.append("g")
		.attr("id", "x-axis")
		.attr("transform", `translate(0, ${height - padding})`)
		.call(d3.axisBottom(xScale).tickValues(years.filter((year, index) => index % 10 === 0)));

	// Y-axis (#4)
	svg.append("g")
		.attr("id", "y-axis")
		.attr("transform", `translate(${padding}, 0)`)
		.call(d3.axisLeft(yScale).tickFormat((month) => d3.timeFormat("%B")(new Date(0, month - 1))));

	// Heatmap Cells (#5, #6, #7, #8, #9, #10)
	svg.selectAll(".cell")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("class", "cell")
		.attr("x", (d) => xScale(d.year))
		.attr("y", (d) => yScale(d.month))
		.attr("width", xScale.bandwidth())
		.attr("height", yScale.bandwidth())
		.attr("fill", (d) => colorScale(baseTemperature + d.variance))
		.attr("data-month", (d) => d.month - 1)
		.attr("data-year", (d) => d.year)
		.attr("data-temp", (d) => baseTemperature + d.variance)
		.on("mouseover", function (event, d) {
			const tooltip = d3.select("#tooltip");
			tooltip
				.style("opacity", 1)
				.style("left", `${event.pageX + 10}px`)
				.style("top", `${event.pageY - 10}px`)
				.html(
					`Year: ${d.year}<br>Month: ${d3.timeFormat("%B")(new Date(0, d.month - 1))}<br>Temperature: ${(
						baseTemperature + d.variance
					).toFixed(2)}°C`
				)
				.attr("data-year", d.year);
		})
		.on("mouseout", function () {
			d3.select("#tooltip").style("opacity", 0);
		});

	// Legend (#13, #14, #15)
	const legendWidth = 300;
	const legendColors = 10;

	const legendScale = d3.scaleLinear().domain(colorScale.domain()).range([0, legendWidth]);

	const legendAxis = d3.axisBottom(legendScale).ticks(legendColors).tickFormat(d3.format(".1f"));

	const legend = svg
		.append("g")
		.attr("id", "legend")
		.attr("transform", `translate(${padding}, ${height - 40})`);

	legend
		.selectAll("rect")
		.data(d3.range(legendColors))
		.enter()
		.append("rect")
		.attr("x", (d) => (legendWidth / legendColors) * d)
		.attr("y", -10)
		.attr("width", legendWidth / legendColors)
		.attr("height", 10)
		.attr("fill", (d) =>
			colorScale(colorScale.domain()[0] + (d / legendColors) * (colorScale.domain()[1] - colorScale.domain()[0]))
		);

	legend.append("g").call(legendAxis);
}
