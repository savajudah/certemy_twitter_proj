

export interface TweetTrackerInterface {
  addTweet(tweet: Tweet) : void;
  getTopFiveHashtags() : HashtagCount[];
  getTotalTweetCount() : number;
}

export interface HashtagCount {
  hashtag: string;
  count: number;
}

export interface Tweet {
  hashtags: string[];
  full_text: string;
}