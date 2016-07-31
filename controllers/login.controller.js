var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('config.json');
var webauth = require('webauth');
// var httpntlm = require('httpntlm');

router.get('/', function (req, res) {
    // log user out
    delete req.session.token;

    // move success message into local variable so it only appears once (single read)
    var viewData = { success: req.session.success };
    delete req.session.success;

    res.render('login', viewData);
});

router.post('/', function (req, res) {

    // authenticate using api to maintain clean separation between layers
    var reqOptions = {
        host: 'login.uci.edu',
        path: '/ucinetid/webauth',
        // port: '3000',
        headers: {
            'accept-encoding' : 'gzip,deflate,sdch'
        }
    },
    credentials = {
        // username: req.body.username,
        // password: req.body.password,
        username: 'tnone',
        password: 'Va4um*qus',
        domain: 'CORP',
        workstation: 'CHURKIN-LINUX'
    };
 
    webauth.auth(reqOptions, credentials, null, function(res_auth) {
        console.log("res_auth.statusCode", res_auth.statusCode);
        // console.log("res_auth", res_auth);
        if (res_auth.statusCode == 200) {
            request.post({
                url: config.apiUrl + '/users/authenticate',
                form: req.body,
                json: true
            }, function (error, response, body) {
                if (error) {
                    return res.render('login', { error: 'An error occurred' });
                }

                if (!body.token) {
                    return res.render('login', { error: body, username: req.body.username });
                }

                // save JWT token in the session to make it available to the angular app
                req.session.token = body.token;

                // redirect to returnUrl
                var returnUrl = req.query.returnUrl && decodeURIComponent(req.query.returnUrl) || '/';
                res.redirect(returnUrl);
            });
        } else {
            return res.render('login', { error: 'Webauth Failed' });
        }
    }, true, null, 'NTLM');

    // httpntlm.get({
    //     url: "https://login.uci.edu/ucinetid/webauth",
    //     username: 'tnone',
    //     password: 'Va4um*qus',
    //     workstation: 'CHURKIN-LINUX',
    //     domain: 'CORP'
    // }, function (err, res){
    //     if(err) {
    //         console.log('error', err);
    //     } else {
    //         console.log(res.headers);
    //         console.log(res.body);
    //     }
    // });
    // var options = {
    //     url: "https://login.uci.edu/ucinetid/webauth",
    //     username: 'tnone',
    //     password: 'Va4um*qus',
    //     workstation: 'CHURKIN-LINUX',
    //     domain: 'CORP'
    // };
     
    // async.waterfall([
    //     function (callback){
    //         var type1msg = ntlm.createType1Message(options);
     
    //         httpreq.get(options.url, {
    //             headers:{
    //                 'Connection' : 'keep-alive',
    //                 'Authorization': type1msg
    //             },
    //             agent: keepaliveAgent
    //         }, callback);
    //     },
     
    //     function (res, callback){
    //         if(!res.headers['www-authenticate'])
    //             return callback(new Error('www-authenticate not found on response of second request'));
     
    //         var type2msg = ntlm.parseType2Message(res.headers['www-authenticate']);
    //         var type3msg = ntlm.createType3Message(type2msg, options);
     
    //         httpreq.get(options.url, {
    //             headers:{
    //                 'Connection' : 'Close',
    //                 'Authorization': type3msg
    //             },
    //             allowRedirects: false,
    //             agent: keepaliveAgent
    //         }, callback);
    //     }
    // ], function (err, res) {
    //     if(err) return console.log(err);
     
    //     console.log(res.headers);
    //     console.log(res.body);
    // });
});

module.exports = router;