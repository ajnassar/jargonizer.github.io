(function () {
    'use strict';

    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

    var jargonizer      = angular.module('jargonizer', ['appControllers']),
        appControllers  = angular.module('appControllers', ['ui.bootstrap']);

    angular.module('appControllers').controller('fiveLesson', function($scope, $modalInstance, $timeout){
        $timeout(function(){
            jQuery('.close.popup-modified').focus().blur();
        },300);

        $scope.closePopup = function(){
            $modalInstance.dismiss('cancel');
        };

        $scope.cancel = function(){
            $modalInstance.dismiss('cancel');
        };
    });

    angular.module('appControllers').controller('mainController', function($scope, $sce, $modal, $timeout) {
        $scope.step = 0;
        $scope.currentDate = (new Date()).getTime();
        $scope.textArea  = '';
        $scope.firstName = '';
        $scope.finallMessage = '';
        $scope.clientEmail = '';
        $scope.typewriter = '';
        $scope.planeText = '';

        var SPLITED;

        if(!$scope.modals){
            $scope.modals = {};
        }

        $scope.checkOutFiveLessons = function(){
            var lessons = $modal.open({
                templateUrl: './modals/fiveLesson.html',
                controller: 'fiveLesson',
                size : 'lg',
                resolve : { }
            });

            lessons.result.then(null, null);
        };

        var DEFAULTS = new Object(),
            _readedNum = 0,
            _fileArray = {  adjectives : './replaceable/adjectives.txt',
                adverbs : './replaceable/adverbs.txt',
                beneathquotes : './replaceable/beneathquotes.txt',
                bottomphrases :'./replaceable/bottomphrases.txt',
                greetings : './replaceable/greetings.txt',
                forbidenNouns: './replaceable/forbiden-nouns.txt',
                forbidenVerbs: './replaceable/forbiden-verbs.txt',
                phrases : './replaceable/phrases.txt',
                quotes : './replaceable/quotes.txt',
                sentencestart : './replaceable/sentencestart.txt',
                signaturedevice : './replaceable/signaturedevice.txt',
                signoffs : './replaceable/signoffs.txt',
                specialrules : './replaceable/specialrules.txt',
                subjects : './replaceable/subjects.txt',
                edgecases : './replaceable/edgecases.txt'};

        var _edgeCasesMatrix = [];
        var _createEdgeCaseMatrix = function(_word){
            var words = new Lexer().lex(_word),
                _newArray = [];
            for(var k in words){
                _newArray.push(words[k].toLowerCase());
            };
            _edgeCasesMatrix.push(_newArray);
        };

        var _processData = function(k, data){
            this.k = k;
            this.data = data.toString().split('\n');
            DEFAULTS[this.k] = [];

            for (var i in this.data) {
                DEFAULTS[this.k].push(this.data[i].trim());
                if(this.k.indexOf("edgecases") == 0){
                    _createEdgeCaseMatrix(this.data[i].trim());
                };
            };

            _readedNum++;
        };

        for(var k in _fileArray) {
            jQuery.get(_fileArray[k], function(_k, data) {
                new _processData(_k, data);
            }.bind(this, k));
        };

        $scope.validateInputs = function(){
            if(!$scope.textArea && !$scope.firstName){
                return true
            }
            return false;
        };
        var delayStart = 0,
            typeSpeed  = 20,
            dataStringLength = [];

        var _getTypeSpeed = function(_k, _stringLength){
            var miliSec = (dataStringLength.length) ? (dataStringLength[_k - 1].delay + (_stringLength * 20)) : (_stringLength * 20)
            dataStringLength.push({index : _k, strLen : _stringLength, delay : miliSec})
            return miliSec+"s";
        };

        var _randomReturn = function(section, _noWrap, _italic, _special){
            var _data = DEFAULTS[section],
                _length = _data.length,
                _random = Math.floor(Math.random() * _length);

            if(_italic){
                return '<p><i typewrite type-delay="'+typeSpeed+'" blink-cursor="false" text="'+ _data[_random] +'"></i></p>';
            };
            if(_noWrap){
                return _data[_random];
            }
            return '<p typewrite type-delay="'+typeSpeed+'" blink-cursor="false" text="'+ _data[_random] +'"></p>';
        }

        // restarting $scope all values and returning to first step
        $scope.reStartJargonize = function(){
            $scope.finallMessageTitle = '';
            $scope.finallMessage = '';
            $scope.firstName = '';
            $scope.textArea = '';
            $scope.clientEmail = '';
            $scope.step = 0;
            $scope.planeText = '';
        };

        $scope.sendEmail = function(){
            var _unvraped = ($scope.finallMessageTitle.$$unwrapTrustedValue) ? $scope.finallMessageTitle.$$unwrapTrustedValue() : "",
                _subjectTitle = jQuery(_unvraped).attr("text");
            window.location.href = "mailto:"+$scope.clientEmail+"?subject="+encodeURI(_subjectTitle)+"&body="+encodeURI($scope.planeText);
        };

        $scope.startJargonize = function(){
            var words = new Lexer().lex($scope.textArea),
                taggedWords = new POSTagger().tag(words),
                result = "",
                SPLITED = [],
                _nounsLength = 0,
                _verbsLength = 0,
                _lengthOfForbidenNouns = DEFAULTS.forbidenNouns.length,
                _lengthOfForbidenVerbs = DEFAULTS.forbidenVerbs.length,
                _indexOfNounsReplacable = [],
                _indexOfVerbsReplacable = [],
                _specialRulesObjectKeyChanges = {},
                _specialRulesAdjectiveKeyChanges = {},
                _taggedForRestoreAsBlocks = {},
                _returnSequence = {};

            for(var i in taggedWords){
                var _currentTaggedWord = taggedWords[i][0].toLowerCase(),
                    _lengthRemoval = 1;
                for(var v in _edgeCasesMatrix){
                    var _edgeCaseMatrixOnIndex = _edgeCasesMatrix[v][0].trim().toLowerCase();
                    if(_currentTaggedWord.indexOf(_edgeCaseMatrixOnIndex) > -1 && _currentTaggedWord.indexOf(_edgeCaseMatrixOnIndex) <= 1 && _currentTaggedWord.endsWith(_edgeCaseMatrixOnIndex) ){
                        _returnSequence[v] = taggedWords[i][0];
                        for(var f = 1, fl = _edgeCasesMatrix[v].length; f < fl; f++){
                            if(_edgeCasesMatrix[v][f].trim().indexOf(taggedWords[parseInt(i,10) + f][0].trim().toLowerCase()) == 0){
                                _lengthRemoval++;
                                _returnSequence[v] = _returnSequence[v] + taggedWords[parseInt(i,10) + f][0].trim();
                            } else {
                                delete _returnSequence[v];
                                _lengthRemoval = -1;
                                f = fl;
                            }
                        };
                        if(_lengthRemoval && _returnSequence[v]){
                            taggedWords.splice(i, _lengthRemoval, ["§§"+v,"CUSTOM"]);
                        };
                    };
                };
            };

            for(var k in DEFAULTS.adjectives){
                var _splitedLine = DEFAULTS.adjectives[k].split('='),
                    _splitedKeys  = _splitedLine[1].trim().split('/'),
                    _finalValues = _splitedLine[0].trim();

                for(var m in _splitedKeys){
                    var _smKey = _splitedKeys[m].trim();
                    if(_smKey){
                        _specialRulesAdjectiveKeyChanges[_smKey] = _finalValues.split('/');
                    };
                }
            };

            for(var k in DEFAULTS.specialrules){
                var _splitedLine = DEFAULTS.specialrules[k].split('='),
                    _finalValue  = _splitedLine[1].trim(),
                    _splitedKeys = _splitedLine[0].split('/');

                for(var m in _splitedKeys){
                    var _smKey = _splitedKeys[m].trim();
                    if(_smKey){
                        _specialRulesObjectKeyChanges[_smKey] = _finalValue;
                    };
                }
            };

            for (var i = 0, l = taggedWords.length; i <l; i++) {
                var taggedWord = taggedWords[i],
                    word = taggedWord[0],
                    tag = taggedWord[1];

                if(tag == 'NN' || tag == 'NNS'){
                    var _obj = {word : word, type : 0, index : i},
                        _ignore = false;

                    for(var m = 0, currActive; m < _lengthOfForbidenNouns; m++){
                        currActive = DEFAULTS.forbidenNouns[m].toLowerCase();
                        if(currActive.indexOf(word.toLowerCase()) == 0 && currActive.trim().length == word.trim().length){
                            _ignore = true;
                            m = _lengthOfForbidenNouns;
                        }
                    }

                    var _exist = false;
                    if(!_ignore){
                        if(i > 0){
                            if(taggedWords[i - 1][1].indexOf("DT") == 0){
                                _exist = true;
                            } else{
                                _obj.ignore = true;
                            }
                        } else {
                            _obj.ignore = true;
                        }
                    } else {
                        _obj.ignore = true;
                    }

                    if(!_obj.ignore && _exist){
                        _nounsLength++;
                        _indexOfNounsReplacable.push(i);
                    } else {
                        _obj.ignore = true;
                    }
                    SPLITED.push(_obj);
                } else if(tag == 'VB' || tag == 'VBP'){
                    var _obj = {word : word, type : 1, index : i},
                        _ignore = false;

                    for(var m = 0, currActive; m < _lengthOfForbidenVerbs; m++){
                        currActive = DEFAULTS.forbidenVerbs[m].trim().toLowerCase();
                        if(currActive.indexOf(word.toLowerCase()) == 0 && currActive.trim().length == word.trim().length){
                            _ignore = true;
                            m = _lengthOfForbidenVerbs;
                        }
                    }

                    if(!_ignore){
                        if(word.indexOf("'s") > -1){
                            _obj.ignore = true;
                        } else if(i > 0){
                            var _wordToDetermine = taggedWords[i - 1][0].toLowerCase();
                            if(_wordToDetermine.trim().indexOf("to") == 0){

                            } else {
                                _obj.ignore = true;
                            }
                        } else {
                            _obj.ignore = true;
                        }
                    } else {
                        _obj.ignore = true;
                    };

                    if(!_obj.ignore){
                        _verbsLength++;
                        _indexOfVerbsReplacable.push(i);
                    };

                    SPLITED.push(_obj);
                } else {
                    SPLITED.push({word : word, type : 2, index : i, ignore : true});
                }
            };

            var _numberOfNounsToBeReplaced = _nounsLength,//Math.round(Math.floor(_nounsLength / 2)),
                _numberOfVerbsToBeReplaced = _verbsLength;//Math.round(Math.floor((_verbsLength / 4) * 3));

            function shuffle(array) {
                var currentIndex = array.length, temporaryValue, randomIndex ;

                // While there remain elements to shuffle...
                while (0 !== currentIndex) {

                    // Pick a remaining element...
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;

                    // And swap it with the current element.
                    temporaryValue = array[currentIndex];
                    array[currentIndex] = array[randomIndex];
                    array[randomIndex] = temporaryValue;
                }

                return array;
            };

            _indexOfNounsReplacable = shuffle(_indexOfNounsReplacable).slice(0, _numberOfNounsToBeReplaced);
            _indexOfVerbsReplacable = shuffle(_indexOfVerbsReplacable).slice(0, _numberOfVerbsToBeReplaced);

            var _randomGotAdjectives = shuffle(DEFAULTS.adjectives).slice(0,_numberOfNounsToBeReplaced),
                _randomGotAdverbs    = shuffle(DEFAULTS.adverbs).slice(0,_numberOfVerbsToBeReplaced);

            var _manipulatingObject = {};

            for(var k = 0, l = _indexOfNounsReplacable.length; k < l; k++){
                _manipulatingObject[_indexOfNounsReplacable[k]] = _randomGotAdjectives[k];
            }
            for(var k = 0, l = _indexOfVerbsReplacable.length; k < l; k++){
                _manipulatingObject[_indexOfVerbsReplacable[k]] = _randomGotAdverbs[k];
            }

            var _finalArray = [],
                _endSentenceRegExp = new RegExp('/^[.?!;]$/'),
                _isBeggining = false;

            for(var swsc = 0, swscl = SPLITED.length; swsc < swscl; swsc++){
                for(var k in _specialRulesObjectKeyChanges){
                    var _modifiedStr = k[0].toUpperCase() + k.slice(1, k.length);

                    var _newRegStr= '^('+k+'|'+_modifiedStr+')$',
                        _newRegEx = new RegExp(_newRegStr,'g'),
                        _newValue = _specialRulesObjectKeyChanges[k];

                        SPLITED[swsc].word = SPLITED[swsc].word.replace(_newRegEx, function(n,x){
                            if (x[0] === x[0].toLowerCase() && x[0]!== x[0].toUpperCase()){
                                return n
                            };
                            var _s = n[0].toUpperCase() + n.slice(1, n.length);
                            return _s;
                        }.bind(this, _newValue));
                };
            };

            for(var k = 0, l = SPLITED.length; k < l; k++){
                _isBeggining = false;
                var _manipulatingOnIndex = _manipulatingObject[SPLITED[k].index];

                if(SPLITED[k].type && !SPLITED[k].ignore){
                    if(_manipulatingOnIndex){
                        if(k > 0 && SPLITED[k - 1].word.indexOf(_endSentenceRegExp) == 0){
                            _isBeggining = true;
                        } else if(k == 0){
                            _isBeggining = true;
                        };

                        SPLITED[k].word = ((_isBeggining) ? (_manipulatingOnIndex[0].toUpperCase() + _manipulatingOnIndex.slice(1,_manipulatingOnIndex.length)) : _manipulatingOnIndex) + " " + ((_isBeggining) ? SPLITED[k].word.toLowerCase() : SPLITED[k].word);
                    };
                } else if(SPLITED[k].type == 0 && !SPLITED[k].ignore && _specialRulesAdjectiveKeyChanges[SPLITED[k].word]){
                    SPLITED[k].word = shuffle(_specialRulesAdjectiveKeyChanges[SPLITED[k].word]).slice(0, _specialRulesAdjectiveKeyChanges[SPLITED[k].word].length)[0] + " " + SPLITED[k].word;
                };
                _finalArray.push(SPLITED[k].word);
            };

            var _finalTextJoined = _finalArray.join(' ');

            var _newDotSpaceRegEx = new RegExp("\\s[.?!,;:@%*)_]",'g');

            _finalTextJoined = _finalTextJoined.replace(_newDotSpaceRegEx, function myFunction(x){
                return x.substring(1,2)
            });

            var _newAppostrophRegEx = new RegExp("[\"]", 'g');

            _finalTextJoined = _finalTextJoined.replace(_newAppostrophRegEx, function myFunction(x){
                return "“";
            })

            var _newDotSpaceRegEx = new RegExp("[.?!]",'g');

            _finalTextJoined = _finalTextJoined.replace(_newDotSpaceRegEx, function myFunction(x){
                return x + '|||'
            });

            if(_finalTextJoined.endsWith('|||')){
                _finalTextJoined = _finalTextJoined.trim().slice(0,_finalTextJoined.length - 3);
            };

            // random every other part:

            var _randomPageIs = Math.floor(Math.random() * 2),
                _randomState  = Math.floor(Math.random() * 5),
                _sentencesList = _finalTextJoined.split('|||'),
                _newSentenceListLen = _sentencesList.length,
                _randomSentences = [];

            var _randomSentenceStart = Math.floor(Math.random() * DEFAULTS.sentencestart.length),
                _randomSentenceForStartAddon = Math.floor(Math.random() * _sentencesList.length),
                _sentenceRandom = _sentencesList[_randomSentenceForStartAddon],
                _trimmedSentenceRandom = _sentenceRandom.trim();

            var _oldManaged = (_trimmedSentenceRandom[0].indexOf("I") == 0) ? _trimmedSentenceRandom : (_trimmedSentenceRandom[0].toLowerCase() + _trimmedSentenceRandom.slice(1, _sentenceRandom.length));
                _sentencesList.splice(_randomSentenceForStartAddon, 1, DEFAULTS.sentencestart[_randomSentenceStart] + " " + _oldManaged);

            if(_randomPageIs == 1 && _newSentenceListLen > 1){
                var _wrapType = 0;
                for(var srn = 0, srnl = _newSentenceListLen; srn < srnl; srn++){
                    _randomSentences.push(srn);
                };

                _newSentenceListLen -= 1;

                var _randomLenChoosen = Math.floor(Math.random() * _newSentenceListLen);
                    _randomLenChoosen = (_randomLenChoosen) ? _randomLenChoosen : 1;
                    _randomSentences = shuffle(_randomSentences).slice(0, _randomLenChoosen);

                var _lineWrapCover   = {};

                for(var kLWC = 0, kLWCl = _sentencesList.length; kLWC < kLWCl; kLWC++){
                    _lineWrapCover[kLWC] = {sentence : _sentencesList[kLWC]};
                };

                if(_randomState == 1 || _randomState == 0){
//                    Randomly bold sentences
                    for(var abs = 0, absl = _randomLenChoosen; abs < absl; abs++){
                        _sentencesList.splice(_randomSentences[abs], 1, "<b>"+ _sentencesList[_randomSentences[abs]] +"</b>");
                    };
                } else if(_randomState == 2 && _newSentenceListLen > 2){
//                    Randomly take two sentences and indent and bullet point them
                    _randomSentences.sort(function(a,b){ return a - b });

                    for(var abs = 0, absl = _randomLenChoosen; abs < absl; abs++){
                        _lineWrapCover[_randomSentences[abs]].ulWrap = true;
                    }

                    for(var rlwc in _lineWrapCover){
                        if(_lineWrapCover[rlwc].ulWrap){
                            _sentencesList.splice(rlwc, 1, '<ul><li typewrite type-delay="'+typeSpeed+'" blink-cursor="false" text="' + _sentencesList[rlwc] + '"></li></ul>');
                        } else {
                            _sentencesList.splice(rlwc, 1, '<p typewrite type-delay="'+typeSpeed+'" blink-cursor="false" text="' + _sentencesList[rlwc] + '"></p>');
                        }
                    };
                    _wrapType = 6;
                } else if(_randomState == 3  || _randomState == 4){
//                    Randomly insert one of these lines:
//                    Let’s keep top of mind the words of Winston Churchill, “You cannot escape the responsibility of tomorrow by evading it today.”
//                    When thinking about the long-tail, don’t forget Steve Jobs advice that “it’s better to be a pirate than join the navy.”
                    var _randomThose2Sentences  = Math.floor(Math.random() * 2),
                        _randomSentencePosition = Math.floor(Math.random() * (_newSentenceListLen+1));
                    if(_randomThose2Sentences){
                        _sentencesList.splice(_randomSentencePosition, 0, "When thinking about the long-tail, don’t forget Steve Jobs advice that “it’s better to be a pirate than join the navy.”");
                    } else{
                        _sentencesList.splice(_randomSentencePosition, 0, "Let’s keep top of mind the words of Winston Churchill, “You cannot escape the responsibility of tomorrow by evading it today.”");
                    };

                    for(var kfx in _sentencesList){
                        _sentencesList.splice(kfx, 1 ,'<p typewrite type-delay="'+typeSpeed+'" blink-cursor="false" text="' + _sentencesList[kfx] + '"></p>');
                    };

                    _wrapType = 6;
                }

                _finalTextJoined = _sentencesList.join(' ');

                _finalTextJoined = _finalTextJoined.replace(new RegExp("(\\sA\\s[aeiouAEIOU]|\\sa\\s[aeiouAEIOU]|\\sAn\\s[^aeiouAEIOU]|\\san\\s[^aeiouAEIOU])","g"), function(x){
                    if(x.startsWith(" An")){
                        return " A" + x.slice(3, x.length);
                    } else if(x.startsWith(" an")){
                        return " a" + x.slice(3, x.length);
                    } else if(x.startsWith(" A")){
                        return " An" + x.slice(2, x.length);
                    }
                    return " an" + x.slice(2, x.length);
                });

                _finalTextJoined = _finalTextJoined.replace(new RegExp("^(A\\s[aeiouAEIOU]|a\\s[aeiouAEIOU]|An\\s[^aeiouAEIOU]|an\\s[^aeiouAEIOU])","g"), function(x){
                    if(x.startsWith("An")){
                        return "A" + x.slice(2, x.length);
                    } else if(x.startsWith("an")){
                        return "a" + x.slice(2, x.length);
                    } else if(x.startsWith("A")){
                        return "An" + x.slice(1, x.length);
                    }
                    return "an" + x.slice(1, x.length);
                });

                _finalTextJoined = _finalTextJoined.replace(new RegExp("§§[0-9]{1,}", "g"), function(x){
                    var _indexValue = x.split('').splice(2,x.length);
                    return _returnSequence[_indexValue];
                });

                if(_wrapType == 0){
                    _finalTextJoined = '<p typewrite type-delay="'+typeSpeed+'" blink-cursor="false" text="'+ _finalTextJoined +'"></p>';
                };
            } else {
                _finalTextJoined = _sentencesList.join(' ');

                _finalTextJoined = _finalTextJoined.replace(new RegExp("(\\sA\\s[aeiouAEIOU]|\\sa\\s[aeiouAEIOU]|\\sAn\\s[^aeiouAEIOU]|\\san\\s[^aeiouAEIOU])","g"), function(x){
                    if(x.startsWith(" An")){
                        return " A" + x.slice(3, x.length);
                    } else if(x.startsWith(" an")){
                        return " a" + x.slice(3, x.length);
                    } else if(x.startsWith(" A")){
                        return " An" + x.slice(2, x.length);
                    }
                    return " an" + x.slice(2, x.length);
                });

                _finalTextJoined = _finalTextJoined.replace(new RegExp("^(A\\s[aeiouAEIOU]|a\\s[aeiouAEIOU]|An\\s[^aeiouAEIOU]|an\\s[^aeiouAEIOU])","g"), function(x){
                    if(x.startsWith("An")){
                        return "A" + x.slice(2, x.length);
                    } else if(x.startsWith("an")){
                        return "a" + x.slice(2, x.length);
                    } else if(x.startsWith("A")){
                        return "An" + x.slice(1, x.length);
                    }
                    return "an" + x.slice(1, x.length);
                });

                _finalTextJoined = _finalTextJoined.replace(new RegExp("§§[0-9]{1,}", "g"), function(x){
                   var _indexValue = x.split('').splice(2,x.length);
                   return _returnSequence[_indexValue];
                });

                _finalTextJoined = '<p typewrite type-delay="'+typeSpeed+'" blink-cursor="false" text="'+ _finalTextJoined +'"></p>';
            };

            var _subject        = _randomReturn("subjects", true),
                _firstPhrase    = _randomReturn("phrases", false, false),
                _greeting       = _randomReturn("greetings", false, false),
                _body           = _finalTextJoined,
                _bottomPhrases  = _randomReturn("bottomphrases", false, false),
                _signOffs       = '<p typewrite initial-delay="5s" type-delay="20" blink-cursor="false" text="'+_randomReturn("signoffs", true) + '<br/>' + $scope.firstName + '"></p>',
                _bottomQuote    = _randomReturn("quotes", false, false),
                _randomlyOne    = _randomReturn("beneathquotes", false, false),
                _bottomOfTheEmail = _randomReturn("signaturedevice", false, true);

            var _finallBodyMessage = _firstPhrase  +_greeting + _body + _bottomPhrases + _signOffs + _bottomQuote + _randomlyOne + _bottomOfTheEmail;

            var _newNewNew = "<div id='stest'>" + _finallBodyMessage + "</div>",
                _currentIndex = 0,
                _lastMS = 1000,
                _prevDelay = ["1s"],
                _newStringHtml = "";

            var _planeText = "";
            jQuery(_newNewNew).children().each(function(){
                if($(this).attr('typewrite') === ""){
                   _currentIndex++;
                   var _length = $(this).attr('text').length;
                       _lastMS = _lastMS + (_length * 20) + 800;
                   var _converted = (Math.round(_lastMS / 1000)) + "s";
                    _prevDelay.push(_converted);
                   $(this).attr('initial-delay',_prevDelay[_prevDelay.length - 2]);
                    _planeText += ($(this).attr('text') + "\n\n");
                   _newStringHtml += $(this).context.outerHTML;
                } else if($(this).children(0) && $(this).children(0).attr('typewrite') === ""){
                    _currentIndex++;
                    var _length = $(this).children(0).attr('text').length;
                    _lastMS = _lastMS + (_length * 20) + 800;
                    var _converted = (Math.round(_lastMS / 1000)) + "s";
                    _prevDelay.push(_converted);
                    if($(this).children(0).prop("tagName") == 'LI'){
                        _planeText += ("\t• " + $(this).children(0).attr('text') + "\n\n");
                    } else {
                        _planeText += ( $(this).children(0).attr('text') + "\n\n");
                    };
                    $(this).children(0).attr('initial-delay',_prevDelay[_prevDelay.length - 2]);
                    _newStringHtml += $(this).context.outerHTML;
                }
            });

            _planeText = _planeText.replace(new RegExp("(<b>|</b>|<i>|</i>|<p>|</p>)","g"), "");
            _planeText = _planeText.replace(new RegExp("(<br/>|<br>)","g"), "\n");
            _planeText += "P.S. This email was sent with the help of the Business Writing Jargonizer. Want to create your own obnoxious business email? Check out the jargonizer here:";
            _planeText += "\n\nhttps://www.udemy.com/writing-with-flair-how-to-become-an-exceptional-writer/#businesswritingjargonizer";

            $scope.planeText = _planeText;
            $scope.finallMessageTitle = $sce.trustAsHtml("<span style=\"font-weight: normal; font-size:24px;\" typewrite type-delay=\""+typeSpeed+"\" blink-cursor=\"false\"  text=\""+_subject+"\"></span>");
            $scope.finallMessage = $sce.trustAsHtml(_newStringHtml);

            $scope.step = 1;

            $timeout(function(){
                window.scrollTo(0, jQuery('#mainBody')[0].offsetTop);
            },50);
        };
    });
}());