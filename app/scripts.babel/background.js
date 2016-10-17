'use strict'

alasql.options.errorlog = true;
var AtomScraperBackground = (function(jQuery, alasql){
  /**
   * Attributes
   */
  var localDb = undefined;

  /**
   * Private Methods
   */
  var saveProfile = function(profile){
    return new Promise(function (success, reject) {

      var objToSave = {};

      var user_id = getProfileId(profile.profileUrl);

      objToSave[user_id] = profile;


      chrome.storage.local.set(objToSave, function() {
        if(chrome.runtime.lastError)
        {
          console.log('Error saving profile');
          reject(false);
          return;
        }
        console.log('Profile saved correctly');
        saveProfileToDB(profile);
        success(true);
      });
    });
  };

  var getProfileId = function (profileUrl) {
    return profileUrl.match(/\/in\/(\w|-|d|\w|á|é|í|ó|ú)*/g)[0].replace('/in/', '');
  }

  var getProfile = function(searchTerm){
    var query = '';
    if(searchTerm.profileUrl){
      var user_id = getProfileId(profileUrl);
      query = 'SELECT * FROM Profiles WHERE id = "' + user_id + '"';
    }else{
      var fieldsList = [];

      for(var field in searchTerm){
        fieldsList.push(field + " = \"" + searchTerm[field]+ "\"");
      };

      query = 'SELECT * FROM Profiles WHERE '+fieldsList.join(' AND ');

    }


    return new Promise(function (success, reject) {

      alasql.promise([
        'ATTACH INDEXEDDB DATABASE LinkedinProfiles',
        'USE LinkedinProfiles',
        query
      ])
        .then(function (result) {
          if(result[2].length > 0){
           success(result[2][0]);
          }else{
            reject(false);
          }
        })
        .catch(function (error) {
          console.log('error get Profile', error);
          reject(error);
        });


    });
  };

  var rateProfile = function(profile){
    return new Promise(function (success, reject) {
      getSettings()
        .then(function (response) {
          var settings = response.settings;

          var pointSystem = 0, ruleObj = {};
          
          // First we need to calculate the rules
          for(var rule in settings){
            ruleObj[rule] = false;
            switch (rule){
              case 'has_email':
                if(profile.email.length > 0){
                  pointSystem++;
                  ruleObj[rule] = true;
                }
                break;

              case 'has_im':
                if(profile.im.length > 0){
                  pointSystem++;
                  ruleObj[rule] = true;
                }
                break;

              case 'has_phone':
                if(profile.phone.length > 0){
                  pointSystem++;
                  ruleObj[rule] = true;
                }
                break;

              case 'has_summary':
                if(profile.summary.length > 1){
                  pointSystem++;
                  ruleObj[rule] = true;
                }
                break;

              case 'has_twitter':
                if(profile.twitter.length > 0){
                  pointSystem++;
                  ruleObj[rule] = true;
                }
                break;

              case 'is_connection':
                if(profile.isConnection){
                  pointSystem++;
                  ruleObj[rule] = true;
                }
                break;

              case 'lang_eng':
                profile.languages.map(function (language) {
                  if(language.language === "English"){
                    pointSystem++;
                    ruleObj[rule] = true;
                  }
                });
                break;

              case 'lang_esp':
                profile.languages.map(function (language) {
                  if(language.language === "Spanish"){
                    pointSystem++;
                    ruleObj[rule] = true;
                  }
                });
                break;
            };
          }
          
          var skillMatchPercentage = 0;

          if(settings && settings.hasOwnProperty("skills")){
            var skillSet = settings.skills, skillCount = [];
            if(skillSet.length > 0){

              // Now we calculate the apparition of the keywords in the profile
              skillSet.map(function (skill) {

                if(!skillCount[skill]){
                  skillCount[skill] = 0;
                }

                try{
                  var countProfile = lookForOccurrencesInText(profile.summary, skill),
                    countSkills = lookForOccurrencesInArray(profile.skills, skill),
                    countExperience = lookForOccurrencesInArray(profile.experience, skill, 'summary');

                  skillCount[skill] += countProfile + countSkills + countExperience;
                }catch (e){
                  console.log(e);
                }
              });

              // Build and send the response
              var rulesAmount = Object.keys(settings).length - 1;
              skillMatchPercentage = skillMatchPercentageCalculation(skillCount);
              console.log(skillMatchPercentage);
              success({
                rules: rulesAmount,
                rulesMatched: pointSystem,
                rulesSummary: ruleObj,
                skillMatchPercentage: skillMatchPercentage
              });

            } else {

              // Build and send the response
              var rulesAmount = Object.keys(settings).length - 1;
              success({
                rules: rulesAmount,
                rulesMatched: pointSystem,
                rulesSummary: ruleObj,
                skillMatchPercentage: []
              });

            }
          }else{
            // Build and send the response
            var rulesAmount = Object.keys(settings).length - 1;
            success({
              rules: rulesAmount,
              rulesMatched: pointSystem,
              rulesSummary: ruleObj,
              skillMatchPercentage: []
            });
          }




        })
        .catch(function (error) {
          console.log('error rating', error);
          reject(false);
        });
    });
  };

  var skillMatchPercentageCalculation = function (skillCount) {
    try{

      var alpha = 0, skillFrequencyPercentage = {}, totalPercentage, emptyHit = 0,
        resultSize = Object.keys(skillCount).length;

      // Let's calculate the total amount of occurrences
      for(var item in skillCount){
        alpha += skillCount[item];
        if(skillCount[item] === 0){
          emptyHit++;
        }
      }

      // Calculate the participation percentage of each skill
      for(var item in skillCount){
        skillFrequencyPercentage[item] = parseFloat(((skillCount[item] / alpha) * 100).toFixed(2));
      }

      totalPercentage = ((resultSize - emptyHit) * 100) / resultSize;


    }catch(e){
      console.log('error:', e);
    }

    console.log('Rating', skillFrequencyPercentage);

    return {skillFrequencyPercentage: skillFrequencyPercentage, totalPercentage: totalPercentage};
  };

  var lookForOccurrencesInArray = function (array, word, path) {
    
    var occurrences = 0;

    for(var i = 0; i < array.length; i++){
      var text = array[i];
      if(path){

        if(!array[i][path]){
          return 0;
        }
        text = array[i][path];
      }

      var regex = new RegExp(word, 'gi');
      if(text !== null){
        var temporal = (text.match(regex)||[]).length;
        occurrences = occurrences + temporal;
      }

    }

    return occurrences;
  };
  
  var lookForOccurrencesInText = function (text, word) {
    var regex = new RegExp(word, 'gi');
    var occurrences =  (text.match(regex)||[]).length;

    return occurrences;
  };

  var getAllProfiles = function(){
    return new Promise(function (success, reject) {

    });
  };

  var deleteAllProfiles = function(){
    return new Promise(function (success, reject) {

    });
  };

  var getAllCandidates = function(){
    return new Promise(function (success, reject) {
      alasql.promise([
        'ATTACH INDEXEDDB DATABASE LinkedinProfiles',
        'USE LinkedinProfiles',
        'SELECT * FROM Candidates'
      ])
        .then(function(result){
          console.log(result);
          if(result[2].length > 0){
            success(result[2]);
          }else{
            reject([]);
          }
        })
        .catch(function (error) {
          console.log('error', error);
        });
    });
  };

  var deleteAllCandidates = function(){
    return new Promise(function (success, reject) {
      alasql.promise([
        'ATTACH INDEXEDDB DATABASE LinkedinProfiles',
        'USE LinkedinProfiles',
        'DELETE FROM Candidates WHERE id IS NOT NULL'
      ])
        .then(function(result){
          console.log(result);
          success();
        })
        .catch(function (error) {
          console.log('error', error);
        });
    });
  };

  var saveSettings = function(settings){
    return new Promise(function (success, reject) {
      chrome.storage.sync.set({'settings': settings}, function() {
        if(chrome.runtime.lastError)
        {
          console.log('Error saving settings');
          reject(false);
          return;
        }
        console.log('Settings saved correctly');
        success(true);
      });
    });
  };

  var getSettings = function(){
    return new Promise(function (success, reject) {
      chrome.storage.sync.get("settings", function(data)
      {
        if(chrome.runtime.lastError)
        {
          console.log('Error getting the settings...');
          reject(false);
        }
        console.log('Settings obtained', data);
        success(data);
      });
    });
  };

  // Create the database to handle queries
  var createDatabase = function () {

    alasql.promise([
      'CREATE INDEXEDDB DATABASE IF NOT EXISTS LinkedinProfiles'
    ])
      .then(function(result){

        alasql.promise([
          'ATTACH INDEXEDDB DATABASE LinkedinProfiles'
        ])
          .then(function(result){
            alasql.promise([
              'USE LinkedinProfiles'
            ])
              .then(function(result){
                alasql.promise([
                  'CREATE TABLE IF NOT EXISTS Profiles  (' +
                  'profileUrl varchar(250),' +
                  'profileName varchar(100),' +
                  'currentProfile varchar(100),' +
                  'location varchar(250),' +
                  'isConnection boolean,' +
                  'summary text,' +
                  'experience json,' +
                  'languages json,' +
                  'skills json,' +
                  'email json,' +
                  'phone json,' +
                  'im json,' +
                  'twitter json,' +
                  'id varchar(250) PRIMARY KEY' +
                  ')',
                  'CREATE TABLE IF NOT EXISTS Candidates  (' +
                  'profileUrl varchar(250),' +
                  'profileName varchar(100),' +
                  'currentProfile varchar(100),' +
                  'location varchar(250),' +
                  'isConnection boolean,' +
                  'summary text,' +
                  'experience json,' +
                  'languages json,' +
                  'skills json,' +
                  'email json,' +
                  'phone json,' +
                  'im json,' +
                  'twitter json,' +
                  'id varchar(250) PRIMARY KEY' +
                  ')'
                ])
                  .then(function(result){
                    console.log('result creating tables', result);
                  })
                  .catch(function (error) {
                    console.log('error', error);
                  });
              })
              .catch(function (error) {
                console.log('error', error);
              });
          })
          .catch(function (error) {
            console.log('error', error);
          });

      })
      .catch(function (error) {
        console.log('error', error);
      });


  };

  // Save the profile to the local DB
  var saveProfileToDB = function (profile) {
    var user_id = getProfileId(profile.profileUrl);

    alasql.promise([
      'ATTACH INDEXEDDB DATABASE LinkedinProfiles',
      'USE LinkedinProfiles',
      'CREATE TABLE IF NOT EXISTS Profiles  (' +
      'profileUrl varchar(250),' +
      'profileName varchar(100),' +
      'currentProfile varchar(100),' +
      'location varchar(250),' +
      'isConnection boolean,' +
      'summary text,' +
      'experience json,' +
      'languages json,' +
      'skills json,' +
      'email json,' +
      'phone json,' +
      'im json,' +
      'twitter json,' +
      'id varchar(250) PRIMARY KEY' +
      ')',
      'SELECT COUNT(*) as total FROM Profiles WHERE id = "' + user_id + '"'
    ])
      .then(function(result){
        if(Array.isArray(result[3]) && result[3][0] && result[3][0].total === 0){
          console.log('Inserting profile...');
          profile.id = user_id;
          alasql.promise('INSERT INTO Profiles VALUES ?', [profile])
            .then(function (result) {
              console.log('Profile Inserted', result);
            })
            .catch(function (error) {
              console.log('Error inserting profile', error);
            });
        }else{
          console.log('Updating profile...');
          updateProfile(profile);
        }
      })
      .catch(function (error) {
        console.log('error get Profile', error);
      });



  };

  // Update profile
  var updateProfile = function(profile){
    var user_id = getProfileId(profile.profileUrl);
    var fieldsList = [], fieldsValues = [];

    for(var field in profile){
      fieldsList.push(field);
      fieldsValues.push(profile[field]);
    };

    // Set the ID
    fieldsValues.push(user_id);

    alasql('USE LinkedinProfiles', [], function(data, error){
      if(error){
        console.log('Error connecting to the DB', error);
        return;
      }

      var query = "UPDATE Profiles SET "+fieldsList.join(' = ?,')+" = ? WHERE id = ?";
      alasql.promise(query, fieldsValues)
        .then(function (result) {
          //console.log('result', result);
        })
        .catch(function (error) {
          //console.log('error', error);
        });

    });

  };

  var setProfileAsCandidate = function (profile) {
    var user_id = getProfileId(profile.profileUrl);

    return new Promise(function (success, reject) {
      alasql.promise([
        'ATTACH INDEXEDDB DATABASE LinkedinProfiles',
        'USE LinkedinProfiles',
        'CREATE TABLE IF NOT EXISTS Candidates  (' +
        'profileUrl varchar(250),' +
        'profileName varchar(100),' +
        'currentProfile varchar(100),' +
        'location varchar(250),' +
        'isConnection boolean,' +
        'summary text,' +
        'experience json,' +
        'languages json,' +
        'skills json,' +
        'email json,' +
        'phone json,' +
        'im json,' +
        'twitter json,' +
        'id varchar(250) PRIMARY KEY' +
        ')',
        'SELECT COUNT(*) as total FROM Candidates WHERE id = "' + user_id + '"'
      ])
        .then(function(result){
          if(Array.isArray(result[3]) && result[3][0] && result[3][0].total === 0){
            console.log('Inserting profile...');
            profile.id = user_id;
            alasql.promise('INSERT INTO Candidates VALUES ?', [profile])
              .then(function (result) {
                console.log('Inserting candidate:', result);
                success(true);
              })
              .catch(function (error) {
                reject(false);
              });
          }
        })
        .catch(function (error) {
          reject(false);
        });
    });
  };


  /**
   * Public Methods
   */

  /* Initialize the module*/
  var init = function(){
    //Create the new Database
    createDatabase();

    // Enable the Listener for all of the messages from the extension
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        switch (request.action){
          case 'save_profile':
            saveProfile(request.profile)
              .then(function (response) {
                sendResponse({success: true});
              })
              .catch(function (erro) {
                sendResponse({success: false});
              });
            break;

          case 'get_profile':
            getProfile(request.searchTerm)
              .then(function (response) {
                console.log('Success profile');
                sendResponse({success: true, data: response});
              })
              .catch(function (erro) {
                console.log('error profile');
                sendResponse({success: false});
              });
            break;

          case 'rate_profile':
            rateProfile(request.profile)
              .then(function (response) {
                console.log('Success profile');
                sendResponse({success: true, data: response});
              })
              .catch(function (error) {
                console.log('error profile');
                sendResponse({success: false});
              });
            break;

          case 'get_all_profiles':
            getAllProfiles();
            break;

          case 'delete_all_profiles':
            deleteAllProfiles();
            break;

          case 'save_settings':
            saveSettings(request.settings)
              .then(function (response) {
                console.log('sending response...');
                sendResponse({success: true});
              })
              .catch(function (erro) {
                sendResponse({success: false});
              });
            break;

          case 'get_settings':
            getSettings()
              .then(function (response) {
                sendResponse({success: true, data: response});
              })
              .catch(function (erro) {
                sendResponse({success: false});
              });
            break;

          case 'get_candidates':
            getAllCandidates()
              .then(function (response) {
                sendResponse({success: true, data: response});
              })
              .catch(function (erro) {
                sendResponse({success: false});
              });
            break;

          case 'delete_candidates':
            deleteAllCandidates()
              .then(function () {
                sendResponse({success: true});
              })
              .catch(function (erro) {
                sendResponse({success: false});
              });
            break;

          case 'set_profile_candidate':
            setProfileAsCandidate(request.profile)
              .then(function (response) {
                sendResponse({success: true, data: response});
              })
              .catch(function (erro) {
                sendResponse({success: false});
              });
            break;
        }

        return true;
      });
  };

  // Module public definition
  return {
    init: init
  };
})(jQuery, alasql).init();