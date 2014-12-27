var casper = require('casper').create(),
  x = require('casper').selectXPath,
  config = require('config.json'),
  fs = require('fs'),
  moment = require('moment');

casper.start("http://caravantomidnight.com/show-archive/");

var currentMonthUrl = "http://caravantomidnight.com/show-archive-"
  + moment(casper.cli.get(0)).format("MMMM-YYYY/").toLowerCase();
var basePath = casper.cli.get(1);
var episodes = [];

var mp3Folder = basePath + 'mp3/';

function downloadEpisode(url, file)
{
  var mp3Filepath = mp3Folder + file;
  if(!fs.exists(mp3Filepath))
  {
    casper.download(url, mp3Filepath);
  }
}

casper.then(function () {
  casper.fillSelectors('#wma_login_form', {
    '#user_login': config.username,
    '#user_pass': config.password
  });
  casper.click('#wp-submit');
});

casper.thenOpen(currentMonthUrl);

casper.then(function () {
  var blocks = casper.getElementsInfo('div.content-column');
  var episodeBlocks = casper.getElementsInfo(x('//div[contains(@class,"content-column")]/p[last()]'));

  if(blocks.length !== episodeBlocks.length)
  {
    casper.exit("Oh noes.");
  }

  for(var i=0; i < blocks.length; i++)
  {
    var episodeDescription = blocks[i].html.split('<p>')[0];
    var episodeNumber = /Ep. (\d+) /.exec(episodeDescription)[1];
    var mp3RegexMatches = /(http.+\.mp3)\".+>(.+) \(Full MP3\)/.exec(episodeBlocks[i].html);
    var mp3FileUrl = mp3RegexMatches[1];

    episodes.push({
      number: episodeNumber,
      description: episodeDescription,
      file: 'episode_' + episodeNumber + '.mp3',
      date: new Date(mp3RegexMatches[2])
    });

    downloadEpisode(mp3FileUrl, 'episode_' + episodeNumber + '.mp3');
  }

  casper.echo(JSON.stringify(episodes));
});

casper.run();