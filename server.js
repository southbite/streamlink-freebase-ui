var express = require('express');
var app = express();

app.use(express.bodyParser());
app.use(express.cookieParser());

app.use(express.static(__dirname+'/app'));

app.listen(9999);
console.log('Listening on port 9999...');