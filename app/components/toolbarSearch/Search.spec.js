describe( 'SearchDirective', function() {
    var $scope, scope, rootScope, HeatMapSourceGeneratorService, MapService, InfoService, element, compiledElement;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function($compile, $controller, $rootScope, _HeatMapSourceGenerator_, _Map_, _InfoService_) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();

        element = angular.element('<toolbar-search></toolbar-search>');
        compiledElement = $compile(element)($scope);
        $scope.$digest();
        scope = compiledElement.isolateScope();

        HeatMapSourceGeneratorService = _HeatMapSourceGenerator_;
        MapService = _Map_;
        InfoService = _InfoService_;
    }));
    it( 'searchInput is empty string', function() {
        expect(scope.searchInput).toEqual('');
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
                scope.searchInput = 'San Diego';
                scope.doSearch();
                expect(searchSpy).toHaveBeenCalledWith('San Diego');
            });
        });
    });
    describe('#resetSearchInput', function() {
        var searchSpy, mapSpy;
        beforeEach(function() {
            searchSpy = spyOn(HeatMapSourceGeneratorService, 'search');
            mapSpy = spyOn(MapService, 'resetMap');
            scope.searchInput = 'San Diego';
        });
        describe('calls search on HeatMapSourceGeneratorService', function() {
            it('once', function() {
                scope.resetSearchInput();
                expect(searchSpy).toHaveBeenCalledTimes(1);
            });
            it('with searchInput', function() {
                scope.resetSearchInput();
                expect(searchSpy).toHaveBeenCalledWith('');
            });
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
