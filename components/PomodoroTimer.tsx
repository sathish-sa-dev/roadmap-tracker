import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_POMODORO_WORK_MINUTES, DEFAULT_POMODORO_BREAK_MINUTES } from '../constants';

enum TimerState {
  Stopped = 'Stopped',
  Work = 'Work',
  Break = 'Break',
  Paused = 'Paused',
}

interface PomodoroTimerProps {
  workDuration?: number; // in seconds
  breakDuration?: number; // in seconds
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  workDuration = DEFAULT_POMODORO_WORK_MINUTES * 60,
  breakDuration = DEFAULT_POMODORO_BREAK_MINUTES * 60,
}) => {
  const [currentWorkDuration, setCurrentWorkDuration] = useState(workDuration);
  const [currentBreakDuration, setCurrentBreakDuration] = useState(breakDuration);

  const [timeLeft, setTimeLeft] = useState(currentWorkDuration);
  const [timerState, setTimerState] = useState<TimerState>(TimerState.Stopped);
  const [isWorkSession, setIsWorkSession] = useState(true);

  useEffect(() => {
    setCurrentWorkDuration(workDuration > 0 ? workDuration : DEFAULT_POMODORO_WORK_MINUTES * 60);
    setCurrentBreakDuration(breakDuration > 0 ? breakDuration : DEFAULT_POMODORO_BREAK_MINUTES * 60);
  }, [workDuration, breakDuration]);

  useEffect(() => {
    // If timer is stopped or settings change, update timeLeft for the work session
    if (timerState === TimerState.Stopped) {
      setTimeLeft(currentWorkDuration);
      setIsWorkSession(true);
    }
  }, [currentWorkDuration]);


  const resetTimer = useCallback(() => {
    setTimerState(TimerState.Stopped);
    setIsWorkSession(true);
    setTimeLeft(currentWorkDuration);
  }, [currentWorkDuration]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setTimeout> | null = null;

    if (timerState === TimerState.Work || timerState === TimerState.Break) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            if (intervalId) clearInterval(intervalId);
            if (isWorkSession) {
              setTimerState(TimerState.Break);
              setIsWorkSession(false);
              setTimeLeft(currentBreakDuration);
              alert("Work session finished! Time for a break.");
            } else {
              setTimerState(TimerState.Work);
              setIsWorkSession(true);
              setTimeLeft(currentWorkDuration);
              alert("Break finished! Time for work.");
            }
            return 0; 
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalId) clearInterval(intervalId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerState, isWorkSession, currentWorkDuration, currentBreakDuration]);


  const handleStartPause = () => {
    if (timerState === TimerState.Stopped) {
      setTimerState(TimerState.Work);
      setIsWorkSession(true);
      setTimeLeft(currentWorkDuration);
    } else if (timerState === TimerState.Paused) {
      setTimerState(isWorkSession ? TimerState.Work : TimerState.Break);
    } else { 
      setTimerState(TimerState.Paused);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  let buttonText = "Start";
  if (timerState === TimerState.Work || timerState === TimerState.Break) buttonText = "Pause";
  if (timerState === TimerState.Paused) buttonText = "Resume";
  
  let currentModeText = "Pomodoro";
  if (timerState === TimerState.Work) currentModeText = "Focus Time";
  if (timerState === TimerState.Break) currentModeText = "Break Time";
  if (timerState === TimerState.Paused) currentModeText = isWorkSession ? "Focus Paused" : "Break Paused";


  return (
    <div className="p-3 bg-white rounded-lg shadow-md flex items-center justify-between space-x-3 text-sm">
      <div className="flex flex-col items-center">
        <span className="font-semibold text-gray-700">{currentModeText}</span>
        <span className="text-2xl font-mono text-blue-600 tracking-wider">{formatTime(timeLeft)}</span>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleStartPause}
          className="px-3 py-1.5 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {buttonText}
        </button>
        <button
          onClick={resetTimer}
          disabled={timerState === TimerState.Stopped}
          className="px-3 py-1.5 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
