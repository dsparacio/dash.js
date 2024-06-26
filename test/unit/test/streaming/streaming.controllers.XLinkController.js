import DashParser from '../../../../src/dash/parser/DashParser.js';
import URLUtils from '../../../../src/streaming/utils/URLUtils.js';
import XlinkController from '../../../../src/streaming/controllers/XlinkController.js';
import Events from '../../../../src/core/events/Events.js';
import EventBus from '../../../../src/core/EventBus.js';
import ErrorHandlerMock from '../../mocks/ErrorHandlerMock.js';
import DebugMock from '../../mocks/DebugMock.js';
import FileLoader from '../../helpers/FileLoader.js';

import chai from 'chai';
const expect = chai.expect;

const context = {};
const eventBus = EventBus(context).getInstance();

describe('XlinkController', function () {
    let xLinkController;
    let errorHandlerMock = new ErrorHandlerMock();


    function parseManifest(url, xml, xlinkController) {
        let urlUtils = URLUtils(context).getInstance();
        let baseUri = urlUtils.parseBaseUrl(url);
        let parser = DashParser(context).create({
            debug: new DebugMock(),
            errorHandler: errorHandlerMock
        });
        const manifest = parser.parse(xml, xlinkController);

        if (manifest) {
            manifest.url = url;

            // URL from which the MPD was originally retrieved (MPD updates will not change this value)
            if (!manifest.originalUrl) {
                manifest.originalUrl = manifest.url;
            }

            manifest.baseUri = baseUri;
            return manifest;
        }
        return null;
    }

    beforeEach(function () {
        xLinkController = XlinkController(context).create({});
    });

    afterEach(function () {
        xLinkController.reset();
        xLinkController = null;
    });

    it('should resolve manifest on load', function (done) {
        let manifest;
        function onXLinkReady(e) {
            eventBus.off(Events.XLINK_READY, onXLinkReady, this);
            expect(e.manifest.url).to.equal('https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd');
            done();
        }
        eventBus.on(Events.XLINK_READY, onXLinkReady, this);

        FileLoader.loadTextFile('/data/dash/manifest.xml')
            .then((xml) => {
                manifest = parseManifest('https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd', xml, xLinkController);
                xLinkController.resolveManifestOnLoad(manifest);
            })
            .catch((e) => {
                done(e);
            })
    });
});
