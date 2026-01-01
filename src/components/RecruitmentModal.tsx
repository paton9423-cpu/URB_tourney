import { useState } from 'react';
import { Trophy, UserPlus, Skull, CheckCircle, ArrowRight } from 'lucide-react';
import type { Team, Match } from '../App';

interface RecruitmentModalProps {
  winningTeam: Team;
  losingTeam: Team;
  match: Match;
  onConfirm: (selectedPlayerIds: string[]) => void;
  recruitCount: number;
}

export function RecruitmentModal({ winningTeam, losingTeam, match, onConfirm, recruitCount }: RecruitmentModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const availablePlayers = losingTeam.players.filter(p => !p.eliminated);

  const togglePlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      if (selectedPlayers.length < recruitCount) {
        setSelectedPlayers([...selectedPlayers, playerId]);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedPlayers.length === recruitCount) {
      onConfirm(selectedPlayers);
    }
  };

  const canConfirm = selectedPlayers.length === recruitCount;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-8">
      <div className="bg-gray-900 border-2 border-green-500 rounded-xl max-w-5xl w-full shadow-2xl shadow-green-500/20 animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-green-900/80 to-green-600/20 p-8 rounded-t-xl border-b border-green-500/30">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-green-500/20 rounded-full border border-green-500/50">
               <Trophy className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight">VICTORY!</h2>
              <p className="text-green-200 text-lg mt-1"><span className="font-bold text-white">{winningTeam.name}</span> wins the round</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              Recruitment Phase
            </h3>
            <p className="text-gray-400 text-lg">
              You must draft <span className="text-white font-bold text-xl px-2 py-0.5 bg-cyan-900/50 rounded border border-cyan-500/50">{recruitCount}</span> player{recruitCount > 1 ? 's' : ''} from {losingTeam.name}. 
              The rest will be eliminated.
            </p>
          </div>

          <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
            <div className="flex justify-between items-end mb-4">
               <span className="text-sm uppercase tracking-wider text-gray-500 font-semibold">Available Candidates</span>
               <span className={`text-sm font-mono font-bold ${canConfirm ? 'text-green-400' : 'text-orange-400'}`}>
                 Selected: {selectedPlayers.length} / {recruitCount}
               </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availablePlayers.map(player => {
                const isSelected = selectedPlayers.includes(player.id);
                const isDisabled = !isSelected && selectedPlayers.length >= recruitCount;
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    disabled={isDisabled}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all duration-200 group ${isSelected ? 'border-cyan-500 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-gray-700 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800'} ${isDisabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-gray-600 bg-transparent text-transparent'}`}><CheckCircle size={16} /></div>
                      <div className={`font-bold truncate ${isSelected ? 'text-cyan-300' : 'text-gray-300'}`}>{player.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 items-center pt-4 border-t border-gray-800">
             <div className="flex-1">
                {selectedPlayers.length > 0 && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <Skull size={16} />
                    <span>Eliminating: {availablePlayers.filter(p => !selectedPlayers.includes(p.id)).length} players</span>
                  </div>
                )}
             </div>
             <button onClick={handleConfirm} disabled={!canConfirm} className={`px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-3 transition-all ${canConfirm ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/50 scale-100' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>Confirm Recruitment <ArrowRight size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}