import { describe, expect, it } from 'vitest';
import { voice } from '../test/fixtures';
import { createInitialState, reducer } from './reducer';

const msg = (text: string) => ({ id: text, role: 'user' as const, text });

describe('reducer', () => {
  it('ADD_VOICE で userVoices が増える（同じ id は重複させない）', () => {
    const v = voice('hitachiota-bamboo', 5, 'unknown', ['竹'], { source: 'user' });
    const s1 = reducer(createInitialState(), { type: 'ADD_VOICE', voice: v });
    expect(s1.userVoices).toEqual([v]);
    expect(reducer(s1, { type: 'ADD_VOICE', voice: v }).userVoices).toHaveLength(1);
  });

  it('RESET で初期状態に戻る（利用者の声・会話・選択が消える）', () => {
    let s = createInitialState();
    s = reducer(s, { type: 'ADD_VOICE', voice: voice('hitachiota-bamboo', 5, 'unknown', ['竹']) });
    s = reducer(s, { type: 'START_CONSULT', message: msg('こんにちは') });
    s = reducer(s, { type: 'SELECT_TOWN', townId: 'hitachiota' });
    expect(reducer(s, { type: 'RESET' })).toEqual(createInitialState());
  });

  it('DIM_TOWNS は同じ町を重複させない', () => {
    const e = { townId: 'daigo', rule: 'dayTrip' as const, reason: 'r' };
    let s = reducer(createInitialState(), { type: 'DIM_TOWNS', eliminations: [e] });
    s = reducer(s, { type: 'DIM_TOWNS', eliminations: [e] });
    expect(s.dimmed).toEqual(['daigo']);
    expect(s.narrowingLog).toEqual([e]);
  });

  it('START_CONSULT で前の絞り込みを消し、条件タグを隠す', () => {
    let s = reducer(createInitialState(), { type: 'DIM_TOWNS', eliminations: [{ townId: 'daigo', rule: 'dayTrip', reason: 'r' }] });
    s = reducer(s, { type: 'START_CONSULT', message: msg('a') });
    expect(s.dimmed).toEqual([]);
    expect(s.conditions).toBeNull();
    expect(s.consultPhase).toBe('thinking');
  });

  it('初期状態の summaries は声のある5町ぶん', () => {
    expect(Object.keys(createInitialState().summaries).sort()).toEqual(
      ['daigo', 'hitachi', 'hitachiota', 'kitaibaraki', 'takahagi'],
    );
  });

  it('初期状態は日本全体の表示で、気になる町は空', () => {
    const s0 = createInitialState();
    expect(s0.mapView).toBe('japan');
    expect(s0.favorites).toEqual([]);
    expect(s0.prefNotice).toBeNull();
  });

  it('TOGGLE_FAVORITE で付けて、もう一度で外す（押した順を保つ）', () => {
    let s = reducer(createInitialState(), { type: 'TOGGLE_FAVORITE', townId: 'takahagi' });
    s = reducer(s, { type: 'TOGGLE_FAVORITE', townId: 'hitachiota' });
    expect(s.favorites).toEqual(['takahagi', 'hitachiota']);
    s = reducer(s, { type: 'TOGGLE_FAVORITE', townId: 'takahagi' });
    expect(s.favorites).toEqual(['hitachiota']);
  });

  it('町を選ぶと県北の表示になり、選択を外しても表示は変えない', () => {
    let s = reducer(createInitialState(), { type: 'SHOW_PREF_NOTICE', name: '栃木県' });
    s = reducer(s, { type: 'SELECT_TOWN', townId: 'hitachiota' });
    expect(s.mapView).toBe('kenpoku');
    expect(s.prefNotice).toBeNull();
    s = reducer(s, { type: 'SELECT_TOWN', townId: null });
    expect(s.mapView).toBe('kenpoku');
  });

  it("SET_MAP_VIEW('japan') で選んだ町と通知が消える。会話と提案は残す", () => {
    let s = reducer(createInitialState(), { type: 'START_CONSULT', message: msg('a') });
    s = reducer(s, { type: 'SELECT_TOWN', townId: 'hitachiota' });
    s = reducer(s, { type: 'SHOW_NO_VOICE', townId: 'hitachiomiya' });
    s = reducer(s, { type: 'SET_MAP_VIEW', view: 'japan' });
    expect(s.mapView).toBe('japan');
    expect(s.selectedTownId).toBeNull();
    expect(s.noVoiceTownId).toBeNull();
    expect(s.messages).toHaveLength(1);
    s = reducer(s, { type: 'SHOW_PREF_NOTICE', name: '栃木県' });
    expect(reducer(s, { type: 'SET_MAP_VIEW', view: 'kenpoku' }).prefNotice).toBeNull();
  });

  it('RESET で気になる町が消え、日本全体の表示に戻る', () => {
    let s = createInitialState([], ['takahagi']);
    s = reducer(s, { type: 'SET_MAP_VIEW', view: 'kenpoku' });
    s = reducer(s, { type: 'RESET' });
    expect(s.favorites).toEqual([]);
    expect(s.mapView).toBe('japan');
  });

  describe('町が投稿したスポット（N6）', () => {
    const posted = {
      id: 'posted-x1', townId: 'hitachiota', name: '新しい茶屋', kind: '食べる' as const, description: '説明',
      lat: 36.53, lng: 140.51, order: 0, stayMin: 30, moveMin: 0, costYen: 500, posted: true as const,
      photoSpotId: 'hitachiota-soba', createdAt: '2026-09-24T10:00:00.000Z',
    };
    it('POST_SPOT で増え、同じ id は重複させない', () => {
      let s = reducer(createInitialState(), { type: 'POST_SPOT', spot: posted });
      s = reducer(s, { type: 'POST_SPOT', spot: posted });
      expect(s.postedSpots).toEqual([posted]);
    });
    it('REMOVE_POSTED_SPOT でそのスポットに書かれた声も消え、町のタグを作り直す', () => {
      let s = reducer(createInitialState(), { type: 'POST_SPOT', spot: posted });
      const v1 = voice('posted-x1', 5, 'unknown', ['温泉'], { source: 'user' });
      const v2 = voice('hitachiota-bamboo', 5, 'unknown', ['竹'], { source: 'user' });
      s = reducer(s, { type: 'ADD_VOICE', voice: v1 });
      s = reducer(s, { type: 'ADD_VOICE', voice: v2 });
      s = reducer(s, { type: 'REMOVE_POSTED_SPOT', spotId: 'posted-x1' });
      expect(s.postedSpots).toEqual([]);
      expect(s.userVoices).toEqual([v2]);
    });
    it('RESET で消える', () => {
      const s = reducer(createInitialState([], [], [posted]), { type: 'RESET' });
      expect(s.postedSpots).toEqual([]);
    });
  });
});
