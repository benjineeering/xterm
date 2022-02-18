var term,
    protocol,
    socketURL,
    socket,
    pid,
    charWidth,
    charHeight;
var asciTitleEnabled = true;
var loadingBar = false;
var clicks = 0;
var commandHistory = [];
var cur =  0;
var command = "";
var jsonCommands = {};


function init() {
  loadJSON(function(response) {
   // Parse JSON string into object
     jsonCommands = JSON.parse(response);
  });
 }

function loadJSON(callback) {   

  var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
  xobj.open('GET', 'commands.json', true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
          callback(xobj.responseText);
        }
  };
  xobj.send(null);  
}

function closepopup() {
  var popup = document.getElementById("popup");
  popup.style.display = "none";
}
function countClicks() {
  clicks += 1;
}
var terminalContainer = document.getElementById('terminal-container');
terminalContainer.onclick= countClicks;

function setTerminalSize () {
  var cols = parseInt(window.innerWidth / charWidth);
  var rows = parseInt(window.innerHeight / charHeight);
  var width = window.innerWidth.toString() + 'px';
  var height = window.innerHeight.toString() + 'px';
  if (cols < 86){
    //use other title
    asciTitleEnabled = false;
  }
  else {
    asciTitleEnabled = true;
  }

  terminalContainer.style.width = width;
  terminalContainer.style.height = height;

  term.resize(cols, rows);
}

createTerminal();

window.addEventListener('resize', function(event){
  setTerminalSize();
});


function createTerminal() {
  init();
  // Clean terminal
  command = "";
  while (terminalContainer.children.length) {
    terminalContainer.removeChild(terminalContainer.children[0]);
  }
  term = new Terminal({
    cursorBlink: "block",
    scrollback: 1000,
    tabStopWidth: 8
  });


  term.open(terminalContainer);
  term.fit();

  var initialGeometry = term.proposeGeometry(),
      cols = initialGeometry.cols,
      rows = initialGeometry.rows;

      charWidth = Math.ceil(term.element.offsetWidth / cols);
      charHeight = Math.ceil(term.element.offsetHeight / rows);
      runFakeTerminal();
}

function LoadJsonCmds(cmd)
{
  for(keys in jsonCommands)
  {
    if(keys == cmd)
    {
     return jsonCommands[keys];
    }
  }
  return false;
}

var loopTimer;

function runFakeTerminal() {
  setTerminalSize ();
  //colour seems to be \033[0;32m
  var shellprompt = '\033[0;32muser@toru-999\033[0;31m<environment_magazino_sino>:~$ \033[0m';

  term.prompt = function () {
    term.write('\r\n' + shellprompt);
  };

  term.prompt();

  term.on('key', function (key, ev) {
    if(ev.ctrlKey && ev.keyCode == 67)
    {
      clearInterval(loopTimer);
      term.prompt();
      cur = commandHistory.length;
    }
    var printable = (
      !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey
    );
    if (loadingBar) return;
    if(ev.keyCode == 37 || ev.keyCode == 39) {
      return;
    }
    if (ev.keyCode == 13) 
    {
      
      var oCmd = LoadJsonCmds(command);
      if(oCmd)
      {
        if(typeof oCmd != 'object')
        {
          term.writeln('');
          term.writeln(oCmd);
        }
      }
      
      else if (command.indexOf("rostopic") == 0)
      {

        if (command.indexOf("list") == 9)
        {
          term.writeln('');
          for(keys in jsonCommands.rostopic)
          {
            term.write("/");
            term.writeln(keys);
          }
          command = "";
        }

        if (command.indexOf("rostopic info /") == 0)
        {
          var subCmd = command.split('/');
          term.writeln('');
          var output = jsonCommands.rostopic[subCmd[1]].info.split("\n");
          for(i=0; i<output.length; i++)
          {
            term.writeln(output[i]);
          }
          command = "";
        }
        else if (command.indexOf("rostopic echo /") == 0)
        {
          var subCmd = command.split('/');
          var jsdata = jsonCommands.rostopic[subCmd[1]]
          if(jsdata) 
          {
            term.writeln('');
            loopTimer = setInterval( function() {
              var output = jsdata.data.split("\n");
              for(i=0; i<output.length; i++)
              {
                term.writeln(output[i]);
              }
                //term.writeln(jsdata.data)
            }, 300);
            commandHistory.push(command);
            command = "";
            return;
          }
          else
          {
            term.writeln('');
            term.writeln('invalid topic'); //check syntax
          }
        }

      }

      else if (command === "clear"){
        createTerminal();
        return;
      }
      else if (command.indexOf("cd") == 0){
        term.writeln('');
        term.writeln('Command not available in virtual terminal');
      }
      else if (command == "rm -rf /"){
        term.writeln('');
        term.writeln('\033[0;93mFUCK YOU\033[0m, you have failed the Interview.');
      }
      else if (command === "apt-get install cheats") 
      {
        loadingBar = true;
        command = "";
         term.writeln('');
         term.writeln('\033[0;95mReading package lists... Done\033[0m ')
         term.writeln('\033[0;34mOnly dependency is your mind\033[0m ')
         function termprompt(i){
           console.log(i)
           if (i==24) {
             term.write(' 100% Complete')
             term.writeln(' ')
             term.writeln('Thank you for making your Linux environment a little less user-hostile :) ')
             loadingBar = false;
             term.prompt();
             commandHistory.push("apt-get install feminism");
             cur = commandHistory.length;
           }
         }
         for(var i=0; i<25; i++){
           let j = i;
           setTimeout( function() {
             term.write(String.fromCharCode(9813) + ' ')
             termprompt(j);
           }, 50*i);
         }
         //show animation..
      }
      
      else
      {
        term.writeln('');
        term.writeln('-bash: command not found');
      }
      if (!loadingBar)
      {
        term.prompt();
        commandHistory.push(command);
        cur = commandHistory.length;
        command = "";
      }

    }
    else if (ev.keyCode == 38) 
    {
      if (commandHistory.length > 0)
      {
        cur = Math.max(0, cur-1);
        var i = 0;
        while ( i < command.length ){
          term.write('\b \b');
          i++;
        }
        term.write(commandHistory[cur])
        command = commandHistory[cur]
      }
    } 
    else if (ev.keyCode == 40) {
      if (commandHistory.length > 0) {
        cur = Math.min(commandHistory.length, cur+1);
        var i = 0;
        while ( i < command.length ){
          term.write('\b \b');
          i++;
        }
        if (cur == commandHistory.length){
          term.write("")
          command = ""
        }
        else {
          term.write(commandHistory[cur])
          command = commandHistory[cur]
        }
      }
    } else if (ev.keyCode == 8) {
     // Do not delete the prompt
      if (command.length > 0) {
        term.write('\b \b');
        command = command.substring(0,command.length-1)
      }
    } else if (printable) {
      term.write(key);
      command += key;
    }
  });

  term.on('paste', function (data, ev) {
    term.write(data);
    command += data;
  });
}
