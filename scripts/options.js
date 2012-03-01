var
	d = document,
	o  = opera,
	w = widget,
	c = AJAX.create(),
	citylist, arrow
;

function init() {
	d.body.innerHTML = document.body.innerHTML.replace(/{{(\w+)}}/gm, function(all, dc) {
		return dict(dc);
	});
	d.body.hidden = false;
	// NAV
	var nav = d.querySelector('nav');
	nav.addEventListener('click', handleNav, false);

	var li = nav.querySelector('li');
	arrow = d.querySelector('svg');
	arrow.style.left = li.offsetWidth/2 - 5 + 'px';
	arrow.style.display = 'block';

	// FORMS

	var deg = d.getElementById('deg');
	deg.selectedIndex = w.preferences.deg == 'fahrenheit' ? 1 : 0;
	deg.addEventListener('change', handleVal, false);

	citylist = d.getElementById('citylist');
	var city = d.getElementById('city');
	city.addEventListener('keypress', getAutocomplete, false);

	var lang = d.getElementById('lang');
	lang.selectedIndex = selectFinder(lang, w.preferences.lang);
	lang.addEventListener('change', handleVal, false);

	var iconSet = d.getElementById('iconSet');
	iconSet.selectedIndex = selectFinder(iconSet, w.preferences.iconSet);
	iconSet.addEventListener('change', handleVal, false);

	var transType = d.getElementById('transType');
	transType.selectedIndex = selectFinder(transType, w.preferences.transType);
	transType.addEventListener('change', handleVal, false);

	var hideLocation = d.getElementById('hideLocation');
	hideLocation.checked = w.preferences.hideLocation == 'true' ? true : false;
	hideLocation.addEventListener('change', handleVal, false);

	var rows = ['city', 'format', 'interval', 'redirect', 'background', 'textColor', 'transInterval', 'transFPS', 'transDuration'];
	for (var i = 0, j = rows.length; i < j; i++) {
		var tmp = d.getElementById(rows[i]);
		tmp.value = w.preferences[rows[i]] || (rows[i] == 'format' ? 'YYYY-MM-DD' : '');
		if ('color' in tmp.dataset) {
			tmp.nextElementSibling.style.background = tmp.value;
		}
		tmp.addEventListener('keyup', handleVal, false);
		tmp.addEventListener('change', handleVal, false);
	}

	var reload = d.getElementById('reload');
	reload.addEventListener('click', reloadNow, false);

	var special = d.getElementById('special');
	special.addEventListener('click', showSpecial, false);
}

function handleNav(e) {
	var t = e.target, index;
	if (t.tagName == 'LI') {
		index = [].indexOf.call(t.parentNode.children, t);
		d.querySelector('tbody:not(.hidden-form)').className = 'hidden-form';
		d.querySelectorAll('tbody')[index].className = '';
		arrow.style.left = t.offsetLeft + t.offsetWidth/2 - 5 + 'px';
	}
}

function showSpecial() {
	var tmp = prompt('Special parameters: ', w.preferences.special);
	if (tmp || tmp === '') {
		w.preferences.special = tmp;	
	}
}

function selectFinder(sc, val) {
	var opts = sc.getElementsByTagName('option');
	for (var i=0,j=opts.length;i<j;i++) {
		if (val == opts[i].value) {
			return i;
		}
	}
	return 0;
}

function reloadNow() {
	o.extension.postMessage('reload');
}

function handleVal(e) {
	if (this.type === 'checkbox') {
		w.preferences[this.id] = this.checked.toString();
	} else {
		w.preferences[this.id] = this.value;
	}
	if (this.id === 'lang') window.location.reload();
	if ('color' in this.dataset) {
		this.nextElementSibling.style.background = 'none'; // change color to "none" for wrong colors
		this.nextElementSibling.style.background = this.value; // throws CSS errors :/
	}
	if (this.id === 'city' && e.type === 'keyup') {
		if (e.keyCode > 40 || e.keyCode === 8  || e.keyCode === 32) {
			c.clearFront();
			citylist.innerHTML = '';
			var tmp = (new SemiArray(this.value)).last();
			c.getData('http://autocomplete.wunderground.com/aq?query='+window.encodeURIComponent(tmp)+'&features=1', handleSuccess, handleError);
		}
	}
}


/* AUTOCOMPLETE */
function getAutocomplete(e) {
	var
		tmp  = d.querySelector(".cityselected"),
		tmp2
	;
	if (tmp) {
		if (e.keyCode === 13) {
			this.value = (new SemiArray(this.value)).last(tmp.innerText);
			c.abort();
			citylist.innerHTML = '';
			return;
		}
		if (e.keyCode === 40) {
			tmp2 = tmp.nextElementSibling ? tmp.nextElementSibling : citylist.firstElementChild;
		} else  if (e.keyCode === 38) {
			tmp2 = tmp.previousElementSibling ? tmp.previousElementSibling : citylist.lastElementChild;
		}
		if (tmp2) {
			e.preventDefault();
			tmp.className = 'cityitem';
			tmp2.className += ' cityselected';
			tmp2.scrollIntoView(true);
			return;	
		}
	}
}

function handleSuccess(e) {
	var i, data, tmp;
	if (JSON.isParseable(e.text)) {
		data = JSON.parse(e.text).RESULTS;
		citylist.innerHTML = '';
		for (i in data) {
			if (citylist.children.length>=20) break;
			if (data[i].type === 'city') {
				tmp = d.createElement('div');
				tmp.className = 'cityitem' + (!citylist.firstElementChild ? ' cityselected' : '');
				tmp.innerHTML = data[i].name;
				citylist.appendChild(tmp);
			}
		}
	} else {
		console.log('Weather by Wunderground error. Autocomplete can\'t be parsed.');
	}
}

function handleError(e) {
	console.log('Weather by Wunderground error. Autocomplete can\'t be loaded: '+e.text);
}

function handleMouseDown(e) {
	var t = e.target;
	var city = d.getElementById('city');
	if (t.className === 'cityitem' || t.className === 'cityitem cityselected') {
		city.value = (new SemiArray(city.value)).last(t.innerText);
		/*city.value = t.innerText;*/
		c.abort();
		citylist.innerHTML = '';
		setTimeout(function() {
			city.blur();
			city.focus();
		}, 1);
	} else if (t.id === 'citylist') {
		setTimeout(function() {
			city.blur();
			city.focus();
		}, 1);
	}
}

window.addEventListener('load', init, false);
d.addEventListener('mousedown', handleMouseDown, false);