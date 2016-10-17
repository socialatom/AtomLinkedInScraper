![Socialatom Group](http://i2.wp.com/socialatomventures.com/wp-content/uploads/2016/08/savBlack.png?w=400 "Socialatom Group")

#Socialatom LinkedIn Scraper
Socialatom Group is always looking for ways to make things easier for Startups, and one of the hardest processes for any tech company is the Candidates Selection for Recruiting; that's why we have developed this extension that works as a complement for LinkedIn, incorporating numerical measures and visual components to make it easier to pick the profiles to fit your need.

##Download the extension Here!
You can download the latest version of the extension (0.0.2) [here] (https://github.com/socialatom/AtomLinkedInScraper/raw/master/versions/AtomLinkedInScraper-0.0.2.zip)

###How to use it
Before you use it first enable the [developer mode in chrome] (https://developer.chrome.com/extensions/faq#faq-dev-01), to do this follow this instructions.

![Enable Dev Mode](https://raw.githubusercontent.com/socialatom/AtomLinkedInScraper/master/images/enable_dev_mode.gif "Enable Dev Mode")

After enabling the developer mode, you should unpack the downloaded file (AtomLinkedInScraper-0.0.X.zip) and in the "Extensions" window, load it as an unpacked extension, like this_

![Load Extension](https://raw.githubusercontent.com/socialatom/AtomLinkedInScraper/master/images/load_extension.gif "Load Extension")

Once you add the extension it will automatically add the AtomLinkedInScraper button, where you can write what you are looking for in each candidate, and set some rules to keep in mind:

![Extension Button](https://raw.githubusercontent.com/socialatom/AtomLinkedInScraper/master/images/button.png "Extension Button")

Simply add the extension in developer mode, enable it and run any search on LinkedIn, on each of the results you'll find a set of new buttons to interact with the profile.

![Extension Buttons](https://raw.githubusercontent.com/socialatom/AtomLinkedInScraper/master/images/action_buttons.png "Extension Buttons")

Also, when you use the search profile it will add the action buttons and once you "Get the profile" it will show you the Candidate rating and you'll be able to select him/her as a candidate:

![Extension Buttons](https://raw.githubusercontent.com/socialatom/AtomLinkedInScraper/master/images/rating.png "Extension Buttons")

After you select the list of candidates you'll be able to download them in an Excel format:

![Download in Excel](https://raw.githubusercontent.com/socialatom/AtomLinkedInScraper/master/images/download_excel.png "Download in Excel")

##How to work with the repo?
This extension is based on the Yeoman Google Chrome extension Generator (https://github.com/yeoman/generator-chrome-extension).

To use this repo, please:

```sh
# Transform updated source written by ES2015 (default option)
gulp babel

# or Using watch to update source continuously
gulp watch

# Make a production version extension
gulp build
```

## Test Chrome Extension

To test, go to: chrome://extensions, enable Developer mode and load app as an unpacked extension.

Need more information about Chrome Extension? Please visit [Google Chrome Extension Development](http://developer.chrome.com/extensions/devguide.html)