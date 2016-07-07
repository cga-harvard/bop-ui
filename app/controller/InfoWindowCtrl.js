/**
 * InfoWindowCtrl
 */
angular
    .module('SolrHeatmapApp')
    .controller('InfoWindowCtrl',  function ($scope, $uibModalInstance, infoMsg, toolName) {

        $scope.infoMsg = infoMsg;
        $scope.toolName = toolName;

        $scope.ok = function () {
            $uibModalInstance.close();
        };

    });
