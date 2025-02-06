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
  const saveRosterButton = document.getElementById("saveRoster");
  const loadRosterButton = document.getElementById("loadRoster"); // New button
  const loadRosterInput = document.getElementById("loadRosterInput"); // Hidden file input
  const beginCompetitionButton = document.getElementById("beginCompetition");
  const finalizeRoundButton = document.getElementById("finalizeRound");
  const competitorsTableBody = document.querySelector("#competitorsTable tbody");
  const resultsDiv = document.getElementById("results");

  // In-memory competitor data.
  // Load from localStorage if available.
  let competitors = [];
  if (localStorage.getItem("competitors")) {
    competitors = JSON.parse(localStorage.getItem("competitors"));
  }
  
  let currentPairings = [];
  // Flag to indicate if a competition round has started.
  let competitionStarted = false;

  // Save the competitors array to localStorage.
  function saveCompetitors() {
    localStorage.setItem("competitors", JSON.stringify(competitors));
  }

  // Update the competitors table and manage button states.
  function updateCompetitorsTable() {
    // Sort competitors: fewer losses come first; if equal, more wins appear higher.
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
    // Disable "Sample Teams" if there is already at least one competitor.
    sampleButton.disabled = competitors.length > 0;
    // Disable "Erase All Competitors" if the roster is empty.
    eraseButton.disabled = competitors.length === 0;
    
    // If the roster is empty, disable "Begin Competition" and mark competition as not started.
    if (competitors.length === 0) {
      beginCompetitionButton.disabled = true;
      competitionStarted = false;
    } else {
      // If a competition hasn't been started, enable the Begin Competition button.
      // (If a round is in progress, it remains disabled.)
      beginCompetitionButton.disabled = competitionStarted;
    }
    
    // The Finalize Round button should be active only when a competition round has started.
    finalizeRoundButton.disabled = !competitionStarted;

    // Save updated data.
    saveCompetitors();
  }

  // Add a competitor to the list.
  function addCompetitor(name, team) {
    if (!name) return alert("Name is required");
    if (competitors.some(c => c.name === name)) return alert("Competitor already exists");
    competitors.push({ name, team, wins: 0, losses: 0 });
    updateCompetitorsTable();
  }

  // Remove a competitor by name.
  function removeCompetitor(name) {
    if (!name) return alert("Enter a name to remove");
    const index = competitors.findIndex(c => c.name === name);
    if (index === -1) return alert("Competitor not found");
    competitors.splice(index, 1);
    updateCompetitorsTable();
  }

  // Add sample teams.
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

  // Erase all competitors, clear pairing list, and re-enable the "Begin Competition" button.
  function eraseAllCompetitors() {
    if (confirm("Are you sure you want to erase all competitors?")) {
      competitors = [];
      updateCompetitorsTable();
      resultsDiv.innerHTML = "";                   // Clear the pairing list.
      competitionStarted = false;                  // Reset competition flag.
      beginCompetitionButton.disabled = true;      // Disable Begin Competition (roster is empty).
      finalizeRoundButton.disabled = true;         // Disable Finalize Round.
    }
  }

  // Reset scores for all competitors.
  function resetScores() {
    competitors.forEach(c => {
      c.wins = 0;
      c.losses = 0;
    });
    updateCompetitorsTable();
    // Reset competition state.
    competitionStarted = false;
    beginCompetitionButton.disabled = competitors.length === 0;
    finalizeRoundButton.disabled = true;
  }

  // Save the roster to a CSV file.
  function saveRoster() {
    if (competitors.length === 0) {
      alert("No competitors to save.");
      return;
    }
    let csvContent = "Name,Team,Wins,Losses\n";
    competitors.forEach(comp => {
      csvContent += `"${comp.name}","${comp.team}",${comp.wins},${comp.losses}\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const fileName = `roster_${new Date().toISOString().split("T")[0]}.csv`;
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Download not supported in this browser.");
    }
  }

			// NEW: Load the roster from a CSV file.
			function loadRoster(event) {
				const file = event.target.files[0];
				if (!file) return;
				const reader = new FileReader();
				reader.onload = function(e) {
					const contents = e.target.result;
					const lines = contents.split(/\r?\n/).filter(line => line.trim() !== "");
					if (lines.length < 2) {
						alert("Invalid CSV file.");
						return;
					}
					// Assume the first line is the header and skip it.
					const newCompetitors = [];
					for (let i = 1; i < lines.length; i++) {
						const line = lines[i];
						// Naively split by commas and remove wrapping quotes.
						const fields = line.split(",").map(s => s.replace(/^"|"$/g, '').trim());
						if (fields.length < 4) continue;
						const [name, team, wins, losses] = fields;
						newCompetitors.push({
							name: name,
							team: team,
							wins: parseInt(wins, 10) || 0,
							losses: parseInt(losses, 10) || 0
						});
					}
					competitors = newCompetitors;
					updateCompetitorsTable();
				};
				reader.onerror = function() {
					alert("Error reading file.");
				};
				reader.readAsText(file);
			}

		// New optimized pairing functions

		// getOptimizedPairs: recursively finds the best pairing for a given group
		function getOptimizedPairs(group) {
			let bestPairing = null;
			let bestPenalty = Infinity;

			function search(remaining, currentPairs, currentPenalty) {
				if (remaining.length === 0) {
					if (currentPenalty < bestPenalty) {
						bestPairing = currentPairs.slice();
						bestPenalty = currentPenalty;
					}
					return;
				}
				// Take the first competitor from the remaining list.
				let first = remaining[0];
				for (let i = 1; i < remaining.length; i++) {
					let second = remaining[i];
					// Penalty: 1 if they are on the same team, 0 otherwise.
					let penaltyIncrement = (first.team === second.team) ? 1 : 0;
					// Prune if the current penalty plus this increment is already worse.
					if (currentPenalty + penaltyIncrement >= bestPenalty) continue;
					let newPairs = currentPairs.slice();
					newPairs.push({ comp1: first.name, comp2: second.name });
					// Create a new remaining list without first and second.
					let newRemaining = remaining.slice(1);
					newRemaining.splice(i - 1, 1); // remove second (adjusted index)
					search(newRemaining, newPairs, currentPenalty + penaltyIncrement);
				}
			}
			search(group, [], 0);
			return { pairs: bestPairing, penalty: bestPenalty };
		}

		// pairGroup: if the group has an even number of competitors, returns the best pairing;
		// if odd, it tries every competitor as a potential bye candidate.
		function pairGroup(group) {
			if (group.length === 0) return [];
			if (group.length % 2 === 0) {
				let result = getOptimizedPairs(group);
				return result.pairs || [];
			} else {
				let bestPairs = null;
				let bestPenalty = Infinity;
				let bestByeIndex = -1;
				// Try each competitor as the one who gets the bye.
				for (let i = 0; i < group.length; i++) {
					let subGroup = group.slice(0, i).concat(group.slice(i + 1));
					let result = getOptimizedPairs(subGroup);
					if (result.penalty < bestPenalty) {
						bestPenalty = result.penalty;
						bestPairs = result.pairs;
						bestByeIndex = i;
					}
				}
				if (!bestPairs) bestPairs = [];
				// Append the bye pairing for the candidate left out.
				bestPairs.push({ comp1: group[bestByeIndex].name, comp2: "BYE" });
				return bestPairs;
			}
		}

		// pairCompetitors: splits eligible competitors into groups by losses,
		// then uses the optimized pairing functions for each group.
		function pairCompetitors() {
			// Filter competitors with fewer than 2 losses.
			let validCompetitors = competitors.filter(c => c.losses < 2);
			// Sort by wins (descending) then losses (ascending).
			validCompetitors.sort((a, b) => {
				if (b.wins !== a.wins) return b.wins - a.wins;
				return a.losses - b.losses;
			});
			// Split into groups: zero-loss and one-loss.
			let zeroLoss = validCompetitors.filter(c => c.losses === 0);
			let oneLoss = validCompetitors.filter(c => c.losses === 1);

			let pairs = [];
			let zeroPairs = pairGroup(zeroLoss);
			let onePairs = pairGroup(oneLoss);
			if (zeroPairs) pairs = pairs.concat(zeroPairs);
			if (onePairs) pairs = pairs.concat(onePairs);
			return pairs;
		}




  // Display the pairings and winner selection dropdowns.
  function displayPairings() {
    resultsDiv.innerHTML = "";
    currentPairings = pairCompetitors();
    currentPairings.forEach((pair, index) => {
      const pairingDiv = document.createElement("div");
      pairingDiv.className = "pairing";

      const pairingText = document.createElement("div");
      pairingText.className = "pairing-text";
      pairingText.innerText = `${pair.comp1} vs ${pair.comp2}`;
      pairingDiv.appendChild(pairingText);

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

  // Finalize the round by updating wins and losses based on the selected winners.
  function finalizeRound() {
    const selects = resultsDiv.querySelectorAll("select");
    selects.forEach((select, index) => {
      const pair = currentPairings[index];
      const winner = select.value;
      if (!winner) return;
      const loser = winner === pair.comp1 ? pair.comp2 : pair.comp1;
      if (loser === "BYE") return;
      competitors.forEach(comp => {
        if (comp.name === winner) comp.wins += 1;
        if (comp.name === loser) comp.losses += 1;
      });
    });
    updateCompetitorsTable();
    if (competitors.filter(c => c.losses < 2).length > 1) {
      displayPairings();
    } else {
      alert("Competition finished!");
      competitionStarted = false;
      finalizeRoundButton.disabled = true;
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
    competitionStarted = false;
    beginCompetitionButton.disabled = competitors.length === 0;
    finalizeRoundButton.disabled = true;
  });
  
  saveRosterButton.addEventListener("click", saveRoster);
  
  // When the "Load Roster" button is clicked, trigger the hidden file input.
  loadRosterButton.addEventListener("click", () => {
    loadRosterInput.click();
  });
  
  // When a file is selected, load the roster.
  loadRosterInput.addEventListener("change", loadRoster);
  
  beginCompetitionButton.addEventListener("click", () => {
    if (competitors.length === 0) return;
    competitionStarted = true;
    beginCompetitionButton.disabled = true;
    finalizeRoundButton.disabled = false;
    displayPairings();
  });
  
  finalizeRoundButton.addEventListener("click", finalizeRound);
  
  // Initial table update.
  updateCompetitorsTable();
});

