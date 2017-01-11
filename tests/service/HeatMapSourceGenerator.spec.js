describe( 'HeatMapSourceGenerator', function() {
    var subject, $httpBackend, MapService, spatialSpy, geospatialFilter, $window;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( _HeatMapSourceGenerator_, _$httpBackend_, _Map_, _$window_) {
        subject = _HeatMapSourceGenerator_;
        $httpBackend = _$httpBackend_;
        MapService = _Map_;
        geospatialFilter = { minX: 1, maxX: 1, minY: 1, maxY: 1};
        $window = _$window_;
        spatialSpy = spyOn(MapService, 'getCurrentExtent').and.returnValue(geospatialFilter);
    }));

    describe('#search', function() {
        var exportRequest;
        beforeEach(function() {
            solrHeatmapApp.bopwsConfig = { csvDocsLimit: 10 };
            solrHeatmapApp.appConfig = { tweetsSearchBaseUrl: '/search' };
            geospatialFilter = {queryGeo: { minX: 1, maxX: 1, minY: 1, maxY: 1}};
            exportRequest = $httpBackend.when('GET', '/search?a.hm.filter=%5B-90,-180+TO+90,180%5D&a.time.gap=PT1H&a.time.limit=1&d.docs.limit=50&d.docs.sort=distance&q.geo=%5B-90,-180+TO+90,180%5D&q.time=%5B2013-03-10T00:00:00+TO+2013-03-21T00:00:00%5D').respond('');
        });
        afterEach(function() {
            $httpBackend.resetExpectations();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        it('sends the search request', function() {
            $httpBackend.expectGET('/search?a.hm.filter=%5B-90,-180+TO+90,180%5D&a.time.gap=PT1H&a.time.limit=1&d.docs.limit=50&d.docs.sort=distance&q.geo=%5B-90,-180+TO+90,180%5D&q.time=%5B2013-03-10T00:00:00+TO+2013-03-21T00:00:00%5D').respond('');
            subject.search();
            $httpBackend.flush();
        });
        describe('has data', function() {
            var createOrUpdateHeatMapLayerSpy;
            beforeEach(function() {
                createOrUpdateHeatMapLayerSpy = spyOn(MapService, 'createOrUpdateHeatMapLayer');
                $window.localStorage.clear();
            });
            describe('no a.hm data', function() {
                beforeEach(function() {
                    exportRequest.respond({});
                });
                it('does not call createOrUpdateHeatMapLayer', function() {
                    subject.search();
                    $httpBackend.flush();
                    expect(createOrUpdateHeatMapLayerSpy).not.toHaveBeenCalled();
                });
            });
            describe('with a.hm data', function() {
                beforeEach(function() {
                    exportRequest.respond({ 'a.hm': '1', 'a.time': { counts: 1}});
                });
                it('does not call createOrUpdateHeatMapLayer', function() {
                    subject.search();
                    $httpBackend.flush();
                    expect(createOrUpdateHeatMapLayerSpy).toHaveBeenCalled();
                });
            });
        });
        describe('error from server', function() {
            beforeEach(function() {
                $window.localStorage.clear();
            });
            it('throws an window error', function() {
                exportRequest.respond(401, '');
                spyOn( $window, 'alert' ).and.callFake( function() {
                    return true;
                } );
                subject.search();
                $httpBackend.flush();
                expect($window.alert).toHaveBeenCalled();
            });
        });
    });
});
