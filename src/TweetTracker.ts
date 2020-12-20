
// Define Interface Types
export interface TweetTrackerInterface {
  addTweet(tweet: Tweet) : void;
  getTopFiveHashtags() : HashtagData[];
  getTotalTweetCount() : number;
}

export interface HashtagData {
  hashtag: string;
  count: number;
}

export interface Tweet {
  hashtags: string[];
  fullText: string;
}


// Maintained Sorted List Implementation

class TweetTrackerSortedList implements TweetTrackerInterface {
  private _map: Map<string, HashtagData>;
  private _tweetCount: number;
  private _topFive: HashtagData[];
  private readonly _nullHashtagData: HashtagData = 
    {
      "hashtag" : " ",
      "count" : 0
    };
  
  constructor() {
    this._map = new Map<string, HashtagData>();
    this._tweetCount = 0;
    this._topFive = [
      this._nullHashtagData,
      this._nullHashtagData,
      this._nullHashtagData,
      this._nullHashtagData,
      this._nullHashtagData
    ];
  }

  addTweet(tweet: Tweet) : void
  {
    this._tweetCount++;
    for (let hashtag in tweet.hashtags)
    {
      this.incrementHashtagCount(hashtag);
      let i = this.findHashtagInTopFive(hashtag);
      if (i >= 0)
      {
        this._topFive[i] = {
          "hashtag" : hashtag,
          "count" : this._topFive[i].count + 1
        }
      }
      else if (this._map.get(hashtag)?.count! >= this._topFive[-1].count)
      {
        this._topFive[-1] = this._map.get(hashtag)!;
        this.bubbleUp();
      }
    }
  }

  bubbleUp() : void
  {
    for (let i: number = this._topFive.length - 1; i > 0; i--)
    {
      if (this._topFive[i].count > this._topFive[i - 1].count)
      {
        // swap
        let temp = this._topFive[i];
        this._topFive[i] = this._topFive[i - 1];
        this._topFive[i - 1] = temp;
      }
    }
  }

  findHashtagInTopFive(hashtag: string) : number
  {
    for (let i: number = 0; i < this._topFive.length; i++)
    {
      if (this._topFive[i].hashtag == hashtag)
      {
        return i;
      }
    }
    return -1;
  }

  incrementHashtagCount(hashtag: string) : void
  {
    if (!this._map.has(hashtag))
    {
      this._map.set(hashtag, { "hashtag": hashtag, "count": 0 })
    }
    let temp: (HashtagData | undefined) = this._map.get(hashtag);
    temp!.count = temp!.count + 1;
    this._map.set(hashtag, temp!);
  }

  getTopFiveHashtags() : HashtagData[]
  {
    return this._topFive;
  }

  getTotalTweetCount() : number
  {
    return this._tweetCount;
  }
}

