(function () {
    'use strict';
    var appServices = angular.module('appServices', []),
        SERVER_URL = "http://10.0.0.3:3000/";


    angular.module('appServices').factory('JargonizeService', function($http, $log) {
        return {
            getDefinitions : function(){
                return $http.jsonp( SERVER_URL + "?callback=JSON_CALLBACK" );
            },

            splitTheText : function(textBlock){
                return $http.jsonp(SERVER_URL + 'nouns/?sentence=' + textBlock + '&callback=JSON_CALLBACK');
            }
        };
    });

}());