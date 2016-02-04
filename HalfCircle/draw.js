var path = './HalfCircle/data/norm/';

function draw(source) {
  var angle_f = path + source + '.angle.csv',
      data_f = path + source + '.csv',
      corr_f = path + source + '.corr.csv';

  var angle=d3.transpose(d3.csv.parseRows(httpGet(angle_f))),
      dir= data_f,
      axis=[];
  // console.log(angle_f);
  // console.log(angle);

  for (var i=0; i<angle.length; i++){
      axis[i]=[];
      axis[i][0]=Math.sin(+angle[i][1]);
      axis[i][1]=Math.cos(+angle[i][1]);
  }

  svgp.selectAll('g').remove();
  svgc.selectAll('g').remove();

  var ga=svgp.append("g")
      .selectAll("g")
      .data(axis)
      .enter().append("g");

  var drag = d3.behavior.drag()
      //.origin(function(d, i) { var x=angle[i][0]*radius; var y=angle[i][1]*radius; return {x: x, y: y}; })
      .on("dragstart", dragstarted)
      .on("drag", dragged)
      .on("dragend", dragended);

  ga
      .append("line")
      .attr("x2", function(d){ return d[0]*radius;})
      .attr("y2", function(d){ return d[1]*radius;})
      //.attr("transform", function(d) { return "translate(" + rad2degree(d) + ")"; })
      .attr("stroke", function(d, i) { return color(i); })
      .attr("stroke-width",2);
      
      //.call(drag);

  ga
      .append('circle')
      .attr("cx",function(d){ return d[0]*radius;})
      .attr("cy",function(d){ return d[1]*radius;})
      .attr("r", 7)
      .style("fill", function(d, i) { return color(i);})
      // .style("stroke","rgb(31, 119, 180)")
      // .style("stroke-width",3)
      .call(drag);

  //dragElement.append("arc")
  //           .attr("startangle")

  //dragElement.call(drag);

  ga
      .append("text")
      .attr("x", function(d){ return d[0]*radius + 7;})
      .attr("y", function(d){ return d[1]*radius;})
      .attr("dy", ".35em")
      //.attr("transform", function(d,i) { return "rotate("+(90-angle[i][1]/Math.PI*180)+" " +d[0]*radius+","+d[1]*radius+ ")"; })
      //.attr("",)
      .attr("fill", function(d, i) { return color(i); })
      .text(function(d,i) { return "  "+angle[i][0]; });

  var projectD=projection(axis,dir);
  

  var node=svgp.append("g")
              .attr("class", "node")
              .selectAll(".circle")
              //.attr("class","circle")
              .data(projectD).enter()
              .append("circle")
              .attr("cx",function(d,i){ return d3.round(d[0]*radius);})
              .attr("cy",function(d,i){ return d3.round(d[1]*radius);})
              .attr("r", 4)
              .on("click",click)
              .style("fill", "white")
              .style("stroke","rgb(31, 119, 180)")
              .style("stroke-width",3);

  /*var brush = svg.append("g")
        .attr("class", "brush")
        .call(d3.svg.brush()
          .x(d3.scale.identity().domain([0, width]))
          .y(d3.scale.identity().domain([0, height]))
          .on("brush", function() {
            var extent = d3.event.target.extent();
            console.log(extent);
            node.classed("selected", function(d) {
              return extent[0][0] <= d3.round(d[0]*radius) && d3.round(d[0]*radius) < extent[1][0] 
              && extent[0][1] <= d3.round(d[1]*radius) && d3.round(d[1]*radius) < extent[1][1];
            });
          }));*/

  //function zoom() {
  //    svgp.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  //}

  var prev_x=0,prev_y=0,ind=0;

  function dragstarted(d,i) {

    var obj=d3.select(this);
    prev_x =+obj.attr("cx");
    prev_y =+obj.attr("cy");
    ind=i;
    // console.log(dx2,dy2);
  }

  function dragged(d) {
    var x = d3.event.x, y = d3.event.y;

    d3.select(this).attr("cx", x)
      .attr("cy", y);

    d3.select(this.parentNode).select("text")
      .attr("x", x + 7)
      .attr("y", y);

    var obj=d3.select(this.parentNode).select("line");
    obj.attr("x2",x)
      .attr("y2",y);


    // dx2=(dd[0]-dx2)/radius;
    // dy2=(dd[1]-dy2)/radius;
    // var obj=d3.select(this);
    var d_x = (x-prev_x)/radius, d_y = (y - prev_y)/radius;
    prev_x = x;
    prev_y = y;

    node //.selectAll("circle")
      //.transition()
      //.duration(100)
      .attr("cx", function(d,i){ var dd=update(d_x,d_y,ind,i); d[0] = d[0] + dd[0]; d[1] = d[1] +  dd[1]; return d3.round(d[0]*radius);})
       //return "translate(" +d3.round((d[0]+dd[0])*radius/10) + ")scale(" + d3.round((d[1]+dd[1])*radius/10) + ")";})
      .attr("cy", function(d,i){return d3.round(d[1]*radius);});
  }

  function dragended(d,i) {}

  function click(d){
    var color="rgb(31, 119, 180)";
    var obj=d3.select(this);
    if (color==obj.style("stroke")){
        obj.style("stroke","rgb(255, 0, 0)");
    } else obj.style("stroke","rgb(31, 119, 180)");
  }

  // Draw correlation matrix
  var datasetText = httpGet(corr_f);

  var corr=d3.csv.parseRows(datasetText);
  //d3.csv("wine.data.csv",function(rows){console.log(rows.key)});

  //function rotateTranslate(d,i) {return d3.svg.transform().rotate(-90).translate(200, 100*i);}
  var xaxis=svgc.append("g");
      //.attr("class", "a axis")


  xaxis.selectAll("g")
      .data(corr[0])
      .enter()
      .append("g")
      .attr("transform", function(d,i) {return "translate(" + (cellsize*i+cellsize/2+label_size)+ "," + label_size + ")" ;})
      .append("text")
      .attr("fill","black")
      //.attr("y",100)
      .attr("dy", ".35em")
      .attr("transform", "rotate(" +-90+")")
      .text(function(d) {return d;})
      .attr("id",function(d,i) {return i;})
      .on("click",choose);

  var yaxis=svgc.append("g");

      //.attr("class", "a axis")
  yaxis.selectAll("g")
      .data(corr[0])
      .enter()
      .append("g")
      .attr("transform", function(d,i) {return "translate(" + label_size+ "," + (cellsize*i+cellsize/2+label_size) + ")" ;})
      .append("text")
      .attr("fill","black")
      .style("text-anchor", "end")
      //.attr("y",100)
      .attr("dy", ".35em")
      //.attr("transform", "rotate(" +-90+")")
      .text(function(d) {return d;})
      .attr("id",function(d,i) {return i;})
      .on("click",choose);


  corr.shift();
  //console.log(corr);
  // Find the range for the correlation error.
  arr=d3.range(corr.length);
  var max = 0;
  for (var i=1; i<corr.length; i++){
    for (var j=0; j<i;j++){
      corr[i][j]=Math.abs(corr[j][i]-Math.cos((+angle[j][1])-(+angle[i][1])));
      if (max<corr[i][j]) max=corr[i][j];
    }
  }
  // console.log([min,max,1])

  // Color function for the correlation error.
  var color2 = d3.scale.linear()
      .domain([0, 1])
      .range(["white", "steelblue"])
      .interpolate(d3.interpolateLab);

  var color3 = d3.scale.linear()
      .domain([0, 2]) // max
      .range(["white", "crimson"])
      .interpolate(d3.interpolateLab);

  var rect=svgc.append("g")
      .selectAll("g").data(arr).enter()
      .append("g")
      .attr("transform", function(d,i) { this.id = i; return "translate(" + label_size+ "," + (cellsize*i+label_size) + ")" ;});

  var formatNumber = d3.format(",.000f");   

  var rect2=rect.selectAll("rect")
      .data(function(d) { return corr[d];})
      .enter()
      .append("rect")
      .attr("width", cellsize-margin*2)
      .attr("height", cellsize-margin*2)
      .attr("y", margin)
      .attr("x", function(d,i) { this.xpos = i*cellsize + margin; return this.xpos; })
      .attr("fill",function(d, col) { 
        var row = this.parentNode.id;
        return row>col ? (color3(Math.abs(d))): (color2(Math.abs(d)));});
      //.attr("id", function(d,i){ return d3.select(this.parentNode).attr("id"));});

  rect2
       .append("title")
       .text(function(d, col) {
        var row = this.parentNode.parentNode.id;
        return row > col ? ('correlation error:\n' + d) : ('original correlation: \n' +d);
      });

  rect2.on("mouseover",mouseover)
      .on("mouseout",mouseout);

  function mouseover(){
      d3.select(this).transition()
        .ease("elastic")
        .duration(100)
        .attr("width", cellsize+margin*6)
        .attr("height", cellsize+margin*6)
        .attr("y", - margin * 4)
        .attr("x", function(d, i) {return (this.xpos - margin*4);} );
        // .attr("transform","translate(" + -margin*4+ "," + -margin*4 + ")" );
  }

  function mouseout(){
      d3.select(this).transition()
        .ease("elastic")
        .duration(100)
        .attr("width", cellsize-margin*2)
        .attr("height", cellsize-margin*2)
        .attr("y", margin)
        .attr("x", function(d, i) {return this.xpos;});
        //.attr("transform","translate(" + margin*4+ "," + margin*4 + ")" );
  }

  function choose(){

    var i=this.id;
    var obj=d3.select(this);

    if ("rgb(255, 0, 0)"==obj.style("fill")){
       var c="rgb(0, 0, 0)";
    } else var c="rgb(255, 0, 0)";

    d3.selectAll("text[id='" + i + "']")
      .attr("fill", c); 
  }
}