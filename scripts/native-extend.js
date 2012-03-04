Date.prototype.format = function() {
    var that, txts
       , roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    var addZero = function(num){
        return num < 10 ? '0' + num : num;
    };
    var na = function(n, z){
        return n % z;
    };
    var getDOY = function() {
        var onejan = new Date(that.getFullYear(), 0, 1);
        return Math.ceil((that - onejan) / 86400000);
    };
    var getWOY = function() {
        var onejan = new Date(that.getFullYear(), 0, 1);
        return Math.ceil((((that - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    };
    var dateVal = function(all, found) {
        switch (found) {
            case 'DD':   return addZero(that.getDate());
            case 'D':    return that.getDate();
            case 'MM':   return addZero(that.getMonth() + 1);
            case 'M':    return that.getMonth() + 1;
            case 'R':    return roman[that.getMonth()];
            case 'YYYY': return that.getFullYear();
            case 'YY':   return that.getFullYear().toString().substr(2, 2);
            case 'hh':   return addZero(that.getHours());
            case 'h':    return that.getHours();
            case 'HH':   return addZero(na(that.getHours(), 12));
            case 'H':    return na(that.getHours(), 12);
            case 'mm':   return addZero(that.getMinutes());
            case 'm':    return that.getMinutes();
            case 'ss':   return addZero(that.getSeconds());
            case 's':    return that.getSeconds();
            case 'u':    return that.getMilliseconds();
            case 'U':    return that.getTime() / 1000;
            case 'W':    return that.getDay();
            case 'y':    return getDOY();
            case 'w':    return getWOY();
            case 'G':    return that.getTimezoneOffset();
            case 'a':    return that.getHours()>12 ? 'pm' : 'am';
            case '%x':   return txts.shift();
            default:     return '[ERROR]';
        }
    };
    return function(str){
        that = this;
        txts = [].splice.call(arguments, 1);
        str = str.replace(/(DD|D|MM|M|R|YYYY|YY|hh|h|HH|H|mm|m|ss|s|u|U|W|y|w|G|a|%x)/g, dateVal);
        return str;
    };
}();

JSON.isParseable = function(str) {
    try {
        JSON.parse(str);
        return true;
    } catch(e) {
        return false;
    }
};

// --- Adding new objects and global functions (not really native extending, but I don't want to create new file for that)

function SemiArray (val) {
    this.items = val.split(/\s*;\s*/);
}

SemiArray.prototype.last = function(val) {
    if (!val) {
        return this.items[this.items.length-1] ;
    } else {
        this.items[this.items.length-1] = val;
        return this.toString();
    }
};

SemiArray.prototype.toString = function() {
    return this.items.join('; ');
};



function special(name) {
    var tmp = (widget.preferences.special || '').split(/\s*,\s*/);
    return tmp.some(function(val) {
        return name === val;
    });
}

// -- Weather parser

var WeatherParser = function(data) {
    if (data && data.nodeName === '#document' && data.querySelector('simpleforecast').firstElementChild) {
        this.valid = true;
        this.doc = data;
        this.data = data.querySelectorAll('simpleforecast forecastday');
    } else {
        this.valid = false;
    }
}

WeatherParser.prototype.position = 0;

// getters might be called together with constructor and then only return already calculated data

WeatherParser.prototype.__defineGetter__('pos', function() {
    return this.data[this.position];
});

WeatherParser.prototype.__defineGetter__('weekday', function() {
    var tmp = this.pos.querySelector('weekday').textContent;;
    return special('fullnames') ? dict(tmp) : dict(tmp.substr(0, 3));
});

WeatherParser.prototype.__defineGetter__('icon_url', function() {
    var wp = widget.preferences;
    if (!wp.iconSet || wp.iconSet === 'Default') {
        return this.pos.getElementsByTagName('icon_url')[0].textContent;
    } else {
        var tmp = this.pos.querySelector("icon_set[name='"+wp.iconSet+"'] icon_url");
        if (tmp) {
            return tmp.textContent;    
        }
    }
    return this.pos.getElementsByTagName('icon_url')[0].textContent;
});

WeatherParser.prototype.__defineGetter__('conditions', function() {
    return this.pos.getElementsByTagName('conditions')[0].textContent;
});

WeatherParser.prototype.__defineGetter__('temperature', function() {
    var w = widget;
    return this.pos.querySelector('high ' + widget.preferences.deg).textContent + (special('dayonly') ? '°' : '/' + this.pos.querySelector('low ' + widget.preferences.deg).textContent);
});

WeatherParser.prototype.__defineGetter__('place', function() {
    return ((new SemiArray(widget.preferences.city)).items[0]); // not working properly
});

WeatherParser.prototype.__defineGetter__('date', function() {
    var tmp = this.doc.getElementsByTagName('epoch')[0].textContent;
    return (new Date(tmp * 1000)).format(widget.preferences.format || 'YYYY-MM-DD');
});


// -- Cache

var Cache = {
    data: {},
    getBase64Image: function(img) {
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL("image/png");
    },
    cacheImage: function() {
        var src = this.src.split('?')[0];
        if  (!(src in Cache.data)) {
            Cache.data[src] = Cache.getBase64Image(this);
            widget.preferences.cache = JSON.stringify(Cache.data);
        }
    },
    getImage: function(src) {
        if  (src in this.data) {
            return this.data[src];
        }
        return null;
    }
};

if (widget.preferences.cacheEnabled == 'true' && JSON.isParseable(widget.preferences.cache)) {
    Cache.data = JSON.parse(widget.preferences.cache);
}



// -- Weather template

var WeatherTemplate =  function(p, eh) {
    var d = document;
    if (!WeatherTemplate.originalTable) {
        WeatherTemplate.originalTable = document.querySelector('table');
    }
    this.tree = WeatherTemplate.originalTable.cloneNode(true);
    this.imgs = this.tree.querySelectorAll('img');
    this.rows = this.tree.querySelectorAll('td');
    for (var i = 0, j = this.imgs.length; i < j; i++) {
        this.imgs[i].addEventListener('error', eh, false);
    }
    this.load(p);
};




WeatherTemplate.showOriginal = function() {
    if (this.originalTable) {
        var b = document.body;
        b.replaceChild(this.originalTable, b.firstElementChild);
    }
};

WeatherTemplate.prototype.load = function(parser) {
    this.parser = parser;
    if (parser) {
        for (var i = 0; i < 3; i++) {
            parser.position = i;
            var iS = widget.preferences.iconSet;
            if (iS in Atlases) {
                img.src = "./images/atlases/" + Atlases[iS].name;
            } else {
                setTimeout(function(a, b) {
                    //async image loading
                    var tmp;
                    if (widget.preferences.cacheEnabled == 'true' && (tmp = Cache.getImage(b)) ) {
                        a.src = tmp;
                    } else {
                        a.src = b + '?' + Math.round(Math.random()*100000); // ?xxxxxx to prevent Opera buggy caching
                        if (widget.preferences.cacheEnabled == 'true' && !(/^widget:/).test(b)) {
                            a.addEventListener('load', Cache.cacheImage, false);
                        }
                    }
                }, 1, this.imgs[i], parser.icon_url);
                
            }

            this.imgs[i].alt = parser.conditions;
            this.rows[i].querySelector("div").innerHTML = parser.weekday;
            this.rows[i].querySelector("div:last-child").innerHTML = parser.temperature;
        }
    }
};

WeatherTemplate.prototype.show = function(anim) {
    var b = document.body;
    if (anim && widget.preferences.transType && widget.preferences.transType in Transitions) {
        Transitions[widget.preferences.transType](this, b.firstElementChild, this.tree);
    } else {
        b.replaceChild(this.tree, b.firstElementChild);
        if (Transitions.useInterval) {
            Transitions.interval = setTimeout(function() {
                Transitions.handleInterval();
            }, parseFloat(widget.preferences.transInterval || 5) * 1000);
        } else {
            Transitions.firstEnded = true;
        }
    }
};

// -- Transitions

Transitions = { /* namespace */ };

Transitions.reset = function() {
    this.tpls = [];
    this.pos = 0;
    this.firstEnded = false;
    this.useInterval = false;
    if (this.interval) {
        clearTimeout(this.interval);
    }
    this.interval = null;
};
Transitions.reset();

Transitions.handleInterval = function() {
    var cities = (new SemiArray(widget.preferences.city)).items;
    this.pos++;
    if (this.pos >= this.tpls.length) {
        this.pos = 0;
    }
    var cTpl = this.tpls[this.pos];
    cTpl.show(true);
    setTimeout(function() {
        opera.contexts.speeddial.title = dict('weather') + ': ' + cities[Transitions.pos] + ' ' + cTpl.parser.date;
    }, this.duration / 2 );
};

Transitions.loadTemplate = function(tpl) {
    if (!this.tpls.length) {
        tpl.show(true);
    } else  if (!this.useInterval) {
        this.useInterval = true;
        if (Transitions.firstEnded) {
            Transitions.interval = setTimeout(function() {
                Transitions.handleInterval();
            }, parseFloat(widget.preferences.transInterval || 5) * 1000);
        }
    }
    this.tpls.push(tpl);
}


// -----------------------------

Transitions.__defineGetter__('duration', function() {
    return parseInt(widget.preferences.transDuration) || 500;
});

Transitions.__defineGetter__('func', function() {
    return parseInt(widget.preferences.tranFunc) || 'ease';
});

Transitions.opacity = function(tpl, old, cur) {
    var that = this;
    cur.style.opacity = 0;
    old.style.OTransition = 'all ' + this.duration/2/1000 + 's ' + this.func;
    cur.style.OTransition = 'all ' + this.duration/2/1000 + 's ' + this.func;
    old.style.opacity = 0;
    setTimeout(function() {
        d.body.appendChild(cur);
        setTimeout(function() {
            cur.style.opacity = 1;
        }, 1);
        setTimeout(function() {
            tpl.show();
            old.style.opacity = 1;
        }, that.duration/2);
    }, this.duration/2);
};

Transitions.toLeft = function(tpl, old, cur) {
    var startMargin = parseInt(old.currentStyle.marginLeft);
    this.animate(old, 'marginLeft', startMargin - 50 + startMargin + '%', startMargin + '%', tpl);
    this.animate(cur, 'marginLeft', startMargin + '%', '50%');
    document.body.appendChild(cur);
};

Transitions.toRight = function(tpl, old, cur) {
    var startMargin = parseInt(old.currentStyle.marginLeft);
    this.animate(old, 'marginLeft', '50%', startMargin + '%', tpl);
    this.animate(cur, 'marginLeft', startMargin + '%', startMargin - 50 + startMargin + '%');
    document.body.appendChild(cur);
};

Transitions.animate = function(what, val, to, from, tpl) {
    what.style[val] = from;
    what.style.OTransition = 'all ' + this.duration/1000 + 's ' + this.func;
    setTimeout(function() {
        what.style[val] = to;
    }, 1);
    if (tpl) {
         setTimeout(function() {
            tpl.show();
            what.style[val] = from;
        }, this.duration);
    }
};
