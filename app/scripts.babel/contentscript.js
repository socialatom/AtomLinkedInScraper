'use strict';

var AtomScraperContent = function (jQuery, MutationSummary) {
  /**
   * Global attributes
   */
  var isSearchPage = true, resultsContainer, resultsPaginator, profileContainer;

  /**
   * Private Methods
   */
  var enableListeners = function () {
    jQuery(resultsContainer).find('.atom-download-profile').on('click', function (event) {
      event.preventDefault();
      var r=confirm("The download process is going to take you to the profile and come back, " +
        "please do not interact with the browser. Do you want to continue?");
      if (r==true)   {
        window.location = $(this).attr('href');
      }
    });
  };

  var enableObservers = function(){
    console.log('Enabling the observers');

    if(isSearchPage){
      //Is search page
      // When the user clicks the pagination button
      var observePageNumberChange = new MutationSummary({
        callback: observePaginationHandler,
        rootNode: document.getElementById('results-pagination'),
        queries: [
          {
            element: 'li.link',
            elementAttributes: 'class'
          }
        ]
      });
    }else{
      // Is profile page
    }

  };

  var addElements = function () {

    var imgURL = chrome.extension.getURL('images/sa-ventures-16x16.png');

    // Is search page
    if(isSearchPage){

      jQuery.each(jQuery(resultsContainer).find('.result'),function (index, result) {

        // Get the profile URL
        var profileUrl = jQuery(result).find('.title.main-headline').attr('href');

        // Add the download button
        var buttonSaveProfile = "<a class='primary-action-button label atom-download-profile' " +
          "href='"+profileUrl + "&atomGetProfile=true&atomReturnToSearch=true" +"'>" +
          "<img src='"+imgURL+"'> Get Profile" +
          "</a>";

        $(result).find('.srp-actions').append(buttonSaveProfile);
      });
    }else{
      // Is profile page

      // Get the profile URL
      var profileUrl = window.location.href.replace(/&atomGetProfile=true/g, "");
      var profileName = $(profileContainer).find('#top-card #name-container .full-name').html();

      // Add the download button
      var buttonSaveProfile = "<a class='button-primary atom-download-profile' " +
        "href='"+profileUrl + "&atomGetProfile=true" +"'>" +
        "<img src='"+imgURL+"'> Get "+profileName+"'s Profile" +
        "</a>";

      $(profileContainer).find('#top-card .profile-aux .profile-actions').append(buttonSaveProfile);
    }
  };

  // Observer functions
  var observePaginationHandler = function(changes){
    addElements();
  };

  // Get the experience details
  var getExperience = function () {
    var experienceObject = [];
    $.each($(profileContainer).find("#background #background-experience > div"), function (index, experience) {

      // Get the experience information from all of the positions available
      var expObject = {};

      expObject.position = $(experience).find('header h4 a').html();
      expObject.company = $(experience).find('header h5 span strong a').html();

      if(!expObject.company){
        expObject.company = $(experience).find("header h5 a[name='company']").html();
      }

      var periodDate = $(experience).find('.experience-date-locale time');

      if(periodDate[0]){
        expObject.startDate = periodDate.get(0).textContent;
      }

      if(periodDate[1]){
        expObject.endDate = periodDate.get(1).textContent;
      }else{
        expObject.endDate = moment().format('MMMM YYYY').toString();
      }

      expObject.totalMonths = moment(expObject.endDate).diff(moment(expObject.startDate), 'months') + 1;

      expObject.summary = $(experience).find('.description').html();

      experienceObject.push(expObject);
    });

    return experienceObject;
  };

  // Get the skills detail
  var getSkills = function () {
    var skillsObject = [];

    $.each($(profileContainer).find('#background-skills-container .skill-pill'), function(index, skill){
      skillsObject.push($(skill).find('.endorse-item-name-text').html());
    });

    return skillsObject;
  };

  // Get the list of languages
  var getLanguages = function () {
    var langObject = [];

    $.each($(profileContainer).find('#background-languages-container .section-item'), function(index, language){
      langObject.push({
        language: $(language).find('h4 span').html(),
        level: $(language).find('.languages-proficiency').html()
      });
    });

    return langObject;
  };

  // Get the list of emails if available
  var getEmails = function () {
    var emailList = [];

    $.each($(profileContainer).find('div#top-card div#contact-info-section div#email div#email-view ul li a'), function(index, email){
      if(email.textContent){
        emailList.push(email.textContent);
      }
    });

    return emailList;
  };

  // Get the list of phone numbers if available
  var getPhoneNumbers = function () {
    var phonesList = [];

    $.each($(profileContainer).find('div#top-card div#contact-info-section div#phone div#phone-view ul li'), function(index, phone){
      if(phone.textContent){
        phonesList.push(phone.textContent);
      }
    });

    return phonesList;
  };

  // Get the list of IM if available
  var getIM = function () {
    var imList = [];

    $.each($(profileContainer).find('div#top-card div#contact-info-section div#im div#im-view ul li'), function(index, im){
      if(im.textContent){
        imList.push(im.textContent);
      }
    });

    return imList;
  };

  // Get the list of Twitter accounts if available
  var getTwitter = function () {
    var twitterList = [];

    $.each($(profileContainer).find('div#top-card div#contact-info-section div#twitter div#twitter-view ul li'), function(index, im){
      if(im.textContent){
        twitterList.push(im.textContent);
      }
    });

    return twitterList;
  };

  // Download the current profile
  var downloadProfile = function () {
    // Get the profile information
    var profile = {
      profileUrl : getHtmlFromElement('#top-card .public-profile dd a'),
      profileName : getHtmlFromElement('#top-card #name-container .full-name'),
      currentProfile : getHtmlFromElement('#top-card #headline-container .title'),
      location: getHtmlFromElement('div#top-card div.profile-overview-content div#demographics div#location-container div#location .locality a'),
      isConnection : getHtmlFromElement('#relationships_bar').length > 1 ? true: false,
      summary : getHtmlFromElement('#background .summary .description'),
      experience : getExperience(),
      languages : getLanguages(),
      skills : getSkills(),
      email: getEmails(),
      phone: getPhoneNumbers(),
      im: getIM(),
      twitter: getTwitter()
    };

    console.log(profile);

    if(window.location.href.search('&atomReturnToSearch=true') != -1 ){
      //window.location.href = $.cookie("lastSearchUrl") + "&atomDownloadCompleted=true";
    }
  };

  var getHtmlFromElement = function (elemtent) {
    var element = $(profileContainer).find(elemtent);

    return element.text() || '-';
  }

  /**
   * Public Methods
   */
  /* Initialize the module*/
  var init = function init() {

    chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
      console.log(response.farewell);
    });

    // Define if the current page is Search
    isSearchPage = window.location.href.startsWith('https://www.linkedin.com/vsearch')? true : false;

    console.log('Working on search Page?', isSearchPage);

    // Initialize when DOM is ready
    jQuery(document).ready(function ($) {

      // Define the scope to run JQuery searches on
      if(isSearchPage){

        if(window.location.href.search('&atomDownloadCompleted=true') != -1 ){
          alert('Profile downloaded successfully');
        }

        if(window.location.href.search('&atomDownloadCompleted=false') != -1 ){
          alert('Profile downloaded successfully');
        }

        $.cookie("lastSearchUrl", window.location.href, {path:"/"});
        resultsContainer = $('#results-container');
        resultsPaginator = $('#results-pagination');
      }else{
        profileContainer = $('#wrapper');
      }

      // Add elements
      addElements();

      // Enable all listeners
      enableListeners();

      // Enable Observers
      enableObservers();

      // Is profile to download?
      if(!isSearchPage && window.location.href.search('&atomGetProfile=true') != -1){
        downloadProfile();
      }
    });

  };

  // Module public definition
  return {
    init: init
  };
}(jQuery, MutationSummary).init();
