describe( 'MainController', function() {
    var MainCtrl, $location, $httpBackend, $scope, MapService;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( $controller, _$location_, $rootScope, _$httpBackend_, _Map_) {
        $location = _$location_;
        $httpBackend = _$httpBackend_;
        $scope = $rootScope.$new();
        MapService = _Map_;
        MainCtrl = $controller( 'MainController', { $scope: $scope });
    }));

    describe('#response', function() {
        describe('without a config', function() {
            it( 'throws error', function() {
                expect(MainCtrl.response).toThrowError('Could not find the mapConfig');
            });
        });
        describe('with a config', function() {
            var mapServiceSpy, setupSpy;
            beforeEach(function() {
                mapServiceSpy = spyOn(MapService, 'init');
                setupSpy = spyOn(MainCtrl, 'setupEvents');
            });
            it( 'calls MapService init', function() {
                MainCtrl.response({mapConfig: {}});
                expect(mapServiceSpy).toHaveBeenCalled();
            });
        });
    });
    describe('#badResponse', function() {
        it( 'throws error', function() {
            expect(MainCtrl.badResponse).toThrowError('Error while loading the config.json');
        });
    });
});
