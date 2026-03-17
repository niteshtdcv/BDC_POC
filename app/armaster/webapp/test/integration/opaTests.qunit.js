sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'armaster/test/integration/FirstJourney',
		'armaster/test/integration/pages/ARMasterList',
		'armaster/test/integration/pages/ARMasterObjectPage'
    ],
    function(JourneyRunner, opaJourney, ARMasterList, ARMasterObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('armaster') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheARMasterList: ARMasterList,
					onTheARMasterObjectPage: ARMasterObjectPage
                }
            },
            opaJourney.run
        );
    }
);