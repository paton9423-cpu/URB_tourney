import { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { BracketView } from './components/BracketView';
import { MatchManager } from './components/MatchManager';
import { RecruitmentModal } from './components/RecruitmentModal';
import './styles/globals.css';

export interface Player { id: string; name: string; eliminated: boolean; }
export interface Team { id: string; name: string; players: Player[]; eliminated: boolean; }
export interface Match { 
  id: string; 
  round: number; 
  roundName: string; 
  teamAId: string; 
  teamBId: string; 
  teamAScore: number; 
  teamBScore: number; 
  winnerId: string | null; 
  status: 'upcoming' | 'in-progress' | 'completed'; 
  coinFlipWinner?: string; 
  scoutDuelWinner?: string; 
  playerMatchups?: Array<{ teamAPlayerId: string; teamBPlayerId: string; winner?: string }>;
  recruitedPlayerIds?: string[];
  eliminatedPlayerIds?: string[];
}

export interface TournamentData { bracketSize: 8 | 16; teams: Team[]; matches: Match[]; currentRound: number; eliminatedPlayers: Player[]; }

export default function App() {
  const [screen, setScreen] = useState<'setup' | 'bracket' | 'match'>('setup');
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [recruitmentData, setRecruitmentData] = useState<{
    winningTeam: Team;
    losingTeam: Team;
    match: Match;
  } | null>(null);

  const handleStartTournament = (data: TournamentData) => {
    setTournamentData(data);
    setScreen('bracket');
  };

  const handleSelectMatch = (match: Match) => {
    setCurrentMatch(match);
    setScreen('match');
  };

  const handleMatchComplete = (match: Match, winningTeamId: string) => {
    if (!tournamentData) return;

    const winningTeam = tournamentData.teams.find(t => t.id === winningTeamId);
    const losingTeamId = match.teamAId === winningTeamId ? match.teamBId : match.teamAId;
    const losingTeam = tournamentData.teams.find(t => t.id === losingTeamId);

    const isFinal = match.round === (tournamentData.bracketSize === 8 ? 3 : 4);

    if (isFinal && winningTeam) {
      const updatedMatches = tournamentData.matches.map(m => 
        m.id === match.id ? { 
            ...m, 
            status: 'completed' as const, 
            winnerId: winningTeam.id,
            teamAScore: match.teamAScore,
            teamBScore: match.teamBScore
        } : m
      );
      setTournamentData({ ...tournamentData, matches: updatedMatches });
      setScreen('bracket');
    } else if (winningTeam && losingTeam) {
      setRecruitmentData({ winningTeam, losingTeam, match });
    }
  };

  const handleRecruitmentComplete = (selectedPlayerIds: string[]) => {
    if (!tournamentData || !recruitmentData) return;

    const { winningTeam, losingTeam, match } = recruitmentData;

    const eliminatedFromThisTeam = losingTeam.players.filter(p => !selectedPlayerIds.includes(p.id));
    const eliminatedIds = eliminatedFromThisTeam.map(p => p.id);

    const updatedEliminatedPlayers = [
      ...tournamentData.eliminatedPlayers,
      ...eliminatedFromThisTeam.map(p => ({ ...p, eliminated: true }))
    ];

    const updatedTeams = tournamentData.teams.map(team => {
      if (team.id === winningTeam.id) {
        const newPlayers = losingTeam.players.filter(p => selectedPlayerIds.includes(p.id));
        return { ...team, players: [...team.players, ...newPlayers] };
      }
      if (team.id === losingTeam.id) {
        return { ...team, eliminated: true };
      }
      return team;
    });

    const updatedMatches = tournamentData.matches.map(m => 
      m.id === match.id ? { 
        ...m, 
        status: 'completed' as const, 
        winnerId: winningTeam.id,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        recruitedPlayerIds: selectedPlayerIds,
        eliminatedPlayerIds: eliminatedIds
      } : m
    );

    const currentRoundMatches = updatedMatches.filter(m => m.round === match.round);
    const allCurrentRoundComplete = currentRoundMatches.every(m => m.status === 'completed');

    let finalMatches = updatedMatches;
    let newRound = tournamentData.currentRound;

    if (allCurrentRoundComplete) {
      const winners = currentRoundMatches
        .map(m => updatedTeams.find(t => t.id === m.winnerId))
        .filter(Boolean) as Team[];

      const nextRound = match.round + 1;
      const maxRounds = tournamentData.bracketSize === 8 ? 3 : 4;

      if (nextRound <= maxRounds && winners.length > 1) {
        const nextRoundName = 
          nextRound === 2 ? '3v3 Expansion' :
          nextRound === 3 ? (tournamentData.bracketSize === 8 ? '5v5 Grand Finale' : '4v4 Semi-Finals') :
          '5v5 Grand Finale';

        const newMatches: Match[] = [];
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            newMatches.push({
              id: `match-round${nextRound}-${i / 2}`,
              round: nextRound,
              roundName: nextRoundName,
              teamAId: winners[i].id,
              teamBId: winners[i + 1].id,
              teamAScore: 0,
              teamBScore: 0,
              winnerId: null,
              status: 'upcoming'
            });
          }
        }
        
        const cleanMatches = updatedMatches.filter(m => m.round < nextRound);
        finalMatches = [...cleanMatches, ...newMatches];
        
        newRound = nextRound;
      }
    }

    setTournamentData({
      ...tournamentData,
      teams: updatedTeams,
      matches: finalMatches,
      currentRound: newRound,
      eliminatedPlayers: updatedEliminatedPlayers
    });

    setRecruitmentData(null);
    setScreen('bracket');
  };

  const handleResetMatch = (matchId: string) => {
    if (!tournamentData) return;
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (!match || match.status !== 'completed' || !match.winnerId) return;

    const winnerId = match.winnerId;
    const loserId = match.teamAId === winnerId ? match.teamBId : match.teamAId;

    const updatedTeams = tournamentData.teams.map(team => {
      if (team.id === winnerId && match.recruitedPlayerIds) {
        return {
          ...team,
          players: team.players.filter(p => !match.recruitedPlayerIds?.includes(p.id))
        };
      }
      if (team.id === loserId) {
        return {
          ...team,
          eliminated: false
        };
      }
      return team;
    });

    const updatedEliminatedPlayers = tournamentData.eliminatedPlayers.filter(
      p => !match.eliminatedPlayerIds?.includes(p.id)
    );

    const updatedMatches = tournamentData.matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'upcoming' as const,
          winnerId: null,
          teamAScore: 0,
          teamBScore: 0,
          recruitedPlayerIds: undefined,
          eliminatedPlayerIds: undefined,
          coinFlipWinner: undefined,
          scoutDuelWinner: undefined,
          playerMatchups: undefined
        };
      }
      return m;
    });

    setTournamentData({
      ...tournamentData,
      teams: updatedTeams,
      matches: updatedMatches,
      eliminatedPlayers: updatedEliminatedPlayers
    });
  };

  const getRecruitmentCount = () => {
    if (!recruitmentData || !tournamentData) return 1;
    if (tournamentData.bracketSize === 8 && recruitmentData.match.round === 2) {
      return 2;
    }
    return 1;
  };

  // --- LOGIQUE DE ZOOM DYNAMIQUE ---
  // Si on a 8 équipes : Zoom 95% (presque normal, bien grand)
  // Si on a 16 équipes : Zoom 60% (dézoomé pour tout voir)
  const bracketZoomLevel = tournamentData?.bracketSize === 8 ? '95%' : '60%';

  return (
    <div className="min-h-screen w-full bg-slate-900 text-gray-100 font-sans selection:bg-cyan-500/30 flex flex-col items-center py-6 px-4">
      
      {/* BOÎTE PRINCIPALE */}
      <div className="w-full max-w-[1600px] space-y-6">
        
        {/* TITRE DU SITE */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 mb-1">
            THE CONQUEST DRAFT
          </h1>
          <p className="text-slate-400 text-sm">Setup Your Tournament • Progressive Team Building</p>
        </div>

        {/* --- ÉCRAN 1 : SETUP --- */}
        {screen === 'setup' && (
          <div className="w-full max-w-4xl mx-auto">
            <SetupScreen onStartTournament={handleStartTournament} />
          </div>
        )}

        {/* --- ÉCRAN 2 : ARBRE DU TOURNOI --- */}
        {screen === 'bracket' && tournamentData && (
           <div className="flex flex-col w-full gap-6">
             
             {/* ZONE DE L'ARBRE AVEC ZOOM INTELLIGENT */}
             <div className="w-full flex justify-center" style={{ zoom: bracketZoomLevel }}>
                <BracketView 
                  tournamentData={tournamentData}
                  onSelectMatch={handleSelectMatch}
                  onBackToSetup={() => setScreen('setup')}
                  onResetMatch={handleResetMatch}
                />
             </div>

             {/* Les deux panneaux en bas */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 lg:px-20 max-w-7xl mx-auto w-full">
                {/* Active Teams */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Active Teams
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {tournamentData.teams.filter(t => !t.eliminated).map(team => (
                      <div key={team.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 flex flex-col gap-1">
                        <div className="font-bold text-base text-white">{team.name}</div>
                        <div className="flex flex-wrap gap-1">
                          {team.players.map(player => (
                            <span key={player.id} className="text-[10px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20">
                              {player.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Graveyard */}
                <div className="bg-slate-800/50 border border-red-900/30 rounded-xl p-6 shadow-lg backdrop-blur-sm h-full">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
                    <span>💀</span> Graveyard
                  </h3>
                  {tournamentData.eliminatedPlayers.length === 0 ? (
                    <div className="text-gray-500 italic text-center py-8">The graveyard is empty...</div>
                  ) : (
                    <div className="flex flex-wrap gap-2 content-start">
                      {tournamentData.eliminatedPlayers.map(player => (
                        <span key={player.id} className="px-3 py-1 bg-red-950/30 text-red-500/50 line-through rounded text-sm border border-red-900/10">
                          {player.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}

        {/* --- ÉCRAN 3 : MATCH EN COURS (MODIFICATION 1) --- */}
        {screen === 'match' && currentMatch && tournamentData && (
          // MODIFICATION : Ajout de style transform pour réduire le zoom à 85%
          <div 
            className="max-w-lg mx-auto w-full"
            style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}
          >
            <MatchManager 
              match={currentMatch} 
              tournamentData={tournamentData}
              onMatchComplete={handleMatchComplete}
              onBackToBracket={() => setScreen('bracket')}
              allowRandomize={currentMatch.round === 1}
              allPlayers={tournamentData.teams.flatMap(t => t.players)}
            />
          </div>
        )}

      </div>
      
      {/* MODAL DE RECRUTEMENT (MODIFICATION 2) */}
      {recruitmentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           {/* MODIFICATION : max-w-lg passé à max-w-2xl pour élargir la zone et éviter que les noms soient coupés */}
           <div className="w-full max-w-2xl transform scale-95">
            <RecruitmentModal
              winningTeam={recruitmentData.winningTeam}
              losingTeam={recruitmentData.losingTeam}
              match={recruitmentData.match}
              onConfirm={handleRecruitmentComplete}
              recruitCount={getRecruitmentCount()}
            />
           </div>
        </div>
      )}
    </div>
  );
}