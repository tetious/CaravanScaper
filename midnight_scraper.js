var RSS = require('rss'),
  fs = require('fs'),
  config = require('./config.json'),
  moment = require('moment'),
  cp = require('child_process');

var feed = new RSS({
  title: 'Caravan to Midnight',
  description: 'Caravan to Midnight',
  pubDate: new Date()
});

function getMonth(monthYear, onComplete) {
  var worker = cp.spawn('casperjs', ['midnight_caravan_superscraper.js', monthYear, config.basePath]);

  worker.stdout.on('data', function (data) {
    onComplete(JSON.parse(data));
  });

  worker.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
}

function populateFeed(episodes) {
  episodes.forEach(function (episode) {
    var fileUrl = 'http://192.168.0.4/ctm/mp3/' + episode.file;
    feed.item({
      title: 'Episode ' + episode.number,
      description: episode.description,
      url: fileUrl,
      enclosure: {url: fileUrl, type: 'audio/mpeg'},
      date: episode.date
    });
  });
}

function saveXml() {
  fs.writeFileSync(config.basePath + 'ctm.xml', feed.xml());
}

function getNextMonth(month, episodes) {
  episodes = episodes || [];

  getMonth(month.format(), function (oneMonthEpisodes) {
      episodes = episodes.concat(oneMonthEpisodes);
      if(month.month() === moment().month())
      {
        populateFeed(episodes);
        saveXml();
      } else {
        getNextMonth(month.add(1, 'month'), episodes)
      }
    }
  );
}

// get last month's episodes for the first few days
if(moment().date() < 7) {
  getNextMonth(moment().subtract(1, 'month'));
} else {
  getNextMonth(moment());
}

