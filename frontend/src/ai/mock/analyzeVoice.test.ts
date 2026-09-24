import { describe, expect, it } from 'vitest';
import { DEMO_VOICE } from '../../data/examples';
import { analyzeVoiceSync } from './analyzeVoice';

describe('analyzeVoice', () => {
  it('デモの感想文 → 満足度5・知らなかった・#竹 #静か（要件 7.6）', () => {
    const a = analyzeVoiceSync(DEMO_VOICE);
    expect(a.satisfaction).toBe(5);
    expect(a.satisfactionDetermined).toBe(true);
    expect(a.known).toBe('unknown');
    expect(a.tags).toEqual(['静か', '竹']);
    expect(a.evidence).toBe('名前も知らなかったけど、竹の小道を独り占めできて最高。');
  });

  it('判定の言葉がなければ 3 で「判定できなかった」', () => {
    const a = analyzeVoiceSync('竹林を見た');
    expect(a.satisfaction).toBe(3);
    expect(a.satisfactionDetermined).toBe(false);
    expect(a.tags).toEqual(['竹']);
    expect(a.evidence).toBe('竹林を見た');
  });

  it('1〜5 に収める', () => {
    expect(analyzeVoiceSync('最高、感動、大満足、素晴らしい、また来たい').satisfaction).toBe(5);
    expect(analyzeVoiceSync('残念、微妙、がっかり、不便、期待外れ').satisfaction).toBe(1);
  });

  it('「良くなかった」を加点しない', () => {
    const a = analyzeVoiceSync('料理が良くなかった');
    expect(a.satisfaction).toBe(2);
    expect(a.satisfactionDetermined).toBe(true);
  });

  it('知っていたか', () => {
    expect(analyzeVoiceSync('前から気になっていた').known).toBe('known');
    expect(analyzeVoiceSync('有名な場所').known).toBe('known');
    expect(analyzeVoiceSync('初めて知った').known).toBe('unknown');
    expect(analyzeVoiceSync('良かった').known).toBe('unsure');
    expect(analyzeVoiceSync('有名じゃないけど最高').known).toBe('unsure');
    // 両方あれば「知らなかった」を優先
    expect(analyzeVoiceSync('有名らしいけど知らなかった').known).toBe('unknown');
  });

  it('根拠の文: 満足度の語 → タグの語 → 最初の文', () => {
    expect(analyzeVoiceSync('駅から歩いた。竹林が最高。').evidence).toBe('竹林が最高。');
    expect(analyzeVoiceSync('駅に着いた。竹林を抜けた。').evidence).toBe('竹林を抜けた。');
    expect(analyzeVoiceSync('駅に着いた。帰った。').evidence).toBe('駅に着いた。');
  });

  it('「海鮮」は #海 に数えない', () => {
    expect(analyzeVoiceSync('海鮮丼が最高').tags).toEqual(['海鮮']);
    expect(analyzeVoiceSync('海を見ながら海鮮丼').tags).toEqual(['海', '海鮮']);
  });
});
