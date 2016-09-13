describe( 'UserFilterController', function() {
    var UserFilterController, $scope, rootScope, HeatMapSourceGeneratorService, uibModal;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( $controller, $rootScope, _HeatMapSourceGenerator_, _$uibModal_) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();
        HeatMapSourceGeneratorService = _HeatMapSourceGenerator_;
        uibModal = _$uibModal_;
        UserFilterController = $controller( 'UserFilterController', { $scope: $scope });
    }));
    it( 'searchInput is empty string', function() {
        expect($scope.userfilterInput).toEqual('');
    });
    describe('#userSearch', function() {
        var searchSpy;
        beforeEach(function() {
            searchSpy = spyOn(HeatMapSourceGeneratorService, 'search');
        });
        describe('calls search on HeatMapSourceGeneratorService', function() {
            it('once', function() {
                $scope.userSearch();
                expect(searchSpy).toHaveBeenCalledTimes(1);
            });
            it('with searchInput', function() {
                $scope.userfilterInput= 'San Diego';
                $scope.userSearch();
                expect(searchSpy).toHaveBeenCalledWith('San Diego');
            });
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
