Date.prototype.format = (function() {
	var
		that, txts,
		roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
		addZero = function(num) {
			return num < 10 ? '0' + num : num;
		},
		na = function(n, z) {
			return n % z;
		},
		getDOY = function() {
			var onejan = new Date(that.getFullYear(), 0, 1);
			return Math.ceil((that - onejan) / 86400000);
		},
		getWOY = function() {
			var onejan = new Date(that.getFullYear(), 0, 1);
			return Math.ceil((((that - onejan) / 86400000) + onejan.getDay() + 1) / 7);
		},
		dateVal = function(all, found) {
			switch (found) {
				case 'DD':	return addZero(that.getDate());
				case 'D':	return that.getDate();
				case 'MM':	return addZero(that.getMonth() + 1);
				case 'M':	return that.getMonth() + 1;
				case 'R':	return roman[that.getMonth()];
				case 'YYYY': return that.getFullYear();
				case 'YY':	return that.getFullYear().toString().substr(2, 2);
				case 'hh':	return addZero(that.getHours());
				case 'h':	return that.getHours();
				case 'HH':	return addZero(na(that.getHours(), 12));
				case 'H':	return na(that.getHours(), 12);
				case 'mm':	return addZero(that.getMinutes());
				case 'm':	return that.getMinutes();
				case 'ss':	return addZero(that.getSeconds());
				case 's':	return that.getSeconds();
				case 'u':	return that.getMilliseconds();
				case 'U':	return that.getTime() / 1000;
				case 'W':	return that.getDay();
				case 'y':	return getDOY();
				case 'w':	return getWOY();
				case 'G':	return that.getTimezoneOffset();
				case 'a':	return that.getHours()>12 ? 'pm' : 'am';
				case '%x':	return txts.shift();
				default:	return '[ERROR]';
			}
		}
	; // end var
	return function(str){
		that = this;
		txts = [].splice.call(arguments, 1);
		str = str.replace(/(DD|D|MM|M|R|YYYY|YY|hh|h|HH|H|mm|m|ss|s|u|U|W|y|w|G|a|%x)/g, dateVal);
		return str;
	};
}());

JSON.isParseable = function(str) {
	// to do: if true, save result in cache
	try {
		JSON.parse(str);
		return true;
	} catch(e) {
		return false;
	}
};

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