// main.js
document.addEventListener("DOMContentLoaded", () => {
  // UI element references
  const nameInput = document.getElementById("name");
  const teamInput = document.getElementById("team");
  const addButton = document.getElementById("addCompetitor");
  const removeButton = document.getElementById("removeCompetitor");
  const sampleButton = document.getElementById("sampleTeams");
  const eraseButton = document.getElementById("eraseCompetitors");
  const resetButton = document.getElementById("resetScores");
  const beginCompetitionButton = document.getElementById("beginCompetition");
  const finalizeRoundButton = document.getElementById("finalizeRound");
  const competitorsTableBody = document.querySelector("#competitorsTable tbody");
  const resultsDiv = document.getElementById("results");

  // In-memory competitor data
  let competitors = []; // Each competitor is { name, team, wins, losses }
  let currentPairings = [];

  // --- Helper Functions ---

  function updateCompetitorsTable() {
    // Sort competitors:
    // Fewer losses come first; if losses are equal, more wins come first.
    competitors.sort((a, b) => {
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.wins - a.wins;
    });

    competitorsTableBody.innerHTML = "";
    competitors.forEach(comp => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${comp.name}</td>
                       <td>${comp.team}</td>
                       <td>${comp.wins}</td>
                       <td>${comp.losses}</td>`;
      competitorsTableBody.appendChild(row);
    });

    // Disable Sample Teams if there is already at least one competitor.
    sampleButton.disabled = competitors.length > 0;
    // Disable Erase All Competitors if the roster is empty.
    eraseButton.disabled = competitors.length === 0;
  }

  function addCompetitor(name, team) {
    if (!name) return alert("Name is required");
    if (competitors.some(c => c.name === name)) return alert("Competitor already exists");
    competitors.push({ name, team, wins: 0, losses: 0 });
    updateCompetitorsTable();
  }

  function removeCompetitor(name) {
    if (!name) return alert("Enter a name to remove");
    const index = competitors.findIndex(c => c.name === name);
    if (index === -1) return alert("Competitor not found");
    competitors.splice(index, 1);
    updateCompetitorsTable();
  }

  function addSampleTeams() {
    const sampleCompetitors = [
      { name: "Alex (1)", team: "Team 1", wins: 0, losses: 0 },
      { name: "Jordan (1)", team: "Team 1", wins: 0, losses: 0 },
      { name: "Taylor (1)", team: "Team 1", wins: 0, losses: 0 },
      { name: "Morgan (1)", team: "Team 1", wins: 0, losses: 0 },
      { name: "Sam (2)", team: "Team 2", wins: 0, losses: 0 },
      { name: "Jamie (2)", team: "Team 2", wins: 0, losses: 0 },
      { name: "Riley (2)", team: "Team 2", wins: 0, losses: 0 },
      { name: "Reese (2)", team: "Team 2", wins: 0, losses: 0 }
    ];
    competitors = competitors.concat(sampleCompetitors);
    updateCompetitorsTable();
  }

  function eraseAllCompetitors() {
    if (confirm("Are you sure you want to erase all competitors?")) {
      competitors = [];
      updateCompetitorsTable();
    }
  }

  function resetScores() {
    competitors.forEach(c => {
      c.wins = 0;
      c.losses = 0;
    });
    updateCompetitorsTable();
    // Re-enable the Begin Competition button when resetting scores.
    beginCompetitionButton.disabled = false;
  }

  // Pairing logic (similar to your original approach)
  function pairCompetitors() {
    // Filter competitors with fewer than 2 losses
    let validCompetitors = competitors.filter(c => c.losses < 2);
    // Sort by wins (descending) and losses (ascending)
    validCompetitors.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });

    // Separate into zero-loss and one-loss groups
    let zeroLoss = validCompetitors.filter(c => c.losses === 0);
    let oneLoss = validCompetitors.filter(c => c.losses === 1);
    let pairs = [];
    let usedNames = new Set();

    function pairWithinGroup(group) {
      let localPairs = [];
      let localUsed = new Set();
      for (let i = 0; i < group.length; i++) {
        const comp = group[i];
        if (localUsed.has(comp.name)) continue;
        let bestMatch = null;
        for (let j = 0; j < group.length; j++) {
          if (i === j) continue;
          const potential = group[j];
          if (localUsed.has(potential.name)) continue;
          if (comp.team !== potential.team) {
            bestMatch = potential;
            break;
          }
          if (!bestMatch) bestMatch = potential;
        }
        if (bestMatch) {
          localPairs.push({ comp1: comp.name, comp2: bestMatch.name });
          localUsed.add(comp.name);
          localUsed.add(bestMatch.name);
        }
      }
      return { pairs: localPairs, used: localUsed };
    }

    const zeroResult = pairWithinGroup(zeroLoss);
    const oneResult = pairWithinGroup(oneLoss);
    pairs = pairs.concat(zeroResult.pairs, oneResult.pairs);
    usedNames = new Set([...zeroResult.used, ...oneResult.used]);

    let zeroUnmatched = zeroLoss.filter(c => !usedNames.has(c.name)).map(c => c.name);
    let oneUnmatched = oneLoss.filter(c => !usedNames.has(c.name)).map(c => c.name);

    if (zeroUnmatched.length === 1 && oneUnmatched.length === 1 && usedNames.size === 0) {
      pairs.push({ comp1: zeroUnmatched[0], comp2: oneUnmatched[0] });
      usedNames.add(zeroUnmatched[0]);
      usedNames.add(oneUnmatched[0]);
    } else {
      // Give unmatched zero-loss competitors a BYE
      zeroUnmatched.forEach(name => {
        pairs.push({ comp1: name, comp2: "BYE" });
        usedNames.add(name);
      });
      // Also, if any competitor remains unmatched, assign a BYE
      let unmatched = validCompetitors.filter(c => !usedNames.has(c.name)).map(c => c.name);
      unmatched.forEach(name => {
        pairs.push({ comp1: name, comp2: "BYE" });
      });
    }
    return pairs;
  }

  function displayPairings() {
    resultsDiv.innerHTML = "";
    currentPairings = pairCompetitors();
    currentPairings.forEach((pair, index) => {
      const pairingDiv = document.createElement("div");
      pairingDiv.className = "pairing";
      // Left: pairing text
      const pairingText = document.createElement("div");
      pairingText.className = "pairing-text";
      pairingText.innerText = `${pair.comp1} vs ${pair.comp2}`;
      pairingDiv.appendChild(pairingText);

      // Right: dropdown for winner or BYE label
      const pairingControl = document.createElement("div");
      if (pair.comp2 !== "BYE") {
        const select = document.createElement("select");
        select.dataset.index = index;
        const defaultOption = document.createElement("option");
        defaultOption.text = "Select Winner";
        defaultOption.value = "";
        select.appendChild(defaultOption);
        [pair.comp1, pair.comp2].forEach(name => {
          const option = document.createElement("option");
          option.text = name;
          option.value = name;
          select.appendChild(option);
        });
        pairingControl.appendChild(select);
      } else {
        pairingControl.innerText = "(BYE)";
      }
      pairingDiv.appendChild(pairingControl);
      resultsDiv.appendChild(pairingDiv);
    });
  }

  function finalizeRound() {
    // Process each pairing's winner
    const selects = resultsDiv.querySelectorAll("select");
    selects.forEach((select, index) => {
      const pair = currentPairings[index];
      const winner = select.value;
      if (!winner) return;
      const loser = winner === pair.comp1 ? pair.comp2 : pair.comp1;
      // If there's a BYE, skip updating scores.
      if (loser === "BYE") return;
      // Update scores for winner and loser.
      competitors.forEach(comp => {
        if (comp.name === winner) comp.wins += 1;
        if (comp.name === loser) comp.losses += 1;
      });
    });
    updateCompetitorsTable();
    // If more than one competitor remains (losses < 2), generate new pairings.
    if (competitors.filter(c => c.losses < 2).length > 1) {
      displayPairings();
    } else {
      alert("Competition finished!");
    }
  }

  // --- Event Listeners ---

  addButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const team = teamInput.value.trim();
    addCompetitor(name, team);
    nameInput.value = "";
    teamInput.value = "";
  });

  removeButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    removeCompetitor(name);
    nameInput.value = "";
  });

  sampleButton.addEventListener("click", addSampleTeams);

  eraseButton.addEventListener("click", eraseAllCompetitors);

  resetButton.addEventListener("click", () => {
    resetScores();
    beginCompetitionButton.disabled = false;
  });

  beginCompetitionButton.addEventListener("click", () => {
    beginCompetitionButton.disabled = true;
    displayPairings();
  });

  finalizeRoundButton.addEventListener("click", finalizeRound);

  // Initial table update
  updateCompetitorsTable();
});

