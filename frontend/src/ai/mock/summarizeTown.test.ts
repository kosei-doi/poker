import { describe, expect, it } from 'vitest';
import { town, voice } from '../../test/fixtures';
import type { Tag } from '../../types';
import { makeCatchphrase, summarizeTownSync } from './summarizeTown';

const t = town('t');
const v = (sat: 1 | 2 | 3 | 4 | 5, tags: Tag[]) => voice('s', sat, 'unsure', tags);

describe('summarizeTown', () => {
  it('満足度4以上の声だけ数え、件数2以上を多い順に最大5個', () => {
    const s = summarizeTownSync(t, [
      v(5, ['竹', '静か']), v(4, ['竹', '静か']), v(4, ['竹', '散策']), v(4, ['散策', '歴史']), v(4, ['歴史', 'そば']),
      v(4, ['そば', '海']), v(4, ['海', '温泉']), v(4, ['温泉']),
      v(3, ['滝']), v(2, ['滝']), v(1, ['滝']),
    ]);
    expect(s.tags).toEqual([
      { tag: '竹', count: 3 },
      { tag: '静か', count: 2 },
      { tag: '海', count: 2 },
      { tag: '散策', count: 2 },
      { tag: '温泉', count: 2 },
    ]);
    expect(s.catchphrase).toBe('竹と静けさの町');
  });

  it('3個に届かなければ件数1のタグを語彙の順で足す', () => {
    const s = summarizeTownSync(t, [v(4, ['竹']), v(4, ['竹']), v(4, ['温泉']), v(4, ['海']), v(4, ['滝'])]);
    expect(s.tags).toEqual([
      { tag: '竹', count: 2 },
      { tag: '滝', count: 1 },
      { tag: '海', count: 1 },
    ]);
  });

  it('同数は語彙の順', () => {
    const s = summarizeTownSync(t, [v(4, ['温泉', '静か']), v(4, ['温泉', '静か'])]);
    expect(s.tags.map((x) => x.tag)).toEqual(['静か', '温泉']);
  });

  it('一言: 2個以上・1個・0個', () => {
    expect(makeCatchphrase(['竹', '静か'])).toBe('竹と静けさの町');
    expect(makeCatchphrase(['竹'])).toBe('竹の町');
    expect(makeCatchphrase([])).toBe('声を集めています');
    expect(summarizeTownSync(t, [v(3, ['竹'])]).catchphrase).toBe('声を集めています');
  });

  it('一言は15字以内（15字を超えたら上位1つだけ）', () => {
    for (const a of ['静か', '散策', '避暑'] as Tag[]) {
      for (const b of ['散策', '避暑', '自然'] as Tag[]) {
        if (a === b) continue;
        expect([...makeCatchphrase([a, b])].length).toBeLessThanOrEqual(15);
      }
    }
  });
});
