let AsyncLock = require('async-lock');
import { Heap } from 'heap-js';

// Define Interface Types
export interface TweetTracker {
  addTweet(tweet: Tweet) : void;
  getMetrics() : TweetMetrics;
}

export interface HashtagData {
  hashtag: string;
  count: number;
}

export interface Tweet {
  hashtags: string[];
  text: string;
}

export interface TweetMetrics {
  tweetCount: number,
  topFiveHashtags: HashtagData[]
}


// Heap Implementation - Calculate Metrics when Requested
export class TweetTrackerHeap implements TweetTracker {
  private lock;
  private _mapTotalHashtagCounts: Map<string, number>;
  private _mapRecentHashtagCounts: Map<string, number>;
  private _mapRecentTopFiveHashtags: Map<string, number>; 
  private _tweetTotal: number;

  constructor() {
    this._mapTotalHashtagCounts = new Map<string, number>();
    this._mapRecentHashtagCounts = new Map<string, number>();
    this._mapRecentTopFiveHashtags = new Map<string, number>();
    this._tweetTotal = 0;
    this.lock = new AsyncLock();
  }

  addTweet(tweet: Tweet) : void
  {
    this.lock.acquire([this._mapRecentHashtagCounts, this._tweetTotal], () => {
      this._tweetTotal++;
      tweet.hashtags.forEach(hashtag => {
        
        let newCount = 1;
        if(this._mapTotalHashtagCounts.has(hashtag))
        {
          newCount = this._mapTotalHashtagCounts.get(hashtag)! + 1;
        }

        this._mapTotalHashtagCounts.set(hashtag, newCount);
        this._mapRecentHashtagCounts.set(hashtag, newCount);

      });
    });
  }

  getMetrics() : TweetMetrics
  {
    let tweetTotalSnapShot: number = 0;
    let mapRecentHashtagCountsSnapshot: Map<string, number> = new Map<string, number>();

    // Grab snapshots of total tweets and recently seen hashtags. Then clear 
    // the buffer of recently seen hashtags so other threads can keep adding 
    // tweets while we analyze the new data.
    this.lock.acquire([this._mapRecentHashtagCounts, this._tweetTotal], () => {
      tweetTotalSnapShot = this._tweetTotal;
      // I would like to do a reference swap here, but I'm not sure how...
      this._mapRecentHashtagCounts.forEach((count: number, hashtag: string) => {
        mapRecentHashtagCountsSnapshot.set(hashtag, count);
      });
      this._mapRecentHashtagCounts.clear();
    });

    // Ensure our previous top five hashtags are included in our comparison set
    this._mapRecentTopFiveHashtags.forEach((count: number, hashtag: string) => {
      if (!mapRecentHashtagCountsSnapshot.has(hashtag))
      {
        mapRecentHashtagCountsSnapshot.set(hashtag, count);
      }
    });
    this._mapRecentTopFiveHashtags.clear();
    
    // Extract top five using a heap and then sort - O(k + (n-k)Logk + kLogk) and since k is 5, this comes to O(n):
    // where n is the number of distinct hashtags recently seen and yet to be processed
    let topFive: [string, number][] = Heap.nlargest(5, mapRecentHashtagCountsSnapshot.entries(), (pairA: [string, number], pairB: [string, number]) => pairB[1] - pairA[1]);
    topFive.sort((pairA: [string, number], pairB: [string, number]) => pairB[1] - pairA[1]);

    // Format output in HashtagData interface
    let topFiveHashtagData: HashtagData[] = [];
    topFive.forEach((pair: [string, number]) => {
      topFiveHashtagData.push({
        hashtag: pair[0],
        count: pair[1]
      });
      
      // Save results for inclusion in next metrics retreival
      this._mapRecentTopFiveHashtags.set(pair[0], pair[1]);
    });

    return {
      tweetCount: tweetTotalSnapShot,
      topFiveHashtags: topFiveHashtagData
    };
  }
}

// Maintained Sorted List Implementation
export class TweetTrackerSortedList implements TweetTracker {
  readonly lock = new AsyncLock();
  private _map: Map<string, HashtagData>;
  private _tweetCount: number;
  private _topFive: HashtagData[];
  private readonly _nullHashtagData: HashtagData = 
    {
      hashtag : " ",
      count : 0
    };
  
  constructor() {
    this._map = new Map<string, HashtagData>();
    this._tweetCount = 0;
    this._topFive = [
      this._nullHashtagData,
      this._nullHashtagData,
      this._nullHashtagData,
      this._nullHashtagData,
      this._nullHashtagData,
    ];
  }

  addTweet(tweet: Tweet) : void
  {
    this.lock.acquire(this, () => { 
      this._tweetCount++;
      tweet.hashtags.forEach(hashtag => {
        this.incrementHashtagCount(hashtag);

        let i = this.findHashtagInTopFive(hashtag);
        if (i >= 0)
        {
          this._topFive[i] = {
            hashtag : hashtag,
            count : this._topFive[i].count + 1
          }
          this.bubbleUp();
        }
        else if (this._map.get(hashtag)?.count! >= this._topFive[this._topFive.length - 1].count)
        {
          this._topFive[this._topFive.length - 1] = this._map.get(hashtag)!;
          this.bubbleUp();
        }
      });
    });
  }

  private bubbleUp() : void
  {
    for (let i: number = (this._topFive.length - 1); i > 0; i--)
    {
      if (this._topFive[i].count >= this._topFive[i - 1].count) {
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

  getMetrics() : TweetMetrics {
    let topFiveHashtagCopy: HashtagData[] = [];
    let count: number = 0;

    this.lock.acquire(this, () => {
      this._topFive.forEach(val => topFiveHashtagCopy.push({
        count: val.count,
        hashtag: val.hashtag
      }));
      count = this._tweetCount;
    });

    return {
      tweetCount: count,
      topFiveHashtags: topFiveHashtagCopy
    }
  }
}

