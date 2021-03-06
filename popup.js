var wordlist = new Array();
var affectlist = new Array();
var subject = "";

document.addEventListener("DOMContentLoaded", function() {

  chrome.storage.local.get(["subliminalt", "flashfreq", "flashdur", "cuetype", "cueval", "wordlist", "affectlist"], function(items){
    if(localStorage['power'] == 0){
      powerOff();
    }
    else{
      powerOn();
    }

    if(localStorage['authentication'] != null){
      document.getElementById('authtype').value = localStorage['authentication'];   
    }

    if(localStorage['subject'] != null){
      document.getElementById('usubject').value = localStorage['subject'];
      subject = localStorage['subject'];
    }

    if(items.subliminalt != null){
      document.getElementById('subliminalt').value = items.subliminalt;
      if(items.subliminalt == "flash"){
        document.getElementById('divflashfreq').style.display = "inline";
        document.getElementById('divflashdur').style.display = "inline";
      }
    }

    if(items.flashfreq != null){
      document.getElementById('flashfreq').value = items.flashfreq;
    }

    if(items.flashdur != null){
      document.getElementById('flashdur').value = items.flashdur;
    }

    if(items.cuetype !=null){
      document.getElementById('cuetype').value = items.cuetype;
      changeWordCueLabel(items.cuetype, 0);

    }

    if(items.cueval != null){
      document.getElementById('cueval').value = items.cueval;
    }

    if(items.wordlist != null){
      wordlist = items.wordlist;
      createTableWord();
    }

    if(items.affectlist != null){
      affectlist = items.affectlist;
      createTableAffect();
    }

    

  });

  document.getElementById('poweron').addEventListener("click", powerOn, false);
  document.getElementById('poweroff').addEventListener("click", powerOff, false);
  document.getElementById('authtype').addEventListener("change", changeAuth, false);
  document.getElementById('usubject').addEventListener("blur", changeSubject, false);
  document.getElementById('subliminalt').addEventListener("change", changeSubliminalType, false);
  document.getElementById('flashfreq').addEventListener("blur", changeFlashFrequency, false);
  document.getElementById('flashdur').addEventListener("blur", changeFlashDuration, false);
  document.getElementById('cuetype').addEventListener("change", changeWordCueingType, false);
  document.getElementById('cueval').addEventListener("change", changeWordCueingValue, false);
  document.getElementById('btnaddword').addEventListener("click", eventWord, false);
  document.getElementById('btnaddaffect').addEventListener("click", eventAffect, false);
  document.getElementById('yessubject').addEventListener("click", createSubject, false);
  document.getElementById('nosubject').addEventListener("click", previousSubject, false);
});


function powerOn(){
  document.getElementById('poweron').className = "label label-success";
  document.getElementById('poweroff').className = "label label-default";
  localStorage['power'] = 1;
}

function powerOff(){
  document.getElementById('poweron').className = "label label-default";
  document.getElementById('poweroff').className = "label label-danger";
  localStorage['power'] = 0;
}

function changeSubject(){
  var esubject = event.target.value;
  //TODO: Implement the subject on the DB
  if(subject != esubject){
    if(esubject.length > 0){
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "http://evora.m-iti.org/Subly/TStudy/getsubject.php?email=" + localStorage['subuserid'] + "&subject=" + event.target.value, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == this.DONE) {
          xhr.onreadystatechange = null;
          if(xhr.responseText == "Negative"){
            if(localStorage['authentication'] == "none"){
               $('#nonemodal').modal('show');
               document.getElementById('usubject').value = subject;
            }
            else{
              $('#subjectmodal').modal('show');
            } 
          }
          else{
            var settings = JSON.parse(xhr.responseText);
            chrome.storage.local.set({"subliminalt": settings[0][0],"flashfreq": settings[0][1], "flashdur": settings[0][2], "cuetype": settings[0][3], "cueval": settings[0][4], "wordlist": settings[1], "affectlist": settings[2]}, function(items){
              console.log("Subject Changed");
            });
            localStorage['subject'] = subject = esubject;
            location.reload();
          }
        }
      }
      xhr.send();
    }
    else{
      localStorage['subject'] = subject = "";
      resetAndReload();
      //document.getElementById('usubject').value = "";
    }
  }
}

function createSubject(){
  subject = document.getElementById('usubject').value;
  localStorage['subject'] = subject;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "http://evora.m-iti.org/Subly/TStudy/createsubject.php?email=" + localStorage['subuserid'] + "&subject=" + subject, true);
  xhr.send();
  resetAndReload();   
}
function resetAndReload(){
  chrome.runtime.sendMessage({
    subject: "reset"
  }, function(){
    location.reload();
  });
} 

function previousSubject(){
  document.getElementById('usubject').value = subject;
}

function changeAuth(){

  if(event.target.value == "none"){
    localStorage['authentication'] = "none";
    localStorage["subuserid"] = "";
    console.log("Authentication changed");
  }
  if(event.target.value == "oauth"){
    chrome.runtime.sendMessage({
      subject: "create_user"
    });
  }
  
}


function changeSubliminalType(){
  var subtype = event.target.value;
  chrome.storage.local.set({"subliminalt": subtype}, function(items){
    console.log("Subliminal type changed");
  });
  if(subtype == "perm"){
    document.getElementById('divflashfreq').style.display = "none";
    document.getElementById('divflashdur').style.display = "none";
  }
  else if(subtype == "flash"){
    document.getElementById('divflashfreq').style.display = "inline";
    document.getElementById('divflashdur').style.display = "inline";
  }
  sendSettingsDB("&subliminalt=" + subtype); 
}

function changeFlashFrequency(){
  if(event.target.value > 100){
    chrome.storage.local.set({"flashfreq": event.target.value}, function(items){
      console.log("Flash frequency changed");
    });
    sendSettingsDB("&flashfreq=" + event.target.value); 
  }
}

function changeFlashDuration(){
  if(event.target.value > 0){
    chrome.storage.local.set({"flashdur": event.target.value}, function(items){
      console.log("Flash duration changed");
    });
    sendSettingsDB("&flashdur=" + event.target.value);
  }
}

function changeWordCueingType(){
  chrome.storage.local.set({"cuetype": event.target.value}, function(items){
    console.log("Word cueing type changed");
  });
  changeWordCueLabel(event.target.value, 1);
}

function changeWordCueingValue(){
  if(event.target.value != ""){
    chrome.storage.local.set({"cueval": event.target.value}, function(items){
      console.log("Word cueing value changed");
    });
    sendSettingsDB("&cueval=" + event.target.value);
  }
}

function changeWordCueLabel(text, changed){
  var cuevalue = "";
  document.getElementById('cueval').type = "number";
  if(text == "opacity"){
    document.getElementById("divselval").style.display = "inline";
    document.getElementById('labelcuetype').innerHTML = "Word opacity (%)";
    if(changed != 0){
      cuevalue = 75;
      chrome.storage.local.set({"cueval": cuevalue}, function(items){
        console.log("Word cueing value changed");
      });
      document.getElementById('cueval').value = cuevalue;
    }
  }
  else if(text == "font-size"){
    document.getElementById("divselval").style.display = "inline";
    document.getElementById('labelcuetype').innerHTML = "Word size (%)";
    if(changed != 0){
      cuevalue = 110;
      chrome.storage.local.set({"cueval": cuevalue}, function(items){
        console.log("Word cueing value changed");
      });
      document.getElementById('cueval').value = cuevalue;
    }
  }
  else if(text == "text-shadow"){
    cuevalue = "0px 0px";
    document.getElementById("divselval").style.display = "none";
    chrome.storage.local.set({"cueval": cuevalue}, function(items){
      console.log("Word cueing value changed");
    });
  }
  else if(text=="other"){
    document.getElementById("divselval").style.display = "inline";
    document.getElementById('labelcuetype').innerHTML = "CSS style";
    document.getElementById('cueval').type = "text";
    if(changed != 0){
      chrome.storage.local.set({"cueval": cuevalue}, function(items){
        console.log("Word cueing value changed");
      });
      document.getElementById('cueval').value = cuevalue;
    }

  }
  if(changed != 0){
    sendSettingsDB("&cuetype=" + text + "&cueval=" + cuevalue);
  }
}


function eventWord(){
 var word = document.getElementById('subword').value;
 var priority = document.getElementById('subpriority').value;
 if(word.length > 2 && priority > 0){
    for(var i = 0; i <= wordlist.length; i++){
      if(i == wordlist.length){
        wordlist.push([word, priority]);
        saveWordList();
        addRowWord(word, priority, i);
        sendSettingsDB("&addword=" + word + "&priority=" + priority);
        break;
      }
      else if(wordlist[i][0].toUpperCase() === word.toUpperCase()){
        if(wordlist[i][1] != priority){
          wordlist[i][1] = priority;
          saveWordList();
          updateRowWord(priority, i);
          sendSettingsDB("&updateword=" + word + "&priority=" + priority);
        }
        break;
      }
    }
 }
}

function createTableWord(){
  for(var i = 0; i < wordlist.length; i++){
    addRowWord(wordlist[i][0], wordlist[i][1], i);
  }
}

function addRowWord(word, priority, index){
  var btndel = document.createElement('button');
  var t = document.createTextNode("Delete");
  var tablewords = document.getElementById('tablewords').tBodies[0];
  btndel.appendChild(t);
  btndel.classList.add("btn");
  btndel.classList.add("btn-danger");
  btndel.classList.add("btn-xs");
  btndel.classList.add("col-xs-12");
  btndel.addEventListener("click", function(){
    var tempword = event.target.parentNode.parentNode.cells[1].innerHTML;
    for(var i=0; i < wordlist.length; i++){
      if(wordlist[i][0] === tempword){
        wordlist.splice(i, 1);
        saveWordList();
        sendSettingsDB("&deleteword=" + tempword);
      }
    }
    event.target.parentNode.parentNode.remove();

  });
  var row = tablewords.insertRow(index);
  var celln = row.insertCell(0);
  var cellword = row.insertCell(1);
  var cellprio = row.insertCell(2);
  var celldel = row.insertCell(3);
  celln.innerHTML = index + 1;
  cellword.innerHTML = word;
  cellprio.innerHTML = priority;
  celldel.appendChild(btndel);
}

function updateRowWord(priority, index){
  var tablewords = document.getElementById('tablewords').tBodies[0];
  tablewords.rows[index].cells[2].innerHTML = priority;
}

function saveWordList(){
  chrome.storage.local.set({"wordlist": wordlist}, function(items){
      console.log("Subliminal words changed");
  });
}



function eventAffect(){
 var word = document.getElementById('subaffect').value;
 if(word.length > 2){
    for(var i = 0; i <= affectlist.length; i++){
      if(i == affectlist.length){
        affectlist.push(word);
        saveAffectList();
        addRowAffect(word, i);
        sendSettingsDB("&addaffect=" + word);
        break;
      }
      else if(affectlist[i].toUpperCase() === word.toUpperCase()){
        break;
      }
    }
 }
}

function createTableAffect(){
  for(var i = 0; i < affectlist.length; i++){
    addRowAffect(affectlist[i], i);
  }
}

function addRowAffect(word, index){
  var btndel = document.createElement('button');
  var t = document.createTextNode("Delete");
  var tablewords = document.getElementById('tableaffects').tBodies[0];
  btndel.appendChild(t);
  btndel.classList.add("btn");
  btndel.classList.add("btn-danger");
  btndel.classList.add("btn-xs");
  btndel.classList.add("col-xs-12");
  btndel.addEventListener("click", function(){
    var tempword = event.target.parentNode.parentNode.cells[1].innerHTML;
    for(var i=0; i < affectlist.length; i++){
      if(affectlist[i] === tempword){
        affectlist.splice(i, 1);
        saveAffectList();
        sendSettingsDB("&deleteaffect=" + tempword);
      }
    }
    event.target.parentNode.parentNode.remove();

  });
  var row = tablewords.insertRow(index);
  var celln = row.insertCell(0);
  var cellaffect = row.insertCell(1);
  var celldel = row.insertCell(2);
  celln.innerHTML = index + 1;
  cellaffect.innerHTML = word;
  celldel.appendChild(btndel);
}


function saveAffectList(){
  chrome.storage.local.set({"affectlist": affectlist}, function(items){
    console.log("Positive affect words changed");
  });
}

function sendSettingsDB(setting){
  console.log(setting);
  if(localStorage['authentication'] != "none" && localStorage['subject'] != ""){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://evora.m-iti.org/Subly/TStudy/updatesubject.php?email=" + localStorage['subuserid'] + "&subject=" + localStorage['subject'] + setting, true);
    xhr.send();
  }
}



/*chrome.tabs.query({active:true,currentWindow:true}, function(tab) {
  chrome.tabs.sendMessage(tab[0].id, {stuff: localStorage});
});*/