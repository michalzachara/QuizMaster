/** Share one database read per game during a refresh, never across refreshes. */
export async function refreshGames<Viewer extends { data: { gameId?: string } }, Game>(
  viewers: Iterable<Viewer>,
  load: (id: string) => Promise<Game>,
  send: (viewer: Viewer, game: Game) => void,
  onError: (viewer: Viewer) => void,
) {
  const groups = new Map<string, Viewer[]>();
  for (const viewer of viewers) {
    const id = viewer.data.gameId;
    if (!id) continue;
    const group = groups.get(id) ?? [];
    group.push(viewer);
    groups.set(id, group);
  }

  for (const [id, group] of groups) {
    try {
      const game = await load(id);
      for (const viewer of group) {
        // A player may have switched rooms while the query was running.
        if (viewer.data.gameId !== id) continue;
        try {
          send(viewer, game);
        } catch {
          onError(viewer);
        }
      }
    } catch {
      for (const viewer of group) onError(viewer);
    }
  }
}
