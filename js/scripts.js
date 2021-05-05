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

const markingType = {
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

  endGameCard.classList.add( "hide" );

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

  reveal_buttons();

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

    const scrollTo = ( element ) => {
      let x = element.getBoundingClientRect().x;
      let y = element.getBoundingClientRect().y;

      window.scrollTo( x, y );
    };

    const _adaptLogStyle = () => {
      document.getElementById( "log-message" ).setAttribute( "main",
        "" );
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
          `Player ${result.marking.text}${aiPlayer} won!`;
        subtitle.textContent = "Congratulations!";
      }
    };

    return { scrollTo, setupStart, setupEndGame };
  } )();

  const settings = ( () => {

    const _difficult = () => {

      let easyButton = gameDifficultCard.querySelector(
        ".btn-difficult[data-difficult='1']" );
      let hardButton = gameDifficultCard.querySelector(
        ".btn-difficult[data-difficult='2']" );
      let impossibleButton = gameDifficultCard.querySelector(
        ".btn-difficult[data-difficult='3']" );
      let buttons = [ easyButton, hardButton, impossibleButton ];

      const _catchClick = ( event ) => {
        let buttonDifficult = Number.parseInt( event.target.getAttribute(
          "data-difficult" ) );
        result = gameBoard.changeConfig( reportType.DIFFICULT,
          buttonDifficult );
        reports.send( reportType.LOG, result.text );
      };

      const _addEvent = () => {
        for ( let button of buttons ) {
          button.addEventListener( "click", _catchClick );
        }
      };

      _addEvent();
    };

    const _playmode = () => {

      let aiCardButton = gamePlaymodeCard.querySelector(
        ".playmode-option[data-playmode='1']" );
      let playerCardButton = gamePlaymodeCard.querySelector(
        ".playmode-option[data-playmode='2']" );
      let buttons = [ aiCardButton, playerCardButton ];

      const _catchClick = ( event ) => {
        let target = event.target;

        while ( !target.classList.contains( "playmode-option" ) ) {
          target = target.parentNode;
        }

        let contentValue = Number.parseInt( target.getAttribute(
          "data-playmode" ) );

        result = gameBoard.changeConfig( reportType.PLAYMODE,
          contentValue );
        reports.send( reportType.LOG, result.text );
        event.preventDefault();
      };

      const _addEvent = () => {
        for ( let button of buttons ) {
          button.addEventListener( "click", _catchClick, true );
        }
      };

      _addEvent();
    };

    const _actions = () => {

      let startButton = gameActionsCard.querySelector(
        ".btn-home-action[data-home-action='1']" );
      let resetButton = gameActionsCard.querySelector(
        ".btn-home-action[data-home-action='2']" );
      let buttons = [ startButton, resetButton ];

      const _catchClick = ( event ) => {
        let actionType = Number.parseInt( event.target.getAttribute(
          "data-home-action" ) );

        if ( actionType == 2 ) {
          gameBoard.reset();
          return;
        }

        gameBoard.start();

        event.preventDefault();
      };

      const _addEvent = () => {
        for ( let button of buttons ) {
          button.addEventListener( "click", _catchClick, false );
        }
      };

      _addEvent();
    };

    const run = () => {
      _difficult();
      _playmode();
      _actions();
    };
    run();
  } )();

  const board = ( () => {

    const start = () => {
      gameBoardElement.removeAttribute( "disabled" );
    };

    const stop = () => {
      gameBoardElement.setAttribute( "disabled", "" );
      gameBoardElement.removeEventListener( "click", _catchClick );
    };

    const addClickEvent = () => {
      gameBoardElement.addEventListener( "click", _catchClick );
    };

    const _catchClick = ( event ) => {
      gameBoard.game.catchClick( event.target.getAttribute(
        "data-position" ) );
    };

    const setMarking = ( marking, position ) => {
      selected = gameBoardElement.querySelector(
        ".gameboard-item[data-position='" + position + "']" );
      selected.setAttribute( "data-marking", marking.code );
      selected.textContent = marking.text;
    };

    return { addClickEvent, setMarking, start, stop };
  } )();

  return { reports, actions, board };
} )();

const gameBoard = ( () => {

  let difficult = 1;
  let playmode = 1;
  let status = statusType.NOT_STARTED;
  let game_result = undefined;

  const game = ( () => {
    let players = [];
    let board = new Array( 9 ).fill( markingType.E );

    const _setupPlayers = () => {
      let player1Marking = getRandomInt( 2 ) == 0 ? markingType.X :
        markingType.O;
      let player1 = playmode == 1 ? aiPlayer( player1Marking ) :
        player( player1Marking );
      let player2Marking = player1Marking.code == 1 ? markingType.O :
        markingType.X;
      let player2 = player( player2Marking );

      players.push( {
        ai: playmode == 1,
        marking: player1Marking,
        object: player1,
        lastPlayer: false
      } );
      players.push( {
        ai: false,
        marking: player2Marking,
        object: player2,
        lastPlayer: false
      } );
    };

    const _defineFirstPlayer = () => {
      let selected = getRandomInt( 2 );
      let lastPlayer = selected == 0 ? 1 : 0;
      players[ lastPlayer ].lastPlayer = true;
    };

    const getPlayers = () => players;

    const getFirstPlayer = () => players.filter( player => player.lastPlayer ==
      false )[ 0 ];

    const getLastPlayer = () => players.filter( player => player.lastPlayer ==
      true )[ 0 ];

    const start = () => {
      _setupPlayers();
      _defineFirstPlayer();
      displayController.board.start();
      displayController.board.addClickEvent();
      _sendBoard();

      displayController.reports.send( reportType.LOG,
        "Game started! " + game.getFirstPlayer().marking.text +
        " starts." );

      if ( getFirstPlayer().ai ) {
        _callAI();
      }
    };

    const catchClick = ( position ) => {
      if ( position == null )
        return;
      if ( getFirstPlayer().ai )
        return;
      _sendPosition( position );
    };

    const _sendPosition = ( position ) => {
      if ( status == statusType.NOT_STARTED )
        return;
      if ( position <= 0 || position >= 10 ) {
        displayController.reports.send( reportType.LOG,
          "Invalid position." );
        return;
      }
      if ( board.filter( marking => marking.code == 0 ).length < 1 )
        return;

      if ( board[ position - 1 ].code != 0 ) {
        displayController.reports.send( reportType.LOG,
          "Invalid click, already exists marking." );
        return;
      }
      _sendMarking( getFirstPlayer().marking, position );
      _changeLastPlayer();
      displayController.reports.send( reportType.LOG,
        `Good choice! Now ${getFirstPlayer().marking.text} turn.` );

      markingController.checkWinner();
      _sendBoard();

      if ( getFirstPlayer().ai ) {
        _callAI();
      }

      _draw.send();
    };

    const wins_pattern = [
      [ 1, 2, 3 ],
      [ 4, 5, 6 ],
      [ 7, 8, 9 ],
      [ 1, 4, 7 ],
      [ 2, 5, 8 ],
      [ 3, 6, 9 ],
      [ 1, 5, 9 ],
      [ 3, 5, 7 ]
    ];

    const markingController = ( () => {

      const getMarkingStatus = ( marking, anotherBoard = undefined ) => {
        let boardMarkings = [];
        for ( let pattern of wins_pattern ) {
          let boardMarkingStatus = { pattern, win: 2 };
          let pass = true;
          for ( let position of pattern ) {

            let boardMarking;

            if ( anotherBoard != undefined ) {
              boardMarking = anotherBoard[ position - 1 ];
            } else {
              boardMarking = board[ position - 1 ];
            }

            if ( boardMarking != marking ) {
              pass = false;
              if ( boardMarking != markingType.E )
                boardMarkingStatus.win = 0;
              else
                continue;
            }
          }
          if ( pass ) {
            boardMarkingStatus.win = 1;
          }
          boardMarkings.push( boardMarkingStatus );
        }
        return boardMarkings;
      };

      const markingWon = ( marking, anotherBoard = undefined ) => {
        let won;

        if ( anotherBoard != undefined ) {

          won = getMarkingStatus( marking, anotherBoard ).filter(
            ( markingStatus ) => markingStatus.win == 1 );
        } else {
          won = getMarkingStatus( marking ).filter( (
            markingStatus ) => markingStatus.win == 1 );
        }

        return won.length > 0;
      };

      const _sendWinner = ( marking ) => {
        displayController.reports.send( reportType.LOG,
          `THE PLAYER ${marking.text} WON!` );
        game_result = players.filter( ( player ) => player.marking ==
          marking )[ 0 ];
        finish();
      };

      const checkWinner = () => {
        if ( status == statusType.NOT_STARTED )
          return;
        for ( let markingName in markingType ) {
          let marking = markingType[ markingName ];

          if ( marking.code == 0 )
            return;

          let win = markingWon( marking );
          if ( win ) {
            _sendWinner( marking );
            break;
          }
        }
      };

      return { checkWinner, markingWon, getMarkingStatus };
    } )();

    const _draw = ( () => {

      const _has = () => {
        markingController.checkWinner();

        if ( status == statusType.NOT_STARTED )
          return;

        let possiblesX = markingController.getMarkingStatus(
          markingType.X ).filter( ( markingStatus ) =>
          markingStatus.win == 2 ).length;
        let possiblesO = markingController.getMarkingStatus(
          markingType.O ).filter( ( markingStatus ) =>
          markingStatus.win == 2 ).length;
        let draw_game = false;

        if ( possiblesX == 1 && possiblesO == 0 && getFirstPlayer()
          .marking != markingType.X ) {
          draw_game = true;
        }

        if ( possiblesX == 0 && possiblesO == 1 && getFirstPlayer()
          .marking != markingType.O ) {
          draw_game = true;
        }

        if ( possiblesX == 0 && possiblesO == 0 ) {
          draw_game = true;
        }

        return draw_game;
      };

      const send = () => {
        if ( !_has() )
          return;
        finish();
      };
      return { send };
    } )();

    const _sendMarking = ( marking, position ) => {
      displayController.board.setMarking( marking, position );

      board[ position - 1 ] = marking;
    };

    const _sendBoard = () => {
      for ( let player of players ) {
        player.object.setBoard( [ ...board ] );
      }
    };

    const _changeLastPlayer = () => {
      let firstCode = getFirstPlayer().marking;
      let newFirstPlayer = players.filter( ( player ) => player.marking !=
        firstCode )[ 0 ];
      let newLastPlayer = players.filter( ( player ) => player.marking ==
        firstCode )[ 0 ];
      newFirstPlayer.lastPlayer = false;
      newLastPlayer.lastPlayer = true;
    };

    const _callAI = () => {
      let ai = players.filter( ( player ) => player.ai && !player.lastPlayer )[
        0 ];
      let position = ai.object.selectIdealPosition( difficult );
      setTimeout( () => {
        _sendPosition( position );
      }, 250 );

    };

    return {
      markingController,
      start,
      getPlayers,
      getFirstPlayer,
      catchClick
    };
  } )();

  const changeConfig = ( reportType, contentValue, storageLoader = false ) => {

    if ( reportType > 2 ) {
      return { success: false, text: "Invalid report content." };
    }

    if ( status == statusType.IN_PROGRESS ) {
      return { success: false, text: "Game already Started. You can't change config now." };
    }

    if ( reportType == 1 ) {
      difficult = contentValue;
    } else {
      playmode = contentValue;
    }

    displayController.reports.send( reportType,
      convertReportValueToObject( reportType, contentValue ) );
    if ( !storageLoader )
      storageController.save();
    return { success: true, text: "You have successfully changed the configuration." };
  };

  const start = () => {
    if ( status == statusType.IN_PROGRESS ) {
      return { success: false, text: "Game already Started. You can't start game again." };
    }

    status = statusType.IN_PROGRESS;
    displayController.actions.setupStart();
    game.start();
    displayController.reports.send( reportType.status, statusType.IN_PROGRESS );

  };

  const finish = () => {
    status = statusType.NOT_STARTED;
    displayController.actions.setupEndGame( game_result );
  };

  const reset = () => {
    location.reload();
  };

  const getDifficult = () => difficult;
  const getPlaymode = () => playmode;
  const setPlaymode = ( new_playmode ) => playmode = new_playmode;
  const setDifficult = ( new_difficult ) => difficult = new_difficult;

  return {
    changeConfig,
    start,
    reset,
    game,
    getDifficult,
    getPlaymode,
    setPlaymode,
    setDifficult
  };
} )();

const player = ( marking ) => {

  let board;

  const setBoard = ( new_board ) => board = new_board;
  const getBoard = () => board;
  const getMarking = () => marking;

  return { setBoard, getBoard, getMarking };
};

const aiPlayer = ( marking ) => {

  const prototype = player( marking );

  const _getEmptyPositions = ( board ) => {
    let total = board.reduce( ( total, current ) => {
      total.now += 1
      if ( current.code == 0 )
        total.positions.push( total.now );
      return total;
    }, { positions: [], now: 0 } );
    return total.positions;
  };

  const _getEmptyPositionsOf = ( pattern, board ) => {
    return pattern.filter( ( position ) => board[ position - 1 ] ==
      markingType.E );
  };

  const _hasScore = ( board, marking ) => {
    return gameBoard.game.markingController.markingWon( marking, board );

  };

  const _getBetterChoice = ( board, marking, opponent = false ) => {
    let boardGame = [ ...board ];
    let selectedPosition = 0;
    let emptyPositions = _getEmptyPositions( boardGame );

    for ( let position of emptyPositions ) {
      let lastMarkingValue = boardGame[ position - 1 ];
      boardGame[ position - 1 ] = marking;

      if ( _hasScore( boardGame, marking ) ) {
        selectedPosition = position;
        break;
      }

      if ( !opponent ) {

        let opponentMarking = marking == markingType.X ? markingType.O :
          markingType.X;
        let opponentResult = _getBetterChoice( boardGame,
          opponentMarking, true );

        if ( opponentResult > 0 ) {
          selectedPosition = opponentResult;
          break;
        } else {

          selectedPosition = position;
          let possibles = gameBoard.game.markingController.getMarkingStatus(
            marking, boardGame ).filter( ( possible ) => possible.win ==
            2 );

          if ( possibles.length == 0 ) {
            selectedPosition = _easy();
            break;
          }

          let emptyPosition = _getEmptyPositionsOf( possibles[ 0 ].pattern,
            boardGame )[ 0 ];
          selectedPosition = emptyPosition;
        }
      }
      boardGame[ position - 1 ] = lastMarkingValue;
    }

    return selectedPosition;
  }

  const _easy = () => {
    let positions = _getEmptyPositions( prototype.getBoard() );
    return positions[ getRandomInt( positions.length ) ];
  };

  const _hard = () => {
    if ( getRandomInt( 2 ) == 0 ) {
      return _getBetterChoice( prototype.getBoard(), prototype.getMarking() );
    } else {
      return _easy();
    }
  };

  const _impossible = () => {
    if ( _getEmptyPositions( prototype.getBoard() ).find( ( position ) =>
        position == 5 ) )
      return 5;
    return _getBetterChoice( prototype.getBoard(), prototype.getMarking() );
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

  return Object.assign( {}, prototype, { selectIdealPosition } );
};

storageController.load();
