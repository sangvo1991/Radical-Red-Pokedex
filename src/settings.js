let currentSearchMode = 'default';
let appearanceSettingsHideTimer = null;
let appearanceSettingsVisibilityTimer = null;
let advancedSearchShortcutsHideTimer = null;
let advancedSearchShortcutsVisibilityTimer = null;

const ADVANCED_SEARCH_MODE_STORAGE_KEY = 'advancedSearchMode';
const ADVANCED_SEARCH_SHORTCUTS = [
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

// Bootstraps the split feature set and reapplies persisted UI/search state.
function setupAdvancedFeatures() {
	buildHardcoreState();
	loadAppearanceSettings();
	loadAdvancedSearchHistory();
	setupAdvancedSearch();
	setupAdvancedSearchShortcutsMenu();
	setupAppearanceSettingsMenu();
	applyAppearanceSettings();
	setSearchMode(getStoredSearchMode(), false);
}

// Loads persisted appearance preferences into the shared runtime settings object.
function loadAppearanceSettings() {
	const storedSettings = readAppearanceSettingsFromStorage();
	appearanceSettings = {
		currentTeamVisible: storedSettings.currentTeamVisible !== false,
		gameProgressionVisible: storedSettings.gameProgressionVisible === true,
		locationBaseOrder: storedSettings.locationBaseOrder === true,
		allowTextSelection: storedSettings.allowTextSelection === true,
		hardcoreChangesVisible: storedSettings.hardcoreChangesVisible !== false,
		pokemonOffensiveVisible: storedSettings.pokemonOffensiveVisible !== false,
		disableValueSuggestions: storedSettings.disableValueSuggestions === true,
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

// Returns whether advanced search should suppress value/history suggestions.
function areAdvancedSearchValueSuggestionsDisabled() {
	return appearanceSettings.disableValueSuggestions === true;
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

// Toggles value suggestions inside advanced search without affecting attribute/operator hints.
function setAdvancedSearchValueSuggestionsDisabled(enabled, persist = true) {
	appearanceSettings.disableValueSuggestions = enabled === true;
	if (persist) {
		persistAppearanceSettings();
	}
	updateAppearanceSettingsControls();
	if (currentSearchMode === 'advanced' && typeof refreshAdvancedSearchAutocomplete === 'function') {
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
	refreshSpeciesResults();
}

// Adds or removes the body class that allows text highlighting and copying.
function applyTextSelectionSetting() {
	document.body.classList.toggle('allowTextSelection', isTextSelectionEnabled());
}

// Syncs the settings popup controls with the current runtime state.
function updateAppearanceSettingsControls() {
	const defaultRadio = document.getElementById('appearanceSearchModeDefault');
	const advancedRadio = document.getElementById('appearanceSearchModeAdvanced');
	const currentTeamToggle = document.getElementById('appearanceCurrentTeamToggle');
	const gameProgressionToggle = document.getElementById('appearanceGameProgressionToggle');
	const disableValueSuggestionsOption = document.getElementById('appearanceDisableValueSuggestionsOption');
	const disableValueSuggestionsToggle = document.getElementById('appearanceDisableValueSuggestionsToggle');
	const availableOnlyToggle = document.getElementById('appearanceAvailableOnlyToggle');
	const locationBaseOrderToggle = document.getElementById('appearanceLocationBaseOrderToggle');
	const allowTextSelectionToggle = document.getElementById('appearanceAllowTextSelectionToggle');
	const hardcoreChangesToggle = document.getElementById('appearanceHardcoreChangesToggle');
	const pokemonOffensiveToggle = document.getElementById('appearancePokemonOffensiveToggle');

	if (defaultRadio) {
		defaultRadio.checked = currentSearchMode !== 'advanced';
	}
	if (advancedRadio) {
		advancedRadio.checked = currentSearchMode === 'advanced';
	}
	if (currentTeamToggle) {
		currentTeamToggle.checked = isCurrentTeamVisibleEnabled();
	}
	if (gameProgressionToggle) {
		gameProgressionToggle.checked = isGameProgressionVisibleEnabled();
	}
	if (disableValueSuggestionsOption) {
		disableValueSuggestionsOption.classList.toggle('hide', currentSearchMode !== 'advanced');
	}
	if (disableValueSuggestionsToggle) {
		disableValueSuggestionsToggle.checked = areAdvancedSearchValueSuggestionsDisabled();
		disableValueSuggestionsToggle.disabled = currentSearchMode !== 'advanced';
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

// Reads the preferred default search mode from localStorage.
function getStoredSearchMode() {
	try {
		const storedMode = localStorage.getItem(ADVANCED_SEARCH_MODE_STORAGE_KEY);
		return storedMode === 'advanced' ? 'advanced' : 'default';
	}
	catch {
		return 'default';
	}
}

// Persists the selected default search mode for future visits.
function saveSearchMode(mode) {
	try {
		localStorage.setItem(
			ADVANCED_SEARCH_MODE_STORAGE_KEY,
			mode === 'advanced' ? 'advanced' : 'default'
		);
	}
	catch {}
}

// Keeps the legacy toggle button label in sync when that button exists.
function updateSearchModeToggleButton() {
	const toggleButton = document.getElementById('searchModeToggleButton');
	if (!toggleButton) {
		updateAppearanceSettingsControls();
		return;
	}

	toggleButton.textContent = currentSearchMode === 'advanced'
		? 'Switch to Default Search'
		: 'Switch to Advanced Search';
}

// Switches between normal and advanced search UIs and resets conflicting state.
function setSearchMode(mode, persist = true) {
	currentSearchMode = mode === 'advanced' ? 'advanced' : 'default';

	const speciesControl = document.getElementById('speciesControl');
	const activeFilters = document.getElementById('activeFilters');
	const advancedSearchControl = document.getElementById('advancedSearchControl');
	const advancedSearchInput = document.getElementById('advancedSearchInput');

	speciesControl?.classList.toggle('hide', currentSearchMode === 'advanced');
	activeFilters?.classList.toggle('hide', currentSearchMode === 'advanced');
	advancedSearchControl?.classList.toggle('hide', currentSearchMode !== 'advanced');
	updateSearchModeToggleButton();
	updateAppearanceSettingsControls();

	if (persist) {
		saveSearchMode(currentSearchMode);
	}

	if (currentSearchMode === 'advanced') {
		removeFilters();
		if (advancedSearchInput) {
			advancedSearchLastInputValue = advancedSearchInput.value;
			if (document.activeElement === advancedSearchInput) {
				refreshAdvancedSearchAutocomplete();
			} else {
				hideAdvancedSearchAutocomplete();
			}
		}
		return;
	}

	clearAdvancedSearch();
	hideAdvancedSearchAutocomplete();
}

// Wires the settings popup behavior, fade timing, and control event handlers.
function setupAppearanceSettingsMenu() {
	const wrapper = document.getElementById('appearanceSettingsWrapper');
	const button = document.getElementById('appearanceSettingsButton');
	const menu = document.getElementById('appearanceSettingsMenu');
	const defaultRadio = document.getElementById('appearanceSearchModeDefault');
	const advancedRadio = document.getElementById('appearanceSearchModeAdvanced');
	const currentTeamToggle = document.getElementById('appearanceCurrentTeamToggle');
	const gameProgressionToggle = document.getElementById('appearanceGameProgressionToggle');
	const disableValueSuggestionsToggle = document.getElementById('appearanceDisableValueSuggestionsToggle');
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

	defaultRadio?.addEventListener('change', function() {
		if (defaultRadio.checked) {
			setSearchMode('default');
		}
	});
	advancedRadio?.addEventListener('change', function() {
		if (advancedRadio.checked) {
			setSearchMode('advanced');
		}
	});
	currentTeamToggle?.addEventListener('change', function() {
		setCurrentTeamVisibility(currentTeamToggle.checked);
	});
	gameProgressionToggle?.addEventListener('change', function() {
		setGameProgressionVisible(gameProgressionToggle.checked);
	});
	disableValueSuggestionsToggle?.addEventListener('change', function() {
		setAdvancedSearchValueSuggestionsDisabled(disableValueSuggestionsToggle.checked);
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

// Flips the search mode using the current in-memory selection.
function toggleSearchMode() {
	setSearchMode(currentSearchMode === 'advanced' ? 'default' : 'advanced');
}

// Fills the advanced-search box from a preset shortcut, then runs the query immediately.
function applyAdvancedSearchShortcut(query) {
	const input = document.getElementById('advancedSearchInput');
	if (!input || typeof runAdvancedSearch !== 'function') {
		return;
	}

	setSearchMode('advanced', false);
	input.value = query;
	input.focus();
	input.setSelectionRange(input.value.length, input.value.length);
	advancedSearchLastInputValue = input.value;
	runAdvancedSearch();
}

// Rebuilds the shortcut menu buttons from the predefined advanced-search presets.
function renderAdvancedSearchShortcutsMenu(menu, hideMenu) {
	if (!menu) {
		return;
	}

	const shortcutButtons = ADVANCED_SEARCH_SHORTCUTS.map(shortcut => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'advancedSearchShortcutButton';

		const title = document.createElement('span');
		title.className = 'advancedSearchShortcutTitle';
		title.textContent = shortcut.title;

		button.append(title);
		button.addEventListener('click', function() {
			applyAdvancedSearchShortcut(shortcut.query);
			hideMenu();
		});
		return button;
	});

	menu.replaceChildren(...shortcutButtons);
}

// Wires the shortcut popup so it mirrors the same click/fade interaction used by settings.
function setupAdvancedSearchShortcutsMenu() {
	const wrapper = document.getElementById('advancedSearchShortcutsWrapper');
	const button = document.getElementById('advancedSearchShortcutsButton');
	const menu = document.getElementById('advancedSearchShortcutsMenu');
	if (!wrapper || !button || !menu) {
		return;
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
