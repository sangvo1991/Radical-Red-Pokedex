let currentSearchMode = 'default';
let appearanceSettingsHideTimer = null;
let appearanceSettingsVisibilityTimer = null;

const ADVANCED_SEARCH_MODE_STORAGE_KEY = 'advancedSearchMode';

// Bootstraps the split feature set and reapplies persisted UI/search state.
function setupAdvancedFeatures() {
	buildHardcoreState();
	loadAppearanceSettings();
	loadAdvancedSearchHistory();
	setupAdvancedSearch();
	setupAppearanceSettingsMenu();
	applyAppearanceSettings();
	setSearchMode(getStoredSearchMode(), false);
}

// Loads persisted appearance preferences into the shared runtime settings object.
function loadAppearanceSettings() {
	const storedSettings = readAppearanceSettingsFromStorage();
	appearanceSettings = {
		currentTeamVisible: storedSettings.currentTeamVisible !== false,
		locationBaseOrder: storedSettings.locationBaseOrder === true,
		allowTextSelection: storedSettings.allowTextSelection === true
	};
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

// Returns whether copy/select protection is disabled for the page.
function isTextSelectionEnabled() {
	return appearanceSettings.allowTextSelection === true;
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

// Applies all persisted appearance settings to the live page state.
function applyAppearanceSettings() {
	applyTextSelectionSetting();
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
	const locationBaseOrderToggle = document.getElementById('appearanceLocationBaseOrderToggle');
	const allowTextSelectionToggle = document.getElementById('appearanceAllowTextSelectionToggle');

	if (defaultRadio) {
		defaultRadio.checked = currentSearchMode !== 'advanced';
	}
	if (advancedRadio) {
		advancedRadio.checked = currentSearchMode === 'advanced';
	}
	if (currentTeamToggle) {
		currentTeamToggle.checked = isCurrentTeamVisibleEnabled();
	}
	if (locationBaseOrderToggle) {
		locationBaseOrderToggle.checked = isLocationBaseOrderEnabled();
	}
	if (allowTextSelectionToggle) {
		allowTextSelectionToggle.checked = isTextSelectionEnabled();
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
	const locationBaseOrderToggle = document.getElementById('appearanceLocationBaseOrderToggle');
	const allowTextSelectionToggle = document.getElementById('appearanceAllowTextSelectionToggle');
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
	locationBaseOrderToggle?.addEventListener('change', function() {
		setLocationBaseOrderEnabled(locationBaseOrderToggle.checked);
	});
	allowTextSelectionToggle?.addEventListener('change', function() {
		setTextSelectionEnabled(allowTextSelectionToggle.checked);
	});
}

// Flips the search mode using the current in-memory selection.
function toggleSearchMode() {
	setSearchMode(currentSearchMode === 'advanced' ? 'default' : 'advanced');
}
