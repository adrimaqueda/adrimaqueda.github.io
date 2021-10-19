      // using d3 for convenience
      var main = d3.select("main");
      var scrolly = main.select("#scrolly");
      var figure = scrolly.select("figure");
      var article = scrolly.select("article");
      var step = article.selectAll(".step");

      // initialize the scrollama
      var scroller = scrollama();

      // generic window resize listener event
      function handleResize() {
        // 1. update height of step elements
        var stepH = Math.floor(window.innerHeight * .9);
        step.style("height", stepH + "px");

        var figureHeight = window.innerHeight * .85
        var figureMarginTop = (window.innerHeight - figureHeight) / 2;

        figure
          .style("height", figureHeight + "px")
          .style("top", figureMarginTop + "px");

              // ************************** AJUSTES **************************//

        margin = {left: window.innerWidth * .1, top: 25, bottom: 30, right: window.innerWidth * .1}
        width = vis.clientWidth
        height = figureHeight

        // 3. tell scrollama to update new element dimensions
        scroller.resize();
      }


// ************************** DATA **************************//

d3.csv('data/nobel.csv', function(d){
  return {
  id: d.id,
  nombre: d.firstname,
  apellido: d.surname,
  gender: d.gender,
  category: d.category,
  year: d.year,
  share: d.share,
  cluster: d.category,
  };
}).then(data => {
  rawData = data
   //console.log(rawData)
  createScales()
  // setupGrid()
  setTimeout(drawInitial(), 100)
});

// ************************** DECLARATION VARS LEGENDS AND SCALES **************************//

function createScales(){

  //organize data

mujeresXcat = d3.rollups(rawData.filter(d=> d.gender === "female"), v=> v.length, d=> d.category).sort(([, a], [, b]) => d3.descending(a, b))

hombXcat = d3.rollups(rawData.filter(d=> d.gender === "male"), v=> v.length, d=> d.category).sort(([, a], [, b]) => d3.descending(a, b))

orgXcat = d3.rollups(rawData.filter(d=> d.gender === "org"), v=> v.length, d=> d.category).sort(([, a], [, b]) => d3.descending(a, b))

cats = d3.map(mujeresXcat, d=> ({
  cat: d[0],
  f: d[1],
  m: hombXcat.find(dd=> dd[0] === d[0])[1],
  o: d[0] === "peace" ? orgXcat.find(dd=> dd[0] === d[0])[1] : 0
}))

  //axis

  x = d3
  .scalePoint()
  .domain(new Set(rawData.map((d) => d.category)))
  .padding(0.3)
  .range([margin.left / 2, width - margin.left / 2]);

  y = d3
  .scalePoint()
  .domain(["female","male","org"])
  .padding(0.3)
  .range([100, height - 100])

  yM = d3
  .scalePoint()
  .domain(new Set(rawData.map(d => d.category)))
  .padding(0.3)
  .range([40, height])

  xM = d3
  .scalePoint()
  .domain(["female","male","org"])
  .padding(0.3)
  .range([margin.left, width - margin.right])

  //colors
  color = d3.scaleOrdinal().domain(["female","male","org"]).range(["orange", "grey", "black"])

  //mobile
  is_mobile = window.innerWidth < 500 

  r = is_mobile ? 2 : 3.5
}

function traducir(selection) {
  if (selection === "physics") {
    return "Física";
  }
  if (selection === "chemistry") {
    return "Química";
  }
  if (selection === "peace") {
    return "Paz";
  }
  if (selection === "medicine") {
    return "Medicina";
  }
  if (selection === "literature") {
    return "Literatura";
  }
  if (selection === "economics") {
    return "Economía";
  }
  if (selection === "female") {
    return "mujer";
  }
  if (selection === "male") {
    return "hombre";
  }
  if (selection === "org") {
    return "organismo";
  }
}

function drawInitial(){

  let svg = d3.select("#vis")
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .attr('opacity', 1)
  .attr("overflow", "visible")

    // Instantiates the force simulation
    // Has no forces. Actual forces are added and removed as required

  simulation = d3
    .forceSimulation(rawData)
    .on("tick", onTick);


  categories = svg.append("g").attr("z-index", 900).attr("opacity", 0)
    .call(d3.axisBottom(x))
    .call((g) => g.selectAll(".domain").remove())
    .call((g) => g.selectAll(".tick line").remove())
    .call((g) =>
      g
        .selectAll(".tick text")
        .attr("font-size", "1.5rem")
        .attr("font-weight", "bold")
        .html(d=> traducir(d)));


    prizes = svg.append("g").attr("opacity", 0)
    .attr("transform", `translate(0,35)`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").remove())
    .call((g) => g.selectAll(".tick text").style("font-weight", "bold").style("font-size","1.5rem")
                  .html(d=> `<tspan style="fill:orange">${cats.find(dd=> d === dd.cat).f}</tspan> / <tspan style="fill:grey">${cats.find(dd=> d === dd.cat).m}</tspan> ${cats.find(dd=> d === dd.cat).o > 0 ? `/ ${cats.find(dd=> d === dd.cat).o}` : ""}`))

    vertical_axis = svg.append("g").attr("opacity", 0).attr("transform", `translate(0,-60)`)
    .call(d3.axisRight(yM))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").remove())
    .call((g) => g.selectAll(".tick text").style("font-weight", "bold").style("font-size","1rem").html(d=> `${traducir(d)}: <tspan style="fill:orange">${cats.find(dd=> d === dd.cat).f}</tspan> / <tspan style="fill:grey">${cats.find(dd=> d === dd.cat).m}</tspan> ${cats.find(dd=> d === dd.cat).o > 0 ? `/ ${cats.find(dd=> d === dd.cat).o}` : ""}`))



    nodes = svg
    .selectAll("circle")
    .data(rawData)
    .join("circle")
    .attr("fill", (d) => color(d.gender))
    .attr("stroke", "red")
    .attr("stroke-width", 0)
    .attr("opacity", 0)
    .attr("cursor", "default");


  
function onTick() {
  nodes
    .attr("r", (d) => r)
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y);
}


onTick();  }

      // scrollama event handlers
      function handleStepEnter(response) {
        console.log(response);
        // response = { element, direction, index }

        // add color to current step only
        step.classed("is-active", function(d, i) {
          return i === response.index;
        });

        // update graphic based on step
        //init
        if (response.index === 0) {
            simulation
            .force("x", d3.forceX((d) => width/2))
            .force("y", d3.forceY((d) => height/2))
            .force("collide", d3.forceCollide((d) => r + r/2))
            .force('charge', d3.forceManyBody().strength(-2))
            .alpha(.7)
            .restart()

          nodes.attr("opacity", 1)

            }

        //first
        if (response.index === 1) {
          simulation
            .force("x", d3.forceX((d) => is_mobile ? xM(d.gender) : x(d.category)))
            .force("y", d3.forceY((d) => is_mobile ? yM(d.category) : y(d.gender)))
            .force("collide", d3.forceCollide((d) => r + r/2).iterations(2))
            .force('charge', d3.forceManyBody().strength(-1))
            .alpha(.9)
            .restart()

          nodes.attr("opacity", 1)
        }

        if (response.index === 1 && response.direction === "up") {
          categories.transition().duration(500).attr("opacity", 0)
        }

        //second
        if (response.index === 2) {
          categories.transition().duration(500).attr("opacity", 1)
        }

        if (response.index === 2 && response.direction === "up") {
          prizes.transition().duration(500).attr("opacity", 0)
        }

        //third
        if (response.index === 3) {
          if (!is_mobile) {
            prizes.transition().duration(500).attr("opacity", 1)
          }
        }

      }

      function setupStickyfill() {
        d3.selectAll(".sticky").each(function() {
          Stickyfill.add(this);
        });
      }

      function init() {
        setupStickyfill();

        // 1. force a resize on load to ensure proper dimensions are sent to scrollama
        handleResize();

        // 2. setup the scroller passing options
        // 		this will also initialize trigger observations
        // 3. bind scrollama event handlers (this can be chained like below)
        scroller
          .setup({
            step: "#scrolly article .step",
            offset: 0.75,
            debug: true
          })
          .onStepEnter(handleStepEnter)

        // setup resize event
        window.addEventListener("resize", handleResize);
      }

      // kick things off
      init();