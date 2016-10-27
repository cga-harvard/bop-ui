describe( 'ExportDirective', function() {
    var $scope, scope, element, rootScope, HeatMapSourceGeneratorService, compiledElement, InfoService, MapService, searchFilter;

    beforeEach(module('SolrHeatmapApp'));
    beforeEach(module('search_exportButton_component'));

    beforeEach(inject( function($compile, $controller, $rootScope, _HeatMapSourceGenerator_, _InfoService_, _Map_, _searchFilter_) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();

        element = angular.element('<export-button></exportButton>');
        compiledElement = $compile(element)($scope);
        $scope.$digest();
        scope = compiledElement.isolateScope();

        HeatMapSourceGeneratorService = _HeatMapSourceGenerator_;
        InfoService = _InfoService_;
        MapService = _Map_;
        searchFilter = _searchFilter_;
    }));

    it( 'export has defaults', function() {
        expect(scope.export.numDocuments).toEqual(1);
    });
    describe('#startExport', function() {
        var startExportSpy;
        beforeEach(function() {
            startExportSpy = spyOn(HeatMapSourceGeneratorService, 'startCsvExport');
        });
        describe('calls search on HeatMapSourceGeneratorService', function() {
            it('once', function() {
                scope.startExport();
                expect(startExportSpy).toHaveBeenCalledTimes(1);
            });
            it('with number of docs', function() {
                scope.export.numDocuments = 10;
                scope.startExport();
                expect(startExportSpy).toHaveBeenCalledWith(10);
            });
        });
    });
    describe('#showInfo', function() {
        it('opens the modal info', function() {
            var modalSpy = spyOn(InfoService, 'showInfoPopup');
            scope.showExportInfo();
            expect(modalSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe('#reset', function() {
        var searchSpy, mapSpy, filterSpy;
        beforeEach(function() {
            searchSpy = spyOn(HeatMapSourceGeneratorService, 'search');
            mapSpy = spyOn(MapService, 'resetMap');
            filterSpy = spyOn(searchFilter, 'resetFilter');
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
});
