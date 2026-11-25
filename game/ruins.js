const stoneHelm = { id: 'stone-helm', label: 'Stone Helm', value: 1, slot: 'head', defBonus: 2,
 description: 'A fitted stone helm from the refuge.' };
const stoneShield = { id: 'stone-shield', label: 'Stone Shield', value: 1, slot: 'shield', defBonus: 3,
 description: 'A shield cut from the cistern’s stone.' };
const stoneArmor = { id: 'stone-armor', label: 'Stone Cuirass', value: 1, slot: 'body', defBonus: 4,
 description: 'Overlapping stone plates protect the chest.' };
const stoneFang = { id: 'stone-fang', label: 'Stone Fang', value: 1, slot: 'accessory', strBonus: 2,
 description: 'A fang charm worn by the refuge’s hunters.' };
const ruinsGear = [stoneHelm, stoneShield, stoneArmor, stoneFang];
const glyphFragment = {id: 'glyph-fragment', label: 'Glyph Fragment', value: 1,
 description: 'A fragment of carved stone.'};
const fragmentLootKey = '20:2';
const vigilLedgeHeight = 28;
const vigilLifeStarKey = 'vigil-life-star';
const ruinsLoot = {
 20: [{ x: 132, y: 55, reward: stoneHelm, chest: true, key: '20:0' },
      { x: 108, y: 53, reward: glyphFragment, key: fragmentLootKey }],
 21: [{ x: 117, y: 66, reward: stoneShield, chest: true }, { x: 33, y: 119, reward: 'potion' }],
 22: [{ x: 145, y: 54, reward: stoneFang, height: vigilLedgeHeight }],
 23: [{ x: 37, y: 59, reward: stoneArmor, chest: true, key: '23:0' }, { x: 20, y: 59, reward: 'star' }]
};
const ruinsPanels = [{x: 44, y: 87}, {x: 80, y: 112}, {x: 116, y: 87}, {x: 80, y: 64}];
const crackedPanel = 3;
const archiveScentCorner = {x: 23, y: 57};
const archiveScentTrail = [[23,57],[27,52],[33,50],[42,50],[51,50],[60,50],[69,49],
 [78,49],[87,49],[96,49],[104,50],[108,53]];
const ruinsPanelNames = ['The Discovery', 'The Watch', 'The Refuge', 'The Peace'];
const ruinsArchiveRecords = [
 '“The Humans Discovered The Werewolves in The Woods”',
 '“The Wolves Vowed to Protect The Humans”',
 '“The Humans Offered Refuge in the Township Woods”',
 '“The Humans and Werewolves Would Live in Peace For Eternity”'
];
const vigilPlatforms = [14, 122].flatMap(x => [
 [97, 117, 112, 6], [77, 94, 90, 14], [60, 76, 72, 22], [49, 57, 54, vigilLedgeHeight]
].map(([y, bottom, footing, height]) => ({x, width: 24, height, y, bottom, seatY: footing - height, platform: true})));
const vigilChests = [{x: 26, y: 54, type: 'vigil-chest', emblem: 'paw'},
 {x: 131, y: 54, type: 'vigil-star', emblem: 'star'}];
const vigilScentSpot = {x: 80, y: 121};
const ruinsPillars = [43, 117].map(x => ({ x: x - 5, y: 98, width: 10, bottom: 110, height: 20 }));
// Keep the original enemy IDs so defeated scorpions stay defeated in existing saves.
const ruinsEnemies = {
 // The south bank ends short of the doorway and Luca's spawn at y=130.
 19: [ruinsScorpion('hall-mite', 105, 116, 22, 128, 20, false, {top: 106, bottom: 117}),
      ruinsScorpion('hall-north-scorpion', 113, 68, 22, 128, 20, false, {top: 54, bottom: 84})],
 20: [ruinsScorpion('archive-mite', 44, 105, 21, 78, 20, false, {top: 65, bottom: 116}),
      ruinsScorpion('archive-sentinel', 88, 84, 69, 128, 30, true, {top: 60, bottom: 116})],
 23: [ruinsScorpion('bridge-sentinel', 39, 119, 23, 125, 35, true, {top: 112, bottom: 119})]
};
const hallPotionScorpion = ruinsEnemies[19][1];
const ruinsGemRewards = new Map([
 [ruinsEnemies[19][0], {room: 19, key: '19:1'}],
 [ruinsEnemies[20][1], {room: 20, key: '20:1'}]
]);
function ruinsScorpion(id, x, y, left, right, hp, large = false, bank = null) {
 return { id, x, y: y - 4, bottom: y + 4, width: large ? 13 : 10, height: large ? 12 : 9,
  left, right, start: x, startY: y, hp, large, bank, destination: null, hitAt: -Infinity, phase: 'patrol', direction: 1, until: 0 };
}
const ruinsHound = { id: 'stone-hound', x: 70, y: 98, width: 20, bottom: 110, height: 14,
 hp: 40, phase: 'watch', direction: 1, until: 0 };
const ruinsGap = { top: 69, bottom: 107 };
const ruinsSpan = { left: 69, right: 91 };
const ruinsState = { hallPotion: null, gemDrops: {}, records: 0, archiveScent: false, archiveRestored: false, pillars: 0,
 vigilChestOpen: false, pounce: false, bridge: false, guardDefeated: false, claimed: new Set() };
let ruinsElapsed = 0, ruinsFrame = null, ruinsHurtUntil = 0;
const ruinsScent = {startedAt: -Infinity, fade: null};
let archiveFragmentRevealedAt = -Infinity, archivePanelRepairedAt = -Infinity;
const bridgeChestDelay = 220, bridgeChestFadeDuration = 850;
let bridgeLoweredAt = -Infinity;
let ruinsVista = false;
let ruinsGateAt = -Infinity, houndBreakAt = -Infinity, ruinsLanding = null;

function resetRuinsVisit() {
 ruinsElapsed = 0;
 ruinsFrame = null;
 ruinsHurtUntil = 0;
 startScentHighlight(ruinsScent, -Infinity);
 archiveFragmentRevealedAt = archivePanelRepairedAt = -Infinity;
 bridgeLoweredAt = -Infinity;
 ruinsVista = false;
 ruinsGateAt = houndBreakAt = -Infinity;
 ruinsLanding = null;
 for (const enemy of ruinsEnemies[ruinsInterior] ?? []) {
  Object.assign(enemy, {x: enemy.start, y: enemy.startY - 4, bottom: enemy.startY + 4,
   destination: null, hitAt: -Infinity, phase: 'patrol', direction: 1, until: 0});
 }
 if (ruinsInterior === 23) resetRuinsGuard();
 Object.assign(ruinsHound, { x: 70, phase: 'watch', until: 750 });
}
function ruinsProgress() {
 return { ...ruinsState, claimed: [...ruinsState.claimed], defeated: Object.values(ruinsEnemies)
  .flat().filter(enemy => enemy.hp === 0).map(enemy => enemy.id) };
}
function restoreRuinsProgress(progress, room) {
 const oldSave = !progress;
 const current = progress ?? {};
 const records = integer(current.records, 0, 15, oldSave && room > 20 ? 15 : 0);
 Object.assign(ruinsState, {
  hallPotion: restoreDrop(current.hallPotion),
  gemDrops: Object.fromEntries(Array.from(ruinsGemRewards.values(), ({key}) => [key, restoreDrop(current.gemDrops?.[key])])),
  records,
  archiveRestored: current.archiveRestored === true || Boolean(records & (1 << crackedPanel)),
  archiveScent: current.archiveScent === true || (oldSave && room > 20),
  pillars: integer(current.pillars, 0, 3, oldSave && room > 21 ? 3 : 0),
  vigilChestOpen: current.vigilChestOpen === true,
  pounce: current.pounce === true || (oldSave && room > 22),
  bridge: current.bridge === true,
  guardDefeated: current.guardDefeated === true,
  claimed: new Set(Array.isArray(current.claimed) ? current.claimed : [])
 });
 for (const enemy of Object.values(ruinsEnemies).flat()) {
  if (Array.isArray(current.defeated) && current.defeated.includes(enemy.id)) enemy.hp = 0;
 }
 if (!current.gemDrops && Array.isArray(current.defeated)) {
  for (const [enemy, {key}] of ruinsGemRewards) {
   if (current.defeated.includes(enemy.id) && !ruinsState.claimed.has(key)) {
    ruinsState.gemDrops[key] = {x: Math.round(enemy.start + enemy.width / 2), y: enemy.startY + 2};
   }
  }
 }
 // Saves beyond the hall already passed its old gate.
 if (room > 19 && (oldSave || Object.hasOwn(current, 'plate'))) {
  for (const scorpion of ruinsEnemies[19]) scorpion.hp = 0;
 }
}
function ruinsDoorOpen() {
 switch (ruinsInterior) {
  case 19: return ruinsEnemies[19].every(scorpion => scorpion.hp === 0);
  case 20: return ruinsState.archiveRestored && ruinsState.records === 15;
  case 21: return ruinsState.pillars === 3;
  case 22: return ruinsState.pounce;
  case 23: return ruinsState.bridge && ruinsState.guardDefeated;
  default: return false;
 }
}
function defeatRuinsScorpion(target) {
 const drop = {x: Math.round(target.x + target.width / 2), y: Math.round(target.bottom - 2)};
 const gems = ruinsGemRewards.get(target);
 if (gems) ruinsState.gemDrops[gems.key] = drop;
 if (ruinsInterior !== 19) return;
 if (target === hallPotionScorpion) ruinsState.hallPotion = drop;
 if (ruinsDoorOpen()) ruinsOpenNotice();
 else showInfo('One scorpion left.');
}
function ruinsOpenNotice() {
 ruinsGateAt = ruinsElapsed;
 playPickupSound([440, 587, 784]);
 showInfo(ruinsInterior === 23 ? 'The bridge is down. The overlook is open.' : 'North door open ↑');
}
function ruinsDoorClue() {
 switch (ruinsInterior) {
  case 19: return 'Defeat both scorpions to open the north door.';
  case 20: return 'The north door is sealed.';
  case 21: return 'Lure the hound into both cracked pillars.';
  case 22: return 'The north door is sealed.';
  case 23: return ruinsState.guardDefeated ? 'Pull the bridge lever on the right.' : 'The guard blocks the exit.';
 }
}
function ruinsRoomHint() {
 if (jump) return '';
 switch (ruinsInterior) {
  case 19:
   if (ruinsNear(80, 104, 13, 6)) return 'Hold up and press ' + actionKey('B') + ' to jump the trench.';
   if (!ruinsDoorOpen() && (playerY > 123 || playerY < 57)) return ruinsDoorClue();
   break;
  case 20:
   if (playerY < 57) return ruinsDoorOpen() ? 'North door open ↑' : ruinsDoorClue();
   break;
  case 21:
   if (ruinsState.pillars !== 3 && playerY > 116) return 'Bait the hound left and right. Jump when it charges.';
   break;

  case 23:
   if (!ruinsState.bridge && ruinsNear(80, 110, 15, 8)) return pounceControls();
   if (ruinsState.guardDefeated && !ruinsState.bridge && playerY < ruinsGap.top) return ruinsDoorClue();
   break;
 }
 return '';
}
function ruinsInteriorObjects() {
 switch (ruinsInterior) {
  case 21: return ruinsPillars.filter((_, index) => !(ruinsState.pillars & (1 << index)));
  case 22: return vigilPlatforms;
  default: return [];
 }
}
function ruinsAttackTargets() {
 const enemies = [...(ruinsEnemies[ruinsInterior] ?? [])];
 if (ruinsInterior === 23 && ['windup', 'rush', 'recover'].includes(ruinsGuard.phase)) enemies.push(ruinsGuard);
 return ruinsInterior === 21 && ruinsState.pillars !== 3
  ? [ruinsHound, ...ruinsInteriorObjects()]
  : [...enemies, ...ruinsInteriorObjects()];
}
function ruinsFloor(x, y) {
 if (ruinsInterior === 19 && y >= 90 && y <= 100) return false;
 if (ruinsInterior === 21 && y >= 79 && y <= 95) return ruinsState.pillars === 3 && x >= 64 && x <= 96;
 if (ruinsInterior === 23 && y >= ruinsGap.top && y <= ruinsGap.bottom) {
  return ruinsState.bridge && x >= ruinsSpan.left && x <= ruinsSpan.right;
 }
 return true;
}
function blocksRuinsStep(x, y) {
 if (ruinsFloor(x, y)) return false;
 if (ruinsInterior === 19) return x < 69 || x > 91 || !jump || jump.height < 4;
 if (ruinsInterior === 23) return x < ruinsSpan.left || x > ruinsSpan.right || !jump?.pounce;
 return true;
}
function finishRuinsLanding({safeX, safeY, pounce}) {
 if (!ruinsFloor(playerX, playerY)) {
  playerX = safeX;
  playerY = safeY;
  hurtInRuins(2);
  return false;
 }
 if (pounce) {
  ruinsLanding = {x: playerX, y: playerY, at: ruinsElapsed};
  playAttackSound('step');
 }
 checkRuinsFooting();
 return true;
}
function checkRuinsFooting() {
 if (!ruinsInterior || jump || changingRoom) return;
 if (ruinsInterior === 23) meetRuinsGuard();
 const loot = nearbyRuinsLoot();
 if (!loot) return;
 if (typeof loot.reward === 'number') {
  ruinsState.claimed.add(loot.key);
  awardGems(loot.reward);
  showInfo('+' + loot.reward + ' Gems');
 }
}
function ruinsNear(x, y, radiusX = 9, radiusY = 6) {
 return Math.abs(playerX - x) <= radiusX && Math.abs(playerY - y) <= radiusY;
}
function bridgeChestOpacity() {
 if (!ruinsState.bridge) return 0;
 return easeRuinsFade((ruinsElapsed - bridgeLoweredAt - bridgeChestDelay) / bridgeChestFadeDuration);
}
function easeRuinsFade(fraction) {
 const t = Math.max(0, Math.min(1, fraction));
 return t * t * (3 - 2 * t);
}
function availableRuinsLoot() {
 const drops = (ruinsLoot[ruinsInterior] ?? [])
  .map((drop, index) => ({ ...drop, key: drop.key ?? ruinsInterior + ':' + index }));
 if (ruinsInterior === 19 && ruinsState.hallPotion) {
  const {x, y} = ruinsState.hallPotion;
  drops.push({ x, y, reward: 'potion', key: 'hall-scorpion-potion' });
 }
 for (const {room, key} of ruinsGemRewards.values()) {
  const drop = ruinsState.gemDrops[key];
  if (room === ruinsInterior && drop) drops.push({...drop, key, reward: 5});
 }
 return drops.filter(drop => !ruinsState.claimed.has(drop.key) &&
   (drop.reward !== stoneArmor || bridgeChestOpacity() === 1) &&
   (drop.reward !== glyphFragment || (ruinsState.archiveScent && !ruinsState.archiveRestored)) &&
   (drop.reward !== stoneFang || ruinsState.pounce));
}
function nearbyRuinsLoot() {
 if (jump) return;
 return availableRuinsLoot().find(drop => (drop.height === undefined || standingHeight === drop.height) &&
  ruinsNear(drop.x, drop.y, typeof drop.reward === 'number' ? 5 : 8, typeof drop.reward === 'number' ? 5 : 7));
}
function collectRuinsLoot(drop) {
 const { reward, key } = drop;
 if (reward === 'star') {
  if (lifeStars >= 10) { showInfo('Life is already at its maximum.'); return; }
  ruinsState.claimed.add(key);
  lifeStars++;
  queueStorySave();
  presentAcquisition('life-star', 'Max Life +1 Star');
  draw(eyesClosed);
  return;
 }
 const item = reward === 'potion' ? potion : reward;
 const owned = inventory.get(item.id);
 if (!owned && inventory.size >= 16) { showInfo('Inventory full'); return; }
 ruinsState.claimed.add(key);
 if (reward === 'potion' || !owned) {
  document.dispatchEvent(new CustomEvent('game:inventory-change',{
   detail: { ...item, value: reward === 'potion' ? (owned?.value ?? 0) + 1 : 1 }
  }));
 }
 queueStorySave();
 presentAcquisition(item.id, item.label + ' obtained');
 draw(eyesClosed);
}
function canUseArchiveScent() {
 return ruinsInterior === 20 && scentUnlocked && !ruinsState.archiveRestored && !jump && !standingHeight &&
  !ruinsState.claimed.has(fragmentLootKey) && ruinsNear(archiveScentCorner.x, archiveScentCorner.y, 10, 8);
}
function canUseVigilScent() {
 return ruinsInterior === 22 && scentUnlocked && !ruinsState.pounce && !jump && !standingHeight &&
  ruinsNear(vigilScentSpot.x, vigilScentSpot.y, 11, 7);
}
function ruinsInteraction() {
 if (!ruinsInterior || jump) return;
 if (ruinsInterior === 19 && ruinsNear(80, 76, 16, 5) && nearbyRuinsLoot()?.reward !== 'potion') return { label: 'Builder mosaic', type: 'mosaic' };
 if (ruinsInterior === 20) {
  if (canUseArchiveScent()) return { label: 'Use Scent on Trail', type: 'scent' };
  const record = ruinsPanels.findIndex(({x, y}) => ruinsNear(x, y, 10, 7));
  if (record >= 0) {
   if (record === crackedPanel && !ruinsState.archiveRestored) {
    return { label: 'Cracked panel',
     type: inventory.has(glyphFragment.id) ? 'repair-panel' : 'inspect-crack' };
   }
   const read = ruinsState.records & (1 << record);
   return { label: ruinsPanelNames[record] + (read ? ' ✓' : ''), type: 'record', record };
  }
 }
 if (canUseVigilScent()) return { type: 'vigil-scent' };
 if (ruinsInterior === 22 && standingHeight === vigilLedgeHeight) {
  const chest = vigilChests.find(({x,y}) => ruinsNear(x, y, 8, 7));
  if (chest) return {label: 'Stone chest', type: chest.type};
 }
 if (ruinsInterior === 23 && ruinsNear(118, 54, 8, 5)) return { label: ruinsState.guardDefeated ? 'Lower bridge' : 'Bridge lever', type: 'bridge' };
 if (ruinsInterior === 23 && ruinsDoorOpen() && playerY <= 56 && ruinsNear(80, 51, 12, 6)) return { label: 'Look toward the Stronghold', type: 'vista' };
 const drop = nearbyRuinsLoot();
 if (!drop || typeof drop.reward === 'number') return;
 const label = drop.chest ? 'Small chest' : drop.reward === 'star' ? 'Life Star' : drop.reward === 'potion' ? 'Potion' : drop.reward.label;
 return { label, type: 'loot', drop };
}
function useRuinsInteraction(action) {
 switch (action.type) {
  case 'loot': collectRuinsLoot(action.drop); break;
  case 'mosaic':
   showDiscovery('A human hand lays the stone. A wolf’s paw steadies it.');
   break;
  case 'inspect-crack':
   showDiscovery("There’s a piece missing from this one…");
   break;
  case 'repair-panel':
   if (!inventory.has(glyphFragment.id) || ruinsState.archiveRestored) break;
   ruinsState.archiveRestored = true;
   archivePanelRepairedAt = ruinsElapsed;
   document.dispatchEvent(new CustomEvent('game:inventory-change', { detail: { id: glyphFragment.id, value: null } }));
   playPickupSound([392, 523, 659]);
   queueStorySave();
   break;
  case 'record': {
   const wasOpen = ruinsDoorOpen();
   ruinsState.records |= 1 << action.record;
   if (!wasOpen && ruinsDoorOpen()) ruinsOpenNotice();
   queueStorySave();
   showDiscovery(ruinsArchiveRecords[action.record]);
   break;
  }
  case 'scent':
   if (!ruinsState.archiveScent) archiveFragmentRevealedAt = ruinsElapsed;
   ruinsState.archiveScent = true;
   startScentHighlight(ruinsScent, ruinsElapsed);
   playPickupSound([329, 494], .04, .19);
   queueStorySave();
   break;
  case 'vigil-scent':
   startScentHighlight(ruinsScent, ruinsElapsed);
   playPickupSound([329, 494], .04, .19);
   break;
  case 'vigil-chest':
   if (ruinsState.pounce) { showInfo('The chest is empty.'); break; }
   if (!ruinsState.vigilChestOpen) {
    ruinsState.vigilChestOpen = true;
    playPickupSound([196, 294, 392], .055, .27);
   } else {
    ruinsState.pounce = true;
    renderStats();
    presentAcquisition('pounce', 'Pounce learned', () => showInfo(pounceControls()));
   }
   queueStorySave();
   break;
  case 'vigil-star':
   if (ruinsState.claimed.has(vigilLifeStarKey)) showInfo('The chest is empty.');
   else collectRuinsLoot({reward: 'star', key: vigilLifeStarKey});
   break;
  case 'bridge':
   if (!ruinsState.guardDefeated) { showInfo('The guard blocks the exit.'); break; }
   if (ruinsState.bridge) { showInfo('The bridge is down.'); break; }
   ruinsState.bridge = true;
   bridgeLoweredAt = ruinsElapsed;
   playAttackSound('crack');
   queueStorySave();
   ruinsOpenNotice();
   break;
  case 'vista':
   ruinsVista = true;
   showDiscovery('Beyond the broken bridge, the Stronghold rises above the trees.');
   break;
 }
 draw(eyesClosed);
}

function hurtInRuins(amount) {
 if (ruinsElapsed < ruinsHurtUntil) return;
 ruinsHurtUntil = ruinsElapsed + 950;
 playAttackSound('hit');
 document.dispatchEvent(new CustomEvent('game:damage', { detail: { amount } }));
 if (!defeated) return;
 cancelAnimationFrame(jumpFrame);
 jump = null;
 restoreFullHp();
 changeRoad('ruins-' + ruinsInterior);
}
function updateRuins(now) {
 const delta = ruinsFrame === null ? 0 : Math.min(50, now - ruinsFrame);
 ruinsFrame = now;
 if (ruinsInterior === 23) updateGuardCutscene(now);
 if (changingRoom || discoveryOpen || raisedItem) return;
 ruinsElapsed += delta;
 for (const enemy of ruinsEnemies[ruinsInterior] ?? []) {
  if (!enemy.hp) continue;
  if (updateRuinsScorpion(enemy, delta)) continue;
  if (enemy.bank) {
   roamRuinsScorpion(enemy, delta);
   continue;
  }
  const fraction = (ruinsElapsed % 3400) / 1700;
  const target = enemy.left + (enemy.right - enemy.left) * (1 - Math.abs(1 - fraction));
  const direction = Math.sign(target - enemy.x);
  if (Math.abs(target - enemy.x) >= 1) enemy.direction = direction;
  enemy.x += direction * Math.min(Math.abs(target - enemy.x), delta * .033);
 }
 if (ruinsInterior === 21 && ruinsState.pillars !== 3) updateRuinsHound(delta);
 if (ruinsInterior === 23) updateRuinsGuard(delta);

}
function roamRuinsScorpion(enemy, delta) {
 const y = enemy.bottom - 4;
 enemy.destination ??= {
  x: enemy.left + Math.random() * (enemy.right - enemy.left),
  y: enemy.bank.top + Math.random() * (enemy.bank.bottom - enemy.bank.top)
 };
 const dx = enemy.destination.x - enemy.x, dy = enemy.destination.y - y;
 const distance = Math.hypot(dx, dy);
 if (distance < 1) {
  enemy.destination = null;
  return;
 }
 if (Math.abs(dx) >= 1) enemy.direction = Math.sign(dx);
 const fraction = Math.min(1, delta * .036 / distance);
 enemy.x += dx * fraction;
 const nextY = y + dy * fraction;
 enemy.y = nextY - 4;
 enemy.bottom = nextY + 4;
}
function updateRuinsScorpion(enemy, delta) {
 const center = enemy.x + enemy.width / 2;
 switch (enemy.phase) {
  case 'patrol':
   if (ruinsElapsed < enemy.until || !ruinsNear(center, enemy.bottom - 4, enemy.large ? 31 : 19, 10)) return false;
   enemy.phase = 'windup';
   enemy.direction = playerX < center ? -1 : 1;
   enemy.until = ruinsElapsed + (enemy.large ? 580 : 460);
   playAttackSound('crack');
   break;
  case 'windup':
   if (ruinsElapsed >= enemy.until) {
    enemy.phase = 'sting';
    enemy.until = ruinsElapsed + 190;
    playAttackSound('swipe');
   }
   break;
  case 'sting': {
   const speed = enemy.large ? .11 : .065;
   const overshoot = enemy.bank ? 0 : 10;
   enemy.x = Math.max(enemy.left - overshoot, Math.min(enemy.right + overshoot, enemy.x + enemy.direction * delta * speed));
   const forward = (playerX - enemy.x - enemy.width / 2) * enemy.direction;
   if (forward >= 0 && forward <= enemy.width / 2 + 8 &&
    Math.abs(playerY - enemy.bottom + 4) <= 6 && (jump?.height ?? standingHeight) < 8) hurtInRuins(enemyHitHp);
   if (ruinsElapsed >= enemy.until) {
    enemy.phase = 'recover';
    enemy.until = ruinsElapsed + 670;
   }
   break;
  }
  case 'recover':
   if (ruinsElapsed >= enemy.until) {
    enemy.phase = 'patrol';
    enemy.until = ruinsElapsed + 420;
   }
   break;
 }
 return true;
}
function updateRuinsHound(delta) {
 const hound = ruinsHound;
 if (hound.phase === 'watch' && ruinsElapsed >= hound.until && Math.abs(playerY - 104) <= 12) {
  hound.direction = playerX < 80 ? -1 : 1;
  hound.phase = 'warn';
  hound.until = ruinsElapsed + 690;
  playAttackSound('crack');
 }
 if (hound.phase === 'warn' && ruinsElapsed >= hound.until) {
  hound.phase = 'charge';
  playAttackSound('swipe');
 }
 if (hound.phase === 'charge') {
  hound.x += hound.direction * delta * .13;
  const index = hound.direction < 0 ? 0 : 1;
  const pillar = ruinsPillars[index];
  if (!(ruinsState.pillars & (1 << index)) && hound.x < pillar.x + pillar.width && hound.x + hound.width > pillar.x) {
   ruinsState.pillars |= 1 << index;
   playAttackSound('crack');
   if (ruinsState.pillars === 3) {
    houndBreakAt = ruinsGateAt = ruinsElapsed;
    playPickupSound([392, 523, 659]);
    showInfo('Both pillars fell. Cross the rubble in the center.');
   } else showInfo('One pillar down. Bait the hound to the other side.');
   queueStorySave();
   hound.phase = 'return';
  } else if (hound.x <= 16 || hound.x >= 124) hound.phase = 'return';
  if (objectAt(playerX, playerY, false, jump?.height ?? standingHeight, [hound])) hurtInRuins(bossHitHp);
 }
 if (hound.phase === 'return' && ruinsState.pillars !== 3) {
  hound.x += Math.sign(70 - hound.x) * Math.min(Math.abs(70 - hound.x), delta * .05);
  if (hound.x === 70) {
   hound.phase = 'watch';
   hound.until = ruinsElapsed + 760;
  }
 }
}
function pounceControls() {
 return 'Face the gap and double-tap ' + actionKey('B') + ' to Pounce.';
}
function startPounce() {
 if (!ruinsState.pounce) return;
 if (jump.pounce) { queuePounceDive(); return; }
 if (jump.elapsed > 500) return;
 jump.direction = heldDirection ?? Array.from(heldKeys).at(-1) ?? jump.direction ?? facing;
 jump.pounce = true;
 jump.elapsed = 0;
 jump.distance = 0;
 jump.launchHeight = jump.height;
 playAttackSound('swipe');
}
function drawRuinsGate() {
 const open = ruinsDoorOpen();
 drawInteriorDoor(44, open);
 if (open) {
  const motion = Math.max(0, 1 - (ruinsElapsed - ruinsGateAt) / 470);
  if (motion > 0) {
   const length = Math.ceil(11 * motion);
   rect(73, 34, 14, length, 1);
   for (let x = 75; x < 87; x += 3) rect(x, 34, 1, length, 2);
  }
  rect(70, 39, 2, 6, 3); rect(88, 39, 2, 6, 3);
  rect(75, 47, 10, 2, 3); rect(77, 50, 6, 1, 2);
 }
 if (ruinsInterior !== 20) return;
 for (let index = 0; index < ruinsPanelNames.length; index++) {
  const x = [55, 62, 93, 100][index];
  rect(x, 37, 5, 5, 0);
  rect(x + 1, 38, 3, 3, ruinsState.records & (1 << index) ? 3 : 1);
 }
}
function drawRuinsFeatures() {
 switch (ruinsInterior) {
  case 19: drawBuildersHall(); break;
  case 20: drawGlyphArchive(); break;
  case 21: drawRuinsCistern(); break;
  case 22: drawWolfsVigil(); break;
  case 23: drawBrokenBridge(); break;
 }
 for (const [index, drop] of (ruinsLoot[ruinsInterior] ?? []).entries()) {
  if (!drop.chest) continue;
  const opacity = drop.reward === stoneArmor ? bridgeChestOpacity() : 1;
  if (opacity === 0) continue;
  const key = drop.key ?? ruinsInterior + ':' + index;
  ctx.save();
  ctx.globalAlpha *= opacity;
  drawRuinsChest(drop.x, drop.y, 16, ruinsState.claimed.has(key), false);
  ctx.restore();
 }
 for (const drop of availableRuinsLoot()) {
  if (!drop.chest && drop.height === undefined) drawRuinsLoot(drop);
 }
 drawRuinsLanding();
}
function drawRuinsLanding() {
 if (!ruinsLanding || ruinsElapsed - ruinsLanding.at >= 360) return;
 const {x, y, at} = ruinsLanding;
 const spread = Math.floor((ruinsElapsed - at) / 30) + 2;
 for (const direction of [-1, 1]) {
  rect(x + spread * direction, y + 1, 3, 1, 2);
  rect(x + (spread + 3) * direction, y - 1, 2, 1, spread < 8 ? 3 : 1);
 }
}
function drawBuildersHall() {
 rect(50, 53, 60, 20, 0); rect(52, 54, 56, 17, 1);
 rect(60, 62, 13, 3, 3); rect(72, 60, 4, 8, 3);
 rect(75, 62, 11, 7, 2); rect(76, 62, 8, 1, 3);
 for (const [x, y] of [[88, 62], [91, 59], [95, 60], [98, 63]]) rect(x, y, 3, 4, 3);
 rect(85, 65, 12, 3, 3); rect(81, 54, 2, 6, 0); rect(82, 59, 3, 2, 0);
 for (const [x, width] of [[12, 57], [92, 56]]) {
  rect(x, 87, width, 17, 0); rect(x, 87, width, 3, 1); rect(x, 101, width, 3, 1);
  for (let i = x + 3; i < x + width - 2; i += 9) rect(i, 88, 4, 1, 2);
 }
 rect(69, 90, 23, 11, 0); rect(72, 93, 16, 4, 1);
 for (const y of [87, 103]) {
  rect(76, y, 9, 1, 3); rect(79, y + 1, 3, 1, 2);
 }
 if (ruinsElapsed < 900 && !ruinsDoorOpen()) {
  for (const [index, sign] of [-1, 1].entries()) {
   const t = Math.min(1, Math.max(0, (ruinsElapsed - index * 110) / 700));
   if (t === 1) continue;
   const x = 78 + Math.round(sign * t * 36), y = 125 - Math.round(t * 23);
   rect(x - 3, y, 7, 3, 0); rect(x + sign * 2, y - 1, 3, 2, 1);
   rect(x - sign * 5, y + 2, 4, 1, 1); rect(x + sign * 4, y, 1, 1, 3);
  }
 }
}
function drawGlyphArchive() {
 for (let index = 0; index < 36; index++) {
  const angle = index * Math.PI / 18;
  const x = 80 + Math.round(Math.cos(angle) * 36), y = 88 + Math.round(Math.sin(angle) * 24);
  rect(x - 1, y, 3, 1, index % 3 ? 1 : 3);
 }
 for (const [index, {x, y}] of ruinsPanels.entries()) {
  rect(x - 12, y - 12, 24, 12, 0);
  rect(x - 10, y - 11, 20, 9, 1);
  if (index !== crackedPanel || ruinsState.archiveRestored) {
   drawArchiveGlyph(index, x - 10, y - 11);
  } else {
   rect(x - 6, y - 9, 5, 2, 2);
   rect(x - 1, y - 11, 2, 3, 0);
   rect(x, y - 8, 3, 2, 0);
   rect(x + 2, y - 6, 2, 4, 0);
   rect(x + 4, y - 11, 6, 5, 0);
   rect(x + 4, y - 6, 2, 1, 3);
  }
  rect(x - 3, y - 1, 6, 1, ruinsState.records & (1 << index) ? 3 : 2);
 }
 const progress = (ruinsElapsed - archivePanelRepairedAt) / 430;
 if (progress < 1) {
  const {x, y} = ruinsPanels[crackedPanel];
  ctx.save();
  ctx.globalAlpha *= 1 - progress;
  for (const [dx, dy] of [[-10,-5],[-6,2],[-2,-7],[4,1],[8,-5],[12,0]]) {
   rect(Math.round(x + 2 + dx * progress), Math.round(y - 6 + dy * progress + 5 * progress ** 2), 1, 1, 2);
  }
  ctx.restore();
 }
}
function drawGlyphFragment(x, y) {
 rect(x - 4, y - 5, 8, 4, 0);
 rect(x - 2, y - 7, 6, 2, 0);
 rect(x - 2, y - 5, 5, 3, 2);
 rect(x, y - 6, 3, 1, 3);
}
function drawArchiveGlyph(index, x, y) {
 switch (index) {
  case 0:
   rect(x, y + 3, 7, 2, 3); rect(x + 13, y + 3, 7, 2, 2);
   rect(x + 6, y + 1, 3, 6, 3); rect(x + 10, y + 2, 4, 5, 2); rect(x + 8, y + 4, 4, 3, 3);
   break;
  case 1:
   drawRuinsPaw(x + 1, y + 4, 3);
   rect(x + 12, y + 2, 7, 6, 2); rect(x + 14, y, 3, 2, 3); rect(x + 14, y + 4, 3, 4, 0);
   for (const offset of [7, 9, 11]) rect(x + offset, y + 6, 1, 1, 3);
   break;
  case 2:
   rect(x + 7, y, 1, 3, 3); rect(x + 10, y, 1, 3, 3); rect(x + 13, y, 1, 3, 3);
   rect(x + 7, y + 3, 7, 1, 3); rect(x + 5, y + 6, 11, 1, 2);
   rect(x + 5, y + 6, 1, 3, 3); rect(x + 15, y + 6, 1, 3, 3);
   break;
  case crackedPanel:
   rect(x + 3, y + 1, 1, 6, 3); rect(x + 4, y + 1, 5, 1, 3); rect(x + 8, y + 3, 1, 4, 2);
   rect(x + 12, y + 4, 1, 4, 3); rect(x + 16, y + 3, 1, 5, 3);
   rect(x + 13, y + 2, 1, 1, 2); rect(x + 17, y + 1, 1, 1, 2);
   break;
 }
}
function drawRuinsCistern() {
 rect(12, 78, 136, 19, 0); rect(12, 79, 136, 2, 1); rect(12, 94, 136, 2, 1);
 for (let x = 15; x < 146; x += 8) {
  rect(x, 81 + x % 4, 5, 1, 1); rect(x, 91, 2, 1, 1);
 }
 if (ruinsState.pillars === 3) {
  for (let i = 0; i < 5; i++) {
   const x = 65 + i * 6, y = 81 + i % 2 * 3;
   rect(x, y, 8, 15, 1); rect(x + 1, y, 6, 13, 2); rect(x + 2, y, 5, 1, 3);
  }
 }
 if (ruinsState.pillars === 3) {
  rect(71, 99, 18, 1, 3); rect(75, 98, 10, 1, 2);
 }
 if (ruinsElapsed - houndBreakAt < 720) {
  const progress = (ruinsElapsed - houndBreakAt) / 720;
  const center = ruinsHound.x + 10;
  for (const [dx, dy] of [[-18, -3], [-8, -7], [7, -5], [18, 2]]) {
   const y = 108 + dy * progress - 19 * Math.sin(Math.PI * progress);
   rect(center + dx * progress, y, 4, 3, dy < -3 ? 2 : 1);
  }
 }
 rect(21, 103, 118, 1, 1);
 for (const [index, pillar] of ruinsPillars.entries()) {
  if (ruinsState.pillars & (1 << index)) {
   rect(pillar.x - 3, 107, 16, 4, 0);
   rect(pillar.x, 104, 5, 4, 2); rect(pillar.x + 7, 106, 7, 2, 1);
  }
 }
 if (ruinsState.pillars !== 3 && ruinsHound.phase === 'warn') {
  const end = ruinsHound.direction < 0 ? 18 : 140;
  for (let x = 80; Math.abs(end - x) > 4; x += ruinsHound.direction * 5) {
   rect(x, 105, 2, 1, Math.floor(ruinsElapsed / 95) % 2 ? 1 : 3);
  }
 }
}
const vigilSprayPaint = [
 '.11......1..',
 '1231....12.1',
 '.2331..1321.',
 '..231..231..',
 '...231231...',
 '..1.3331....',
 '...23331.1..',
 '..233.231...',
 '.123...231..',
 '.231.1..331.',
 '.11......21.',
 '...1......1.'
];
function drawWolfsVigil() {
 const centerX = 80, centerY = 88, radius = 28;
 for (let dy = -radius; dy <= radius; dy++) {
  const span = Math.floor(Math.sqrt(radius ** 2 - dy ** 2));
  rect(centerX - span, centerY + dy, 2 * span + 1, 1, 1);
 }
 for (let index = 0; index < 80; index++) {
  const angle = index * Math.PI / 40;
  const x = centerX + Math.round(Math.cos(angle) * 26);
  const y = centerY + Math.round(Math.sin(angle) * 26);
  rect(x, y, 2, 1, index % 8 === 0 ? 3 : 2);
 }
 // Both figures face the joined hands at the center of the mosaic.
 rect(61, 100, 13, 2, 0); rect(88, 100, 12, 2, 0);
 rect(63, 87, 9, 12, 0); rect(65, 88, 6, 10, 2);
 rect(61, 89, 4, 5, 0); rect(67, 97, 2, 3, 1);
 rect(62, 77, 13, 9, 0); rect(63, 74, 3, 7, 0); rect(67, 75, 3, 6, 0);
 rect(64, 79, 7, 6, 2); rect(70, 81, 6, 3, 2); rect(69, 79, 2, 1, 3);
 rect(70, 89, 6, 3, 2); rect(74, 90, 6, 2, 3);
 rect(90, 87, 9, 12, 0); rect(91, 88, 7, 10, 2);
 rect(90, 77, 9, 10, 0); rect(91, 78, 7, 7, 3); rect(91, 78, 6, 2, 2);
 rect(90, 81, 2, 2, 3); rect(92, 81, 1, 1, 0);
 rect(86, 89, 6, 3, 2); rect(80, 90, 7, 2, 3); rect(79, 89, 3, 4, 3);
 ctx.save();
 ctx.fillStyle = '#9b4d42';
 const opacity = ctx.globalAlpha;
 const coverage = [.27, .62, .94];
 for (const [dy, row] of vigilSprayPaint.entries()) {
  for (const [dx, pixel] of [...row].entries()) {
   if (pixel === '.') continue;
   ctx.globalAlpha = opacity * coverage[Number(pixel) - 1];
   ctx.fillRect(63 + dx, 76 + dy, 1, 1);
  }
 }
 ctx.restore();
}
function drawVigilPlatform(platform) {
 const {x, width, bottom, height, seatY} = platform;
 rect(x + 1, seatY + 3, width, height + 7, 0);
 rect(x, seatY - 3, width, 7, 0);
 rect(x + 1, seatY - 3, width - 2, 5, 2);
 rect(x + 3, seatY - 3, width - 6, 1, 3);
 rect(x + 2, seatY + 4, width - 3, bottom - seatY - 3, 1);
 for (let y = seatY + 7; y < bottom - 1; y += 6) rect(x + 3, y, width - 5, 1, 0);
}
function drawRuinsChest(x, y, width, open, glow, emblem = null) {
 const left = x - Math.floor(width / 2);
 const lid = open ? -13 : -10;
 if (glow) {
  ctx.save();
  ctx.globalAlpha *= .30;
  rect(left - 5, y - 18, width + 10, 15, 3);
  ctx.restore();
  rect(x - 2, y - 17, 4, 5, 3);
 }
 rect(left, y - 8, width, 8, 0);
 rect(left + 1, y - 6, width - 2, 5, 2);
 rect(left, y + lid, width, open ? 6 : 4, 0);
 rect(left + 1, y + lid + 1, width - 2, 2, glow ? 3 : 2);
 if (open) rect(left + 2, y - 7, width - 4, 2, glow ? 3 : 0);
 else if (!emblem) rect(x - 1, y - 7, 3, 3, 3);
 if (emblem === 'paw') drawRuinsPaw(x - 2, y - 5, 3);
 if (emblem === 'star') {
  rect(x, y - 7, 1, 6, 3); rect(x - 2, y - 5, 5, 2, 3);
 }
}
function drawRuinsPaw(x, y, shade) {
 rect(x, y, 4, 3, shade); rect(x, y - 2, 1, 1, shade);
 rect(x + 2, y - 3, 1, 2, shade); rect(x + 4, y - 2, 1, 1, shade);
}
function drawBrokenBridge() {
 drawGuardMemorial();
 drawRuinsGuardWave();
 rect(12, ruinsGap.top, 136, ruinsGap.bottom - ruinsGap.top + 1, 0);
 rect(12, ruinsGap.top, 136, 2, 1);
 rect(12, ruinsGap.bottom - 1, 136, 2, 1);
 for (let x = 15; x < 145; x += 8) {
  rect(x, 72 + x % 7, 5, 2, 1); rect(x, 101 - x % 5, 4, 2, 1);
 }
 for (const y of [66, 109]) {
  rect(70, y, 21, 3, 1); rect(76, y, 9, 1, 3);
  rect(68, y - 3, 3, 6, 3); rect(90, y - 3, 3, 6, 3);
 }
 if (ruinsState.guardDefeated && !ruinsState.bridge) {
  rect(110, 44, 2, 2, 3); rect(124, 44, 2, 2, 3);
 }
 if (ruinsState.bridge) {
  rect(70, ruinsGap.top, 21, 39, 1);
  for (let y = 70; y <= 106; y += 4) rect(72, y, 17, 2, 2);
  rect(70, ruinsGap.top, 2, 39, 3); rect(89, ruinsGap.top, 2, 39, 3);
 }
 rect(112, 47, 12, 6, 0); rect(113, 48, 10, 4, 2);
 rect(ruinsState.bridge ? 121 : 115, 43, 2, 7, 3);
 if (!ruinsState.bridge) {
  rect(72, 30, 16, 2, 2); rect(72, 32, 2, 10, 2); rect(86, 32, 2, 10, 2);
 }
}
function drawStrongholdHorizon() {
 rect(47, 21, 66, 23, 0); rect(50, 23, 60, 17, 2);
 rect(50, 38, 60, 2, 1);
 for (const [x, top, width] of [[65, 30, 9], [74, 28, 13], [87, 31, 9]]) {
  rect(x, top, width, 10, 0);
  for (let tooth = x; tooth < x + width - 1; tooth += 3) rect(tooth, top - 2, 2, 2, 0);
 }
 rect(79, 34, 2, 5, 3); rect(76, 44, 8, 2, 2);
}
function drawStrongholdVista() {
 rect(0, 0, 160, 144, 1);
 rect(0, 0, 160, 66, 2);
 rect(111, 16, 14, 11, 3); rect(114, 14, 8, 15, 3);
 for (let y = 0; y < 26; y++) {
  rect(0, 59 - y, 36 - y, 1, 1);
  rect(124 + y, 59 - y, 36 - y, 1, 1);
 }
 rect(43, 48, 74, 24, 0);
 for (const [x, top, width] of [[38, 38, 15], [59, 32, 15], [75, 22, 15], [92, 32, 15], [110, 38, 15]]) {
  rect(x, top, width, 72 - top, 0);
  rect(x + 1, top + 2, 2, 66 - top, 1);
  for (let tooth = x; tooth < x + width - 2; tooth += 4) rect(tooth, top - 3, 2, 3, 0);
  rect(x + 7, top + 9, 2, 4, 3);
 }
 rect(77, 57, 11, 16, 1); rect(79, 60, 7, 13, 2);
 for (let i = 0; i < 19; i++) {
  const x = i * 17 % 154, y = 67 + i * 9 % 24;
  rect(x, y - 4, 3, 10, 0); rect(x - 2, y, 7, 7, 0);
 }
 for (let y = 74; y < 144; y++) {
  const width = 5 + Math.floor((y - 74) / 2);
  rect(83 - width, y, width * 2, 1, y % 4 ? 2 : 1);
 }
 for (const side of [0, 132]) {
  rect(side, 83, 28, 61, 0); rect(side + 2, 83, 23, 4, 1);
  rect(side + 4, 91, 18, 2, 1);
 }
 ctx.save();
 ctx.translate(8, 3);
 drawBack(false, false, equipment.get('body'));
 drawFeet();
 ctx.restore();
}
function drawRuinsLoot({ x, y, reward }) {
 if (typeof reward === 'number') drawGroundGem({ x, y, available: true });
 else if (reward === 'potion') drawMillDrop({ x, y, item: potion });
 else if (reward === glyphFragment) {
  const opacity = Math.min(1, Math.max(0, (ruinsElapsed - archiveFragmentRevealedAt) / 420));
  ctx.save();
  ctx.globalAlpha *= opacity;
  drawGlyphFragment(x, y);
  ctx.restore();
 }
 else if (reward === 'star') {
  ctx.save(); traceLifeStar(x, y - 3, 4); ctx.fillStyle = colors[3]; ctx.strokeStyle = colors[0];
  ctx.fill(); ctx.stroke(); ctx.restore();
 } else drawRuinsGear(reward, x, y - 5);
}
const stoneHelmProfile = [
 '....00000000....',
 '..00333322200...',
 '.0322222222220..',
 '.03222222222200.',
 '032222223333220.',
 '0322222322222220',
 '0322222300000000',
 '0322222303000000',
 '0322222322222220',
 '0322111322212210',
 '.032011322212210',
 '.03221132221210.',
 '..032222222210..',
 '...0000000000...'
];
const stoneHelmFacings = {
 ArrowDown: [
  '....00000000....',
  '..003333333300..',
  '.03222233222230.',
  '0322222332222230',
  '0322222332222230',
  '0322333333332230',
  '0322000330002230',
  '0322030330302230',
  '0322222332222230',
  '0322212321222230',
  '0322212321222230',
  '.03221232122230.',
  '..032223222230..',
  '...0000000000...'
 ],
 ArrowUp: [
  '....00000000....',
  '..003333333300..',
  '.03222233222230.',
  '0322222332222230',
  '0322222332222230',
  '0322222332222230',
  '0322222332222230',
  '0322222332222230',
  '0322222332222230',
  '0322211111122230',
  '0322222222222230',
  '.03222222222230.',
  '..011111111110..',
  '...0000000000...'
 ],
 ArrowRight: stoneHelmProfile,
 ArrowLeft: stoneHelmProfile.map(row => [...row].reverse().join(''))
};
const stoneShieldProfile = [
 '..0000..',
 '.032220.',
 '03222220',
 '03233220',
 '03233220',
 '03232220',
 '03222220',
 '.032220.',
 '..0320..',
 '...00...'
];
const stoneShieldFacings = {
 ArrowDown: ['.000000000.','03222222230','03222322230','03223332230','03222322230',
  '03222322230','.032232230.','..0322230..','...03230...','....000....'],
 ArrowUp: ['.000000000.','02222222220','02122221220','02111111220','02122221220',
  '02122221220','.022222220.','..0222220..','...02220...','....000....'],
 ArrowRight: stoneShieldProfile,
 ArrowLeft: stoneShieldProfile.map(row => [...row].reverse().join(''))
};
const lucaFrontHead = [
 '.....000....', '...0022200..', '..022221110.', '.0222111110.',
 '.0211111110.', '.0111113310.', '.0113133330.', '.0131333330.',
 '..03333330..', '..03323330..', '..03233230..', '...022220...', '....0330....'
];
const lucaBackHead = [
 '......0.....', '..0..0200...', '.020022110..', '00222221110.',
 '.0221111110.', '00211211110.', '.0112111110.', '.0111111120.',
 '..011111130.', '..01111130..', '...011110...', '....0330....'
];
const lucaProfileHead = [
 '.....0......', '..0.0200....', '.02022110...', '0022211110..',
 '.0221111130.', '00211113330.', '.0111133330.', '.01123333330',
 '..012333330.', '..01133320..', '...0122220..', '....02220...', '....0330....'
];
const lucaBackCloak = [
 '.....000000000...',
 '....02222222220..',
 '...022111112230..',
 '...021111122310..',
 '..022111122310...',
 '..021111223110...',
 '.0221112231110...',
 '.021112231110....',
 '0221122311110....',
 '021122311110.....',
 '02223110000......',
 '.03000...........'
];
const lucaSideCloak = [
 '.....00000...',
 '....0222210..',
 '...02211110..',
 '...02111110..',
 '..02211110...',
 '..02111110...',
 '.02211110....',
 '.02111110....',
 '02211000.....',
 '03000........'
];
const stoneCuirassFront = [
 '.23....32.',
 '0233333320',
 '0232222320',
 '.02322320.',
 '.02233220.',
 '..011110..'
];
const stoneCuirassBack = [
 '.23....32.',
 '0232222320',
 '0232332320',
 '.02233220.',
 '.02322320.',
 '.02222220.',
 '..011110..'
];
// Luca's left-facing profile mirrors the entire right-facing sprite, including its plates.
const stoneCuirassProfile = [
 '.23.2...',
 '0233322.',
 '02322230',
 '01232220',
 '.0223220',
 '..01110.'
];
// Both profiles use the same coordinate frame as Luca's mirrored side sprites.
const strawArmorFacings = {
 ArrowDown: [
  '.02....20.', '0122222210', '0212121210',
  '.02121220.', '.01222120.', '..011110..'
 ],
 ArrowUp: [
  '.02....20.', '0121111210', '0212221210',
  '.01212120.', '.02121210.', '.01222210.', '..011110..'
 ],
 ArrowRight: [
  '.02..2..', '0122212.', '02121120',
  '01212210', '.0122210', '..01110.'
 ],
 ArrowLeft: [
  '.02..2..', '0122221.', '02122120',
  '01221120', '.0121210', '..01110.'
 ]
};
function drawStoneEquipment(rows, x, y) {
 const left = x - Math.floor(rows[0].length / 2);
 for (const [dy, row] of rows.entries()) {
  for (const [dx, pixel] of [...row].entries()) {
   if (pixel !== '.') rect(left + dx, y + dy, 1, 1, Number(pixel));
  }
 }
}
function drawEquippedStoneHelm(x, y, direction) {
 drawStoneEquipment(stoneHelmFacings[direction], x, y - 24);
}
function drawEquippedStoneShield(x, y, direction) {
 const armOffset = {ArrowDown: -8, ArrowUp: 8, ArrowLeft: -5, ArrowRight: 5};
 drawStoneEquipment(stoneShieldFacings[direction], x + armOffset[direction], y - 13);
}
function drawRuinsGear(item, x, y) {
 if (item === stoneHelm) {
  rect(x - 6, y - 4, 12, 9, 0); rect(x - 4, y - 5, 8, 7, 2);
  rect(x - 3, y - 4, 6, 1, 3); rect(x - 1, y - 1, 6, 2, 0); rect(x - 5, y + 2, 2, 3, 2);
 } else if (item === stoneShield) {
  rect(x - 6, y - 5, 12, 9, 0); rect(x - 4, y - 4, 8, 7, 2);
  rect(x - 3, y + 3, 6, 2, 0); rect(x - 3, y - 3, 6, 1, 3); rect(x - 1, y - 2, 2, 5, 3);
 } else if (item === stoneArmor) {
  rect(x - 7, y - 5, 14, 8, 0); rect(x - 5, y - 6, 10, 11, 2);
  rect(x - 4, y - 4, 8, 1, 3); rect(x - 4, y, 8, 1, 1); rect(x - 4, y + 3, 8, 1, 1);
 } else {
  rect(x - 5, y - 5, 10, 1, 0); rect(x - 3, y - 3, 6, 3, 0);
  rect(x - 2, y - 2, 4, 2, 3); rect(x, y, 3, 2, 2); rect(x + 1, y + 2, 1, 2, 3);
 }
}
function drawRuinsActorsInDepth(blink) {
 if (jump?.pounce && jump.direction) {
  const [dx, dy] = directions.get(jump.direction);
  const y = playerY - Math.round(jump.height) - 8;
  for (const offset of [12, 17, 23]) {
   rect(playerX - dx * offset, y - dy * offset, dx ? 3 : 1, dy ? 3 : 1, offset === 12 ? 3 : 2);
  }
 }
 const actors = [{ bottom: playerY, draw: () => drawTraveler(blink) }];
 for (const object of ruinsInteriorObjects()) actors.push({ bottom: object.platform ? object.y : object.bottom, draw: () => drawRuinsObject(object) });
 if (ruinsInterior === 22) {
  for (const chest of vigilChests) {
   const pounceChest = chest.type === 'vigil-chest';
   const open = pounceChest ? ruinsState.vigilChestOpen || ruinsState.pounce : ruinsState.claimed.has(vigilLifeStarKey);
   actors.push({bottom: chest.y, draw: () =>
    drawRuinsChest(chest.x, chest.y - vigilLedgeHeight, 20, open, pounceChest && open && !ruinsState.pounce, chest.emblem)});
  }
  for (const drop of availableRuinsLoot()) {
   if (drop.height !== undefined) actors.push({bottom: drop.y, draw: () => drawRuinsLoot({...drop, y: drop.y - drop.height})});
  }
 }
 for (const enemy of ruinsEnemies[ruinsInterior] ?? []) {
  if (enemy.hp || ruinsElapsed - enemy.hitAt < 650) {
   actors.push({ bottom: enemy.bottom, draw: () => drawRuinsScorpion(enemy) });
  }
 }
 if (ruinsInterior === 21 && ruinsState.pillars !== 3) {
  actors.push({ bottom: ruinsHound.bottom, draw: drawRuinsHound });
 }
 if (ruinsInterior === 23) actors.push({ bottom: ruinsGuard.bottom, draw: drawRuinsGuard });
 for (const actor of actors.sort((a, b) => a.bottom - b.bottom)) actor.draw();
}
function drawRuinsObject(object) {
 if (object.platform) { drawVigilPlatform(object); return; }
 const { x, width, bottom: y, height } = object;
 rect(x, y - height, width, height + 1, 0); rect(x + 1, y - height + 1, width - 2, height - 2, 2);
 rect(x + 2, y - height + 1, width - 4, 2, 3); rect(x + width - 3, y - height + 3, 2, height - 5, 1);
 if (ruinsInterior === 21) {
  rect(x + 3, y - height + 5, 2, 5, 0); rect(x + 4, y - height + 9, 3, 2, 0); rect(x + 6, y - height + 10, 1, 6, 0);
 }
}
function drawRuinsScorpion(enemy) {
 const x = Math.round(enemy.x + enemy.width / 2), y = Math.round(enemy.bottom);
 if (!enemy.hp) {
  const spread = Math.floor((ruinsElapsed - enemy.hitAt) / 115);
  rect(x - 5 - spread, y - 1, 4, 2, 0); rect(x, y - 4, 3, 3, 2);
  rect(x + 4 + spread, y + 1, 3, 2, 1);
  return;
 }
 const step = enemy.phase === 'patrol' || enemy.phase === 'sting' ? Math.floor(ruinsElapsed / 90) % 2 : 0;
 const winding = enemy.phase === 'windup';
 const stinging = enemy.phase === 'sting';
 ctx.save();
 ctx.translate(x, y);
 ctx.scale(enemy.direction, 1);
 // Alternating legs, two open pincers, and a segmented tail curling over the shell.
 for (const [index, legX] of [-5, -2, 1, 4].entries()) {
  const stride = (step + index) % 2;
  rect(legX - stride, -3, 2, 4, 0);
  rect(legX + stride, -10, 2, 4, 0);
 }
 rect(-7, -8, 14, 6, 0); rect(-6, -7, 12, 4, enemy.large ? 3 : 2);
 for (const segment of [-4, -1, 2]) rect(segment, -7, 1, 4, 1);
 rect(5, -7, 1, 1, 3); rect(5, -4, 1, 1, 3);
 for (const clawY of [-9, -4]) {
  rect(6, clawY + 1, 3, 2, 0);
  rect(8, clawY, 3, 4, 0);
  rect(9, clawY, 3, 1, 3); rect(9, clawY + 3, 3, 1, 2);
 }
 const crown = winding ? -17 : -14;
 rect(-9, crown + 4, 3, -crown - 8, 0);
 rect(-8, crown + 4, 1, -crown - 9, 2);
 rect(-8, crown + 1, 3, 4, 2);
 rect(-6, crown, 6, 3, 0); rect(-5, crown, 5, 1, 3);
 if (stinging) {
  rect(-3, -14, 11, 2, 2); rect(7, -13, 4, 2, 3); rect(10, -11, 2, 3, 3);
 } else {
  rect(0, crown + 1, 3, 2, 2);
  rect(2, crown + 2, 2, 3, winding ? 3 : 0);
 }
 if (winding) {
  const pulse = Math.floor(ruinsElapsed / 90) % 2;
  rect(13, -5, 2, 1, pulse ? 3 : 1);
  rect(17, -5, 2, 1, pulse ? 3 : 1);
 }
 if (ruinsElapsed - enemy.hitAt < 110) {
  rect(2, -12, 5, 1, 3); rect(4, -14, 1, 5, 3);
 }
 ctx.restore();
}
function drawRuinsHound() {
 drawRuinsWolfShape(Math.round(ruinsHound.x + 10), ruinsHound.bottom, ruinsHound.direction, 2);
}
function drawRuinsWolfShape(x, y, direction, shade) {
 ctx.save();
 ctx.translate(x, y); ctx.scale(direction, 1);
 rect(-10, -10, 18, 8, 0); rect(-8, -10, 16, 5, shade);
 rect(5, -14, 7, 8, 0); rect(7, -15, 2, 7, shade); rect(9, -12, 4, 4, shade);
 rect(12, -10, 4, 2, shade); rect(10, -11, 2, 1, 3);
 rect(-15, -11, 7, 2, shade);
 rect(-7, -4, 3, 4, shade); rect(5, -4, 3, 4, shade);
 ctx.restore();
}
function drawRuinsScent() {
 const alpha = scentShadeAt(ruinsElapsed, ruinsScent);
 if (alpha <= 0) return;
 if (alpha > 0) {
  ctx.save(); ctx.globalAlpha = alpha * .74;
  rect(0, 0, 160, 144, 0); ctx.restore();
 }
 const trail = ruinsInterior === 20
  ? archiveScentTrail
  : [[75,121], [64,123], [52,124], [39,122], [28,117],
     ...vigilPlatforms.slice(0, 4).map(({x, width, seatY}) => [x + Math.floor(width / 2), seatY - 1])];
 ctx.save();
 ctx.globalAlpha *= alpha / .67;
 for (const [x, y] of trail) drawRuinsPaw(x - 2, y - 1, 3);
 ctx.restore();
}

const ruinsGuardHp = 50;
const guardWindupDuration = 790, guardRecoveryDuration = 2240, guardBracedRecoveryDuration = 2540;
const guardFallX = 102, guardFallY = 61, guardRetreatDistance = 4, guardStepDuration = 680;
const guardRetreatLines = [4, 8, 14];
const guardMemoryFade = 1100, guardMemoryDuration = 18100;
const innRitualPowers = [
 { id: 'scent', start: 1600, end: 3900, sourceX: 69, x: 54, y: 51 },
 { id: 'pounce', start: 3900, end: 6200, sourceX: 92, x: 108, y: 53 },
 { id: 'transformation', start: 6200, end: 8900, sourceX: 81, x: 81, y: 39 }
];
const innMemoryWarning = 8900, innMemoryApproach = 11000, innMemoryStab = 12800;
const innMemoryDrop = 13500, innMemoryEscape = 14000, innMemoryClear = 16800;
const ruinsGuard = { id: 'ceremonial-guard', x: 101, y: 52, bottom: 63, width: 13, height: 17,
 hp: ruinsGuardHp, phase: 'idle', direction: -1, until: 0, wave: null, line: 0, hammerStrikes: 0, hasDagger: false,
 stepAt: null, retreatProgress: 0, memoryAt: null, hitAt: -Infinity, laneY: 60, braced: false };
const guardInterrogation = [
 'Luca: How do you know my name?',
 'Guard: It was in the ledger. I—I heard them say it when they brought you down.',
 'Luca: Brought me where?',
 'Guard: Under the Stronghold. Please. I only kept the door.',
 'Luca: What was behind that door?',
 'Guard: They strapped you down by the fireplace. You kept asking them to let you up.',
 'Luca: What did you do to me?',
 'Guard: We were trying to take it out of you.',
 'Luca: Take what?',
 'Guard: Your power. You’re a werewolf, Luca. You were one when they brought you in.',
 'Luca: What did the Emperor want with it?',
 'Guard: To put it in his own people. He said once humans had it, we’d never need the wolves again.',
 'Luca: And you thought I was dead?',
 'Guard: You stopped breathing. I—I watched them unstrap you.',
 'Luca: What about the Inn?',
 'Guard: What Inn? Oh, that is not an inn, that is the ceremony room.',
 'Guard: They left you for dead as the wolves came in to save you. None survived.',
 'Guard: I’m sorry. Please don’t kill me.'
];
function resetRuinsGuard() {
 const spared = ruinsState.guardDefeated;
 Object.assign(ruinsGuard, {x: spared ? guardFallX + guardRetreatDistance * guardRetreatLines.length : 101,
  y: 52, bottom: spared ? guardFallY : 63, hp: spared ? 0 : ruinsGuardHp,
  phase: spared ? 'spared' : 'idle', direction: -1, until: 0, wave: null, line: 0,
  hammerStrikes: spared ? 3 : 0, hasDagger: false, stepAt: null, retreatProgress: 0, memoryAt: null,
  hitAt: -Infinity, laneY: 60, braced: false});
}
function meetRuinsGuard() {
 if (ruinsGuard.phase !== 'idle' || playerY >= ruinsGap.top) return;
 ruinsGuard.phase = 'intro';
 ruinsGuard.hasDagger = inventory.has(stoneDagger.id);
 showDiscovery('Guard: Luca? You were supposed to be dead.');
}
function advanceRuinsGuardDialogue() {
 const guard = ruinsGuard;
 if (ruinsInterior !== 23) return false;
 if (guard.phase === 'memory' || guard.stepAt !== null) return true;
 if (guard.phase === 'intro') {
  guard.line++;
  if (guard.line === 1) showDiscovery('Luca: How do you know my name?');
  else if (guard.line === 2 && guard.hasDagger) showDiscovery('Guard: Is that the stone dagger? Give it to me!');
  else {
   discoveryOpen = false;
   wolfDialogue.hidden = true;
   startGuardWindup();
   showInfo('Jump the hammer’s shockwave. Strike while he recovers.');
   draw(eyesClosed);
  }
  return true;
 }
 if (guard.phase !== 'interrogation') return false;
 guard.line++;
 if (guard.line < guardInterrogation.length) {
  if (guardRetreatLines.includes(guard.line)) {
   guard.stepFrom = playerX;
   guard.retreatFrom = guard.x;
   guard.stepAt = performance.now();
  }
  showDiscovery(guardInterrogation[guard.line]);
 } else {
  wolfDialogue.hidden = true;
  guard.phase = 'memory';
  guard.memoryAt = performance.now();
  draw(eyesClosed);
 }
 return true;
}
function updateGuardCutscene(now) {
 const guard = ruinsGuard;
 if (guard.stepAt !== null) {
  const progress = Math.max(0, Math.min(1, (now - guard.stepAt) / guardStepDuration));
  guard.retreatProgress = progress;
  playerX = guard.stepFrom + Math.round(5 * easeRuinsFade(progress));
  guard.x = guard.retreatFrom + Math.round(guardRetreatDistance * easeRuinsFade((progress - .24) / .58));
  stride = progress < .26 ? -1 : progress < .77 ? 1 : 0;
  if (progress === 1) guard.stepAt = null;
 }
 if (guard.phase === 'memory' && now - guard.memoryAt >= guardMemoryFade * 3 + guardMemoryDuration) {
  guard.phase = 'spared';
  guard.memoryAt = null;
  ruinsState.guardDefeated = true;
  discoveryOpen = false;
  queueStorySave();
 }
}
function guardMemoryFrame(now) {
 if (ruinsInterior !== 23 || ruinsGuard.phase !== 'memory') return null;
 const elapsed = now - ruinsGuard.memoryAt - guardMemoryFade;
 if (elapsed < 0) return {inn: false, shade: easeRuinsFade(1 + elapsed / guardMemoryFade)};
 const returnPhase = (elapsed - guardMemoryDuration) / guardMemoryFade;
 if (returnPhase >= 1) return {inn: false, shade: 1 - easeRuinsFade(returnPhase - 1)};
 return {inn: true, elapsed, shade: Math.max(1 - easeRuinsFade(elapsed / guardMemoryFade), easeRuinsFade(returnPhase))};
}
const innMemoryWolf = [
 '...0...0.........................',
 '..010.010..000000000.............',
 '..0110110001222222210000.........',
 '..012221122222222222111100.......',
 '000132212222211222221111100......',
 '012221112111221122211220110000...',
 '.00000122222222211112220122210...',
 '.....001122222221110000000110....',
 '........00000000000......000.....'
];
const innMemoryHuman = [
 '...000000........................',
 '..012211100000000000.............',
 '.0121133310122222221000000.......',
 '.011333033022211112211111100000..',
 '.013333333032223333211111111210..',
 '..03323330022222222111111111210..',
 '...000000..0000000000000000000...'
];
function drawMemoryCloak(x, y, time, pose) {
 ctx.save();
 ctx.translate(Math.round(x), Math.round(y));
 const step = pose === 'run' ? Math.floor(time / 90) % 2 : 0;
 rect(-5,-3,4,3+step,0); rect(2,-3,4,4-step,0);
 rect(-4,-18,8,16,0); rect(-6,-15,12,11,0); rect(-7,-8,14,6,0);
 rect(-4,-14,8,11,1); rect(-5,-6,10,3,1);
 rect(-2,-14,2,10,2); rect(2,-7,2,4,0);
 rect(-4,-22,8,8,0); rect(-2,-24,4,3,0); rect(-3,-22,6,2,1);
 if (pose !== 'run') {
  rect(-2,-19,5,3,1); rect(-1,-18,1,1,3); rect(2,-18,1,1,3);
 }
 if (pose === 'chant') {
  const lift = Math.floor(time / 220) % 2;
  rect(-9,-15-lift,4,4,0); rect(5,-15-lift,4,4,0);
  rect(-9,-16-lift,2,2,3); rect(7,-16-lift,2,2,3);
 } else if (pose === 'stab') {
  rect(4,-13,8,3,0); rect(10,-13,2,2,3);
  drawDagger(12,-10,false);
 }
 ctx.restore();
}
function drawInnMemoryCaption(message) {
 ctx.save();
 ctx.font = '7px monospace';
 ctx.textBaseline = 'top';
 const width = Math.ceil(ctx.measureText(message).width);
 const x = Math.floor((160 - width) / 2);
 rect(x - 5, 112, width + 10, 13, 0);
 ctx.fillStyle = colors[3];
 ctx.fillText(message, x, 115);
 ctx.restore();
}
const transformationSymbol = [
 '......0......',
 '.00...0.000..',
 '.030..003330.',
 '.0330.0333330',
 '0033300333330',
 '0333300333330',
 '0303330330330',
 '033333033330.',
 '000330033330.',
 '..033003330..',
 '...0300330...',
 '....00000....',
 '......0......'
];
function drawInnRitualSymbol(power, time) {
 const progress = Math.min(1, (time - power.start) / (power.end - power.start));
 const rise = easeRuinsFade(progress / .78);
 const x = Math.round(power.sourceX + (power.x - power.sourceX) * rise);
 const y = Math.round(65 + (power.y - 65) * rise);
 ctx.save();
 ctx.globalAlpha *= easeRuinsFade(progress / .12) * (1 - easeRuinsFade((progress - .83) / .17));
 // A dark, stepped edge keeps the symbol visible against the fire and floor.
 rect(x-6,y-5,13,11,0); rect(x-5,y-6,11,13,0);
 if (power.id === 'scent') drawScentSymbol(ctx,x-5,y-5);
 else if (power.id === 'pounce') {
  ctx.translate(x-4,y);
  ctx.scale(2,2);
  drawRuinsPaw(0,0,3);
 } else drawStoneEquipment(transformationSymbol,x,y-6);
 ctx.restore();
}
function drawInnFlashback(time) {
 drawInnRoom(true);
 const transformed = time >= innMemoryWarning;
 const approach = easeRuinsFade((time - innMemoryApproach) / (innMemoryStab - innMemoryApproach));
 const escape = Math.max(0, (time - innMemoryEscape) / (innMemoryClear - innMemoryEscape));
 const bodyX = 83, bodyY = 69;
 const shift = !transformed && Math.floor(time / 95) % 2;
 const power = innRitualPowers.find(rite => time >= rite.start && time < rite.end);

 rect(69,68,27,2,1); rect(74,70,18,1,1);
 if (time >= innMemoryStab) drawBloodPool();
 drawStoneEquipment(transformed ? innMemoryHuman : innMemoryWolf, bodyX, bodyY - 8 - shift);
 const transformationFlash = Math.max(0, 1 - Math.abs(time - innMemoryWarning) / 240);
 if (transformationFlash > 0) {
  ctx.save();
  ctx.globalAlpha *= transformationFlash * .7;
  rect(bodyX-17,bodyY-10,34,10,3);
  ctx.restore();
 }
 if (time < innMemoryApproach) {
  for (const x of [77,91]) {
   rect(x,61,3,8,0); rect(x+1,62,1,6,1); rect(x,65,3,1,3);
  }
 }
 if (time >= innMemoryWarning && time < innMemoryApproach) {
  drawInnMemoryCaption('“The wolves are coming!”');
 }

 if (time < innMemoryEscape) {
  const attackerX = 56 + Math.round(9 * approach);
  const attackerY = 82 - Math.round(2 * approach);
  const pose = !transformed ? 'chant' : time >= innMemoryStab - 240 && time < innMemoryDrop ? 'stab' : 'idle';
  drawMemoryCloak(attackerX, attackerY, time, pose);
  drawMemoryCloak(106, 81, time, transformed ? 'idle' : 'chant');
 } else if (escape < 1) {
  for (const [x, y, delay, doorX] of [[65,80,.13,77],[106,81,0,84]]) {
   const run = easeRuinsFade((escape - delay) / (1 - delay));
   drawMemoryCloak(x + (doorX - x) * run, y + (170 - y) * run, time, 'run');
  }
 }
 if (time >= innMemoryDrop) {
  const drop = Math.min(1, (time - innMemoryDrop) / 360);
  const x = Math.round(77 + (dagger.x - 77) * drop);
  const y = dagger.y - Math.round(7 * Math.sin(Math.PI * drop));
  drawDagger(x, y, true);
 }
 if (power) drawInnRitualSymbol(power, time);
}
function startGuardWindup() {
 const guard = ruinsGuard;
 guard.direction = playerX < guard.x + 6 ? -1 : 1;
 guard.laneY = Math.max(52, Math.min(65, playerY));
 guard.braced = guard.hammerStrikes > 1 && Math.abs(playerX - guard.x - 6) <= 20;
 guard.phase = 'windup';
 guard.until = ruinsElapsed + guardWindupDuration;
 playAttackSound('crack');
}
function updateRuinsGuard(delta) {
 const guard = ruinsGuard;
 if (guard.wave) {
  const {x, y, start} = guard.wave;
  const radius = 4 + (ruinsElapsed - start) * .115;
  if (radius > 95) guard.wave = null;
  else if ((jump?.height ?? standingHeight) < 7 && Math.abs(playerY - y) < 8 &&
   Math.abs(Math.abs(playerX - x) - radius) < 6) hurtInRuins(4);
 }
 if (playerY >= ruinsGap.top) return;
 if (guard.phase === 'recover' && ruinsElapsed >= guard.until) {
  startGuardWindup();
 }
 if (guard.phase === 'windup' && ruinsElapsed >= guard.until) {
  guard.phase = 'rush';
  guard.until = ruinsElapsed + 190;
  playAttackSound('swipe');
 }
 if (guard.phase !== 'rush') return;
 if (!guard.braced) guard.x = Math.max(17, Math.min(130, guard.x + guard.direction * delta * .14));
 if (ruinsElapsed < guard.until) return;
 guard.phase = 'recover';
 guard.until = ruinsElapsed + (guard.braced ? guardBracedRecoveryDuration : guardRecoveryDuration);
 guard.hammerStrikes++;
 guard.wave = { x: guard.x + 6, y: guard.laneY, start: ruinsElapsed };
 playAttackSound('stoneWave');
}
function defeatRuinsGuard() {
 Object.assign(ruinsGuard, { phase: 'interrogation', wave: null, line: 0, x: guardFallX, bottom: guardFallY });
 if (jump) {
  cancelAnimationFrame(jumpFrame);
  jump = null;
  standingHeight = 0;
 }
 playerX = 76;
 playerY = 61;
 facing = 'ArrowRight';
 showDiscovery(guardInterrogation[0]);
}
function drawGuardMemorial() {
 const strikes = ruinsGuard.hammerStrikes;
 rect(96, 32, 18, 12, 0); rect(97, 33, 16, 10, 1);
 if (strikes === 0) {
  rect(98, 37, 6, 2, 3); rect(104, 36, 3, 5, 3); rect(107, 37, 5, 2, 2);
 } else {
  rect(97, 40, 6, 2, 2); rect(107, 39, 4, 2, 2);
  if (strikes > 1) rect(113, 43, 5, 2, 2);
  if (strikes > 2) rect(93, 46, 4, 2, 1);
 }
}
function drawGuardHammer(x, y, angle) {
 ctx.save();
 ctx.translate(x, y);
 ctx.rotate(angle);
 rect(-2,-12,4,19,0); rect(-1,-11,2,16,2);
 rect(-1,-7,1,9,3); rect(-1,3,2,2,1);
 rect(-6,-16,12,8,0); rect(-5,-15,10,6,2);
 rect(-5,-15,9,1,3); rect(3,-14,2,4,1);
 rect(-2,-13,4,3,1); rect(-1,-12,2,1,3);
 ctx.restore();
}
const fallenGuardBody = [
 '...00000.............',
 '..0122220............',
 '.012221110...........',
 '01221121100..........',
 '01303121122000.......',
 '.013321122322200.....',
 '..011112323222200....',
 '...001222322112200...',
 '.....01222211222200..',
 '......00122222221120.',
 '........000111111110.',
 '...........00000000..'
];
function drawFallenGuard(guard, x, y) {
 const progress = guard.stepAt === null ? 0 : guard.retreatProgress;
 const bracing = progress >= .16 && progress < .42;
 const pushing = progress >= .42 && progress < .73;
 const lift = bracing || pushing ? 1 : 0;
 const knee = bracing ? 5 : pushing ? 9 : 7;
 const foot = bracing ? 9 : pushing ? 15 : 13;

 // The hammer stays on the floor as the guard scoots away.
 rect(108,64,18,3,0); rect(109,65,16,1,2);
 rect(121,62,7,6,0); rect(122,63,5,4,2); rect(123,63,4,1,3);

 ctx.save();
 ctx.translate(x, y);
 rect(-10,1,25,2,1);
 // Draw the far leg first, above the near boot.
 rect(4,-6,9,4,0); rect(5,-5,6,2,1);
 rect(11,-7,5,4,0); rect(12,-6,3,2,2);
 drawStoneEquipment(fallenGuardBody, -4, -12 - lift);
 // The near leg bends and kicks, while his rear arm supports the weight.
 rect(knee - 3,-4,8,4,0); rect(knee - 2,-3,6,2,2);
 rect(knee + 2,-3,foot - knee + 2,3,0); rect(knee + 3,-2,foot - knee,1,1);
 rect(foot,-3,5,4,0); rect(foot+1,-2,3,2,2); rect(foot+2,0,2,1,1);
 const palm = pushing ? -10 : bracing ? -9 : -7;
 rect(-8,-4-lift,7,3,0); rect(-7,-3-lift,5,1,2);
 rect(palm,-2,4,3,0); rect(palm+1,-1,2,1,3);
 if (pushing) {
  rect(foot+5,1,2,1,2); rect(foot+7,0,1,1,3);
 }
 ctx.restore();
}
function drawRuinsGuard() {
 const guard = ruinsGuard;
 const x = Math.round(guard.x) + 6, y = guard.bottom;
 if (guard.hp === 0) {
  drawFallenGuard(guard, x, y);
  return;
 }
 ctx.save();
 ctx.translate(x, y);
 const recovering = guard.phase === 'recover';
 const raised = guard.phase === 'windup' || guard.phase === 'idle' && Math.floor(ruinsElapsed / 340) % 3 !== 2;
 const lean = recovering ? 2 : 0;
 ctx.save();
 ctx.scale(guard.direction, 1);
 rect(-5,-4,4,5,0); rect(2,-4,4,5,0);
 rect(-9,-13,18,13,0); rect(-7,-14,14,12,1);
 rect(-6,-12,12,3,2); rect(-5,-10,10,3,1);
 rect(-5,-7,2,5,2); rect(-1,-7,2,5,2); rect(3,-7,2,5,2);
 rect(-7,-3,14,1,3); rect(-6,-2,12,1,2);
 rect(-5,-3,2,2,1); rect(4,-3,2,2,1);
 // The hood frames his face, and the clasp repeats the joined hands on the memorial.
 rect(-5+lean,-24+lean,10,5,0); rect(-7+lean,-21+lean,13,10,0);
 rect(-5+lean,-22+lean,9,3,2); rect(-5+lean,-20+lean,2,7,1);
 rect(-3+lean,-19+lean,7,7,1); rect(-1+lean,-19+lean,5,5,3);
 rect(1+lean,-18+lean,2,1,0); rect(4+lean,-17+lean,2,2,3);
 rect(1+lean,-15+lean,4,1,1); rect(-2+lean,-13+lean,5,2,2);
 rect(-3,-12,3,2,3); rect(1,-12,3,2,3); rect(-1,-11,3,2,2);
 const handY = raised ? -15 : recovering ? -11 : -8;
 rect(5,handY,5,4,0); rect(6,handY,3,3,2);
 drawGuardHammer(10,handY+2,raised ? .18 : recovering ? 2.86 : 1.75);
 rect(9,handY,2,3,3);
 ctx.restore();
 if (guard.phase === 'windup') rect(-9,2,18,1,3);
 if (ruinsElapsed - guard.hitAt < 110) {
  rect(-2,-25,5,1,3); rect(0,-27,1,5,3);
 }
 if (guard.phase === 'windup' || guard.phase === 'rush' || recovering) {
  rect(-10,-33,20,3,0); rect(-9,-32,Math.ceil(18 * guard.hp / ruinsGuardHp),1,3);
 }
 ctx.restore();
}
function drawRuinsGuardWave() {
 if (ruinsGuard.phase === 'windup' || ruinsGuard.phase === 'rush') {
  const shade = Math.floor(ruinsElapsed / 100) % 2 ? 2 : 3;
  for (let x = 15; x < 145; x += 6) rect(x, ruinsGuard.laneY, 3, 1, shade);
 }
 if (!ruinsGuard.wave) return;
 const {x, y, start} = ruinsGuard.wave;
 const radius = 4 + (ruinsElapsed - start) * .115;
 for (const direction of [-1, 1]) {
  const edge = x + radius * direction;
  if (edge < 13 || edge > 146) continue;
  rect(edge - 2, y - 1, 4, 2, 3); rect(edge - 4, y - 3, 8, 1, 2);
 }
}
