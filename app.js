const matches = [
  {
    league: "Premier League",
    teams: "Arsenal vs Chelsea",
    watch: "https://1xbet.com/live",
    bet: "YOUR_1XBET_LINK"
  },
  {
    league: "La Liga",
    teams: "Real Madrid vs Barcelona",
    watch: "https://1xbet.com/live",
    bet: "YOUR_1XBET_LINK"
  }
];

const container = document.getElementById("matches");

matches.forEach(m => {
  container.innerHTML += `
    <div class="match">
      <div class="league">${m.league}</div>
      <div class="teams">${m.teams}</div>
      <div class="buttons">
        <a class="watch" href="${m.watch}" target="_blank">Watch Live</a>
        <a class="bet" href="${m.bet}" target="_blank">Bet Now</a>
      </div>
    </div>
  `;
});
