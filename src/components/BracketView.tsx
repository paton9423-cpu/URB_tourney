import { ArrowLeft, Trophy, Zap, Crown, RotateCcw } from 'lucide-react';
import type { TournamentData, Match } from '../App';

interface BracketViewProps {
  tournamentData: TournamentData;
  onSelectMatch: (match: Match) => void;
  onBackToSetup: () => void;
  onResetMatch: (matchId: string) => void;
}

export function BracketView({ tournamentData, onSelectMatch, onBackToSetup, onResetMatch }: BracketViewProps) {
  const { teams, matches, bracketSize } = tournamentData;

  const round1Matches = matches.filter(m => m.round === 1);
  const round2Matches = matches.filter(m => m.round === 2);
  const round3Matches = matches.filter(m => m.round === 3);
  const finalMatch = matches.find(m => m.round === (bracketSize === 8 ? 3 : 4));

  const tournamentComplete = finalMatch?.status === 'completed';
  const champion = tournamentComplete ? teams.find(t => t.id === finalMatch.winnerId) : null;

  const getTeamById = (id: string) => teams.find(t => t.id === id);

  const getMatchStatusColor = (match: Match) => {
    if (match.status === 'completed') return 'border-green-500/50 bg-green-900/10';
    if (match.status === 'in-progress') return 'border-yellow-500/50 bg-yellow-900/10 animate-pulse';
    return 'border-gray-700 bg-gray-800/40 hover:border-gray-500';
  };

  const getRoundTeamSize = (round: number) => {
    if (bracketSize === 8) {
      return [2, 3, 5][round - 1];
    } else {
      return [2, 3, 4, 5][round - 1];
    }
  };

  const MatchCard = ({ match }: { match: Match }) => {
    const teamA = getTeamById(match.teamAId);
    const teamB = getTeamById(match.teamBId);
    const teamSize = getRoundTeamSize(match.round);

    if (!teamA || !teamB) return null;

    const handleResetClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to reset this match? This will revert recruitment and eliminations.")) {
        onResetMatch(match.id);
      }
    };

    return (
      <div className="relative group/card">
        <button
          onClick={() => onSelectMatch(match)}
          className={`relative w-96 p-4 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-900/20 text-left w-full ${getMatchStatusColor(match)}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{teamSize}v{teamSize} Duel</span>
            </div>
            <div className="flex items-center gap-2">
                {match.status === 'in-progress' && <Zap className="w-4 h-4 text-yellow-400" />}
                {match.status === 'completed' && <Trophy className="w-4 h-4 text-green-400" />}
            </div>
          </div>

          {/* Match Body */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            
            {/* Team A */}
            <div className={`flex flex-col items-center p-2 rounded-lg transition-all ${match.winnerId === teamA.id ? 'bg-cyan-500/10' : ''} ${teamA.eliminated ? 'opacity-40 grayscale' : ''}`}>
              <span className={`font-black text-lg text-center leading-tight ${match.winnerId === teamA.id ? 'text-cyan-400' : 'text-gray-300'}`}>
                {teamA.name}
              </span>
              {match.winnerId === teamA.id && <Crown className="w-4 h-4 text-cyan-400 mt-1" />}
            </div>

            {/* VS / Score */}
            <div className="flex flex-col items-center justify-center">
                {(match.status === 'completed' || match.status === 'in-progress') ? (
                    <div className="text-2xl font-black text-white bg-black/40 px-3 py-1 rounded-lg border border-white/10 tracking-widest">
                        {match.teamAScore} - {match.teamBScore}
                    </div>
                ) : (
                    <span className="text-gray-600 font-bold italic text-xl">VS</span>
                )}
            </div>

            {/* Team B */}
            <div className={`flex flex-col items-center p-2 rounded-lg transition-all ${match.winnerId === teamB.id ? 'bg-purple-500/10' : ''} ${teamB.eliminated ? 'opacity-40 grayscale' : ''}`}>
              <span className={`font-black text-lg text-center leading-tight ${match.winnerId === teamB.id ? 'text-purple-400' : 'text-gray-300'}`}>
                {teamB.name}
              </span>
              {match.winnerId === teamB.id && <Crown className="w-4 h-4 text-purple-400 mt-1" />}
            </div>

          </div>
        </button>

        {/* Reset Button */}
        {match.status === 'completed' && (
           <button 
             onClick={handleResetClick}
             className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover/card:opacity-100 transition-all scale-75 group-hover/card:scale-100 z-20 border-2 border-slate-900"
             title="Reset Match (Undo)"
           >
             <RotateCcw size={16} />
           </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-full p-4 md:p-8 flex flex-col">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button onClick={onBackToSetup} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-lg">
            Tournament Bracket
          </h1>
        </div>
        <div className="w-20"></div>
      </div>

      {/* Champion Banner */}
      {tournamentComplete && champion && (
        <div className="mb-12 mx-auto max-w-2xl w-full bg-gradient-to-b from-yellow-500/20 to-yellow-900/10 border border-yellow-500/50 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-in slide-in-from-top duration-700">
          <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <div className="text-yellow-200 uppercase tracking-widest text-sm font-bold mb-2">Tournament Champion</div>
          <div className="text-6xl font-black text-white mb-6 drop-shadow-lg">{champion.name}</div>
          <div className="flex flex-wrap justify-center gap-2">
             {champion.players.map(p => (
               <span key={p.id} className="bg-yellow-500/20 text-yellow-200 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/30">
                 {p.name}
               </span>
             ))}
          </div>
        </div>
      )}

      {/* PYRAMID BRACKET LAYOUT */}
      <div className="flex-1 flex items-center justify-center overflow-x-auto py-8">
        <div className="flex gap-16 items-center min-w-max">
          
          {/* COLUMN 1: ROUND 1 */}
          <div className="flex flex-col gap-8 justify-center">
             <div className="text-center mb-2">
                <span className="bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/30">ROUND 1</span>
             </div>
             {round1Matches.map(match => (
                <div key={match.id} className="relative">
                   <MatchCard match={match} />
                   <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-gray-700"></div>
                </div>
             ))}
          </div>

          {/* COLUMN 2: ROUND 2 */}
          <div className="flex flex-col gap-32 justify-center pt-8">
             <div className="text-center -mt-12 mb-2">
                <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">ROUND 2</span>
             </div>
             {round2Matches.length > 0 ? round2Matches.map(match => (
                <div key={match.id} className="relative">
                   <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-gray-700"></div>
                   <MatchCard match={match} />
                   <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-gray-700"></div>
                </div>
             )) : (
                Array(bracketSize === 8 ? 2 : 4).fill(0).map((_, i) => (
                    <div key={i} className="w-96 h-40 border-2 border-dashed border-gray-800 rounded-2xl flex items-center justify-center text-gray-700 text-sm font-bold uppercase tracking-widest">Locked</div>
                ))
             )}
          </div>

          {/* COLUMN 3: ROUND 3 (Only 16 Teams) */}
          {bracketSize === 16 && (
             <div className="flex flex-col gap-64 justify-center pt-16">
                {round3Matches.length > 0 ? round3Matches.map(match => (
                  <div key={match.id} className="relative">
                     <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-gray-700"></div>
                     <MatchCard match={match} />
                     <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-gray-700"></div>
                  </div>
                )) : (
                   Array(2).fill(0).map((_, i) => (
                     <div key={i} className="w-96 h-40 border-2 border-dashed border-gray-800 rounded-2xl flex items-center justify-center text-gray-700 text-sm font-bold uppercase tracking-widest">Locked</div>
                   ))
                )}
             </div>
          )}

          {/* COLUMN FINAL */}
          <div className="flex flex-col justify-center">
             <div className="text-center mb-6">
                <span className="bg-yellow-900/50 text-yellow-300 px-4 py-1 rounded-full text-xs font-bold border border-yellow-500/30 flex items-center gap-2 w-max mx-auto">
                    <Crown size={12} /> FINALE
                </span>
             </div>
             {finalMatch ? (
                <div className="relative scale-110">
                   <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-gray-700"></div>
                   <MatchCard match={finalMatch} />
                </div>
             ) : (
                <div className="w-96 h-40 border-2 border-dashed border-gray-800 rounded-2xl flex items-center justify-center text-gray-700 text-sm font-bold uppercase tracking-widest">Awaiting Finalists</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}