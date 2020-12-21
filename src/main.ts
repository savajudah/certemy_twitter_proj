import { Tweet, TweetTrackerSortedList } from "./TweetTracker";
import { stream } from "./StreamSampler";
import { Queue } from "queue-typescript";

// Initialize Link to Sample Stream
// Starting with a fake stream because I don't have developer access to Twitter yet

// Create "thread" that continully pulls data from the stream and adds the
// data into some queue that we read from in the main thread

// Create "thread" that pops a tweet object off the queue, then "adds" it to 
// some collection. 

// Suppose we kept a sorted list of the top five items. This would accomplish what
// we would want, but as processing the tweets would take more time than reading them,
// we will always be lagging behind by more and more time.

// One solution for this is to batch the new inputs and find a time span what we can 
// process them in with something like a max heap, but in some sense we still need to 
// process them at a rate that rivals the speed of the input stream.

// I guess the first thing we can do is try profiling the script and seeing how fast it 
// can process data. 

let tweetQueue: Queue<Tweet>;
stream((any: any) => {
  let tweet: Tweet = {
    "hashtags" : any.entities.hashtags,
    "fullText" : any.text
  }
  tweetQueue.enqueue(tweet);
})

