const APPEARANCE_SETTINGS_STORAGE_KEY = 'appearanceSettings';

function readAppearanceSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(APPEARANCE_SETTINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAppearanceSettingsToStorage(settings) {
  try {
    localStorage.setItem(APPEARANCE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

function getAppearanceSetting(key, fallback) {
  const storedSettings = readAppearanceSettingsFromStorage();
  if (!appearanceSettingsLoaded && Object.prototype.hasOwnProperty.call(storedSettings, key)) {
    return storedSettings[key];
  }

  if (appearanceSettings && Object.prototype.hasOwnProperty.call(appearanceSettings, key)) {
    return appearanceSettings[key];
  }

  if (Object.prototype.hasOwnProperty.call(storedSettings, key)) {
    return storedSettings[key];
  }

  return fallback;
}

function getAbilityName(ability, species, raw = false) {
  if (ability[0] === 0) return undefined;

  const mappedAbility = raw ? ability : getMappedAbility(ability, species);
  return getAbilityDisplayNameById(mappedAbility[0], mappedAbility[1]);
}

function getMove(moveIdx, species, raw = false) {
  return moves[raw ? moveIdx : getMappedMove(moveIdx, species)];
}

function getFullLearnset(mon) {
  let learnset = [];
  if (mon.levelupMoves) {
	// Pass the species ID in so it gets the mapped move properly
    const levelMoves = mon.levelupMoves.map((x) => {
      const move = getMove(x[0], mon.ID);
      return move.ID;
    });

    learnset.push(...levelMoves);
  }

  if (mon.tmMoves) learnset.push(...mon.tmMoves.map((x) => tmMoves[x]));
  if (mon.tutorMoves)
    learnset.push(...mon.tutorMoves.map((x) => tutorMoves[x]));
  if (mon.eggMoves) learnset.push(...mon.eggMoves);
  return learnset;
}

function getSprite(ID) {
  let sprite = sprites[ID];
  if (sprite === undefined && species?.[ID]) {
    sprite = `graphics/species/front/${ID}.png`;
  }
  if (sprite === undefined) sprite = sprites[0];
  return sprite;
}

function loadChunk(tracker, toClear) {
  let rowsAdded = 0;

  if (toClear) {
    if (scrollIntoView && tracker.body.getBoundingClientRect().top < 0)
      tracker.body.scrollIntoView({ behavior: "smooth", block: "start" });
    tracker.body.innerText = "";
    tracker.index = 0;
  }

  let data = tracker.data;
  let i = tracker.index;
  for (j = data.length, k = tracker.maxRows; rowsAdded < k && i < j; i++) {
    tracker.displayMethod(tracker, data[i]);
    rowsAdded++;
  }
  tracker.index = i;
}
