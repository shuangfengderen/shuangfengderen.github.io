
// ---- Determine containers for dataset selection, slides, sankey and projecton.

// ---- Dataset selection and update
// 'food' and 'parkinsons' have only one cluster, not added.
var options = ["wine",'images','caltech-s6o4','caltech','simplex3','simplex5','twonorm20','wdbc','wiki']

// my select is the selection of dataset.
d3.select('#mySelect')
  .on('change', function(){update(this.value);})
  .selectAll('option')
  .data(options, function(d){return d;})
  .enter()
  .append('option')
  .attr('value', function(d){return d;})
  .text(function(d){return d;});

// Initialize the sankey with "wine" dataset
update(options[0]);

// Update the sankey and projection when choose a different dataset
function update(source){
  var data = './Sankey/norm/' + source + '.csv'; // normalizted HD data: n*m matrix
  var path='./Sankey/data/'+source+'.txt'; // cluster information based on Correlation of HD data.
  
  d3.json(path,function(root){
    view(root, data);
  });
}

// --- Slides
// Slides to choose how many clusters to show
var inputg=d3.select("#input").append('tr');  // change cluster number

// Add nodes priority
var svg_priority = d3.select('#priority').append("svg");

// --- Sankey and projection containers. 
// Sankey diagram margin, width, height and margin;
var margin = {top: 5, right: 2, bottom: 5, left: 2},
    width = window.innerWidth*2/3 - 2*margin.left - 2*margin.right,
    height = 450 - margin.top - margin.bottom;

// Width of the projection: it equals window width - sankey width. 
var width_proj = window.innerWidth - width - 2*margin.left - 2*margin.right-50;
// Height of the projection equals to its width.

var color = d3.scale.category20();

// SVG to draw sankey
var chart = d3.select("#chart");
var svg_sankey = chart.append("svg");

var svg = svg_sankey.append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var linkg=svg.append('g'), // <g> used to draw links
    groupg=svg.append('g');  // <g> used to draw groups (nodes)

// SVG to draw the projection (PCA) data
var svg_proj=d3.select('#chart').append('svg')
              .attr("width", width_proj+margin.left+margin.right)
              .attr('height',width_proj+margin.left+margin.right);
              
var projectiong=svg_proj.append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.left + ")")
              .append('g')
              .attr("transform", "translate(" + width_proj/2+ "," + width_proj/2 + ")");

// ----- End of declaration of containers

// ----- Add filters to the sankey svg container
// Add filter to svg_sankey: to get the yellow glow
var filter = svg_sankey.append('defs').append("filter")
        .attr('id','glow')
        .attr("x",'-1')
        .attr("y",'-1')
        .attr("height",'3.0')
        .attr("width","3.0");

filter.append("feGaussianBlur")
      //.attr("in", "SourceAlpha")
      .attr("stdDeviation",2)
      .attr("result","blur");

filter.append("feFlood")
      .attr("flood-color","yellow")
      .attr("flood-opacity",1)
      .attr("result", "color");

filter.append("feComposite")
      .attr("in", "color")
      .attr("in2","blur")
      .attr("operator","in")
      .attr("result", "glow");

var feMerge=filter.append("feMerge").selectAll("feMergeNode")
      .data(["glow",'glow',"glow","glow",'glow',"glow","SourceGraphic"])
      .enter()
      .append("feMergeNode")
      .attr("in", function(d){return d;});

// ----- End of define filter.

// -----  Define sankey model.
var sankey = sankey()
    .nodeWidth(4)
    .nodePadding(10)
    .size([width, height]);

// -----  Define projection model.
var projection = projection()
    .size([width_proj, width_proj]);

// Function to draw link path
var path = sankey.link(); // .curvature(0.5);

function view(root, source){

  if (arguments.length) sankey.size([width, height]).root(root).layout();
  var size=sankey.size();

  svg_sankey.attr('width',size[0]+margin.right+margin.left)
      .attr('height',size[1]+margin.top+margin.bottom);
  // d3.select('#comment').

  var levels = sankey.levels(),
      n_features = sankey.n_features();

  var prev = null;
  //console.log(levels,n_features);
  projection.parse(source).layout();

  drawInputs();
  var actions = drawSankey();
  var updateProjection=drawProjection();
  drawPriority();
  addComment();
  console.log(size[0]);

  function drawInputs(){
    inputg.selectAll('td').remove();

    var input=inputg.selectAll('td')
      .data(sankey.inputs(), function (d){ return d;})
      .enter().append('td');
      //.attr("transform", function(d) { return "translate(" + d.x + "," +0 + ")"; });

    input.append('input')
      .attr('type','range')
      .attr('min',1)
      .attr('max',n_features)
      .attr('step',1)
      .attr('value',function(_,i){return n_features-levels[i];})
      .on("input",function(_,i){d3.select(this.parentNode).select('text').text(+this.value);change(i, +this.value);});
      
    input.append('text')
      .attr("transform", function(d) { return "translate(" + 0 + "," +(-10) + ")"; })
      .style("margin-right", '20px')
      .text(function(d,i){return n_features-levels[i];});
  }

  function drawPriority(){

    svg_priority.selectAll("g").remove();
    var priority = projection.priority(),
        nodes=sankey.nodes()[0];

    var dim=actions[0],
        highlightNode = actions[1],
        removehighlight = actions[2];

    nodes.forEach(function(node,i){node.priority= priority[i];});
    nodes.sort(function(a,b){return a.priority-b.priority;});

    var diameter=(nodes[0].r+nodes[0].e)*2,
        n = nodes.length;
    var priorityg=svg_priority.attr("height", diameter+margin.top+margin.bottom)
                .attr("width", diameter*n + 5*n +margin.left+margin.right)
                .append("g")
                .attr("transform", "translate(" + margin.left+ "," + margin.top + ")");

    var node= priorityg.selectAll("circle")
      .data(nodes)
      .enter()
      .append('circle')
      .attr('cx',function(d,i){return (d.r+d.e+diameter*i+5*i);})
      .attr('cy',function(d){return (d.r+d.e);})
      .attr('r',function(d){return d.r;})
      .attr('stroke-width', function(d){ return d.e;})
      .attr('stroke',function(d){return color(d.name);})
      .style('fill','white')
      .on('click', dim2)
      .append('title')
      .text(function(d){return d.name;});

    node.filter(function(d){return d.common;})
      .style('fill',function(d){return color(d.common.common[0].name);});

    node.on('mouseover',highlightNode)
        .on('mouseout',removehighlight);

    function dim2(d){
      dim(d);

      d3.select(this).style("stroke-opacity",1.0)
        .style('fill-opacity',1.0)
        .filter(function(d){return !d.active;})
        .style('stroke-opacity',0.2)
        .style('fill-opacity',0.2);
    }
  }

  function drawProjection(){
    
    var pos1=projection.pos1(),
        pos2=projection.pos2(),
        colorArr=projection.color();

    projectiong.selectAll('g').remove();

    // Dot2 add current projection dots
    var dot2=projectiong.append('g')
        .selectAll("circle")
        .data(pos2)
        .enter()
        .append("circle")
        .attr('cx',function(d){return d[0];})
        .attr('cy',function(d){return d[1];})
        .attr('r', 2)
        .attr('stroke-width', 0)
        .style('fill',function(_,i){return color(colorArr[i]);});

    var dot1=projectiong.append('g')
        .selectAll("circle")
        .data(pos1)
        .enter()
        .append("circle")
        .attr('cx',function(d){return d[0];})
        .attr('cy',function(d){return d[1];})
        .attr('r', 2)
        .attr('stroke-width', 0)
        .style('fill',function(_,i){return color(colorArr[i]);})
        .style("fill-opacity",0.3);

    var line=projectiong.append('g')
        .selectAll("line")
        .data(pos1)
        .enter()
        .append("line")
        .attr('x1',function(d){return d[0];})
        .attr('y1',function(d){return d[1];})
        .attr('x2', function(_,i){return pos2[i][0];})
        .attr('y2', function(_,i){return pos2[i][1];})
        .attr('stroke-width', function(d){return 2;})
        .attr('stroke',function(d){return color(colorArr[i]);})
        .attr('stroke-opacity', 0.3);

    function relayout(){
      // console.log(pos2);
      dot1.attr('cx',function(d){return d[0];})
        .attr('cy',function(d){return d[1];});

      dot2.attr('cx',function(d){return d[0];})
        .attr('cy',function(d){return d[1];});

      line.attr('x1',function(d){return d[0];})
        .attr('y1',function(d){return d[1];})
        .attr('x2', function(_,i){return pos2[i][0];})
        .attr('y2', function(_,i){return pos2[i][1];});

    }

    svg_proj.on("mouseover", function(_){
      dot1.style("fill-opacity",0);
      line.attr("stroke-opacity",0);

    })
    .on("mouseout", function(_){
      dot1.style("fill-opacity",0.3);
      line.attr("stroke-opacity",0.3);
    });

    return relayout;
  }

  function drawSankey(){
       
    linkg.selectAll('g').remove();
    
    var link=linkg.selectAll('g')
          .data(sankey.links(), function(d){return d;})
          .enter().append('g').selectAll(".link")
          .data(function(d){return d;})
          .enter().append("path")
          .attr("class", "link")
          .attr("d", path)
          .style("stroke-width",2); //function(d) {return Math.min(1, d.dy)
          // .sort(function(a, b) { return b.dy - a.dy; })
    //console.log(link.length);
    link.on("mouseover",highlightLink)
        .on("mouseout", removehighlight);

    link.append("title")
      .text(function(d) { return "Name: "+ d.source.name; });
      // .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });

    link.filter(function(d){return !d.active;})
        .style("stroke-opacity",0);
    
    groupg.selectAll('g').remove();

    var  group = groupg.selectAll("g")
          .data(sankey.groups(), function(d){return d;})
          .enter().append('g').selectAll(".group")
          .data(function(d){return d;})
          .enter()
          .append("g")
          // .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
          // .call(d3.behavior.drag()
          // .origin(function(d) { return d; })
          // .on("dragstart", function() { this.parentNode.appendChild(this); })
          // .on("drag", dragmove));

    var rect=group.append("rect")
        .attr("height", function(d) {return d.dy;})
        .attr("width", function(d) {return d.dx;})
        .style("fill", function(d) {return d.color = color(d.nodes[0].name);})
        .style('fill-opacity',1.0)
        .style("stroke-width",0.0)
        .style("stroke", function(d) { return d3.rgb(d.color).darker(2); });
        // .append("title")
        // .text(function(d) { return "contains: "+ d.children.join(','); });
        // .text(function(d) { return d.name + "\n" + format(d.value); });
    rect.filter(function(d){return !d.active;})
        .style('fill-opacity',0.1);

    rect.on("mouseover",highlightRect)
        .on("mouseout", removehighlight);

    // var circles= circleg.selectAll('g')

    var node=group.append('g')
        .selectAll('circle')
        .data(function(d){return d.nodes;})
        .enter()
        .append('circle')
        .attr('cx',function(d){return (-d.r-d.e);})
        .attr('cy',function(d){return d.y+d.dy/2;})
        .attr('r',function(d){return d.r;})
        .attr('stroke-width', function(d){ return d.e;})
        .attr('stroke',function(d){return color(d.name);})
        .style('fill','white')
        .on('click', dim);

    node.on('mouseover',highlightNode)
        .on('mouseout',removehighlight);

    node.filter(function(d){return d.common;})
        .style('fill',function(d){return color(d.common.common[0].name);});

    node.filter(function(d){return !d.active;})
        .style('stroke-opacity',0.1)
        .style('fill-opacity',0.1);

    node.append('title')
        .text(function(d){return d.name;});

    function dim(d){
      sankey.updateNode(d);

      link.style("stroke-opacity",0.1)
        .filter(function(d){return !d.active;})
        .style("stroke-opacity",0);

      rect.style("fill-opacity",1.0)
        .filter(function(d){return !d.active;})
        .style('fill-opacity',0.2);

      node.style("stroke-opacity",1.0)
        .style('fill-opacity',1.0)
        .filter(function(d){return !d.active;})
        .style('stroke-opacity',0.2)
        .style('fill-opacity',0.2);

      projection.relayout(d);
      if (d == prev && d.active) projection.relayout(d);
      updateProjection();
      prev=d;
    }

    function highlightLink(d) {
      var d=d.source;
      while (d.targetlink) {
        d=d.targetlink.source;
      }
      highlight(d);
    }

    function highlightNode(d) {
      while (d.targetlink) {
        d=d.targetlink.source;
      }
      highlight(d);
    }

    function highlightRect(d) {
      d.nodes.forEach(function(node){
        while (node.targetlink){
          node=node.targetlink.source;
        }
        highlight(node);
      });
      // d3.select(this).attr("filter",'url(#glow)');
    }

    function highlight(d){
      var nodes=[],
          links=[],
          groups=[];
      while (d.sourcelink){
        nodes.push(d);
        groups.push(d.group);
        links.push(d.sourcelink);
        d=d.sourcelink.target;
      }
      nodes.push(d);
      groups.push(d.group);

      link.filter(function(d){return links.indexOf(d)> -1;})
      .attr("filter",'url(#glow)');

      node.filter(function(d){return nodes.indexOf(d)> -1;})
      .attr("filter",'url(#glow)');

      rect.filter(function(d){return groups.indexOf(d)> -1;})
      .attr("filter",'url(#glow)');
    }

    function removehighlight(d){
      // d3.select(this).select("text").remove();
      link.attr("filter",'');
      node.attr("filter",'');
      rect.attr("filter",'');
    }

    return [dim, highlightNode, removehighlight];
  }

  function change(i,j) {
    d3.select(this).property('value', j); //,function(){return j;});
    // console.log(d3.select(this.parentNode).select('text').text(function(i){return 0;}));
    sankey.size([size[0],height]).relayout(i,j);
    size=sankey.size();
    svg_sankey.attr('width',size[0]+margin.right+margin.left)
      .attr('height',size[1]+margin.top+margin.bottom);
    drawSankey();
  }

  function addComment(){
    chart.select("text").remove();
    // I don't know why the newline \n doesn't take effects.
    chart.append("text")
        .text("1. 1."+
      "Edge color represents different attributes;If two or more nodes have the same inside fill (not white), they belong to the same cluster through the sankey diagram.\n"+
      "2. Each node is clikable: once clicked, it will become nearly invisible, and the PCA without this attribute will be shown,\nand this history position will be less visible in the background. \n"+
      "3. With mouse over the PCA projection, only newest projection will be shown, history will be invisible.\n");
  }

}



    
