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
    const lmargin = {top: 70, right: 30, bottom: 40, left: 80 }; 
    const lwidth = 1200 - margin.left - margin.right; 
    const lheight = 500 - margin.top - margin.bottom; 

    //x and y scales 
    const x = d3.scaleTime() 
        .range([0, width]); 
    
    const y = d3.scaleLinear()
        .range([height, 0]); 

    const lsvg = d3.select("#line-chart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

    //define the x and y domains 

    x.domain(d3.extent())


});  