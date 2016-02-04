var dataset;
var ratio;

function projection(angle,path){
 
var data=d3.csv.parseRows(httpGet(path));

var projection=[]; 
// var mean=[],norm=[];

data.shift();
data=d3.transpose(data);
data.shift();
// console.log(data);

// for (var i=0;i<data.length;i++){
// 	var m=0, n=0;
// 	for (var j=0;j<data[0].length; j++){
// 		m += (+data[i][j]);
// 	}

// 	m=m/j;

// 	for (var j=0;j<data[0].length; j++){
// 		n +=Math.pow(+data[i][j]-m,2);
// 	}
// 	norm[i]=Math.sqrt(n);
// 	mean[i]=m;
// }
//console.log(mean);
//console.log(norm);

data=d3.transpose(data);
var maxVal = 0, r = 0;
// console.log(norm);
for (var i=0;i<data.length;i++){
	n=0; m=0;

	for (var j=0;j<angle.length;j++){

		// data[i][j]=(+data[i][j]-mean[j])/norm[j];

		n +=(data[i][j]*angle[j][0]);
		m +=(data[i][j]*angle[j][1]);
	}
  r = Math.pow(n, 2) + Math.pow(m, 2);
  if (r > maxVal) { maxVal = r ;}

	projection[i]= [n,m];
}
  //console.log(+data[1][1]+2, projection[0][0]);
  dataset=data;
  //console.log(projection);
  maxVal = Math.sqrt(maxVal);
  ratio = Math.pow(1/maxVal, 0.8);
  for (var i = 0; i < projection.length; i ++) {
      projection[i][0] = projection[i][0]*ratio;
      projection[i][1] = projection[i][1]*ratio;
  }
  return projection;
}

function httpGet(theUrl)
  {
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false);
    xmlHttp.send();
    var text = xmlHttp.responseText;
    xmlHttp.abort();
    return text;
  }

function update(dx2,dy2,ind,i){

	var d=dataset[i][ind];
	return [dx2*d*ratio,dy2*d*ratio];

}

function reProjection(idarr)
{
	var corrR=[];
	var m=1;
	var pos=[];
	var index=[];

  	for (var i=0;i<idarr.length; i++){
  		corrR[i]=[];
  		for (var j=0;j<idarr.length; j++){
  			corrR[i][j]=corr[(+idarr[i])][(+idarr[j])];
  			if ( i<j && m>Math.abs(corrR[i][j])) {
  				m=Math.abs(corrR[i][j]);
  				pos[0]=i; pos[1]=j;
  			} else if (i>j) corrR[i][j]=corr[(+idarr[j])][(+idarr[i])];
  		}
  		//console.log(corrR[i]);
  		corrR[i]=[corrR[i],i];
  	}

  	corrR.sort(compare);

  	for (var i=0;i<idarr.length; i++){
  		index[i]=corrR[i][1];
  		corrR[i]=corrR[i][0];
  		//console.log(corrR[i][pos[1]]);
  	}

  	 for (var i=0;i<idarr.length; i++){
  	 	var corrbuf=[];
  		for (var j=0;j<idarr.length; j++){
  			corrbuf[j]=corrR[i][index[j]];
  		}
  		corrR[i]=corrbuf;
  		//console.log(corrR[i][i]);
  	}

  	//console.log(pos);

  	function compare(a,b){
  		var num1=(+a[0][pos[1]]), num2=(+b[0][pos[1]]);
	if (num1 > num2) return -1;
	if (num1 < num2) return 1;
	return 0;}

	angleC=angleR(corrR,index);

	var axisR=[];
	var j=0;
	for (var i=0;i<corr.length;i++){
		axisR[i]=[];
		if (i==(+idarr[j])) {
			axisR[i][0]=Math.sin(angleC[j]);
			axisR[i][1]=Math.cos(angleC[j]);
			j++;
		} else {
			axisR[i][0]=0;
			axisR[i][1]=0;

		}
		console.log(axisR[i]);

	}

	var projectionR=[];

	for (var i=0;i<dataset.length;i++){
		n=0; m=0;

		for (var j=0;j<angleC.length;j++){
			var indj=+(idarr[j]);

			n +=(dataset[i][indj]*axisR[indj][0]);
			m +=(dataset[i][indj]*axisR[indj][1]);
		}
		projectionR[i]= [n,m];
	}

	return [axisR,projectionR];

}

//var M;
function angleR(corrR,index){
	var b=[];
	var vec=[];
	var leng=corrR.length;

	if (leng==1) return [0];
	if (leng==2) return [0,Math.acos(corrR[0][1])];

	for (var i=0; i<leng; i++){
		vec[i]=0;
		for (var j=0; j<leng; j++){
			vec[i] += (i>j) ? (Math.acos(corrR[i][j])) : (-Math.acos(corrR[i][j]))
		}
	}
	vec.shift();
	console.log(vec);
	for (var i=0; i<leng-1; i++){
		b[i]=[];
		for (var j=0; j<leng-1; j++){
			if (i==j) b[i][j]=leng-1;
			else b[i][j]=-1
		}
	}
	
	b=$M(b);
	b=b.inv();
	//console.log(b);
	vec=$M(vec);
	b=b.multiply(vec);

	console.log(b);

	var angleC=[];
	//M=b;

	angleC[index[0]]=0;
	
	for (var i=0; i<leng-1; i++){
		angleC[index[i+1]]=b.elements[i][0];
	}

	return angleC;
}
