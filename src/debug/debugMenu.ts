import { formatBattleLog } from './battleLog';
import { playtimeReport, resetPlaytime } from './playtime';
import { debugAutoStory, setDebugAutoStory } from './debugFlag';
import { fillLinkGauge, healAllAllies, setEnemyHpToOne } from './cheats';
import { addFragments, addItems, addKoma, capItems, addParts, countOf, defeatEnemy, evolveLevelFor, flowEvents, gainSnaps, nextEvent, nightExit } from '../core';
import { AREA_BATTLES, AREAS, CARDS, TRIAL_AREAS, ITEMS, LINK_GAUGE_MAX, M1_SCENE_ORDER, FRAGMENTS, NAVI_PARTS, POUCH_MAX, POUCH_ORDER, SCENES, SLICE_FLOW, WEAPON_DATA } from '../data';
import { clearReadLog } from '../scenes/DialogueScene';
import { advanceEvent, currentEvent, deleteSave, getActiveBattle, readSave, readSaveText, run, setEvent, setExplore } from '../scenes/run';

/** デバッグメニューから画面の切り替えを頼むための窓口（main.ts で用意する） */
export interface DebugNavigator {
  startBoss(): void;
  restartRun(): void;
  /** 星図・ムーブメントの画面を描き直す（星の砂やギアの表示を更新するため） */
  refreshGrowth(): void;
  /** 試作の画面を開く（段階16。エンジンを決めるための探索の試作。段階18b：data で地図を選ぶ） */
  openPrototype(key: 'ProtoExplore', data?: object): void;
  /** 会話の画面を開く（段階22。DialogueScene の DialogueData） */
  openDialogue(data: { scene: string; queue?: string[] }): void;
  /** 物語の流れの画面を開く（段階23。今の出来事から） */
  openFlow(): void;
  /** 探索の画面を開き直す（段階25。今の探索の状態から） */
  openExplore(area: string): void;
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

  const button = (label: string, onClick: () => void, enabled = true) => {
    const b = el('button', BUTTON_CSS + (enabled ? '' : 'opacity:0.4;'), label);
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

  const render = (note = '') => {
    panel.replaceChildren();
    const battle = getActiveBattle();
    const s = battle?.getState();
    panel.append(el('div', 'font:bold 16px sans-serif;color:#ffd84a;margin-bottom:8px;', 'デバッグメニュー'));
    if (note) panel.append(el('div', 'color:#6dff9e;margin-bottom:8px;', note));

    // 回復・HP
    panel.append(
      button('味方を全回復する', () => {
        if (!battle || !s) return;
        notify(battle.replaceState(healAllAllies(battle.getState())) ? '味方を全回復しました' : '演出中は使えません');
      }, !!battle),
    );
    panel.append(
      button('つながりゲージを満タンにする（連携技）', () => {
        if (!battle) return;
        notify(battle.replaceState(fillLinkGauge(battle.getState(), LINK_GAUGE_MAX)) ? 'つながりゲージを満タンにしました' : '演出中は使えません');
      }, !!battle),
    );
    panel.append(
      button('自動で1ラウンド戦う（自動対戦の方針）', () => {
        if (!battle) return;
        if (battle.autoRound()) close();
        else notify('演出中は使えません');
      }, !!battle),
    );
    for (const e of s?.enemies ?? []) {
      if (e.hp <= 0) continue;
      panel.append(
        button(`${e.name}のHPを1にする`, () => {
          if (!battle) return;
          notify(battle.replaceState(setEnemyHpToOne(battle.getState(), e.uid)) ? `${e.name}のHPを1にしました` : '演出中は使えません');
        }),
      );
    }

    // 成長
    panel.append(
      button(`星の砂を+10する（今 ${run.growth.points}）`, () => {
        run.growth = { ...run.growth, points: run.growth.points + 10 };
        nav.refreshGrowth();
        notify(`星の砂を+10しました（${run.growth.points}）`);
      }),
    );

    panel.append(
      button(`ギアを全種類1つずつもらう（今 ${run.navi.parts.length}個）`, () => {
        run.navi = addParts(run.navi, Object.keys(NAVI_PARTS));
        nav.refreshGrowth();
        notify(`ギアを${Object.keys(NAVI_PARTS).length}個もらいました（${run.navi.parts.length}個）`);
      }),
    );

    panel.append(
      button(`スナップを全種類1枚ずつもらう（今 ${countOf(run.album.owned)}枚。アルバムは探索のチェックポイントの星図から）`, () => {
        run.album = gainSnaps(run.album, Object.keys(CARDS));
        nav.refreshGrowth();
        notify(`スナップを${Object.keys(CARDS).length}枚もらいました（${countOf(run.album.owned)}枚）`);
      }),
    );

    panel.append(
      button('素材とアイテムを全種類2つずつもらう', () => {
        const ids = Object.keys(ITEMS);
        run.armory = capItems(WEAPON_DATA, addItems(run.armory, [...ids, ...ids])).armory;
        nav.refreshGrowth();
        notify('素材とアイテムを全種類2つずつもらいました');
      }),
    );
    panel.append(
      // 段階51：ポーチの消費アイテムを、持てる数まで（次に始める戦闘から使える）
      // 段階52：交換所で使う記憶の欠片
      button('記憶の欠片を10個ずつもらう', () => {
        run.armory = addFragments(run.armory, Object.keys(FRAGMENTS).flatMap((id) => Array.from({ length: 10 }, () => id)));
        nav.refreshGrowth();
        notify('記憶の欠片を4種類10個ずつもらいました');
      }),
    );
    panel.append(
      button('ポーチを満タンにする', () => {
        run.armory = capItems(WEAPON_DATA, addItems(run.armory, POUCH_ORDER.flatMap((id) => Array.from({ length: POUCH_MAX }, () => id)))).armory;
        notify(`ポーチを満タンにしました（1種類${POUCH_MAX}個。次に始める戦闘から使える）`);
      }),
    );
    panel.append(
      // 段階42：次の進化（2回目は Lv5、3回目は Lv7）に要るレベルまで上げる
      button('3人の武器を、次の進化に要るレベルにする', () => {
        const weapons = { ...run.armory.weapons };
        for (const [id, w] of Object.entries(weapons)) {
          const need = WEAPON_DATA.levelExp[evolveLevelFor(WEAPON_DATA, w.path.length + 1) - 2] ?? 0;
          weapons[id] = { ...w, exp: Math.max(w.exp, need) };
        }
        run.armory = { ...run.armory, weapons };
        nav.refreshGrowth();
        notify('3人の武器を、次の進化に要るレベルにしました');
      }),
    );

    // 画面の切り替え
    panel.append(
      button('ボス戦（戦闘5）から始める（育成はそのまま）', () => {
        close();
        nav.startBoss();
      }),
    );

    // オート（段階64）：物語の1回目の探索ではオートを出さない。デバッグの時だけ出せる
    const autoStory = debugAutoStory();
    panel.append(
      button(`物語の探索でもオートを出す：${autoStory ? '入' : '切'}（次の戦闘から）`, () => {
        setDebugAutoStory(!autoStory);
        render(`物語の探索でもオートを出す：${autoStory ? '切' : '入'}にしました`);
      }),
    );

    // プレイ時間の記録（段階63）：どこが長く、どこが短いかを調べる
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', 'プレイ時間の記録（段階63。出来事・画面・場面ごと）'));
    panel.append(button('プレイ時間の記録を見る', () => showPlaytime()));

    // 物語の流れ（段階23）：出来事を飛ばす・選んで飛ぶ
    const now = currentEvent();
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', `物語の流れ（段階23）：今は「${now.title}」（${now.id}・${run.progress.day}日目）`));
    panel.append(
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
    const eventSelect = el('select', 'display:block;width:100%;min-height:44px;margin:6px 0;font:14px sans-serif;');
    for (const e of flowEvents(SLICE_FLOW)) {
      const o = el('option', '', `${e.title}（${e.id}）`);
      o.value = e.id;
      if (e.id === now.id) o.selected = true;
      eventSelect.append(o);
    }
    panel.append(
      eventSelect,
      button('↑ の出来事へ飛ぶ（育成はそのまま）', () => {
        close();
        run.active = true;
        if (run.explore) setExplore(null);
        markReturnedBefore(eventSelect.value);
        setEvent(eventSelect.value);
        nav.openFlow();
      }),
      button('試作の5戦を最初から（星図から。育成と物語の進み具合もリセット）', () => {
        close();
        nav.restartRun();
      }),
    );

    // 探索（段階25）：探索の途中の時だけ
    const ex = run.explore;
    const exArea = ex ? (AREAS[ex.area] ?? TRIAL_AREAS[ex.area]) : undefined;
    if (ex && exArea) {
      panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', `探索（段階25）：${exArea.name}　倒した敵 ${ex.defeated.length}/${exArea.enemies.length}`));
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

    // 部屋をつなぐ探索と敵の動き（段階47）：今ある地図の絵3枚を部屋としてつなぎ、4種類の動きの敵を置いた区画
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', '試しの区画（段階47。本編では使わない。探索の途中だった区画は、次に入ると最初から）'));
    panel.append(
      button('試しの区画：部屋をつなぐ探索と敵の動き', () => {
        close();
        run.active = true;
        setExplore(null);
        nav.openExplore('trial47');
      }),
    );

    // エンジンを決めるための試作（段階16。本編では使わない）
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', '試作（エンジンを決めるため。本編では使わない）'));
    panel.append(
      button('試作：探索の画面を開く', () => {
        close();
        nav.openPrototype('ProtoExplore');
      }),
    );
    panel.append(
      button('試作：縁日のマップを歩く（絵の見本）', () => {
        close();
        nav.openPrototype('ProtoExplore', { map: 'festival' });
      }),
    );

    // 会話（段階22）：脚本の場面を開く
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', '会話（段階22。M1・M2 の台本）'));
    panel.append(
      button('M1 を通しで読む（プロローグから、ノアとのすれ違いまで）', () => {
        close();
        const [first, ...rest] = M1_SCENE_ORDER;
        nav.openDialogue({ scene: first, queue: rest });
      }),
    );
    const select = el('select', 'display:block;width:100%;min-height:44px;margin:6px 0;font:14px sans-serif;');
    for (const sc of SCENES) {
      const o = el('option', '', `${sc.title}（${sc.id}）`);
      o.value = sc.id;
      select.append(o);
    }
    panel.append(
      select,
      button('↑ の場面を開く', () => {
        close();
        nav.openDialogue({ scene: select.value });
      }),
      button('読んだ印を消す（早送りが止まるか確かめる時に）', () => {
        clearReadLog();
        notify('読んだ印を消しました');
      }),
    );

    // セーブ（段階11）
    panel.append(
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
    );
    panel.append(
      button('セーブを消す（次に「はじめる」まで自動のセーブも止める）', () => {
        if (!window.confirm('セーブを消しますか？')) return;
        deleteSave();
        run.active = false;
        notify('セーブを消しました');
      }),
    );

    // シード
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', `乱数のシード：${run.seed}（${run.fixed ? '固定中' : '毎回ランダム'}）`));
    if (s) panel.append(el('div', 'color:#9fb3c8;', `今の戦闘のシード：${s.seed}`));
    panel.append(
      button(run.fixed ? 'シードの固定をやめる' : 'このシードに固定する', () => {
        run.fixed = !run.fixed;
        notify(run.fixed ? `シード ${run.seed} に固定しました（やり直しても同じ並び）` : 'シードの固定をやめました');
      }),
    );
    panel.append(
      button('シードを指定して最初から', () => {
        const v = window.prompt('シード（0以上の整数）', String(run.seed));
        if (v === null || v.trim() === '' || Number.isNaN(Number(v))) return;
        run.seed = Number(v) >>> 0;
        run.fixed = true;
        close();
        nav.restartRun();
      }),
    );

    // 戦闘ログ
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', '戦闘ログ（新しいものが下）'));
    const log = el(
      'pre',
      'white-space:pre-wrap;word-break:break-all;font:11px/1.5 monospace;background:#0b1118;border:1px solid #3e5670;padding:8px;max-height:45vh;overflow-y:auto;margin:6px 0;',
      s ? formatBattleLog(s).join('\n') : '（戦闘中ではありません）',
    );
    panel.append(log);
    panel.append(button('閉じる', close));
    // 最新のログが見えるように一番下までスクロールする
    requestAnimationFrame(() => {
      log.scrollTop = log.scrollHeight;
    });
  };

  toggle.addEventListener('click', () => {
    render();
    panel.style.display = 'block';
  });
}

/** 飛ばした「時間を返す」出来事は、返したことにする（段階36：返した翌日に持ち主に会う場面が出るように）。前へ戻っても消さない */
function markReturnedBefore(id: string): void {
  const all = flowEvents(SLICE_FLOW);
  for (const e of all.slice(0, Math.max(0, all.findIndex((x) => x.id === id)))) {
    if (e.kind === 'return' && e.area && AREAS[e.area] && !run.returned.includes(e.area)) run.returned = [...run.returned, e.area];
  }
}
