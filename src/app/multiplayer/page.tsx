'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LyricCard } from '@/components/organisms/LyricCard';
import { StatisticsPanel } from '@/components/molecules/statistics-panel';
import { SongOptions } from '@/components/molecules/song-options';
import { useEffect, useState } from 'react';
import { useModalStore } from '@/store/modal-store';
import WaitingForOpponent from '@/components/organisms/waiting-for-opponent';
import { useMultiplayerGame } from '@/lib/dojo/hooks/useMultiplayerGame';
import { Answer, parseQuestionCardOption, mapRoundStateToEnum } from '@/lib/dojo/useSystemCalls';
import LoadingSpinner from '@/components/atoms/loading-spinner';

// Define the SongOption type
interface SongOption {
  title: string;
  artist: string;
}

export default function MultiplayerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { modalPayload } = useModalStore();
  
  // 🚀 KEY ADDITION: Get round ID from URL params OR modal payload
  const urlRoundId = searchParams?.get('roundId');
  const modalRoundId = modalPayload?.roundId;
  const roundId = urlRoundId || modalRoundId;

  // Convert to BigInt if we have a roundId
  const roundIdBigInt = roundId ? BigInt(roundId) : null;
  
  // Removed excessive debug logging
  
  // Use contract-based multiplayer game instead of mock
  const {
    gamePhase,
    currentCard,
    timeRemaining,
    round,
    playersCount,
    getNextCard,
    submitAnswer,
    canAnswer,
    myScore,
    correctAnswers,
    totalAnswers,
    isLoading,
    error,
    lastAnswerCorrectness,
    isGameComplete,
    isEventSubscribed,
    playerAnswerEvents
  } = useMultiplayerGame(roundIdBigInt!);

  // Local state for UI
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Validate round ID
  useEffect(() => {
    if (!roundIdBigInt) {
      console.error('No round ID provided, redirecting to home');
      router.push('/');
      return;
    }
  }, [roundIdBigInt, router]);

  // Auto-start game when round state changes to IN_PROGRESS or PENDING
  useEffect(() => {
    // PROPER BIGINT CONVERSION
    const roundState = round?.state ? Number(BigInt(round.state)) : null;
    const roundStateText = round?.state ? mapRoundStateToEnum(round.state) : 'UNKNOWN';
    
    // Removed excessive debug logging
    
    // Try to get first card if round is IN_PROGRESS (1) or PENDING (3)
    if ((roundState === 1 || roundState === 3) && gamePhase === 'starting') {
      console.log('[MultiplayerPage] Round started/pending, getting first card...');
      getNextCard();
    }
  }, [round?.state, gamePhase]); // Remove getNextCard from dependencies to prevent re-renders

  // Handle back button
  const handleBack = () => {
    router.push('/');
  };

  // Handle song selection
  const handleSongSelect = async (option: SongOption, index: number) => {
    if (!canAnswer || selectedOption !== null) {
      console.log('[MultiplayerPage] Cannot answer at this time');
      return;
    }

    console.log('[MultiplayerPage] Selected option:', { option, index });
    setSelectedOption(index);

    try {
      await submitAnswer(index as Answer);
      
      // Reset selection when game state resets (handled by useEffect below)
      
    } catch (err) {
      console.error('[MultiplayerPage] Failed to submit answer:', err);
      setSelectedOption(null);
    }
  };

  // Reset selectedOption when game state resets to new card
  useEffect(() => {
    if (gamePhase === 'card_active' && canAnswer) {
      setSelectedOption(null);
    }
  }, [gamePhase, canAnswer]);

  // Extract options from the current card
  const songOptions: SongOption[] = currentCard ? [
    parseQuestionCardOption(currentCard.option_one),
    parseQuestionCardOption(currentCard.option_two),
    parseQuestionCardOption(currentCard.option_three),
    parseQuestionCardOption(currentCard.option_four),
  ] : [];

  // Determine correct option based on game state - simplified for immediate feedback
  // Removed getCorrectOption - now using simple isCorrect boolean

  // Handle loading state
  if (!roundIdBigInt) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">No round ID provided</h2>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
          <h2 className="text-xl font-bold mb-4 mt-4">Loading game...</h2>
          <p className="text-sm text-gray-500 mt-2">Connecting to round {roundIdBigInt.toString()}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">Error</h2>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Don't show waiting component if we're on the multiplayer page with a roundId
  // The user should only reach this page after the round has started
  if (gamePhase === 'waiting' && !roundIdBigInt) {
    return <WaitingForOpponent onStart={() => {
      console.log('[MultiplayerPage] Game started from waiting screen');
      // The useMultiplayerGame hook will handle the transition automatically
    }} />;
  }

  if (gamePhase === 'completed') {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Game Completed!</h2>
          <p className="text-lg mb-2">Final Score: {myScore}</p>
          <p className="text-sm text-gray-600 mb-4">
            Correct Answers: {correctAnswers} / {totalAnswers}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Render actual gameplay UI
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back button and header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Multiplayer Game</h1>
        <p className="text-gray-600 text-sm">
          Round ID: {roundIdBigInt.toString()} | Players: {playersCount} | Score: {myScore}
        </p>
        {/* 🚀 NEW: Event subscription status indicator */}
        <div className="flex items-center gap-2 mt-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isEventSubscribed ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={isEventSubscribed ? 'text-green-600' : 'text-red-600'}>
            {isEventSubscribed ? 'Real-time updates connected' : 'Real-time updates disconnected'}
          </span>
          {playerAnswerEvents.length > 0 && (
            <span className="text-blue-600">
              | Events: {playerAnswerEvents.length}
            </span>
          )}
        </div>
        {(gamePhase === 'starting' || gamePhase === 'waiting') && (
          <button
            onClick={() => {
              console.log('[MultiplayerPage] Manual start button clicked');
              getNextCard();
            }}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start Game / Get First Card
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lyric card - center column on desktop, full width on mobile */}
        <div className="lg:col-start-2 lg:col-span-1 order-1 lg:order-2">
          {currentCard ? (
            <LyricCard
              lyrics={[{
                text: currentCard.lyric,
                title: "Guess the Song",
                artist: "Multiple Choice",
              }]}
              isFlipped={false}
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <div className="text-center">
                {gamePhase === 'loading_card' ? (
                  <>
                    <LoadingSpinner />
                    <p className="mt-2">Loading next card...</p>
                  </>
                ) : (
                  <p>Waiting for next card...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistics panel - right column */}
        <div className="lg:col-start-3 lg:col-span-1 order-2 lg:order-3">
          <StatisticsPanel
            time={`${timeRemaining}s`}
            myScore={myScore}
            scores={`${correctAnswers}/${totalAnswers} correct`}
            multiplayer={true}
          />
          
          {gamePhase === 'card_results' && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-medium">Answer submitted!</p>
              <p className="text-xs text-gray-600">Waiting for results...</p>
            </div>
          )}
          
          {/* 🚀 NEW: Answer feedback indicator */}
          {lastAnswerCorrectness !== null && (
            <div className={`mt-4 p-4 rounded-lg border ${
              lastAnswerCorrectness 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${
                  lastAnswerCorrectness ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <p className="text-sm font-medium">
                  {lastAnswerCorrectness ? 'Correct!' : 'Incorrect'}
                </p>
              </div>
              <p className="text-xs mt-1">
                {lastAnswerCorrectness 
                  ? `+10 points! Total: ${myScore}` 
                  : 'Better luck next time!'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {currentCard && songOptions.length > 0 && (
        <SongOptions
          options={songOptions}
          onSelect={handleSongSelect}
          selectedOption={selectedOption !== null ? songOptions[selectedOption] : null}
          isCorrect={lastAnswerCorrectness}
        />
      )}

      {!canAnswer && gamePhase === 'card_active' && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Answer submitted. Waiting for next card...</p>
        </div>
      )}
    </div>
  );
}
