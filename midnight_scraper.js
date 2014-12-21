var RSS = require('rss'),
  fs = require('fs'),
  cp = require('child_process');

var feed = new RSS({
  title: 'Caravan to Midnight',
  description: 'Caravan to Midnight',
  pubDate: new Date()
});

var worker = cp.spawn('casperjs', ['midnight_caravan_superscraper.js']);

worker.stdout.on('data', function (data) {
  var episodes = JSON.parse(data);
  episodes.forEach(function(episode) {
    feed.item({
      title: "Episode " + episode.number,
      url: "http://todo/" + episode.file,
      date: episode.date
    });
  });
});

worker.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

fs.writeFileSync("text.xml", feed.xml());
