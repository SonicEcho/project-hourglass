import { formatBattleLog } from './battleLog';
import { healAllAllies, setEnemyHpToOne } from './cheats';
import { addItems, addParts, defeatEnemy, flowEvents } from '../core';
import { AREAS, ITEMS, M1_SCENE_ORDER, M1_SCENES, NAVI_PARTS, SLICE_FLOW, WEAPON_DATA } from '../data';
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
      button('素材とアイテムを全種類2つずつもらう', () => {
        const ids = Object.keys(ITEMS);
        run.armory = addItems(run.armory, [...ids, ...ids]);
        nav.refreshGrowth();
        notify('素材とアイテムを全種類2つずつもらいました');
      }),
    );
    panel.append(
      button(`3人の武器を Lv${WEAPON_DATA.evolveLevel} にする`, () => {
        const need = WEAPON_DATA.levelExp[WEAPON_DATA.evolveLevel - 2] ?? 0;
        const weapons = { ...run.armory.weapons };
        for (const [id, w] of Object.entries(weapons)) weapons[id] = { ...w, exp: Math.max(w.exp, need) };
        run.armory = { ...run.armory, weapons };
        nav.refreshGrowth();
        notify(`3人の武器を Lv${WEAPON_DATA.evolveLevel} にしました`);
      }),
    );

    // 画面の切り替え
    panel.append(
      button('ボス戦（戦闘5）から始める（育成はそのまま）', () => {
        close();
        nav.startBoss();
      }),
    );

    // 物語の流れ（段階23）：出来事を飛ばす・選んで飛ぶ
    const now = currentEvent();
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', `物語の流れ（段階23）：今は「${now.title}」（${now.id}・${run.progress.day}日目）`));
    panel.append(
      button('次の出来事へ飛ばす', () => {
        close();
        run.active = true;
        // 探索の途中なら、探索を終えたことにする
        if (run.explore) setExplore(null);
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
    const exArea = ex ? AREAS[ex.area] : undefined;
    if (ex && exArea) {
      panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', `探索（段階25）：${exArea.name}　倒した敵 ${ex.defeated.length}/${exArea.enemies.length}`));
      panel.append(
        button('探索：敵の印を全部倒したことにする', () => {
          close();
          setExplore(exArea.enemies.reduce((st, e) => defeatEnemy(st, e.id), ex));
          nav.openExplore(exArea.id);
        }),
        button('探索：ボスの手前へ移る', () => {
          close();
          const [c, r] = exArea.boss.cell;
          setExplore({ ...ex, cell: [c, r + 2] });
          nav.openExplore(exArea.id);
        }),
      );
    }

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
    panel.append(el('div', 'margin-top:12px;color:#9fb3c8;', '会話（段階22。M1 の台本）'));
    panel.append(
      button('M1 を通しで読む（プロローグから、ノアとのすれ違いまで）', () => {
        close();
        const [first, ...rest] = M1_SCENE_ORDER;
        nav.openDialogue({ scene: first, queue: rest });
      }),
    );
    const select = el('select', 'display:block;width:100%;min-height:44px;margin:6px 0;font:14px sans-serif;');
    for (const sc of M1_SCENES) {
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
