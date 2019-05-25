function cbf(img, filter) {
    var w = img.width;
    var h = img.height;

    var c = document.createElement('canvas');

    c.id = "cbftemp";
    c.width = w;
    c.height = h;
    c.crossOrigin = "Anonymous";

    var x = c.getContext("2d");
    x.drawImage(img, 0, 0)

    x.putImageData(cbf_con(x, w, h, filter['contrast']), 0, 0);
    x.putImageData(cbf_hue(x, w, h, filter['hue']), 0, 0);
    x.putImageData(cbf_sat(x, w, h, filter['saturate']), 0, 0);
    x.putImageData(cbf_sep(x, w, h, filter['sepia']), 0, 0);
    x.putImageData(cbf_bri(x, w, h, filter['brightness']), 0, 0);

    var i = new Image();
    i.crossOrigin = "Anonymous";
    i.src = c.toDataURL("image/png");
    return c; // sshhht, don't tell! this is supposed to be the image but waiting for onload just sucks! #HACK
}

function cbf_sat(x, w, h, v) {
    v = -100 + v;
    var rgba = x.getImageData(0, 0, w, h);
    var i = 0;
    var t = 0;
    var adjust = v * -0.01;
    for (i = 0; i < rgba.data.length; i += 4) {
        var max = Math.max(rgba.data[i], rgba.data[i + 1], rgba.data[i + 2]);
        if (rgba.data[i + 0] != max) {
            t = (max - rgba.data[i]) * adjust;
            rgba.data[i + 0] = byteRange(rgba.data[i + 0] + t);
        }
        if (rgba.data[i + 1] != max) {
            t = (max - rgba.data[i + 1]) * adjust;
            rgba.data[i + 1] = byteRange(rgba.data[i + 1] + t);
        }
        if (rgba.data[i + 2] != max) {
            t = (max - rgba.data[i + 2]) * adjust;
            rgba.data[i + 2] = byteRange(rgba.data[i + 2] + t);
        }
        rgba.data[i + 3] = 255;
    }
    return rgba;
}

function cbf_sat2(x, w, h, v) {
    var rgba = x.getImageData(0, 0, w, h);
    var adjust = v;
    for (i = 0; i < rgba.data.length; i += 4) {
        hsv = rgbToHSV(rgba.data[i + 0], rgba.data[i + 1], rgba.data[i + 2]);
        hsv.s = (hsv.s * adjust) / 100;
        rrgb=hsvToRGB(hsv.h, hsv.s, hsv.v);
        rgba.data[i + 0] = byteRange(rrgb.r);
        rgba.data[i + 1] = byteRange(rrgb.g);
        rgba.data[i + 2] = byteRange(rrgb.b);
    }
    return rgba;
}

function cbf_bri(x, w, h, v) {
    v = -100 + v;
    var rgba = x.getImageData(0, 0, w, h);
    var i = 0;
    var adjust = v; //  Math.floor ((255 * v) / 100);
    for (i = 0; i < rgba.data.length; i += 4) {
        rgba.data[i + 0] = byteRange(rgba.data[i + 0] + adjust);
        rgba.data[i + 1] = byteRange(rgba.data[i + 1] + adjust);
        rgba.data[i + 2] = byteRange(rgba.data[i + 2] + adjust);
        rgba.data[i + 3] = 255;
    }
    return rgba;
}

function cbf_hue(x, w, h, v) {
    var rgba = x.getImageData(0, 0, w, h);
    var adjust = Math.floor(((360+v)%360)/3.6);
    for (i = 0; i < rgba.data.length; i += 4) {
        hsv = rgbToHSV(rgba.data[i + 0], rgba.data[i + 1], rgba.data[i + 2]);
        var h = hsv.h * 100;
        h += Math.abs(adjust);
        h = h % 100;
        h /= 100;
        hsv.h = h;
        rrgb=hsvToRGB(hsv.h, hsv.s, hsv.v);
        rgba.data[i + 0] = byteRange(rrgb.r);
        rgba.data[i + 1] = byteRange(rrgb.g);
        rgba.data[i + 2] = byteRange(rrgb.b);
    }
    return rgba;
}

function cbf_sep(x, w, h, v) {
    var rgba = x.getImageData(0, 0, w, h);
    var i = 0;
    var adjust = v/100;
    for (i = 0; i < rgba.data.length; i += 4) {
        var tempr = (rgba.data[i + 0] * (1 - (0.607 * adjust))) + (rgba.data[i + 1] * (0.769 * adjust)) + (rgba.data[i + 2] * (0.189 * adjust));
        var tempg = (rgba.data[i + 0] * (0.349 * adjust)) + (rgba.data[i + 1] * (1 - (0.314 * adjust))) + (rgba.data[i + 2] * (0.168 * adjust));
        var tempb = (rgba.data[i + 0] * (0.272 * adjust)) + (rgba.data[i + 1] * (0.534 * adjust)) + (rgba.data[i + 2] * (1- (0.869 * adjust)));
        rgba.data[i + 0] = byteRange(tempr);
        rgba.data[i + 1] = byteRange(tempg);
        rgba.data[i + 2] = byteRange(tempb);
    }
    return rgba;
}

function cbf_con(x, w, h, v) {
    var rgba = x.getImageData(0, 0, w, h);
    var i = 0;
    // var adjust = Math.pow((v) / 100, 2);
    var adjust = v;
    for (i = 0; i < rgba.data.length; i += 4) {
        // Red channel
        // var temp = rgba.data[i + 0] / 255;
        // temp -= 0.5;
        var temp = rgba.data[i + 0] - 128;
        temp *= adjust;
        temp /= 100;
        temp += 128;
        // temp += 0.5;
        // temp *= 255;
        rgba.data[i + 0] = byteRange(temp);

        // Green channel
        // var temp = rgba.data[i + 1] / 255;
        // temp -= 0.5;
        var temp = rgba.data[i + 1] - 128;
        temp *= adjust;
        temp /= 100;
        temp += 128;
        // temp += 0.5;
        // temp *= 255;
        rgba.data[i + 1] = byteRange(temp);

        // Blue channel
        // var temp = rgba.data[i + 2] / 255;
        // temp -= 0.5;
        var temp = rgba.data[i + 2] - 128;
        temp *= adjust;
        temp /= 100;
        temp += 128;
        // temp += 0.5;
        // temp *= 255;
        rgba.data[i + 2] = byteRange(temp);
    }
    return rgba;
}

function cbf_test(x, w, h, v) {
    var rgba = x.getImageData(0, 0, w, h);
    var i = 0;
    for (i = 0; i < rgba.data.length; i += 4) {
        rgba.data[i] = 255 - rgba.data[i];
        rgba.data[i + 1] = 255 - rgba.data[i + 1];
        rgba.data[i + 2] = 255 - rgba.data[i + 2];
        rgba.data[i + 3] = 255;
    }
    return rgba;
}

function byteRange(a) {
    if (a > 255) {
        a = 255;
    }
    if (a < 0) {
        a = 0;
    }
    return Math.floor(a);
}

function rgbToHSV(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var v = max;
    var d = max - min;
    var s = max == 0 ? 0 : (d / max);
    if (max == min) {
        var h = 0;
    } else {
        if (max == r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        }
        if (max == g) {
            h = (b - r) / d + 2;
        }
        if (max == b) {
            h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return {
        h: h,
        s: s,
        v: v
    };
}

function hsvToRGB(h, s, v) {
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    var r, g, b;
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }

    r = Math.floor(r * 255)
    g = Math.floor(g * 255)
    b = Math.floor(b * 255)
    return {
        r: r,
        g: g,
        b: b
    };
}
