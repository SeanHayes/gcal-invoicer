var clientId = '',
    apiKey   = '',
    gapiLoaded = false,
    scopes = 'https://www.googleapis.com/auth/calendar.readonly';

function handleClientLoad(){
	// Step 2: Reference the API key
	console.debug('handleClientLoad', arguments);
	gapi.client.load('calendar', 'v3', function(){
		gapiLoaded = true;
	});
}

function checkAuth(){
	console.debug('checkAuth', arguments);
	gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
}

function handleAuthResult(authResult){
	console.debug('handleAuthResult', arguments);
	var authorizeButton = $('#authorize-button');
	
	if (authResult && !authResult.error){
		authorizeButton.hide();
		showCalendars();
	}
	else{
		authorizeButton.show();
		authorizeButton.click(handleAuthClick);
	}
}

function handleAuthClick(event){
	console.debug('handleAuthClick', arguments);
	gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
	return false;
}

function showCalendars(){
	var request = gapi.client.calendar.calendarList.list();
	
	request.execute(function(response) {
		var timeMin = moment().startOf('month'),// should be start of month
		    timeMax = moment(timeMin).add('months', 1);// should be start of next month
		
		var form = $.map(response.items, function(el, idx){
			var id = 'calendarId-'+idx;
			
			return '\n<input type="radio" id="'+id+'" name="calendarId" value="'+el.id+'"><label for="'+id+'">'+el.summary+'</label><br />';
		});
		
		var timeInputs = '<input type="datetime" name="start" value="'+timeMin.format()+'" />';
		timeInputs += '<input type="datetime" name="end" value="'+timeMax.format()+'" /><br />';
		
		form = '<form id="calendarSelectForm">' + timeInputs + form.join('') + '\n<input type="submit" value="Make Invoice" /></form>';
		
		$('#calendars').html(form);
	});
}

function processEvents(events, timeMin, timeMax){
	var days = {};
	
	// Convert events into blocks of time, overlapping events in the same block
	$.each(events, function(idx, el){
		var start = moment(el.start.dateTime),
		    end   = moment(el.end.dateTime);
		
		if (end.unix() <= timeMin.unix() || start.unix() >= timeMax.unix()){
			return;
		}
		if (start.unix() < timeMin.unix()){
			start = timeMin;
		}
		if (end.unix() >= timeMax.unix()){
			end = timeMax;
		}
		
		var ranges = [],
		    curRange,
		    numDays   = start.twix(end).count('days');
		
		console.debug(idx, numDays, 'days', start.format(), end.format());
		for (var i = numDays; i >= 1; i--){
			// if event spans multiple days, break it up. Prevents multiple
			// days worth of event titles getting grouped together.
			curRange = {start: start, title: el.summary, id: el.id};
			if (i > 1){
				start = moment(start).startOf('day').add('days', 1); //start of next day
				
				curRange.end = start;
				
			}
			else{
				curRange.end = end;
			}
			
			console.debug(idx, i, curRange);
			ranges.push(curRange);
		}
		
		// Assign ranges to days
		$.each(ranges, function(idx, range){
			//console.debug(idx, range);
			var day = range.start.format('YYYY-MM-DD');
			//console.debug(day, days[day]);
			
			days[day] = days[day] || {ranges: [], blocks: []};
			
			days[day].ranges.push(range);
		});
	});
	
	// set day.blocks for each day
	$.each(days, function(date, day){
		$.each(day.ranges, function(idx, range){
			var prevBlock = day.blocks[day.blocks.length-1],
			    titlesAry    = range.title.split(/\s?,\s?/),
			    titles = {};
			
			$.each(titlesAry, function(idx, title){
				titles[title] = null;
			});
			
			if (prevBlock && range.start <= prevBlock.end){
				prevBlock.end = range.end;
				prevBlock.ids.push(range.id);
				$.extend(prevBlock.titles, titles);
			}
			else{
				day.blocks.push({
					start: range.start,
					end: range.end,
					ids: [range.id],
					titles: titles
				});
			}
		});
		
	});
	
	return days;
}

function makeInvoice(days){
	var lines = [],
	    totalTime = 0,
	    hourlyRate = parseInt(40.00*100),
	    total = 0,
	    totalCheck;
	
	$.each(Object.keys(days).sort(), function(idx, date){
		var day = days[date];
		console.debug('day: '+date);
		
		var titles = [],
		    ids    = [],
		    lineDuration,
		    lineTotal,
		    durations = [];
		
		$.each(day.blocks, function(idx, block){
			$.extend(titles, block.titles);
			ids     = ids.concat(block.ids);
			durations.push(block.start.twix(block.end).asDuration());
		});
		
		lineDuration = moment.duration(0);
		
		$.each(durations, function(idx, duration){
			lineDuration.add(duration);
		});
		console.debug(lineDuration);
		// only use 2 decimal places
		lineDuration = parseInt(lineDuration.as('seconds')/36.0);
		lineTotal    = parseInt((lineDuration*hourlyRate)/100);
		
		totalTime += lineDuration;
		total += lineTotal;
		
		lineTotal = lineTotal/100.0;
		
		lines.push({
			hours: lineDuration/100,
			desc:  day.blocks[0].start.format('M/D/YY') + ' - ' + Object.keys(titles).join(', '),
			lineTotal: lineTotal
		});
		
		console.debug(lineDuration/100+' hours', Object.keys(titles).join(', '));
	});
	
	total = total/100.0;
	
	totalCheck = (totalTime*hourlyRate)/10000;
	
	hourlyRate = hourlyRate/100.0;
	totalTime = totalTime/100.0;
	
	var ret = {
		lines: lines,
		hourlyRate: hourlyRate,
		totalTime: totalTime,
		total: total,
		totalCheck: totalCheck
	}
	
	console.debug(ret);
	
	return ret
}

function getCalendarEvents(calendarId){
	console.debug('getCalendarEvents', arguments);
	var timeMin = moment($('#calendarSelectForm').find('input[name=start]').val()),
	    timeMax = moment($('#calendarSelectForm').find('input[name=end]').val());
	
	var request = gapi.client.calendar.events.list({
		calendarId: calendarId,
		orderBy: 'startTime',
		singleEvents: true,
		timeMin: timeMin.format(),
		timeMax: timeMax.format()
	});
	
	request.execute(function(response){
		console.debug(arguments);
		
		if (!response.items || !response.items.length){
			alert('No events found.');
			return false;
		}
		
		var days    = processEvents(response.items, timeMin, timeMax),
		    invoice = makeInvoice(days),
		    lines = invoice.lines,
		    hourlyRate = invoice.hourlyRate,
		    totalTime = invoice.totalTime,
		    total = invoice.total,
		    totalCheck = invoice.totalCheck;
		
		if(total != totalCheck){
			alert(total + ' != ' + totalCheck);
		}
		else{
			var table = '<table><tr><th>QTY</th><th>DESCRIPTION</th><th>UNIT PRICE</th><th>LINE TOTAL</th></tr>';
			
			$.each(lines, function(idx, line){
				table += '<tr><td>' + line.hours + '</td><td>' + line.desc + '</td><td>$';
				table += hourlyRate + '</td><td>$' + line.lineTotal + '</td></tr>';
			});
			
			table += '</table><dl>';
			
			table += '<dt>Time</dt><dd>'+totalTime+' hours</dd>';
			table += '<dt>Total</dt><dd>$'+total+'</dd>';
			table += '<dt>Total Check</dt><dd>$'+totalCheck+'</dd>';
			
			table += '</dl>';
			
			$('body').append(table);
		}
	});
}

$(document).ready(function(){
	// Set default values in the form from previous visits
	var clientIdL = localStorage.getItem('clientId'),
	    apiKeyL   = localStorage.getItem('apiKey');
	
	if (clientIdL != null){
		$('input[name=clientId]').val(clientIdL);
	}
	if (apiKeyL != null){
		$('input[name=apiKey]').val(apiKeyL);
	}
});

$(document).on('submit', '#apiCredentialsForm', function(e){
	e.stopPropagation();
	
	clientId = $('input[name=clientId]').val();
	apiKey   = $('input[name=apiKey]').val();
	
	localStorage.setItem('clientId', clientId);
	localStorage.setItem('apiKey', apiKey);
	
	if(gapiLoaded){
		$('#apiCredentialsForm').hide();
		gapi.client.setApiKey(apiKey);
		checkAuth();
	}
	else{
		alert('Google Api not loaded yet.');
	}
	
	return false;
});

$(document).on('submit', '#calendarSelectForm', function(e){
	e.stopPropagation();
	
	var calendarId = $('input:radio[name=calendarId]:checked').val();
	
	getCalendarEvents(calendarId);
	
	return false;
});
