let AsyncLock = require('async-lock');

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
export class TweetTrackerSortedList implements TweetTrackerInterface {
  readonly mapLock = new AsyncLock();
  readonly mapKey = "mapKey";
  private _map: Map<string, HashtagData>;

  readonly countLock = new AsyncLock();
  readonly countKey = "mapKey";
  private _tweetCount: number;

  readonly topFiveLock = new AsyncLock();
  readonly topFiveKey = "mapKey";
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
    this.countLock
    this._tweetCount++;
    for (let hashtag in tweet.hashtags)
    {
      this.mapLock.acquire(this.mapKey, () => {
        this.incrementHashtagCount(hashtag);
      })

      this.topFiveLock.acquire(this.topFiveKey, () => {
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
      });
    }
  }

  private bubbleUp() : void
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

  private findHashtagInTopFive(hashtag: string) : number
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

  private incrementHashtagCount(hashtag: string) : void
  {
    if (!this._map.has(hashtag))
    {
      this._map.set(hashtag, { "hashtag": hashtag, "count": 0 })
    }
    this._map.get(hashtag)!.count++;
  }

  getTopFiveHashtags() : HashtagData[]
  {
    let output: HashtagData[];
    await this.topFiveLock.acquire(this.topFiveKey, () => {
      this._topFive.forEach(val => output.push(Object.assign({}, val)));
    });
    return output;
  }

  getTotalTweetCount() : number
  {
    this.countLock.acquire(this.countKey, () => {
      return this._tweetCount;
    });
  }
}

