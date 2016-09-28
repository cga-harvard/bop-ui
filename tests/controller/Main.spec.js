describe( 'MainController', function() {
    var MainCtrl, $location, $httpBackend, $scope, MapService, state;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( $controller, _$location_, $rootScope, _$httpBackend_, _Map_, _$state_) {
        $location = _$location_;
        $httpBackend = _$httpBackend_;
        $scope = $rootScope.$new();
        MapService = _Map_;
        state = _$state_;
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
                MainCtrl.response({mapConfig: { view: { projection: 'EPSG:4326'}}});
                expect(mapServiceSpy).toHaveBeenCalled();
            });
            describe('with a geo state', function() {
                var serviceSpy;
                beforeEach(function() {
                    serviceSpy = spyOn(MapService, 'getExtentForProjectionFromQuery');
                    MainCtrl.$state = { geo: '[1,1 TO 1,1]'};
                });
                it( 'calls MapService getExtentForProjectionFromQuery', function() {
                    MainCtrl.response({mapConfig: { view: { projection: 'EPSG:4326'}}});
                    expect(serviceSpy).toHaveBeenCalled();
                });
            });
        });
    });
    describe('#badResponse', function() {
        it( 'throws error', function() {
            expect(MainCtrl.badResponse).toThrowError('Error while loading the config.json');
        });
    });
});
