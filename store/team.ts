import { create } from 'zustand';
import { Team, TeamMember } from '../types';

interface TeamState {
  activeTeam: Team | null;
  teams: Team[];
  members: TeamMember[];
  setActiveTeam: (team: Team | null) => void;
  setTeams: (teams: Team[]) => void;
  setMembers: (members: TeamMember[]) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  activeTeam: null,
  teams: [],
  members: [],
  setActiveTeam: (team) => set({ activeTeam: team }),
  setTeams: (teams) => set({ teams }),
  setMembers: (members) => set({ members }),
}));
