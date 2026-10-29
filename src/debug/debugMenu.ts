import { formatBattleLog } from './battleLog';
import { playtimeReport, resetPlaytime } from './playtime';
import { debugAutoStory, setDebugAutoStory } from './debugFlag';
import { fillLinkGauge, healAllAllies, setEnemyHpToOne } from './cheats';
import { addFragments, addItems, addKoma, capItems, addParts, countOf, defeatEnemy, evolveLevelFor, flowEvents, gainSnaps, nextEvent, nightExit } from '../core';
import { AREA_BATTLES, AREAS, ROOM_NAMES, CARDS, TRIAL_AREAS, ITEMS, LINK_GAUGE_MAX, FRAGMENTS, NAVI_PARTS, POUCH_MAX, POUCH_ORDER, SCENES, SLICE_FLOW, WEAPON_DATA } from '../data';
import type { GrowthTier } from '../sim/presets';
import { clearReadLog } from '../scenes/DialogueScene';
import {
  advanceEvent,
  backupBeforeJump,
  beforeJumpInfo,
  currentEvent,
  deleteSave,
  forgetBeforeJump,
  getActiveBattle,
  readSave,
  readSaveText,
  restoreBeforeJump,
  run,
  setEvent,
  setExplore,
} from '../scenes/run';

/** デバッグメニューから画面の切り替えを頼むための窓口（main.ts で用意する） */
export interface DebugNavigator {
  restartRun(): void;
  /** 星図・ムーブメントの画面を描き直す（星の砂やギアの表示を更新するため） */
  refreshGrowth(): void;
  /** 試作の画面を開く（段階16。エンジンを決めるための探索の試作。段階18b：data で地図を選ぶ。今は縁日の絵の見本だけ） */
  openPrototype(key: 'ProtoExplore', data?: object): void;
  /** 会話の画面を開く（段階22。DialogueScene の DialogueData） */
  openDialogue(data: { scene: string; queue?: string[] }): void;
  /** 物語の流れの画面を開く（段階23。今の出来事から） */
  openFlow(): void;
  /** 探索の画面を開き直す（段階25。今の探索の状態から） */
  openExplore(area: string): void;
  /** 地図直しの試し歩き（段階121）：区画の、その晩の、その部屋を開いて、すぐ地図直しを出す（セーブしない） */
  openMapTune(area: string, night: number | undefined, room: string): void;
}

const Z = 9000;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.style.cssText = css;
  e.textContent = text;
  return e;
}

const BUTTON_CSS =
  'display:block;width:100%;min-height:44px;margin:6px 0;padding:8px;font:14px sans-serif;color:#fff;background:#2a3b4e;border:1px solid #3e5670;border-radius:6px;text-align:left;';

/**
 * 画面の隅の小さなボタンから開くデバッグメニュー（?debug=1 の時だけ main.ts から呼ぶ）。
 * Phaser の外の HTML で作るので、長いログもスクロールして読める。
 */
export function installDebugMenu(nav: DebugNavigator): void {
  const toggle = el(
    'button',
    `position:fixed;left:4px;bottom:calc(2px + env(safe-area-inset-bottom));z-index:${Z};width:44px;height:22px;font:bold 10px monospace;color:#ffd84a;background:rgba(16,24,32,0.85);border:1px solid #ffd84a;border-radius:4px;`,
    'DBG',
  );
  const panel = el(
    'div',
    `position:fixed;inset:0;z-index:${Z + 1};display:none;background:rgba(0,0,0,0.85);overflow-y:auto;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));box-sizing:border-box;color:#fff;font:14px sans-serif;`,
  );
  document.body.append(toggle, panel);

  const close = () => {
    panel.style.display = 'none';
  };
  // メニューの上で押した・離した操作を、下のゲームの画面へ通さない（「閉じる」を押すと、下のボタンまで押されていた。2026-10-16）
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) panel.addEventListener(type, (e) => e.stopPropagation());

  const button = (label: string, onClick: () => void, enabled = true, css = '') => {
    const b = el('button', BUTTON_CSS + css + (enabled ? '' : 'opacity:0.4;'), label);
    b.disabled = !enabled;
    b.addEventListener('click', onClick);
    return b;
  };

  const notify = (msg: string) => {
    console.log(`[debug] ${msg}`);
    render(msg);
  };

  /** プレイ時間の記録の一覧。写す（クリップボードへ）・消す・戻る */
  const showPlaytime = (note = '') => {
    panel.replaceChildren();
    panel.append(el('div', 'font:bold 16px sans-serif;color:#ffd84a;margin-bottom:8px;', 'プレイ時間の記録'));
    if (note) panel.append(el('div', 'color:#6dff9e;margin-bottom:8px;', note));
    const text = playtimeReport();
    panel.append(
      button('写す（クリップボードへ）', () => {
        navigator.clipboard?.writeText(text).then(
          () => showPlaytime('写しました'),
          () => showPlaytime('写せませんでした。下の文を長押しして選んでください'),
        );
      }),
      button('記録を消す（最初から数え直す）', () => {
        if (!window.confirm('プレイ時間の記録を消しますか？')) return;
        resetPlaytime();
        showPlaytime('消しました');
      }),
      button('メニューへ戻る', () => render()),
    );
    panel.append(el('pre', 'white-space:pre-wrap;font:12px/1.6 monospace;color:#e8eef4;user-select:text;-webkit-user-select:text;', text));
  };

  /** 画面の上に、数秒だけ出す一言（飛んだ後の育ち具合など）。メニューやメモの窓を開くと、その下に隠れる */
  const toast = (text: string, ms = 8000) => {
    const t = el(
      'div',
      `position:fixed;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:${Z - 1};padding:10px 12px;font:13px/1.6 sans-serif;white-space:pre-wrap;color:#fff;background:rgba(16,40,32,0.94);border:1px solid #6dff9e;border-radius:8px;pointer-events:none;`,
      text,
    );
    document.body.append(t);
    window.setTimeout(() => t.remove(), ms);
    return t;
  };

  /** 見出し。fold の時は、押すと開く折りたたみ（あまり使わないもの） */
  const section = (label: string, fold = false): HTMLElement => {
    if (!fold) {
      panel.append(el('div', 'margin-top:14px;padding-bottom:2px;border-bottom:1px solid #3e5670;color:#ffd84a;font:bold 14px sans-serif;', label));
      return panel;
    }
    const d = el('details', 'margin-top:14px;');
    d.append(el('summary', 'min-height:36px;line-height:36px;color:#ffd84a;font:bold 14px sans-serif;border-bottom:1px solid #3e5670;', label));
    panel.append(d);
    return d;
  };

  /**
   * 出来事へ飛ぶ（段階23。段階92：その時点の育ち具合で）。飛ぶ前のセーブを先に取っておく。
   * tier が keep の時は、今までどおり育成はそのまま
   */
  const jump = async (eventId: string, tier: GrowthTier | 'keep') => {
    close();
    backupBeforeJump();
    run.active = true;
    if (run.explore) setExplore(null);
    let summary = '';
    if (tier !== 'keep') {
      const wait = toast('育ち具合を作っています…（数秒かかります）', 60000);
      // 一言を描いてから、重い計算をする
      await new Promise((r) => window.setTimeout(r, 60));
      try {
        const { growthPreset, presetSummary, withPresetSnaps } = await import('../sim/presets');
        const p = growthPreset(eventId, tier);
        run.growth = p.carry.growth;
        run.armory = p.carry.armory;
        run.navi = p.carry.navi;
        run.album = withPresetSnaps(run.album, p);
        const chapter = SLICE_FLOW.find((c) => c.events.some((e) => e.id === eventId))?.id;
        run.linkGauge = chapter ? { chapter, value: p.carry.gauge } : null;
        run.party = [];
        run.pendingReward = null;
        run.returned = returnedBefore(eventId);
        summary = presetSummary(p, eventId);
      } catch (e) {
        console.error('[debug] growth preset', e);
        summary = `育ち具合を作れませんでした（育成はそのまま）：${String(e)}`;
      } finally {
        wait.remove();
      }
    }
    markReturnedBefore(eventId);
    setEvent(eventId);
    nav.openFlow();
    if (summary) toast(summary);
  };

  const render = (note = '') => {
    panel.replaceChildren();
    const battle = getActiveBattle();
    const s = battle?.getState();
    panel.append(el('div', 'font:bold 16px sans-serif;color:#ffd84a;margin-bottom:8px;', 'デバッグメニュー'));
    if (note) panel.append(el('div', 'color:#6dff9e;margin-bottom:8px;', note));

    // ---- 確認（段階92）：育ち具合で飛ぶ・飛ぶ前のセーブに戻す ----
    section('確認：出来事へ飛ぶ');
    const now = currentEvent();
    panel.append(el('div', 'color:#9fb3c8;font-size:12px;', `今は「${now.title}」（${now.id}・${run.progress.day}日目）`));
    const eventSelect = el('select', 'display:block;width:100%;min-height:44px;margin:6px 0;font:14px sans-serif;');
    for (const e of flowEvents(SLICE_FLOW)) {
      const o = el('option', '', `${e.title}（${e.id}）`);
      o.value = e.id;
      if (e.id === now.id) o.selected = true;
      eventSelect.append(o);
    }
    eventSelect.id = 'debug-event';
    const tierSelect = el('select', 'display:block;width:100%;min-height:44px;margin:6px 0;font:14px sans-serif;');
    tierSelect.id = 'debug-tier';
    for (const [value, label] of [
      ['normal', '育ち具合：ふつう（だいたいの人）'],
      ['low', '育ち具合：控えめ（物語だけ進めた人）'],
      ['high', '育ち具合：やり込み（狩りで素材を集めた人）'],
      ['keep', '育成はそのまま（今の育ち具合で）'],
    ] as const) {
      const o = el('option', '', label);
      o.value = value;
      tierSelect.append(o);
    }
    panel.append(
      eventSelect,
      tierSelect,
      button('↑ の出来事へ飛ぶ', () => void jump(eventSelect.value, tierSelect.value as GrowthTier | 'keep'), true, 'background:#1f5a3a;border-color:#6dff9e;'),
      button('次の出来事へ飛ばす', () => {
        close();
        run.active = true;
        // 探索の途中なら、探索を終えたことにする
        if (run.explore) setExplore(null);
        markReturnedBefore(nextEvent(SLICE_FLOW, run.event)?.id ?? run.event);
        advanceEvent();
        nav.openFlow();
      }),
    );
    const before = beforeJumpInfo();
    if (before) {
      panel.append(
        el('div', 'color:#9fb3c8;font-size:12px;margin-top:6px;', `飛ぶ前のセーブ：${before}`),
        button('飛ぶ前のセーブに戻す（ページを開き直して「つづきから」）', () => {
          if (!window.confirm(`飛ぶ前のセーブ（${before}）に戻しますか？\n今の状態は消えます`)) return;
          if (restoreBeforeJump()) window.location.reload();
        }),
        button('今の状態のまま続ける（飛ぶ前のセーブを捨てる）', () => {
          if (!window.confirm('飛ぶ前のセーブを捨てますか？')) return;
          forgetBeforeJump();
          render('飛ぶ前のセーブを捨てました');
        }),
      );
    } else {
      panel.append(el('div', 'color:#9fb3c8;font-size:12px;margin-top:6px;', '飛ぶと、飛ぶ前のセーブを1つ取っておき、ここから戻せます。気になったことは、画面左下の「メモ」へ'));
    }

    // ---- 地図直し（段階121）：シナリオを進めずに、区画・晩・部屋を選んで開く ----
    section('地図直し：区画と部屋を選んで開く');
    const selectCss = 'display:block;width:100%;min-height:44px;margin:6px 0;font:14px sans-serif;';
    const areaSelect = el('select', selectCss);
    const nightSelect = el('select', selectCss);
    const roomSelect = el('select', selectCss);
    for (const a of Object.values(AREAS)) {
      const o = el('option', '', a.name);
      o.value = a.id;
      areaSelect.append(o);
    }
    const fillRooms = () => {
      const a = AREAS[areaSelect.value];
      nightSelect.replaceChildren();
      const nights = a?.nights?.length ?? 0;
      for (let n = 1; n <= Math.max(1, nights); n++) {
        const o = el('option', '', nights > 0 ? `${n}晩目` : '晩なし');
        o.value = String(nights > 0 ? n : 0);
        nightSelect.append(o);
      }
      roomSelect.replaceChildren();
      for (const r of a?.rooms ?? []) {
        const o = el('option', '', `${ROOM_NAMES[r.id] ?? r.id}（${r.id}${r.image ? '' : '・絵なし'}）`);
        o.value = r.id;
        roomSelect.append(o);
      }
    };
    areaSelect.addEventListener('change', fillRooms);
    fillRooms();
    panel.append(
      areaSelect,
      nightSelect,
      roomSelect,
      button('↑ の部屋の地図直しを開く（セーブしない試し歩き）', () => {
        close();
        nav.openMapTune(areaSelect.value, Number(nightSelect.value) || undefined, roomSelect.value);
      }, true, 'background:#3a2f5a;border-color:#b090ff;'),
    );

    // ---- 戦闘中 ----
    if (battle && s) {
      section('戦闘中');
      panel.append(
        button('味方を全回復する', () => notify(battle.replaceState(healAllAllies(battle.getState())) ? '味方を全回復しました' : '演出中は使えません')),
        button('つながりゲージを満タンにする（連携技）', () => notify(battle.replaceState(fillLinkGauge(battle.getState(), LINK_GAUGE_MAX)) ? 'つながりゲージを満タンにしました' : '演出中は使えません')),
        button('自動で1ラウンド戦う（自動対戦の方針）', () => {
          if (battle.autoRound()) close();
          else notify('演出中は使えません');
        }),
      );
      for (const e of s.enemies) {
        if (e.hp <= 0) continue;
        panel.append(button(`${e.name}のHPを1にする`, () => notify(battle.replaceState(setEnemyHpToOne(battle.getState(), e.uid)) ? `${e.name}のHPを1にしました` : '演出中は使えません')));
      }
      panel.append(el('div', 'color:#9fb3c8;font-size:12px;', `戦闘のシード：${s.seed}　戦闘ログ（新しいものが下）`));
      const log = el('pre', 'white-space:pre-wrap;word-break:break-all;font:11px/1.5 monospace;background:#0b1118;border:1px solid #3e5670;padding:8px;max-height:40vh;overflow-y:auto;margin:6px 0;', formatBattleLog(s).join('\n'));
      panel.append(log);
      // 最新のログが見えるように一番下までスクロールする
      requestAnimationFrame(() => {
        log.scrollTop = log.scrollHeight;
      });
    }

    // ---- 探索中（段階25） ----
    const ex = run.explore;
    const exArea = ex ? (AREAS[ex.area] ?? TRIAL_AREAS[ex.area]) : undefined;
    if (ex && exArea) {
      section(`探索中：${exArea.name}　倒した敵 ${ex.defeated.length}/${exArea.enemies.length}`);
      panel.append(
        button('探索：敵の印を全部倒したことにする', () => {
          close();
          // 倒した砂嵐のコマも手に入れる（段階37。足さないと、ボスが眠ったままで戦えない）
          setExplore(exArea.enemies.reduce((st, e) => (st.defeated.includes(e.id) ? st : addKoma(defeatEnemy(st, e.id), AREA_BATTLES[e.battle]?.koma ?? 0)), ex));
          nav.openExplore(exArea.id);
        }),
        button('探索：ボスの手前へ移る', () => {
          close();
          const [c, r] = exArea.boss.cell;
          const room = exArea.boss.room ?? exArea.rooms[0].id;
          setExplore({ ...ex, room, cell: [c, r + 2], visited: ex.visited.includes(room) ? ex.visited : [...ex.visited, room] });
          nav.openExplore(exArea.id);
        }),
      );
      // 晩に分けた区画（段階67）：今夜のコマをそろえて、帰り口（光る砂時計）へ移る
      const night = ex.night ?? 1;
      const exit = nightExit(exArea, night);
      const need = exArea.nights?.[night - 1]?.koma;
      if (exit && need !== undefined) {
        panel.append(
          button(`探索：${night}晩目のコマをそろえて、帰り口へ移る`, () => {
            close();
            setExplore({ ...ex, koma: Math.max(ex.koma, need), room: exit.room, cell: exit.cell, visited: ex.visited.includes(exit.room) ? ex.visited : [...ex.visited, exit.room] });
            nav.openExplore(exArea.id);
          }),
        );
      }
    }

    // ---- 育成の上乗せ ----
    const grow = section('育成の上乗せ（今の育ち具合に足す）', true);
    grow.append(
      button(`星の砂を+10する（今 ${run.growth.points}）`, () => {
        run.growth = { ...run.growth, points: run.growth.points + 10 };
        nav.refreshGrowth();
        notify(`星の砂を+10しました（${run.growth.points}）`);
      }),
      button(`ギアを全種類1つずつもらう（今 ${run.navi.parts.length}個）`, () => {
        run.navi = addParts(run.navi, Object.keys(NAVI_PARTS));
        nav.refreshGrowth();
        notify(`ギアを${Object.keys(NAVI_PARTS).length}個もらいました（${run.navi.parts.length}個）`);
      }),
      button(`スナップを全種類1枚ずつもらう（今 ${countOf(run.album.owned)}枚）`, () => {
        run.album = gainSnaps(run.album, Object.keys(CARDS));
        nav.refreshGrowth();
        notify(`スナップを${Object.keys(CARDS).length}枚もらいました（${countOf(run.album.owned)}枚）`);
      }),
      button('素材とアイテムを全種類2つずつもらう', () => {
        const ids = Object.keys(ITEMS);
        run.armory = capItems(WEAPON_DATA, addItems(run.armory, [...ids, ...ids])).armory;
        nav.refreshGrowth();
        notify('素材とアイテムを全種類2つずつもらいました');
      }),
      // 段階52：交換所で使う記憶の欠片
      button('記憶の欠片を10個ずつもらう', () => {
        run.armory = addFragments(run.armory, Object.keys(FRAGMENTS).flatMap((id) => Array.from({ length: 10 }, () => id)));
        nav.refreshGrowth();
        notify('記憶の欠片を4種類10個ずつもらいました');
      }),
      // 段階51：ポーチの消費アイテムを、持てる数まで（次に始める戦闘から使える）
      button('ポーチを満タンにする', () => {
        run.armory = capItems(WEAPON_DATA, addItems(run.armory, POUCH_ORDER.flatMap((id) => Array.from({ length: POUCH_MAX }, () => id)))).armory;
        notify(`ポーチを満タンにしました（1種類${POUCH_MAX}個。次に始める戦闘から使える）`);
      }),
      // 段階42：次の進化（2回目は Lv5、3回目は Lv7）に要るレベルまで上げる
      button('仲間の武器を、次の進化に要るレベルにする', () => {
        const weapons = { ...run.armory.weapons };
        for (const [id, w] of Object.entries(weapons)) {
          const need = WEAPON_DATA.levelExp[evolveLevelFor(WEAPON_DATA, w.path.length + 1) - 2] ?? 0;
          weapons[id] = { ...w, exp: Math.max(w.exp, need) };
        }
        run.armory = { ...run.armory, weapons };
        nav.refreshGrowth();
        notify('仲間の武器を、次の進化に要るレベルにしました');
      }),
    );

    // ---- 設定 ----
    const opt = section('設定', true);
    // オート（段階64）：物語の1回目の探索ではオートを出さない。デバッグの時だけ出せる
    const autoStory = debugAutoStory();
    opt.append(
      button(`物語の探索でもオートを出す：${autoStory ? '入' : '切'}（次の戦闘から）`, () => {
        setDebugAutoStory(!autoStory);
        render(`物語の探索でもオートを出す：${autoStory ? '切' : '入'}にしました`);
      }),
      button('読んだ印を消す（早送りが止まるか確かめる時に）', () => {
        clearReadLog();
        notify('読んだ印を消しました');
      }),
      el('div', 'color:#9fb3c8;font-size:12px;margin-top:6px;', `乱数のシード：${run.seed}（${run.fixed ? '固定中' : '毎回ランダム'}）`),
      button(run.fixed ? 'シードの固定をやめる' : 'このシードに固定する', () => {
        run.fixed = !run.fixed;
        notify(run.fixed ? `シード ${run.seed} に固定しました（やり直しても同じ並び）` : 'シードの固定をやめました');
      }),
    );

    // ---- 調べる ----
    const look = section('調べる（会話の場面・記録・セーブ・端末）', true);
    // 会話（段階22）：脚本の場面を1つ開く
    const select = el('select', 'display:block;width:100%;min-height:44px;margin:6px 0;font:14px sans-serif;');
    for (const sc of SCENES) {
      const o = el('option', '', `${sc.title}（${sc.id}）`);
      o.value = sc.id;
      select.append(o);
    }
    look.append(
      select,
      button('↑ の会話の場面を開く', () => {
        close();
        nav.openDialogue({ scene: select.value });
      }),
      // プレイ時間の記録（段階63）：どこが長く、どこが短いかを調べる
      button('プレイ時間の記録を見る', () => showPlaytime()),
      // セーブ（段階11）
      button('セーブの中身を見る', () => {
        const text = readSaveText();
        if (text === null) {
          notify('セーブはありません');
          return;
        }
        const r = readSave();
        const head = r?.ok ? `版${r.save.version}　${r.save.savedAt}　${text.length}文字` : `読めない：${r && !r.ok ? r.error : ''}（${text.length}文字）`;
        render(head);
        let pretty = text;
        try {
          pretty = JSON.stringify(JSON.parse(text), null, 1);
        } catch {
          // 壊れている時はそのまま出す
        }
        panel.append(el('pre', 'white-space:pre-wrap;word-break:break-all;font:11px monospace;color:#cfe;background:#0b1218;padding:8px;border-radius:6px;', pretty));
      }),
      button('セーブを消す（次に「はじめる」まで自動のセーブも止める）', () => {
        if (!window.confirm('セーブを消しますか？')) return;
        deleteSave();
        run.active = false;
        notify('セーブを消しました');
      }),
      // 端末にしまった物（段階70）：Service Worker が動いているかと、しまったファイルの数。困った時は全部消して取り直す
      button('端末にしまった物を見る（オフラインで遊ぶため）', () => {
        void (async () => {
          const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
          const sw = regs[0] ? (regs[0].active ? '動いている' : 'しまっている途中') : 'なし';
          const names = typeof caches === 'undefined' ? [] : await caches.keys();
          let files = 0;
          for (const n of names) files += (await (await caches.open(n)).keys()).length;
          notify(`Service Worker：${sw}　しまった物：${files}個（${names.join('、') || 'なし'}）`);
        })();
      }),
      button('しまった物を全部消す（次に開いた時に取り直す）', () => {
        void (async () => {
          for (const r of (await navigator.serviceWorker?.getRegistrations()) ?? []) await r.unregister();
          if (typeof caches !== 'undefined') for (const n of await caches.keys()) await caches.delete(n);
          notify('しまった物を消しました。ページを開き直すと取り直します（セーブは消えません）');
        })();
      }),
    );

    // ---- 古い試作（段階1〜16。本編では使わない。通しの自動確認で使う） ----
    const proto = section('古い試作（本編では使わない）', true);
    proto.append(
      button('試作の5戦を最初から（星図から。育成と物語の進み具合もリセット）', () => {
        close();
        nav.restartRun();
      }),
      button('シードを指定して試作の5戦を最初から', () => {
        const v = window.prompt('シード（0以上の整数）', String(run.seed));
        if (v === null || v.trim() === '' || Number.isNaN(Number(v))) return;
        run.seed = Number(v) >>> 0;
        run.fixed = true;
        close();
        nav.restartRun();
      }),
      button('試作：縁日のマップを歩く（絵の見本）', () => {
        close();
        nav.openPrototype('ProtoExplore', { map: 'festival' });
      }),
    );

    panel.append(button('閉じる', close));
  };

  toggle.addEventListener('click', () => {
    render();
    panel.style.display = 'block';
  });
}

/** その出来事より前の「時間を返す」出来事の区画（段階92。育ち具合で飛ぶ時は、返した区画をこれにそろえる） */
function returnedBefore(id: string): string[] {
  const all = flowEvents(SLICE_FLOW);
  return all
    .slice(0, Math.max(0, all.findIndex((x) => x.id === id)))
    .filter((e) => e.kind === 'return' && e.area && AREAS[e.area])
    .map((e) => e.area!)
    .filter((a, i, list) => list.indexOf(a) === i);
}

/** 飛ばした「時間を返す」出来事は、返したことにする（段階36：返した翌日に持ち主に会う場面が出るように）。前へ戻っても消さない */
function markReturnedBefore(id: string): void {
  const all = flowEvents(SLICE_FLOW);
  for (const e of all.slice(0, Math.max(0, all.findIndex((x) => x.id === id)))) {
    if (e.kind === 'return' && e.area && AREAS[e.area] && !run.returned.includes(e.area)) run.returned = [...run.returned, e.area];
  }
}
