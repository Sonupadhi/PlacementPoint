import React from 'react';
import { CheckCircle2, XCircle, Clock, Award } from 'lucide-react';

export const ProgressBar = ({ 
  rounds = [], 
  currentRound = null, 
  status = 'IN_PROGRESS',
  title = null,
  interactive = false,
  onStageSelect = null,
  statusBadgeText = null
}) => {
  if (!rounds || rounds.length === 0) return null;

  const currentOrder = currentRound ? currentRound.round_order : 1;

  const getStepState = (round) => {
    if (status === 'SELECTED') return 'completed';
    if (status === 'REJECTED' && round.round_order === currentOrder) return 'rejected';
    if (round.round_order < currentOrder) return 'completed';
    if (round.round_order === currentOrder) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full py-4 px-3 bg-slate-50/60 rounded-2xl border border-slate-200/80 my-2">
      {/* Dynamic Status Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title || `Recruitment Timeline (${rounds.length} Stages)`}
        </span>
        <div>
          {statusBadgeText ? (
            <span className={`badge ${
              status === 'SELECTED' ? 'badge-selected' :
              status === 'REJECTED' ? 'badge-rejected' : 'badge-in-progress'
            } px-3 py-1 text-xs`}>
              {status === 'SELECTED' ? <Award className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />} {statusBadgeText}
            </span>
          ) : (
            <>
              {status === 'SELECTED' && (
                <span className="badge badge-selected px-3 py-1 text-xs flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> OFFER RECEIVED / SELECTED
                </span>
              )}
              {status === 'REJECTED' && (
                <span className="badge badge-rejected px-3 py-1 text-xs flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> REJECTED AT STAGE {currentOrder}
                </span>
              )}
              {status === 'IN_PROGRESS' && (
                <span className="badge badge-in-progress px-3 py-1 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> CURRENT STAGE: {currentRound?.round_name || 'Applied'}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dynamic Stepper Bar */}
      <div className="relative flex items-center justify-between my-2 px-2">
        {/* Background Line */}
        <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />

        {/* Progress Fill Line */}
        <div
          className={`absolute top-1/2 left-4 h-1.5 -translate-y-1/2 z-0 rounded-full transition-all duration-500 ${
            status === 'REJECTED' ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-sky-400'
          }`}
          style={{
            width: status === 'SELECTED' 
              ? 'calc(100% - 2rem)' 
              : `calc(${((currentOrder - 1) / (rounds.length - 1 || 1)) * 100}% * 0.9 + 1rem)`
          }}
        />

        {/* Stage Nodes */}
        {rounds.map((round) => {
          const stepState = getStepState(round);

          return (
            <div 
              key={round.round_id || round.round_order} 
              onClick={() => interactive && onStageSelect && onStageSelect(round)}
              className={`relative z-10 flex flex-col items-center group ${
                interactive ? 'cursor-pointer' : ''
              }`}
              title={interactive ? `Click to advance drive to ${round.round_name}` : round.round_name}
            >
              {/* Stage Icon Node */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  stepState === 'completed'
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md shadow-emerald-500/20'
                    : stepState === 'current'
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/30 animate-pulse'
                    : stepState === 'rejected'
                    ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-md shadow-rose-500/20'
                    : 'bg-white text-slate-400 border-2 border-slate-300 shadow-xs'
                } ${interactive ? 'group-hover:scale-110 group-hover:ring-4 group-hover:ring-blue-300' : ''}`}
              >
                {stepState === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : stepState === 'rejected' ? (
                  <XCircle className="w-5 h-5 text-white" />
                ) : (
                  round.round_order
                )}
              </div>

              {/* Stage Label */}
              <div className="mt-2.5 text-center">
                <p
                  className={`text-xs font-bold max-w-[95px] truncate ${
                    stepState === 'current'
                      ? 'text-blue-600 font-extrabold'
                      : stepState === 'completed'
                      ? 'text-emerald-700'
                      : stepState === 'rejected'
                      ? 'text-rose-600'
                      : 'text-slate-400'
                  }`}
                >
                  {round.round_name}
                </p>
                {interactive && (
                  <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 font-medium transition-opacity block -mt-0.5">
                    Select
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
