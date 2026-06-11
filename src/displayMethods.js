function displayHelp() {
	$('#helpModal').modal('show');
}

function displaySpeciesRow(tracker, mon) {
	let currentRow = document.createElement('tr');
	currentRow.className = 'speciesRow';
	currentRow.onclick = function() {
		displaySpeciesPanel(mon);
	};
	tracker.body.appendChild(currentRow);
	
	buildBackgroundColor(currentRow, mon);
	
	currentRow.append(
		buildWrapper('td', 'speciesDexIDWrapper', mon.dexID),
		buildWrapperSprite('td', 'speciesSprite', getSprite(mon.ID)),
		buildWrapper('td', 'speciesNameWrapper', mon.key),
		buildWrapperTypes('td', 'speciesTypes', types[mon.type[0]], types[mon.type[1]]),
		buildWrapperAbilities('td', 'speciesAbilities', mon.abilities, mon.ID),
		buildWrapperStat('td', 'speciesStat', 'HP', mon.stats[0]),
		buildWrapperStat('td', 'speciesStat', 'Atk', mon.stats[1]),
		buildWrapperStat('td', 'speciesStat', 'Def', mon.stats[2]),
		buildWrapperStat('td', 'speciesStat', 'SpA', mon.stats[4]),
		buildWrapperStat('td', 'speciesStat', 'SpD', mon.stats[5]),
		buildWrapperStat('td', 'speciesStat', 'Spe', mon.stats[3]),
		buildWrapperStat('td', 'speciesStat', 'BST', mon.stats.reduce((total, y) => total += y, 0))
	);
}

function displayLevelUpMovesRow(tracker, movePair) {
	let move = movePair?.move ?? movePair?.[0] ?? movePair;
	let level = movePair?.level ?? movePair?.[1];
	let currentRow = document.createElement('tr');
	currentRow.className = 'movesRow';
	tracker.body.appendChild(currentRow);
	
	currentRow.append(
		buildWrapper('td', 'moveLevelWrapper', level),
		buildWrapperMoveName('td', 'moveName', move),
		buildWrapperTypes('td', 'moveType', types[move.type]),
		buildWrapperSprite('td', 'moveSplit', getSprite(splits[move.split])),
		buildWrapper('td', 'movePowerWrapper', move.power),
		buildWrapper('td', 'moveAccuracyWrapper', move.accuracy),
		buildWrapper('td', 'moveDescriptionWrapper', move.description)
	);
}

function displayMovesRow(tracker, move) {
	move = move.move ?? move;
	let currentRow = document.createElement('tr');
	currentRow.className = 'movesRow';
	tracker.body.appendChild(currentRow);
	
	currentRow.append(
		buildWrapperMoveName('td', 'moveName', move),
		buildWrapperTypes('td', 'moveType', types[move.type]),
		buildWrapperSprite('td', 'moveSplit', getSprite(splits[move.split])),
		buildWrapper('td', 'movePowerWrapper', move.power),
		buildWrapper('td', 'moveAccuracyWrapper', move.accuracy),
		buildWrapper('td', 'moveDescriptionWrapper', move.description)
	);
}

function displaySpeciesPanel(mon, saveEntry = null) {
	let infoDisplay = document.getElementById('speciesPanelInfoDisplay');
	const filterMoveEntries = entries => entries?.filter(entry => entry !== undefined) || [];
	let tables = [
		['speciesLearnsetPrevoExclusiveTable', filterMoveEntries(mon.prevoMoves?.map(x => buildSpeciesPanelMoveEntry(mon, x)))],
		['speciesLearnsetLevelUpTable', filterMoveEntries(mon.levelupMoves?.map(x => buildSpeciesPanelMoveEntry(mon, x[0], x[1])))],
		['speciesLearnsetTMHMTable', filterMoveEntries(mon.tmMoves?.map(x => buildSpeciesPanelMoveEntry(mon, tmMoves[x], null, true)))],
		['speciesLearnsetTutorTable', filterMoveEntries(mon.tutorMoves?.map(x => buildSpeciesPanelMoveEntry(mon, tutorMoves[x], null, true)))],
		['speciesLearnsetEggMovesTable', filterMoveEntries(mon.eggMoves?.map(x => buildSpeciesPanelMoveEntry(mon, x, null, true)))],
		['speciesLearnsetEventTable', filterMoveEntries(mon.eventMoves?.map(x => buildSpeciesPanelMoveEntry(mon, x, null, true)))],
	]
	
	infoDisplay.innerText = '';
	
	infoDisplay.append(
		buildWrapperSprite('div', 'infoSprite', getSprite(mon.ID)),
		buildWrapper('div', 'infoNameName', mon.key),
		buildWrapper('div', 'infoDexIDWrapper',  '#' + mon.dexID),
		buildWrapperTypes('div', 'infoTypes', types[mon.type[0]], types[mon.type[1]]),
		buildWrapperAbilitiesFull('div', 'infoAbilities', mon.abilities, mon.ID)
	);
	
	let statWrapper = buildWrapper('div', 'infoStats');
	statWrapper.append(
		buildWrapperStatFull('div', 'infoStat', 'HP', mon.stats[0]),
		buildWrapperStatFull('div', 'infoStat', 'Atk', mon.stats[1]),
		buildWrapperStatFull('div', 'infoStat', 'Def', mon.stats[2]),
		buildWrapperStatFull('div', 'infoStat', 'SpA', mon.stats[4]),
		buildWrapperStatFull('div', 'infoStat', 'SpD', mon.stats[5]),
		buildWrapperStatFull('div', 'infoStat', 'Spe', mon.stats[3]),
		buildWrapperStat('div', 'infoStat', 'BST', mon.stats.reduce((total, y) => total += y, 0))
	);
	
	infoDisplay.append(
		statWrapper,
		buildWrapperCap('div', 'infoCap', mon.ID),
		buildWrapperCurrentMovesDetail('div', 'infoCurrentMoves', mon, saveEntry),
		buildWrapperChangelog('div', 'infoChangelog', mon),
		buildWrapperFamilyTree('div', 'infoFamilyTree', mon),
		buildWrapperCoverageDefensive('div', 'infoCoverage', mon.type[0], mon.type[1]),
		buildWrapperHardcoreSummary('div', 'infoHardcore', mon),
		buildWrapperHeldItems('div', 'infoItems', mon.items),
		//buildWrapperEggGroups('div', 'infoEggGroups', mon.eggGroup),
	);

	for (const [ID, data] of tables) {
		let table = document.getElementById(ID);
		table.className = 'tableWrapper';
		if (data.length > 0) {
			table.classList.remove('hide');
			populateTable(ID, data);
		}
		else {
			table.classList.add('hide');
		}
	}

	$('#speciesModal').modal('show');
}

function buildWrapperCurrentMovesDetail(tag, className, mon, saveEntry = null) {
	let moveIds = saveEntry?.moveIds || [];
	if (!moveIds.length) {
		return buildWrapper(tag, className + 'Wrapper');
	}

	let wrapper = buildWrapper(tag, className + 'Wrapper');
	wrapper.append(buildWrapper('div', 'infoCurrentMovesLabel', 'Current Moves'));

	let moveList = buildWrapper('div', 'infoCurrentMovesList');
	for (const moveId of moveIds) {
		const move = moves?.[moveId];
		if (!move) {
			continue;
		}
		moveList.append(buildWrapperMoveName('div', 'infoCurrentMove', move));
	}

	if (!moveList.childElementCount) {
		return buildWrapper(tag, className + 'Wrapper');
	}

	wrapper.append(moveList);
	return wrapper;
}

function buildWrapper(tag, className, text=null) {
	let wrapper = document.createElement(tag);
	wrapper.className = className;
	if (text)
		wrapper.textContent = text;
	if (text === 0)
		wrapper.textContent = '-';
	
	return wrapper;
}

function buildWrapperMoveName(tag, className, move) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	let nameWrapper = buildWrapper('div', className);
	if (move.hardcoreUnavailable)
		nameWrapper.classList.add('hardcoreUnavailableMoveName');
	nameWrapper.append(document.createTextNode(move.name));

	if (move.hardcoreUnavailable) {
		let marker = buildWrapper('span', 'hardcoreUnavailableMarker', '★');
		marker.title = 'Not available in Hardcore';
		nameWrapper.append(marker);
	}

	wrapper.append(nameWrapper);

	return wrapper;
}

function buildWrapperSprite(tag, className, src) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	let img = document.createElement('img');
	img.className = className;
	img.src = src;
	wrapper.append(img);
	
	return wrapper;
}

//function buildWrapperName(tag, className, mon) {
//	let wrapper = buildWrapper(tag, className + 'Wrapper');
//	
//	if (mon.family.variant)
//		wrapper.append(buildWrapper('div', className + 'Region', regions[mon.family.region].variant));
//	
//	wrapper.append(buildWrapper('div', className + 'Name', mon.name));
//
//	if (mon.family.form)
//		wrapper.append(buildWrapper('div', className + 'Form', mon.family.form));
//	
//	return wrapper;
//}

function buildWrapperTypes(tag, className, primary, secondary=null) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	let typeBlock = buildWrapper('div', 'typeWrapper', primary.name);
	typeBlock.style.backgroundColor = primary.color;
	wrapper.append(typeBlock);
	
	if (secondary) {
		typeBlock = buildWrapper('div', 'typeWrapper', secondary.name);
		typeBlock.style.backgroundColor = secondary.color;
		wrapper.append(typeBlock);
	}
	
	return wrapper;
}

function buildWrapperAbilities(tag, className, a, species) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	if ((name = getAbilityName(a[1], species)))
		wrapper.append(buildWrapper('div', className + 'Primary', name));
	
	if ((name = getAbilityName(a[2], species)))
		wrapper.append(buildWrapper('div', className + 'Secondary', name));
	
	if ((name = getAbilityName(a[0], species)))
		wrapper.append(buildWrapper('div', className + 'Hidden', name));
	
	return wrapper;
}

function buildWrapperAbilitiesFull(tag, className, a, species) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	let ability;
	if ((name = getAbilityName(a[1], species))) {
		ability = getMappedAbility(a[1], species);
		wrapper.append(buildWrapper('div', className + 'Primary', name + ' - ' + abilities[ability[0]].description));
	}

	if ((name = getAbilityName(a[2], species))) {
		ability = getMappedAbility(a[2], species);
		wrapper.append(buildWrapper('div', className + 'Secondary', name + ' - ' + abilities[ability[0]].description));
	}

	if ((name = getAbilityName(a[0], species))) {
		ability = getMappedAbility(a[0], species);
		wrapper.append(buildWrapper('div', className + 'Hidden', name + ' - ' + abilities[ability[0]].description));
	}

	return wrapper;
}

function buildWrapperStat(tag, className, label, value) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	wrapper.append(buildWrapper('div', className + 'Label', label));
	wrapper.append(buildWrapper('div', className + 'Value', value));
	
	return wrapper;
}

function buildWrapperStatFull(tag, className, label, value) {
	let wrapper = buildWrapperStat(tag, className, label, value);
	
	let rank = 6;
	if (value < 150)
		rank = 5;
	if (value < 120)
		rank = 4;
	if (value < 90)
		rank = 3;
	if (value < 60)
		rank = 2;
	if (value < 30)
		rank = 1;
	
	let bar = buildWrapper('div', 'infoStatBar rank' + rank);
	bar.style.width = `${(value / 255) * 300}px`;
	wrapper.append(bar);
	
	return wrapper;
}

function buildWrapperChangelog(tag, className, mon) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	if (!mon.changes)
		return wrapper;
	
	wrapper.append(buildWrapper('div', 'infoChangelogLabel', 'RR Changes'));
	
	if (mon.changes == 'new') {
		wrapper.append(buildWrapper('div', 'infoChangelogUnique', 'All New Pokemon!'));
		return wrapper;
	}
	
	if (mon.changes.type) {
		let typeWrapper = buildWrapper('div', 'infoChangelogTypesWrapper');
		typeWrapper.append(buildWrapperTypes('div', 'infoChangelogOldType', types[mon.changes.type[0]], types[mon.changes.type[1]]));
		typeWrapper.append(buildWrapper('div', className + 'ArrowWrapper', '→'));
		typeWrapper.append(buildWrapperTypes('div', 'infoChangelogNewType', types[mon.type[0]], types[mon.type[1]]));
		wrapper.append(typeWrapper);
	}
	
	if (mon.changes.abilities) {
		let abilityWrapper = buildWrapper('div', 'infoChangelogAbilityWrapper');
		for (const ability of [1, 2, 0]) {
			let oldAbility = mon.changes.abilities[ability];
			let newAbility = mon.abilities[ability];

			if (newAbility.equals(oldAbility))
				continue;
			if (typeof oldAbility !== 'string')
				oldAbility = getAbilityName(oldAbility, mon.ID, true);
			newAbility = getAbilityName(newAbility, mon.ID, true);
		
			if (oldAbility && newAbility)
				abilityWrapper.append(buildWrapper('div', 'infoChangelogAbility' + ability, oldAbility + ' → ' + newAbility));
			else if (newAbility)
				abilityWrapper.append(buildWrapper('div', 'infoChangelogAbility' + ability, 'None → ' + newAbility));
			else
				abilityWrapper.append(buildWrapper('div', 'infoChangelogAbility' + ability, oldAbility + ' → None'));
			}
		wrapper.append(abilityWrapper);
	}
	
	if (mon.changes.stats) {
		let statsWrapper = buildWrapper('div', className);
		
		for (const [idx, label] of Object.entries({HP:0, Atk:1, Def:2, SpA:4, SpD:5, Spe:3})) {
			if (mon.changes.stats[idx] === mon.stats[idx])
				continue;
			let statClass = mon.changes.stats[idx] < mon.stats[idx] ? 'infoChangelogBuff' : 'infoChangelogNerf';
			statsWrapper.append(buildWrapper('div', statClass, label + ' ' + mon.changes.stats[idx] + ' → ' + mon.stats[idx]));
		}
		wrapper.append(statsWrapper);
	}
	
	return wrapper;
}

function buildWrapperFamilyTree(tag, className, mon) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	wrapper.append(buildWrapper('div', 'infoTreeEvoLabel', 'Evolution Line'));
	let display = buildWrapper('div', 'infoEvolutionMethods');
	wrapper.append(familyTree(display, species[mon.ancestor]));
	wrapper.append(display);
	
	
	if (mon.order !== undefined) {
		let forms = Object.values(species).filter(x => x.dexID == mon.dexID).sort(cmp(x => x.order));
		wrapper.append(buildWrapper('div', 'infoTreeFormsLabel', 'Alternate Forms'));
		let formsWrapper = buildWrapper('div', 'infoFormsWrapper');
		for (const form of forms) {
			let spriteWrapper = buildWrapper('div', 'infoTreeSpriteWrapper');
			let img = document.createElement('img');
			img.src = getSprite(form.ID);
			img.className = 'infoTreeSprite';
			img.onclick = function () {
				displaySpeciesPanel(form);
			}
			spriteWrapper.append(img);
			formsWrapper.append(spriteWrapper);
		}
		wrapper.append(formsWrapper);
	}

	return wrapper;
}

function familyTree(display, mon, prevo=null, evo=null) {
	let wrapper = buildWrapper('div', 'infoTreeWrapper ' + mon.key);
	
	if (prevo) {
		wrapper.className += ' inner';
		let evoWrapper = buildWrapper('div', 'evoMethodWrapper');
		let arrow = buildWrapper('div', 'infoTreeArrow', `→`);
		
		let leftMon = prevo.key;
		let rightMon = mon.key;
		let description = eval(evolutions[evo[0]]);
		arrow.title = description;
		let method = buildWrapper('div', 'evoMethod');
		
		method.innerHTML = `<span>${leftMon}</span> → <span>${rightMon}</span> ${description}.`;
		display.append(method);
		
		evoWrapper.append(arrow);
		wrapper.append(evoWrapper);
	}
	else
		wrapper.className += ' outer';
	
	let spriteWrapper = buildWrapper('div', 'infoTreeSpriteWrapper');
	let img = document.createElement('img');
	img.src = getSprite(mon.ID);
	img.className = 'infoTreeSprite';
	img.onclick = function () {
		displaySpeciesPanel(mon);
	}
	spriteWrapper.append(img);
	wrapper.append(spriteWrapper);	
	if (mon.evolutions) {
		if (mon.evolutions.length === 1)
			wrapper.className += ' single';
		let branchWrapper = buildWrapper('div', 'infoTreeBranchWrapper');
		for (const evolution of mon.evolutions)
			branchWrapper.append(familyTree(display, species[evolution[2]], mon, evolution));
		wrapper.append(branchWrapper);
	}
	
	return wrapper;
}

function buildWrapperCoverageDefensive(tag, className, primary, secondary=undefined) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	let label = buildWrapper('div', 'coverageLabelWrapper', 'Weakness');
	let matchups = buildWrapper('div', 'coverageMatchupsWrapper');
	
	let coverage = {};
	for (const type of Object.values(types)) {

		let matchup = 1;
		for (const speciesType of [primary, secondary]) {

			if (speciesType === undefined)
				continue;
			
			switch (type.matchup[speciesType]) {
				case 20: matchup *= 2;   break;
				case  5: matchup *= 0.5; break;
				case  1: matchup *= 0;   break;
			}
		}
		
		matchups.append(buildWrapperTypeMatchup(type, matchup));
	}
	
	wrapper.append(label, matchups);
	
	return wrapper;
}

function buildWrapperTypeMatchup(type, matchup) {
	let wrapper = buildWrapper('div', 'typeMatchupWrapper');
	
	wrapper.append(buildWrapperTypes('div', 'typeMatchupLabel', type));
	wrapper.append(buildWrapper('div', 'typeMatchupMultiplier x' + (matchup * 100), matchup + 'x'));
	
	return wrapper;
}

let speciesLocationIndexCache = null;
let randomizedSpeciesLocationCache = new Map();
const RANDOMIZER_LOCATION_FALLBACK_SPECIES_ID = 132;

function collectSpeciesIdsFromEncounterValue(value, speciesIds) {
	if (Array.isArray(value)) {
		if (value.length > 0 && value.every(entry => typeof entry === 'number')) {
			const looksLikeEncounterTuple =
				value.length <= 3 &&
				value[0] > 0 &&
				value[0] <= 1375 &&
				value.slice(1).every(level => level >= 0 && level <= 100);
			if (looksLikeEncounterTuple) {
				speciesIds.add(value[0]);
				return;
			}

			for (const entry of value) {
				if (entry > 0 && entry <= 1375) {
					speciesIds.add(entry);
				}
			}
			return;
		}

		for (const entry of value) {
			collectSpeciesIdsFromEncounterValue(entry, speciesIds);
		}
		return;
	}

	if (value && typeof value === 'object') {
		for (const entry of Object.values(value)) {
			collectSpeciesIdsFromEncounterValue(entry, speciesIds);
		}
	}
}

function getSpeciesLocationIndex() {
	if (speciesLocationIndexCache) {
		return speciesLocationIndexCache;
	}

	speciesLocationIndexCache = new Map();
	if (!areas) {
		return speciesLocationIndexCache;
	}

	for (const [areaId, area] of Object.entries(areas)) {
		const encounteredSpeciesIds = new Set();
		for (const [bucket, value] of Object.entries(area)) {
			if (bucket === 'name' || (!bucket.includes('wild') && !bucket.includes('fixed'))) {
				continue;
			}
			collectSpeciesIdsFromEncounterValue(value, encounteredSpeciesIds);
		}

		for (const speciesId of encounteredSpeciesIds) {
			if (!speciesLocationIndexCache.has(speciesId)) {
				speciesLocationIndexCache.set(speciesId, []);
			}
			speciesLocationIndexCache.get(speciesId).push({
				areaId: Number(areaId),
				name: area.name || `Area ${areaId}`,
			});
		}
	}

	for (const locationList of speciesLocationIndexCache.values()) {
		locationList.sort((a, b) => a.name.localeCompare(b.name) || a.areaId - b.areaId);
	}

	return speciesLocationIndexCache;
}

function getDirectSpeciesAreas(ID) {
	return getSpeciesLocationIndex().get(ID) || [];
}

function resetDisplayLocationCaches() {
	randomizedSpeciesLocationCache.clear();
}

function getRandomizerSpeciesPoolKey() {
	if (typeof RANDOMIZER_SPECIES_POOLS !== 'object' || !RANDOMIZER_SPECIES_POOLS) {
		return null;
	}

	const branchKey = saveData?.random?.speciesBranchKey;
	if (typeof branchKey === 'string' && typeof RANDOMIZER_SPECIES_BRANCHES === 'object' && RANDOMIZER_SPECIES_BRANCHES) {
		const branch = RANDOMIZER_SPECIES_BRANCHES[branchKey];
		if (!branch || !branch.deterministic || typeof branch.poolKey !== 'string') {
			return null;
		}
		return RANDOMIZER_SPECIES_POOLS[branch.poolKey] ? branch.poolKey : null;
	}

	if (typeof DEFAULT_RANDOMIZER_SPECIES_POOL === 'string') {
		return DEFAULT_RANDOMIZER_SPECIES_POOL;
	}

	return Object.keys(RANDOMIZER_SPECIES_POOLS)[0] || null;
}

function getRandomizerSpeciesPool() {
	const poolKey = getRandomizerSpeciesPoolKey();
	return poolKey ? RANDOMIZER_SPECIES_POOLS[poolKey] || null : null;
}

function mapSpeciesFromRandomizerPool(speciesId, trainedId, pool) {
	if (!pool || !Array.isArray(pool.speciesIds) || !pool.count) {
		return speciesId;
	}

	if (speciesId <= 0 || speciesId > 1375) {
		return speciesId;
	}

	const slot = (Math.imul(speciesId, trainedId >>> 0) >>> 0) % pool.count;
	const mappedSpeciesId = pool.speciesIds[slot] || RANDOMIZER_LOCATION_FALLBACK_SPECIES_ID;
	if (mappedSpeciesId <= 0 || mappedSpeciesId > 1375) {
		return RANDOMIZER_LOCATION_FALLBACK_SPECIES_ID;
	}
	return mappedSpeciesId;
}

function getRandomizedSpeciesAreas(ID) {
	const trainedId = saveData?.trainedId;
	const pool = getRandomizerSpeciesPool();
	const poolKey = getRandomizerSpeciesPoolKey();
	if (typeof trainedId !== 'number' || !Number.isFinite(trainedId) || !pool || !poolKey) {
		return [];
	}

	const cacheKey = `${trainedId}:${poolKey}:${ID}`;
	if (randomizedSpeciesLocationCache.has(cacheKey)) {
		return randomizedSpeciesLocationCache.get(cacheKey);
	}

	const mergedAreas = new Map();
	for (const [originalSpeciesId, locations] of getSpeciesLocationIndex().entries()) {
		if (mapSpeciesFromRandomizerPool(originalSpeciesId, trainedId, pool) !== ID) {
			continue;
		}

		for (const location of locations) {
			mergedAreas.set(location.areaId, location);
		}
	}

	const mappedAreas = Array.from(mergedAreas.values())
		.sort((a, b) => a.name.localeCompare(b.name) || a.areaId - b.areaId);
	randomizedSpeciesLocationCache.set(cacheKey, mappedAreas);
	return mappedAreas;
}

function buildWrapperCap(tag, className, ID) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	let myAreas = saveData?.random?.normalSpecies
		? getRandomizedSpeciesAreas(ID)
		: getDirectSpeciesAreas(ID);

	wrapper.append(buildWrapper('div', 'infoCapLabel', 'Location'));
	if (myAreas.length > 0) {
		for (const area of myAreas) {
			wrapper.append(buildWrapper('div', className, area.name));
		}
	}
	else {
		wrapper.append(buildWrapper('div', className, 'No location data.'));
	}

	return wrapper;
}

function buildWrapperHeldItems(tag, className, i) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	if (!Array.isArray(i) || (i[0] === 0 && i[1] === 0))
		return wrapper;
	wrapper.append(buildWrapper('div', 'infoItemsLabel', 'Held Items'));
	if (i[0])
		wrapper.append(buildWrapper('div', className, 'Common: ' + items[i[0]].name));
	if (i[1])
		wrapper.append(buildWrapper('div', className, 'Rare: ' + items[i[1]].name));
	
	return wrapper;
}

function buildWrapperHardcoreSummary(tag, className, mon) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	let hardcoreAbilities = getSpeciesAbilityPackage(mon, true);

	wrapper.append(buildWrapper('div', 'infoHardcoreLabel', 'Hardcore Mode'));

	if (hardcoreAbilities.length > 0) {
		wrapper.append(buildWrapper('div', 'infoHardcoreSubLabel', 'Ability Changes'));
		for (const ability of hardcoreAbilities) {
			let text = `${ability.slot}: ${ability.name}`;
			if (ability.changedForHardcore)
				text = `${ability.slot}: ${ability.mappedName} → ${ability.name}`;
			wrapper.append(buildWrapper('div', 'infoHardcoreAbility', text));
		}
	}

	let legend = buildWrapper('div', 'infoHardcoreMoveLegend');
	let marker = buildWrapper('span', 'hardcoreUnavailableMarker', '★');
	legend.append(marker);
	legend.append(document.createTextNode(' is not available in Hardcore.'));
	wrapper.append(legend);

	return wrapper;
}

function buildWrapperEggGroups(tag, className, e) {
	let wrapper = buildWrapper(tag, className + 'Wrapper');
	
	if (!Array.isArray(e) || (e[0] === 0 && e[1] === 0))
		return wrapper;
	
	wrapper.append(buildWrapper('div', 'infoEggGroupsLabel', 'Egg Groups'));
	if (e[0])
		wrapper.append(buildWrapper('div', className, 'egg1'));//eggGroups[e[0]].name));
	if (e[1])
		wrapper.append(buildWrapper('div', className, 'egg2'));//eggGroups[e[1]].name));
	
	return wrapper;
}

function buildBackgroundColor(currentRow, mon) {
	currentRow.style.backgroundColor = types[mon.type[0]].color;
		currentRow.style.backgroundImage = 'linear-gradient(to right, rgba' + currentRow.style.backgroundColor.substr(3).replace(')', ', 0.4)') + ', rgb(63, 40, 40, 0.4))';
		currentRow.style.backgroundColor = '';
	return;
	
	//if (mon.type.secondary) {
	//	let gradient = [];
	//	currentRow.style.backgroundColor = types[mon.type.primary].color;
	//	gradient.push(currentRow.style.backgroundColor.substr(3).replace(')', ', 0.4)'));
	//	currentRow.style.backgroundColor = types[mon.type.secondary].color;
	//	gradient.push(currentRow.style.backgroundColor.substr(3).replace(')', ', 0.4)'));
	//	currentRow.style.backgroundColor = '';
	//	currentRow.style.backgroundImage = 'linear-gradient(to right, rgba' + gradient[0] + ', rgba' + gradient[1] + ')';
	//}
	//else {
	//	currentRow.style.backgroundColor = types[mon.type.primary].color;
	//	currentRow.style.backgroundImage = 'linear-gradient(to right, rgba' + currentRow.style.backgroundColor.substr(3).replace(')', ', 0.4)') + ', rgb(63, 40, 40, 0.4))';
	//	currentRow.style.backgroundColor = '';
	//}
}
