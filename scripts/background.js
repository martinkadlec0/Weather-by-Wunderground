var
	d = document,
	w = this.widget || { preferences: null },
	c = AJAX.create(),
	sd = opera.contexts.speeddial,
	refresh = w.preferences.interval * 60 * 1000,
	tOut, 
	trans = {
		tpls: [],
		pos: 0,
		interval: null
	}
;

d.addEventListener('DOMContentLoaded', init, false);
sd.url = w.preferences.redirect;

/* DOMContentLoaded callback*/
function init() {
	if ('background' in w.preferences && w.preferences.background) {
		d.body.style.background = w.preferences.background.split(';')[0]; }
	if ('textColor' in w.preferences &&w.preferences.textColor) {
		d.body.style.color = w.preferences.textColor.split(';')[0]; }
	setTimeout(getWeatherInfo, 0);
}

function imageErrorHandler() {
	console.log('Weather by Wunderground: Warning, image wasn\'t loaded. This might be only temporary server side problem.');
	clearTimeout(tOut);
	tOut = setTimeout(getWeatherInfo, 1000*60);
}


/* interval callback */
function getWeatherInfo() {
	var cities = (new SemiArray(w.preferences.city)).items, i;
	Transitions.reset();
	try {
		c.abort();
		for (i = 0, j = cities.length; i < j; i++) {
			c.getData('http://api.wunderground.com/auto/wui/geo/ForecastXML/index.xml?query=' + window.encodeURIComponent(cities[i]), handleWeatherSuccess, handleError, true);	
		}
	} catch(e) {
		// try is there necessary, because from some reason Opera throws security error when device is not connected
		// also Operas implementation of offline events is not perfect. Often when device is offline Opera still says it's online - CORE-44100
		console.log('Weather by Wunderground: Error, you are offline.');
	}
	sd.title = dict('updating') + '...';
}

/* weather ajax callback */
function handleWeatherSuccess(e) {
	var
		data = e.XML,
		wTpl, wPars
	;
	if (data && data.documentElement) {
		wPars = new WeatherParser(data);
		if (wPars.valid) {
			// put data from parser to template

			wTpl = new WeatherTemplate(wPars, imageErrorHandler);
			Transitions.loadTemplate(wTpl);

			// new speed dial item title
			sd.title = dict('weather') + ': ' + (w.preferences.hideLocation != 'true' ? wPars.place + ' ' : '') + wPars.date;

			clearTimeout(tOut);
			tOut = setTimeout(getWeatherInfo, refresh);

		} else {
			// the city doesnt exists - replace old info with "?" image
			wTpl = WeatherTemplate.showOriginal();
			sd.title = w.preferences.city + ' - ' + dict('nodata');
		}
	} else {
		handleError();
	}

}

/* weather ajax error callback */
function handleError(e) {
	if (navigator.onLine) {
		console.log('Weather by Wunderground: Warning, data wasn\'t loaded. This might be only temporary server side problem.');
		sd.title = dict('error');
		setTimeout(getWeatherInfo, 30000);
	} else {
		sd.title = dict('offline');
		d.body.addEventListener('online', handleOnline, false);
	}
}

/* online event callback */
function handleOnline(e) {
	d.body.removeEventListener('online', handleOnline, false);
	getWeatherInfo();
}


/* BGProcess/Option page messaging */
opera.extension.onmessage = function(e) {
	if (e.data === 'reload') {
		sd.url = w.preferences.redirect;
		if ('background' in w.preferences && w.preferences.background) {
			d.body.style.background = w.preferences.background.split(';')[0]; }
		if ('textColor' in w.preferences &&w.preferences.textColor) {
			d.body.style.color = w.preferences.textColor.split(';')[0]; }
		refresh = w.preferences.interval * 60 * 1000;
		clearTimeout(tOut);
		getWeatherInfo();
	}
};