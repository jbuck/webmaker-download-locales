var fs = require("fs");
var hyperquest = require("hyperquest");
var mkdirp = require("mkdirp");
var path = require("path");
var xml2json = require("xml2json");

function parse_xml_sync(buffer) {
  return xml2json.toJson(buffer, { object: true });
}

var bucket = "http://transifex.webmaker.org.s3.amazonaws.com/";

module.exports.list_files = function(prefix, callback) {
  var url = bucket + "?prefix=" + prefix;

  var req = hyperquest.get(url);
  req.on("error", callback);
  req.on("response", function(res) {
    var bodyParts = []
    var bytes = 0;
    res.on("data", function (c) {
      bodyParts.push(c);
      bytes += c.length;
    });
    res.on("end", function() {
      var body = Buffer.concat(bodyParts, bytes);
      var json = parse_xml_sync(body);
      var files = json.ListBucketResult.Contents.map(function(content) {
        return bucket + content.Key;
      });

      callback(null, files);
    });
  });
};

module.exports.stream_url_to_file = function(url, local_path, callback) {
  var folder = path.dirname(local_path);

  mkdirp(folder, function(err) {
    if (err) {
      return callback(err);
    }

    var req = hyperquest.get(url);
    req.on("error", callback);
    req.on("response", function(res) {
      var file = fs.createWriteStream(local_path);
      file.on("error", callback);
      file.on("finish", callback);
      res.pipe(file);
    });
  });
};

module.exports.parse_xml_sync = parse_xml_sync;
