describe( 'InfoService', function() {
    var InfoService, uibModal;

    beforeEach( module( 'SolrHeatmapApp' ) );

    beforeEach( inject( function( _InfoService_, _$uibModal_) {

        InfoService = _InfoService_;
        uibModal = _$uibModal_;
    }));

    describe('#showInfo', function() {
        it('opens the modal info', function() {
            solrHeatmapApp.instructions = {'textsearch': 'Test'};
            var modalSpy = spyOn(uibModal, 'open');
            InfoService.showInfoPopup('textsearch');
            expect(modalSpy).toHaveBeenCalledTimes(1);
        });
    });
});
