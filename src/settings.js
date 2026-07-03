let appearanceSettingsHideTimer = null;
let appearanceSettingsVisibilityTimer = null;
let advancedSearchShortcutsHideTimer = null;
let advancedSearchShortcutsVisibilityTimer = null;
const ADVANCED_SEARCH_SHORTCUTS_STORAGE_KEY = 'advancedSearchShortcuts';
const ADVANCED_SEARCH_SUGGESTIONS = [
	{
		title: 'Sweeper',
		query: "((ability ~ ('huge','intrepid') and atk >= 95 and spe >= 90) or (ability = 'feline prowess' and spa >= 95 and spe >= 90)) and bst >= 520"
	},
	{
		title: 'Trade Pokemon',
		query: "name ~ ('snom','carbink','Pikipek','Florges','Furret','Murkrow','Dedenne','Aegislash','Ursaluna')"
	},
	{
		title: 'Traded Pokemon',
		query: "originalpokemon ~ ('Carnivine','Eiscue','Farfetch','Chatot','Morpeko','Mimikyu','Chillet','Aegislash','Ursaluna')"
	}
];
let advancedSearchShortcuts = [];
let advancedSearchShortcutImportInput = null;

// Bootstraps the split feature set and reapplies persisted UI/search state.
function setupAdvancedFeatures() {
	buildHardcoreState();
	loadAppearanceSettings();
	loadAdvancedSearchHistory();
	loadAdvancedSearchShortcuts();
	setupAdvancedSearch();
	setupAdvancedSearchShortcutsMenu();
	setupAppearanceSettingsMenu();
	applyAppearanceSettings();
	updateIntegratedSearchControls();
}

// Normalizes one saved quick-search entry into a safe title/query pair.
function normalizeAdvancedSearchShortcut(shortcut, index = 0) {
	if (!shortcut || typeof shortcut !== 'object') {
		return null;
	}

	const title = String(shortcut.title || '').trim();
	const query = String(shortcut.query || '').trim();
	if (!query) {
		return null;
	}

	return {
		title: title || `Quick Search ${index + 1}`,
		query
	};
}

// Loads user-defined quick-search buttons from localStorage.
function loadAdvancedSearchShortcuts() {
	try {
		const raw = localStorage.getItem(ADVANCED_SEARCH_SHORTCUTS_STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		const shortcutList = Array.isArray(parsed)
			? parsed
			: Array.isArray(parsed?.quickSearches)
				? parsed.quickSearches
				: [];
		advancedSearchShortcuts = shortcutList
			.map((shortcut, index) => normalizeAdvancedSearchShortcut(shortcut, index))
			.filter(Boolean);
	}
	catch {
		advancedSearchShortcuts = [];
	}
}

// Persists the current quick-search button list independently from uploaded save data.
function saveAdvancedSearchShortcuts() {
	try {
		localStorage.setItem(
			ADVANCED_SEARCH_SHORTCUTS_STORAGE_KEY,
			JSON.stringify(advancedSearchShortcuts)
		);
	}
	catch {}
}

// Loads persisted appearance preferences into the shared runtime settings object.
function loadAppearanceSettings() {
	const storedSettings = readAppearanceSettingsFromStorage();
	const advancedSearchSuggestionsEnabled =
		Object.prototype.hasOwnProperty.call(storedSettings, 'advancedSearchSuggestionsEnabled')
			? storedSettings.advancedSearchSuggestionsEnabled !== false
			: storedSettings.disableValueSuggestions !== true;
	appearanceSettings = {
		currentTeamVisible: storedSettings.currentTeamVisible !== false,
		gameProgressionVisible: storedSettings.gameProgressionVisible === true,
		locationBaseOrder: storedSettings.locationBaseOrder === true,
		allowTextSelection: storedSettings.allowTextSelection === true,
		hardcoreChangesVisible: storedSettings.hardcoreChangesVisible !== false,
		pokemonOffensiveVisible: storedSettings.pokemonOffensiveVisible !== false,
		patchedAbilityExperimental: storedSettings.patchedAbilityExperimental === true,
		advancedSearchSuggestionsEnabled,
		availableOnly: storedSettings.availableOnly === true
	};
	appearanceSettingsLoaded = true;
}

// Writes the current appearance settings back to localStorage.
function persistAppearanceSettings() {
	writeAppearanceSettingsToStorage(appearanceSettings);
}

// Returns whether grouped location ordering is enabled in the UI.
function isLocationBaseOrderEnabled() {
	return appearanceSettings.locationBaseOrder === true;
}

// Returns whether the current team panel should be shown.
function isCurrentTeamVisibleEnabled() {
	return appearanceSettings.currentTeamVisible !== false;
}

// Returns whether the short save progression summary should be shown below the current save line.
function isGameProgressionVisibleEnabled() {
	return appearanceSettings.gameProgressionVisible === true;
}

// Returns whether copy/select protection is disabled for the page.
function isTextSelectionEnabled() {
	return appearanceSettings.allowTextSelection === true;
}

// Returns whether the modal should show Hardcore-specific ability and original-species details.
function isHardcoreChangesVisibleEnabled() {
	return appearanceSettings.hardcoreChangesVisible !== false;
}

// Returns whether the species modal should show the offensive type-coverage row.
function isPokemonOffensiveVisibleEnabled() {
	return appearanceSettings.pokemonOffensiveVisible !== false;
}

// Returns whether random abilities should use the patched collision-free mapper.
function isPatchedAbilityExperimentalEnabled() {
	return appearanceSettings.patchedAbilityExperimental === true;
}

// Returns whether advanced search autocomplete should run at all.
function areAdvancedSearchSuggestionsEnabled() {
	return appearanceSettings.advancedSearchSuggestionsEnabled !== false;
}

// Returns whether species lists should always be filtered to obtainable Pokemon.
function isAvailableOnlyEnabled() {
	return appearanceSettings.availableOnly === true;
}

// Updates the current team visibility setting and rerenders the save panel if needed.
function setCurrentTeamVisibility(enabled, persist = true) {
	appearanceSettings.currentTeamVisible = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	if (typeof renderCurrentSavePokemon === 'function') {
		renderCurrentSavePokemon();
	}
	updateAppearanceSettingsControls();
}

// Toggles the short save progression line and refreshes it immediately when a save is loaded.
function setGameProgressionVisible(enabled, persist = true) {
	appearanceSettings.gameProgressionVisible = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	if (typeof renderCurrentSaveProgression === 'function') {
		renderCurrentSaveProgression();
	}
	updateAppearanceSettingsControls();
}

// Toggles location-based ordering and refreshes the species list immediately.
function setLocationBaseOrderEnabled(enabled, persist = true) {
	appearanceSettings.locationBaseOrder = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	updateAppearanceSettingsControls();
	refreshSpeciesResults();
}

// Toggles text selection behavior and reapplies the body class.
function setTextSelectionEnabled(enabled, persist = true) {
	appearanceSettings.allowTextSelection = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	applyTextSelectionSetting();
	updateAppearanceSettingsControls();
}

// Toggles the extra Hardcore/original-species detail blocks in the Pokemon modal.
function setHardcoreChangesVisible(enabled, persist = true) {
	appearanceSettings.hardcoreChangesVisible = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	updateAppearanceSettingsControls();
	if (typeof rerenderCurrentSpeciesPanel === 'function') {
		rerenderCurrentSpeciesPanel();
	}
}

// Toggles the offensive type-coverage block in the open Pokemon modal and future modal renders.
function setPokemonOffensiveVisible(enabled, persist = true) {
	appearanceSettings.pokemonOffensiveVisible = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	updateAppearanceSettingsControls();
	if (typeof rerenderCurrentSpeciesPanel === 'function') {
		rerenderCurrentSpeciesPanel();
	}
}

// Rebuilds cached ability/search data after toggling the experimental patched mapper.
function setPatchedAbilityExperimentalEnabled(enabled, persist = true) {
	appearanceSettings.patchedAbilityExperimental = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	if (typeof resetAdvancedFeatureCaches === 'function') {
		resetAdvancedFeatureCaches();
	}
	updateAppearanceSettingsControls();
	if (typeof refreshSpeciesResults === 'function') {
		refreshSpeciesResults();
	}
	if (typeof rerenderCurrentSpeciesPanel === 'function') {
		rerenderCurrentSpeciesPanel();
	}
}

// Enables or disables the advanced-search autocomplete pipeline entirely.
function setAdvancedSearchSuggestionsEnabled(enabled, persist = true) {
	appearanceSettings.advancedSearchSuggestionsEnabled = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	updateAppearanceSettingsControls();
	if (!enabled && typeof clearAdvancedSearchAutocompleteRuntime === 'function') {
		clearAdvancedSearchAutocompleteRuntime(true);
		return;
	}
	if (enabled && typeof refreshAdvancedSearchAutocomplete === 'function') {
		refreshAdvancedSearchAutocomplete();
	}
}

// Forces the species list to only show obtainable Pokemon in both search modes.
function setAvailableOnlyEnabled(enabled, persist = true) {
	appearanceSettings.availableOnly = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	updateAppearanceSettingsControls();
	refreshSpeciesResults();
}

// Applies all persisted appearance settings to the live page state.
function applyAppearanceSettings() {
	applyTextSelectionSetting();
	if (typeof renderCurrentSaveProgression === 'function') {
		renderCurrentSaveProgression();
	}
	if (typeof renderCurrentSavePokemon === 'function') {
		renderCurrentSavePokemon();
	}
	updateAppearanceSettingsControls();
	updateIntegratedSearchControls();
	refreshSpeciesResults();
}

// Adds or removes the body class that allows text highlighting and copying.
function applyTextSelectionSetting() {
	document.body.classList.toggle('allowTextSelection', isTextSelectionEnabled());
}

// Syncs the settings popup controls with the current runtime state.
function updateAppearanceSettingsControls() {
	const currentTeamToggle = document.getElementById('appearanceCurrentTeamToggle');
	const gameProgressionToggle = document.getElementById('appearanceGameProgressionToggle');
	const advancedSearchSuggestionsOption = document.getElementById('appearanceAdvancedSearchSuggestionsOption');
	const advancedSearchSuggestionsToggle = document.getElementById('appearanceAdvancedSearchSuggestionsToggle');
	const patchedAbilityToggle = document.getElementById('appearancePatchedAbilityToggle');
	const availableOnlyToggle = document.getElementById('appearanceAvailableOnlyToggle');
	const locationBaseOrderToggle = document.getElementById('appearanceLocationBaseOrderToggle');
	const allowTextSelectionToggle = document.getElementById('appearanceAllowTextSelectionToggle');
	const hardcoreChangesToggle = document.getElementById('appearanceHardcoreChangesToggle');
	const pokemonOffensiveToggle = document.getElementById('appearancePokemonOffensiveToggle');

	if (currentTeamToggle) {
		currentTeamToggle.checked = isCurrentTeamVisibleEnabled();
	}
	if (gameProgressionToggle) {
		gameProgressionToggle.checked = isGameProgressionVisibleEnabled();
	}
	if (advancedSearchSuggestionsOption) {
		advancedSearchSuggestionsOption.classList.remove('hide');
	}
	if (advancedSearchSuggestionsToggle) {
		advancedSearchSuggestionsToggle.checked = areAdvancedSearchSuggestionsEnabled();
		advancedSearchSuggestionsToggle.disabled = false;
	}
	if (patchedAbilityToggle) {
		patchedAbilityToggle.checked = isPatchedAbilityExperimentalEnabled();
	}
	if (availableOnlyToggle) {
		availableOnlyToggle.checked = isAvailableOnlyEnabled();
	}
	if (locationBaseOrderToggle) {
		locationBaseOrderToggle.checked = isLocationBaseOrderEnabled();
	}
	if (allowTextSelectionToggle) {
		allowTextSelectionToggle.checked = isTextSelectionEnabled();
	}
	if (hardcoreChangesToggle) {
		hardcoreChangesToggle.checked = isHardcoreChangesVisibleEnabled();
	}
	if (pokemonOffensiveToggle) {
		pokemonOffensiveToggle.checked = isPokemonOffensiveVisibleEnabled();
	}
}

// Wires the settings popup behavior, fade timing, and control event handlers.
function setupAppearanceSettingsMenu() {
	const wrapper = document.getElementById('appearanceSettingsWrapper');
	const button = document.getElementById('appearanceSettingsButton');
	const menu = document.getElementById('appearanceSettingsMenu');
	const currentTeamToggle = document.getElementById('appearanceCurrentTeamToggle');
	const gameProgressionToggle = document.getElementById('appearanceGameProgressionToggle');
	const advancedSearchSuggestionsToggle = document.getElementById('appearanceAdvancedSearchSuggestionsToggle');
	const patchedAbilityToggle = document.getElementById('appearancePatchedAbilityToggle');
	const availableOnlyToggle = document.getElementById('appearanceAvailableOnlyToggle');
	const locationBaseOrderToggle = document.getElementById('appearanceLocationBaseOrderToggle');
	const allowTextSelectionToggle = document.getElementById('appearanceAllowTextSelectionToggle');
	const hardcoreChangesToggle = document.getElementById('appearanceHardcoreChangesToggle');
	const pokemonOffensiveToggle = document.getElementById('appearancePokemonOffensiveToggle');
	if (!wrapper || !button || !menu) {
		return;
	}

	const showMenu = function() {
		if (appearanceSettingsHideTimer) {
			clearTimeout(appearanceSettingsHideTimer);
			appearanceSettingsHideTimer = null;
		}
		if (appearanceSettingsVisibilityTimer) {
			clearTimeout(appearanceSettingsVisibilityTimer);
			appearanceSettingsVisibilityTimer = null;
		}

		updateAppearanceSettingsControls();
		if (menu.classList.contains('hide')) {
			menu.classList.remove('hide');
			menu.classList.remove('visible');
			requestAnimationFrame(function() {
				menu.classList.add('visible');
			});
		} else {
			menu.classList.add('visible');
		}
		button.setAttribute('aria-expanded', 'true');
	};

	const hideMenu = function() {
		menu.classList.remove('visible');
		button.setAttribute('aria-expanded', 'false');
		if (appearanceSettingsVisibilityTimer) {
			clearTimeout(appearanceSettingsVisibilityTimer);
		}
		appearanceSettingsVisibilityTimer = setTimeout(function() {
			appearanceSettingsVisibilityTimer = null;
			if (!menu.classList.contains('visible')) {
				menu.classList.add('hide');
			}
		}, 120);
	};

	const scheduleHideMenu = function() {
		if (appearanceSettingsHideTimer) {
			clearTimeout(appearanceSettingsHideTimer);
		}
		appearanceSettingsHideTimer = setTimeout(function() {
			appearanceSettingsHideTimer = null;
			if (wrapper.contains(document.activeElement)) {
				return;
			}
			hideMenu();
		}, 1000);
	};

	const scheduleHideMenuFromMouseLeave = function() {
		if (appearanceSettingsHideTimer) {
			clearTimeout(appearanceSettingsHideTimer);
		}
		appearanceSettingsHideTimer = setTimeout(function() {
			appearanceSettingsHideTimer = null;
			hideMenu();
		}, 1000);
	};

	button.addEventListener('click', function(event) {
		event.preventDefault();
		if (menu.classList.contains('hide')) {
			showMenu();
			return;
		}
		hideMenu();
	});
	menu.addEventListener('focusin', function() {
		if (appearanceSettingsHideTimer) {
			clearTimeout(appearanceSettingsHideTimer);
			appearanceSettingsHideTimer = null;
		}
	});
	menu.addEventListener('mouseenter', function() {
		if (appearanceSettingsHideTimer) {
			clearTimeout(appearanceSettingsHideTimer);
			appearanceSettingsHideTimer = null;
		}
	});
	wrapper.addEventListener('mouseenter', function() {
		if (appearanceSettingsHideTimer) {
			clearTimeout(appearanceSettingsHideTimer);
			appearanceSettingsHideTimer = null;
		}
	});
	wrapper.addEventListener('mouseleave', scheduleHideMenuFromMouseLeave);
	menu.addEventListener('focusout', scheduleHideMenu);
	document.addEventListener('mousedown', function(event) {
		if (!wrapper.contains(event.target)) {
			scheduleHideMenu();
		}
	});

	currentTeamToggle?.addEventListener('change', function() {
		setCurrentTeamVisibility(currentTeamToggle.checked);
	});
	gameProgressionToggle?.addEventListener('change', function() {
		setGameProgressionVisible(gameProgressionToggle.checked);
	});
	advancedSearchSuggestionsToggle?.addEventListener('change', function() {
		setAdvancedSearchSuggestionsEnabled(advancedSearchSuggestionsToggle.checked);
	});
	patchedAbilityToggle?.addEventListener('change', function() {
		setPatchedAbilityExperimentalEnabled(patchedAbilityToggle.checked);
	});
	availableOnlyToggle?.addEventListener('change', function() {
		setAvailableOnlyEnabled(availableOnlyToggle.checked);
	});
	locationBaseOrderToggle?.addEventListener('change', function() {
		setLocationBaseOrderEnabled(locationBaseOrderToggle.checked);
	});
	allowTextSelectionToggle?.addEventListener('change', function() {
		setTextSelectionEnabled(allowTextSelectionToggle.checked);
	});
	hardcoreChangesToggle?.addEventListener('change', function() {
		setHardcoreChangesVisible(hardcoreChangesToggle.checked);
	});
	pokemonOffensiveToggle?.addEventListener('change', function() {
		setPokemonOffensiveVisible(pokemonOffensiveToggle.checked);
	});
}

// Keeps the integrated search row synced with the currently selected category and active query.
function updateIntegratedSearchControls() {
	const speciesControl = document.getElementById('speciesControl');
	const speciesFilterCategory = document.getElementById('speciesFilterCategory');
	const speciesFilterInput = document.getElementById('speciesFilterInput');
	const speciesInputWrapper = document.getElementById('speciesFilterInputWrapper');
	const speciesFilterSeparator = document.getElementById('speciesFilterSeparator');
	const advancedSearchControl = document.getElementById('advancedSearchControl');
	const advancedSearchActions = document.getElementById('advancedSearchActions');
	const advancedSearchSelected = selectedFilter?.label === 'Adv. Search';
	const shouldShowAdvancedSearch = advancedSearchSelected || Boolean(advancedSearchPredicate);
	const advancedSearchPlaceholder = typeof getAdvancedSearchExamplePlaceholder === 'function'
		? getAdvancedSearchExamplePlaceholder()
		: "Example: (bst >= 600 and location has 'route 3')";

	speciesControl?.classList.toggle('advancedSearchMode', advancedSearchSelected);
	speciesFilterCategory?.classList.remove('advancedOnly');
	speciesInputWrapper?.classList.remove('hide');
	speciesFilterSeparator?.classList.remove('hide');
	if (speciesFilterInput) {
		speciesFilterInput.placeholder = advancedSearchSelected ? advancedSearchPlaceholder : '';
	}
	advancedSearchControl?.classList.toggle('hide', !shouldShowAdvancedSearch);
	advancedSearchActions?.classList.toggle('hide', !advancedSearchSelected);
	advancedSearchActions?.classList.toggle('visible', advancedSearchSelected);
}

// Fills the advanced-search box from a preset shortcut, then runs the query immediately.
function applyAdvancedSearchShortcut(query) {
	const input = document.getElementById('speciesFilterInput');
	if (!input || typeof runAdvancedSearch !== 'function') {
		return;
	}

	if (typeof selectFilterCategoryByLabel === 'function') {
		selectFilterCategoryByLabel('Adv. Search');
	}
	updateIntegratedSearchControls();
	input.value = query;
	input.focus();
	input.setSelectionRange(input.value.length, input.value.length);
	advancedSearchLastInputValue = input.value;
	runAdvancedSearch();
}

// Appends one suggestion query into the current advanced-search input without running it.
function appendAdvancedSearchSuggestion(query) {
	const input = document.getElementById('speciesFilterInput');
	if (!input) {
		return;
	}

	if (typeof selectFilterCategoryByLabel === 'function') {
		selectFilterCategoryByLabel('Adv. Search');
	}
	updateIntegratedSearchControls();
	const trimmedCurrentQuery = input.value.trim();
	input.value = trimmedCurrentQuery ? `${trimmedCurrentQuery} and (${query})` : query;
	input.focus();
	input.setSelectionRange(input.value.length, input.value.length);
	advancedSearchLastInputValue = input.value;
	if (typeof refreshAdvancedSearchAutocomplete === 'function') {
		refreshAdvancedSearchAutocomplete();
	}
}

// Resets the inline quick-search editor back to create mode.
function resetAdvancedSearchShortcutEditor(menu) {
	const titleInput = menu?.querySelector('[data-quick-search-title]');
	const queryInput = menu?.querySelector('[data-quick-search-query]');
	const submitButton = menu?.querySelector('[data-quick-search-submit]');
	const cancelButton = menu?.querySelector('[data-quick-search-cancel]');
	const editorTitle = menu?.querySelector('[data-quick-search-editor-title]');
	if (!titleInput || !queryInput || !submitButton || !cancelButton || !editorTitle) {
		return;
	}

	titleInput.value = '';
	queryInput.value = '';
	submitButton.textContent = 'Add';
	cancelButton.classList.add('hide');
	editorTitle.textContent = 'Create Quick Search';
	delete menu.dataset.editIndex;
}

// Opens one saved quick-search entry in the inline editor for editing.
function populateAdvancedSearchShortcutEditor(menu, index) {
	const shortcut = advancedSearchShortcuts[index];
	const titleInput = menu?.querySelector('[data-quick-search-title]');
	const queryInput = menu?.querySelector('[data-quick-search-query]');
	const submitButton = menu?.querySelector('[data-quick-search-submit]');
	const cancelButton = menu?.querySelector('[data-quick-search-cancel]');
	const editorTitle = menu?.querySelector('[data-quick-search-editor-title]');
	if (!shortcut || !titleInput || !queryInput || !submitButton || !cancelButton || !editorTitle) {
		return;
	}

	menu.dataset.editIndex = String(index);
	titleInput.value = shortcut.title;
	queryInput.value = shortcut.query;
	submitButton.textContent = 'Update';
	cancelButton.classList.remove('hide');
	editorTitle.textContent = 'Edit Quick Search';
	titleInput.focus();
	titleInput.select();
}

// Downloads the current user-defined quick-search list as JSON.
function exportAdvancedSearchShortcuts() {
	const payload = {
		version: 1,
		quickSearches: advancedSearchShortcuts
	};
	const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = 'rr-dex-quick-searches.json';
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

// Imports quick-search buttons from an exported JSON file.
function importAdvancedSearchShortcutsFromFile(file, menu, hideMenu) {
	if (!file) {
		return;
	}

	const reader = new FileReader();
	reader.onload = function() {
		try {
			const parsed = JSON.parse(String(reader.result || ''));
			const shortcutList = Array.isArray(parsed)
				? parsed
				: Array.isArray(parsed?.quickSearches)
					? parsed.quickSearches
					: null;
			if (!shortcutList) {
				throw new Error('Invalid quick-search JSON format.');
			}

			advancedSearchShortcuts = shortcutList
				.map((shortcut, index) => normalizeAdvancedSearchShortcut(shortcut, index))
				.filter(Boolean);
			saveAdvancedSearchShortcuts();
			renderAdvancedSearchShortcutsMenu(menu, hideMenu);
		}
		catch (error) {
			alert(error.message || 'Failed to import quick searches.');
		}
	};
	reader.onerror = function() {
		alert('Failed to read the selected file.');
	};
	reader.readAsText(file);
}

// Rebuilds the quick-search menu from the persisted custom buttons and append-only suggestions.
function renderAdvancedSearchShortcutsMenu(menu, hideMenu) {
	if (!menu) {
		return;
	}

	menu.textContent = '';

	const createSection = function(titleText) {
		const section = document.createElement('section');
		section.className = 'advancedSearchShortcutSection';

		const title = document.createElement('h3');
		title.className = 'advancedSearchShortcutSectionTitle';
		title.textContent = titleText;
		section.append(title);
		return section;
	};

	const customSection = createSection('Your Quick Searches');
	if (!advancedSearchShortcuts.length) {
		const emptyState = document.createElement('p');
		emptyState.className = 'advancedSearchShortcutEmptyState';
		emptyState.textContent = 'No custom quick searches yet.';
		customSection.append(emptyState);
	}

	advancedSearchShortcuts.forEach((shortcut, index) => {
		const row = document.createElement('div');
		row.className = 'advancedSearchShortcutRow';

		const runButton = document.createElement('button');
		runButton.type = 'button';
		runButton.className = 'advancedSearchShortcutButton';

		const title = document.createElement('span');
		title.className = 'advancedSearchShortcutTitle';
		title.textContent = shortcut.title;

		const preview = document.createElement('span');
		preview.className = 'advancedSearchShortcutQuery';
		preview.textContent = shortcut.query;

		runButton.append(title, preview);
		runButton.addEventListener('click', function() {
			applyAdvancedSearchShortcut(shortcut.query);
			hideMenu();
		});

		const actions = document.createElement('div');
		actions.className = 'advancedSearchShortcutRowActions';

		const editButton = document.createElement('button');
		editButton.type = 'button';
		editButton.className = 'advancedSearchShortcutActionButton';
		editButton.textContent = 'Edit';
		editButton.addEventListener('click', function() {
			populateAdvancedSearchShortcutEditor(menu, index);
		});

		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.className = 'advancedSearchShortcutActionButton';
		deleteButton.textContent = 'Delete';
		deleteButton.addEventListener('click', function() {
			advancedSearchShortcuts.splice(index, 1);
			saveAdvancedSearchShortcuts();
			renderAdvancedSearchShortcutsMenu(menu, hideMenu);
		});

		actions.append(editButton, deleteButton);
		row.append(runButton, actions);
		customSection.append(row);
	});

	const editorSection = createSection('Manage Quick Searches');
	const editorTitle = document.createElement('div');
	editorTitle.className = 'advancedSearchShortcutEditorTitle';
	editorTitle.dataset.quickSearchEditorTitle = 'true';
	editorTitle.textContent = 'Create Quick Search';

	const titleInput = document.createElement('input');
	titleInput.type = 'text';
	titleInput.className = 'advancedSearchShortcutEditorInput';
	titleInput.placeholder = 'Button name';
	titleInput.dataset.quickSearchTitle = 'true';

	const queryInput = document.createElement('textarea');
	queryInput.className = 'advancedSearchShortcutEditorTextarea';
	queryInput.placeholder = 'Advanced search query';
	queryInput.rows = 4;
	queryInput.dataset.quickSearchQuery = 'true';

	const editorActions = document.createElement('div');
	editorActions.className = 'advancedSearchShortcutEditorActions';

	const submitButton = document.createElement('button');
	submitButton.type = 'button';
	submitButton.className = 'advancedSearchShortcutPrimaryButton';
	submitButton.textContent = 'Add';
	submitButton.dataset.quickSearchSubmit = 'true';
	submitButton.addEventListener('click', function() {
		const query = queryInput.value.trim();
		const title = titleInput.value.trim();
		if (!query) {
			alert('Quick search query is required.');
			queryInput.focus();
			return;
		}

		const normalizedShortcut = normalizeAdvancedSearchShortcut({
			title,
			query
		}, advancedSearchShortcuts.length);
		if (!normalizedShortcut) {
			alert('Quick search query is required.');
			queryInput.focus();
			return;
		}

		const editIndex = Number(menu.dataset.editIndex);
		if (Number.isInteger(editIndex) && editIndex >= 0 && editIndex < advancedSearchShortcuts.length) {
			advancedSearchShortcuts[editIndex] = normalizedShortcut;
		} else {
			advancedSearchShortcuts.push(normalizedShortcut);
		}

		saveAdvancedSearchShortcuts();
		renderAdvancedSearchShortcutsMenu(menu, hideMenu);
	});

	const cancelButton = document.createElement('button');
	cancelButton.type = 'button';
	cancelButton.className = 'advancedSearchShortcutSecondaryButton hide';
	cancelButton.textContent = 'Cancel';
	cancelButton.dataset.quickSearchCancel = 'true';
	cancelButton.addEventListener('click', function() {
		resetAdvancedSearchShortcutEditor(menu);
	});

	editorActions.append(submitButton, cancelButton);
	editorSection.append(editorTitle, titleInput, queryInput, editorActions);

	const transferSection = createSection('Transfer');
	const transferActions = document.createElement('div');
	transferActions.className = 'advancedSearchShortcutTransferActions';

	const exportButton = document.createElement('button');
	exportButton.type = 'button';
	exportButton.className = 'advancedSearchShortcutSecondaryButton';
	exportButton.textContent = 'Export JSON';
	exportButton.addEventListener('click', exportAdvancedSearchShortcuts);

	const importButton = document.createElement('button');
	importButton.type = 'button';
	importButton.className = 'advancedSearchShortcutSecondaryButton';
	importButton.textContent = 'Import JSON';
	importButton.addEventListener('click', function() {
		advancedSearchShortcutImportInput?.click();
	});

	const clearAllButton = document.createElement('button');
	clearAllButton.type = 'button';
	clearAllButton.className = 'advancedSearchShortcutDangerButton';
	clearAllButton.textContent = 'Clear All';
	clearAllButton.addEventListener('click', function() {
		if (!advancedSearchShortcuts.length) {
			return;
		}
		if (!window.confirm('Delete all saved quick searches?')) {
			return;
		}
		advancedSearchShortcuts = [];
		saveAdvancedSearchShortcuts();
		renderAdvancedSearchShortcutsMenu(menu, hideMenu);
	});

	transferActions.append(exportButton, importButton, clearAllButton);
	transferSection.append(transferActions);

	const suggestionSection = createSection('Suggestions');
	ADVANCED_SEARCH_SUGGESTIONS.forEach(shortcut => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'advancedSearchShortcutButton';

		const title = document.createElement('span');
		title.className = 'advancedSearchShortcutTitle';
		title.textContent = shortcut.title;

		const preview = document.createElement('span');
		preview.className = 'advancedSearchShortcutQuery';
		preview.textContent = shortcut.query;

		button.append(title, preview);
		button.addEventListener('click', function() {
			appendAdvancedSearchSuggestion(shortcut.query);
		});
		suggestionSection.append(button);
	});

	menu.append(customSection, editorSection, transferSection, suggestionSection);
	resetAdvancedSearchShortcutEditor(menu);
}

// Wires the shortcut popup so it mirrors the same click/fade interaction used by settings.
function setupAdvancedSearchShortcutsMenu() {
	const wrapper = document.getElementById('advancedSearchShortcutsWrapper');
	const button = document.getElementById('advancedSearchShortcutsButton');
	const menu = document.getElementById('advancedSearchShortcutsMenu');
	if (!wrapper || !button || !menu) {
		return;
	}

	if (!advancedSearchShortcutImportInput) {
		advancedSearchShortcutImportInput = document.createElement('input');
		advancedSearchShortcutImportInput.type = 'file';
		advancedSearchShortcutImportInput.accept = 'application/json,.json';
		advancedSearchShortcutImportInput.className = 'hide';
		advancedSearchShortcutImportInput.addEventListener('change', function(event) {
			const file = event.target.files?.[0];
			importAdvancedSearchShortcutsFromFile(file, menu, hideMenu);
			event.target.value = '';
		});
		document.body.append(advancedSearchShortcutImportInput);
	}

	const showMenu = function() {
		if (advancedSearchShortcutsHideTimer) {
			clearTimeout(advancedSearchShortcutsHideTimer);
			advancedSearchShortcutsHideTimer = null;
		}
		if (advancedSearchShortcutsVisibilityTimer) {
			clearTimeout(advancedSearchShortcutsVisibilityTimer);
			advancedSearchShortcutsVisibilityTimer = null;
		}

		renderAdvancedSearchShortcutsMenu(menu, hideMenu);
		if (menu.classList.contains('hide')) {
			menu.classList.remove('hide');
			menu.classList.remove('visible');
			requestAnimationFrame(function() {
				menu.classList.add('visible');
			});
		} else {
			menu.classList.add('visible');
		}
		button.setAttribute('aria-expanded', 'true');
	};

	const hideMenu = function() {
		menu.classList.remove('visible');
		button.setAttribute('aria-expanded', 'false');
		if (advancedSearchShortcutsVisibilityTimer) {
			clearTimeout(advancedSearchShortcutsVisibilityTimer);
		}
		advancedSearchShortcutsVisibilityTimer = setTimeout(function() {
			advancedSearchShortcutsVisibilityTimer = null;
			if (!menu.classList.contains('visible')) {
				menu.classList.add('hide');
			}
		}, 120);
	};

	const scheduleHideMenu = function() {
		if (advancedSearchShortcutsHideTimer) {
			clearTimeout(advancedSearchShortcutsHideTimer);
		}
		advancedSearchShortcutsHideTimer = setTimeout(function() {
			advancedSearchShortcutsHideTimer = null;
			if (wrapper.contains(document.activeElement)) {
				return;
			}
			hideMenu();
		}, 1000);
	};

	const scheduleHideMenuFromMouseLeave = function() {
		if (advancedSearchShortcutsHideTimer) {
			clearTimeout(advancedSearchShortcutsHideTimer);
		}
		advancedSearchShortcutsHideTimer = setTimeout(function() {
			advancedSearchShortcutsHideTimer = null;
			hideMenu();
		}, 1000);
	};

	button.addEventListener('click', function(event) {
		event.preventDefault();
		if (menu.classList.contains('hide')) {
			showMenu();
			return;
		}
		hideMenu();
	});
	menu.addEventListener('focusin', function() {
		if (advancedSearchShortcutsHideTimer) {
			clearTimeout(advancedSearchShortcutsHideTimer);
			advancedSearchShortcutsHideTimer = null;
		}
	});
	menu.addEventListener('mouseenter', function() {
		if (advancedSearchShortcutsHideTimer) {
			clearTimeout(advancedSearchShortcutsHideTimer);
			advancedSearchShortcutsHideTimer = null;
		}
	});
	wrapper.addEventListener('mouseenter', function() {
		if (advancedSearchShortcutsHideTimer) {
			clearTimeout(advancedSearchShortcutsHideTimer);
			advancedSearchShortcutsHideTimer = null;
		}
	});
	wrapper.addEventListener('mouseleave', scheduleHideMenuFromMouseLeave);
	menu.addEventListener('focusout', scheduleHideMenu);
	document.addEventListener('mousedown', function(event) {
		if (!wrapper.contains(event.target)) {
			scheduleHideMenu();
		}
	});
}
