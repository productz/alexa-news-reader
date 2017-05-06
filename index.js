'use strict';
var Alexa = require('alexa-sdk');
var parser = require('rss-parser');

var APP_ID = undefined;
var SKILL_NAME = 'News Reader';

var welcomeOutput = "Let's figure out what you are interested in. What should the news headlines be about?";
var welcomeReprompt = "Let me know what the news headlines should be about.";

/***************************************
 * Skill Code
 **************************************/

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;

  alexa.registerHandlers(handlers);
  alexa.execute();
};

// Intent Handlers
var handlers = {
  'LaunchRequest': function() {
    this.emit(':ask', welcomeOutput, welcomeReprompt);
  },
  'GetNewsHeadlinesIntent': function() {
    this.emit('GetHeadlines');
  },
  'GetHeadlines': function() {
    //delegate to Alexa to collect all the required slot values
    var filledSlots = delegateSlotCollection.call(this);

    // Get the news topic from the slot
    var singleTopic = this.event.request.intent.slots.singleTopic.value;

    var allHeadlines = null;
    var speechOutput = null;

    getNewsFromGoogle(singleTopic, (allHeadlines) => {

      // Create speech output
      speechOutput = "Here are the " + singleTopic + " related headlines... " + allHeadlines;

      // Set up the Alexa Card to display in the app 
      // tellWithCard(speechOutput, cardTitle, cardContent)
      this.emit(':tellWithCard', speechOutput, SKILL_NAME, allHeadlines);
    });
  },
  'AMAZON.HelpIntent': function() {
    var speechOutput = "You can say tell me news, or, you can say exit... What can I help you with?";
    var reprompt = "What can I help you with?";
    this.emit(':ask', speechOutput, reprompt, SKILL_NAME);
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Goodbye!');
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Goodbye!');
  }
};

/***************************************
 * Helper Functions
 **************************************/

function delegateSlotCollection() {
  console.log("in delegateSlotCollection");
  console.log("current dialogState: " + this.event.request.dialogState);
  if (this.event.request.dialogState === "STARTED") {
    console.log("in Beginning");
    var updatedIntent = this.event.request.intent;
    //optionally pre-fill slots: update the intent object with slot values for which
    //you have defaults, then return Dialog.Delegate with this updated intent
    // in the updatedIntent property
    this.emit(":delegate", updatedIntent);
  } else if (this.event.request.dialogState !== "COMPLETED") {
    console.log("in not completed");
    // return a Dialog.Delegate directive with no updatedIntent property.
    this.emit(":delegate");
  } else {
    console.log("in completed");
    console.log("returning: " + JSON.stringify(this.event.request.intent));
    // Dialog is now complete and all required slots should be filled,
    // so call your normal intent handler.
    return this.event.request.intent;
  }
}

function randomPhrase(array) {
  // the argument is an array [] of words or phrases
  var i = 0;
  i = Math.floor(Math.random() * array.length);
  return (array[i]);
}

function isSlotValid(request, slotName) {
  var slot = request.intent.slots[slotName];
  //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
  var slotValue;

  //if we have a slot, get the text and store it into speechOutput
  if (slot && slot.value) {
    //we have a value in the slot
    slotValue = slot.value.toLowerCase();
    return slotValue;
  } else {
    //we didn't get a value in the slot.
    return false;
  }
}

function getNewsFromGoogle(topic, callback) {
  // Array containing news headlines
  var headlinesArray = [];
  var allHeadlines = null;
  var title = null;
  var headlineWithoutSource = null;

  // Request news headlines from Google News, for a single query
  parser.parseURL('https://news.google.com/news?q=' + topic + '&output=rss', function(err, parsed) {
    if (parsed) {
      parsed.feed.entries.forEach(function(entry) {
      	title = entry.title;
      	headlineWithoutSource = title.substring(0, title.lastIndexOf(' - '));
        headlinesArray.push(headlineWithoutSource);
      });

      // Concatenate all headlines, and remove invalid XML chars
      allHeadlines = headlinesArray.join(". Next headline: ");
      allHeadlines = allHeadlines.replace(/&/g, 'and').replace(/\*/g, '');
      callback(allHeadlines);
    }
  });
}
