sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'arequest/test/integration/FirstJourney',
		'arequest/test/integration/pages/ARChangeLogList',
		'arequest/test/integration/pages/ARChangeLogObjectPage'
    ],
    function(JourneyRunner, opaJourney, ARChangeLogList, ARChangeLogObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('arequest') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheARChangeLogList: ARChangeLogList,
					onTheARChangeLogObjectPage: ARChangeLogObjectPage
                }
            },
            opaJourney.run
        );
    }
);