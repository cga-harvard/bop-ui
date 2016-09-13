describe( 'ExportController', function() {
    var ExportController, $scope, rootScope, HeatMapSourceGeneratorService, uibModal;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( $controller, $rootScope, _HeatMapSourceGenerator_, _$uibModal_) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();
        HeatMapSourceGeneratorService = _HeatMapSourceGenerator_;
        uibModal = _$uibModal_;
        ExportController = $controller( 'ExportController', { $scope: $scope });
    }));
    it( 'export has defaults', function() {
        expect($scope.export.numDocuments).toEqual(1);
    });
    describe('#startExport', function() {
        var startExportSpy;
        beforeEach(function() {
            startExportSpy = spyOn(HeatMapSourceGeneratorService, 'startCsvExport');
        });
        describe('calls search on HeatMapSourceGeneratorService', function() {
            it('once', function() {
                $scope.startExport();
                expect(startExportSpy).toHaveBeenCalledTimes(1);
            });
            it('with number of docs', function() {
                $scope.export.numDocuments = 10;
                $scope.startExport();
                expect(startExportSpy).toHaveBeenCalledWith(10);
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
