describe( 'ExportDirective', function() {
    var $scope, scope, element, rootScope, HeatMapSourceGeneratorService, compiledElement, InfoService;

    beforeEach(module('SolrHeatmapApp'));
    beforeEach(module('search_exportButton_component'));

    beforeEach(inject( function($compile, $controller, $rootScope, _HeatMapSourceGenerator_, _InfoService_) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();

        element = angular.element('<export-button></exportButton>');
        compiledElement = $compile(element)($scope);
        $scope.$digest();
        scope = compiledElement.isolateScope();

        HeatMapSourceGeneratorService = _HeatMapSourceGenerator_;
        InfoService = _InfoService_;
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
});
