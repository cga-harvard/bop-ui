describe( 'GeospatialFilterController', function() {
    var GeospatialFilterController, $scope, rootScope, uibModal;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( $controller, $rootScope, _$uibModal_) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();
        uibModal = _$uibModal_;
        GeospatialFilterController = $controller( 'GeospatialFilterController', { $scope: $scope });
    }));
    it( 'filterString has default', function() {
        expect($scope.filterString).toEqual('[-90,-180 TO 90,180]');
    });
    describe('#updateFilterString', function() {
        it('updates the string', function() {
            $scope.updateFilterString('[1,1 TO 1,1]');
            expect($scope.filterString).toEqual('[1,1 TO 1,1]');
        });
    });
    describe('#showInfo', function() {
        it('opens the modal info', function() {
            var modalSpy = spyOn(uibModal, 'open');
            $scope.showInfo();
            expect(modalSpy).toHaveBeenCalledTimes(1);
        });
    });
});
