xr_sankey=function(){
  var sankey={},
      nodeWidth=24,
      nodePadding=8,
      size=[1,1],
      layers={},
      nodes=[],
      links=[],
      labels=[],
      inputs=[];

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

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes=_;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.labels=function (_){
    if (!arguments.length) return labels;
    labels= _;
    return sankey;
  }
  sankey.inputs=function (_){
    if (!arguments.length) return inputs;
    inputs= _;
    return sankey;
  }

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function(iterations) {
    //computeNodeLinks();
    //computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    computeLabelDepths();
    computeInputBreadths();
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function() {
    var curvature = .5;
    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
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

  //   Computations
  // function computeNodes(root,level){

  //   var data=root.data,
  //       names=root.names;

  //   data.forEach(M){
  //     var d=M[level],
  //         d_list=M[0],
  //         layer=[],
  //         node={names:[names[0]],value:1,items:[d_list[0]]};
  //     for (i=1; i<d.length;i++){
  //       if (d[i] ===d[i-1]){
  //         node.names.push(names[i]);
  //         node.value +=1;
  //         node.items.push(d_list[i]);
  //       }
  //       else {
  //         layer.push(node);
  //         node={names:[names[i]],value:1,items:[d_list[i]]};
  //       }
  //     }
  //     if (node.value===1){
  //       layer.push(node);
  //     }
  //     nodes.push(layer)
  //   }
  // }

  // function computeLinks(){

  //   return links
  // }
  function computeNodesLinks() {
    nodes.forEach(function(layer) {
      layer.forEach(function(node){
        node.sourceLinks=[]
        node.targetLinks=[]
      });
    });
    links.forEach(function(layer, i) {
      layer.forEach(function(link){
        var source = link.source,
            target = link.target;
      if (typeof source === "number") source = link.source = nodes[i][link.source];
      if (typeof target === "number") target = link.target = nodes[i+1][link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);

      });
    });
  }
  function computeNodeValues() {
    nodes.forEach(function(layer){
      layer.forEach(function(node) {
        node.value = Math.max(
          d3.sum(node.sourceLinks, value),
          d3.sum(node.targetLinks, value)
        );
      });
    });
  }
  function computeNodeBreadths() {
    var x;
    nodes.forEach(function(layer,i){
      layer.forEach(function(node){
        x=i;
        node.x=i;
      });
    });
    // moveSinksRight(x);
    x +=1;
    //console.log(nodes.length);
    //console.log(x);
    scaleNodeBreadths((size[0] - 4*nodeWidth) / (x-1));
  }

  function scaleNodeBreadths(kx) {
    //console.log(kx, nodeWidth);
    if (kx < 3*nodeWidth){
      nodeWidth=kx/3;
    }
    nodes.forEach(function(layer){
      layer.forEach(function(node){
        node.x *= kx;
        node.x += 3*nodeWidth;
        node.dx=nodeWidth;
      });
    });
  }
  function computeNodeDepths(iterations) {
    nodes.forEach(function(layer){
      if ((size[1]-(layer.length-1)*nodePadding)< (size[1]/2)){
        nodePadding = (size[1])/2/(layer.length-1);
      }
    });
    var ky = d3.min(nodes, function(layer) {
      if (size[1]-(layer.length-1)*nod)
      var value=(size[1] - (layer.length - 1) * nodePadding) / d3.sum(layer, function(d){return d.value});
      if v
    });
    //console.log(ky);

    nodes.forEach(function(layer) {
      layer.forEach(function(node, i) {
        node.y = i;
        node.dy = node.value * ky;
      });
    });

    links.forEach(function(layer) {
      layer.forEach(function(link){
        link.dy = link.value * ky;
      });
    });
    resolveCollisions();
    
    function resolveCollisions() {
      nodes.forEach(function(layer) {
        var node,
            dy,
            y0 = 0,
            n = layer.length,
            i;

        // Push any overlapping nodes down.
        //nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = layer[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }
  }

  /* Function to computeNodeDepths with relaxing

  function computeNodeDepths(iterations) {
    var nodes = d3.nest()
        .key(function(d) { return d.x; })
        .sortKeys(d3.ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });

    //
    initializeNodeDepth();
    resolveCollisions();
    // for (var alpha = 1; iterations > 0; --iterations) {
    //   relaxRightToLeft(alpha *= .99);
    //   resolveCollisions();
    //   relaxLeftToRight(alpha);
    //   resolveCollisions();
    // }

    function initializeNodeDepth() {
      var ky = d3.min(nodes, function(layer) {
        return (size[1] - (layer.length - 1) * nodePadding) / d3.sum(layer, function(d){return d.value});
      });

      nodes.forEach(function(layer) {
        layer.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(layer) {
        layer.forEach(function(link){
          link.dy = link.value * ky;
        });
      });
    }

    function relaxLeftToRight(alpha) {
      nodes.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodes.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodes.forEach(function(layer) {
        var node,
            dy,
            y0 = 0,
            n = layer.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = layer[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }
  */

  function computeLinkDepths() {
    nodes.forEach(function(layer) {
      layer.forEach(function(node){
        node.sourceLinks.sort(ascendingTargetDepth);
        node.targetLinks.sort(ascendingSourceDepth);
      });
    });
    nodes.forEach(function(layer) {
      layer.forEach(function(node){
        var sy = 0, ty = 0;
        node.sourceLinks.forEach(function(link) {
          link.sy = sy;
          sy += link.dy;
        });
        node.targetLinks.forEach(function(link) {
          link.ty = ty;
          ty += link.dy;
        });
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function computeLabelDepths() {
    var source=nodes[0],
        n,
        children,
        ky;
    source.forEach(function(node){
      children=node.children;
      //console.log(children);
      n=children.length;
      if (n>1){
        ky=node.dy/(n-1);
      }else {
        ky=node.dy/2;
      }
      for (i=0; i<n; i++){
        labels[children[i]].x=node.x;
        labels[children[i]].y=node.y+ky*i;
      }
    });
    function compare(a,b){
      if (a>b){return 1;}
      if (a <b){ return -1;}
      return 0;

    }
  }


  function computeInputBreadths() {
    var x,
        n;
    n=nodes.length;
    for (i =0; i<n; i++){
      x=nodes[i][0].x+nodeWidth/2;
      inputs[i].x=x;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
  
};