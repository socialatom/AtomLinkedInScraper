'use strict'

var AtomScraperBackground = (function(jQuery, alasql){
  /**
   * Attributes
   */

  /**
   * Private Methods
   */


  /**
   * Public Methods
   */

  /* Initialize the module*/
  var init = function(){
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        chrome.storage.sync.set({'value': 'thevalue'}, function() {
          // Notify that we saved.
          console.log('Settings saved');
        });

        chrome.storage.sync.get(['value']), function (value) {
          console.log('Saved in the store: ', value);
        };
        if (request.greeting == "hello")
          sendResponse({farewell: "goodbye"});
      });
  };

  // Module public definition
  return {
    init: init
  };
})(jQuery, alasql).init();