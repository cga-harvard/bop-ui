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

    it( 'should exist', inject( function() {
        expect( MainCtrl).toBeTruthy();
    }));

    describe('#response', function() {
        describe('without a config', function() {
            it( 'throws error', function() {
                expect(MainCtrl.response).toThrowError('Could not find the mapConfig');
            });
        });
    });
    describe('#badResponse', function() {
        it( 'throws error', function() {
            expect(MainCtrl.badResponse).toThrowError('Error while loading the config.json');
        });
    });
});
