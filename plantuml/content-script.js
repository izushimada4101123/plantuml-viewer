if (!document.doctype &&
		document.documentElement.namespaceURI == 'http://www.w3.org/1999/xhtml' &&
		document.body.textContent.substr(0, '@start'.length) == '@start') {
	chrome.extension.sendRequest({
		command: 'showPageAction'
	});
	var data = document.body.textContent;
	var reload = true;
	var shown = false;
	var type = 'none';

	function escapeHtml(text) {
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	var showXhr;
	var show = function(force) {
		shown = shown || force;
		if (showXhr)
			showXhr.abort();

		chrome.extension.sendRequest({ command: 'compress', data: data }, function(response) {
			newpages = data.match(/^[\s]*newpage.*$/mg);

			console.log(newpages);

			newpage_num = newpages.length;

			console.log(newpage_num)
			for(count=0; count <= newpage_num; count++) {
				var url = [
					response.settings.server,
					response.settings.type,
					count,
					response.data
				].join('/');

				console.log(url);

				html = '';

				switch (response.settings.type) {
					case 'img':
						html = ['<img border="1" id="im" src="', escapeHtml(url), '" />'].join('');
						break;

					case 'svg':
						html = ['<img border="1" id="im" src="', escapeHtml(url), '" />'].join('');
						break;

					case 'txt':
						html = '';
						showXhr = new XMLHttpRequest();
						showXhr.onreadystatechange = function() {
							if (showXhr.readyState == 4 && showXhr.status != 404) {
								html = ['<pre>' + escapeHtml(showXhr.responseText) + '</pre>'].join('');
							}
						}
						showXhr.open('GET', url);
						showXhr.send(null);
						break;

					default:
					case 'none':
						html = ['<pre>' + escapeHtml(data) + '</pre>'];
						break;
				}

				if (count==0) {
					document.body.innerHTML = html;
				} else {
					document.body.innerHTML += "<br/><br/>" + html;
				}
				console.log(html);

			}
		});
	}

	if (location.protocol == 'file:') {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status != 404 && (!shown || data != xhr.responseText)) {
				data = xhr.responseText;
				show(true);
			}
		};
		var update = function() {
			if (!shown || reload) {
				xhr.abort();
				xhr.open('GET', location.href + '?t=' + +new Date, true);
				xhr.send(null);
			}
		};
		setInterval(update, 1000);
		update();
	} else
		show(true);

	chrome.extension.onMessage.addListener(
		function(request, sender, sendResponse) {
			/*console.log(request);
			var oldSendResponse = sendResponse;
			sendResponse = function() {
				console.log.apply(console, arguments);
				oldSendResponse.apply(this, arguments);
			}*/

			var command = request && request.command;
			switch (command) {
				case 'savedSettings':
					reload = request.settings.reload;
					show();
					break;
			}
			sendResponse();
		}
	);
}
