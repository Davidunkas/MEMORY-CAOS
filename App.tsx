import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Trophy, Users, RotateCcw, Zap, Brain, Plus, Minus, Settings, Play, Check } from 'lucide-react';
import { CardType, GameState, PlayerProfile } from './types';
import { Card } from './components/Card';
import { playSound } from './services/audioService';

// Game Constants
const EMOJIS = ['🥑', '🚀', '🍕', '🦄', '👾', '🌵', '🍩', '🎈']; // 8 Pairs
const FLIP_DELAY = 1000;

const THEMES = {
  indigo: { bg: 'bg-indigo-500', border: 'border-indigo-700', text: 'text-indigo-600', light: 'bg-indigo-100' },
  pink: { bg: 'bg-pink-500', border: 'border-pink-700', text: 'text-pink-600', light: 'bg-pink-100' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-700', text: 'text-orange-600', light: 'bg-orange-100' },
  emerald: { bg: 'bg-emerald-500', border: 'border-emerald-700', text: 'text-emerald-600', light: 'bg-emerald-100' },
};

const INITIAL_PLAYERS: PlayerProfile[] = [
  { id: 1, name: 'Jugador 1', score: 0, theme: 'indigo' },
  { id: 2, name: 'Jugador 2', score: 0, theme: 'pink' } // Default to 2 for easier start
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [isChaosMode, setIsChaosMode] = useState(true);
  
  // Player State
  const [players, setPlayers] = useState<PlayerProfile[]>(INITIAL_PLAYERS);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  
  // Game Board State
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<CardType[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chaosTriggered, setChaosTriggered] = useState(false);
  const [timer, setTimer] = useState(0);

  // --- LOGIC ---

  const startGame = (chaos: boolean) => {
    setIsChaosMode(chaos);
    
    const duplicatedEmojis = [...EMOJIS, ...EMOJIS];
    const shuffled = duplicatedEmojis
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: `card-${index}-${emoji}`,
        emoji,
        isMatched: false,
        isFlipped: false,
      }));

    setCards(shuffled);
    
    // Reset Scores but keep names
    const resetPlayers = players.map(p => ({ ...p, score: 0 }));
    setPlayers(resetPlayers);
    
    setCurrentTurnIndex(0);
    setFlippedCards([]);
    setIsProcessing(false);
    setTimer(0);
    setGameState(GameState.PLAYING);
    playSound('flip');
  };

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (gameState === GameState.PLAYING) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Shuffle Helper
  const shuffleCards = useCallback((currentCards: CardType[]) => {
    const newCards = [...currentCards];
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    return newCards;
  }, []);

  // Player Management
  const addPlayer = () => {
    if (players.length < 4) {
      const themes: PlayerProfile['theme'][] = ['indigo', 'pink', 'orange', 'emerald'];
      const nextTheme = themes[players.length];
      setPlayers([...players, { 
        id: Date.now(), 
        name: `Jugador ${players.length + 1}`, 
        score: 0, 
        theme: nextTheme 
      }]);
    }
  };

  const removePlayer = () => {
    if (players.length > 1) {
      setPlayers(players.slice(0, -1));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index].name = name;
    setPlayers(newPlayers);
  };

  // Turn Management
  const nextTurn = () => {
    setCurrentTurnIndex((prev) => (prev + 1) % players.length);
  };

  // Card Interaction
  const handleCardClick = (clickedCard: CardType) => {
    if (
      isProcessing ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      gameState !== GameState.PLAYING
    ) {
      return;
    }

    playSound('flip');
    if (navigator.vibrate) navigator.vibrate(10);

    const newCards = cards.map(c =>
      c.id === clickedCard.id ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      checkForMatch(newFlipped, newCards);
    }
  };

  const checkForMatch = (currentFlipped: CardType[], currentCards: CardType[]) => {
    const [card1, card2] = currentFlipped;
    const isMatch = card1.emoji === card2.emoji;

    if (isMatch) {
      handleMatch(currentCards);
    } else {
      handleMismatch(currentCards);
    }
  };

  const handleMatch = (currentCards: CardType[]) => {
    playSound('match');
    if (navigator.vibrate) navigator.vibrate([20, 30, 20]);

    setTimeout(() => {
      const matchedCards = currentCards.map(c =>
        c.isFlipped ? { ...c, isMatched: true, isFlipped: false } : c
      );
      setCards(matchedCards);
      setFlippedCards([]);
      
      // Update Score for current player
      const updatedPlayers = [...players];
      updatedPlayers[currentTurnIndex].score += 1;
      setPlayers(updatedPlayers);

      // Check Win Condition
      if (matchedCards.every(c => c.isMatched)) {
        setTimeout(() => {
          playSound('win');
          setGameState(GameState.GAME_OVER);
        }, 500);
      } else {
        // Keep turn if matched? Usually yes in memory.
        setIsProcessing(false);
      }
    }, 500);
  };

  const handleMismatch = (currentCards: CardType[]) => {
    setTimeout(() => {
      playSound('error');
      if (navigator.vibrate) navigator.vibrate(50);
      
      const resetCards = currentCards.map(c =>
        c.isMatched ? c : { ...c, isFlipped: false }
      );
      setCards(resetCards);
      
      if (isChaosMode) {
        setChaosTriggered(true);
        setTimeout(() => {
          playSound('shuffle');
          setCards(prev => shuffleCards(prev));
          nextTurn(); // Pass turn
          setFlippedCards([]);
          setChaosTriggered(false);
          setIsProcessing(false);
        }, 600);
      } else {
        nextTurn(); // Pass turn
        setFlippedCards([]);
        setIsProcessing(false);
      }
    }, FLIP_DELAY);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- RENDERERS ---

  const renderLogo = () => (
    <div className="mb-6 relative z-10 flex flex-col items-center">
      <motion.div
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="flex flex-col items-center"
      >
        <div className="bg-white p-4 rounded-3xl mb-4 border-b-[6px] border-slate-200">
            <Shuffle className="w-16 h-16 text-indigo-500" />
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-center text-white leading-none">
          MEMORY
          <br />
          <span className="text-yellow-300">CAOS</span>
        </h1>
      </motion.div>
    </div>
  );

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-sky-400 text-white"
    >
      {renderLogo()}

      <div className="flex flex-col gap-4 w-full max-w-sm z-10 mt-8">
        <button
          onClick={() => setGameState(GameState.MODE_SELECTION)}
          className="flex items-center justify-center gap-3 w-full p-4 bg-white text-indigo-600 rounded-xl font-black text-2xl border-b-[6px] border-indigo-100 active:border-b-0 active:translate-y-[6px] transition-all hover:bg-indigo-50"
        >
          <Play className="w-8 h-8 fill-indigo-600" /> JUGAR
        </button>

        <button
          onClick={() => setGameState(GameState.PLAYER_SETUP)}
          className="flex items-center justify-center gap-3 w-full p-4 bg-sky-500 text-white rounded-xl font-black text-xl border-b-[6px] border-sky-700 active:border-b-0 active:translate-y-[6px] transition-all hover:bg-sky-600"
        >
          <Settings className="w-6 h-6" /> JUGADORES
        </button>
      </div>
      
      <div className="mt-8 text-white/60 font-bold text-sm">
        {players.length} {players.length === 1 ? 'Jugador' : 'Jugadores'} configurados
      </div>
    </motion.div>
  );

  const renderPlayerSetup = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col items-center min-h-screen p-6 bg-sky-400 text-white pt-12"
    >
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
        <Settings className="w-8 h-8" /> Configuración
      </h2>

      <div className="w-full max-w-sm flex flex-col gap-4 mb-8">
        {players.map((p, idx) => (
          <div key={p.id} className="relative">
            <div className={`absolute left-0 top-0 bottom-0 w-16 rounded-l-xl flex items-center justify-center ${THEMES[p.theme].bg} border-b-[6px] ${THEMES[p.theme].border}`}>
               <Users className="text-white w-6 h-6" />
            </div>
            <input
              type="text"
              value={p.name}
              onChange={(e) => updatePlayerName(idx, e.target.value)}
              className="w-full p-4 pl-20 rounded-xl font-bold text-lg text-slate-700 outline-none border-b-[6px] border-slate-200 focus:border-indigo-400 transition-colors"
              placeholder={`Jugador ${idx + 1}`}
              maxLength={12}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={removePlayer}
          disabled={players.length <= 1}
          className="p-4 rounded-xl bg-red-400 border-b-[6px] border-red-600 text-white disabled:opacity-50 disabled:active:translate-y-0 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <Minus className="w-8 h-8" />
        </button>
        <button 
          onClick={addPlayer}
          disabled={players.length >= 4}
          className="p-4 rounded-xl bg-green-400 border-b-[6px] border-green-600 text-white disabled:opacity-50 disabled:active:translate-y-0 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      <button
        onClick={() => setGameState(GameState.MENU)}
        className="w-full max-w-sm p-4 bg-white text-indigo-600 rounded-xl font-black text-xl border-b-[6px] border-indigo-100 active:border-b-0 active:translate-y-[6px] transition-all hover:bg-indigo-50"
      >
        GUARDAR
      </button>
    </motion.div>
  );

  const renderModeSelection = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-sky-400 text-white"
    >
      <h2 className="text-3xl font-black mb-2 text-center">ELIGE MODO</h2>
      <p className="text-white/80 mb-8 font-bold text-center">¿Cómo quieres sufrir hoy?</p>

      <div className="flex flex-col gap-6 w-full max-w-sm">
        <button
          onClick={() => startGame(true)}
          className="group relative overflow-hidden p-6 bg-indigo-500 text-white rounded-2xl border-b-[8px] border-indigo-700 active:border-b-0 active:translate-y-[8px] transition-all text-left"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-2xl font-black flex items-center gap-2"><Zap className="fill-yellow-300 stroke-yellow-300" /> CAOS</span>
          </div>
          <p className="opacity-90 font-medium leading-tight">Si fallas, el tablero se mezcla. ¡Ideal para reírse!</p>
        </button>

        <button
          onClick={() => startGame(false)}
          className="group relative overflow-hidden p-6 bg-white text-sky-600 rounded-2xl border-b-[8px] border-slate-200 active:border-b-0 active:translate-y-[8px] transition-all text-left"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-2xl font-black flex items-center gap-2"><Brain className="stroke-current" /> CLÁSICO</span>
          </div>
          <p className="text-slate-500 font-medium leading-tight">Las cartas se quedan quietas. Memoria pura y dura.</p>
        </button>
      </div>

      <button 
        onClick={() => setGameState(GameState.MENU)}
        className="mt-8 text-white font-bold opacity-60 hover:opacity-100"
      >
        Cancelar
      </button>
    </motion.div>
  );

  const renderGame = () => (
    <div className="min-h-screen flex flex-col bg-sky-50 relative overflow-hidden font-fredoka">
      
      {/* Header */}
      <header className="p-2 sm:p-4 flex flex-col gap-4 z-10 w-full max-w-2xl mx-auto mt-2">
        
        <div className="flex justify-between items-center w-full">
           <button 
            onClick={() => setGameState(GameState.MENU)} 
            className="p-3 rounded-xl bg-white text-slate-700 border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="bg-white px-4 py-2 rounded-xl border-b-4 border-slate-200 font-mono font-bold text-slate-500">
            {formatTime(timer)}
          </div>
        </div>

        {/* Players Bar */}
        <div className="flex gap-2 w-full overflow-x-auto pb-2 justify-center">
          {players.map((p, idx) => {
            const isActive = idx === currentTurnIndex;
            const theme = THEMES[p.theme];
            return (
              <div 
                key={p.id}
                className={`
                  flex flex-col items-center px-3 py-2 rounded-xl border-b-4 transition-all min-w-[80px]
                  ${isActive 
                    ? `${theme.bg} ${theme.border} text-white -translate-y-1 shadow-sm` 
                    : 'bg-white border-slate-200 text-slate-400 opacity-70 scale-95'
                  }
                `}
              >
                <span className="text-[10px] font-black uppercase truncate max-w-[80px]">{p.name}</span>
                <span className="text-xl font-black leading-none mt-1">{p.score}</span>
              </div>
            );
          })}
        </div>
      </header>

      {/* Chaos Indicator */}
      <AnimatePresence>
        {chaosTriggered && isChaosMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.5, rotate: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-red-500 text-white font-black text-5xl px-10 py-6 rounded-3xl border-b-8 border-red-700 flex items-center gap-4 transform rotate-3 shadow-2xl">
              <Zap className="w-12 h-12 fill-yellow-300 stroke-yellow-300" />
              ¡CAOS!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <main className="flex-1 p-4 flex items-center justify-center z-10 overflow-y-auto">
        <motion.div 
          layout 
          className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg w-full mb-8"
        >
          {cards.map((card) => (
             <div key={card.id} className={`${card.isMatched ? 'invisible' : ''}`}>
               <Card 
                  card={card} 
                  onClick={handleCardClick} 
                  disabled={isProcessing} 
                />
             </div>
          ))}
        </motion.div>
      </main>
      
      {/* Turn Indicator Footer */}
      <div className={`w-full py-2 text-center text-white font-bold text-sm uppercase tracking-widest ${THEMES[players[currentTurnIndex].theme].bg}`}>
         Turno de {players[currentTurnIndex].name}
      </div>
    </div>
  );

  const renderGameOver = () => {
    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;
    
    let title = isTie ? '¡Empate!' : '¡Ganador!';
    let bgColor = isTie ? 'bg-yellow-100' : THEMES[winner.theme].light;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-6 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.8, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          className={`${bgColor} rounded-3xl p-8 max-w-sm w-full text-center border-b-[8px] border-slate-200 relative overflow-hidden`}
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-100 shadow-sm">
             {isTie ? <Users className="text-slate-400 w-12 h-12" /> : <Trophy className="text-yellow-400 w-12 h-12 fill-current" />}
          </div>
          
          <h2 className="text-4xl font-black text-slate-800 mb-2">{title}</h2>
          
          <div className="mb-8 mt-4 bg-white/50 rounded-2xl p-4">
            {sortedPlayers.map((p, i) => (
               <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-200/50 last:border-0">
                 <span className={`font-bold ${i === 0 ? 'text-slate-800 text-lg' : 'text-slate-500'}`}>
                   {i+1}. {p.name}
                 </span>
                 <span className="font-black text-xl">{p.score} pts</span>
               </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-3">
             <button
              onClick={() => startGame(isChaosMode)}
              className="w-full py-4 bg-indigo-500 text-white rounded-xl font-black text-lg border-b-[6px] border-indigo-700 active:border-b-0 active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Jugar otra vez
            </button>
            <button
              onClick={() => setGameState(GameState.MENU)}
              className="w-full py-4 bg-white text-slate-600 rounded-xl font-black text-lg border-b-[6px] border-slate-200 active:border-b-0 active:translate-y-[6px] transition-all"
            >
              Menú Principal
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="no-select font-fredoka">
      {gameState === GameState.MENU && renderMenu()}
      {gameState === GameState.PLAYER_SETUP && renderPlayerSetup()}
      {gameState === GameState.MODE_SELECTION && renderModeSelection()}
      {gameState === GameState.PLAYING && renderGame()}
      {gameState === GameState.GAME_OVER && (
        <>
          {renderGame()}
          {renderGameOver()}
        </>
      )}
    </div>
  );
};

export default App;
