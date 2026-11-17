/* Deterministic, periodic glaze cells. Both the studio preview and PBR renderer use the same surface. */
(function(){'use strict';var cache={};
function hash(x,y,s){var n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);}
var seeds={};function cell(x,y,cols,rows){var key=cols+':'+rows,table=seeds[key];if(!table){table=seeds[key]=new Float64Array(cols*rows*3);for(var ty=0;ty<rows;ty++)for(var tx=0;tx<cols;tx++){var ti=(ty*cols+tx)*3;table[ti]=hash(tx,ty,1)*.76;table[ti+1]=hash(tx,ty,2)*.76;table[ti+2]=hash(tx,ty,3);}}var best=1e12,second=1e12,cx=Math.floor(x),cy=Math.floor(y),ox,oy,otherX,otherY,tone,id;for(var j=cy-2;j<=cy+2;j++)for(var i=cx-2;i<=cx+2;i++){var ix=(i%cols+cols)%cols,iy=(j%rows+rows)%rows,at=(iy*cols+ix)*3,px=i+.12+table[at],py=j+.12+table[at+1],dd=(x-px)*(x-px)+(y-py)*(y-py);if(dd<best){second=best;otherX=ox;otherY=oy;best=dd;ox=px;oy=py;tone=table[at+2];id=iy*cols+ix;}else if(dd<second){second=dd;otherX=px;otherY=py;}}var gap=Math.sqrt(Math.pow(ox-otherX,2)+Math.pow(oy-otherY,2));return{edge:(second-best)/(2*Math.max(.001,gap)),tone:tone,id:id,x:x-ox,y:y-oy};}
function create(size,kind){var key=size+':'+kind;if(cache[key])return cache[key];var color=document.createElement('canvas'),height=document.createElement('canvas'),rough=document.createElement('canvas');color.width=color.height=height.width=height.height=rough.width=rough.height=size;var cx=color.getContext('2d'),hx=height.getContext('2d'),rx=rough.getContext('2d'),ci=cx.createImageData(size,size),hi=hx.createImageData(size,size),ri=rx.createImageData(size,size),flake=false,cols=flake?12:9,rows=flake?15:11;
for(var y=0;y<size;y++)for(var x=0;x<size;x++){var v=cell(x/size*cols,y/size*rows,cols,rows),line=Math.exp(-Math.pow(v.edge/(flake?.015:.008),2)),fine=0;if(!flake){var small=cell(x/size*27,y/size*31,27,31);fine=.3*Math.exp(-Math.pow(small.edge/.008,2));}var noise=hash(x,y,9)-.5,gain=flake?.84+v.tone*.25+Math.min(.045,(v.x*.5-v.y*.25)*.07):.97+v.tone*.04;
var at=(y*size+x)*4;ci.data[at]=Math.max(0,Math.min(255,255*(gain-line*.24-fine*.1)));ci.data[at+1]=Math.max(0,Math.min(255,255*(gain-line*.2-fine*.08)));ci.data[at+2]=Math.max(0,Math.min(255,255*(gain-line*.15-fine*.06)));ci.data[at+3]=255;var h=flake?140+(v.tone-.5)*18+v.x*8-v.y*5-line*30:155-line*56-fine*22;hi.data[at]=hi.data[at+1]=hi.data[at+2]=h+noise;hi.data[at+3]=255;ri.data[at]=ri.data[at+1]=ri.data[at+2]=flake?88+v.tone*25+line*28:80+line*40;ri.data[at+3]=255;}
cx.putImageData(ci,0,0);hx.putImageData(hi,0,0);rx.putImageData(ri,0,0);return cache[key]={color:color,height:height,roughness:rough};}
// A fine, irregular network under a continuous glaze, not deep cuts in the clay.
function createStudio(size,kind){
  if(kind!=='crackle')return create(size,kind);
  var key=size+':'+kind+':studio-crackle-v3';if(cache[key])return cache[key];
  var color=document.createElement('canvas'),height=document.createElement('canvas'),rough=document.createElement('canvas');
  color.width=color.height=height.width=height.height=rough.width=rough.height=size;
  var cx=color.getContext('2d'),hx=height.getContext('2d'),rx=rough.getContext('2d'),ci=cx.createImageData(size,size),hi=hx.createImageData(size,size),ri=rx.createImageData(size,size),cols=23,rows=27;
  // Periodic low-frequency warping avoids straight, regularly spaced cell rows.
  var ux=new Float64Array(size),uy=new Float64Array(size),vx=new Float64Array(size),vy=new Float64Array(size);
  for(var p=0;p<size;p++){var a=p/size*Math.PI*2;ux[p]=.22*Math.sin(a*3)+.10*Math.sin(a*7+.6);uy[p]=.19*Math.sin(a*4+.8);vx[p]=.20*Math.sin(a*3+.4);vy[p]=.18*Math.sin(a*5)+.08*Math.sin(a*9+.2);}
  for(var y=0;y<size;y++)for(var x=0;x<size;x++){
    var u=x/size,v=y/size,wx=ux[x]+vx[y],wy=uy[x]+vy[y],large=cell(u*cols+wx,v*rows+wy,cols,rows),small=cell(u*57+wx*1.7,v*61+wy*1.7,57,61);
    var primary=Math.exp(-Math.pow(large.edge/.026,2)),secondary=Math.exp(-Math.pow(small.edge/.023,2));
    // Secondary fractures grow in some cells and stay faint in others.
    var growth=.22+.63*large.tone,edge=primary*(.80+.20*small.tone)+secondary*growth*.48;
    var facet=.905+.085*large.tone+(small.tone-.5)*.025;
    var shoulder=.028*Math.exp(-Math.pow((large.edge-.062)/.041,2))*(.35+.65*large.tone);
    var at=(y*size+x)*4,gain=facet+shoulder;
    ci.data[at]=Math.max(0,Math.min(255,255*(gain-edge*.24)));
    ci.data[at+1]=Math.max(0,Math.min(255,255*(gain-edge*.205)));
    ci.data[at+2]=Math.max(0,Math.min(255,255*(gain-edge*.16)));ci.data[at+3]=255;
    // Tiny under-glaze facets affect reflected light without changing geometry.
    var h=153+(large.tone-.5)*6+large.x*(large.tone-.5)*3+large.y*(small.tone-.5)*2-primary*10-secondary*growth*4;
    hi.data[at]=hi.data[at+1]=hi.data[at+2]=h;hi.data[at+3]=255;
    var r=204+large.tone*18+primary*19+secondary*growth*9;
    ri.data[at]=ri.data[at+1]=ri.data[at+2]=r;ri.data[at+3]=255;
  }
  cx.putImageData(ci,0,0);hx.putImageData(hi,0,0);rx.putImageData(ri,0,0);
  return cache[key]={color:color,height:height,roughness:rough};
}

window.TodakCeramicSurface={create:create,createStudio:createStudio};
})();
