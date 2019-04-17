function coverboutique(config) {

    var setup_template = {
        id: "osd",
        preserveViewport: true,
        sequenceMode: false,
        showNavigationControl: false,
        crossOriginPolicy: "Anonymous",
        zoomPerScroll: 1,
        zoomPerSecond: 1,
        prefixUrl: "openseadragon/images/",
        tileSources: [],
        homeFillsViewer: true,
        maxZoomLevel: 10
    };


    var jcache = {};
    var viewer = {};
    var filter = {};
    var canvas = false;
    var last_scrollrun=0;
    var phones = false;
    var osdid = "osd";


    $(document).ready(function() {
      console.log("coverboutique waking up");

      viewer['osd'] = false;
      viewer['osdo'] = false;
      filter['osd'] = {};
      filter['osdo'] = {};

      $("#impressum").hide();
      $("#settings").hide();

      filter['osd']['brightness']=100;
      filter['osd']['contrast']=100;
      filter['osd']['rotate']=0;
      filter['osd']['saturate']=100;
      filter['osd']['sepia']=0;
      filter['osd']['invert']=0;
      filter['osdo']=filter['osd'];

      $("#dbrightness").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#dcontrast").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#drotate").slider({orientation: "horizontal",min: -180,max: 180,value: 0,slide: cb.filter,change: cb.filter});
      $("#dsaturate").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#dsepia").slider({orientation: "horizontal",min: 0,max: 100,value: 0,slide: cb.filter,change: cb.filter});
      $("#dinvert").slider({orientation: "horizontal",min: 0,max: 100,value: 0,slide: cb.filter,change: cb.filter});

      $("#mbrightness").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#mcontrast").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#mrotate").slider({orientation: "horizontal",min: -180,max: 180,value: 0,slide: cb.filter,change: cb.filter});
      $("#msaturate").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#msepia").slider({orientation: "horizontal",min: 0,max: 100,value: 0,slide: cb.filter,change: cb.filter});
      $("#minvert").slider({orientation: "horizontal",min: 0,max: 100,value: 0,slide: cb.filter,change: cb.filter});

      load_data();
      loadBrand();

    })

    function loadDiscoImage(elem) {
      var service=elem.getAttribute("iiif_service");
      elem.setAttribute("src",service+"/full/400,/0/default.jpg");
    }

    function clearDiscoImage(elem) {
      var service=elem.getAttribute("iiif_service");
      elem.setAttribute("src","");
    }

    coverboutique.prototype.discoClick = function(id) {
      // console.log("clicked: "+id);
      var elem=document.getElementById(id);
      var service=elem.getAttribute("iiif_service");
      // console.log("loading: "+service);
      loadOSD(service);
    }

    coverboutique.prototype.selectLayer = function () {
        $("#"+osdid).css("pointer-events", "none");
        var ls=document.getElementById("layer_select");
        osdid = ls.value;
        $("#"+osdid).css("pointer-events", "all");
        $("#osdo").css("opacity", "0.5");
    }

    coverboutique.prototype.selectCollection = function () {
      console.log("select");
      var ds=document.getElementById("disco_select");
      var di=document.getElementById("discovery-items");
      console.log(ds.value);
      di.innerHTML="";
      loadCollection(ds.value);
    }

    coverboutique.prototype.scrollrun = function() {
      in_scrollrun();
    }

    function in_scrollrun() {
      var now = Math.floor(Date.now());
      if(now<last_scrollrun+1000 && last_scrollrun>0) {
        return;
      }
      last_scrollrun=now;
      console.log("scrollrun");
      var delem = document.getElementById("scroll");
      var drect = delem.getBoundingClientRect();
      // console.log(drect);
      // console.log("scroll run...");
      var x = document.getElementsByClassName("discoimage");
      for (var i = 0; i < x.length; i++) {
        var rect = x[i].getBoundingClientRect();
        // console.log(rect.top);
        if(rect.top>0 && rect.top<drect.height*3) {
          if(x[i].getAttribute('src') == "") {
            loadDiscoImage(x[i]);
          }
        } else if(rect.top<-drect.height*2) {
            if(x[i].getAttribute('src') == "") {
              loadDiscoImage(x[i]);
            }
        }
      }
    }

    function loadCollection(curl) {
      // console.log("loading collection ..."+curl);
      $.getJSON(curl, function(result) {
        for(var m in result['manifests']) {
          var murl=result['manifests'][m]['@id'];
          // console.log("loading manifest ..."+murl);
          $.getJSON(murl, function(result) {
            var label=result['label'];
            var murl=result['@id'];
            var service = result['sequences'][0]['canvases'][0]['images'][0]['resource']['service']['@id'];
            var html='<p>'+label;
            var bid = b64EncodeUnicode(murl);
            html+='<img class="discoimage" src="" iiif_service="'+service+'" id="'+bid+'" onclick="cb.discoClick(\''+bid+'\')"; />';
            html+='</p>';
            $("#discovery-items").append(html);
          });
        }
      });
      setTimeout(function() {in_scrollrun();},3000);
    }

    /* get filter values from sliders */
    function getFilters() {

        var brightness = $("#dbrightness").slider("value");
        var contrast = $("#dcontrast").slider("value");
        var rotate = $("#drotate").slider("value");
        var invert = $("#dinvert").slider("value");
        var saturate = $("#dsaturate").slider("value");
        var sepia = $("#dsepia").slider("value");

        return("brightness(" + brightness + "%)" + "hue-rotate(" + rotate + "deg)" + "contrast(" + contrast + "%)" + "invert(" + invert + "%)" + "saturate(" + saturate + "%)" + "sepia(" + sepia + "%)");
    }

    /* set filter values in sliders */
    function setFilters() {
    }

    coverboutique.prototype.filter = function() {
        var map={'m':'d','d':'m'};
        var param=this.id.substring(1,100);
        var oid = map[this.id.substring(0,1)]+param;
        var value = $('#'+this.id).slider("value");
        filter[osdid][param]=value;
        $('#'+oid).slider({'slide':'','change':''});
        $('#'+oid).slider({'value':value});
        $('#'+oid).slider({'slide':cb.filter,'change':cb.filter});
        $("#"+osdid).css("-webkit-filter", getFilters());
    }

    coverboutique.prototype.recalcVH = function() {
        // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
        let vh = window.innerHeight * 0.01;
        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        window.scrollTo(0,1);
    }

    async function load_data() {
        manifest_uri = "https://iiif.manducus.net/manifests/0009/e6a31cbb9aa05946dae080765091c765a5b57bf6/manifest.json";
        $('#loader_msg').html("");
        console.log("boarding completed");
        cb.hide('#splash');
        init_display();
    }

    function init_display(result) {
      console.log("hi");
      // console.log(manifest_uri);
      // loadOSD();
      $("#splash").hide();
      $("#loader").hide();
    }

    function loadBrand() {
        $.getJSON("phones.json", function(result) {
            phones=result;
            var bsel = document.getElementById("brand_select");
            for(var b in result) {
                var brand = document.createElement("option");
                brand.setAttribute("value",b);
                brand.innerHTML=b;
                bsel.appendChild(brand);
            }
            cb.selectBrand();
            cb.selectModel();
        });
    }

    coverboutique.prototype.selectBrand = function() {
        if(phones) {
            var bsel=document.getElementById("brand_select");
            var msel=document.getElementById("model_select");
            msel.innerHTML="";
            var first=1;
            for(var m in phones[bsel.value]) {
                var me = document.createElement("option");
                me.setAttribute("value",phones[bsel.value][m]['image']);
                me.innerHTML=phones[bsel.value][m]['model'];
                if(first==1) {
                    first=0;
                    me.setAttribute("selected","selected");
                }
                msel.appendChild(me);
            }
        }
    }

    coverboutique.prototype.selectModel = function() {
        var msel=document.getElementById("model_select");
        var mask=document.getElementById("mask");
        mask.style.backgroundImage = "url('/images/"+msel.value+"')";
    }

    function loadOSD(service) {
          canvas=service;
          $.getJSON(service + "/info.json", function(result) {
              // console.log(result);
              var setup = setup_template;
              setup.id = osdid;
              setup.tileSources[0] = result;
              if (viewer[osdid]) {
                  viewer[osdid].close();
                  document.getElementById(osdid).innerHTML = "";
              }
              viewer[osdid] = OpenSeadragon(setup);
          });

    }



    async function get_cached_url(url) {
      var key = b64EncodeUnicode(url);
      if(key in jcache) {
        return jcache[key];
      }
      const mresp = await fetch(url);
      const mresu = await mresp.json();
      jcache[key] = mresu;
      return mresu;
    }

    function b64EncodeUnicode(str) {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
          return String.fromCharCode('0x' + p1);
        }));
    }

    coverboutique.prototype.show = function(id) {
      $(id).fadeIn(500,function() {
        $(id).show();
      });
    }

    coverboutique.prototype.hide = function(id) {
      $(id).fadeOut(500,function() {
        $(id).hide();
      });
    }

    coverboutique.prototype.zoomIn = function() {
      viewer[osdid].viewport.zoomTo(viewer[osdid].viewport.getZoom() * 1.05);
    }

    coverboutique.prototype.zoomOut = function() {
      viewer[osdid].viewport.zoomTo(viewer[osdid].viewport.getZoom() * 0.95);
    }

/* GENERATE OUTPUT PDF */

    coverboutique.prototype.launch_download = function() {
        this.create_image();
    }

    coverboutique.prototype.create_image = function() {
        var deleteme = document.getElementById('deleteme');
        if (deleteme) {
            deleteme.parentNode.removeChild(deleteme);
        }

        console.log("start");
        var rect = viewer[osdid].viewport.viewportToImageRectangle(viewer[osdid].viewport.getBounds());
        var flip = viewer[osdid].viewport.getFlip();
        var imag = canvas;

        var w = Math.round(rect.width);
        var h = Math.round(rect.height);

        var imgurl = get_permalink(rect, flip, imag, w, h);
        var img = document.createElement('img');
        img.crossOrigin = "Anonymous";

        // var imgurl_mask = "http://localhost:8000/images/test2.png";
        var imgurl_mask = "http://localhost:8000/images/Samsung-J5_2017.png";
        var img_mask = document.createElement('img');
        img_mask.crossOrigin = "Anonymous";

        console.log("loading "+imgurl);
        img.onload = function() {
            console.log("loading "+imgurl_mask);
            img_mask.onload = function() {
                create_image_compose(img, img_mask);
            }
            img_mask.src=imgurl_mask;
        }
        img.src=imgurl;
    }

    function create_image_compose(img, img_mask) {
        var dcanvas = document.createElement('canvas');
        dcanvas.id = "delme";
        var w = img_mask.width;
        var h = img_mask.height;

        dcanvas.width = w;
        dcanvas.height = h;
        dcanvas.crossOrigin = "Anonymous";

        console.log("wxh="+w+" + "+h);

        var dctx = dcanvas.getContext("2d");
        dctx.crossOrigin = "Anonymous";
        dctx.drawImage(img, 0, 0, dcanvas.width, dcanvas.height);
        dctx.filter = getFilters();
        dctx.drawImage(dcanvas, 0, 0, w, h);
        dctx.filter = "none";
        dctx.drawImage(img_mask, 0, 0, dcanvas.width, dcanvas.height);

        var ms = (new Date).getTime();
        var fn = "cover.boutique" + ms.toString() + ".jpg";

        var data = dcanvas.toDataURL("image/jpeg", 1.0);
        wrapPDF(data,dcanvas.width,dcanvas.height);
    }

    function wrapPDF(data,w,h) {
      var doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', putOnlyUsedFonts:true });
      var c = 20;
      doc.setFontSize(16);
      doc.setFontType("bold");
      doc.text(30, c, 'COVER.BOUTIQUE'); c+=8;
      doc.setFontType("normal");
      doc.setFontSize(10);
      doc.setTextColor(127,127,127);
      doc.textWithLink('https://cover.boutique', 30, c, { url: 'https://cover.boutique' }); c+=12;
      doc.setTextColor(0,0,0);
      // doc.addPage();
      doc.text(30, c, "Composed Image: CC-BY-SA 4.0");
      c+=6;
      doc.addImage(data, 'JPEG', 30, c, w*25.4/600, h*25.4/600);
      var ms = (new Date).getTime();
      doc.save("cover.boutique."+ ms.toString() +".pdf");
      $("#loader").hide();
      $("#splash").hide();
      console.log("finished image");
    }

    function get_permalink(vrect, vflip, vimag, w, h) {
        var url = vimag;
        url = url + "/" + Math.floor(vrect.x) + "," + Math.floor(vrect.y) + "," + Math.ceil(vrect.width) + "," + Math.ceil(vrect.height + 1);
        url = url + "/" + w + "," + h + "/";
        if (vflip) {
            url = url + "!";
        }
        url = url + "0/default.jpg";
        return url;
    }

    function buildSharpenFilters() {
        var svg = document.createElement('svg');
        svg.width=0;
        svg.height=0;
        var defs = document.createElement('defs');
        svg.appendChild(defs);
        var filter = {};
        var convo = {};
        for(i=1;i<10;i=i+2) {
            filter[i] = document.createElement('filter');
            filter[i].id = "fsharpen"+i;
            convo[i] = document.createElement('feConvolveMatrix');
            convo[i].setAttribute("order","3 3");
            convo[i].setAttribute("preserveAlpha","true");
            convo[i].setAttribute("kernelMatrix","0 -."+i+" 0 -."+i+" 5 -."+i+" 0 -."+i+" 0");
            filter[i].appendChild(convo[i]);
            defs.appendChild(filter[i]);
        }
        document.body.appendChild(svg);
        console.log(svg);
    }

}
