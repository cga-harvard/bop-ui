describe( 'HeatMapSourceGenerator', function() {
    var subject, $httpBackend, MapService, spatialSpy, geospatialFilter;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( _HeatMapSourceGenerator_, _$httpBackend_, _Map_) {
        subject = _HeatMapSourceGenerator_;
        $httpBackend = _$httpBackend_;
        MapService = _Map_;
        geospatialFilter = { minX: 1, maxX: 1, minY: 1, maxY: 1};
        spatialSpy = spyOn(MapService, 'getCurrentExtent').and.returnValue(geospatialFilter);
    }));

    describe('#getFormattedDateString', function() {
        it('Returns the formatted date object that can be parsed by API.', function() {
            var startDate = new Date('2016-09-08');
            expect(subject.getFormattedDateString(startDate, startDate)).toEqual('[2016-09-08T00:00:00 TO 2016-09-08T00:00:00]');
        });
    });
    describe('#startCsvExport', function() {
        var exportRequest;
        beforeEach(function() {
            solrHeatmapApp.bopwsConfig = { csvDocsLimit: 10 };
            solrHeatmapApp.appConfig = { tweetsExportBaseUrl: '/export' };
            exportRequest = $httpBackend.when('GET', '/export?a.hm.filter=%5BNaN,NaN+TO+NaN,NaN%5D&a.time.gap=PT1H&a.time.limit=1&d.docs.limit=10&q.geo=%5B1,1+TO+1,1%5D&q.time=%5B2013-03-10T00:00:00+TO+2013-03-21T00:00:00%5D').respond('');
        });
        afterEach(function() {
            $httpBackend.resetExpectations();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        it('sends the export request', function() {
            $httpBackend.expectGET('/export?a.hm.filter=%5BNaN,NaN+TO+NaN,NaN%5D&a.time.gap=PT1H&a.time.limit=1&d.docs.limit=10&q.geo=%5B1,1+TO+1,1%5D&q.time=%5B2013-03-10T00:00:00+TO+2013-03-21T00:00:00%5D').respond('');
            subject.startCsvExport();
            $httpBackend.flush();
        });
        it('sends the export request with numberofDocuments', function() {
            $httpBackend.expectGET('/export?a.hm.filter=%5BNaN,NaN+TO+NaN,NaN%5D&a.time.gap=PT1H&a.time.limit=1&d.docs.limit=20&q.geo=%5B1,1+TO+1,1%5D&q.time=%5B2013-03-10T00:00:00+TO+2013-03-21T00:00:00%5D').respond('');
            subject.startCsvExport(20);
            $httpBackend.flush();
        });
        describe('no geospatial filter', function() {
            beforeEach(function() {
                spatialSpy.and.returnValue(null);
            });
            afterEach(function() {
                $httpBackend.resetExpectations();
            });
            it('does not send the export request', function() {
                subject.startCsvExport();
                expect($httpBackend.flush).toThrow();
            });
        });
        describe('error from server', function() {
            it('throws an window error', inject(function($window) {
                exportRequest.respond(401, '');
                spyOn( $window, 'alert' ).and.callFake( function() {
                    return true;
                } );
                subject.startCsvExport();
                $httpBackend.flush();
                expect($window.alert).toHaveBeenCalled();
            }));
        });
    });
    describe('#performSearch', function() {
        var exportRequest;
        beforeEach(function() {
            solrHeatmapApp.bopwsConfig = { csvDocsLimit: 10 };
            solrHeatmapApp.appConfig = { tweetsSearchBaseUrl: '/search' };
            geospatialFilter = {queryGeo: { minX: 1, maxX: 1, minY: 1, maxY: 1}};
            exportRequest = $httpBackend.when('GET', '/search?a.hm.filter=%5BNaN,NaN+TO+NaN,NaN%5D&a.time.gap=PT1H&a.time.limit=1&d.docs.limit=10&q.geo=%5B1,1+TO+1,1%5D&q.time=%5B2013-03-10T00:00:00+TO+2013-03-21T00:00:00%5D').respond('');
        });
        afterEach(function() {
            $httpBackend.resetExpectations();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        it('sends the search request', function() {
            $httpBackend.expectGET('/search?a.hm.filter=%5BNaN,NaN+TO+NaN,NaN%5D&a.time.gap=PT1H&a.time.limit=1&d.docs.limit=10&q.geo=%5B1,1+TO+1,1%5D&q.time=%5B2013-03-10T00:00:00+TO+2013-03-21T00:00:00%5D').respond('');
            subject.performSearch();
            $httpBackend.flush();
        });
        describe('has data', function() {
            var createOrUpdateHeatMapLayerSpy;
            beforeEach(function() {
                createOrUpdateHeatMapLayerSpy = spyOn(MapService, 'createOrUpdateHeatMapLayer');
            });
            describe('no a.hm data', function() {
                beforeEach(function() {
                    exportRequest.respond({});
                });
                it('does not call createOrUpdateHeatMapLayer', function() {
                    subject.performSearch();
                    $httpBackend.flush();
                    expect(createOrUpdateHeatMapLayerSpy).not.toHaveBeenCalled();
                });
            });
            describe('with a.hm data', function() {
                beforeEach(function() {
                    exportRequest.respond({ 'a.hm': '1', 'a.time': { counts: 1}});
                });
                it('does not call createOrUpdateHeatMapLayer', function() {
                    subject.performSearch();
                    $httpBackend.flush();
                    expect(createOrUpdateHeatMapLayerSpy).toHaveBeenCalled();
                });
            });
        });
        describe('no geospatial filter', function() {
            beforeEach(function() {
                spatialSpy.and.returnValue(null);
            });
            afterEach(function() {
                $httpBackend.resetExpectations();
            });
            it('does not send the export request', function() {
                subject.performSearch();
                expect($httpBackend.flush).toThrow();
            });
        });
        describe('error from server', function() {
            it('throws an window error', inject(function($window) {
                exportRequest.respond(401, '');
                spyOn( $window, 'alert' ).and.callFake( function() {
                    return true;
                } );
                subject.performSearch();
                $httpBackend.flush();
                expect($window.alert).toHaveBeenCalled();
            }));
        });
    });
});
