import crestsData from '../../public/crests/crests.json';

export function getTeamCrest(teamName: string): string {
  const team = crestsData.find((c: any) => c.equipo === teamName);
  return team ? team.archivo : '';
}
