/*! rader 21-08-2013 */
!function(a,b){var c=a.jQuery,d=function(a){return a=a||{},a.root=a.root||this,c=a.$||c,new e(a)},e=function(a){function d(){return!1}function e(a){A(document,"selectstart",d,a?"off":"on")}function f(a){for(var b=-1e4,c=0;c<a.length;c++)b<a[c]&&(b=a[c]);return b}function g(a){for(var b=1e4,c=0;c<a.length;c++)b>a[c]&&(b=a[c]);return b}function h(a,b){if(a.length!=b.length)return!1;for(D=0;D<a.length;D++)if(a[D]!==b[D])return!1;return!0}function i(a){return a>y&&(a=y),0>a&&(a=0),a}function j(c){return N[c]===b&&(N[c]=(c-a.start)/x*y),N[c]}function k(c){return O[c]===b&&(O[c]=c/y*x+a.start),O[c]}function l(b){var c=a.values[0],d=a.values[a.values.length-1];if(!a.values)return b;for(var e=0;a.pointsPos[e+1]&&!(b>=a.pointsPos[e]&&b<=a.pointsPos[e+1]);)e++;var f,g=a.pointsPos[e],h=a.pointsPos[e+1]||g,i=a.values[e],j=a.values[e+1]||i;return 0>=h-g&&(h=a.end,g=a.start),f="log"==a.scale?Math.exp((b-g)/(h-g)*(Math.log(j)-Math.log(i))+Math.log(i)):(b-g)/(h-g)*(j-i)+i,c>f?c:f>d?d:f}function m(b){var c=a.pointsPos[0],d=a.pointsPos[a.pointsPos.length-1];if(!a.pointsPos)return b;for(var e=0;a.values[e+1]&&!(b>=a.values[e]&&b<=a.values[e+1]);)e++;var f,g=a.values[e],h=a.values[e+1],i=a.pointsPos[e],j=a.pointsPos[e+1];return f="log"==a.scale?(Math.log(b)-Math.log(g))/(Math.log(h)-Math.log(g))*(j-i)+i:(b-g)/(h-g)*(j-i)+i,c>f?c:f>d?d:f}function n(b){for(var c,d,e=b,f=9999,g=0;g<a.pointsPos.length;g++)d=j(a.pointsPos[g]),c=Math.abs(d-b),f>c&&(e=d,f=c);return e}function o(b,c){var d,e,f,g=9999,h=b,k=n(b);if(f=Math.abs(k-b),f>a.stickingRadius)return b;for(var l=0;l<a.pointsPos.length;l++)d=j(a.pointsPos[l]),e=Math.abs(d-b),d*c>b*c&&g>e&&(g=e,h=d);return g<a.stickingRadius?h:g>=a.stickingRadius?(b=i(b-f*c+a.stickingRadius*c),Math.abs(h-b)<a.stickingRadius?h:b):void 0}function p(c,d,e){function f(a){return a+1*g}var g;if(e>I[c])g=1;else{if(!(e<I[c]))return!1;g=-1}if(e=i(e),c!=d&&(e=o(e,g)),xSticky=n(e),xSticky!==b&&xSticky!==e&&Math.abs(xSticky-e)<a.stickingRadius&&(!M&&a.transCls&&(B(E.track).addClass(a.transCls),M=setTimeout(function(){B(E.track).removeClass(a.transCls),M=b},500)),e=xSticky),I[f(d)]!==b&&(I[f(d)]-e<a.bumpRadius&&g>0||e-I[f(d)]<a.bumpRadius&&0>g)){var h=p(c,f(d),e+g*a.bumpRadius);e*g>(h-a.bumpRadius*g)*g&&(e=o(h-a.bumpRadius*g,-g))}I[d]=e;var j={};return j[F.start]=I[d]+"px",B(E.runners[d]).css(j),e}function q(b){var c,d=[];if(a.pointInRangeCls){for(c=0;c<K.length;c++)d[c]=K[c];for(c=0;c<E.points.length;c++)K[c]=j(a.pointsPos[c])>=I[0]&&j(a.pointsPos[c])<=I[I.length-1]?1:0;for(c=0;c<K.length;c++)(K[c]!=d[c]||b)&&(K[c]?B(E.points[c]).addClass(a.pointInRangeCls):B(E.points[c]).removeClass(a.pointInRangeCls))}}function r(a){q(a);var b={};b[F.start]=g(I)+"px",b[F.size]=f(I)-g(I)+"px",B(E.trackActive).css(b)}function s(a,b){if(a){var c,d=a.clientX-x0drag;for(c=H[G]+d,D=0;D<I.length;D++)J[D]=I[D];p(G,G,i(c))}(!h(I,J)||b)&&r(b)}function t(){var b=g(I),c=f(I),d=l(k(b)),e=l(k(c));if(a.collapseVals&&c-b<=a.bumpRadius+1){var h=n(b);0==h-b?e=d:d=e}return{minPos:b,maxPos:c,minVal:d,maxVal:e}}function u(){a.change&&a.change(t())}function v(){a.move&&a.move(t())}function w(){y=E.track[F.client],N=[],O=[];var b;for(D=0;D<a.pointsPos.length;D++)b={},b[F.start]=j(a.pointsPos[D])+"px",B(E.points[D]).css(b);for(D=0;D<a.runnersPos.length;D++)b={},I[D]=H[D]=j(a.runnersPos[D]),b[F.start]=I[D]+"px",B(E.runners[D]).css(b);var c=j(a.runnersPos[0]),d=j(a.runnersPos[a.runnersPos.length-1]);b={},b[F.start]=c+"px",b[F.size]=Math.abs(d-c)+"px",B(E.trackActive).css(b)}var x,y,z,A,B,C,D,E={},F={start:"left",client:"clientWidth",offset:"offsetWidth",size:"width"},G=-1,H=[],I=[],J=[],K=[];if(this.elements=E,this.params=a,A=a.event||function(a,b,d,e){c(a)[e||"on"](b,d)},B=a.dom||c,C=a.selector||c,E.track=a.root[0],E.trackActive=a.trackActive,E.points=a.points,E.runners=a.runners,z={stickingRadius:0,bumpRadius:E.runners[0][F.offset],points:[],start:0,end:10,pointsPos:[5],runnersPos:[]},a.pointsPos&&a.pointsPos.length&&(z.start=a.pointsPos[0],z.end=a.pointsPos[a.pointsPos.length-1]),a.runnersVal)for(D=0;D<a.runnersVal.length;D++)z.runnersPos[D]=m(a.runnersVal[D]);else z.runnersPos=[z.start,z.end];for(var L in z)a[L]===b&&(a[L]=z[L]);a.values||(a.values=a.pointsPos),x=Math.abs(a.end-a.start),a.runners.length!=E.runners.length&&console.error("params.runners.length !== elements.runners.length"),C||console.error("No selector engine found"),B||console.error("No dom utility found"),A||console.error("No event manager found");var M,N=[],O=[];for(D=0;D<a.runnersPos.length;D++)A(E.runners[D],"mousedown",function(a){return function(b){2!=b.button&&(b.preventDefault(),e(),G=a,console.log("n",a))}}(D));return w(),s(0,1),A(document,"mouseup blur",function(){if(-1!=G){for(var a=0;a<H.length;a++)H[a]=I[a];u(),e(1)}G=-1}),A(document,"mousedown",function(a){x0drag=a.clientX}),A(document,"mousemove",function(a){-1!=G&&(s(a,0,1),v())}),this.setPosition=function(a,b){var c=j(b);p(a,a,c),H[a]=I[a]=c,r(1)},this.setValue=function(a,b){var c=j(m(b));p(a,a,c),H[a]=I[a]=c,r(1)},this.invalidate=function(){w(),r(1),v()},this};c&&c.fn&&(c.fn.rader=d),a.rader=d}(window);