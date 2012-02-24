/*Devilia AJAX Library v4.0 by BS-Harou*/
window.AJAX = function(){
  var
    errors = [null,
      "Your browser doesn't support Ajax.",
      "AJAX is currently working, please try it again later",
      "AJAX - Wrong status",
      "Timeout reached, connection aborted"],
    response = function(text,XML){
      var tmp = {
        text:text,
        XML:XML,
        toString:function(){
          return this.text;
        }
      };
      return tmp;
    },
    error = function(number,text){
      var tmp = {
        number:number,
        text:text,
        toString:function(){
          return this.number;
        },
        valueOf:function(){
          return this.number;
        }
      };
      return tmp;
    },
    paramsFromObject = function(p){
      var result = "",i;
      for (i in p){
        if (p.hasOwnProperty(i)){
          result = result.concat(i,"=",window.encodeURIComponent(p[i]),"&");
        }
      }
      result = result.replace(/&$/,"");
      return result;
    },
    Front = function(){},
    sendAjax = function(ajaxUrl,ajaxParam,afterFunction,errorFunction,useFront){
      var t = this, xmlHttp = t.xmlHttp;
      if (xmlHttp){
        if (typeof useFront!=="boolean"){
          useFront = true;
        }
        if (xmlHttp.readyState === 0 || xmlHttp.readyState == 4){
          if (afterFunction && typeof afterFunction != "function"){afterFunction = null;}
          if (errorFunction && typeof errorFunction != "function"){errorFunction = null;}
          ajaxParam = (typeof ajaxParam == "object" && ajaxParam!==null)?paramsFromObject(ajaxParam):ajaxParam;
          xmlHttp.open((ajaxParam===null?"GET":"POST"), ajaxUrl, !!this.cn.async);
          xmlHttp.onreadystatechange = function(){
            ajaxLoader.call(t, afterFunction,errorFunction);
          };
          t.loading = true;
          if (ajaxParam===null){
            xmlHttp.send(null);
          } else {
            xmlHttp.setRequestHeader("Content-type", (this.cn.contentType || "application/x-www-form-urlencoded"));
            xmlHttp.setRequestHeader("Content-length", ajaxParam.length);
            xmlHttp.setRequestHeader("Connection", "close");
            xmlHttp.send(ajaxParam);
          }
        } else if (useFront){
          t.myFront.arr.push(arguments);
        } else if (errorFunction){
          errorFunction.call(this.rel, error(2,errors[2]));
        }
      } else if (errorFunction){
        errorFunction.call(this.rel, error(1,errors[1]));
      }
    },
    ajaxLoader = function(afterFunction,errorFunction){
      xmlHttp = this.xmlHttp;
      if (this.errorTimeout){
        window.clearTimeout(this.errorTimeout);
      }
      if(xmlHttp.readyState == 4){
        this.loading = false;
        if (xmlHttp.status == 200 || (xmlHttp.status === 0 && xmlHttp.responseText.length>0)){
          if (afterFunction){       
            afterFunction.call(this.rel, response(xmlHttp.responseText,xmlHttp.responseXML));
          }
        } else if (errorFunction){
          errorFunction.call(this.rel,error(3,errors[3]+": "+xmlHttp.status));
        }
        testFront.call(this);
      } else if (xmlHttp.readyState>0 && errorFunction && this.cn.timeout>0){
        var th = this; 
        this.errorTimeout = window.setTimeout(function(){
          afterTimeout.call(th,errorFunction);
        },this.cn.timeout);
      }
    },
    afterTimeout = function(er){
      xmlHttp = this.xmlHttp;
      if (er){
        er.call(this.rel, error(4,errors[4]));
      }
      xmlHttp.onreadystatechange = null;
      xmlHttp.abort();
      testFront.call(this);
    },
    clearFront = function() {
      f = this.myFront;
      f.arr = [];
      f.index = 0;
    },
    fullAbort = function() {
      clearFront.call(this);
      afterTimeout.call(this);
    },
    testFront = function(){
      f = this.myFront;
      if (f.arr[f.index]){
        sendAjax.apply(this,f.arr[f.index]);
        f.arr[f.index++] = null;
        if (!f.arr[f.index]) {
          f.arr = [];
          f.index = 0;
        }
      }
    }
  ;
  Front.prototype = {
    index:0,
    arr:[]
  };
  return {
    create:function(obj){
      /* PRIVATE */
      var all = {
        myFront:new Front(),
        rel:obj,
        errorTimeout:null,
        loading:false,
        xmlHttp:window.ActiveXObject?new window.ActiveXObject("Microsoft.XMLHTTP"):new window.XMLHttpRequest(),
        toString:function(){
          return "[object AJAXPrivate]";
        },
        cn: {
          timeout:10e3, 
          async:true,
          contentType:"application/x-www-form-urlencoded",
          getData:function(ajaxUrl,afterFunction,errorFunction,useFront){
            sendAjax.call(all,ajaxUrl,null,afterFunction,errorFunction,useFront);
          },
          postData:function(){ 
            sendAjax.apply(all,arguments);
          },
          toString:function(){
            return "[object AJAXConnection]";
          },
          isLoading:function(){
            return all.loading;
          },
          abort:function() {
            fullAbort.call(all);
          },
          clearFront:function() {
            clearFront.call(all);
          }
        }
      };
      /* PUBLIC */
      return all.cn;
    },
    getVersion:function(){
      return "4.0";
    }, 
    toString:function(){
      return "[object AJAX]";
    }
  };  
}();     