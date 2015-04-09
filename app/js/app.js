'use strict';

/* App Module */

//var ideControllers = angular.module('ideControllers', []);

////console.log('registering app');

var freebase_ui_app = angular.module('freebase_ui_app', [  
  'ui.bootstrap',                                            
  'ngAnimate',
  'freebase',
  'JSONedit'
]);

var registerDataService = function (serviceName) {
	freebase_ui_app.factory(serviceName, function (freebaseClient) {
        var _freebase = null;
        
        return {
            instance:freebaseClient,
            init: function (host, port, secret, done) {
            	freebaseClient.connect(host, port, secret, done);
            },
            traverse:function(data, path, done){
            	try
            	{
            		var currentNode = data;
            		var found = false;
            		
            		if (path[0] = '/')
            			path = path.substring(1, path.length);
            	
                	path.split('/').map(function(current, index, arr){
                		currentNode = currentNode[current];
                		if (index + 1 == arr.length && currentNode){
                			found = true;
                			done(null, currentNode);
                		}
                	});
                	
                	if (!found)
                		done(null, null);
            	}catch(e){
            		done(e);
            	}
            	
            }
        };
    });
};

registerDataService('dataService');

freebase_ui_app.controller('freebaseController', ['$scope', '$modal', 'dataService', '$window', function($scope, $modal, dataService, $window) {

    $scope.rootPaths = [];
    $scope.selectedPath = "";
    $scope.selectedData = null;
    $scope.pathFilter = "/*";
    $scope.authenticated = false;
    $scope.dburl = "127.0.0.1";
    $scope.dbport = 8000;
    $scope.dbsecret = "freebase-ui";

    $scope.openModal = function (templatePath, controller, handler, args) {
            var modalInstance = $modal.open({
              templateUrl: templatePath,
              controller: controller,
              resolve: {
                data: function () {
                  return $scope.data;
                },
                args: function () {
                  return args;
                }
              }
            });

      if (handler)
          modalInstance.result.then(handler.saved, handler.dismissed);
     };
          
     $scope.openNewModal = function (type, action) {
         
         var handler = {
                 saved:function(result){
                    ////console.log('result');
                    ////console.log(result);
                 },
                 dismissed:function(){
                    
                 }
         };
         
         return $scope.openModal('../templates/' + action + '.html', action.toString(), handler);
     };
     
    $scope.to_trusted = function(html_code) {
          return $sce.trustAsHtml(html_code);
    };
     
    $scope.toArray = function(items){
        var returnArray = [];
        for (var item in items)
            returnArray.push(item);
        return returnArray;
    };

    $scope.bulkRemoveCurrent = function(){

      if ($scope.pathFilter == '*' || $scope.pathFilter == '/*' )
        return alert('That would entail deleting the whole database - sorry, not allowed...');

      if (confirm('Are you sure you wish to remove all items on the path: ' + $scope.pathFilter + '?')){

        dataService.instance.client.remove($scope.pathFilter, {index:'freebase', type:$scope.pathFilter}, function(e, result){
        
            if (e){
                alert('data delete failed: ' + e);
            }else{
               $scope.rootPaths = [];
               alert('data deleted successfully');
               $scope.$apply();
            }
             
        });

      }

    }

    $scope.authenticate = function(){

        //console.log('authenticating in app');
        //console.log($scope.dburl);
        //console.log($scope.dbport);
        //console.log($scope.dbsecret);

        dataService.init($scope.dburl, $scope.dbport, $scope.dbsecret, function(e){

            //console.log(e);

            if (!e){


                dataService.instance.client.onAll(function(e, message){

                    console.log('IN CATCHALL');
                    console.log(message);

                    var apply = false;

                    if (message.action == 'DELETE'){

                      $scope.rootPaths.map(function(item, index, array){

                          if (item.path == message.path){
                              apply = true;
                              return array.splice(index, 1);
                          }
                      });

                      if (message.path == $scope.selectedPath){
                          $scope.selectedPath = "";
                          $scope.selectedData = null;
                          apply = true;
                      }

                    }else if (message.action == 'PUT'){

                      var found = false;
                      $scope.rootPaths.map(function(item, index, array){
                          if (item.path == message.path)
                            found = true;
                      });

                      if (!found){
                        $scope.rootPaths.push({_id:message.payload.data._id, path:message.path});
                        
                        apply = true;
                      }

                      ////console.log($scope.selectedPath);
                      ////console.log(message.payload);

                      if (message.path == $scope.selectedPath){
                        $scope.selectedData = message.payload.data;
                        apply = true;
                        
                      }
                    }

                    if (apply)
                        $scope.$apply();

                }, function(e){
                  //console.log('ONALL e');
                  //console.log(e);

                    if (!e){

                        $scope.refreshPaths = function(){

                            dataService.instance.client.getPaths($scope.pathFilter, function(e, results){

                                 ////console.log('root paths!!!');
                                ////console.log(results.payload);
                                $scope.rootPaths = results.payload;

                                $scope.$apply();

                            });
                        }

                        $scope.actionSelected = function(action){

                            if (action.text == 'save'){

                               console.log('saving');
                               console.log($scope.selectedPath);
                               console.log($scope.selectedData);
                               ////console.log('toJson');
                               ////console.log(angular.toJson($scope.selectedData));
                            if ($window.confirm('Proceed with save?')){
                                dataService.instance.client.set($scope.selectedPath, JSON.parse(angular.toJson($scope.selectedData)), {index:'freebase', type:$scope.selectedPath}, function(e, result){
                                
                                    if (!e){
                                        ////console.log('data saved successfully');
                                        alert('data saved successfully');
                                    }else{
                                         ////console.log('data save failed: ' + e);
                                         alert('data save failed');
                                    }

                                });
                              }
                            }else if (action.text == 'delete'){
                              if ($window.confirm('Proceed with delete?')){
                                dataService.instance.client.remove($scope.selectedPath, {index:'freebase', type:$scope.selectedPath}, function(e, result){
                                
                                    if (e){
                                        //TODO - data was not deleted here...
                                    }else
                                      alert('data deleted successfully');

                                });
                              }
                            }
                          }

                        $scope.pathSelected = function(path){
                            ////console.log('path selected');
                            ////console.log(path.path);

                            dataService.instance.client.get(path.path, null, function(e, result){

                                ////console.log('data found');
                                ////console.log(result.payload);

                                if (!e){
                                     $scope.selectedPath = path.path;
                                     $scope.selectedData = result.payload[0].data;
                                     $scope.selectedJSON = JSON.stringify(result.payload[0].data);
                                     
                                      var actions = [
                                        /*
                                        {
                                            text:'undo',
                                            cssClass:'glyphicon glyphicon-arrow-left'
                                        },
                                        {
                                            text:'redo',
                                            cssClass:'glyphicon glyphicon-arrow-right'
                                        },
                                        */
                                        {
                                            text:'save',
                                            cssClass:'glyphicon glyphicon-floppy-disk'
                                        },
                                        /*
                                        {
                                            text:'template',
                                            cssClass:'glyphicon glyphicon-plus'
                                        },
                                        */
                                        {
                                            text:'delete',
                                            cssClass:'glyphicon glyphicon-remove'
                                        }];
                                     
                                     $scope.actions = actions;

                                     $scope.$apply();
                                }
                                else{
                                    //TODO - report some kind of error
                                }
                            });
                        }

                       

                        $scope.authenticated = true;
                        ////console.log('client attached');

                        $scope.$apply();

                    }else{
                        //TODO - notify failure on attaching to onAll
                        ////console.log('failure doing catchall: ' + e);
                    }

                });

            }else{
                //TODO - notify failure connecting
                ////console.log('failure doing connecting: ' + e);
            }

        });
    }

}]);

