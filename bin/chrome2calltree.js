#!/usr/bin/env node
var fs = require("fs");

var argparse = require("argparse");
var temp = require("temp");
var execSync = require("execSync");

// Clean up temporary files on exit
temp.track();

var chrome2calltree = require("../index.js");
var packageJson = require("../package.json");

var parser = new argparse.ArgumentParser({
    version: packageJson.version,
    addHelp: true,
    description: "Convert CPU profiles exported from Chrome to callgrind format"
});
parser.addArgument(['-o', '--outfile'], {
    'help': "Save calltree stats to OUTFILE. " +
            "If omitted, writes to standard out."
});
parser.addArgument(['-i', '--infile'], {
    'help': "Read chrome CPU profile from INFILE. " +
            "If omitted, reads from standard in."
});

var args = parser.parseArgs();

var outStream;
var inStream;

if (args.infile) {
    inStream = fs.createReadStream(args.infile);
} else {
    if (process.stdin.isTTY) {
        parser.printHelp();
        process.exit(1);
    }
    inStream = process.stdin;
}

if (args.outfile) {
    outStream = fs.createWriteStream(args.outfile);
} else {
    outStream = process.stdout;
}

var readEntireStream = function(stream, cb) {
    var buffer = "";
    stream.resume();
    stream.setEncoding("utf8");
    stream.on("data", function(chunk) {
        buffer += chunk;
    });
    stream.on("end", function() {
        cb(buffer);
    });
};

readEntireStream(inStream, function(contents) {
    chrome2calltree.chromeProfileToCallgrind(JSON.parse(contents), outStream);
    outStream.on('finish', function() {
        if (outStream !== process.stdout) {
          outStream.close();
        }
    });
    if (outStream !== process.stdout) {
      outStream.end();
    }
});
