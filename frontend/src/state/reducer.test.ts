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
    s = reducer(s, { type: 'OPEN_REPORT', townId: 'hitachiota' });
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
});
