projection=function(){
  var projection={},
      size=[430,100],  // size[0] = size[1]
      array=[],
      colorArr=[],
      sub_array=[],
      // countArr=['curr','his1','his2'],
      features = [],
      substract = [],
      pos1=[],
      pos2=[];
      // pca={his1:[], his2:[],curr:[]}, // need to add axis
      // stand_star={axis:[], his1:[], his2:[],curr:[]},
      // ortho_star={axis:[], his1:[], his2:[],curr:[]}, // need to add axis
      // t_SNE={his1:[], his2:[],curr:[]};

  projection.features= function(_){
    if (!arguments.length) return features;
    features = _;
    return projection;
  };

  projection.array= function(){
    return array;
  };

  projection.sub_array= function(){
    return sub_array;
  };

  projection.size=function(_){
    if (!arguments.length) return size;
    size = _;
    return projection;
  };

  projection.pos1= function(){
    return pos1;
  };

  projection.pos2= function(){
    return pos2;
  };

  projection.color=function(){
    return colorArr;
  };

  projection.parse=function(url){

    if (!arguments.length) return projection;

    var request = new XMLHttpRequest();
    var allText;
    request.open('GET', url, false);
    request.onreadystatechange = function ()
    {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                allText = request.responseText;
                // alert(allText);
            }
        }
    }
    request.send(null);

    csv_parse(allText); 
    return projection;
  };

  projection.priority = function(){
    return getPriority();
  };

  projection.layout= function(){
    var n=array.length;
    pos2=[];
    pos1=[];
    for (var i=0; i<n; i++){
      pos2[i]=[];
      pos1[i]=[];
    }
    computePCA();

    // Initialize pos1
    pos2.forEach(function(pos,i){
      pos1[i][0] = pos[0];
      pos1[i][1] = pos[1];
    });
    return projection;
  };

  projection.relayout = function (node){
    var id=node.id;
    if (!node.active) {
      substract.push(id);
    } else {
      var i=substract.indexOf(id);
      if (i > -1) substract.splice(i,1);
    }
    substract.sort();
    subArray();
    pos2.forEach(function(pos,i){
      pos1[i][0] = pos[0];
      pos1[i][1] = pos[1];
    });

    computePCA();
    return projection;
  };

  function subArray(){
    if (!substract.length) {
      sub_array=array;
      return;
    }
    sub_array=[];
    var z=0,
        n = array.length,
        m = array[0].length,
        m_sub = substract.length;
    for (var i = 0; i< n; i++){
      z=0;
      var arr=[];
      for (var j = 0; j< m; j++){
        if (z < m_sub && j==substract[z]) {
          z ++;
        }else {
          arr.push(array[i][j]);
        }
      }
      sub_array.push(arr);
    }
  }

  function getPriority(){
    var m=array[0].length,
        n=array.length,
        sub_array=[],
        pos=[];

    var priority=[];

    var original_pos=computePCA2(array); 

    for (var i=0; i<m; i++){
      sub_array = subArray(i);
      pos = computePCA2(sub_array);
      priority.push(findDist(pos, original_pos));
    }

    function computePCA2(array){
      var svd=numeric.svd(array);
      var u=svd.U,
          s=svd.S;
      var x=[], y=[];
      var m=s.length;
      for (var i=0; i<u.length; i++){
        if (m>0)  x[i]=u[i][0]*s[0];
        else x[i]=0;
        if (m>1)  y[i]=u[i][1]*s[1];
        else y[i]=0;
      }
      delete svd, u, s;
      return [x,y];
    }

    function findDist(pos1, pos2, n_sigma){
      n_sigma=2;
      var x1=pos1[0], y1=pos1[1],
          x2=pos2[0], y2=pos2[1];
      var n=x1.length, d=[];
      // Use normal distribution 2*sigma, around 95.4 % validity.
      // Mean value mu = E(x)
      // Standard deviation sigma = sqrt(E(x**2)-(E(x))**2)
      var mu=0, mu2=0, sigma=0;
      for (var i =0; i<n; i++){
        d[i]=Math.pow((x1[i]-x2[i]),2)+Math.pow((y1[i]-y2[i]),2);
        mu2 += d[i];
        d[i]= Math.sqrt(d[i]);
        mu += d[i];
      }
      mu = mu/n;
      mu2 = mu2/n;
      sigma = Math.sqrt(mu2-Math.pow(mu,2));
      var d_min = mu - n_sigma*sigma, d_max= mu + n_sigma*sigma;
      var distance=0, count = 0;
      for (var i=0; i<n; i++){
        if (d[i] > d_min && d[i] < d_max) {
          distance += d[i];
          count += 1;
        }
      }
      return distance/count;
    }

    function subArray(ind){
      var sub_array = [];

      for (var i=0; i<n; i++){
        var l=[];
        for (var j=0; j <ind; j++){
          l.push(array[i][j]);
        }
        for (var j=ind+1; j <m; j++){
          l.push(array[i][j]);
        }
        sub_array.push(l);
      }
      return sub_array;
    }
    return priority;
  }

  // Compute PCA projection
  function computePCA(){
    // console.log(sub_array);
    var svd=numeric.svd(sub_array);
    var u=svd.U;
    var s=svd.S;
    var m=s.length;
    // var range=[0,0,0,0];
    for (var i =0; i<u.length; i++){
      if (m >0) pos2[i][0]=u[i][0]*s[0];
      else pos2[i][0]=0;
      if (m > 1) pos2[i][1]=u[i][1]*s[1];
      else  pos2[i][1]=0;
      // updatePath(temp,0,i);
    }  
    delete u;
    delete s;
    calcPos(pos2);
  }

  function calcPos(poss,offset){
    if ((arguments.length==1) || (offset > Math.min(size))) var offset = 1;
    var span=[size[0]/2-offset,size[1]/2- offset];
    var x=0, y=0;

    var xmax = d3.max(poss, function(d){return Math.abs(d[0]);});
    var ymax = d3.max(poss, function(d){return Math.abs(d[1]);});

    if (xmax==0) var xratio=1;
    else var xratio = span[0]/xmax;
    if (ymax==0) var yratio=1;
    else var yratio = span[1]/ymax;

    poss.forEach(function(p){
      p[0] = xratio * p[0];
      p[1] = yratio * p[1];
    });
  }

  function csv_parse(text){
    array=[];
    colorArr=[];
    var lines = text.split('\n'),
        line=[];
    features = lines[0].split(',');

    for (var i=1; i < lines.length; i ++){
      if (lines[i].length == 0) continue;
      line=lines[i].split(',');
      var arr=[];
      for (var j=0; j< line.length-1; j++){
        arr.push(+line[j]);
      }
      array.push(arr);
      colorArr.push(+line[j]);
    }
    // pca.color = colorArr;
    // stand_star.color=colorArr;
    // ortho_star.color = colorArr;
    // t_SNE.color=colorArr;
    sub_array = array;
  }
  return projection;
};


