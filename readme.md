# Welcome to My Twitter Stream Application

## Setup:
```bash
npm install
tsc
export BEARER_TOKEN='YOUR-TOKEN' 
```

## Run:
```bash
node ./bin/main.js
```

## Spec:

Twitter provides an API that streams a sampling of all the tweets being submitted to their platform: https://developer.twitter.com/en/docs/twitter-api/tweets/sampled-stream/introduction

Your task is to create an application that consumes the sampled stream endpoint and keeps track of:
* the total number of tweets consumed
* the top five hashtags from the stream

Some additional requirements and clarification:
* you can write this project in either java or node.js (using vanilla javascript or typescript)
* feel free to use whatever packages/modules you need in order to make the task easier
* there is no need to deploy this anywhere, running a demo on your local machine is sufficient
* the application should periodically output the data it collects/computes to the terminal, this purely a backend process and no frontend work needs to be done
* there is no need to persist any data in a database but we will discuss this topic during our pair code review
* design this application as it would have to consume the entire twitter feed (rather than just the sampled stream) - what considerations need to be made in terms of concurrency and blocking?
* twitter regularly sees about 6000 tweets/second and your application should account for this volume even though you are only consuming the sampled stream which will see about 60 tweets/second - during our review we will discuss how the application can scale to handle the volume of the full feed

The intention of this project is not to create a production ready application but rather to demonstrate how you think about code organization and scalability concerns.
