sankey=function(){


  var sankey={},
      nodeWidth=12,
      nodePadding=8,
      size=[1,1],
      ky=1,
      font_size=12;

  var root=null,
      names=[],
      data=[],
      n_features=0,
      n_clusters=0,
      levels=[],
      nodes=[],
      groups=[],
      links=[],
      inputs=[],
      r_min=5,
      kx_min=50,
      r_edge_ratio=1,
      commonLinks=[],
      // axiss=[];
      initial_layout=true;

  sankey.root= function (_){
    if (!arguments.length) return root;
    root= _;
    names=root.name;
    data=root.data;
    n_features=data[0].length;
    n_clusters=data.length;
    for (i =0;i <n_clusters;i++){
      levels[i]=Math.max(1,Math.floor(n_features/2));
    }
    initial_layout=true;
    // initial parameters

    return sankey;
  };

  sankey.nodeWidth=function(_){
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };
  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.ky=function(){
    return ky;
  };

  sankey.n_features=function(){
    return n_features;
  };
  
  sankey.n_clusters=function(){
    return n_clusters;
  };

  sankey.levels=function(){
    return levels;
  };

  sankey.r_min=function(_){
    if (!arguments.length) return r_min;
    r_min= +_;
  };

  sankey.kx_min=function(_){
    if (!arguments.length) return kx_min;
    kx_min= +_;
  };

  sankey.r_edge_ratio=function(_){
    if (!arguments.length) return r_edge_ratio;
    r_edge_ratio = +_;
    r_edge_ratio = min(1.0,r_edge_ratio);
  };

  sankey.names=function(){
    return names;
  }

  sankey.font_size=function(_){
    if (!arguments.length) return font_size;
    font_size=_;
    return sankey;
  };

  sankey.groups = function(_) {
    if (!arguments.length) return groups;
    groups=_;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.inputs=function (_){
    if (!arguments.length) return inputs;
    inputs= _;
    return sankey;
  };

  sankey.nodes=function (){
    return nodes;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function() {
    computeNodesLinks();
    computeGroups();
    computeGroupAndCircleDepths();
    computeGroupBreadths();
    computeCommons();
    computeInputBreadths();
    initial_layout=false;
    return sankey;
  };

  sankey.relayout = function(i,j) {
    levels[i]= n_features-j;
    var groupArr=[];
    groupArr=computeColumnGroups(data[i][levels[i]],nodes[i],i); // Rearrange the circles
    groups[i]= groupArr;
    groups[i].forEach(function(group){
      var active=false;
      group.nodes.forEach(function(node){
        if (!node.active) group.value -=1;
      });
      if (group.value==0) group.active=false;
    });
    computeGroupAndCircleDepths();
    computeGroupBreadths(i);
    computeCommons();
    return sankey;
  };

  sankey.updateNode=function(node){

    while (node.targetlink) node=node.targetlink.source;

    if (node.active){
      for (var i =0; i<n_clusters; i++){
        node.active=false;
        node.group.value -= 1;
        if (node.group.value == 0){
          node.group.active = false;
        }
        if (node.common){
          var common_node=node.common;
          common_node.value -=1;
          if (common_node.value < 2) common_node.active=false;
        }
        if (i<n_clusters-1){
          node.sourcelink.active = false;
          node=node.sourcelink.target;
        } 
      }
    }
    else{
      for (var i =0; i<n_clusters; i++){
        node.active=true;
        node.group.value +=1;
        node.group.active=true;
        if (node.common){
          var common_node=node.common;
          common_node.value +=1;
          if (common_node.value >=2) common_node.active=true;
        }
        if (i<n_clusters-1){
          node.sourcelink.active=true;
          node=node.sourcelink.target;
        }  
      }
    }
    return sankey;
  };

  sankey.link = function() {
    var curvature = .5;
    function link(d) {
      var x0 = d.source.group.x-d.source.r-d.source.e,
          x1 = d.target.group.x-d.target.r-d.target.e,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y+d.source.group.y + d.source.dy/2,
          y1 = d.target.y+d.target.group.y + d.target.dy/2;
      return "M" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // sankey.commonlink = function() {
  //   var offset = 5;
  //   function link(d) {
  //     var common_node=d.common;
  //     if (!common_node.active) return "";
  //     var nodes = common_node.common.filter(function(node){return node.active;});
  //     // console.log(nodes);
  //     if (nodes.length < 2) return "";
  //     console.log(nodes);
  //     var x0 = nodes[0].group.x - nodes[0].r - nodes[0].e,
  //         x1 = x0 - nodes[0].r-nodes[0].e-offset,
  //         y0 = nodes[0].group.y + nodes[0].y + nodes[0].dy/2;
          
  //     var path = "M"+x0+","+y0+"L"+x1+","+y0;
  //     nodes.splice(1).forEach(function(node){
  //       y1=node.group.y + node.y + node.dy/2;
  //       path += "L" + x1 +',' + y1
  //             + "L" + x0 +","+ y1
  //             + "L" + x1 +',' + y1;
  //       y0=y1;
  //     });
  //     return path
  //   }

  //   link.offset = function(_) {
  //     if (!arguments.length) return offset;
  //     offset = +_;
  //     return link;
  //   };

  //   return link;
  // };

  // Computations

  function computeNodesLinks(){
    // Given names, nodes can be computed.
    // Some of the nodes only have sourcelink or targetlink
    nodes=[];
    links=[];
    var base=[];
    var sources,
        targets;
    for (var i = 0;i <n_clusters;i++){      
      base=data[i][0];
      var nodeArr=[];
      base.forEach(function(ind){
        var node={};
        node.id=ind;
        node.name=names[ind];
        node.active=true;
        nodeArr.push(node);
      });
      nodes.push(nodeArr);
    }
    for (var i=1; i<n_clusters; i++){
      sources=nodes[i-1];
      targets=nodes[i];
      var linkArr=[];
      sources.forEach(function(source){
        targets.forEach(function(target){
          if (source.id==target.id){
            var link = {};
            link.source=source;
            link.target=target;
            link.active=true;
            source.sourcelink=link;
            target.targetlink=link;
            linkArr.push(link);
          }
        });  
      });
      links.push(linkArr);
    }
  }

  // Parse data to groups
  function computeGroups(){
    var groupArr;
    // groups=null;
    groups=[];
    for (var i = 0;i <n_clusters;i++){      
      groupArr=computeColumnGroups(data[i][levels[i]],nodes[i],i);
      groups.push(groupArr);
    }
  }

  function computeColumnGroups(levels,nodes,x){

    var groupArr=[],
        node=null,
        id=0;
    //if (i==0) console.log(n_features);
    for (var j = 0;j < n_features;j++){
      node=nodes[j];
      if (j==0 || levels[j] !== levels[j-1]){
        var group={};
        group.id=id;
        group.x=x;
        group.value= 1;
        group.nodes=[node];
        node.group=group;
        group.active=true;
        groupArr.push(group);
        id ++;      
      }else {
        group.value ++;
        node.group=group;
        group.nodes.push(node);
      }
    }
    return groupArr;
  }

  function computeGroupAndCircleDepths() {
    var y=0;

    var max_length=d3.max(groups, function(layer){return layer.length;});

    nodePadding = Math.min(nodePadding, size[1]/2/(max_length-1));

    ky = Math.max(r_min*2,(size[1]-(max_length-1)*nodePadding)/n_features);
    size[1]= Math.max(size[1], ky*n_features + (max_length-1)*nodePadding);

    groups.forEach(function(layer) {
      y=0;
      layer//.filter(function(group){return group.active;})
      .forEach(function(group) {
        group.y = y;
        group.dy = group.nodes.length * ky;
        y += (group.dy+nodePadding);
      });
    });
    computeCircleDepths();
  }

  function computeCircleDepths(){
    var r = ky/2;
    var edge=r/(2+r_edge_ratio);
    r -= edge;
    groups.forEach(function(layer,i){
      layer//.filter(function(group){return group.active;})
      .forEach(function(group){
        if (i>0)  group.nodes.sort(ascendingSourceDepth);

        var y=0;
            // x=group.x;
        group.nodes//.filter(function(node){return node.active;})
        .forEach(function(node){
          //console.log(node);
          // node.x = x;
          node.y = y;
          node.r = r;
          node.e = edge;
          node.dy = ky;
          //node.group=group;
          y += ky;
        });
      });
    });

    function ascendingSourceDepth(a,b){
      return a.targetlink.source.y+a.targetlink.source.group.y - b.targetlink.source.y-b.targetlink.source.group.y;
    }
  }

  function computeGroupBreadths(_) {

    var NodeWidth=nodeWidth+ky; // ky*ky is the area each node takes.
    // nodeWidth = 6 + ky;
    // console.log(n_clusters);

    if (initial_layout){
      size[0] = Math.min(size[0],window.innerWidth);
      var kx=(size[0] - NodeWidth) / (n_clusters-1);

      if (kx < kx_min){
        size[0]= window.innerWidth;
        kx=(size[0] - NodeWidth) / (n_clusters-1);
      }
      if (kx < 2*NodeWidth){
        NodeWidth=kx/2;
      }
    }

    var kx=(size[0] - NodeWidth) / (n_clusters-1);

    NodeWidth = Math.max(0.1, NodeWidth-ky);

    if (arguments.length){
      i = +_;
      groups[i].forEach(function(group){
        group.x= group.x*kx+ky;
        group.dx=NodeWidth;
      });
    }else{
      groups.forEach(function(layer){
        layer.forEach(function(group){
          group.x = group.x * kx + ky;
          group.dx = NodeWidth;
        });
      });
    }

  }

  function computeCommons(){

    // Initilize nodes to have no common attributes;
    nodes.forEach(function(layer){
      layer.filter(function(node){return node.common;})
          .forEach(function(node){
            delete node.common;
          });
    });

    var candidates=[],
        commons=[],
        r=0,
        n=0;
    var t,
        id;
    
    groups[0].filter(function(group){return group.value >1;})
    .forEach(function(group){
      candidates.push(group.nodes);
      // Find all the commons
      while (r=candidates.pop()){
        if (!r[0].sourcelink) {
          commons.push(r);
        }else {
          n=r.length;
          var h={};
          for( var i =0; i < n; i++){
            t=r[i].sourcelink.target;
            id = t.group.id;
            if (!h[id]) h[id]=[t];
            else h[id].push(t);
          }
          for (var k in h){
            if (h[k].length >1) candidates.push(h[k]);
          }
          delete h;
        }
      }
    });
    
    // Found all the commons, give the nodes common attributes 
    commonLinks=[]; 
    while (r = commons.pop()){
      for (var i =n_clusters-1; i > -1; i--){
        var common_node={};
        common_node.common=r;
        common_node.value=r.filter(function(node){return node.active;}).length;
        common_node.active=true;
        if (commonLinks[i]) commonLinks[i].push(common_node);
        else commonLinks[i]=[common_node];
        r.forEach(function(node){
          node.common=common_node;
        });
        if (r[0].targetlink){
          for (var j =0; j<r.length; j++){
            r[j]=r[j].targetlink.source;
          }
        }
      }
    }
    delete commons;
  }

  function computeInputBreadths(){
    inputs=[];
    for (var i=0; i<n_clusters; i++){
      var input={};
      input.id=i;
      input.x=groups[i][0].x;
      inputs.push(input);
    }
  }

  return sankey;
};