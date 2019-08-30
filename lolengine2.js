$(document).ready(function(){
  updateSize();
});

$(window).resize(function(){
  updateSize();
});

function updateSize()
{
  var height = $(window).height() - 45;

  $("textarea").height(height*0.75);
  $("·buttons").height(height*0.25);
  $(".wrapper.small").height(height*0.75);
  $(".wrapper").height(height);
}

var showText = function (target, message,index, interval) {
  $('#textOutput').scrollTop($('#textOutput')[0].scrollHeight);

  if (index < message.length) {
    $(target).append(message[index++]);
    setTimeout(function () { showText(target, message, index, interval); }, interval);
  }else{
    $("input").show();
  }
}

// The core class of the game. The game world is made up of a array (or grid) of states.
// The state includes a parentStateId that is a reference to the state that leads to this state.
// the starting state has a parent state of null.
var State = function (id, text, choiseList, parentStateId, stateEvent) {
    this.Id = id;
    this.Text = text;
    this.ChoiseList = choiseList;
    this.ParentStateId = parentStateId;
    this.Event = stateEvent;
};


// Goes into a state. Leads the player into a new state.
// if the state has an event, the choices can only be accessed after the event is cleared.
var Choice = function (text, stateReference) {
    this.Text = text;
    this.StateReference = stateReference;
}

// Can be used either as the "Character Sheet" for the player
// or as a modifier for a player.
// If you want the player to loose 2 hp you have the game.Player object absorb a state
// with a HP of -2 and all other variables set to 0.
var PlayerState = function (str, dex, hp) {
    this.Str = str;
    this.Dex = dex;
    this.Hp = hp

    this.RollCharacter = function () {
        this.Str = Math.floor((Math.random() * 20) + 1);
        this.Dex = Math.floor((Math.random() * 20) + 1);
        this.Hp = Math.floor((Math.random() * 20) + 1);
    }

    //absorb a effect of an effent (another playerState)
    this.AbsorbState = function (effectState) {
        this.Str += effectState.Str;
        this.Dex += effectState.Dex;
        this.Hp += effectState.Hp;
    }

}

// goes into a state (optional). Choises are locked until the event is cleared.
// if it never cleares (or you choose not to) you must default back to parrent state.
// all events needs to be controleld with a Y/N choice
var Event = function (description, preReq, effect, failEffect) {
    this.Text = description;
    this.PreReq = preReq;
    this.effect = effect;

    this.TryState =  function() {
        if (game.Player.Str >= preReq.Str &&
            game.Player.Dex >= preReq.Dex &&
            game.Player.Hp >= preReq.Hp) {
                game.Player.AbsorbState(effect);
    showText('#textOutput',"SUCCESS!\n\n",0,0);
                return true;
            } else {
                game.Player.AbsorbState(failEffect)
		              showText('#textOutput',"FAIL!\n\n",0,0);
                return false;
            }
    }
}
function renderStats() {
	if(game.Player.Str < 1 ||game.Player.Dex < 1 ||game.Player.Hp < 1 )
	{
    console.log("GAME OVER")
		game.GameOver = true;
    $("#buttons").empty();
    showText('#textOutput', "G A M E   O V E R",0,10);
	}
	$("#wrapperSmall").empty();
	$("#wrapperSmall").append("<i>CHARACTER SHEET</i><br/><br/><b>HP:</b> "
	+game.Player.Hp+"<br/><b>STR:</b> "
	+game.Player.Str+"<br/><b>Dex:</b> "
	+game.Player.Dex+"<br/>");
}

function runState(stateId) {
  outputStr = "";
  $("#buttons").empty();
  renderStats();
  var state;
  if(game.GameOVer){
    showText('#textOutput', "G A M E   O V E R",0,10);
  } else {
   for (i = 0; i < game.States.length; i++){

    if(stateId == game.States[i].Id){

      state = game.States[i];
	//only display this if we are not looping the event
	if(game.ThisState != stateId){
    outputStr = outputStr + state.Text+ "\n\n";
 		$('#textOutput').scrollTop($('#textOutput')[0].scrollHeight);
	}
  if(state.Event != null && jQuery.inArray( state.Id, game.ClearedStates ) == -1){
  outputStr = outputStr + state.Event.Text+ "\n\n";
 	$('#textOutput').scrollTop($('#textOutput')[0].scrollHeight);

	$("#buttons").append( "<input style='display:none;' type='button' onclick='runEvent("+state.Id+")' value='YES'></input>" );
	$("#buttons").append( "<input style='display:none;' type='button' onclick='runState("+state.ParentStateId+")' value='NO'></input>" );

      }
      else{
        // go right to choices
        state.ChoiseList.forEach(function(choice){
          $("#buttons").append( "<input style='display:none;' type='button' onclick='runState("+choice.StateReference+")' value='"+choice.Text+"'></input>" );
        });
      }
      game.ThisState = stateId;
        showText('#textOutput', outputStr,0,10);

    }
  }


  }
}

function runEvent(stateId){
 // find the state

	for (i = 0; i < game.States.length; i++){

		if(stateId == game.States[i].Id){

			var state = game.States[i];
			if(state.Event.TryState())
			{
				console.log("I DID IT")
				game.ClearedStates.push(state.Id)

			}

			runState(state.Id);
		}
	}
}

// init game world
game = {};

var c1 = new Choice ("Move forward", 1);
var c0 = new Choice ("Stay here", 0);
var startState = new State(0, "You find yourself in a meadow, you only see one way forward from here. There is no point to this scenario...", [c1, c0], null, null);

var c2 = new Choice ("Go east", 2);
var c3 = new Choice ("Go west", 3);
var e1 = new Event ("Are you dexterous enough to jump? (need dex of 4) fail and you break your leg (-2 to str)", new PlayerState(0,4,0), new PlayerState(0,1,0), new PlayerState(-2,0,-3))
var s1 = new State(1, "You move out of the pointless meadow and find yourself infront of a river. The current is too strong to swim in, you must try to jump it! On the other side there are two roads, one to the east and one to the west.", [c2, c3], 0, e1);

var c3b = new Choice ("Go back", 1);
var s3 = new State(3, "Life is peaceful here.", [c3b], 1, null);

var e2 = new Event ("Are you strong enough to pull them up? (need str of 6) fail and you break your knees (-3 to str)", new PlayerState(6,0,0), new PlayerState(1,0,0), new PlayerState(-3,0,-4))
var c4 = new Choice ("Run up a tower", 4);
var c5 = new Choice ("Explore the dungeon", 5);
var s2 = new State(2, "The road to the east leads you to a spooky castle! The portcullis are down.", [c4, c5], 1, e2);

var e4 = new Event ("Are you strong enough to fight the dragon?.(need str of 10) fail and you get incinerated (-20 HP)",new PlayerState(6,0,0), new PlayerState(2,2,2),new PlayerState(0,0,-20));
var c2b = new Choice ("Go back", 2);
var c6 = new Choice ("Loot the dragon!", 6);
var s4 = new State(4, "You run upstairs, for what it seems like an eternity. Finally you reach the top of the tower and what you see leaves you speechless. In front of you, a giant dragon stands, with his sulfuric breath hitting your face.", [c2b, c6], 2, e4);

var s5 = new State(5, "Eww, gross. It´s all dungeouny... (the writers ran out of ideas here...)", [c2b], 2, null);

var s6 = new State(6, "YOU GET ALL THE GOLD! THE END", [], 2, null);


game.States = [startState, s1, s2, s3, s4, s5, s6];
game.ThisState = -1;
game.GameOver = false;
game.ClearedStates = [];

var newPlayer = new PlayerState(0,0,0);
newPlayer.RollCharacter();
game.Player = newPlayer;

runState(0);
