import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, RotateCcw, Volume2, VolumeX, Clock, Target, 
  HelpCircle, Sparkles, Trophy, Award, CheckCircle2, AlertTriangle, ChevronRight, Home, RefreshCw
} from 'lucide-react';

import { Topic, AnsweringMode, MathQuestion, GamePhase, HistoryItem } from './types';
import { generateQuestion } from './utils/mathEngine';
import { soundEngine } from './utils/soundEngine';
import { HandDrawnButton } from './components/HandDrawnButton';
import { HandDrawnCard } from './components/HandDrawnCard';
import { HandDrawnInput } from './components/HandDrawnInput';
import { 
  ScribbleLine, HandDrawnCircle, HandDrawnStar, HandDrawnArrow, TapeMark 
} from './components/SketchyDecorations';

export default function App() {
  // Game Setup & Options
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([
    'addition', 'subtraction'
  ]);
  const [answeringMode, setAnsweringMode] = useState<AnsweringMode>('choice');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [maxUnlockedRound, setMaxUnlockedRound] = useState<number>(1);

  // Active Game States
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [countdown, setCountdown] = useState<number>(3);
  const [timer, setTimer] = useState<number>(30);
  const [activeQuestion, setActiveQuestion] = useState<MathQuestion | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  // Score/Answering Counters
  const [correctAnswersList, setCorrectAnswersList] = useState<MathQuestion[]>([]);
  const [wrongAnswersList, setWrongAnswersList] = useState<MathQuestion[]>([]);
  const [userScore, setUserScore] = useState<number>(0);
  const [previousRoundPoints, setPreviousRoundPoints] = useState<number>(0);
  const [sessionOverallPoints, setSessionOverallPoints] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; ansGiven: string } | null>(null);

  // History & Statistics Log
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const totalAttempted = correctAnswersList.length + wrongAnswersList.length;
  const speedLevel = totalAttempted < 10 ? 1 : totalAttempted < 20 ? 2 : totalAttempted < 30 ? 3 : 4;
  const currentLimit = totalAttempted < 10 ? 10 : totalAttempted < 20 ? 8 : totalAttempted < 30 ? 5 : 3;

  // Timer Ref for gameplay
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const correctAnswersListRef = useRef<MathQuestion[]>([]);
  const wrongAnswersListRef = useRef<MathQuestion[]>([]);
  const activeQuestionRef = useRef<MathQuestion | null>(null);
  const feedbackRef = useRef<{ isCorrect: boolean; ansGiven: string } | null>(null);
  const [speedAnnouncement, setSpeedAnnouncement] = useState<{
    roundNum: number;
    secondsParam: number;
    questionRange: string;
  } | null>(null);
  const speedAnnouncementRef = useRef<{ roundNum: number; secondsParam: number; questionRange: string } | null>(null);

  useEffect(() => {
    activeQuestionRef.current = activeQuestion;
  }, [activeQuestion]);

  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

  useEffect(() => {
    speedAnnouncementRef.current = speedAnnouncement;
  }, [speedAnnouncement]);

  // Load history & max rounds on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('sketch_math_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      
      const storedMaxRound = localStorage.getItem('sketch_math_max_round');
      if (storedMaxRound) {
        const r = parseInt(storedMaxRound, 10);
        if (!isNaN(r)) {
          setMaxUnlockedRound(r);
          setCurrentRound(r);
        }
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }, []);

  // Keyboard controls for Choice selectors in desktop (Keys 1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing' || answeringMode !== 'choice' || feedback || !activeQuestion) return;
      
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIndex = parseInt(e.key, 10) - 1;
        if (optionIndex < activeQuestion.choices.length) {
          handleAnswer(activeQuestion.choices[optionIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, answeringMode, feedback, activeQuestion]);

  // Handle countdown progression
  useEffect(() => {
    if (phase !== 'countdown') return;

    soundEngine.playTick();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          startGameLoop();
          return 3;
        }
        soundEngine.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Sound muting synchronization
  const handleToggleMute = () => {
    const isMutedNow = soundEngine.toggleMuted();
    setMuted(isMutedNow);
  };

  // Toggle active selection of topics
  const handleToggleTopic = (topic: Topic) => {
    soundEngine.playPenClick();
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter((t) => t !== topic));
      }
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  // Pre-game initialization
  const initiatePreGame = (roundVal: number, isNewSession = false) => {
    setCurrentRound(roundVal);
    setUserScore(0);
    setCorrectAnswersList([]);
    correctAnswersListRef.current = [];
    setWrongAnswersList([]);
    wrongAnswersListRef.current = [];
    setTypedAnswer('');
    setShowHint(false);
    setFeedback(null);
    setCountdown(3);
    setPhase('countdown');
    if (isNewSession) {
      setSessionOverallPoints(0);
      setPreviousRoundPoints(0);
    }
  };

  // Commences the game playing loop with dynamic speed per question
  const startGameLoop = () => {
    setPhase('playing');
    setTimer(10);
    
    // Generate first question
    getNextQuestion();

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    timerIntervalRef.current = setInterval(() => {
      // Pause countdown if user is viewing answer feedback or warning announcement
      if (feedbackRef.current !== null || speedAnnouncementRef.current !== null) return;

      setTimer((prev) => {
        if (prev <= 1) {
          // Timer ran out!
          soundEngine.playFailure();
          
          let updatedWrongCount = 0;
          setWrongAnswersList((prevWrong) => {
            const next = activeQuestionRef.current ? [...prevWrong, activeQuestionRef.current] : prevWrong;
            wrongAnswersListRef.current = next;
            updatedWrongCount = next.length;
            return next;
          });

          if (updatedWrongCount >= 3) {
            finishRound();
          } else {
            getNextQuestion();
          }

          // Determine speed limit of the next question
          const nextIdx = correctAnswersListRef.current.length + wrongAnswersListRef.current.length;
          let limit = 10;
          if (nextIdx < 10) limit = 10;
          else if (nextIdx < 20) limit = 8;
          else if (nextIdx < 30) limit = 5;
          else limit = 3;

          return limit;
        }
        if (prev <= 3) {
          soundEngine.playTick(); // Tick in the last seconds
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Procedural generation of next question
  const getNextQuestion = () => {
    setFeedback(null);
    setTypedAnswer('');
    setShowHint(false);
    
    const index = correctAnswersListRef.current.length + wrongAnswersListRef.current.length;
    
    let secondsLimit = 10;
    let roundNum = 1;
    let questionRange = "Questions 1 - 10";
    
    if (index < 10) {
      secondsLimit = 10;
      roundNum = 1;
      questionRange = "Questions 1 - 10";
    } else if (index < 20) {
      secondsLimit = 8;
      roundNum = 2;
      questionRange = "Questions 11 - 20";
    } else if (index < 30) {
      secondsLimit = 5;
      roundNum = 3;
      questionRange = "Questions 21 - 30";
    } else {
      secondsLimit = 3;
      roundNum = 4;
      questionRange = "Questions 31+";
    }

    setTimer(secondsLimit);
    
    // Check if we just crossed into a new speed round
    const isNewRoundBoundary = (index === 0 || index === 10 || index === 20 || index === 30);
    if (isNewRoundBoundary) {
      try {
        soundEngine.playRoundUnlock();
      } catch (e) {}
      setSpeedAnnouncement({
        roundNum,
        secondsParam: secondsLimit,
        questionRange
      });
    }
    
    // Select one of the requested topics at random
    const randomTopic = selectedTopics[Math.floor(Math.random() * selectedTopics.length)];
    const newQ = generateQuestion(randomTopic, roundNum);
    setActiveQuestion(newQ);
  };

  // User submits or clicks answer
  const handleAnswer = (answer: string) => {
    if (feedback || !activeQuestion) return;

    const sanitizedGiven = answer.trim().toLowerCase();
    const sanitizedCorrect = activeQuestion.correctAnswer.trim().toLowerCase();
    const isCorrect = sanitizedGiven === sanitizedCorrect;

    setFeedback({
      isCorrect,
      ansGiven: answer
    });

    let updatedWrongCount = wrongAnswersListRef.current.length;

    if (isCorrect) {
      soundEngine.playSuccess();
      setCorrectAnswersList((prev) => {
        const next = [...prev, activeQuestion];
        correctAnswersListRef.current = next;
        return next;
      });
      setUserScore((prev) => prev + 1);
    } else {
      soundEngine.playFailure();
      setWrongAnswersList((prev) => {
        const next = [...prev, activeQuestion];
        wrongAnswersListRef.current = next;
        updatedWrongCount = next.length;
        return next;
      });
    }

    // Briefly pause so user can digest the wobbly chalk correction marks
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      if (updatedWrongCount >= 3) {
        finishRound();
      } else {
        getNextQuestion();
      }
    }, 700);
  };

  const handleTypedSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedAnswer.trim()) return;
    handleAnswer(typedAnswer);
  };

  // Closes the session
  const finishRound = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    
    setPhase('round_end');
    
    const roundPoints = correctAnswersListRef.current.length;
    setSessionOverallPoints(roundPoints);
    
    const totalCorrect = correctAnswersListRef.current.length;
    const totalWrong = wrongAnswersListRef.current.length;

    // Build stats entry
    const newItem: HistoryItem = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: currentRound,
      correct: totalCorrect,
      total: totalCorrect + totalWrong,
      percentage: Math.round((totalCorrect / Math.max(1, totalCorrect + totalWrong)) * 100),
      topics: [...selectedTopics]
    };

    const newHistory = [newItem, ...history].slice(0, 10); // Store last 10 trials in binder
    setHistory(newHistory);
    try {
      localStorage.setItem('sketch_math_history', JSON.stringify(newHistory));
    } catch (err) {}
  };

  // Resets logs of historical scores
  const clearHistoryLog = () => {
    soundEngine.playScribble();
    setHistory([]);
    setMaxUnlockedRound(1);
    setCurrentRound(1);
    try {
      localStorage.removeItem('sketch_math_history');
      localStorage.removeItem('sketch_math_max_round');
    } catch (err) {}
  };

  // Format key titles for view
  const formatTopicLabel = (topic: Topic): string => {
    switch (topic) {
      case 'addition': return 'Addition (+)';
      case 'subtraction': return 'Subtraction (-)';
      case 'percentages': return 'Percentages (%)';
      case 'ratio': return 'Ratios (A:B)';
      case 'squares_cubes_roots': return 'Squares & Roots (x²/√)';
    }
  };

  return (
    <div id="game-desktop-wrapper" className="min-h-screen px-4 md:px-8 py-6 md:py-12 flex flex-col items-center justify-between">
      
      {/* HEADER SECTION WITH MUTING/SOUND CONTROL */}
      <header 
        id="app-workspace-header" 
        className={`w-full max-w-4xl flex items-center justify-between mb-8 pb-3 border-b-2 border-dashed border-pencil/30 ${phase === 'menu' ? 'hidden' : ''}`}
      >
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-bold text-2xl tracking-tight select-none text-pencil">
            Mathsonic
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            id="toggle-muting-btn"
            onClick={handleToggleMute}
            className="p-2 border-2 border-pencil hover:bg-shading/30 active:translate-y-0.5 rounded-lg transition-transform focus:outline-none"
            title={muted ? "Unmute sounds" : "Mute sounds"}
          >
            {muted ? <VolumeX className="w-5 h-5 text-marker" /> : <Volume2 className="w-5 h-5 text-pencil" />}
          </button>
        </div>
      </header>

      {/* CORE GAME AREA */}
      <main id="game-interactive-plane" className="w-full max-w-4xl flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* 1. MENU PHASE */}
          {phase === 'menu' && (
            <motion.div
              key="menu-sheet"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full space-y-8"
            >
              <div className="text-center relative py-3">
                <TapeMark className="absolute -top-1 left-4 hover:scale-105 transition-transform scale-75" />
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-pencil drop-shadow-sm select-none shrink-0 inline-block relative pr-2">
                  Math<span className="text-marker">sonic</span>
                  <span className="absolute -top-3 -right-2 md:-top-4 md:-right-3 text-marker text-2xl transform rotate-12 animate-pulse">⚡</span>
                </h2>
                <ScribbleLine className="mt-2 max-w-[224px] mx-auto opacity-70" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* CONFIGURATION COLUMN */}
                <div className="md:col-span-12 lg:col-span-7 space-y-6">
                  <HandDrawnCard id="quiz-config-notebook" background="white" decoration="tape">
                    <h3 className="font-heading text-2xl font-bold mb-4 flex items-center gap-2">
                      <Target className="w-6 h-6 text-marker" strokeWidth={3} />
                      Choose Math Topics
                    </h3>
                    
                    {/* Topic stickers checkbox lists */}
                    <div id="topic-sticker-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {(['addition', 'subtraction', 'percentages', 'ratio', 'squares_cubes_roots'] as Topic[]).map((topic) => {
                        const isSelected = selectedTopics.includes(topic);
                        return (
                          <button
                            key={topic}
                            id={`topic-toggle-${topic}`}
                            onClick={() => handleToggleTopic(topic)}
                            style={{ borderRadius: '4px' }}
                            className={`
                              p-3 text-left border-2 border-pencil font-sans text-lg font-medium transition-all duration-150
                              flex items-center justify-between cursor-pointer select-none
                              ${isSelected 
                                ? 'bg-postit text-pencil border-pencil shadow-[3px_3px_0px_0px_rgba(45,45,45,1)] translate-y-[-2px] translate-x-[-2px]' 
                                : 'bg-transparent text-pencil/60 border-pencil/30 hover:bg-shading/10'
                              }
                            `}
                          >
                            <span>{formatTopicLabel(topic)}</span>
                            {isSelected ? (
                              <span className="text-marker font-bold text-xl ml-2 shrink-0">✓</span>
                            ) : (
                              <span className="text-pencil/20 font-bold ml-2 shrink-0">+</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Integrated CTA START Speed Test Button */}
                    <div className="pt-6 border-t-2 border-dashed border-pencil/20 flex flex-col items-center justify-center relative">
                      <HandDrawnArrow className="absolute -left-12 top-10 hidden md:block rotate-[15deg] scale-110 pointer-events-none" />
                      <HandDrawnButton
                        id="launch-speed-trial-btn"
                        variant="accent"
                        onClick={() => initiatePreGame(currentRound, true)}
                        className="w-full sm:w-auto px-10 py-4 text-xl md:text-2xl font-heading tracking-wide rotate-1 hover:rotate-[-1deg] transition-all"
                      >
                        <Play className="w-7 h-7 fill-white stroke-2 shrink-0 animate-ping absolute opacity-10" />
                        <Play className="w-6 h-6 fill-white stroke-2 shrink-0" />
                        START TEST!
                      </HandDrawnButton>
                      <p className="font-sans text-xs text-pencil/50 mt-2">Will launch Math sums with the topics chosen above</p>
                    </div>

                  </HandDrawnCard>
                </div>

                {/* GAME RULES CARD / LEADERBOARD COLUMN */}
                <div className="md:col-span-12 lg:col-span-5 space-y-6">
                  
                  {/* How it works Rule card */}
                  <HandDrawnCard id="how-to-play-binder" background="postit" decoration="tack">
                    <h3 className="font-heading text-2xl font-bold mb-3 flex items-center gap-2">
                      <HelpCircle className="w-6 h-6 text-ballpoint" strokeWidth={3} />
                      How to Survive?
                    </h3>
                    <ul className="list-none space-y-2.5 font-sans text-base">
                      <li className="flex items-start gap-2">
                        <span className="text-marker font-bold select-none shrink-0">⚡</span>
                        <div>
                          <span className="font-bold">Dynamic Velocity Mechanics</span>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1.5 p-2 bg-[#2d2d2d]/5 border border-pencil/10 rounded">
                            <span>• Questions 1–10:</span> <strong className="text-ballpoint">10s Limit</strong>
                            <span>• Questions 11–20:</span> <strong className="text-ballpoint">8s Limit</strong>
                            <span>• Questions 21–30:</span> <strong className="text-ballpoint">5s Limit</strong>
                            <span>• Questions 31+:</span> <strong className="text-marker">3s Limit</strong>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-marker font-bold select-none shrink-0">📌</span>
                        <span>Each correct sum earns you <strong className="text-ballpoint">1 point</strong>!</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-marker font-bold select-none shrink-0">📌</span>
                        <span>3 strikes (errors/timeouts) and the session auto-terminates.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-marker font-bold select-none shrink-0">📌</span>
                        <span>Complexity escalates with each level! Ready?</span>
                      </li>
                    </ul>
                  </HandDrawnCard>

                  {/* Notebook history log removed as per request */}
                </div>

              </div>
            </motion.div>
          )}

          {/* 2. COUNTDOWN PHASE */}
          {phase === 'countdown' && (
            <motion.div
              key="countdown-sheet"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="py-12 flex flex-col items-center justify-center text-center w-full"
            >
              <HandDrawnCircle color="marker" className="w-48 h-48 md:w-56 md:h-56">
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="font-heading font-black text-6xl md:text-8xl text-pencil"
                >
                  {countdown}
                </motion.span>
              </HandDrawnCircle>
              <p className="font-heading text-3xl md:text-4xl mt-6 text-pencil animate-pulse select-none">
                PREPARE YOUR GRAPHITE! ✏️
              </p>
              <p className="font-sans text-lg text-pencil/60 mt-1">Mathsonic Speed Trial is starting...</p>
            </motion.div>
          )}

          {/* 3. PLAYING GAMEPLAY PHASE */}
          {phase === 'playing' && activeQuestion && (
            <motion.div
              key="playing-sheet"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 relative"
            >
              {/* SPEED LEVEL CHANGE OVERLAY MODAL */}
              <AnimatePresence>
                {speedAnnouncement && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -inset-4 z-50 bg-[#2d2d2d]/70 backdrop-blur-[3px] flex items-center justify-center p-4 rounded-xl"
                  >
                    <motion.div
                      initial={{ scale: 0.9, rotate: -3 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0.9, rotate: 3 }}
                      className="max-w-md w-full relative z-50"
                    >
                      <HandDrawnCard id="speed-up-announcement" background="postit" decoration="tape">
                        <div className="text-center space-y-5 py-4 relative">
                          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3">
                            <span className="bg-marker text-white text-[10px] font-sans font-black uppercase tracking-widest px-2.5 py-1 rotate-6 inline-block shadow-sm">
                              VOLTAGE UP
                            </span>
                          </div>

                          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-marker/10 text-marker animate-bounce mb-1">
                            <Clock className="w-12 h-12" strokeWidth={3} />
                          </div>

                          <div>
                            <span className="font-heading text-xs font-black uppercase tracking-widest text-[#2d2d2d]/60 block mb-1">
                              INCOMING TIER
                            </span>
                            <h3 className="font-heading text-4xl md:text-5xl font-black text-pencil select-none uppercase tracking-tight">
                              SPEED ROUND {speedAnnouncement.roundNum}
                            </h3>
                          </div>
                          
                          <div className="font-heading font-black text-base py-1.5 px-5 bg-[#2d2d2d]/5 border-[2px] border-[#2d2d2d]/10 rounded-lg inline-block text-pencil select-none rotate-[-1deg]">
                            ⚡ {speedAnnouncement.questionRange}
                          </div>

                          <div className="py-2">
                            <p className="font-heading text-3xl md:text-4xl font-black text-marker uppercase tracking-wide animate-pulse">
                              ⏱️ {speedAnnouncement.secondsParam}s Per Sum!
                            </p>
                            <p className="font-sans text-xs text-pencil/60 max-w-xs mx-auto mt-2">
                              Your math speed workspace is accelerating. Quick reactions required!
                            </p>
                          </div>

                          <div className="pt-2">
                            <HandDrawnButton
                              id="dismiss-speed-announcement"
                              variant="accent"
                              onClick={() => {
                                try {
                                  soundEngine.playPenClick();
                                } catch (e) {}
                                setSpeedAnnouncement(null);
                              }}
                              className="w-full text-lg tracking-wider font-bold py-3 rotate-1 hover:rotate-[-1deg] transition-all"
                            >
                              START ROUND {speedAnnouncement.roundNum} ➔
                            </HandDrawnButton>
                          </div>
                        </div>
                      </HandDrawnCard>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HIGH DENSITY TOP HUB METRICS */}
              <div id="playing-metrics-layout" className="grid grid-cols-4 gap-1 sm:gap-4 items-stretch select-none">
                
                {/* 1. Round Badge */}
                <div
                  id="metric-badge-round"
                  style={{
                    borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                    boxShadow: '2px 2px 0px 0px #2d2d2d',
                  }}
                  className="p-1 sm:p-3 bg-white border-2 sm:border-[3px] border-[#2d2d2d] rotate-[-1.5deg] text-center flex flex-col justify-center items-center font-heading font-black"
                >
                  <span className="text-[7px] min-[360px]:text-[9px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-[#2d2d2d]/50 leading-none mb-0.5 sm:mb-1">speed round</span>
                  <span className="text-[10px] min-[360px]:text-xs sm:text-xl md:text-2xl font-black text-ballpoint">ROUND {speedLevel}</span>
                </div>

                {/* 2. Seconds Left Pulsing Alert Badge */}
                <div
                  id="metric-badge-timer"
                  style={{
                    borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px',
                    boxShadow: '2px 2px 0px 0px #2d2d2d',
                  }}
                  className={`p-1 sm:p-3 border-2 sm:border-[3px] border-[#2d2d2d] text-white flex flex-col items-center justify-center rotate-[2deg] text-center transition-colors ${
                    timer <= 2 ? 'bg-marker animate-pulse' : 'bg-[#ff4d4d]'
                  }`}
                >
                  <span className="text-[7px] min-[360px]:text-[9px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-white/80 leading-none mb-0.5 sm:mb-1">seconds left</span>
                  <span className="text-[11px] min-[360px]:text-sm sm:text-2xl md:text-3.5xl font-mono font-black">{timer}s</span>
                </div>

                {/* 3. Total Score Badge */}
                <div
                  id="metric-badge-score"
                  style={{
                    borderRadius: '225px 15px 255px 15px / 15px 255px 15px 225px',
                    boxShadow: '2px 2px 0px 0px #2d2d2d',
                  }}
                  className="p-1 sm:p-3 bg-white border-2 sm:border-[3px] border-[#2d2d2d] rotate-[-2deg] text-center flex flex-col justify-center items-center font-heading font-black"
                >
                  <span className="text-[7px] min-[360px]:text-[9px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-[#2d2d2d]/50 leading-none mb-0.5 sm:mb-1">accumulated pts</span>
                  <span className="text-[10px] min-[360px]:text-xs sm:text-l md:text-2xl font-black text-marker">{userScore} PTS</span>
                </div>

                {/* 4. Accuracy & Clear Goal Tracker */}
                <div
                  id="metric-badge-goal"
                  style={{
                    borderRadius: '5px',
                    boxShadow: '2px 2px 0px 0px #2d2d2d',
                  }}
                  className="p-1 sm:p-3 bg-[#fff9c4] border-2 border-[#2d2d2d] rotate-[2.5deg] text-center flex flex-col justify-center items-center font-sans font-bold text-pencil relative overflow-hidden"
                >
                  <span className="text-[7px] min-[360px]:text-[9px] sm:text-[10px] uppercase opacity-70 leading-none mb-0.5 sm:mb-1">status & lives</span>
                  <div className="flex flex-col items-center w-full">
                    <span className="text-[9px] min-[360px]:text-[10px] sm:text-sm font-extrabold text-[#2d2d2d] leading-none mb-0.5 sm:mb-1">
                      Strikes: {wrongAnswersList.length}/3
                    </span>
                    <div className="flex gap-0.5 sm:gap-1 items-center mt-0 sm:mt-0.5 text-xs">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <span 
                          key={idx} 
                          className={`font-black tracking-wider ${idx < wrongAnswersList.length ? 'text-marker text-[9px] min-[360px]:text-[11px] sm:text-lg scale-110 drop-shadow-sm' : 'opacity-20 text-pencil text-[9px] min-[360px]:text-[11px] sm:text-lg'}`}
                        >
                          ✕
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* TIMELINE TIMER BAR - MODELLED LIKE A WORKSPACE RULER */}
              <div 
                id="timer-ruler-track" 
                className="relative w-full h-8 bg-white border-[3px] border-[#2d2d2d] overflow-hidden shadow-[3px_3px_0px_0px_#2d2d2d]" 
                style={{ borderRadius: '50px 10px 40px 15px / 15px 40px 10px 50px' }}
              >
                
                {/* Measuring ruler divisions */}
                <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-40">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`w-[2px] bg-pencil ${i % 5 === 0 ? 'h-4' : 'h-2'}`} />
                  ))}
                </div>

                {/* Left/Right label and actual shrinking status background */}
                <div
                  className={`h-full border-r-[2.5px] border-[#2d2d2d] transition-all duration-1000 ${
                    timer <= 2 ? 'bg-marker animate-pulse' : 'bg-ballpoint'
                  }`}
                  style={{ width: `${(timer / currentLimit) * 100}%` }}
                />

                {/* Text centered inside the measuring ruler */}
                <div className="absolute inset-0 flex items-center justify-between px-6 text-sm font-mono font-bold text-pencil select-none pointer-events-none">
                  <span className="hidden sm:inline">📐 HIGH-DENSITY SPEED RULER</span>
                  <span className="inline sm:hidden">📐 SPEED RULER</span>
                  <span className={`${timer <= 2 ? 'text-white bg-marker px-1.5 py-0.5 rounded rotate-1' : 'opacity-80'}`}>
                    {timer}S REMAINING
                  </span>
                </div>
              </div>

              {/* MAIN PROBLEM SHEET CARD */}
              <div className="relative">
                {/* Floating yellow notebook tag absolute corner marker */}
                <div
                  id="playing-notebook-tag"
                  style={{
                    borderRadius: '5px',
                    boxShadow: '3px 3px 0px 0px #2d2d2d',
                  }}
                  className="absolute -top-4 right-4 md:right-10 bg-[#fff9c4] px-2.5 py-1 sm:px-4 sm:py-2 border-2 border-[#2d2d2d] rotate-[5deg] z-25 font-heading font-bold text-xs sm:text-sm text-[#2d2d2d] select-none"
                >
                  📁 Sheet #{correctAnswersList.length + wrongAnswersList.length + 1}
                </div>

                <HandDrawnCard id="math-problem-sheet" background="ruled" decoration="tape" customWobblyFactor="formula">
                  
                  {/* Formula Header Category */}
                  <div className="flex items-center justify-between mb-3 sm:mb-6 pb-1 sm:pb-2 border-b border-pencil/20">
                    <span className="font-heading text-xs sm:text-sm md:text-lg text-ballpoint/80 font-bold uppercase tracking-widest bg-ballpoint/5 px-1.5 sm:px-2.5 py-0.5 rounded border border-ballpoint/10">
                      Category: {formatTopicLabel(activeQuestion.topic)}
                    </span>
                    
                    <button
                      id="toggle-scribble-hint-btn"
                      onClick={() => { soundEngine.playScribble(); setShowHint(!showHint); }}
                      className="text-xs sm:text-base font-heading font-medium text-marker hover:underline select-none flex items-center gap-1 cursor-pointer"
                    >
                      <span>💡 Hint scribble</span>
                    </button>
                  </div>

                  {/* Formula Area (The Math Problem itself) */}
                  <div className="text-center py-4 sm:py-8 relative">
                    <h3 id="math-formula-statement" className="font-heading font-bold text-3xl sm:text-6xl md:text-8xl text-pencil tracking-tight select-all leading-normal italic mb-1">
                      {activeQuestion.text}
                    </h3>
                    {activeQuestion.subText && (
                      <p id="math-formula-substatement" className="font-sans text-base sm:text-2xl md:text-3xl text-pencil/80 mt-1.5 sm:mt-2 font-bold select-all">
                        {activeQuestion.subText}
                      </p>
                    )}
                    
                    {/* Immediate Answer Feedback overlay graphics */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center pointer-events-none z-10"
                        >
                          {feedback.isCorrect ? (
                            <div className="text-ballpoint flex flex-col items-center">
                              <span className="font-heading text-xl sm:text-4xl md:text-5xl font-extrabold rotate-[-4deg] scribble-underline-blue">
                                CORRECT! ✨
                              </span>
                              <span className="font-sans text-sm sm:text-lg font-bold mt-1 sm:mt-2 text-pencil">+10 points scribbled</span>
                            </div>
                          ) : (
                            <div className="text-marker flex flex-col items-center">
                              <span className="font-heading text-xl sm:text-4xl md:text-5xl font-extrabold rotate-[4deg] text-scratch">
                                WHOOPS! 🖊️
                              </span>
                              <span className="font-sans text-sm sm:text-xl font-bold mt-1 sm:mt-2 text-pencil">
                                Correct was: <span className="underline font-mono font-black">{activeQuestion.correctAnswer}</span>
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tiny Hint Scribbled blue ballpoint notes */}
                  {showHint && (
                    <div id="hint-scribble-box" className="p-2 sm:p-4 bg-[#f0f5ff] border-2 border-ballpoint rounded-xl border-dashed my-2 sm:my-4 relative">
                      <span className="absolute -top-3 left-4 bg-ballpoint text-white text-[10px] px-2 py-0.5 font-heading rounded font-bold">
                        BLUE PEN NOTE
                      </span>
                      <p className="font-sans text-sm sm:text-lg text-ballpoint font-semibold italic mt-1 leading-relaxed">
                        💡 {activeQuestion.hint || "Think step-by-step; verify your math logic."}
                      </p>
                    </div>
                  )}
                </HandDrawnCard>
              </div>

              {/* INPUT MODULE: MULTIPLE CHOICE OPTION STICKERS */}
              <div id="answering-stage-wrapper" className="pt-2">
                <AnimatePresence mode="wait">
                  
                  <motion.div
                    key="multiple-choices"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {activeQuestion.choices.map((choice, index) => {
                      const optionNumKey = index + 1;
                      
                      return (
                        <button
                          key={`${choice}-${index}`}
                          id={`option-selector-${optionNumKey}`}
                          disabled={feedback !== null}
                          onClick={() => handleAnswer(choice)}
                          style={{
                            borderWidth: '3.5px',
                            borderColor: '#2d2d2d',
                            borderRadius: {
                              0: '200px 25px 250px 20px / 20px 250px 25px 200px',
                              1: '20px 200px 30px 250px / 250px 30px 200px 20px',
                              2: '250px 20px 200px 25px / 25px 200px 20px 250px',
                              3: '25px 250px 20px 200px / 200px 20px 250px 25px'
                            }[index % 4],
                            boxShadow: feedback !== null ? 'none' : '5px 5px 0px 0px #2d2d2d'
                          }}
                          className={`
                            relative p-5 md:p-7 font-mono text-2xl md:text-3.5xl font-black text-center transition-all duration-100 select-none
                            ${feedback !== null 
                              ? 'bg-shading/35 text-pencil/30 cursor-not-allowed shadow-none' 
                              : 'bg-white hover:bg-postit text-pencil hover:scale-[1.03] cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(45,45,45,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]'
                            }
                          `}
                        >
                          <span className="absolute top-2 left-2 font-mono text-xs text-pencil/40 bg-pencil/5 px-1.5 py-0.5 rounded hidden md:block select-none font-normal">
                            [{optionNumKey}] Key
                          </span>
                          <span className="font-mono">{choice}</span>
                        </button>
                      );
                    })}
                  </motion.div>

                </AnimatePresence>

                {/* Helper notice on desktop */}
                <div className="text-center text-pencil/40 text-sm mt-4 font-sans select-none hidden md:block">
                  <span>⌨️ Tip: Press keyboards <strong>[1], [2], [3],</strong> or <strong>[4]</strong> to answer instantly!</span>
                </div>

              </div>
            </motion.div>
          )}

          {/* 4. ROUND END REPORT CARD SHEET */}
          {phase === 'round_end' && (
            <motion.div
              key="round-end-sheet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
            >
              <div className="text-center space-y-2">
                <span className="font-heading text-lg font-bold text-marker uppercase tracking-widest block bg-marker/5 max-w-xs mx-auto py-1 border border-marker/10 rounded">
                  Speed Trial Completed!
                </span>
                
                <h2 className="font-heading text-5xl md:text-7xl font-bold text-pencil tracking-tight select-none">
                  SESSION OVER! 🖊️
                </h2>
                <ScribbleLine className="max-w-md mx-auto" />
              </div>

              {/* REPORT CARD CONTAINER GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* Visual scorecard report */}
                <HandDrawnCard id="desk-report-card" background="ruled" decoration="tack">
                  <h3 className="font-heading text-2xl font-bold mb-4 border-b border-pencil/20 pb-1 text-pencil">
                    📜 Trial Report Card
                  </h3>
                  
                  <div className="space-y-4 font-sans text-lg">
                    {/* 1. Recapped Stats */}
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-pencil/10">
                      <span className="text-pencil/70">Correct calculations:</span>
                      <span className="font-heading font-black text-2xl text-ballpoint">{correctAnswersList.length}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-pencil/10">
                      <span className="text-pencil/70">Missed calculations/Timeouts:</span>
                      <span className="font-heading font-black text-2xl text-marker">{wrongAnswersList.length}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-pencil/10">
                      <span className="text-pencil/70">Total questions attempted:</span>
                      <span className="font-mono font-bold text-xl text-pencil">
                        {correctAnswersList.length + wrongAnswersList.length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-pencil/10">
                      <span className="text-pencil/70">Formulae accuracy:</span>
                      <span className="font-mono font-black text-xl text-pencil">
                        {Math.round((correctAnswersList.length / Math.max(1, correctAnswersList.length + wrongAnswersList.length)) * 100)}%
                      </span>
                    </div>

                    {/* 2. Overall Session Points */}
                    <div className="flex justify-between items-center pt-4">
                      <span className="text-pencil font-bold">Overall Session Points:</span>
                      <span className="font-heading font-black text-4xl text-marker select-all">+{sessionOverallPoints} pts</span>
                    </div>
                  </div>
                </HandDrawnCard>

                {/* ADVANCEMENT METRICS & STICKERS */}
                <div className="space-y-6 flex flex-col justify-between">
                  
                  <HandDrawnCard id="round-stickers-deck" background="postit">
                    <h3 className="font-heading text-xl md:text-2xl font-bold mb-3">🏅 Stickers & achievements</h3>
                    
                    <div className="space-y-3.5">
                      {/* Sticker A: Survivor */}
                      {correctAnswersList.length >= 10 ? (
                        <div className="flex items-center gap-3 bg-white/60 p-2.5 border-2 border-pencil rounded-lg">
                          <HandDrawnStar filled className="text-[#ffd54f] w-8 h-8 shrink-0 rotate-[10deg]" />
                          <div>
                            <p className="font-sans font-bold text-base text-pencil">Survivor Champ</p>
                            <p className="font-sans text-xs text-pencil/60">Outstanding grit! Survived 10+ rapid calculations.</p>
                          </div>
                        </div>
                      ) : null}

                      {/* Sticker B: Accuracy check */}
                      {correctAnswersList.length > 0 && wrongAnswersList.length === 0 ? (
                        <div className="flex items-center gap-3 bg-white/60 p-2.5 border-2 border-pencil rounded-lg rotate-1">
                          <CheckCircle2 className="text-ballpoint w-7 h-7 shrink-0" />
                          <div>
                            <p className="font-sans font-bold text-base text-pencil">Perfect Accuracy</p>
                            <p className="font-sans text-xs text-pencil/60">Flawless execution! 100% accurate results.</p>
                          </div>
                        </div>
                      ) : null}

                      {/* Sticker C: Speed racer */}
                      {correctAnswersList.length >= 5 ? (
                        <div className="flex items-center gap-3 bg-white/60 p-2.5 border-2 border-pencil rounded-lg rotate-[-1deg]">
                          <Sparkles className="text-marker w-7 h-7 shrink-0" />
                          <div>
                            <p className="font-sans font-bold text-base text-pencil">Speed Demon</p>
                            <p className="font-sans text-xs text-pencil/60">Fast-paced arithmetic! Solved 5+ equations.</p>
                          </div>
                        </div>
                      ) : null}

                      {/* Default encouragement stamp */}
                      <div className="flex items-center gap-3 bg-white/60 p-2.5 border-2 border-pencil rounded-lg rotate-[1deg]">
                        <RefreshCw className="text-ballpoint w-6 h-6 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
                        <div>
                          <p className="font-sans font-semibold text-base text-pencil">Practice makes master</p>
                          <p className="font-sans text-xs text-pencil/60">Keep training your mechanical calculation speed!</p>
                        </div>
                      </div>
                    </div>
                  </HandDrawnCard>

                  {/* BOTTOM ACTION BUTTON ROW */}
                  <div className="grid grid-cols-2 gap-4">
                    <HandDrawnButton
                      id="retry-round-btn"
                      variant="accent"
                      onClick={() => initiatePreGame(currentRound)}
                      style={{ borderRadius: '15px' }}
                      className="w-full text-base font-bold"
                    >
                      <RotateCcw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                      RETRY SPEED TRIAL
                    </HandDrawnButton>

                    <HandDrawnButton
                      id="return-menu-card-btn"
                      variant="secondary"
                      onClick={() => { soundEngine.playScribble(); setPhase('menu'); }}
                      style={{ borderRadius: '15px' }}
                      className="w-full text-base"
                    >
                      <Home className="w-5 h-5" />
                      DESK MENU
                    </HandDrawnButton>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER DESK SECTION */}
      <footer id="sketch-math-footer" className="w-full max-w-4xl mt-12 pt-6 border-t border-dashed border-pencil/20 text-center text-sm font-sans text-pencil/40 select-none">
        <p>🖊️ Scribbled with Google AI Studio • Kalam & Patrick Hand Typography Pairings</p>
        <p className="mt-1 font-mono text-[11px]">UTC CLI Clock: 2026-05-23 • Zero Straight Lines Constraint Enabled</p>
      </footer>

    </div>
  );
}
