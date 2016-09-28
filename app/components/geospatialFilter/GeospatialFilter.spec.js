describe( 'GeospatialFilterDirective', function() {
    var $scope, scope, rootScope, InfoService, element, compiledElement;

    beforeEach( module( 'SolrHeatmapApp' ) );
    beforeEach( module( 'search_geospatialFilter_component' ) );

    beforeEach( inject( function($compile, $controller, $rootScope, _InfoService_) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();
        element = angular.element('<geospatial-filter></geospatial-filter>');
        compiledElement = $compile(element)($scope);
        $scope.$digest();
        scope = compiledElement.isolateScope();
        InfoService = _InfoService_;
    }));
    it( 'filterString has default', function() {
        expect(scope.filter.geo).toEqual('[-90,-180 TO 90,180]');
    });
    describe('#updateFilterString', function() {
        it('updates the string', function() {
            scope.updateFilterString('[1,1 TO 1,1]');
            expect(scope.filter.geo).toEqual('[1,1 TO 1,1]');
        });
    });
    describe('#showInfo', function() {
        it('opens the modal info', function() {
            var modalSpy = spyOn(InfoService, 'showInfoPopup');
            scope.showGeospatialInfo();
            expect(modalSpy).toHaveBeenCalledTimes(1);
        });
    });
});
