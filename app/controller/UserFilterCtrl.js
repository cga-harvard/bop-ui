/**
 * Filter by user controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('UserFilterCtrl', ['HeatMapSourceGenerator', '$scope', '$uibModal', '$http', function(HeatMapSourceGeneratorService, $scope, $uibModal, $http) {

        $scope.showInfo = function(){
             var modalInstance = $uibModal.open({
                 animation: true,
                 templateUrl: 'infoPopup.html',
                 controller: 'InfoWindowCtrl',
                 size: 'lg',
                 resolve: {
                     infoMsg: function(){
                         return 'Filter by user';
                     },
                     toolName: function(){
                         return 'Filter by user';
                     }
                 }
             });
        };

    }]);
