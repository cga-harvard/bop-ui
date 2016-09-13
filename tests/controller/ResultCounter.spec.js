describe( 'ResultCounter', function() {
    var ResultController, $scope, rootScope;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( $controller, $rootScope) {
        rootScope = $rootScope;
        $scope = $rootScope.$new();
        ResultController = $controller( 'ResultCounterController', { $scope: $scope });
    }));
    describe('#setCounter', function() {
        describe('broadcast is wrong', function() {
            it( 'sets to no result found', function() {
                rootScope.$broadcast('setCounter', undefined);
                expect($scope.counter).toEqual('No results found');
            });
        });
        describe('counter < 1', function() {
            it( 'sets to no result found', function() {
                rootScope.$broadcast('setCounter', 0);
                expect($scope.counter).toEqual('No results found');
            });
        });
        describe('counter > 1', function() {
            it( 'sets the counter', function() {
                rootScope.$broadcast('setCounter', 5);
                expect($scope.counter).toEqual(5);
            });
        });
    });
});
