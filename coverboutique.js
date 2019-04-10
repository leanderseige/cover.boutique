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
        maxZoomLevel: 1.333
    };


    var jcache = {};
    var viewer = false;
    var canvas = false;
    var last_scrollrun=0;


    $(document).ready(function() {
      console.log("coverboutique waking up");

      // buildSharpenFilters();

      $("#impressum").hide();
      $("#settings").hide();

      $("#blur").slider({orientation: "horizontal",min: 0,max: 25,value: 0,slide: cb.filter,change: cb.filter});
      $("#sharpen").slider({orientation: "horizontal",min: 0,max: 5,value: 0,slide: cb.filter,change: cb.filter});
      $("#grayscale").slider({orientation: "horizontal",min: 0,max: 100,value: 0,slide: cb.filter,change: cb.filter});
      $("#brightness").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#contrast").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#rotate").slider({orientation: "horizontal",min: -180,max: 180,value: 0,slide: cb.filter,change: cb.filter});
      $("#saturate").slider({orientation: "horizontal",min: 0,max: 200,value: 100,slide: cb.filter,change: cb.filter});
      $("#sepia").slider({orientation: "horizontal",min: 0,max: 100,value: 0,slide: cb.filter,change: cb.filter});
      $("#invert").slider({orientation: "horizontal",min: 0,max: 100,value: 0,slide: cb.filter,change: cb.filter});

      // loadCollection("https://iiif.manducus.net/collections/0008/collection.json");
      // loadCollection("https://iiif.harvardartmuseums.org/collections/object?page=1");
      loadCollection("https://iiif.harvardartmuseums.org/collections/object?page=800");

      load_data();

      setTimeout(function() {in_scrollrun();},2000);
    })

    function loadDiscoImage(elem) {
      var service=elem.getAttribute("iiif_service");
      elem.setAttribute("src",service+"/full/400,/0/default.jpg");
    }

    coverboutique.prototype.discoClick = function(id) {
      // console.log("clicked: "+id);
      var elem=document.getElementById(id);
      var service=elem.getAttribute("iiif_service");
      // console.log("loading: "+service);
      loadOSD(service);
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
        if(rect.top < drect.height*3) {
          if(x[i].getAttribute('src') == "") {
            loadDiscoImage(x[i]);
          } else {
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
    }

    function getFilters() {
        var blur = $("#blur").slider("value");
        var grayscale = $("#grayscale").slider("value");
        var brightness = $("#brightness").slider("value");
        var contrast = $("#contrast").slider("value");
        var rotate = $("#rotate").slider("value");
        var invert = $("#invert").slider("value");
        var saturate = $("#saturate").slider("value");
        var sepia = $("#sepia").slider("value");
        var sharpen = $("#sharpen").slider("value");
        console.log("sharpen:"+sharpen)
        if(sharpen>0) {
            sharpen="url(#fsharpen" + sharpen + ")";
        } else {
            sharpen="";
        }
        console.log("sharpen:"+sharpen)
        return("blur(" + blur + "px)" + "brightness(" + brightness + "%)" + "grayscale(" + grayscale + "%)" + "hue-rotate(" + rotate + "deg)" + "contrast(" + contrast + "%)" + "invert(" + invert + "%)" + "saturate(" + saturate + "%)" + "sepia(" + sepia + "%)" + sharpen);
    }

    coverboutique.prototype.filter = function() {
      $("#osd").css("-webkit-filter", getFilters());
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

    function loadOSD(service) {
          canvas=service;
          $.getJSON(service + "/info.json", function(result) {
              // console.log(result);
              var setup = setup_template;
              setup.tileSources[0] = result;
              if (viewer) {
                  viewer.close();
                  document.getElementById('osd').innerHTML = "";
              }
              viewer = OpenSeadragon(setup);
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
      viewer.viewport.zoomTo(viewer.viewport.getZoom() * 1.05);
    }

    coverboutique.prototype.zoomOut = function() {
      viewer.viewport.zoomTo(viewer.viewport.getZoom() * 0.95);
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
        var rect = viewer.viewport.viewportToImageRectangle(viewer.viewport.getBounds());
        var flip = viewer.viewport.getFlip();
        var imag = canvas;

        var w = Math.round(rect.width);
        var h = Math.round(rect.height);

        var imgurl = get_permalink(rect, flip, imag, w, h);
        var img = document.createElement('img');
        img.crossOrigin = "Anonymous";

        var imgurl_mask = "http://localhost:8000/images/test2.png"
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
