//load dataset in 
const parseDate = d3.timeParse("%Y-%m-%d");

d3.csv("covid.csv",  function(d) {
    return {
        data_as_of: parseDate(d.data_as_of), 
        start_date: parseDate(d.start_date),
        end_date: parseDate(d.end_date),
        group: d.group, 
        year: +d.year, 
        month: +d.month, 
        date: new Date(+d.year, d.month - 1, 1), 
        state: d.state, 
        sex: d.sex, 
        age_group: d.age_group, 
        covid_19_deaths: +d.covid_19_deaths, 
        total_deaths: +d.total_deaths, 
        pneumonia_deaths: +d.pneumonia_deaths, 
        pneumonia_and_covid_19_deaths: +d.pneumonia_and_covid_19_deaths, 
        influenza_deaths: +d.influenza_deaths, 
        pneumonia_influenza_or_covid_19_deaths: +d.pneumonia_influenza_or_covid_19_deaths
    }
}).then(data => {
    
    console.log(data);
    console.log(data[0]);

    console.log(
        data.filter(d => isNaN(d.covid_19_deaths)).length
    );

    //LINE CHART 
    //set dimensions and margins 
    const lmargin = {top: 100, right: 70, bottom: 60, left: 70 }; 
    const lwidth = 900 - lmargin.left - lmargin.right; 
    const lheight = 600 - lmargin.top - lmargin.bottom; 

    //x and y scales 
    const x = d3.scaleTime() 
        .range([0, lwidth]); 
    
    const y = d3.scaleLinear()
        .range([lheight, 0]); 

    const lsvg = d3.select("#line-chart")
        .append("svg")
            .attr("width", lwidth + lmargin.left + lmargin.right)
            .attr("height", lheight + lmargin.top + lmargin.bottom)
        .append("g")
            .attr("transform", `translate(${lmargin.left},${lmargin.top})`);

   
    //axis
    const xAxis = lsvg.append("g") 
        .attr("transform", `translate(0, ${lheight})`);
    
    const yAxis = lsvg.append("g");

    
    //line
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.mean))

    //uncertainty area 
    const area = d3.area()
        .x(d => x(d.date)) 
        .y0(d => y(d.lower)) 
        .y1(d => y(d.upper)) 

    //draw area 
    lsvg.append("path")
        .attr("class", "area")
        .attr("fill", "#e4cefc")
        .attr("opacity", 0.5); 

    //draw line 
    lsvg.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5); 

    function update(filter) {
        //fitler 
        const filtered = data.filter(d =>
            d.sex === filter && d.age_group !== "All Ages" && +d.month && +d.year 
        ); 

        //aggregate
        const grouped = d3.rollups(
            filtered, 
            v => {
                const values = v.map(d => d.covid_19_deaths)

                const mean = d3.mean(values)
                const sd = d3.deviation(values)
                const n = values.length; 

                const se = sd / Math.sqrt(n); 

                return {
                    mean, 
                    se, 
                    lower: mean - 1.96 * se,
                    upper: mean + 1.96 * se 
                }; 
            }, 
            d => d.date
            ).map(([date, stats]) => ({
                date: date,
                mean: stats.mean,
                se: stats.se,
                lower: stats.lower,
                upper: stats.upper
            })) 

            //sort data 
            grouped.sort((a, b) => a.date - b.date); 

            //define the x and y domains 
            x.domain(d3.extent(grouped, d=> d.date)); 
            y.domain([0, d3.max(grouped, d => d.upper)]) 

            //update axis
            xAxis.call(
                d3.axisBottom(x)
                    .ticks(d3.timeMonth.every(4))
                    .tickFormat(d3.timeFormat("%b %Y"))
            ).selectAll("text")
                    .style("font-size", "12px");

            yAxis.call(d3.axisLeft(y)).selectAll("text")
                    .style("font-size", "12px");

            //update area and line 
            lsvg.select(".area")
                .datum(grouped)
                .transition()
                .duration(500)
                .attr("d", area);
            
            // 6. UPDATE LINE
            lsvg.select(".line")
                .datum(grouped)
                .transition()
                .duration(500)
                .attr("d", line);
    }

    //default 
    update("All Sexes"); 

    //button 
    d3.selectAll("input").on("change", function() {
        update(this.value);
    }); 

    //add labels 
    //title
    lsvg.append("text")
        .attr("x", lwidth / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Average Covid-19 Deaths over Time with Uncertainty Across Age Groups")
        .attr("font-size", "22px");
    
    //x axis 
    lsvg.append("text")
        .attr("x", lwidth/2)
        .attr("y", lheight + 44)
        .text("Month and Year")
        .attr("font-size", "20px");
    
    //y axis 
    lsvg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -lmargin.left + 18)
        .attr("x", -lheight/2)
        .text("Average Deaths")
        .attr("font-size", "21px");  


    //BAR CHART 
    //filter data 
    const bfiltered = data.filter(d => 
        d.sex === "All Sexes" && d.age_group === "All Ages" && +d.month && +d.year
    );  

    //group by disease
    const barData = [
        {
            disease: "COVID-19", 
            values: bfiltered.map(d => d.covid_19_deaths)
        }, 
        {
            disease: "Influenza", 
            values: bfiltered.map(d => d.influenza_deaths)
        }, 
        {
            disease: "Pnuemonia", 
            values: bfiltered.map(d => d.pneumonia_deaths)
        }
    ];

    //summary stats
    const summary = barData.map(d => {
        const bmean = Math.round(d3.mean(d.values));
        const bsd = Math.round(d3.deviation(d.values)); 
        const bn = d.values.length; 
        const bse = Math.round(bsd/Math.sqrt(bn)); 

        return {
            disease: d.disease, 
            bmean, 
            bsd, 
            bse,
            blower: bmean - 1.96 * bse, 
            bupper: bmean + 1.96 * bse
        }
    })

    const bmargin = {top: 100, right: 90, bottom: 60, left: 90 }; 
    const bwidth = 900 - bmargin.left - bmargin.right; 
    const bheight = 600 - bmargin.top - bmargin.bottom; 

    const bsvg = d3.select("#bar-chart")
        .append("svg")
            .attr("width", bwidth + bmargin.left + bmargin.right)
            .attr("height", bheight + bmargin.top + bmargin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + bmargin.left + "," + bmargin.top + ")");

    //x axis scale
    const bx = d3.scaleBand() 
        .range([0, bwidth])
        .domain(summary.map(d => d.disease))
        .padding(0.5); 
    

    //y axis scale + draw
    const by = d3.scaleLinear()
        .domain([0, d3.max(summary, d=> d.bupper)]) 
        .range([bheight, 0])
    bsvg.append("g")
        .call(d3.axisLeft(by))
        .selectAll("text")
            .style("font-size", "15px"); 

    //bars 
    const by0 = by(0); 
    bsvg.selectAll("rect") 
        .data(summary)
        .enter()
        .append("rect")
            .attr("x", d => bx(d.disease))
            .attr("y", d => by(d.bmean))
            .attr("width", bx.bandwidth()) 
            .attr("height", d => by0 - by(d.bmean))
            .attr("fill", "#d2afe9")
        //click 
        .on("click", function(event, d) {
            d3.select("#disease").text("Disease: " + d.disease);
            d3.select("#mean").text("Average Deaths: " + d.bmean);
            d3.select("#sd").text("Standard Deviation: " + d.bsd);
            d3.select("#se").text("Standard Error: " + d.bse);
            d3.select("#upper").text("Upper Confidence Interval: " + d.bupper);
            d3.select("#lower").text("Lower Confidence Interval: " + d.blower);
        })

    //x axis drawn
    bsvg.append("g")
        .attr("transform", "translate(0," + bheight + ")")
        .call(d3.axisBottom(bx))
        .selectAll("text")
            .style("text-anchor", "center")
            .style("font-size", "15px");

    console.log(summary); 

    //error bars 
    bsvg.selectAll(".error-line")
        .data(summary)
        .enter()
        .append("line")
        .attr("class", "error-line")
        .attr("x1", d => bx(d.disease) + bx.bandwidth() / 2)
        .attr("x2", d => bx(d.disease) + bx.bandwidth() / 2)
        .attr("y1", d => by(d.blower))
        .attr("y2", d => by(d.bupper))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    //top cap
    bsvg.selectAll(".error-top")
        .data(summary)
        .enter()
        .append("line")
        .attr("class", "error-top")
        .attr("x1", d => bx(d.disease) + bx.bandwidth() / 4)
        .attr("x2", d => bx(d.disease) + (3 * bx.bandwidth()) / 4)
        .attr("y1", d => by(d.bupper))
        .attr("y2", d => by(d.bupper))
        .attr("stroke", "black");

    //bottom cap
    bsvg.selectAll(".error-bottom")
        .data(summary)
        .enter()
        .append("line")
        .attr("class", "error-bottom")
        .attr("x1", d => bx(d.disease) + bx.bandwidth() / 4)
        .attr("x2", d => bx(d.disease) + (3 * bx.bandwidth()) / 4)
        .attr("y1", d => by(d.blower))
        .attr("y2", d => by(d.blower))
        .attr("stroke", "black");

    //add labels 
    //title
    bsvg.append("text")
        .attr("x", bwidth / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Covid-19 vs Flu vs Pneumonia Deaths with Uncertainty")
        .attr("font-size", "22px");
    
    //x axis 
    bsvg.append("text")
        .attr("x", bwidth/2)
        .attr("y", bheight + 44)
        .text("Disease")
        .attr("font-size", "20px");
    
    //y axis 
    bsvg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -bmargin.left + 18)
        .attr("x", -bheight/2)
        .text("Average Deaths")
        .attr("font-size", "21px");  


});  