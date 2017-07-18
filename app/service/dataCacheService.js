/*eslint angular/di: [2,"array"]*/
(function () {
    angular
    .module('SolrHeatmapApp')
    .factory('DataCacheService', ['$window', function ($window) {

        function insertData(objkey, objValue) {
            const stringObjKey = angular.toJson(objkey);
            const stringObjValue = angular.toJson(objValue);
            $window.localStorage.setItem(stringObjKey, stringObjValue);
            return true;
        }

        function getObjData(objKey) {
            const stringObjKey = angular.toJson(objKey);
            const stringObjValue = $window.localStorage.getItem(stringObjKey) || false;

            let dataObj;
            try {
                dataObj = angular.fromJson(stringObjValue);
            } catch (e) {
                dataObj = null;
            } finally {
                return dataObj;
            }
        }

        function localStorageSpace(){
            let data = '';
            for(let key in $window.localStorage){
                if($window.localStorage.hasOwnProperty(key)){
                    data += $window.localStorage[key];
                }
            }
        }

        return {
            insertData,
            getObjData,
            localStorageSpace
        };


    }]);
})();
