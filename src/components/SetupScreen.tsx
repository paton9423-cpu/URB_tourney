import { useState } from 'react';
import { Play, Users } from 'lucide-react'; // J'ai nettoyé les imports inutilisés aussi
import type { TournamentData, Team, Match } from '../App';

interface SetupScreenProps {
  onStartTournament: (data: TournamentData) => void;
}

export function SetupScreen({ onStartTournament }: SetupScreenProps) {
  const [bracketSize, setBracketSize] = useState<8 | 16>(8);
  const [teams, setTeams] = useState<Array<{ teamName: string; player1: string; player2: string }>>([
    ...Array(8).fill(null).map((_, i) => ({ teamName: `Team ${i + 1}`, player1: '', player2: '' }))
  ]);

  const handleBracketSizeChange = (size: 8 | 16) => {
    setBracketSize(size);
    if (size === 16) {
      setTeams([
        ...teams,
        ...Array(8).fill(null).map((_, i) => ({ teamName: `Team ${i + 9}`, player1: '', player2: '' }))
      ]);
    } else {
      setTeams(teams.slice(0, 8));
    }
  };

  const updateTeam = (index: number, field: 'teamName' | 'player1' | 'player2', value: string) => {
    const newTeams = [...teams];
    newTeams[index][field] = value;
    setTeams(newTeams);
  };

  const handleStartTournament = () => {
    // Create teams
    const tournamentTeams: Team[] = teams.map((team, index) => ({
      id: `team-${index}`,
      name: team.teamName || `Team ${index + 1}`,
      players: [
        { id: `player-${index}-1`, name: team.player1 || `Player ${index * 2 + 1}`, eliminated: false },
        { id: `player-${index}-2`, name: team.player2 || `Player ${index * 2 + 2}`, eliminated: false }
      ],
      eliminated: false
    }));

    // Randomize matchmaking if selected
    for (let i = tournamentTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tournamentTeams[i], tournamentTeams[j]] = [tournamentTeams[j], tournamentTeams[i]];
    }

    // Create Round 1 matches (2v2)
    const matches: Match[] = [];
    for (let i = 0; i < tournamentTeams.length; i += 2) {
      matches.push({
        id: `match-round1-${i / 2}`,
        round: 1,
        roundName: '2v2 Duels',
        teamAId: tournamentTeams[i].id,
        teamBId: tournamentTeams[i + 1].id,
        teamAScore: 0,
        teamBScore: 0,
        winnerId: null,
        status: 'upcoming'
      });
    }

    onStartTournament({
      bracketSize,
      teams: tournamentTeams,
      matches,
      currentRound: 1,
      eliminatedPlayers: []
    });
  };
  
  // --- C'EST ICI QUE LA MAGIE OPÈRE (Code corrigé) ---
  return (
    <div className="w-full space-y-8">
       
       {/* Bracket Size Selection */}
       <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-purple-500/30 p-6">
         <h2 className="text-xl mb-4 text-cyan-400 font-bold flex items-center gap-2">
            <Users className="w-5 h-5" /> Bracket Size
         </h2>
         <div className="grid grid-cols-2 gap-4">
           <button
             onClick={() => handleBracketSizeChange(8)}
             className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center ${
               bracketSize === 8
                 ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/50'
                 : 'border-gray-700 bg-gray-800/50 hover:border-cyan-500/50 text-gray-400'
             }`}
           >
             <span className="text-2xl font-bold mb-1">8 Teams</span>
             <span className="text-sm opacity-70">16 Players Total</span>
           </button>
           <button
             onClick={() => handleBracketSizeChange(16)}
             className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center ${
               bracketSize === 16
                 ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/50'
                 : 'border-gray-700 bg-gray-800/50 hover:border-cyan-500/50 text-gray-400'
             }`}
           >
             <span className="text-2xl font-bold mb-1">16 Teams</span>
             <span className="text-sm opacity-70">32 Players Total</span>
           </button>
         </div>
       </div>

       {/* Team & Player Input */}
       <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-purple-500/30 p-6">
         <h2 className="text-xl mb-4 text-cyan-400 font-bold">
            Team Registration <span className="text-sm text-gray-500 font-normal">({teams.length} Teams • 2 Players Each)</span>
         </h2>
         <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
           {teams.map((team, index) => (
             <div 
               key={index} 
               className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 hover:border-pink-500/50 transition-all"
             >
               <div className="mb-3">
                 <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Team Name</label>
                 <input
                   type="text"
                   value={team.teamName}
                   onChange={(e) => updateTeam(index, 'teamName', e.target.value)}
                   placeholder={`Team ${index + 1}`}
                   className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                 />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Player 1</label>
                   <input
                     type="text"
                     value={team.player1}
                     onChange={(e) => updateTeam(index, 'player1', e.target.value)}
                     placeholder={`Player ${index * 2 + 1}`}
                     className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Player 2</label>
                   <input
                     type="text"
                     value={team.player2}
                     onChange={(e) => updateTeam(index, 'player2', e.target.value)}
                     placeholder={`Player ${index * 2 + 2}`}
                     className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                   />
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>   

       {/* Start Button */}
       <button
         onClick={handleStartTournament}
         className="w-full bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 text-white py-4 rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-3 font-bold text-lg transform hover:scale-[1.01] active:scale-[0.99]"
       >
         <Play className="w-6 h-6 fill-current" />
         START TOURNAMENT
       </button>
    </div>
  );
}