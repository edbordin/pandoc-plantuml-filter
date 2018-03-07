var pandoc = require('pandoc-filter');
var fs = require('fs');
var execSync = require("child_process").execSync;
var path = require('path');
var util = require('util');
var crypto = require('crypto');

var imgCounter = 0;
var tempDirName = ".temp";

function filterPlantuml(type, value, format, meta) {
    if (type !== 'CodeBlock') {
        return null;
    }

    var cls = value[0][1];
    if (0 > cls.indexOf('plantuml')) {
        return null;
    }

    var umlText = value[1];
    
    var lines = umlText.split(/\r?\n/);
    
    // use the SHA256 hash of the plantuml code to detect whether we need to re-render this diagram or not
    // this is not perfect since:
    // 1. It doesn't account for external included files changing
    // 2. It doesn't clean up after itself
    // Both of those problems can be fixed by deleting the temp folder manually
    
    var fileName = util.format("%s.png", crypto.createHash('sha256').update(umlText).digest("hex"));
    var filePath = path.join(tempDirName, fileName);
    
    var caption = [];
    var figname = 'fig:'+fileName;
    
    // if there is at least one line before @startuml, use this as the caption for the generated image
    if (lines.length > 0 && 0 > lines[0].indexOf('@startuml')) {
        caption = [pandoc.Str(lines[0])];
    }
    
    // if there are at least two lines before @startuml, use the second (with 'fig:' prepended) as the figure name for the generated image
    if (lines.length > 1 && 0 > lines[1].indexOf('@startuml')) {
        figname = lines[1];
    }
    
    if (!fs.existsSync(filePath)) {
        var plantumlPath = path.join(__dirname, "plantuml.1.2018.0.jar");
        var res = execSync(util.format("java -splash:no -jar \"%s\" -charset UTF-8 -tpng -pipe", plantumlPath), { input: umlText });
        fs.writeFileSync(filePath, res);
    }

    var res = pandoc.Para(
        [
            pandoc.Image(
                [figname, [], []],
                caption, // Description under image
                [filePath, 'fig:' /* hint */])
        ]);
    return res;
}

// var data = JSON.parse(json);
// var format = (process.argv.length > 2 ? process.argv[2] : '');
// var output = filter(data, action, format);
// process.stdout.write(JSON.stringify(output));


// [sberkov] kept for tests
//
// var data = require("./1.json");
// var res = pandoc.filter(data, filterPlantuml, "");
// var strRes = JSON.stringify(res);
// 
// fs.writeFile("2.json", strRes, function (err) {
//     if (err) {
//         return console.log(err);
//     }
// 
//     console.log("The file was saved!");
// }); 

if (!fs.existsSync(tempDirName)) {
        fs.mkdirSync(tempDirName);
    }
    
// this code cleans up the whole temp folder
// [edbordin] TODO: modify this to just remove the generated images that are no longer used and uncomment it
// for (const file of fs.readdirSync(tempDirName)) {
    // fs.unlink(path.join(tempDirName, file), err => {
      // if (err) throw err;
    // });
  // }

pandoc.toJSONFilter(filterPlantuml);