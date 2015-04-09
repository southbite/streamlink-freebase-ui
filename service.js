var freebase = require('freebase');
var service = freebase.service;
var http = require('http');

//so you run this to kick off a freebase session with a ui server:
//node service "run-freebase=true" "embedded_filename=./embeddedtest.db" "freebase-ip=127.0.0.1" "freebase-port=8000"

try{
	var settings = {};

	process.argv.forEach(function (val, index, array) {
	  if (val.indexOf('=') > -1){
	  	var argSplit = val.split('=');
	  	settings[argSplit[0]] = argSplit[1];
	  }
	});

	settings['freebase-ip'] = settings['freebase-ip']?settings['freebase-ip']:'127.0.0.1';
	settings['freebase-port'] = settings['freebase-port']?parseInt(settings['freebase-port']):8000;
	settings['freebase-ui-port'] = settings['freebase-ui-port']?parseInt(settings['freebase-ui-port']):9999;
	settings['run-freebase'] = settings['run-freebase']?settings['run-freebase']:false;
	settings['freebase-mode'] = settings['freebase-mode']?settings['freebase-mode']:'embedded';
	settings['freebase-cluster-size'] = settings['freebase-cluster-size']?parseInt(settings['freebase-cluster-size']):2;

	settings['freebase-authtoken-secret'] = settings['freebase-authtoken-secret']?settings['freebase-authtoken-secret']:'a256a2fd43bf441483c5177fc85fd9d3';
	settings['freebase-system-secret'] = settings['freebase-system-secret']?settings['freebase-system-secret']:'freebase-ui';
	settings['freebase-log-level'] = settings['freebase-log-level']?settings['freebase-log-level']:'info|error|warning|trace';


}catch(e){
	console.log('Bad settings: ' + e);
}

var startPortal = function(){

	try{
		var express = require('express');
		var app = express();

		app.use(express.bodyParser());
		app.use(express.cookieParser());
		app.use(express.static(__dirname+'/app'));

		//we proxy to the freebase instance - wherever it may be...
		app.get('/browser_client', function(req, res){
		  
			var options = {
			  hostname: settings['freebase-ip'],
			  port: settings['freebase-port'],
			  path: '/browser_client',
			  method: 'GET'
			};

			var connector = http.request(options, function(freebase_res) {
			  freebase_res.pipe(res, {end:true});//tell 'response' end=true
			});

			req.pipe(connector, {end:true});

		});

		app.get('/', function(req, res){
		  res.sendfile(__dirname+'/app/index.htm');
		});

		app.listen(settings['freebase-ui-port']);

		console.log('Initialized freebase ui portal on port ' + settings['freebase-ui-port']);
		console.log('You can now navigate to "http://localhost:' + settings['freebase-ui-port'] + '" locally');
		console.log('Or to "http://<external ip of this device>:' + settings['freebase-ui-port'] + '" from a different device');

	}catch(e){
		console.log('Failed starting freebase ui portal: ' + e);
		process.exit();
	}
}

if (settings['run-freebase']){

	var freebase_config = {
		port:settings['freebase-port'],
		services:{
			auth:{
				config:{
					authTokenSecret:settings['freebase-authtoken-secret'],
					systemSecret:settings['freebase-system-secret']
				}
			},
			data:{
				config:{}
			}
		},
		utils:{
			log_level:'info|error|warning|trace'
		}
	};

	if (settings['freebase-mode'] == 'cluster'){

		freebase_config = {
			mode:'cluster', 
			size:2,
			port:settings['freebase-port'],
			services:{
				auth:{
					config:{
						authTokenSecret:settings['freebase-authtoken-secret'],
						systemSecret:settings['freebase-system-secret']
					}
				},
				data:{
					config:{}
				}
			},
			utils:{log_level:settings['freebase-log-level']}
		};

	}else if (settings['freebase-mode'] == 'embedded'){

		freebase_config = {
			mode:'embedded', 
			services:{
				auth:{
					config:{
						authTokenSecret:settings['freebase-authtoken-secret'],
						systemSecret:settings['freebase-system-secret']
					}
				},
				data:{
					path:'./services/data_embedded',
					config:{
						embedded_filename:settings['embedded_filename']
					}
				}
			},
			utils:{log_level:settings['freebase-log-level']}
		}

	}

	service.initialize
	(
		freebase_config, 
		function(e){
			if (!e){
				console.log('Initialized freebase service on port ' + settings['freebase-port']);
				startPortal();
			}else
				console.log('Failed to initialize freebase service: ' + e);
		}
	);
}else
	startPortal();

