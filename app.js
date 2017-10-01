const Nightmare = require('nightmare');
const nightmare = Nightmare({
  electronPath: require('electron'),
  show: true
});
const moment = require('moment');
const fs = require('fs');


const run = async () =>{
  await nightmare.goto('https://www.facebook.com/cool3c.tw/?ref=br_rs');
  
  let dataList = [];
  while(true){
    await scrollDown(nightmare);
    dataList = await getContent(nightmare);
    if(moment.utc(dataList[dataList.length-1].dateRaw, 'X').isBefore('2017-08-31')) break
  }

  /*
  fs.writeFile('res.txt', JSON.stringify(dataList, null, ' '), function(err){
    if(err) throw err;
  });
  */
  const logger = fs.createWriteStream('log.txt', {
    flags: 'a' // 'a' means appending (old data will be preserved)
  })
  
  const res = dataList
    .filter((data) => 
      moment.utc(data.dateRaw, 'X').isAfter('2017-08-31') &&
      moment.utc(data.dateRaw, 'X').isBefore('2017-09-16')
    )
    .forEach((data) => {
      try{
        let like = 0;
        const likeMacher = data.likeString.match(/ ([0-9]+) /i);
        if(likeMacher && likeMacher.length >= 2) like = parseInt(likeMacher[likeMacher.length-1]);
        like += data.likeString.split("、").length - 1;
        if (data.likeString.indexOf('以及') != -1) {
          like += 1;
        }
        const date = moment.utc(data.dateRaw, 'X').format('YYYY-MM-DD');
    
        const url = 'https://www.facebook.com'+data.path;

        logger.write(`${date} ${like} ${url}\n`);
      }catch(e){
        console.log(e);
      }
    })
  await nightmare.end();
  console.log('Done !');
}

const scrollDown = async (nightmare) => {

  const currentHeight = await nightmare.evaluate(function() {
    var scrolls = document.querySelectorAll('body');
    return scrolls[0].scrollHeight;
  });

  await nightmare.evaluate(function(currentHeight) {
    var body = document.querySelector('body');
    body.scrollTop = currentHeight;
  }, currentHeight);
}


const getContent = async (nightmare) => {
  return await nightmare.evaluate(function() {
    var res = []
    var data = document.querySelectorAll('.fbUserStory');
    if (!data) return[];
    data.forEach((content) => {
      const path = content.querySelector('.timestampContent')
        .parentNode
        .parentNode
        .getAttribute('href')

      const dateRaw = content.querySelector('.timestampContent')
        .parentNode
        .getAttribute('data-utime')
      
      const likeString = content.querySelector('.UFILikeSentenceText').textContent;
      
      res.push({ path, likeString, dateRaw });
    })
    
    return res
  });
}

run();

/*
const waitForLoading = async (nightmare) => {
  await nightmare.wait(1 * 1000);
  const isLoading = await nightmare.evaluate(function() {
    var uiMorePagerLoader = document.querySelector('.uiMorePagerLoader');
    return !uiMorePagerLoader;
  });
  return isLoading;
} 
*/
