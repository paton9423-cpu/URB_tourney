import React, { useState, useEffect } from 'react';
import { ArrowLeft, Dices, Swords, Trophy, Crown, Lock, Target, AlertTriangle, Coins } from 'lucide-react';
import type { Match, TournamentData, Team, Player } from '../App';

interface MatchManagerProps {
  match: Match;
  tournamentData: TournamentData;
  onMatchComplete: (match: Match, winnerId: string) => void;
  onBackToBracket: () => void;
  allowRandomize?: boolean;
  allPlayers: Player[]; // AJOUTÉ POUR CORRIGER L'ERREUR DE BUILD
}

interface DuelState {
  pA: Player | null;
  pB: Player | null;
  winner: string | null;
}

export function MatchManager({ 
  match, 
  tournamentData, 
  onMatchComplete, 
  onBackToBracket,
  allowRandomize,
  allPlayers // AJOUTÉ ICI AUSSI
}: MatchManagerProps) {
  const teamA = tournamentData.teams.find(t => t.id === match.teamAId);
  const teamB = tournamentData.teams.find(t => t.id === match.teamBId);

  // --- CONFIGURATION ---
  const isFinals = match.roundName.includes('Finale') || match.roundName.includes('5v5');
  const is4v4 = match.roundName.includes('4v4');
  const is3v3 = match.roundName.includes('3v3');
  const isCoinFlipRound = isFinals || is3v3; 
  
  const requiredWins = isFinals ? 3 : 2;
  const maxDuels = isFinals ? 5 : 3;

  // --- STATE ---
  const [advantageDuel, setAdvantageDuel] = useState<DuelState>({ pA: null, pB: null, winner: null });
  const [coinFlipWinner, setCoinFlipWinner] = useState<string | null>(null);
  
  const [duels, setDuels] = useState<DuelState[]>(
    Array(maxDuels).fill({ pA: null, pB: null, winner: null })
  );

  // Calculate scores dynamically from duels
  const scoreA = duels.filter(d => d.winner === match.teamAId).length;
  const scoreB = duels.filter(d => d.winner === match.teamBId).length;

  // --- HELPERS ---
  const getUsedPlayerIds = (currentDuelIndex: number) => {
    const used = new Set<string>();
    duels.forEach((d, idx) => {
      if (idx !== currentDuelIndex) {
        if (d.pA) used.add(d.pA.id);
        if (d.pB) used.add(d.pB.id);
      }
    });
    if (is4v4 && advantageDuel.pA) used.add(advantageDuel.pA.id);
    if (is4v4 && advantageDuel.pB) used.add(advantageDuel.pB.id);
    return used;
  };

  const updateDuel = (index: number, field: keyof DuelState, value: any) => {
    const newDuels = [...duels];
    newDuels[index] = { ...newDuels[index], [field]: value };
    setDuels(newDuels);
  };

  // --- AUTOMATION ---

  const handleRandomize = () => {
    if (!teamA || !teamB) return;
    const tA_shuffled = [...teamA.players].sort(() => 0.5 - Math.random());
    const tB_shuffled = [...teamB.players].sort(() => 0.5 - Math.random());
    
    const newDuels = duels.map((_, i) => ({
      pA: tA_shuffled[i] || null,
      pB: tB_shuffled[i] || null,
      winner: null
    }));
    newDuels[2] = { pA: null, pB: null, winner: null };
    setDuels(newDuels);
  };

  // Tie-Breaker Automation
  useEffect(() => {
    if (match.round === 1 && teamA && teamB) {
      const d1 = duels[0];
      const d2 = duels[1];
      
      if (d1.winner && d2.winner && scoreA === 1 && scoreB === 1) {
         const loserA = (d1.winner === teamB.id ? d1.pA : null) || (d2.winner === teamB.id ? d2.pA : null);
         const loserB = (d1.winner === teamA.id ? d1.pB : null) || (d2.winner === teamA.id ? d2.pB : null);
         
         if (loserA && loserB && (!duels[2].pA || duels[2].pA.id !== loserA.id)) {
            const newDuels = [...duels];
            newDuels[2] = { pA: loserA, pB: loserB, winner: null };
            setDuels(newDuels);
         }
      }
    }
  }, [scoreA, scoreB, match.round, duels, teamA, teamB]);

  // Win Condition & DATA PASSING FIX
  useEffect(() => {
    if (scoreA >= requiredWins || scoreB >= requiredWins) {
        // Create an updated match object WITH THE SCORES
        const updatedMatch = {
            ...match,
            teamAScore: scoreA,
            teamBScore: scoreB
        };

        if (scoreA >= requiredWins) onMatchComplete(updatedMatch, match.teamAId);
        if (scoreB >= requiredWins) onMatchComplete(updatedMatch, match.teamBId);
    }
  }, [scoreA, scoreB]); // Runs whenever score updates

  if (!teamA || !teamB) return <div>Loading...</div>;

  // --- SELECTION LOGIC ---
  const handleCoinFlip = () => {
      setCoinFlipWinner(Math.random() > 0.5 ? teamA.id : teamB.id);
  }

  const getSelectorTeam = (duelIndex: number) => {
    if (match.round === 1) return null; 

    if (is4v4) {
        if (!advantageDuel.winner) return 'Locked';
        if (duelIndex === 0) return advantageDuel.winner === teamA.id ? teamB : teamA;
        if (duelIndex === 1) return duels[0].winner ? (duels[0].winner === teamA.id ? teamB : teamA) : null;
        if (duelIndex === 2) return advantageDuel.winner === teamA.id ? teamA : teamB;
    }

    if (isCoinFlipRound) {
        if (!coinFlipWinner) return 'Locked';
        const winnerTeam = teamA.id === coinFlipWinner ? teamA : teamB;
        const loserTeam = teamA.id === coinFlipWinner ? teamB : teamA;

        if (isFinals && duelIndex === 4) return 'Auto'; // Kept logic helper, but auto-fill removed
        if (duelIndex % 2 === 0) return winnerTeam;
        return loserTeam;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-800/40 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <button onClick={onBackToBracket} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="text-center">
             <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-lg">
               {match.roundName}
             </h2>
             <div className="flex items-center justify-center gap-2 text-gray-300 font-bold mt-2 bg-black/20 py-1 px-4 rounded-full inline-flex mx-auto">
                {isFinals ? <Crown size={16} className="text-yellow-400" /> : <Swords size={16} />}
                <span>Best of {isFinals ? '5' : '3'} (First to {requiredWins})</span>
             </div>
        </div>
        <div className="w-24"></div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-12 items-center bg-gray-800/60 p-6 md:p-10 rounded-2xl border border-gray-700 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        <div className="text-center space-y-4 relative z-10">
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{teamA.name}</h3>
          <div className={`text-7xl md:text-9xl font-black tabular-nums transition-all leading-none ${scoreA >= requiredWins ? 'text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'text-white'}`}>{scoreA}</div>
        </div>
        <div className="flex flex-col items-center justify-center relative z-10"><div className="text-2xl md:text-4xl font-black text-gray-600 italic">VS</div></div>
        <div className="text-center space-y-4 relative z-10">
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{teamB.name}</h3>
          <div className={`text-7xl md:text-9xl font-black tabular-nums transition-all leading-none ${scoreB >= requiredWins ? 'text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.6)]' : 'text-white'}`}>{scoreB}</div>
        </div>
      </div>

      {/* 4v4 Advantage Duel */}
      {is4v4 && (
        <div className="bg-gray-800/80 rounded-xl p-6 border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
          <div className="flex items-center justify-center gap-2 mb-4 text-yellow-400 font-black uppercase tracking-wider text-lg">
            <Target size={24} /> <span>Advantage Duel (1v1)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <select className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white w-full" value={advantageDuel.pA?.id || ''} onChange={(e) => setAdvantageDuel(prev => ({...prev, pA: teamA.players.find(p => p.id === e.target.value) || null}))} disabled={!!advantageDuel.winner}><option value="">Select Player...</option>{teamA.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <div className="flex gap-2 justify-center">
               <button onClick={() => setAdvantageDuel(prev => ({ ...prev, winner: teamA.id }))} className={`px-6 py-2 rounded-lg font-bold transition-all ${advantageDuel.winner === teamA.id ? 'bg-cyan-500 text-black shadow-lg scale-105' : 'bg-gray-700 text-gray-400'}`}>A Wins</button>
               <button onClick={() => setAdvantageDuel(prev => ({ ...prev, winner: teamB.id }))} className={`px-6 py-2 rounded-lg font-bold transition-all ${advantageDuel.winner === teamB.id ? 'bg-purple-500 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400'}`}>B Wins</button>
            </div>
            <select className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white w-full" value={advantageDuel.pB?.id || ''} onChange={(e) => setAdvantageDuel(prev => ({...prev, pB: teamB.players.find(p => p.id === e.target.value) || null}))} disabled={!!advantageDuel.winner}><option value="">Select Player...</option>{teamB.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
        </div>
      )}

      {/* Coin Flip (3v3 / 5v5) */}
      {isCoinFlipRound && (
         <div className={`transition-all duration-500 ${coinFlipWinner ? 'bg-gray-800/40 border-gray-700' : 'bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 border-yellow-500/50'} rounded-xl p-6 border shadow-lg`}>
            {!coinFlipWinner ? (
                <div className="text-center space-y-4">
                    <h4 className="text-yellow-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Coins /> Match Initiation</h4>
                    <button onClick={handleCoinFlip} className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg shadow-lg">FLIP COIN</button>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-500"><Coins size={24} /></div>
                        <div><div className="text-xs text-gray-400 uppercase font-bold">Priority Winner</div><div className="text-xl font-bold text-white">{coinFlipWinner === teamA.id ? teamA.name : teamB.name}</div></div>
                    </div>
                </div>
            )}
         </div>
      )}

      {/* Randomizer (Round 1 Only) */}
      {allowRandomize && (
        <div className="flex justify-center">
          <button onClick={handleRandomize} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg">
            <Dices size={20} /> Randomize Matchups
          </button>
        </div>
      )}

      {/* DUELS LIST */}
      <div className="space-y-4">
        {duels.map((duel, idx) => {
          if (match.round === 1) {
             if (idx > 2) return null;
             if (idx === 2 && !duel.pA) return null; 
          } else {
             if (scoreA >= requiredWins || scoreB >= requiredWins) {
                 if (!duel.pA && !duel.pB && !duel.winner) return null;
             }
          }

          const selectorTeam = getSelectorTeam(idx);
          const isLocked = match.round === 1 ? false : (selectorTeam === 'Locked' || selectorTeam === null);
          const usedIds = getUsedPlayerIds(idx);
          const isTieBreaker = match.round === 1 && idx === 2;

          return (
            <div key={idx} className={`relative transition-all duration-500 ${isLocked ? 'opacity-50 grayscale' : 'opacity-100'}`}>
              
              {selectorTeam && typeof selectorTeam !== 'string' && (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-sm font-black px-6 py-2 rounded-full shadow-2xl shadow-blue-500/50 border-2 border-blue-400 animate-bounce tracking-wide">
                    {selectorTeam.name} PICKS!
                 </div>
              )}
               {isTieBreaker && (
                 <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold mb-2 animate-pulse">
                    <AlertTriangle size={18} /> <span>TIE-BREAKER: Loser vs Loser</span>
                 </div>
              )}

              {/* Selector UI */}
              {(!allowRandomize && !isLocked && !isTieBreaker) && (
                 <div className="bg-gray-800 p-3 rounded-t-xl border-x border-t border-gray-600 flex gap-4 items-center justify-center">
                    <span className="text-gray-400 font-bold text-sm uppercase">Duel {idx + 1}</span>
                    <select className="bg-gray-900 text-white text-sm rounded border border-gray-600 p-2 w-48 focus:ring-2 focus:ring-cyan-500" value={duel.pA?.id || ''} onChange={(e) => updateDuel(idx, 'pA', teamA.players.find(p => p.id === e.target.value) || null)}>
                        <option value="">Select Player...</option>
                        {teamA.players.map(p => <option key={p.id} value={p.id} disabled={usedIds.has(p.id)} className={usedIds.has(p.id) ? 'text-gray-600' : ''}>{p.name}</option>)}
                    </select>
                    <span className="text-gray-500 font-bold">VS</span>
                    <select className="bg-gray-900 text-white text-sm rounded border border-gray-600 p-2 w-48 focus:ring-2 focus:ring-purple-500" value={duel.pB?.id || ''} onChange={(e) => updateDuel(idx, 'pB', teamB.players.find(p => p.id === e.target.value) || null)}>
                        <option value="">Select Player...</option>
                        {teamB.players.map(p => <option key={p.id} value={p.id} disabled={usedIds.has(p.id)} className={usedIds.has(p.id) ? 'text-gray-600' : ''}>{p.name}</option>)}
                    </select>
                 </div>
              )}

              <DuelCard 
                pA={duel.pA} pB={duel.pB} winner={duel.winner} 
                teamAId={teamA.id} teamBId={teamB.id} 
                onWin={(w: string) => updateDuel(idx, 'winner', w)} 
                label={`Duel ${idx + 1}`} 
                isLocked={isLocked} 
                lockedMessage={isLocked ? "Pending previous results..." : ""} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DuelCard({ pA, pB, winner, teamAId, teamBId, onWin, label, isLocked, lockedMessage }: any) {
  if (isLocked) return <div className="h-28 bg-black/20 rounded-xl border border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 gap-2"><Lock size={20} /><span className="text-sm font-medium">{lockedMessage || 'Locked'}</span></div>;
  if (!pA || !pB) return <div className="h-28 bg-black/20 rounded-xl border border-dashed border-gray-700 flex items-center justify-center text-gray-500 text-sm font-medium">Waiting for selection...</div>;

  return (
    <div className={`relative flex items-stretch rounded-xl border-2 overflow-hidden transition-all duration-300 group h-28 ${winner ? 'opacity-90 border-transparent' : 'bg-gray-800 border-gray-700 hover:border-gray-500'} shadow-lg`}>
      <button onClick={() => onWin(teamAId)} className={`flex-1 px-8 py-4 text-left relative transition-all duration-300 ${winner === teamAId ? 'bg-gradient-to-r from-cyan-600 to-cyan-800 text-white' : 'hover:bg-cyan-900/20 text-gray-300'}`}>
        <div className="flex items-center justify-between"><div><span className={`text-xs uppercase font-bold tracking-wider ${winner === teamAId ? 'text-cyan-200' : 'text-gray-500'}`}>{label}</span><div className="text-2xl font-bold mt-1">{pA.name}</div></div>{winner === teamAId && <Trophy className="text-white w-8 h-8 drop-shadow-md animate-bounce" />}</div>
      </button>
      <div className="w-0.5 bg-gray-800 relative z-10"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-gray-500 text-xs font-bold px-2 py-1 rounded border border-gray-700">VS</div></div>
      <button onClick={() => onWin(teamBId)} className={`flex-1 px-8 py-4 text-right relative transition-all duration-300 ${winner === teamBId ? 'bg-gradient-to-l from-purple-600 to-purple-800 text-white' : 'hover:bg-purple-900/20 text-gray-300'}`}>
        <div className="flex items-center justify-between flex-row-reverse"><div><span className={`text-xs uppercase font-bold tracking-wider ${winner === teamBId ? 'text-purple-200' : 'text-gray-500'}`}>{label}</span><div className="text-2xl font-bold mt-1">{pB.name}</div></div>{winner === teamBId && <Trophy className="text-white w-8 h-8 drop-shadow-md animate-bounce" />}</div>
      </button>
    </div>
  );
}