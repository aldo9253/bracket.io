// Alex Doner
// Feb 18 2025
// This now uses the 'greedySort' method. 
//   Works for many many competitors and does a good job preventing teammate matchups. 
// Currently, the logic pairs those with the same number of wins. 
//   I think it might be better to pair those with the lowest number of wins. 
//   This point is more subtle and can be debated. 


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
  // NEW: References for the Calculate Team Points feature.
  const calcTeamPointsButton = document.getElementById("calcTeamPoints");
  const teamPointsDisplay = document.getElementById("teamPointsDisplay");

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

/*  // Add sample teams.
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
  } */
  
function addSampleTeams() {
  let sampleCompetitors = [];
  
  let team_num = 2
  let comp_num = 10
  
  // Generate 8 competitors for each of three teams.
  for (let team = 1; team <= team_num; team++) {
    for (let i = 1; i <= comp_num; i++) {
      // Competitor number calculation: for team 1: 1-8, team 2: 9-16, team 3: 17-24.
      let competitorNumber = ((team - 1) * comp_num) + i;
      sampleCompetitors.push({
        name: `Competitor ${competitorNumber} (${team})`,
        team: `Team ${team}`,
        wins: 0,
        losses: 0
      });
    }
  }
  
  // Generate 8 competitors without a team.
  for (let i = 1; i <= comp_num; i++) {
    // Numbers 25 to 32.
    sampleCompetitors.push({
      name: `Competitor ${(team_num*comp_num) + i}`,
      team: "",  // No team
      wins: 0,
      losses: 0
    });
  }
  
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


// Helper function: Fisher–Yates shuffle.
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function greedyPairGroup(group) {
  let byeCandidate = null;
  
  // If the group has more than one competitor and an odd number, remove the competitor with the highest wins.
  if (group.length > 1 && group.length % 2 !== 0) {
    // Create a sorted copy (ascending by wins).
    let sortedGroup = group.slice().sort((a, b) => a.wins - b.wins);
    // The competitor with the highest wins is at the end.
    byeCandidate = sortedGroup[sortedGroup.length - 1];
    // Remove the bye candidate from the original group.
    group = group.filter(c => c.name !== byeCandidate.name);
  }
  
  let pairs = [];
  let remaining = group.slice(); // copy the (possibly modified) group

  // Greedy pairing: always remove the first competitor and pair with the first available non-teammate.
  while (remaining.length > 1) {
    let competitor = remaining.shift();
    let candidateIndex = remaining.findIndex(c => c.team !== competitor.team);
    if (candidateIndex === -1) {
      // If everyone remaining is on the same team, just take the first candidate.
      candidateIndex = 0;
    }
    let candidate = remaining.splice(candidateIndex, 1)[0];
    pairs.push({ comp1: competitor.name, comp2: candidate.name });
  }

  // If one competitor remains (and no bye candidate was chosen), assign a bye.
  if (remaining.length === 1) {
    pairs.push({ comp1: remaining[0].name, comp2: "BYE" });
  }
  
  // If we selected a bye candidate earlier, add their bye pairing.
  if (byeCandidate) {
    pairs.push({ comp1: byeCandidate.name, comp2: "BYE" });
  }
  
  return pairs;
}


// pairCompetitors: filters eligible competitors, shuffles if it's the first round,
// groups them by loss count, and pairs within each group using a greedy algorithm.
function pairCompetitors() {
  // Filter competitors with fewer than 2 losses.
  let validCompetitors = competitors.filter(c => c.losses < 2);

  // If it's the first round (all scores 0), shuffle to reduce repetition.
  if (validCompetitors.every(c => c.wins === 0 && c.losses === 0)) {
    shuffleArray(validCompetitors);
  }

  // Sort by wins (descending) then losses (ascending).
  validCompetitors.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  // Group competitors by loss count.
  let groups = {};
  validCompetitors.forEach(comp => {
    if (!groups[comp.losses]) groups[comp.losses] = [];
    groups[comp.losses].push(comp);
  });

  // Special Case: If there is exactly one competitor with 0 losses and one with 1 loss, pair them.
  let zeroLoss = groups[0] || [];
  let oneLoss = groups[1] || [];
  if (zeroLoss.length === 1 && oneLoss.length === 1) {
    return [{ comp1: zeroLoss[0].name, comp2: oneLoss[0].name }];
  }

  let pairs = [];
  // Process each loss group in increasing order.
  Object.keys(groups).sort((a, b) => a - b).forEach(loss => {
    let group = groups[loss];
    let groupPairs = greedyPairGroup(group);
    pairs = pairs.concat(groupPairs);
  });
  return pairs;
}


// Display
function displayPairings() {
  resultsDiv.innerHTML = "";
  currentPairings = pairCompetitors();
  
  // shuffler here
  shuffleArray(currentPairings);
  
  currentPairings.forEach((pair, index) => {
    const pairingDiv = document.createElement("div");
    pairingDiv.className = "pairing";
    // Assign a data-index so we can later retrieve the select for this pairing.
    pairingDiv.dataset.index = index;

    const pairingText = document.createElement("div");
    pairingText.className = "pairing-text";
    pairingText.innerText = `${pair.comp1} vs ${pair.comp2}`;
    pairingDiv.appendChild(pairingText);

    const pairingControl = document.createElement("div");
    if (pair.comp2 !== "BYE") {
      const select = document.createElement("select");
      // (Optionally, you can also set data-index on the select, but we'll use the pairingDiv.)
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
    }
    pairingDiv.appendChild(pairingControl);
    resultsDiv.appendChild(pairingDiv);
  });
}


/*
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
  } */

/*
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
  } */

function finalizeRound() {
  // Loop over each pairing by index.
  for (let i = 0; i < currentPairings.length; i++) {
    const pair = currentPairings[i];
    // If either competitor is a bye, skip processing this pairing.
    //if (pair.comp1 === "BYE" || pair.comp2 === "BYE") {
      //continue;
    //}
    
    // Retrieve the corresponding pairing element from the resultsDiv.
    // (Assumes the order of children in resultsDiv matches currentPairings.)
    const pairingDiv = resultsDiv.children[i];
    if (!pairingDiv) continue;
    
    // Get the select element from this pairing container.
    const select = pairingDiv.querySelector("select");
    if (!select) continue;
    
    const winner = select.value;
    if (!winner) continue; // Skip if no winner was selected.
    
    const loser = (winner === pair.comp1) ? pair.comp2 : pair.comp1;
    
    // Update wins and losses.
    competitors.forEach(comp => {
      if (comp.name === winner) comp.wins += 1;
      if (comp.name === loser) comp.losses += 1;
    });
  }
  
  updateCompetitorsTable();
  calcTeamPoints();
  
  // If more than one competitor remains eligible (losses < 2), generate new pairings.
  if (competitors.filter(c => c.losses < 2).length > 1) {
    displayPairings();
  } else {
    alert("Competition finished!");
    competitionStarted = false;
    finalizeRoundButton.disabled = true;
  }
}

// NEW: Calculate team points by summing wins for each team.
function calcTeamPoints() {
	let teamTotals = {};
	competitors.forEach(comp => {
	  // Only count competitors with a non-empty team name.
	  if (comp.team && comp.team.trim() !== "") {
		if (!teamTotals[comp.team]) {
		  teamTotals[comp.team] = 0;
		}
		//teamTotals[comp.team] += comp.wins;
		teamTotals[comp.team] += (comp.wins - comp.losses);
	  }
	});
	let output = "<h3> Team Points: Sum of (Wins - Losses) </h3><ul>";
	for (let team in teamTotals) {
	  output += `<li>${team}: ${teamTotals[team]} points</li>`;
	}
	output += "</ul>";
	teamPointsDisplay.innerHTML = output;
}  // endcalcTeampoints

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
  
  // NEW: When the "Calculate Team Points" button is clicked, compute and display team totals.
  calcTeamPointsButton.addEventListener("click", calcTeamPoints);

  // Initial table update.
  updateCompetitorsTable();
});

