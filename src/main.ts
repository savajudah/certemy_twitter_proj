import { Tweet, TweetMetrics, TweetTracker, TweetTrackerHeap, TweetTrackerSortedList } from "./TweetTracker";
import { stream } from "./StreamSampler";
let AsyncLock = require('async-lock');

// Create sleep helper function
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Select Type and Initialize Tweet Tracker
let tweetTracker: TweetTracker = new TweetTrackerHeap();

// Start Thread to pipe stream data to TweetTracker
stream((streamItem: any) => {
  let tweet: Tweet = {
    hashtags: [],
    text: streamItem.data.text
  }

  streamItem.data.entities.hashtags?.forEach((element: any) => {
    tweet.hashtags.push(element.tag)
  });

  tweetTracker.addTweet(tweet);
});

// Start Thread to periodically print tweet metrics data to 
(async () => {

  while (true) {
    let metrics: TweetMetrics = tweetTracker.getMetrics();
    console.log("============================");
    console.log("Total Tweets: " + metrics.tweetCount);
    console.log("Top Five Hashtags: " );
    for (let i: number = 0; i < metrics.topFiveHashtags.length; i++)
    {
      console.log("\t" + (i + 1) + ") {count: " + metrics.topFiveHashtags[i].count + ", tag: " + metrics.topFiveHashtags[i].hashtag);
    }
    await sleep(1000);
  }
})();




