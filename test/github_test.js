var expect = require('expect.js');



it('should log in to git, using basic authentication', function(callback) {
	
	var GitHubApi = require("github");
	this.timeout(10000);
	
	var github = new GitHubApi({
	    // required
	    version: "3.0.0",
	    // optional
	    timeout: 5000,
	    protocol: 'https',
	    debug: true
	});
	
	github.authenticate({
	    type: "basic",
	    username: "southbite",
	    password: "FilipBallFlow01"
	});
	
	
	
	callback();
});

it('should delete the test repo', function(callback) {
	
	var GitHubApi = require("github");
	this.timeout(10000);
	
	var github = new GitHubApi({
	    // required
	    version: "3.0.0",
	    // optional
	    timeout: 5000,
	    protocol: 'https',
	    debug: true
	});
	
	github.authenticate({
	    type: "basic",
	    username: "southbite",
	    password: "FilipBallFlow01"
	});
	
	console.log('initial delete');
	github.repos.delete({
		repo:'fire-grate-test-repo',
		user:'southbite'
	}, function(e){
		console.log('delete message');
		console.log(e);
		callback();
	});
	
});

it('should create and delete test repo in git', function(callback) {
	
	var GitHubApi = require("github");
	this.timeout(20000);
	
	var github = new GitHubApi({
	    // required
	    version: "3.0.0",
	    // optional
	    timeout: 20000
	});
	
	github.authenticate({
	    type: "basic",
	    username: "southbite",
	    password: "FilipBallFlow01"
	});
	
	github.repos.create({
		name:'fire-grate-test-repo'
	}, function(e){
		if (!e)
		{
			github.repos.delete({
				repo:'fire-grate-test-repo',
				user:'southbite'
			}, function(e){
				callback(e);
			});
		}
		else
			callback(e);
	});
	
	
});

it('should create a test file in git test repo', function(callback) {
	
	//http://mdswanson.com/blog/2011/07/23/digging-around-the-github-api-take-2.html
	//5 easy steps...
	
	var GitHubApi = require("github");
	this.timeout(40000);
	
	var github = new GitHubApi({
	    // required
	    version: "3.0.0",
	    // optional
	    timeout: 30000
	});
	
	github.authenticate({
	    type: "basic",
	    username: "southbite",
	    password: "FilipBallFlow01"
	});
	
	var blobSha = null;
	var refSha = null;
	
	github.repos.create({
		name:'fire-grate-test-repo',
		"auto_init": true
	}, function(e){
		
		if (!e)
		{
			github.gitdata.createBlob({
				user:'southbite',
				repo:'fire-grate-test-repo',
				content:'Test content of blob',
				encoding:'utf-8'
			}, function(e, response){
				console.log('blob created');
				console.log(response);
				if (!e)
				{
					blobSha = response.sha;
					github.gitdata.getReference({
						user:'southbite',
						repo:'fire-grate-test-repo',
						ref:'heads/master'
					}, function(e, response){
						
						console.log('did ref');
						console.log(response);
						refSha = response.object.sha;
						
						if (!e)
						{
							github.gitdata.getCommit({
								user:'southbite',
								repo:'fire-grate-test-repo',
								sha:refSha
							}, function(e, response){
								console.log('got latest commit');
								console.log(response);
								
								if (!e)
								{
									github.gitdata.createTree({
										  user:"southbite",
										  repo:'fire-grate-test-repo',
										  "base_tree":response.sha,
										  "tree": [
										    {
										      "path": "Test.txt",
										      "mode": "100644",
										      "type": "blob",
										      "sha": blobSha
										    }
										  ]
										}, function(e, response){
											console.log('tree created');
											console.log(response);
											if (!e)
											{
												github.gitdata.createCommit({
													  user:"southbite",
													  repo:'fire-grate-test-repo',
													  "message": "Test commit message",
													  "author": {
													    "name": "Simon Bishop",
													    "email": "southbite@gmail.com"
													  },
													  "tree": response.sha,
													  parents:[refSha]
													}, function(e, response){
														console.log('commit created');
														console.log(response);

														if (e){
															console.log('error creating commit');
															callback(e);
														}
														else
														{
															github.gitdata.updateReference({
																 user:"southbite",
																 repo:'fire-grate-test-repo',
																 ref:'heads/master',
																 sha:response.sha,
																 force:true
															}, function(e, response){
																callback(e);
															});
														}
														
														
													});
											}
											else
											{
												console.log('error creating tree');
												callback(e);
											}

										});
									}
								else
								{
									console.log('error creating tree');
									callback(e);
								}
								
							});
						}
						else
						{
							console.log('error getting latest commit');
							callback(e);
						}
						
					});
					
					
				}
				else
				{
					console.log('Error creating blob');
					callback(e);
				}
					
			});
		}
		else
			callback(e);
		
	});
});

