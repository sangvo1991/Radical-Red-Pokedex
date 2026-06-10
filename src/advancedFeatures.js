const HARDCORE_BANNED_MOVES = [
	'Shell Smash', 'Quiver Dance', 'Dragon Dance', 'Calm Mind', 'Bulk Up',
	'Curse', 'Rain Dance', 'Sandstorm', 'Hail', 'Sunny Day', 'Tailwind',
	'Electric Terrain', 'Misty Terrain', 'Grassy Terrain', 'Psychic Terrain',
	'Toxic Spikes', 'Sticky Web', 'Shift Gear', 'Tail Glow', 'Coil',
	'Belly Drum', 'Cotton Guard', 'No Retreat', 'Amnesia', 'Acid Armor',
	'Iron Defense', 'Cosmic Power', 'Stockpile', 'Swallow', 'Spit Up',
	'Geomancy', 'Clangorous Soul', 'Fell Stinger', 'Trick Room', 'Strength Sap',
	'Skull Bash', 'Meteor Beam', 'Taunt', 'Psych Up', 'Snatch', 'Magic Coat',
	'Protect', 'Wide Guard', 'Stealth Rock', 'Spikes', 'Perish Song',
	'Substitute', 'Nasty Plot', 'Swords Dance', 'Agility', 'Autotomize',
	'Rock Polish', 'Charm', 'Scale Shot', 'Power-Up Punch', 'Charge Beam',
	'Flame Charge', 'Growth', 'Work Up', 'Hone Claws', 'Meditate', 'Howl',
	'Fiery Dance', 'Destiny Bond', 'Harden', 'Withdraw', 'Defense Curl',
	'Victory Dance', 'Powder'
];

const HARDCORE_RESTRICTED_MOVES = ['Leech Seed', 'Toxic'];

const HARDCORE_RESTRICTED_SPECIES_IDS = [12,19,20,21,22,23,24,37,38,39,40,43,44,45,46,47,48,49,50,51,60,61,62,69,70,71,74,75,76,96,97,167,168,182,185,186,203,206,213,218,219,222,286,287,288,289,292,294,308,309,310,311,312,313,314,320,344,345,367,368,369,386,387,390,391,452,453,455,463,464,470,484,485,487,488,491,494,508,509,510,512,513,529,548,549,550,557,558,562,563,572,573,574,577,578,579,592,593,594,595,598,601,602,609,612,613,617,618,633,634,635,636,637,640,652,653,654,658,659,666,667,703,774,784,794,795,796,797,951,952,958,959,960,963,968,969,970,971,992,1020,1021,1025,1026,1027,1028,1031,1032,1033,1043,1044,1045,1047,1111,1112,1119,1120,1129,1130,1131,1144,1145,1155,1163,1166,1168,1202,1208];

const HARDCORE_ABILITY_REPLACEMENTS = {
	'Drought': 'Sheer Force',
	'Desolate Land': 'Sheer Force',
	'Drizzle': 'Adaptability',
	'Primordial Sea': 'Adaptability',
	'Sand Spit': 'Sand Force',
	'Sand Stream': 'Sand Force',
	'Snow Warning': 'Slush Rush',
	'Speed Boost': 'Infiltrator',
	'Contrary': 'Bad Company',
	'Defiant': 'Clear Body',
	'Competitive': 'Clear Body',
	'Misty Surge': 'Telepathy',
	'Electric Surge': 'Telepathy',
	'Psychic Surge': 'Dazzling',
	'Moxie': 'Unnerve',
	'Grim Neigh': 'Unnerve',
	'Soul-Heart': 'Unnerve',
	'Beast Boost': 'Unnerve',
	'Imposter': 'Limber',
	'Magic Bounce': 'Magic Guard',
	'Storm Drain': 'Water Absorb',
	'Motor Drive': 'Volt Absorb',
	'Lightning Rod': 'Volt Absorb',
	'Blazing Soul': 'Flash Fire',
	'Triage': 'Natural Cure',
	'Trace': 'Synchronize',
	'Stamina': 'Inner Focus',
	'Grassy Surge': 'Self Sufficient'
};

const HARDCORE_SPECIAL_ABILITY_REPLACEMENTS = {
	248: { 'Sand Stream': 'Intimidate' },
	579: { 'Sand Stream': 'Solid Rock' },
	889: { 'Sand Stream': 'Intimidate' },
	981: { 'Triage': 'Triage' },
	1104: { 'Grassy Surge': 'Intimidate' },
	1264: { 'As One (Moxie + Unnerve)': 'Unnerve' },
	1265: { 'As One (Grim Neigh + Unnerve)': 'Unnerve' }
};

let hardcoreState = null;
let advancedSearchPredicate = null;
let advancedSearchQuery = '';
let speciesSearchCache = new Map();
let movePackageCache = {
	base: new Map(),
	hardcore: new Map()
};
let abilityPackageCache = {
	base: new Map(),
	hardcore: new Map()
};
let advancedSearchAutocompleteMetadata = null;
let advancedSearchAutocompleteSuggestions = [];
let advancedSearchAutocompleteIndex = -1;
let advancedSearchActionsHideTimer = null;
let advancedSearchActionsVisibilityTimer = null;

function resetAdvancedFeatureCaches() {
	speciesSearchCache = new Map();
	movePackageCache = {
		base: new Map(),
		hardcore: new Map()
	};
	abilityPackageCache = {
		base: new Map(),
		hardcore: new Map()
	};
	advancedSearchAutocompleteMetadata = null;
	advancedSearchAutocompleteSuggestions = [];
	advancedSearchAutocompleteIndex = -1;
}

function setupAdvancedFeatures() {
	buildHardcoreState();
	setupAdvancedSearch();
}

function sortSearchValues(values) {
	return uniqStrings(values).sort((left, right) => left.localeCompare(right));
}

function buildAdvancedSearchAutocompleteMetadata() {
	if (advancedSearchAutocompleteMetadata) {
		return advancedSearchAutocompleteMetadata;
	}

	const speciesNames = sortSearchValues(Object.values(species).map(mon => mon.key));
	const typeNames = sortSearchValues(Object.values(types).map(type => type.name));
	const abilityNames = sortSearchValues(Object.values(abilities).map(ability => getAbilityDisplayNameById(ability.ID)));
	const moveNames = sortSearchValues(Object.values(moves).map(move => move.name));
	const itemNames = sortSearchValues(Object.values(items).map(item => item?.name));
	const eggGroupNames = sortSearchValues(Object.values(eggGroups).filter(Boolean));
	const hardcoreAbilityNames = sortSearchValues(
		Object.values(species).flatMap(mon => getSpeciesAbilityPackage(mon, true).map(ability => ability.name))
	);
	const hardcoreMoveNames = sortSearchValues(
		Object.values(species).flatMap(mon => getSpeciesMovePackage(mon, true).all.map(move => move.name))
	);

	const valuesByKey = {
		speciesNames,
		typeNames,
		abilityNames,
		hardcoreAbilityNames,
		moveNames,
		hardcoreMoveNames,
		itemNames,
		eggGroupNames
	};

	advancedSearchAutocompleteMetadata = createAdvancedSearchAutocompleteMetadata(valuesByKey);
	return advancedSearchAutocompleteMetadata;
}

function buildHardcoreState() {
	if (hardcoreState) {
		return hardcoreState;
	}

	const moveIdsByName = new Map();
	for (const move of Object.values(moves)) {
		moveIdsByName.set(move.name, move.ID);
	}

	const abilityIdsByName = new Map();
	for (const ability of Object.values(abilities)) {
		for (const name of ability.names) {
			abilityIdsByName.set(name, ability.ID);
		}
		abilityIdsByName.set(getAbilityDisplayNameById(ability.ID), ability.ID);
	}

	const bannedMoveIds = new Set(HARDCORE_BANNED_MOVES.map(name => moveIdsByName.get(name)).filter(id => id !== undefined));
	const restrictedMoveIds = new Set(HARDCORE_RESTRICTED_MOVES.map(name => moveIdsByName.get(name)).filter(id => id !== undefined));
	const restrictedSpeciesIds = new Set(HARDCORE_RESTRICTED_SPECIES_IDS);

	const abilityReplacements = new Map();
	for (const [fromName, toName] of Object.entries(HARDCORE_ABILITY_REPLACEMENTS)) {
		const fromId = abilityIdsByName.get(fromName);
		const toId = abilityIdsByName.get(toName);
		if (fromId !== undefined && toId !== undefined) {
			abilityReplacements.set(fromId, toId);
		}
	}

	const specialAbilityReplacements = new Map();
	for (const [speciesId, overrides] of Object.entries(HARDCORE_SPECIAL_ABILITY_REPLACEMENTS)) {
		const speciesOverrides = new Map();
		for (const [fromName, toName] of Object.entries(overrides)) {
			const fromId = abilityIdsByName.get(fromName);
			const toId = abilityIdsByName.get(toName);
			if (fromId !== undefined && toId !== undefined) {
				speciesOverrides.set(fromId, toId);
			}
		}
		specialAbilityReplacements.set(Number(speciesId), speciesOverrides);
	}

	hardcoreState = {
		bannedMoveIds,
		restrictedMoveIds,
		restrictedSpeciesIds,
		abilityReplacements,
		specialAbilityReplacements
	};

	return hardcoreState;
}

function setupAdvancedSearch() {
	const input = document.getElementById('advancedSearchInput');
	const dropdown = document.getElementById('advancedSearchAutocompleteDropdown');
	const wrapper = document.getElementById('advancedSearchInputWrapper');
	const form = document.getElementById('advancedSearchForm');
	const actions = document.getElementById('advancedSearchActions');
	if (!input || !dropdown || !wrapper || !form || !actions) {
		return;
	}

	buildAdvancedSearchAutocompleteMetadata();

	const showAdvancedSearchActions = function() {
		if (advancedSearchActionsHideTimer) {
			clearTimeout(advancedSearchActionsHideTimer);
			advancedSearchActionsHideTimer = null;
		}
		if (advancedSearchActionsVisibilityTimer) {
			clearTimeout(advancedSearchActionsVisibilityTimer);
			advancedSearchActionsVisibilityTimer = null;
		}

		if (actions.classList.contains('hide')) {
			actions.classList.remove('hide');
			actions.classList.remove('visible');
			requestAnimationFrame(function() {
				actions.classList.add('visible');
			});
			return;
		}

		actions.classList.add('visible');
	};

	const scheduleHideAdvancedSearchActions = function() {
		if (advancedSearchActionsHideTimer) {
			clearTimeout(advancedSearchActionsHideTimer);
		}

		advancedSearchActionsHideTimer = setTimeout(function() {
			advancedSearchActionsHideTimer = null;
			if (document.activeElement === input || form.matches(':hover')) {
				return;
			}
			actions.classList.remove('visible');
			advancedSearchActionsVisibilityTimer = setTimeout(function() {
				advancedSearchActionsVisibilityTimer = null;
				if (!actions.classList.contains('visible')) {
					actions.classList.add('hide');
				}
			}, 100);
		}, 700);
	};

	input.addEventListener('keydown', function(event) {
		showAdvancedSearchActions();

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			if (advancedSearchAutocompleteSuggestions.length) {
				event.preventDefault();
				moveAdvancedSearchAutocompleteSelection(event.key === 'ArrowDown' ? 1 : -1);
			}
			return;
		}

		if (event.key === 'Tab' && advancedSearchAutocompleteSuggestions.length) {
			event.preventDefault();
			applyAdvancedSearchAutocompleteSuggestion(
				advancedSearchAutocompleteSuggestions[Math.max(advancedSearchAutocompleteIndex, 0)]
			);
			return;
		}

		if (event.key === 'Escape') {
			hideAdvancedSearchAutocomplete();
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			runAdvancedSearch();
		}
	});

	input.addEventListener('input', function() {
		showAdvancedSearchActions();
		refreshAdvancedSearchAutocomplete();
	});
	input.addEventListener('click', function() {
		showAdvancedSearchActions();
		refreshAdvancedSearchAutocomplete();
	});
	input.addEventListener('focus', function() {
		showAdvancedSearchActions();
		refreshAdvancedSearchAutocomplete();
	});
	input.addEventListener('blur', scheduleHideAdvancedSearchActions);
	wrapper.addEventListener('mouseenter', showAdvancedSearchActions);
	form.addEventListener('mouseenter', showAdvancedSearchActions);
	form.addEventListener('mouseleave', scheduleHideAdvancedSearchActions);

	document.addEventListener('mousedown', function(event) {
		if (!wrapper.contains(event.target)) {
			hideAdvancedSearchAutocomplete();
		}
	});
}

function hideAdvancedSearchAutocomplete() {
	const dropdown = document.getElementById('advancedSearchAutocompleteDropdown');
	if (!dropdown) {
		return;
	}

	advancedSearchAutocompleteSuggestions = [];
	advancedSearchAutocompleteIndex = -1;
	dropdown.innerHTML = '';
	dropdown.className = 'hide';
}

function moveAdvancedSearchAutocompleteSelection(direction) {
	if (!advancedSearchAutocompleteSuggestions.length) {
		return;
	}

	advancedSearchAutocompleteIndex += direction;
	if (advancedSearchAutocompleteIndex < 0) {
		advancedSearchAutocompleteIndex = advancedSearchAutocompleteSuggestions.length - 1;
	}
	if (advancedSearchAutocompleteIndex >= advancedSearchAutocompleteSuggestions.length) {
		advancedSearchAutocompleteIndex = 0;
	}

	renderAdvancedSearchAutocomplete();
}

function refreshAdvancedSearchAutocomplete() {
	const input = document.getElementById('advancedSearchInput');
	if (!input) {
		return;
	}

	const cursorIndex = input.selectionStart ?? input.value.length;
	advancedSearchAutocompleteSuggestions = getAdvancedSearchAutocompleteSuggestions(input.value, cursorIndex);
	advancedSearchAutocompleteIndex = advancedSearchAutocompleteSuggestions.length ? 0 : -1;
	renderAdvancedSearchAutocomplete();
}

function renderAdvancedSearchAutocomplete() {
	const dropdown = document.getElementById('advancedSearchAutocompleteDropdown');
	if (!dropdown) {
		return;
	}

	if (!advancedSearchAutocompleteSuggestions.length) {
		hideAdvancedSearchAutocomplete();
		return;
	}

	dropdown.innerHTML = '';
	advancedSearchAutocompleteSuggestions.forEach((suggestion, index) => {
		const item = document.createElement('li');
		item.className = `advancedSearchAutocompleteItem${index === advancedSearchAutocompleteIndex ? ' active' : ''}`;

		const label = document.createElement('span');
		label.className = 'advancedSearchAutocompleteLabel';
		label.textContent = suggestion.label;

		const meta = document.createElement('span');
		meta.className = 'advancedSearchAutocompleteMeta';
		meta.textContent = suggestion.meta;

		item.append(label, meta);
		item.addEventListener('mousedown', function(event) {
			event.preventDefault();
			applyAdvancedSearchAutocompleteSuggestion(suggestion);
		});
		dropdown.append(item);
	});

	dropdown.className = '';

	const activeElement = dropdown.children[advancedSearchAutocompleteIndex];
	if (activeElement) {
		activeElement.scrollIntoView({ block: 'nearest' });
	}
}

function normalizeAdvancedSearchInput(input) {
	return String(input ?? '')
		.replace(/[\u2018\u2019\u201A\u201B]/g, '\'')
		.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
}

function tokenizeAdvancedSearchPartial(input) {
	input = normalizeAdvancedSearchInput(input);
	const tokens = [];
	let index = 0;

	while (index < input.length) {
		const start = index;
		const current = input[index];

		if (/\s/.test(current)) {
			index++;
			continue;
		}

		const twoChar = input.slice(index, index + 2);
		if (['>=', '<=', '!=', '=='].includes(twoChar)) {
			tokens.push({ type: 'operator', value: twoChar, start, end: index + 2, partial: false });
			index += 2;
			continue;
		}

		if (['(', ')', ','].includes(current)) {
			tokens.push({ type: current, value: current, start, end: index + 1, partial: false });
			index++;
			continue;
		}

		if (['>', '<', '='].includes(current)) {
			tokens.push({ type: 'operator', value: current, start, end: index + 1, partial: false });
			index++;
			continue;
		}

		if (current === '!') {
			tokens.push({ type: 'operator', value: current, start, end: index + 1, partial: true });
			index++;
			continue;
		}

		if (current === '"' || current === '\'') {
			const quote = current;
			let value = '';
			index++;
			while (index < input.length && input[index] !== quote) {
				if (input[index] === '\\' && index + 1 < input.length) {
					value += input[index + 1];
					index += 2;
					continue;
				}
				value += input[index];
				index++;
			}

			if (input[index] === quote) {
				index++;
				tokens.push({ type: 'string', value, quote, start, end: index, partial: false });
			}
			else {
				tokens.push({ type: 'string', value, quote, start, end: input.length, partial: true });
				break;
			}
			continue;
		}

		if (/[0-9]/.test(current)) {
			let value = current;
			index++;
			while (index < input.length && /[0-9.]/.test(input[index])) {
				value += input[index];
				index++;
			}
			tokens.push({ type: 'number', value, start, end: index, partial: index === input.length });
			continue;
		}

		if (/[A-Za-z_]/.test(current)) {
			let value = current;
			index++;
			while (index < input.length && /[A-Za-z0-9_.-]/.test(input[index])) {
				value += input[index];
				index++;
			}
			tokens.push({ type: 'word', value, start, end: index, partial: index === input.length });
			continue;
		}

		tokens.push({ type: 'unknown', value: current, start, end: index + 1, partial: true });
		break;
	}

	return tokens;
}

function isAdvancedSearchScalarToken(token) {
	return token && ['word', 'number', 'string'].includes(token.type);
}

function isAdvancedSearchOperatorToken(token) {
	return token && (
		token.type === 'operator' ||
		(token.type === 'word' && ['has', 'have'].includes(token.value.toLowerCase()))
	);
}

function buildImplicitNameSearchAst(query) {
	return {
		type: 'comparison',
		attribute: 'name',
		operator: 'has',
		value: query
	};
}

function getPlainNameSearchAutocompleteContext(input, cursorIndex) {
	const query = input.trim();
	if (!query) {
		return null;
	}

	if (cursorIndex !== input.length) {
		return null;
	}

	if (/[(),=<>!'"]/.test(input)) {
		return null;
	}

	const tokens = tokenizeAdvancedSearchPartial(input);
	if (tokens.some(token => ['operator', '(', ')', ',', 'unknown'].includes(token.type))) {
		return null;
	}

	if (tokens.some(token => token.type === 'word' && ['and', 'or', 'has', 'have'].includes(token.value.toLowerCase()))) {
		return null;
	}

	const metadata = buildAdvancedSearchAutocompleteMetadata();
	const exactAttribute = metadata.byName[normalizeSearchKey(query)];
	if (exactAttribute && /\s$/.test(input)) {
		return null;
	}

	return {
		fragment: query,
		rangeStart: 0,
		rangeEnd: input.length
	};
}

function parseAdvancedSearchWithFallback(query) {
	try {
		return parseAdvancedSearch(query);
	}
	catch {
		return buildImplicitNameSearchAst(query);
	}
}

function tryFinalizeAdvancedSearchAutocompleteToken(state, activeToken, currentAttribute, stack, metadata) {
	if (!activeToken) {
		return null;
	}

	const attribute = currentAttribute ? metadata.byName[normalizeSearchKey(currentAttribute)] : null;
	switch (state) {
		case 'expectAttribute':
			if (activeToken.type === 'word' && metadata.byName[normalizeSearchKey(activeToken.value)]) {
				return { state: 'expectOperator', currentAttribute: activeToken.value };
			}
			break;
		case 'expectOperator':
			if (
				(activeToken.type === 'operator' && ['=', '==', '!=', '>', '>=', '<', '<='].includes(activeToken.value)) ||
				(activeToken.type === 'word' && ['has', 'have'].includes(activeToken.value.toLowerCase()))
			) {
				return { state: 'expectValue', currentAttribute };
			}
			break;
		case 'expectValue':
			if (activeToken.type === '(') {
				return { state: 'expectValueListItem', currentAttribute, stack: [...stack, 'valueList'] };
			}
			if (
				attribute &&
				(
					(attribute.kind === 'number' && activeToken.type === 'number') ||
					(attribute.kind !== 'number' && ['word', 'string'].includes(activeToken.type))
				)
			) {
				return { state: 'expectLogicalOrEnd', currentAttribute };
			}
			break;
		case 'expectValueListItem':
			if (
				attribute &&
				(
					(attribute.kind === 'number' && activeToken.type === 'number') ||
					(attribute.kind !== 'number' && ['word', 'string'].includes(activeToken.type))
				)
			) {
				return { state: 'expectValueListDelimiter', currentAttribute };
			}
			break;
		case 'expectValueListDelimiter':
			if (activeToken.type === ',') {
				return { state: 'expectValueListItem', currentAttribute };
			}
			if (activeToken.type === ')' && stack[stack.length - 1] === 'valueList') {
				return { state: 'expectLogicalOrEnd', currentAttribute, stack: stack.slice(0, -1) };
			}
			break;
		case 'expectLogicalOrEnd':
			if (activeToken.type === 'word' && ['and', 'or'].includes(activeToken.value.toLowerCase())) {
				return { state: 'expectAttribute', currentAttribute: null };
			}
			if (activeToken.type === ')' && stack[stack.length - 1] === 'expression') {
				return { state: 'expectLogicalOrEnd', currentAttribute, stack: stack.slice(0, -1) };
			}
			break;
		default:
			break;
	}

	return null;
}

function getAdvancedSearchAutocompleteContext(input, cursorIndex) {
	const tokens = tokenizeAdvancedSearchPartial(input.slice(0, cursorIndex));
	let activeToken = null;
	if (tokens.length && tokens[tokens.length - 1].partial) {
		activeToken = tokens.pop();
	}

	let state = 'expectAttribute';
	let currentAttribute = null;
	const stack = [];

	for (const token of tokens) {
		switch (state) {
			case 'expectAttribute':
				if (token.type === '(') {
					stack.push('expression');
					break;
				}
				if (token.type === 'word') {
					currentAttribute = token.value;
					state = 'expectOperator';
					break;
				}
				if (token.type === ')' && stack[stack.length - 1] === 'expression') {
					stack.pop();
					state = 'expectLogicalOrEnd';
					break;
				}
				return null;
			case 'expectOperator':
				if (isAdvancedSearchOperatorToken(token)) {
					state = 'expectValue';
					break;
				}
				return null;
			case 'expectValue':
				if (token.type === '(') {
					stack.push('valueList');
					state = 'expectValueListItem';
					break;
				}
				if (isAdvancedSearchScalarToken(token)) {
					state = 'expectLogicalOrEnd';
					break;
				}
				return null;
			case 'expectValueListItem':
				if (isAdvancedSearchScalarToken(token)) {
					state = 'expectValueListDelimiter';
					break;
				}
				if (token.type === ')' && stack[stack.length - 1] === 'valueList') {
					stack.pop();
					state = 'expectLogicalOrEnd';
					break;
				}
				return null;
			case 'expectValueListDelimiter':
				if (token.type === ',') {
					state = 'expectValueListItem';
					break;
				}
				if (token.type === ')' && stack[stack.length - 1] === 'valueList') {
					stack.pop();
					state = 'expectLogicalOrEnd';
					break;
				}
				return null;
			case 'expectLogicalOrEnd':
				if (token.type === 'word' && ['and', 'or'].includes(token.value.toLowerCase())) {
					currentAttribute = null;
					state = 'expectAttribute';
					break;
				}
				if (token.type === ')' && stack[stack.length - 1] === 'expression') {
					stack.pop();
					state = 'expectLogicalOrEnd';
					break;
				}
				return null;
			default:
				return null;
		}
	}

	const metadata = buildAdvancedSearchAutocompleteMetadata();
	const finalized = tryFinalizeAdvancedSearchAutocompleteToken(state, activeToken, currentAttribute, stack, metadata);
	if (finalized) {
		state = finalized.state;
		currentAttribute = finalized.currentAttribute;
		activeToken = null;
		if (finalized.stack) {
			stack.splice(0, stack.length, ...finalized.stack);
		}
	}

	const rangeStart = activeToken ? activeToken.start : cursorIndex;
	const rangeEnd = activeToken ? activeToken.end : cursorIndex;
	const fragment = activeToken ? activeToken.value : '';
	const attributeName = currentAttribute ? normalizeSearchKey(currentAttribute) : null;

	return {
		state,
		stack,
		activeToken,
		fragment,
		rangeStart,
		rangeEnd,
		attribute: attributeName ? metadata.byName[attributeName] : null
	};
}

function scoreAdvancedSearchSuggestion(suggestion, fragment) {
	if (!fragment) {
		return 0;
	}

	const normalizedFragment = normalizeSearchKey(fragment);
	const normalizedLabel = normalizeSearchKey(suggestion.label);
	const rawFragment = String(fragment).trim().toLowerCase();
	const rawLabel = suggestion.label.toLowerCase();

	if (!normalizedFragment && rawFragment) {
		if (rawLabel === rawFragment) {
			return 0;
		}
		if (rawLabel.startsWith(rawFragment)) {
			return 1;
		}
		if (rawLabel.includes(rawFragment)) {
			return 2;
		}
		return 99;
	}

	if (normalizedLabel === normalizedFragment) {
		return 0;
	}
	if (normalizedLabel.startsWith(normalizedFragment)) {
		return 1;
	}
	if (normalizedLabel.includes(normalizedFragment)) {
		return 2;
	}
	return 99;
}

function filterAdvancedSearchSuggestions(suggestions, fragment) {
	const normalizedFragment = normalizeSearchKey(fragment);
	const rawFragment = String(fragment || '').trim().toLowerCase();
	let matches = suggestions;

	if (normalizedFragment) {
		matches = suggestions.filter(suggestion => normalizeSearchKey(suggestion.label).includes(normalizedFragment));
	}
	else if (rawFragment) {
		matches = suggestions.filter(suggestion => suggestion.label.toLowerCase().includes(rawFragment));
	}

	return matches
		.sort((left, right) => {
			const priorityDiff = (left.priority || 0) - (right.priority || 0);
			if (priorityDiff !== 0) {
				return priorityDiff;
			}
			const scoreDiff = scoreAdvancedSearchSuggestion(left, fragment) - scoreAdvancedSearchSuggestion(right, fragment);
			if (scoreDiff !== 0) {
				return scoreDiff;
			}
			return left.label.localeCompare(right.label);
		})
		.slice(0, 12);
}

function quoteAdvancedSearchValue(value) {
	return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`;
}

function buildAdvancedSearchValueSuggestions(attribute) {
	if (!attribute) {
		return [];
	}

	if (attribute.kind === 'number') {
		return attribute.samples.map(sample => ({
			label: String(sample),
			insertText: String(sample),
			meta: attribute.kind,
			category: 'value'
		}));
	}

	return attribute.values.map(value => ({
		label: value,
		insertText: quoteAdvancedSearchValue(value),
		meta: attribute.kind,
		category: 'value'
	}));
}

function getAdvancedSearchAutocompleteSuggestions(input, cursorIndex) {
	const plainNameContext = getPlainNameSearchAutocompleteContext(input, cursorIndex);
	if (plainNameContext) {
		const metadata = buildAdvancedSearchAutocompleteMetadata();
		return filterAdvancedSearchSuggestions(
			[
				...metadata.byName.name.values.map(name => ({
					label: name,
					insertText: name,
					meta: 'pokemon',
					category: 'pokemonNameSearch',
					priority: 0
				})),
				...metadata.attributes.map(attribute => ({
					label: attribute.name,
					insertText: attribute.name,
					meta: attribute.kind,
					category: 'attribute',
					priority: 1
				}))
			],
			plainNameContext.fragment
		);
	}

	const context = getAdvancedSearchAutocompleteContext(input, cursorIndex);
	if (!context || (context.activeToken && context.activeToken.type === 'unknown')) {
		return [];
	}

	const metadata = buildAdvancedSearchAutocompleteMetadata();
	switch (context.state) {
		case 'expectAttribute':
			return filterAdvancedSearchSuggestions(
				metadata.attributes.map(attribute => ({
					label: attribute.name,
					insertText: attribute.name,
					meta: attribute.kind,
					category: 'attribute'
				})),
				context.fragment
			);
		case 'expectOperator':
			if (!context.attribute) {
				return [];
			}
			return filterAdvancedSearchSuggestions(
				(context.attribute.kind === 'number'
					? ['=', '!=', '>', '>=', '<', '<=']
					: ['=', '!=', 'has']
				).map(operator => ({
					label: operator,
					insertText: operator,
					meta: 'operator',
					category: 'operator'
				})),
				context.fragment
			);
		case 'expectValue':
		case 'expectValueListItem':
			return filterAdvancedSearchSuggestions(buildAdvancedSearchValueSuggestions(context.attribute), context.fragment);
		case 'expectValueListDelimiter':
			return filterAdvancedSearchSuggestions([
				{ label: ',', insertText: ',', meta: 'separator', category: 'delimiter' },
				{ label: ')', insertText: ')', meta: 'close list', category: 'delimiter' }
			], context.fragment);
		case 'expectLogicalOrEnd': {
			const suggestions = [
				{ label: 'and', insertText: 'and', meta: 'logical', category: 'logical' },
				{ label: 'or', insertText: 'or', meta: 'logical', category: 'logical' }
			];
			if (context.stack.includes('expression')) {
				suggestions.push({ label: ')', insertText: ')', meta: 'close group', category: 'delimiter' });
			}
			return filterAdvancedSearchSuggestions(suggestions, context.fragment);
		}
		default:
			return [];
	}
}

function applyAdvancedSearchAutocompleteSuggestion(suggestion) {
	const input = document.getElementById('advancedSearchInput');
	if (!input || !suggestion) {
		return;
	}

	const cursorIndex = input.selectionStart ?? input.value.length;
	const plainNameContext = getPlainNameSearchAutocompleteContext(input.value, cursorIndex);
	if (plainNameContext && suggestion.category === 'pokemonNameSearch') {
		input.value =
			input.value.slice(0, plainNameContext.rangeStart) +
			suggestion.insertText +
			input.value.slice(plainNameContext.rangeEnd);
		input.focus();
		input.setSelectionRange(suggestion.insertText.length, suggestion.insertText.length);
		refreshAdvancedSearchAutocomplete();
		return;
	}

	const context = getAdvancedSearchAutocompleteContext(input.value, cursorIndex);
	if (!context) {
		return;
	}

	let replacement = suggestion.insertText;
	const previousChar = context.rangeStart > 0 ? input.value[context.rangeStart - 1] : '';

	if (
		['operator', 'logical', 'value'].includes(suggestion.category) &&
		previousChar &&
		!/\s|\(|,/.test(previousChar)
	) {
		replacement = ` ${replacement}`;
	}

	if (suggestion.category === 'operator' || suggestion.category === 'logical' || suggestion.insertText === ',') {
		replacement += ' ';
	}

	const nextChar = input.value[context.rangeEnd] || '';
	if (nextChar && /\S/.test(nextChar) && suggestion.insertText === ')') {
		replacement += ' ';
	}

	const newValue =
		input.value.slice(0, context.rangeStart) +
		replacement +
		input.value.slice(context.rangeEnd);
	const newCursor = context.rangeStart + replacement.length;

	input.value = newValue;
	input.focus();
	input.setSelectionRange(newCursor, newCursor);
	refreshAdvancedSearchAutocomplete();
}

function showAdvancedSearchGuide() {
	$('#advancedSearchGuideModal').modal('show');
}

function getAbilityDisplayNameById(abilityId, nameIndex = 0) {
	if (!abilities || !abilities[abilityId]) {
		return '';
	}

	if (abilityId === 73) {
		return 'As One (Grim Neigh + Unnerve)';
	}

	if (abilityId === 77) {
		return 'As One (Moxie + Unnerve)';
	}

	return abilities[abilityId].names[nameIndex] || abilities[abilityId].names[0];
}

function getAbilityDescriptionById(abilityId) {
	if (!abilities || !abilities[abilityId]) {
		return '';
	}

	return abilities[abilityId].description;
}

function getFilteredSpeciesResults() {
	let results = Object.values(species);
	for (const activeFilter of Object.values(filters).reduce((list, filter) => list.concat(filter.active), [])) {
		results = results.filter(activeFilter.func);
	}

	if (advancedSearchPredicate) {
		results = results.filter(mon => advancedSearchPredicate(mon));
	}

	return results;
}

function refreshSpeciesResults() {
	populateTable('speciesTable', getFilteredSpeciesResults());
	updateAdvancedSearchStatus();
}

function updateAdvancedSearchStatus(message = null, isError = false) {
	const status = document.getElementById('advancedSearchStatus');
	if (!status) {
		return;
	}

	if (message !== null) {
		status.textContent = message;
		status.className = isError ? 'error' : 'success';
		return;
	}

	if (!advancedSearchPredicate) {
		status.textContent = '';
		status.className = '';
		return;
	}

	status.textContent = `${getFilteredSpeciesResults().length} Pokemon match the advanced search.`;
	status.className = 'success';
}

function runAdvancedSearch() {
	const input = document.getElementById('advancedSearchInput');
	if (!input) {
		return;
	}

	const query = input.value.trim();
	if (!query) {
		clearAdvancedSearch();
		return;
	}

	try {
		const ast = parseAdvancedSearchWithFallback(query);
		const predicate = mon => evaluateAdvancedSearch(ast, mon);
		predicate(Object.values(species)[0]);
		advancedSearchPredicate = predicate;
		advancedSearchQuery = query;
		hideAdvancedSearchAutocomplete();
		refreshSpeciesResults();
	}
	catch (error) {
		updateAdvancedSearchStatus(error.message, true);
	}
}

function clearAdvancedSearch() {
	const input = document.getElementById('advancedSearchInput');
	if (input) {
		input.value = '';
	}

	advancedSearchPredicate = null;
	advancedSearchQuery = '';
	hideAdvancedSearchAutocomplete();
	refreshSpeciesResults();
}

function normalizeSearchText(value) {
	return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeSearchKey(value) {
	return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function uniqStrings(values) {
	return Array.from(new Set(values.filter(Boolean)));
}

function getSpeciesAbilityPackage(mon, hardcoreMode = false) {
	const cache = hardcoreMode ? abilityPackageCache.hardcore : abilityPackageCache.base;
	if (cache.has(mon.ID)) {
		return cache.get(mon.ID);
	}

	const state = buildHardcoreState();
	const slots = [
		{ key: 'hidden', label: 'Hidden', value: mon.abilities[0] },
		{ key: 'primary', label: 'Primary', value: mon.abilities[1] },
		{ key: 'secondary', label: 'Secondary', value: mon.abilities[2] }
	];

	const details = [];
	for (const slot of slots) {
		if (!slot.value || slot.value[0] === 0) {
			continue;
		}

		const originalId = slot.value[0];
		const originalAlt = slot.value[1];
		const mappedAbility = getMappedAbility(slot.value, mon.ID);
		const mappedId = mappedAbility[0];
		let finalId = mappedId;
		if (hardcoreMode) {
			const speciesOverride = state.specialAbilityReplacements.get(mon.ID);
			if (speciesOverride && speciesOverride.has(mappedId)) {
				finalId = speciesOverride.get(mappedId);
			}
			else if (state.abilityReplacements.has(mappedId)) {
				finalId = state.abilityReplacements.get(mappedId);
			}
		}

		details.push({
			slot: slot.label,
			slotKey: slot.key,
			id: finalId,
			name: getAbilityDisplayNameById(finalId),
			description: getAbilityDescriptionById(finalId),
			mappedId,
			mappedName: getAbilityDisplayNameById(mappedId),
			mappedDescription: getAbilityDescriptionById(mappedId),
			originalId,
			originalName: getAbilityDisplayNameById(originalId, originalAlt),
			originalDescription: getAbilityDescriptionById(originalId),
			changedForRandomizer: mappedId !== originalId,
			changedForHardcore: hardcoreMode && finalId !== mappedId
		});
	}

	cache.set(mon.ID, details);
	return details;
}

function buildMoveDetail(moveId, source, level = null) {
	const move = moves[moveId];
	if (!move) {
		return null;
	}

	return {
		id: move.ID,
		name: move.name,
		type: types[move.type].name,
		category: splits[move.split],
		power: move.power,
		accuracy: move.accuracy,
		pp: move.pp,
		priority: move.priority,
		target: move.target,
		secondaryEffectChance: move.secondaryEffectChance,
		description: move.description,
		source,
		level
	};
}

function buildSpeciesPanelMoveEntry(mon, moveId, level = null, raw = false) {
	const resolvedMoveId = raw ? moveId : getMappedMove(moveId, mon.ID);
	const move = moves[resolvedMoveId];
	if (!move) {
		return undefined;
	}

	return {
		...move,
		level,
		hardcoreUnavailable: !isHardcoreMoveLegal(mon, move.ID)
	};
}

function isHardcoreMoveLegal(mon, moveId) {
	const state = buildHardcoreState();
	if (state.bannedMoveIds.has(moveId)) {
		return false;
	}

	if (!state.restrictedMoveIds.has(moveId)) {
		return true;
	}

	return state.restrictedSpeciesIds.has(mon.ID);
}

function getSpeciesMovePackage(mon, hardcoreMode = false) {
	const cache = hardcoreMode ? movePackageCache.hardcore : movePackageCache.base;
	if (cache.has(mon.ID)) {
		return cache.get(mon.ID);
	}

	const bySource = {
		levelUp: [],
		tmhm: [],
		tutor: [],
		egg: [],
		event: [],
		preEvolution: []
	};
	const all = [];
	const summary = [];
	const byId = new Map();

	const pushMove = function(moveId, source, level = null) {
		const mappedMoveId = getMappedMove(moveId, mon.ID);
		if (mappedMoveId === undefined || !moves[mappedMoveId]) {
			return;
		}

		if (hardcoreMode && !isHardcoreMoveLegal(mon, mappedMoveId)) {
			return;
		}

		const detail = buildMoveDetail(mappedMoveId, source, level);
		if (!detail) {
			return;
		}
		bySource[source].push(detail);
		if (!byId.has(mappedMoveId)) {
			byId.set(mappedMoveId, detail);
			all.push(detail);
			summary.push({ name: detail.name, type: detail.type });
		}
	};

	for (const [moveId, level] of mon.levelupMoves || []) {
		pushMove(moveId, 'levelUp', level);
	}

	for (const tmIndex of mon.tmMoves || []) {
		pushMove(tmMoves[tmIndex], 'tmhm');
	}

	for (const tutorIndex of mon.tutorMoves || []) {
		pushMove(tutorMoves[tutorIndex], 'tutor');
	}

	for (const moveId of mon.eggMoves || []) {
		pushMove(moveId, 'egg');
	}

	for (const moveId of mon.eventMoves || []) {
		pushMove(moveId, 'event');
	}

	for (const moveId of mon.prevoMoves || []) {
		pushMove(moveId, 'preEvolution');
	}

	const payload = {
		bySource,
		all,
		summary
	};
	cache.set(mon.ID, payload);
	return payload;
}

function getSpeciesHardcoreMoveAdjustments(mon) {
	const baseMoves = getSpeciesMovePackage(mon, false).all;
	const hardcoreMoves = new Set(getSpeciesMovePackage(mon, true).all.map(move => move.id));
	const state = buildHardcoreState();
	const removed = [];

	for (const move of baseMoves) {
		if (hardcoreMoves.has(move.id)) {
			continue;
		}

		let reason = 'Globally banned in Hardcore.';
		if (state.restrictedMoveIds.has(move.id)) {
			reason = 'Restricted in Hardcore to the documented less-viable species list.';
		}

		removed.push({
			name: move.name,
			type: move.type,
			reason
		});
	}

	return removed;
}

function getSpeciesEvolutionEntries(mon) {
	return (mon.evolutions || []).map(evo => ({
		to: species[evo[2]]?.key,
		method: describeEvolutionMethod(evo)
	}));
}

function getSpeciesPreEvolution(mon) {
	const parent = Object.values(species).find(candidate =>
		(candidate.evolutions || []).some(evolution => evolution[2] === mon.ID)
	);

	if (!parent) {
		return null;
	}

	const evolution = parent.evolutions.find(entry => entry[2] === mon.ID);
	return {
		from: parent.key,
		method: describeEvolutionMethod(evolution)
	};
}

function getSpeciesFamily(mon) {
	return Object.values(species)
		.filter(candidate => candidate.ancestor === mon.ancestor)
		.sort(cmp(x => x.dexID));
}

function describeEvolutionMethod(evolution) {
	const evo = evolution;
	return eval(evolutions[evo[0]]);
}

function buildSpeciesSearchRecord(mon) {
	if (speciesSearchCache.has(mon.ID)) {
		return speciesSearchCache.get(mon.ID);
	}

	const baseAbilities = getSpeciesAbilityPackage(mon, false);
	const hardcoreAbilities = getSpeciesAbilityPackage(mon, true);
	const baseMoves = getSpeciesMovePackage(mon, false);
	const hardcoreMoves = getSpeciesMovePackage(mon, true);
	const family = getSpeciesFamily(mon).map(relative => relative.key);
	const record = {
		name: mon.key,
		numbers: {
			hp: mon.stats[0],
			atk: mon.stats[1],
			def: mon.stats[2],
			spe: mon.stats[3],
			speed: mon.stats[3],
			spa: mon.stats[4],
			spatk: mon.stats[4],
			spd: mon.stats[5],
			spdef: mon.stats[5],
			bst: mon.stats.reduce((total, stat) => total + stat, 0),
			dex: mon.dexID,
			dexid: mon.dexID
		},
		lists: {
			type: mon.type.map(typeId => types[typeId].name),
			types: mon.type.map(typeId => types[typeId].name),
			ability: uniqStrings(baseAbilities.map(ability => ability.name)),
			abilities: uniqStrings(baseAbilities.map(ability => ability.name)),
			hardcoreability: uniqStrings(hardcoreAbilities.map(ability => ability.name)),
			hardcoreabilities: uniqStrings(hardcoreAbilities.map(ability => ability.name)),
			move: baseMoves.all.map(move => move.name),
			moves: baseMoves.all.map(move => move.name),
			moveset: baseMoves.all.map(move => move.name),
			hardcoremove: hardcoreMoves.all.map(move => move.name),
			hardcoremoves: hardcoreMoves.all.map(move => move.name),
			hardcoremoveset: hardcoreMoves.all.map(move => move.name),
			evolution: family,
			evolutions: family,
			item: (mon.items || []).filter(Boolean).map(itemId => items[itemId].name),
			items: (mon.items || []).filter(Boolean).map(itemId => items[itemId].name),
			egggroup: (mon.eggGroup || []).filter(Boolean).map(groupId => eggGroups[groupId]),
			egggroups: (mon.eggGroup || []).filter(Boolean).map(groupId => eggGroups[groupId])
		}
	};

	speciesSearchCache.set(mon.ID, record);
	return record;
}

function tokenizeAdvancedSearch(input) {
	input = normalizeAdvancedSearchInput(input);
	const tokens = [];
	let index = 0;

	while (index < input.length) {
		const current = input[index];
		if (/\s/.test(current)) {
			index++;
			continue;
		}

		const twoChar = input.slice(index, index + 2);
		if (['>=', '<=', '!=', '=='].includes(twoChar)) {
			tokens.push({ type: 'operator', value: twoChar });
			index += 2;
			continue;
		}

		if (['(', ')', ','].includes(current)) {
			tokens.push({ type: current, value: current });
			index++;
			continue;
		}

		if (['>', '<', '='].includes(current)) {
			tokens.push({ type: 'operator', value: current });
			index++;
			continue;
		}

		if (current === '"' || current === '\'') {
			const quote = current;
			let value = '';
			index++;
			while (index < input.length && input[index] !== quote) {
				if (input[index] === '\\' && index + 1 < input.length) {
					value += input[index + 1];
					index += 2;
					continue;
				}
				value += input[index];
				index++;
			}
			if (input[index] !== quote) {
				throw new Error('Unterminated string literal in advanced search.');
			}
			index++;
			tokens.push({ type: 'string', value });
			continue;
		}

		if (/[0-9]/.test(current)) {
			let value = current;
			index++;
			while (index < input.length && /[0-9.]/.test(input[index])) {
				value += input[index];
				index++;
			}
			tokens.push({ type: 'number', value });
			continue;
		}

		if (/[A-Za-z_]/.test(current)) {
			let value = current;
			index++;
			while (index < input.length && /[A-Za-z0-9_.-]/.test(input[index])) {
				value += input[index];
				index++;
			}
			tokens.push({ type: 'word', value });
			continue;
		}

		throw new Error(`Unexpected character "${current}" in advanced search.`);
	}

	return tokens;
}

function parseAdvancedSearch(input) {
	const tokens = tokenizeAdvancedSearch(input);
	let index = 0;

	const peek = () => tokens[index];
	const consume = () => tokens[index++];
	const matchWord = word => peek() && peek().type === 'word' && peek().value.toLowerCase() === word;
	const matchType = type => peek() && peek().type === type;

	const parseExpression = () => parseOrExpression();

	const parseOrExpression = () => {
		let expression = parseAndExpression();
		while (matchWord('or')) {
			consume();
			expression = {
				type: 'logical',
				operator: 'or',
				left: expression,
				right: parseAndExpression()
			};
		}
		return expression;
	};

	const parseAndExpression = () => {
		let expression = parsePrimary();
		while (matchWord('and')) {
			consume();
			expression = {
				type: 'logical',
				operator: 'and',
				left: expression,
				right: parsePrimary()
			};
		}
		return expression;
	};

	const parsePrimary = () => {
		if (matchType('(')) {
			consume();
			const expression = parseExpression();
			if (!matchType(')')) {
				throw new Error('Missing closing ")" in advanced search.');
			}
			consume();
			return expression;
		}

		return parseComparison();
	};

	const parseComparison = () => {
		const attributeToken = consume();
		if (!attributeToken || attributeToken.type !== 'word') {
			throw new Error('Expected an attribute name in advanced search.');
		}

		const operatorToken = consume();
		if (!operatorToken) {
			throw new Error(`Missing operator after "${attributeToken.value}".`);
		}

		let operator = operatorToken.value.toLowerCase();
		if (operatorToken.type !== 'operator' && !['has', 'have'].includes(operator)) {
			throw new Error(`Unsupported operator "${operatorToken.value}".`);
		}

		if (operator === 'have') {
			operator = 'has';
		}

		return {
			type: 'comparison',
			attribute: attributeToken.value,
			operator,
			value: parseValue()
		};
	};

	const parseValue = () => {
		if (!peek()) {
			throw new Error('Missing value in advanced search.');
		}

		if (matchType('(')) {
			consume();
			const values = [];
			while (!matchType(')')) {
				values.push(parseScalar(true));
				if (matchType(',')) {
					consume();
					continue;
				}
				if (!matchType(')')) {
					throw new Error('Expected "," or ")" in value list.');
				}
			}
			consume();
			return values;
		}

		return parseScalar(false);
	};

	const parseScalar = stopAtComma => {
		const token = peek();
		if (!token) {
			throw new Error('Missing value in advanced search.');
		}

		if (token.type === 'string') {
			return consume().value;
		}

		if (token.type === 'number') {
			return Number(consume().value);
		}

		if (token.type !== 'word') {
			throw new Error(`Unexpected token "${token.value}" in advanced search value.`);
		}

		const words = [];
		while (peek() && peek().type === 'word') {
			const lower = peek().value.toLowerCase();
			if (lower === 'and' || lower === 'or') {
				break;
			}
			words.push(consume().value);
		}

		if (!stopAtComma) {
			return words.join(' ');
		}

		return words.join(' ');
	};

	const ast = parseExpression();
	if (index < tokens.length) {
		throw new Error(`Unexpected token "${tokens[index].value}" in advanced search.`);
	}
	return ast;
}

function evaluateAdvancedSearch(ast, mon) {
	if (ast.type === 'logical') {
		if (ast.operator === 'and') {
			return evaluateAdvancedSearch(ast.left, mon) && evaluateAdvancedSearch(ast.right, mon);
		}
		return evaluateAdvancedSearch(ast.left, mon) || evaluateAdvancedSearch(ast.right, mon);
	}

	const record = buildSpeciesSearchRecord(mon);
	const attribute = normalizeSearchKey(ast.attribute);
	const numberValue = record.numbers[attribute];
	if (numberValue !== undefined) {
		return evaluateNumberComparison(numberValue, ast.operator, ast.value, ast.attribute);
	}

	if (attribute === 'name' || attribute === 'pokemon' || attribute === 'species') {
		return evaluateStringComparison(record.name, ast.operator, ast.value, ast.attribute);
	}

	const listValue = record.lists[attribute];
	if (listValue !== undefined) {
		return evaluateListComparison(listValue, ast.operator, ast.value);
	}

	throw new Error(`Unknown attribute "${ast.attribute}" in advanced search.`);
}

function evaluateNumberComparison(actual, operator, expected, attribute) {
	if (typeof expected !== 'number') {
		throw new Error(`Attribute "${attribute}" only supports numeric comparisons.`);
	}

	switch (operator) {
		case '=':
		case '==':
			return actual === expected;
		case '!=':
			return actual !== expected;
		case '>':
			return actual > expected;
		case '>=':
			return actual >= expected;
		case '<':
			return actual < expected;
		case '<=':
			return actual <= expected;
		default:
			throw new Error(`Operator "${operator}" is not valid for numbers.`);
	}
}

function evaluateStringComparison(actual, operator, expected, attribute) {
	if (Array.isArray(expected) || typeof expected === 'number') {
		throw new Error(`Attribute "${attribute}" only supports string comparisons.`);
	}

	const actualValue = normalizeSearchText(actual);
	const expectedValue = normalizeSearchText(expected);

	switch (operator) {
		case '=':
		case '==':
			return actualValue === expectedValue;
		case '!=':
			return actualValue !== expectedValue;
		case 'has':
			return actualValue.includes(expectedValue);
		default:
			throw new Error(`Operator "${operator}" is not valid for strings.`);
	}
}

function evaluateListComparison(actualList, operator, expected) {
	const normalizedActual = actualList.map(normalizeSearchText);
	const expectedValues = Array.isArray(expected) ? expected : [expected];
	const normalizedExpected = expectedValues.map(value => normalizeSearchText(value));

	switch (operator) {
		case '=':
		case '==':
		case 'has':
			return normalizedExpected.every(value => normalizedActual.includes(value));
		case '!=':
			return normalizedExpected.every(value => !normalizedActual.includes(value));
		default:
			throw new Error(`Operator "${operator}" is not valid for list comparisons.`);
	}
}

function buildPokemonExport(mon) {
	const baseAbilities = getSpeciesAbilityPackage(mon, false);
	const hardcoreAbilities = getSpeciesAbilityPackage(mon, true);
	const baseMoves = getSpeciesMovePackage(mon, false);
	const hardcoreMoves = getSpeciesMovePackage(mon, true);
	const family = getSpeciesFamily(mon).map(relative => relative.key);

	return {
		id: mon.ID,
		dexId: mon.dexID,
		name: mon.key,
		baseName: mon.name,
		types: mon.type.map(typeId => types[typeId].name),
		stats: {
			hp: mon.stats[0],
			atk: mon.stats[1],
			def: mon.stats[2],
			spe: mon.stats[3],
			spa: mon.stats[4],
			spd: mon.stats[5],
			bst: mon.stats.reduce((total, stat) => total + stat, 0)
		},
		abilities: baseAbilities,
		heldItems: (mon.items || []).filter(Boolean).map(itemId => ({
			id: itemId,
			name: items[itemId].name,
			description: items[itemId].description
		})),
		eggGroups: (mon.eggGroup || []).filter(Boolean).map(groupId => eggGroups[groupId]),
		evolution: {
			preEvolution: getSpeciesPreEvolution(mon),
			nextEvolutions: getSpeciesEvolutionEntries(mon),
			family
		},
		changes: mon.changes || null,
		movesetSummary: baseMoves.summary,
		movesetDetailed: baseMoves.all,
		learnsets: baseMoves.bySource,
		hardcore: {
			abilities: hardcoreAbilities,
			removedMoves: getSpeciesHardcoreMoveAdjustments(mon),
			movesetSummary: hardcoreMoves.summary,
			movesetDetailed: hardcoreMoves.all,
			learnsets: hardcoreMoves.bySource
		}
	};
}

function exportPokemonData() {
	const payload = {
		meta: {
			repo,
			version,
			exportedAt: new Date().toISOString(),
			advancedSearchQuery,
			hardcoreRules: {
				globallyBannedMoves: HARDCORE_BANNED_MOVES,
				restrictedMoves: HARDCORE_RESTRICTED_MOVES,
				restrictedSpeciesCount: HARDCORE_RESTRICTED_SPECIES_IDS.length,
				abilityReplacements: HARDCORE_ABILITY_REPLACEMENTS
			}
		},
		pokemon: Object.values(species).map(buildPokemonExport)
	};

	const storedSaveData = getStoredExportSaveData();
	const saveName = sanitizeExportFileName(storedSaveData?.name);
	const fileName = saveName ? `rr-dex-export-${saveName}.json` : 'rr-dex-export.json';
	const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.href = url;
	link.download = fileName;
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	setTimeout(() => {
		URL.revokeObjectURL(url);
		link.remove();
	}, 60000);
}

function getStoredExportSaveData() {
	if (saveData?.name) {
		return saveData;
	}

	try {
		const raw = localStorage.getItem('saveData');
		if (!raw) {
			return null;
		}
		return JSON.parse(raw);
	}
	catch {
		return null;
	}
}

function sanitizeExportFileName(name) {
	if (!name) {
		return '';
	}

	return String(name)
		.trim()
		.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}
