'use strict'

var AtomScraperBackground = (function(jQuery, alasql){
  /**
   * Attributes
   */


  /**
   * Private Methods
   */
  /* Initialize listeners for the popup*/
  var initializeListeners = function () {
    // Everything after the Popup is ready
    $(document).ready(function () {
      setPopupListeners();
    });
  };

  /* Setup de popup listener*/
  var setPopupListeners = function(){
    // Set the button listener
    jQuery('#extractInfoBtn').on('click', function(){

    });
  };

  /**
   * Public Methods
   */

  /* Initialize the module*/
  var init = function(){
    initializeListeners();
  };

  // Module public definition
  return {
    init: init
  };
})(jQuery, alasql).init();