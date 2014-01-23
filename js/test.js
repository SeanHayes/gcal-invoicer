function assert(condition){
	if(!condition){
		console.trace('Assertion Error');
		throw new Error('Assertion Error');
	}
}

var tests = {
	testProcessEventsOverlappingAndMultiDayEventsTestCase: function(){
		var eventResponse = testEventResponses[0],
			events = eventResponse.items,
			timeMin = moment(events[1].end.dateTime).startOf('day'),
			timeMax = moment(events[events.length-2].end.dateTime),//normally it would be the last event, but the last event ends before the 2nd last event
			days = processEvents(events, timeMin, timeMax);
		
		assert(events.length == 12);
		assert(Object.keys(days).length == 6);
		
		expected_data = {
		"2013-10-01":{
		"ranges":[{"start":"2013-10-01T04:00:00.000Z","title":"Month Straddling Event","id":"tvs3j594j0hj0jb40j0bjae4e2mdas","end":"2013-10-01T06:00:00.000Z"}],
		"blocks":[{"start":"2013-10-01T04:00:00.000Z","end":"2013-10-01T06:00:00.000Z","ids":["tvs3j594j0hj0jb40j0bjae4e2mdas"],"titles":{"Month Straddling Event":null}}]},
		"2013-10-11":{
		"ranges":[{"start":"2013-10-11T11:00:00.000Z","title":"MUI-243","id":"tvs3j59smnp6mk001ae4e2mdas","end":"2013-10-11T12:45:00.000Z"},{"start":"2013-10-11T16:00:00.000Z","title":"MUI-243","id":"7auj7f6efjvbqa3r33bj23ji88","end":"2013-10-11T16:30:00.000Z"}],
		"blocks":[{"start":"2013-10-11T11:00:00.000Z","end":"2013-10-11T12:45:00.000Z","ids":["tvs3j59smnp6mk001ae4e2mdas"],"titles":{"MUI-243":null}},{"start":"2013-10-11T16:00:00.000Z","end":"2013-10-11T16:30:00.000Z","ids":["7auj7f6efjvbqa3r33bj23ji88"],"titles":{"MUI-243":null}}]},
		"2013-10-14":{
		"ranges":[{"start":"2013-10-14T16:00:00.000Z","title":"MUI-303, MUI-243","id":"61qrc1qv3uue3ehbgmveav2psk","end":"2013-10-14T20:00:00.000Z"},{"start":"2013-10-15T02:45:00.000Z","title":"Concurrent Event 1","id":"dsff59jo46a1rnrynrn5j5dahpe9eg","end":"2013-10-15T03:15:00.000Z"},{"start":"2013-10-15T02:45:00.000Z","title":"MUI-303, MUI-243","id":"dsff59jo46a10n9uaudahpe9eg","end":"2013-10-15T04:00:00.000Z"},{"start":"2013-10-15T03:45:00.000Z","title":"Overlapping Event 1","id":"dsff59jo46ag4gv45g45uaudahpe9eg","end":"2013-10-15T04:00:00.000Z"}],
		"blocks":[{"start":"2013-10-14T16:00:00.000Z","end":"2013-10-14T20:00:00.000Z","ids":["61qrc1qv3uue3ehbgmveav2psk"],"titles":{"MUI-303":null,"MUI-243":null}},{"start":"2013-10-15T02:45:00.000Z","end":"2013-10-15T04:00:00.000Z","ids":["dsff59jo46a1rnrynrn5j5dahpe9eg","dsff59jo46a10n9uaudahpe9eg","dsff59jo46ag4gv45g45uaudahpe9eg"],"titles":{"Concurrent Event 1":null,"MUI-303":null,"MUI-243":null,"Overlapping Event 1":null}}]},
		"2013-10-15":{
		"ranges":[{"start":"2013-10-15T04:00:00.000Z","title":"MUI-303, MUI-243","id":"dsff59jo46a10n9uaudahpe9eg","end":"2013-10-15T05:00:00.000Z"},{"start":"2013-10-15T04:00:00.000Z","title":"Overlapping Event 1","id":"dsff59jo46ag4gv45g45uaudahpe9eg","end":"2013-10-15T05:15:00.000Z"},{"start":"2013-10-15T16:00:00.000Z","title":"MUI-303, MUI-243","id":"tbavjgsp128349g47dr5h2i3s4","end":"2013-10-15T22:00:00.000Z"}],
		"blocks":[{"start":"2013-10-15T04:00:00.000Z","end":"2013-10-15T05:15:00.000Z","ids":["dsff59jo46a10n9uaudahpe9eg","dsff59jo46ag4gv45g45uaudahpe9eg"],"titles":{"MUI-303":null,"MUI-243":null,"Overlapping Event 1":null}},{"start":"2013-10-15T16:00:00.000Z","end":"2013-10-15T22:00:00.000Z","ids":["tbavjgsp128349g47dr5h2i3s4"],"titles":{"MUI-303":null,"MUI-243":null}}]},
		"2013-10-16":{
		"ranges":[{"start":"2013-10-16T19:00:00.000Z","title":"meeting, MUI-243","id":"3dvq4n8a5e1981mvvern95l00s","end":"2013-10-16T19:30:00.000Z"}],
		"blocks":[{"start":"2013-10-16T19:00:00.000Z","end":"2013-10-16T19:30:00.000Z","ids":["3dvq4n8a5e1981mvvern95l00s"],"titles":{"meeting":null,"MUI-243":null}}]},
		"2013-10-17":{
		"ranges":[{"start":"2013-10-17T19:00:00.000Z","title":"full day of work","id":"3dvq4n8a5e1981mvvern95l00s","end":"2013-10-17T21:30:00.000Z"},{"start":"2013-10-17T19:30:00.000Z","title":"meeting","id":"3dvq4n8a5e1981mvvern95l00s","end":"2013-10-17T20:00:00.000Z"}],
		"blocks":[{"start":"2013-10-17T19:00:00.000Z","end":"2013-10-17T21:30:00.000Z","ids":["3dvq4n8a5e1981mvvern95l00s","3dvq4n8a5e1981mvvern95l00s"],"titles":{"full day of work":null,"meeting":null}}]}
		};
		console.debug(JSON.stringify(days["2013-10-17"]))
		console.debug(JSON.stringify(expected_data["2013-10-17"]))
		assert(JSON.stringify(days) == JSON.stringify(expected_data));
	},
	testMakeInvoice: function(){
		var eventResponse = testEventResponses[0],
			events = eventResponse.items,
			timeMin = moment(events[1].end.dateTime).startOf('day'),
			timeMax = moment(events[events.length-2].end.dateTime),//normally it would be the last event, but the last event ends before the 2nd last event
			days = processEvents(events, timeMin, timeMax),
			invoice = makeInvoice(days);
		
		assert(invoice.lines[0]['desc'] == "10/1/13 - Month Straddling Event");
		assert(invoice.lines[0]['hours'] == 2);
		assert(invoice.lines[0]['lineTotal'] == 80);
		assert(invoice.lines[1]['desc'] == "10/11/13 - MUI-243");
		assert(invoice.lines[1]['hours'] == 2.25);
		assert(invoice.lines[1]['lineTotal'] == 90);
		assert(invoice.lines[2]['desc'] == "10/14/13 - MUI-303, MUI-243, Concurrent Event 1, Overlapping Event 1");
		assert(invoice.lines[2]['hours'] == 5.25);
		assert(invoice.lines[2]['lineTotal'] == 210);
		assert(invoice.lines[3]['desc'] == "10/15/13 - MUI-303, MUI-243, Overlapping Event 1");
		assert(invoice.lines[3]['hours'] == 7.25);
		assert(invoice.lines[3]['lineTotal'] == 290);
		assert(invoice.lines[4]['desc'] == "10/16/13 - meeting, MUI-243");
		assert(invoice.lines[4]['hours'] == 0.5);
		assert(invoice.lines[4]['lineTotal'] == 20);
		console.debug(invoice.lines[5])
		assert(invoice.lines[5]['desc'] == "10/17/13 - full day of work, meeting");
		assert(invoice.lines[5]['hours'] == 2.5);
		assert(invoice.lines[5]['lineTotal'] == 100);
		
		assert(invoice.total == 790);
		assert(invoice.totalCheck == 790);
		assert(invoice.totalTime == 19.75);
	}
}

function runtests(){
	for(var testName in tests){
		tests[testName]();
	}
}
