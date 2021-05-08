const reportType = { DIFFICULT: 1, PLAYMODE: 2, STATUS: 3, LOG: 4 };

const homeActionsType = { START: 1, RESET: 2 };

const statusType = {
  IN_PROGRESS: { code: 1, text: "Currently In progress." },
  NOT_STARTED: { code: 2, text: "Start game clicking on Start Game Button." }
};

const playmodeType = {
  VERSUS_AI: { code: 1, text: "Versus AI." },
  VERSUS_PLAYER: { code: 2, text: "Versus Player" }
};

const difficultType = {
  EASY: { code: 1, text: "Easy" },
  HARD: { code: 2, text: "Hard" },
  IMPOSSIBLE: { code: 3, text: "Impossible" }
};

const markerType = {
  X: { code: 1, text: "X" },
  O: { code: 2, text: "O" },
  E: { code: 0, text: "E" }
};

const getRandomInt = ( max ) => {
  return Math.floor( Math.random() * max );
};

const convertReportValueToObject = ( report, value ) => {

  let selectedReport = ( () => {
    switch ( report ) {
    case 1:
      return difficultType;
    case 2:
      return playmodeType;
    case 3:
      return statusType;
    }
  } )();

  for ( reportName in selectedReport ) {
    let reportValue = selectedReport[ reportName ];
    if ( reportValue.code == value )
      return reportValue;
  }
};

const storageController = ( () => {

  const localStorageAvailable = () => {
    try {
      let storage = window.localStorage;
      let test = '__storage_test__';
      storage.setItem( test, test );
      storage.removeItem( test );
      return true;
    } catch ( e ) {
      return e instanceof DOMException && (
          e.code === 22 ||
          e.code === 1014 ||
          e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ) &&
        storage.length !== 0;
    }
  }

  const load = () => {
    if ( !localStorageAvailable || localStorage.getItem( "settings" ) ==
      undefined ) {
      return;
    }

    let settings = JSON.parse( localStorage.getItem( "settings" ) );

    if ( settings.difficult != undefined && !isNaN( settings.difficult ) &&
      settings.difficult > 0 && settings.difficult <= 3 ) {
      gameBoard.setDifficult( settings.difficult );
      gameBoard.changeConfig( reportType.DIFFICULT,
        gameBoard.getDifficult(), true );
    }

    if ( settings.playmode != undefined && !isNaN( settings.playmode ) &&
      settings.playmode > 0 && settings.playmode <= 2 ) {
      gameBoard.setPlaymode( settings.playmode );
      gameBoard.changeConfig( reportType.PLAYMODE,
        gameBoard.getPlaymode(), true );
    }

    displayController.reports.send( reportType.LOG,
      "All settings have been loaded" );

  };

  const save = () => {
    let settings = {
      difficult: gameBoard.getDifficult(),
      playmode: gameBoard
        .getPlaymode()
    };
    localStorage.setItem( "settings", JSON.stringify( settings ) );
  };

  return { load, save };
} )();

const displayController = ( () => {

  const gameDifficultCard = document.getElementById( "game-difficult" );
  const gamePlaymodeCard = document.getElementById( "game-playmode" );
  const gameStatusCard = document.getElementById( "game-status-home" );
  const gameActionsCard = document.getElementById( "game-home-actions" );
  const gameBoardElement = document.getElementById( "gameboard" );
  const endGameCard = document.getElementById( "end-game" );

  const reports = ( () => {

    const difficultValue = document.getElementById(
      "setting-dificult-value" );
    const playmodeValue = document.getElementById(
      "setting-playmode-value" );
    const statusValue = document.getElementById( "setting-status-value" );
    const logValue = document.getElementById( "log-message" );

    const send = ( elementType, value ) => {
      if ( elementType == 4 ) {
        logValue.textContent = value;
        return;
      }

      selectedReport =
        ( elementType == 1 ) ? difficultValue :
        ( elementType == 2 ) ? playmodeValue : statusValue;

      selectedReport.textContent = value.text;

    };
    return { send };
  } )();

  const settings = ( () => {

    let settingsList = [];

    const _difficult = () => {

      let buttons = document.querySelectorAll( ".btn-difficult" );

      let info = {
        buttons,
        listener: ( event ) => {
          result = gameBoard.changeConfig( reportType.DIFFICULT,
            Number.parseInt( event.target.getAttribute(
              "data-difficult" ) ) );
          reports.send( reportType.LOG, result.text );
        }
      };

      settingsList.push( info );

    };

    const _playmode = () => {
      let buttons = document.querySelectorAll( ".playmode-option" );

      let info = {
        buttons,
        listener: ( event ) => {
          let target = event.target;

          while ( !target.classList.contains( "playmode-option" ) ) {
            target = target.parentNode;
          }

          let contentValue = Number.parseInt( target.getAttribute(
            "data-playmode" ) );

          result = gameBoard.changeConfig( reportType.PLAYMODE,
            contentValue );
          reports.send( reportType.LOG, result.text );
        }
      };

      settingsList.push( info );

    };

    const _actions = () => {

      let buttons = document.querySelectorAll( ".btn-home-action" );

      let info = {
        buttons,
        listener: ( event ) => {
          let actionType = Number.parseInt( event.target.getAttribute(
            "data-home-action" ) );

          if ( actionType == 2 ) {
            gameBoard.reset();
            return;
          }

          gameBoard.start();
        }
      };

      settingsList.push( info );
    };

    const setupSettings = () => {
      _difficult();
      _playmode();
      _actions();

      for ( let setting of settingsList ) {
        for ( let button of setting.buttons ) {
          if ( button == undefined )
            return;
          button.addEventListener( "click", setting.listener );
        }
      }
    };
    setupSettings();
  } )();
  const reveal_buttons = ( mainParentID ) => {
    revealButtons = new Set();
    const register = ( card ) => {
      revealButtons.add( card );
      card.firstElementChild.addEventListener( "click", ( event ) => {
        card.toggleAttribute( "disabled" );
        revealButtons.forEach( ( revealButton ) => {
          if ( revealButton != card )
            revealButton.setAttribute( "disabled", "" );

        } );

        event.preventDefault();
      } );
    };
    document.querySelectorAll( ".section-card" ).forEach( ( card ) =>
      register( card ) );
  };

  const board = ( () => {

    const start = () => {
      gameBoardElement.removeAttribute( "disabled" );
      gameBoardElement.addEventListener( "click", _catchClick );
    };

    const stop = () => {
      gameBoardElement.setAttribute( "disabled", "" );
      gameBoardElement.removeEventListener( "click", _catchClick );
    };

    const _catchClick = ( event ) => {
      gameBoard.setClick( event.target.getAttribute(
        "data-position" ) );
    };

    const setMarker = ( marker, position ) => {
      selected = gameBoardElement.querySelector(
        ".gameboard-item[data-position='" + position + "']" );
      selected.setAttribute( "data-marker", marker.code );
      selected.textContent = marker.text;
    };

    return { setMarker, start, stop };
  } )();

  const actions = ( () => {

    const _hideSetupElements = () => {

      gameDifficultCard.classList.add( "hide" );
      gamePlaymodeCard.classList.add( "hide" );
      startButton = gameActionsCard.querySelector(
        ".btn-home-action[data-home-action='1']" );
      startButton.classList.add( "hide" );
      document.getElementById( "game-intro-text" ).classList.add(
        "hide" );
    };

    const _adaptResetButton = () => {

      resetButton = gameActionsCard.querySelector(
        ".btn-home-action[data-home-action='2']" );
      resetButton.setAttribute( "full", "" );
    };

    const _adaptLogStyle = () => {
      document.getElementById( "log-message" ).setAttribute( "main",
        "" );
    };

    const scrollTo = ( element ) => {
      let x = element.getBoundingClientRect().x;
      let y = element.getBoundingClientRect().y;

      window.scrollTo( x, y );
    };

    const setupStart = () => {
      _hideSetupElements();
      _adaptResetButton();
      _adaptLogStyle();
      scrollTo( gameBoardElement );
    };

    const setupEndGame = ( result ) => {
      board.stop();

      endGameCard.classList.remove( "hide" );
      gameStatusCard.classList.add( "hide" );
      gameDifficultCard.classList.add( "hide" );
      gamePlaymodeCard.classList.add( "hide" );

      scrollTo( endGameCard );

      let title = document.getElementById( "end-game-title" );
      let subtitle = document.getElementById( "end-game-subtitle" );
      let trophy = document.getElementById( "end-game-trophy" );

      if ( result == undefined ) {
        title.textContent = "Draw!";
        subtitle.textContent = "Congratulations for all!";
      } else {
        let aiPlayer = result.ai ? "(AI Player)" : "";
        title.textContent =
          `Player ${result.marker.text}${aiPlayer} won!`;
        subtitle.textContent = "Congratulations!";
      }
    };

    return { scrollTo, setupStart, setupEndGame };
  } )();

  endGameCard.classList.add( "hide" );
  reveal_buttons();

  return { reports, actions, board };
} )();

const gameBoard = ( () => {

  let difficult = 1;
  let playmode = 1;
  let status = statusType.NOT_STARTED;
  let game_result = undefined;
  let players = [];
  let board = new Array( 9 ).fill( markerType.E );

  const wins_patterns = [
      [ 0, 1, 2 ],
      [ 3, 4, 5 ],
      [ 6, 7, 8 ],
      [ 0, 3, 6 ],
      [ 1, 4, 7 ],
      [ 2, 5, 8 ],
      [ 0, 4, 8 ],
      [ 2, 4, 6 ]
    ];

  // GAME SETTINGS

  const getDifficult = () => difficult;
  const getPlaymode = () => playmode;
  const setPlaymode = ( new_playmode ) => playmode = new_playmode;
  const setDifficult = ( new_difficult ) => difficult = new_difficult;

  const changeConfig = ( reportType, contentValue, storageLoader = false ) => {

    if ( reportType > 2 )
      return { success: false, text: "Invalid report content." };

    if ( status == statusType.IN_PROGRESS )
      return { success: false, text: "Game already Started. You can't change config now." };

    if ( reportType == 1 )
      difficult = contentValue;
    else
      playmode = contentValue;

    displayController.reports.send( reportType,
      convertReportValueToObject( reportType, contentValue ) );

    if ( !storageLoader )
      storageController.save();

    return { success: true, text: "You have successfully changed the configuration." };
  };

  // PLAYERS

  const getPlayers = () => players;

  const getFirstPlayer = () => players.filter( player => !player.lastPlayer )[
    0 ];

  const getLastPlayer = () => players.filter( player => player.lastPlayer )[
    0 ];

  const _changeLastPlayer = () => {
    let firstCode = getFirstPlayer().marker;
    players.filter( ( player ) => player.marker !=
      firstCode )[ 0 ].lastPlayer = false;
    players.filter( ( player ) => player.marker ==
      firstCode )[ 0 ].lastPlayer = true;
  };

  const _setupPlayers = () => {
    let lastMarker;
    let loopPlayer;

    while ( players.length < 2 ) {

      let playerList = { ai: false };

      if ( lastMarker == undefined )
        lastMarker = getRandomInt( 2 ) == 1 ? markerType.X : markerType.O;
      else
        lastMarker = lastMarker == markerType.X ? markerType.O :
        markerType.X;

      if ( loopPlayer == undefined ) {
        if ( playmode == 1 ) {
          loopPlayer = aiPlayer( lastMarker );
          playerList.ai = true;
        } else {
          loopPlayer = player( lastMarker );
        }
      }
      players.push( Object.assign( {}, playerList, {
        marker: lastMarker,
        object: loopPlayer,
        lastPlayer: false
      } ) );
    }
    players[ getRandomInt( players.length ) ].lastPlayer = true;
  };

  function _callAI() {
    let ai = players.filter( ( player ) => player.ai && !player
      .lastPlayer )[ 0 ];
    let position = ai.object.selectIdealPosition( difficult );
    setTimeout( () => {
      _sendPosition( position );
    }, 250 );
  };

  // BOARD INTERACTION

  const setClick = ( position ) => {
    if ( position == null )
      return;
    if ( getFirstPlayer().ai )
      return;

    _sendPosition( position );
  };

  const _sendPosition = ( position ) => {
    if ( status == statusType.NOT_STARTED )
      return;
    if ( position < 0 || position >= 9 ) {
      displayController.reports.send( reportType.LOG,
        "Invalid position." );
      return;
    }
    if ( board.filter( marker => marker.code == 0 ).length < 1 )
      return;

    if ( board[ position ].code != 0 ) {
      displayController.reports.send( reportType.LOG,
        "Invalid click, already exists marker." );
      return;
    }
    _sendMarker( getFirstPlayer().marker, position );
    _changeLastPlayer();
    displayController.reports.send( reportType.LOG,
      `Good choice! Now ${getFirstPlayer().marker.text} turn.`
    );

    validateWinner( checkWinner() );

    if ( getFirstPlayer().ai ) {
      _callAI();
    }

  };

  const _sendMarker = ( marker, position ) => {
    displayController.board.setMarker( marker, position );

    board[ position ] = marker;
  };

  // BOARD CHECKERS

  const validateWinner = ( winner ) => {
    if ( !winner ) {
      return;
    } else if ( winner.code == 0 ) {
      finish();
      return;
    }
    _sendWinner( winner );
  };

  const getPatternsStatus = ( marker ) => {
    let boardPatterns = [];
    for ( let pattern of wins_patterns ) {
      let boardMarkerStatus = { pattern, won: 2 };
      let pass = true;

      for ( let position of pattern ) {

        let boardMarker = board[ position ];

        if ( boardMarker != marker ) {
          pass = false;
          if ( boardMarker != markerType.E )
            boardMarkerStatus.won = 0;
        }
      }

      if ( pass )
        boardMarkerStatus.won = 1;

      boardPatterns.push( boardMarkerStatus );
    }
    return boardPatterns;
  };

  const markerWon = ( marker ) => {
    return getPatternsStatus( marker ).filter( (
      markerStatus ) => markerStatus.won == 1 ).length > 0;
  };

  const tieGame = () => {
    let gamePossibles = [];

    for ( let markerName in markerType ) {
      let marker = markerType[ markerName ];
      if ( marker == markerType.E )
        continue;
      possibles = getPatternsStatus( marker ).filter( ( possible ) =>
        possible.won == 2 );
      gamePossibles.push( { possibles, marker, points: possibles.length } );
    }

    if ( gamePossibles[ 0 ].points == 0 && gamePossibles[ 1 ].points == 0 )
      return true;

    if ( _validateTieGame( 0, gamePossibles ) || _validateTieGame( 1,
        gamePossibles ) ) return true;

  };

  const _validateTieGame = ( pos, gamePossibles ) => {
    let opponent = pos == 1 ? 0 : 1;
    return gamePossibles[ opponent ].points == 0 && gamePossibles[ pos ].points ==
      1 && !getFirstPlayer().marker != gamePossibles[ pos ].marker;
  }

  const checkWinner = () => {

    for ( let markerName in markerType ) {
      let marker = markerType[ markerName ];
      if ( marker == markerType.E )
        continue;
      if ( markerWon( marker ) ) {
        return marker;
      }
    }

    if ( tieGame() ) {
      return { marker: markerType.E };
    }

    return false;
  };

  const _sendWinner = ( marker ) => {
    displayController.reports.send( reportType.LOG,
      `THE PLAYER ${marker.text} WON!` );
    game_result = players.filter( ( player ) => player[ 'marker' ] ==
      marker )[
      0 ];
    finish();
  };

  const getEmptyPositions = () => {
    let total = board.reduce( ( total, current ) => {
      total.now += 1
      if ( current.code == 0 )
        total.positions.push( total.now );
      return total;
    }, { positions: [], now: -1 } );
    return total.positions;
  };

  const getEmptyPositionsOf = ( pattern ) => {
    return pattern.filter( ( position ) => board[ position ] ==
      markerType.E );
  };

  // GAME INTERACTIONS

  const _enableGame = () => {
    _setupPlayers();
    displayController.board.start();

    displayController.reports.send( reportType.LOG,
      "Game started! " + getFirstPlayer().marker.text +
      " starts." );

    if ( getFirstPlayer().ai ) {
      _callAI();
    }
  };

  const start = () => {
    if ( status == statusType.IN_PROGRESS )
      return { success: false, text: "Game already Started. You can't start game again." };

    status = statusType.IN_PROGRESS;
    displayController.actions.setupStart();
    _enableGame();
    displayController.reports.send( reportType.status, statusType.IN_PROGRESS );
  };

  const finish = () => {
    status = statusType.NOT_STARTED;
    displayController.actions.setupEndGame( game_result );
  };

  const reset = () => {
    location.reload();
  };

  return {
    board,
    changeConfig,
    start,
    reset,
    getDifficult,
    getPlaymode,
    setPlaymode,
    setDifficult,
    checkWinner,
    tieGame,
    markerWon,
    getPatternsStatus,
    validateWinner,
    setClick,
    getLastPlayer,
    getFirstPlayer,
    getPlayers,
    getEmptyPositions,
    getEmptyPositionsOf
  };
} )();

const player = ( marker ) => {

  let opponent;

  const defineOpponent = ( () => {
    opponent = marker == markerType.X ?
      markerType.O : markerType.X;
  } )();

  return { marker, opponent };
};

const aiPlayer = ( marker ) => {

  const { opponent } = player( marker );

  const minimax = ( board, depth, isMaximizing ) => {
    let winner = gameBoard.checkWinner();

    if ( winner ) {
      score = 0;
      if ( winner == marker )
        score = 10;
      else if ( winner == opponent )
        score = -10;
      return score;
    }

    if ( isMaximizing )
      return minimaxLoop( board, marker, depth, false );
    else
      return minimaxLoop( board, opponent, depth, true );

  };

  const minimaxLoop = ( board, nowMarker, depth, isMaximizing ) => {
    let bestScore = isMaximizing ? Infinity : -Infinity;

    for ( let i = 0; i < 9; i++ ) {
      if ( board[ i ].code == 0 ) {
        board[ i ] = nowMarker;
        let score = minimax( board, depth + 1, isMaximizing );
        board[ i ] = markerType.E;
        if ( isMaximizing )
          bestScore = Math.min( score, bestScore );
        else
          bestScore = Math.max( score, bestScore );
      }
    }

    if ( isMaximizing )
      return bestScore + depth;
    else
      return bestScore - depth;

  };
  
  const _getBetterMove = () => {

    if ( gameBoard.getEmptyPositions().length == 9 )
      return 0;

    let bestScore = -Infinity,
      bestMove;
    for ( let position of gameBoard.getEmptyPositions() ) {
      gameBoard.board[ position ] = marker;
      let score = minimax( gameBoard.board, 0, false );
      gameBoard.board[ position ] = markerType.E;

      if ( score > bestScore ) {
        bestScore = score;
        bestMove = position;
      }

    }
    return bestMove;
  }

  const _easy = () => {
    let positions = gameBoard.getEmptyPositions();
    return positions[ getRandomInt( positions.length ) ];
  };

  const _hard = () => {
    if ( getRandomInt( 2 ) == 0 ) {
      return _getBetterMove();
    } else {
      return _easy();
    }
  };

  const _impossible = () => {
    return _getBetterMove();
  };

  const selectIdealPosition = ( difficult ) => {
    switch ( difficult ) {
    case 1:
      return _easy();
    case 2:
      return _hard();
    case 3:
      return _impossible();
    }
  };

  return { selectIdealPosition };
};

storageController.load();
