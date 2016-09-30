describe( 'SearchDirective', function() {
    var $scope, scope, rootScope, HeatMapSourceGeneratorService, MapService, InfoService, element, compiledElement, searchFilter;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function($compile, $controller, $rootScope, _HeatMapSourceGenerator_, _Map_, _InfoService_, _searchFilter_) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();

        element = angular.element('<toolbar-search></toolbar-search>');
        compiledElement = $compile(element)($scope);
        $scope.$digest();
        scope = compiledElement.isolateScope();

        HeatMapSourceGeneratorService = _HeatMapSourceGenerator_;
        MapService = _Map_;
        InfoService = _InfoService_;
        searchFilter = _searchFilter_;
    }));
    it( 'searchInput is empty string', function() {
        expect(scope.filter.text).toEqual(null);
    });
    describe('#doSearch', function() {
        var searchSpy;
        beforeEach(function() {
            searchSpy = spyOn(HeatMapSourceGeneratorService, 'search');
        });
        describe('calls search on HeatMapSourceGeneratorService', function() {
            it('once', function() {
                scope.doSearch();
                expect(searchSpy).toHaveBeenCalledTimes(1);
            });
            it('with searchInput', function() {
                scope.filter.text = 'San Diego';
                scope.doSearch();
                expect(searchSpy).toHaveBeenCalledWith('San Diego');
            });
        });
    });
    describe('#reset', function() {
        var searchSpy, mapSpy, filterSpy;
        beforeEach(function() {
            searchSpy = spyOn(HeatMapSourceGeneratorService, 'search');
            mapSpy = spyOn(MapService, 'resetMap');
            filterSpy = spyOn(searchFilter, 'resetFilter');
            scope.searchInput = 'San Diego';
        });
        it('calls search on HeatMapSourceGeneratorService once', function() {
            scope.reset();
            expect(searchSpy).toHaveBeenCalledTimes(1);
        });
        it('calls restMap on MapService once', function() {
            scope.reset();
            expect(mapSpy).toHaveBeenCalledTimes(1);
        });
        it('calls resetFilter on searchFilter once', function() {
            scope.reset();
            expect(filterSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe('#onKeyPress', function() {
        it('search on enter key pressed', function() {
            var searchSpy = spyOn(scope, 'doSearch');
            scope.onKeyPress({which: 13});
            expect(searchSpy).toHaveBeenCalledTimes(1);
        });
        it('does not search on all other keys', function() {
            var searchSpy = spyOn(scope, 'doSearch');
            scope.onKeyPress({which: 14});
            expect(searchSpy).not.toHaveBeenCalledTimes(1);
        });
    });
    describe('#showInfo', function() {
        it('opens the modal info', function() {
            var modalSpy = spyOn(InfoService, 'showInfoPopup');
            scope.showtoolbarSearchInfo();
            expect(modalSpy).toHaveBeenCalledTimes(1);
        });
    });
});
