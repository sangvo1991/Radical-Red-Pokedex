let appearanceSettingsHideTimer = null;
let appearanceSettingsVisibilityTimer = null;
let advancedSearchShortcutsHideTimer = null;
let advancedSearchShortcutsVisibilityTimer = null;
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
	updateIntegratedSearchControls();
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
	advancedSearchActions?.classList.remove('hide');
	advancedSearchActions?.classList.add('visible');
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
