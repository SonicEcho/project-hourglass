// 育ち具合の表（presetCarry.json）を、今の星図・武器の木に合わせる手順（段階205 でセーブから移した）。
// 表は段階192 で古い戦闘の自動対戦から固めた物で、星図は版13・武器の進化は版14 の形のまま。
// セーブは版17 から古い版を直さなくなったが（はじめから）、育ち具合で飛ぶ時はこの表を使うので、ここに残す

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** 版14 の武器の進化を外す（段階197）。武器の状態のほかの物（経験値・能力値・刻印）は残す */
export function resetV14Evolutions(armory: Record<string, unknown>): Record<string, unknown> {
  if (!isObject(armory.weapons)) return armory;
  const weapons = Object.fromEntries(Object.entries(armory.weapons).map(([k, w]) => [k, isObject(w) ? { ...w, path: [] } : w]));
  return { ...armory, weapons };
}

/** 版13 の星図の星（id → 効果。段階194 で入れ替える前の物。使った星の砂を返すために、値段を数える） */
const V13_STARS: Record<string, string> = {
  altair: 'start:hero', tarazed: 'skill:doubleSlash', alshain: 'skill:fire', muAql: 'a', deltaAql: 'h', zetaAql: 'a', epsAql: 'h', lambdaAql: 'a', iotaAql: 'D', etaAql: 'a', thetaAql: 'h',
  vega: 'start:akari', epsLyr: 'skill:cure', zetaLyr: 'm', deltaLyr: 'p', sulafat: 'm', sheliak: 'skill:care', thetaLyr: 'skill:ice', kappaLyr: 'h', anser: 'p', alphaSge: 'a', betaSge: 'p', deltaSge: 's', gammaSge: 's',
  sualocin: 'start:mio', rotanev: 'skill:thunder', gammaDel: 's', deltaDel: 's', epsDel: 'skill:inspiration', etaDel: 's', kappaDel: 'd',
  deneb: 'skill:fira', sadr: 'A', etaCyg: 'h', phiCyg: 'd', albireo: 's', deltaCyg: 'm', thetaCyg: 'm', iotaCyg: 'P', kappaCyg: 'skill:blizzara', gienah: 'H', c41: 'M', zetaCyg: 'skill:thundara', tauCyg: 's', nuCyg: 's', xiCyg: 'D', rhoCyg: 'S', omiCyg: 'p',
  piHer: 'start:sayoko', etaHer: 'a', zetaHer: 'h', epsHer: 'A', rhoHer: 'd', thetaHer: 's', iotaHer: 'S', deltaHer: 'H', muHer: 'P', betaHer: 'skill:doubleSlash', alphaHer: 'M',
  alderamin: 'start:hayase', muCep: 'm', etaCep: 'p', thetaCep: 'M', alfirk: 'skill:thundara', iotaCep: 'H', zetaCep: 'd', epsCep: 'S', deltaCep: 'A',
};
/** 版13 の仲間が最初から覚えていた魔法・スキル（その星は「通るだけ」の値段だった） */
const V13_START_SKILLS: Record<string, string[]> = {
  hero: ['fire', 'breakSlash'],
  akari: ['care', 'careAll', 'ice'],
  mio: ['thunder', 'shuffle', 'swap'],
  sayoko: ['kabutoWari', 'tsukiBarai'],
  hayase: ['yakiire', 'reikyaku', 'tsuden', 'short'],
};

/**
 * 版13 の星図で開けた星の、使った星の砂を返す（段階194）。返した後の星の砂と、まっさらな開けた星（出発点は整える時に補う）。
 * 値段は版13 のまま：能力値3・大6・魔法・スキル8、もう覚えている魔法・スキルとほかの仲間の出発点は「通るだけ」3。知らない星は3
 */
export function refundV13Growth(points: number, opened: Record<string, unknown>): { points: number; opened: Record<string, string[]> } {
  let back = 0;
  for (const [charId, list] of Object.entries(opened)) {
    if (!Array.isArray(list)) continue;
    const known = new Set(V13_START_SKILLS[charId] ?? []);
    for (const id of list) {
      const code = typeof id === 'string' ? V13_STARS[id] : undefined;
      if (code === undefined) {
        back += 3;
        continue;
      }
      const [kind, value] = code.split(':');
      if (kind === 'start') back += value === charId ? 0 : 3;
      else if (kind === 'skill') {
        back += known.has(value) ? 3 : 8;
        known.add(value);
      } else back += code === code.toUpperCase() ? 6 : 3;
    }
  }
  return { points: Math.max(0, points) + back, opened: {} };
}
