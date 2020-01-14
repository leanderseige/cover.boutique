function coverboutique(config) {

  var setup_template = {
    id: false,
    preserveViewport: false,
    sequenceMode: false,
    showNavigationControl: false,
    crossOriginPolicy: "Anonymous",
    zoomPerScroll: 1,
    zoomPerSecond: 1,
    prefixUrl: "openseadragon/images/",
    tileSources: [],
    homeFillsViewer: false,
    maxZoomLevelRatio: 1000,
    minZoomLevelRatio: 0.001,
    maxZoomImageRatio: 1000,
    minZoomImageRatio: 0.001,
    visibilityRatio: 0.05,

  };


  var jcache = {};
  var viewer = {};
  var filter = {};
  var canvas = false;
  var last_scrollrun = 0;
  var phones = false;
  var osdid = "osd";
  var discoCountDown = 0;
  var mobile_mode = false;
  var lock_filters = false;
  var lock_scrollrun = false;
  var last_scrollpos = 0;
  var mask_url = false;
  var src_url = {};
  var src_type = {};
  var meta_attribution = {};
  var meta_label = {};
  var current_id = {};
  var manifests = {};
  var current_splash = false;
  var gfx_mode = "css";

  $(document).ready(function() {
    console.log("coverboutique waking up");

    viewer['osd'] = false;
    viewer['osdo'] = false;
    src_url['osd'] = false;
    src_url['osdo'] = false;
    src_type['osd']="iiif";
    src_type['osdo']="iiif";
    filter['osd'] = {};
    filter['osdo'] = {};

    $("#impressum").hide();
    $("#settings").hide();

    setFilterDefaults('osd');
    setFilterDefaults('osdo');

    $("#fbrightness").slider({
      orientation: "horizontal",
      min: 0,
      max: 200,
      value: 100,
      slide: cb.filter,
      change: cb.filter
    });
    $("#fcontrast").slider({
      orientation: "horizontal",
      min: 0,
      max: 200,
      value: 100,
      slide: cb.filter,
      change: cb.filter
    });
    $("#fhue").slider({
      orientation: "horizontal",
      min: -180,
      max: 180,
      value: 0,
      slide: cb.filter,
      change: cb.filter
    });
    $("#fsaturate").slider({
      orientation: "horizontal",
      min: 0,
      max: 200,
      value: 100,
      slide: cb.filter,
      change: cb.filter
    });
    $("#fsepia").slider({
      orientation: "horizontal",
      min: 0,
      max: 100,
      value: 0,
      slide: cb.filter,
      change: cb.filter
    });
    $("#fopacity").slider({
      orientation: "horizontal",
      min: 0,
      max: 100,
      value: 100,
      slide: cb.filter,
      change: cb.filter
    });

    loadBrand();
    cb.selectCollection();

    var ua = navigator.userAgent.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i),
      browser;
    if (navigator.userAgent.match(/Edge/i) || navigator.userAgent.match(/Trident.*rv[ :]*11\./i)) {
      browser = "msie";
    } else {
      browser = ua[1].toLowerCase();
    }

    switch (browser) {
      case 'safari':
      case 'msie':
      case 'opera':
        console.log("incompatible browser detected, switching gfx mode");
        showSplash('splash_info');
        gfx_mode = "cbf";
        break;
      default:
        break;
    }


  })

  coverboutique.prototype.discoClick = function(id) {
    // console.log("clicked: "+id);
    // var elem=document.getElementById(id);
    // var service=elem.getAttribute("iiif_service");
    // console.log("loading: "+service);
    if (mobile_mode) {
      hideDiscovery();
    }
    loadOSD(id);
  }

  coverboutique.prototype.selectCollection = function() {
    var scroll = document.getElementById("scroll");
    scroll.scrollTop = 0;
    scroll.scrollLeft = 0;
    console.log("select");
    var ds = document.getElementById("disco_select");
    var di = document.getElementById("discovery-items");
    console.log(ds.value);
    if (ds.value == "IIIF") {
      if (mobile_mode) {
        hideDiscovery();
      }
      showSplash('splash_addiiif');
    } else if (ds.value == "Local") {
      if (mobile_mode) {
        hideDiscovery();
      }
      showSplash('splash_addlocal');
    } else {
      di.innerHTML = "";
      var url = ds.value;
      loadIIIFResource(url);
    }
  }

  coverboutique.prototype.addLocalResource = async function() {
    var file = document.getElementById('addlocal_file').files[0];
    console.log(file['name']);

    var reader = new FileReader();
    if (file) {
      var data=URL.createObjectURL(file); // reader.readAsDataURL(file);
      var elem = document.getElementById(osdid);
      var setup = setup_template;
      setup.id = osdid;
      setup.tileSources[0] = {
        type: "image",
        url: data
      };
      if (viewer[osdid]) {
        viewer[osdid].close();
        document.getElementById(osdid).innerHTML = "";
      }
      viewer[osdid] = OpenSeadragon(setup);
      src_type[osdid]="local";
      src_url[osdid]=data;
      setFilterDefaults(osdid);
      setFilters();
      var bid=file['name'];
      current_id[osdid]=bid;
      manifests[bid] = "";
      meta_label[bid] = "" + file['name'];
      meta_attribution[bid] = "unkown, user upload";
    }
    hideSplash();
    $("#disco_select").val($("#disco_select option:first").val());
  }

  coverboutique.prototype.addIIIFResource = async function() {
    var uri = $('#addiiif_uri').val();
    // var label = $('#addiiif_label').val();
    var option = document.createElement("option");
    var select = document.getElementById("disco_select");

    var j = await get_cached_url(uri);
    label = j['label'];

    option.setAttribute("value", uri);
    option.innerHTML = label;
    select.appendChild(option);
    $('#disco_select').val(uri);
    cb.selectCollection();
    hideSplash();
  }

  coverboutique.prototype.selectMode = function() {
    var ms = document.getElementById("fmode_select");
    var v = ms.value;
    var e = document.getElementById("osdo");
    console.log("setting osdo to: " + v);
    document.getElementById("osdo").style["mix-blend-mode"] = v;
    document.getElementById("osdo").firstChild.style["mix-blend-mode"] = v; // HACK for Safari
  }

  coverboutique.prototype.scrollrun = function() {
    scrollrun();
  }

  function scrollrun() {
    if (lock_scrollrun == true) {
      return;
    }
    lock_scrollrun = true;
    var now = Math.floor(Date.now());
    if (now < last_scrollrun + 500 && last_scrollrun > 0) {
      lock_scrollrun = false;
      return;
    }
    last_scrollrun = now;
    console.log("scrollrun");
    var delem = document.getElementById("scroll");
    scrollpos = delem.scrollTop;
    var drect = delem.getBoundingClientRect();

    var x = document.getElementsByClassName("discoimage");
    for (var i = 0; i < x.length; i++) {
      var rect = x[i].getBoundingClientRect();
      if (rect.top > 0 && rect.top < drect.height * 4) {
        if (x[i].getAttribute('src') == "") {
          loadDiscoImage(x[i]);
        }
      } else if (rect.top < -drect.height * 4) {
        if (x[i].getAttribute('src') == "") {
          loadDiscoImage(x[i]);
          changed = true;
        }
      }
    }
    lock_scrollrun = false;
    if (scrollpos != last_scrollpos) {
      setTimeout(function() {
        scrollrun();
      }, 2000);
      last_scrollpos = scrollpos;
    }
  }

  async function loadIIIFResource(url) {
    // $.getJSON(curl, function(result) {
    var result = await get_cached_url(url);
    discoCountDown = 4;
    if (result['@type'] == "sc:Collection") {
      for (var m in result['manifests']) {
        var murl = result['manifests'][m]['@id'];
        var label = result['manifests'][m]['label'];
        var bid = b64EncodeUnicode(murl);
        manifests[bid] = murl;
        var html = '<p class="discoparagraph">' + label + '<br />';
        html += '<img class="discoimage" src="" iiif_type="sc:Manifest" iiif_service="" iiif_manifest="' + murl + '" id="' + bid + '" onclick="cb.discoClick(\'' + bid + '\')"; />';
        html += '<span class="small" id="attr_' + bid + '"></span>';
        html += '</p>';
        $("#discovery-items").append(html);
        if (discoCountDown > 0) {
          discoCountDown--;
          loadDiscoImage(document.getElementById(bid));
        }
      }
    } else if (result['@type'] == "sc:Manifest") {
      for (var c in result['sequences'][0]['canvases']) {
        var curl = result['sequences'][0]['canvases'][c]['@id'];
        var label = result['sequences'][0]['canvases'][c]['label'];
        var service = result['sequences'][0]['canvases'][c]['images'][0]['resource']['service']['@id'];
        var bid = b64EncodeUnicode(curl);
        manifests[bid] = result['@id'];
        meta_label[bid] = "" + result['label'];
        meta_attribution[bid] = getAL(result);
        var html = '<p class="discoparagraph">' + label + '<br />';
        html += '<img class="discoimage" src="" iiif_type="sc:Canvas" iiif_service="' + service + '" id="' + bid + '" onclick="cb.discoClick(\'' + bid + '\')"; />';
        html += '<span class="small" id="attr_' + bid + '"></span>';
        html += '</p>';
        $("#discovery-items").append(html);
        if (discoCountDown > 0) {
          discoCountDown--;
          loadDiscoImage(document.getElementById(bid));
        }
      }
    }
    scrollrun();
    // });
  }

  function getAL(j) {
    var ret = "";
    if (j['attribution']) {
      ret += "Attribution: " + j['attribution'];
    }
    if (j['license']) {
      if (ret.length > 0) ret += "; ";
      ret += "License: " + j['license'];
    }
    return (ret);
  }

  async function setDiscoThumb(elem) {
    var service = elem.getAttribute("iiif_service");
    // $.getJSON(service+"/info.json", function(result) {
    var result = await get_cached_url(service + "/info.json");
    if (result['profile'][0] == "http://iiif.io/api/image/2/level0.json") {
      elem.setAttribute("src", "images/level0.png");
      elem.setAttribute("alt", "This image is not compliant.");
      return;
    }
    var tw = 999999;
    for (x in result['sizes']) {
      // console.log(result['sizes'][x]['width']+" vs "+tw);
      if (result['sizes'][x]['width'] > 400 && result['sizes'][x]['width'] < tw) {
        tw = result['sizes'][x]['width'];
      }
    }
    elem.setAttribute("src", service + "/full/" + (tw == 999999 ? 400 : tw) + ",/0/default.jpg");
    //set attribution
    var bid = elem.getAttribute("id");
    console.log('attr_' + bid);
    var span = document.getElementById('attr_' + bid);
    span.innerHTML = meta_attribution[bid];
    // });
  }

  async function loadDiscoImage(elem) {
    var type = elem.getAttribute("iiif_type");
    if (type == "sc:Manifest") {
      var murl = elem.getAttribute("iiif_manifest");
      // $.getJSON(murl, function(result) {
      var result = await get_cached_url(murl);
      var bid = elem.getAttribute("id");
      meta_label[bid] = result['label'];
      meta_attribution[bid] = getAL(result);
      var service = result['sequences'][0]['canvases'][0]['images'][0]['resource']['service']['@id'];
      elem.setAttribute("iiif_service", service);
      setDiscoThumb(elem);
      // });
    } else if (type == "sc:Canvas") {
      setDiscoThumb(elem);
    }
  }

  function clearDiscoImage(elem) {
    elem.setAttribute("src", "");
  }

  coverboutique.prototype.selectLayer = function() {
    $("#" + osdid).css("pointer-events", "none");
    getFilters();
    osdid = $("#layer_select").val();
    setFilters();
    $("#" + osdid).css("pointer-events", "all");
    if (osdid == 'osd') {
      $('#overlay_opacity').css("display", "none");
      $('#overlay_mode').css("display", "none");
    } else {
      $('#overlay_opacity').css("display", "inline-block");
      $('#overlay_mode').css("display", "inline-block");
    }
  }

  /* get filter values from sliders */
  function getCssFilters(id) {
    return (
      "brightness(" + filter[id]['brightness'] + "%) " +
      "hue-rotate(" + filter[id]['hue'] + "deg) " +
      "contrast(" + filter[id]['contrast'] + "%) " +
      "saturate(" + filter[id]['saturate'] + "%) " +
      "sepia(" + filter[id]['sepia'] + "%) " +
      "opacity(" + filter[id]['opacity'] + "%) "
    );
  }

  /* set filter values in sliders */

  function getFilters() {
    if (lock_filters == false) {
      for (var f in filter[osdid]) {
        filter[osdid][f] = $('#f' + f).slider("value");
      }
    }
  }

  function setFilters() {
    lock_filters = true;
    for (var f in filter[osdid]) {
      $('#f' + f).slider("value", filter[osdid][f]);
    }
    lock_filters = false;
  }

  function setFilterDefaults(id) {
    filter[id]['brightness'] = 100;
    filter[id]['contrast'] = 100;
    filter[id]['hue'] = 0;
    filter[id]['saturate'] = 100;
    filter[id]['sepia'] = 0;
    if (id == 'osdo') {
      filter[id]['opacity'] = 75;
      $("#fmode_select").val("multiply");
    } else {
      filter[id]['opacity'] = 100;
    }
  }

  coverboutique.prototype.resetFilters = function() {
    resetFilters();
  }

  function resetFilters() {
    setFilterDefaults(osdid);
    setFilters();
  }

  coverboutique.prototype.filter = function() {
    getFilters(osdid);
    $("#" + osdid).css("-webkit-filter", getCssFilters(osdid));
  }

  coverboutique.prototype.recalcVH = function() {
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.scrollTo(0, 1);
  }

  function loadBrand() {
    $.getJSON("phones.json", function(result) {
      phones = result;
      var bsel = document.getElementById("brand_select");
      for (var b in result) {
        var brand = document.createElement("option");
        brand.setAttribute("value", b);
        brand.innerHTML = b;
        bsel.appendChild(brand);
      }
      cb.selectBrand();
      cb.selectModel();
    });
  }

  coverboutique.prototype.selectBrand = function() {
    if (phones) {
      var bsel = document.getElementById("brand_select");
      var msel = document.getElementById("model_select");
      msel.innerHTML = "";
      var first = 1;
      for (var m in phones[bsel.value]) {
        var me = document.createElement("option");
        me.setAttribute("value", phones[bsel.value][m]['image']);
        me.innerHTML = phones[bsel.value][m]['model'];
        if (first == 1) {
          first = 0;
          me.setAttribute("selected", "selected");
        }
        msel.appendChild(me);
      }
    }
  }

  coverboutique.prototype.selectModel = function() {
    var msel = document.getElementById("model_select");
    var mask = document.getElementById("mask");
    mask_url = "/images/" + msel.value;
    mask.style.backgroundImage = "url('" + mask_url + "')";
  }

  coverboutique.prototype.closeOSD = function() {
    if (viewer[osdid]) {
      viewer[osdid].close();
      document.getElementById(osdid).innerHTML = "";
      viewer[osdid] = false;
    }
  }

  async function loadOSD(id) {
    var elem = document.getElementById(id);
    var service = elem.getAttribute("iiif_service");
    canvas = service;
    src_url[osdid] = service;
    src_type[osdid]="iiif";
    // $.getJSON(service + "/info.json", function(result) {
    var result = await get_cached_url(service + "/info.json");
    // console.log(result);
    var setup = setup_template;
    setup.id = osdid;
    setup.tileSources[0] = result;
    if (viewer[osdid]) {
      viewer[osdid].close();
      document.getElementById(osdid).innerHTML = "";
    }
    $('#meta_' + osdid).html(meta_label[id] + "<br />" + meta_attribution[id] + "<br />"); //+elem.getAttribute("iiif_manifest"));
    $('#metai_' + osdid).attr("src", elem.getAttribute("src"));
    current_id[osdid] = id;
    viewer[osdid] = OpenSeadragon(setup);
    setFilterDefaults(osdid);
    setFilters();
    cb.selectMode();
    // });

  }

  async function get_cached_url(url) {
    var key = b64EncodeUnicode(url);
    if (key in jcache) {
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
    $(id).fadeIn(500, function() {
      $(id).show();
    });
  }

  coverboutique.prototype.hide = function(id) {
    $(id).fadeOut(500, function() {
      $(id).hide();
    });
  }

  coverboutique.prototype.zoomIn = function() {
    viewer[osdid].viewport.zoomTo(viewer[osdid].viewport.getZoom() * 1.05);
  }

  coverboutique.prototype.zoomOut = function() {
    viewer[osdid].viewport.zoomTo(viewer[osdid].viewport.getZoom() * 0.95);
  }

  coverboutique.prototype.rotLeft = function() {
    viewer[osdid].viewport.setRotation(viewer[osdid].viewport.getRotation() - 90);
  }

  coverboutique.prototype.rotRight = function() {
    viewer[osdid].viewport.setRotation(viewer[osdid].viewport.getRotation() + 90);
  }

  /* GENERATE OUTPUT PDF */

  coverboutique.prototype.launch_download = function() {
    showSplash('splash_download');
    prepImages();
    // create_image();
  }

  function cutLocalImage(rect,url) {
    return url;
  }

  function prepImages() {
    if (viewer['osd'] == false) {
      showSplashError('No Images No Export.');
      return;
    }

    var osd_off = {
      x: 0,
      y: 0
    };
    var osdo_off = {
      x: 0,
      y: 0
    };

    var img_mask = document.createElement('img');
    img_mask.crossOrigin = "Anonymous";

    var img_osd = document.createElement('img');
    img_osd.crossOrigin = "Anonymous";
    var osd_rect = viewer['osd'].viewport.viewportToImageRectangle(viewer['osd'].viewport.getBounds());
    // if (osd_rect.x<0) {osd_off.x=-osd_rect.x;osd_rect.x=0;}
    // if (osd_rect.y<0) {osd_off.y=-osd_rect.y;osd_rect.y=0;}
    if(src_type["osd"]=="local") {
      var osd_src = cutLocalImage(osd_rect, src_url['osd']);
    } else {
      var osd_src = getIIIFSrc(osd_rect, false, src_url['osd']);
    }

    img_mask.onload = function() {
      img_osd.onload = function() {
        if (viewer['osdo']) {
          var img_osdo = document.createElement('img');
          img_osdo.crossOrigin = "Anonymous";
          var osdo_rect = viewer['osdo'].viewport.viewportToImageRectangle(viewer['osdo'].viewport.getBounds());
          // if (osdo_rect.x<0) {osdo_off.x=-osdo_rect.x;osdo_rect.x=0;}
          // if (osdo_rect.y<0) {osdo_off.y=-osdo_rect.y;osdo_rect.y=0;}
          // var osdo_src = getIIIFSrc(osdo_rect, false, src_url['osdo']);
          if(src_type["osdo"]=="local") {
            var osdo_src = cutLocalImage(osdo_rect, src_url['osdo']);
          } else {
            var osdo_src = getIIIFSrc(osdo_rect, false, src_url['osdo']);
          }
          img_osdo.onload = function() {
            composeImage(img_mask, img_osd, img_osdo);
          }
          img_osdo.src = osdo_src;
        } else {
          composeImage(img_mask, img_osd, false);
        }
      }
      img_osd.src = osd_src;
    }
    img_mask.src = mask_url;
  }

  function composeImage(img_mask, img_osd, img_osdo) {

    /* DETERMINE OUTPUT DIMENSIONS AND MASK POSITION */

    osd_w = Math.round($('#osd').width());
    osd_h = Math.round($('#osd').height());
    osd_r = osd_w / osd_h;
    mask_w = img_mask.width;
    mask_h = img_mask.height;
    mask_r = mask_w / mask_h;
    console.log("osd: " + osd_w + " x " + osd_h);
    console.log("mask: " + mask_w + " x " + mask_h);
    console.log("ratios osd: " + osd_r + " ratio mask: " + mask_r);
    if (osd_r > mask_r) {
      out_w = (mask_h / osd_h) * osd_w;
      out_h = mask_h;
      mask_y = 0;
      mask_x = (out_w - mask_w) / 2;
    } else {
      out_w = mask_w;
      out_h = (mask_w / osd_w) * osd_h;
      mask_x = 0;
      mask_y = (out_h - mask_h) / 2;
    }
    console.log("out: " + out_w + " x " + out_h);

    /* PREPARE OUTPUT CANVAS */

    var outcanvas = document.createElement('canvas');
    outcanvas.id = "delme";
    outcanvas.width = out_w;
    outcanvas.height = out_h;
    outcanvas.crossOrigin = "Anonymous";
    var outcontext = outcanvas.getContext("2d");
    outcontext.fillStyle = 'white';
    outcontext.fillRect(0, 0, out_w, out_h);

    /* RENDER OSD */

    var osd_rect = viewer['osd'].viewport.viewportToImageRectangle(viewer['osd'].viewport.getBounds());
    console.log("osd_rect.width: " + osd_rect.width);
    console.log("img_osd.width: " + img_osd.width);
    var img_scale = out_w / img_osd.width;
    var osd_scale = out_w / osd_rect.width;
    var dest_x = osd_rect.x < 0 ? -osd_rect.x * osd_scale : 0;
    var dest_y = osd_rect.y < 0 ? -osd_rect.y * osd_scale : 0;
    var dest_w = img_osd.width * img_scale;
    var dest_h = img_osd.height * img_scale;
    console.log("osd_rect: " + osd_rect);
    console.log("dest: " + dest_x + " " + dest_y + " " + dest_w + " " + dest_h);
    if (gfx_mode == "cbf") {
      img_osd = cbf(img_osd, filter['osd']);
    } else {
      outcontext.filter = getCssFilters('osd');
    }
    if(src_type['osd']=="local"){
      outcontext.drawImage(img_osd, osd_rect.x, osd_rect.y, osd_rect.width, osd_rect.height, 0, 0, out_w, out_h);
    } else {
      outcontext.drawImage(img_osd, 0, 0, img_osd.width, img_osd.height, dest_x, dest_y, dest_w, dest_h);
    }
    /* RENDER OSDO */

    if (img_osdo) {
      var osdo_rect = viewer['osdo'].viewport.viewportToImageRectangle(viewer['osdo'].viewport.getBounds());
      var osdo_scale = out_w / img_osdo.width; // osdo_rect.width;
      var dest_x = osdo_rect.x < 0 ? -osdo_rect.x * osdo_scale : 0;
      var dest_y = osdo_rect.y < 0 ? -osdo_rect.y * osdo_scale : 0;
      var dest_w = img_osdo.width * osdo_scale;
      var dest_h = img_osdo.height * osdo_scale;
      console.log("osdo_rect: " + osdo_rect);
      console.log("dest: " + dest_x + " " + dest_y + " " + dest_w + " " + dest_h);
      if (gfx_mode == "cbf") {
        img_osdo = cbf(img_osdo, filter['osdo']);
      } else {
        outcontext.filter = getCssFilters('osdo');
      }
      var ms = document.getElementById("fmode_select");
      outcontext.globalCompositeOperation = ms.value;
      if(src_type['osdo']=="local"){
        outcontext.drawImage(img_osdo, osdo_rect.x, osdo_rect.y, osdo_rect.width, osdo_rect.height, 0, 0, out_w, out_h);
      } else {
        outcontext.drawImage(img_osdo, 0, 0, img_osdo.width, img_osdo.height, dest_x, dest_y, dest_w, dest_h);
      }
    }

    /* RENDER MASK */
    outcontext.globalCompositeOperation = "source-over";
    outcontext.filter = "none";
    outcontext.drawImage(img_mask, mask_x, mask_y, mask_w, mask_h);

    /* OUTPUT DATA TO PDF CREATOR */

    var ms = (new Date).getTime();
    var fn = "cover.boutique" + ms.toString() + ".jpg";
    var data = outcanvas.toDataURL("image/jpeg", 1.0);
    wrapPDF(data, out_w, out_h);

  }

  function getIIIFSrc(rect, flip, src) {
    var url = src;
    url = url + "/" + Math.floor(rect.x < 0 ? 0 : rect.x) + "," + Math.floor(rect.y < 0 ? 0 : rect.y) + "," + Math.ceil(rect.width) + "," + Math.ceil(rect.height + 1);
    url = url + "/full/";
    if (flip) {
      url = url + "!";
    }
    url = url + "0/default.jpg";
    console.log("returning " + url);
    return url;
  }

  async function wrapPDF(data, w, h) {
    var doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });
    var c = 20;

    doc.addFileToVFS('Sacramento', sacramentottf);
    doc.addFont('Sacramento', 'Sacramento', 'normal');

    doc.setFont('Sacramento');

    console.log(doc.getFontList());

    doc.setFontSize(48);
    doc.text(10, c, 'cover.boutique');
    c += 8;
    doc.setFont('Helvetica');
    doc.setFontType("normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.textWithLink('https://cover.boutique', 20, c, {
      url: 'https://cover.boutique'
    });
    c += 8;
    var model = $("#brand_select option:selected").text() + " " + $("#model_select option:selected").text();
    doc.text(10, c, "Phone: " + model);
    c += 7;
    if (viewer['osd']) {
      doc.setFontType("bold");
      doc.text(10, c, "Background");
      c += 5;
      doc.setFontType("normal");
      doc.text(10, c, meta_label[current_id['osd']]);
      c += 3;
      doc.setFontSize(6);
      doc.text(10, c, meta_attribution[current_id['osd']]);
      c += 3;
      doc.setTextColor(127, 127, 127);
      doc.text(10, c, manifests[current_id['osd']]);
      c += 7;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    }
    if (viewer['osdo']) {
      doc.setFontType("bold");
      doc.text(10, c, "Overlay");
      c += 5;
      doc.setFontType("normal");
      doc.text(10, c, meta_label[current_id['osdo']]);
      c += 3;
      doc.setFontSize(6);
      doc.text(10, c, meta_attribution[current_id['osdo']]);
      c += 3;
      doc.setTextColor(127, 127, 127);
      doc.text(10, c, manifests[current_id['osdo']]);
      c += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    }
    doc.setFontSize(6);
    doc.setTextColor(127, 127, 127);
    doc.text(10, c, "gfx mode: " + gfx_mode);
    c += 4;
    doc.addImage(data, 'JPEG', 30, c, w * 25.4 / 600, h * 25.4 / 600);
    var ms = (new Date).getTime();
    doc.save("cover.boutique." + ms.toString() + ".pdf");
    hideSplash();
    console.log("finished image");
  }

  coverboutique.prototype.showSlider = function(id) {
    var label = id.slice(1);
    label = label.charAt(0).toUpperCase() + label.slice(1);
    label = '<span class="close_slider_label">' + label + '</span>';
    $("#ficons").css("display", "none");
    $("#" + id).css("display", "block");
    $("#close_slider").html(label + "&#xf00d;");
    $("#close_slider").css("display", "block");
  }

  coverboutique.prototype.hideSlider = function(id) {
    $("#close_slider").css("display", "none");
    $("#ficons").css("display", "flex");
    $("#fbrightness").css("display", "none");
    $("#fcontrast").css("display", "none");
    $("#fhue").css("display", "none");
    $("#fsaturate").css("display", "none");
    $("#fsepia").css("display", "none");
    $("#fopacity").css("display", "none");
    $("#fmode_select").css("display", "none");
  }

  coverboutique.prototype.showDiscovery = function() {
    $("#disco_select").addClass("splash");
    $("#scroll").addClass("splash");
    $("#disco_select").css("display", "grid");
    $("#scroll").css("display", "grid");
    $("#close_disco").css("display", "flex");
    mobile_mode = true;
  }

  coverboutique.prototype.hideDiscovery = function() {
    hideDiscovery();
  }

  function hideDiscovery() {
    $("#disco_select").css("display", "none");
    $("#scroll").css("display", "none");
    $("#close_disco").css("display", "none");
  }

  coverboutique.prototype.hideSplash = function(id) {
    hideSplash();
  }

  function hideSplash() {
    var id = current_splash;
    $("#" + id).css("display", "none");
    $("#close_splash").css("display", "none");
    $("#splash_container").css("display", "none");
    current_splash = false;
  }

  coverboutique.prototype.showSplash = function(id) {
    current_splash = id;
    showSplash(id);
  }

  function showSplash(id) {
    if (current_splash) {
      console.log("going to hide " + current_splash);
      hideSplash();
    }
    console.log("showing " + id);
    $("#splash_container").css("display", "grid");
    $("#" + id).css("display", "block");
    $("#close_splash").css("display", "flex");
    current_splash = id;
  }

  function showSplashError(msg) {
    $('#error_msg').html(msg);
    showSplash('splash_error');
  }

  coverboutique.prototype.show = function(id) {
    $(id).fadeIn(500, function() {
      $(id).show();
    });
  }

  coverboutique.prototype.hide = function(id) {
    $(id).fadeOut(500, function() {
      $(id).hide();
    });
  }

}
