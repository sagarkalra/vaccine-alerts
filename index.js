var rp = require('request-promise');
var dateFormat = require("dateformat");
const fs = require('fs');
require('dotenv').config()

const url = process.env.URL
const pincode = process.argv.slice(2)[0];
// console.log('myArgs: ', myArgs[0]);

const rawdata = fs.readFileSync('config.json');
const config = JSON.parse(rawdata);
const phones = config.crons[pincode];


// const pincode = "125001"
const now = new Date();
const date = dateFormat(now, "dd-mm-yyyy")
// console.log(pincode)
const options = {
  uri: url,
  method: "GET",
  qs: {
    pincode: pincode,
    date: date
  },
  headers: {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site"
  },
  json: true
};

rp(options)
.then(function(resp) {
  // console.log(resp)
  const isSlotAvailable = findSlots(resp.centers)
  console.log(isSlotAvailable)
  if(isSlotAvailable) {
    informPeople(pincode, phones)
  }
})
.catch(err => {
  console.log(err.response.body, pincode)
  logError(err.response)
})

const findSlots = (centers) => {
  let found = false
  for(let i=0; i < centers.length; i++) {
    // console.log(centers[i].name)
    const sessions = centers[i].sessions 
    for(let j=0;j<sessions.length;j++) {
      if(sessions[j].min_age_limit != 18) continue
      if(sessions.available_capacity > 0) {
        found = true
        break
      }
      // console.log(sessions[j].available_capacity)
    }
  }
  return found
}

const informPeople = (pincode, mobile) => {
  let body = {"text": "Slots available for pincode "+ pincode +". Book Now!!!"}
  const options = {
    uri: process.env.SLACK_URL,
    method: "POST",
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(body),
  }

  rp(options)
  .then(resp => {
    console.log(resp)
  })
  .catch(err => {
    console.log(err.response)
    logError(err.response)
  })
}

const logError = (err) => {
  let body = {"text": "Error in script:" + JSON.stringify(err)}
  const options = {
    uri: process.env.SLACK_URL,
    method: "POST",
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(body),
  }

  rp(options)
  .then(resp => {
    console.log(resp)
  })
  .catch(err => {
    console.log(err.response)
  })
}