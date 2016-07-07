/**
 * Geospatial filter Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('GeospatialFilterCtrl', ['$scope', '$uibModal', '$http', function($scope, $uibModal, $http) {

        $scope.showInfo = function(){
             var modalInstance = $uibModal.open({
                 animation: true,
                 templateUrl: 'infoPopup.html',
                 controller: 'InfoWindowCtrl',
                 size: 'lg',
                 resolve: {
                     infoMsg: function(){
                         return 'Geospatial filter!';
                     },
                     toolName: function(){
                         return 'Geospatial filter';
                     }
                 }
             });
        };

    }]);
