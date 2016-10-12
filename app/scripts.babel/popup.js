'use strict'

var AtomScraperBackground = (function(jQuery, alasql){
  /**
   * Attributes
   */
  var candidatesList;

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

  var saveSettings = function (settings) {
    return new Promise(function (success, reject) {
      chrome.runtime.sendMessage({action: "save_settings", settings: settings}, function(response) {
        if(response.success){
          success(true);
        }else{
          reject(false);
        }
      });
    });
  };

  var getSettings = function () {
    console.log('getting settings...');
    return new Promise(function (success, reject) {
      chrome.runtime.sendMessage({action: "get_settings"}, function(response) {
        if(response.success){
          success(response.data);
        }else{
          reject(false);
        }
      });
    });
  };

  var getCandidates = function () {
    return new Promise(function (success, reject) {
      chrome.runtime.sendMessage({action: "get_candidates"}, function(response) {
        if(response.success){
          success(response.data);
        }else{
          reject(false);
        }
      });
    });
  };

  var deleteAllCandidates = function () {
    return new Promise(function (success, reject) {
      chrome.runtime.sendMessage({action: "delete_candidates"}, function(response) {
        if(response.success){
          success(response.data);
        }else{
          reject(false);
        }
      });
    });
  };

  var renderSettings = function (settings) {
    try{
      for(var setting in settings){
        if(setting != 'skills'){
          $('#' + setting).prop('checked', true);
        }else{

          $.each(settings[setting], function (index, value) {
            $("#skills_list").tagsinput('add', value);
          })
        }
      }
    }catch(e){
      console.log(e);
    }

  };

  var renderCandidates = function(candidates){
    var candidatesContainer = $('#candidates');
    candidatesList = candidates;
    if(candidates.length > 0){
      $(candidatesContainer).html(
        '<p>You have selected '+candidates.length+' Candidates</p>' +
        '<button type="button" id="downloadProfiles" class="btn btn-success btn-lg btn-block">Download all Candidates in Excel</button>' +
        '<button type="button" id="clearAllProfiles" class="btn btn-danger btn-lg btn-block">Clear All Candidates</button>'
      );
    }else{
      $(candidatesContainer).html('<p>You have not selected any candidates</p>');
    }
  };

  /* Setup de popup listener*/
  var setPopupListeners = function(){
    // Set the button listener
    jQuery('#save_skills').on('click', function(){
      var settingsObj = {
        skills: $("#skills_list").tagsinput('items')
      }

      $('.checkbox input:checked').each(function (index, setting) {
        var settingName = $(setting).attr('id');
        settingsObj[settingName] = true;
      });

      waitingDialog.show('Saving your settings...', {dialogSize: 'sm', progressType: 'success'});

      saveSettings(settingsObj)
        .then(function (result) {
          waitingDialog.hide();
        })
        .catch(function (error) {
          waitingDialog.hide();
        });
    });


    // Initialize the tagsInput library
    $('#skills_list').tagsinput({
      allowDuplicates: false
    });

    // Enable the listener to the Before tag Add
    $('#skills_list').on('beforeItemAdd', function(event) {
      $('#message_box').html();
    });

    $('#candidates').on('click', '#downloadProfiles', function (event) {
      event.preventDefault();
      var dataToExport = formatCandidatesList(candidatesList);
      var time = moment().format('YYYY_mm_DD_hh_mm_ss').toString();
      alasql.promise('SELECT * INTO XLSX("candidates_'+time+'.xlsx",{headers:true}) FROM ?', [dataToExport])
        .then(function(data){
          console.log('Data saved');
        }).catch(function(err){
          console.log('Error:', err);
        });
    });

    $('#candidates').on('click', '#clearAllProfiles', function (event) {
      event.preventDefault();
      deleteAllCandidates()
        .then(function (response) {
          if(response.success){
            $('#candidates').html('<p>You have not selected any candidates</p>');
          }else{
            $('#candidates').html('<p>Error while trying to delete your candidate list, please try again later</p>');
          }
        })
        .catch(function (error) {
          $('#candidates').html('<p>Error while trying to delete your candidate list, please try again later</p>');
        });
    });
  };

  var formatCandidatesList = function (candidates) {
    var returnList = [];

    candidates.map(function (candidate) {

      var totalWorkedMonths = 0, languages = [];

      // Calculate the years of experience
      candidate.experience.map(function (experience) {
        totalWorkedMonths += experience.totalMonths;
      });

      // Clean up the Languages
      candidate.languages.map(function (language) {
        var level =  language.level? '(' + language.level  + ')' : '';
        languages.push(language.language + level);
      });

      var objTemp = {
        'Candidate Name': candidate.profileName,
        'Profile URL': candidate.profileUrl,
        'Years Of Experience': (totalWorkedMonths / 12).toFixed(2),
        'Current Profile': candidate.currentProfile,
        'Summary': candidate.summary,
        'Skillset': candidate.skills.join(),
        'Email': candidate.email.join(),
        'Languages': languages.join(),
        'Current Location': candidate.location,
        'Phone': candidate.phone.join(),
        'Is Connection': candidate.isConnection? 'Yes': 'No',
        'Twitter': candidate.twitter.join(),
        'IM': candidate.im.join()
      };

      returnList.push(objTemp);

    });

    return returnList;
  };

  /**
   * Public Methods
   */

  /* Initialize the module*/
  var init = function(){
    initializeListeners();
    getSettings()
      .then(function (response) {
        renderSettings(response.settings);
      })
      .catch(function (error) {
        alert('There was a problem obtaining your settings, please reload the extension.');
      });

    getCandidates()
      .then(function (response) {
        renderCandidates(response);
      })
      .catch(function (error) {
        console.log(error);
        $('#candidates').html('<p>You have not selected any candidates</p>');
      });
  };

  // Module public definition
  return {
    init: init
  };
})(jQuery, alasql).init();