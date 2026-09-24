import type { FamousPlace } from '../types';

// 要件 7.5 の有名地辞書（10件）
export const FAMOUS_PLACES: FamousPlace[] = [
  { id: 'kyoto-bamboo', name: '京都の竹林', aliases: ['京都の竹林', '嵐山の竹林', '竹林の小径', '嵯峨野'], tags: ['竹', '静か', '散策'] },
  { id: 'karuizawa', name: '軽井沢', aliases: ['軽井沢'], tags: ['避暑', '自然', 'カフェ'] },
  { id: 'oirase', name: '奥入瀬', aliases: ['奥入瀬'], tags: ['渓谷', '滝', '自然'] },
  { id: 'kamakura', name: '鎌倉', aliases: ['鎌倉'], tags: ['寺社', '歴史', '散策', '海'] },
  { id: 'hakone', name: '箱根', aliases: ['箱根'], tags: ['温泉', '自然', '歴史'] },
  { id: 'atami', name: '熱海', aliases: ['熱海'], tags: ['温泉', '海', '海鮮'] },
  { id: 'hakodate', name: '函館', aliases: ['函館'], tags: ['海鮮', '朝市', '歴史'] },
  { id: 'nikko', name: '日光', aliases: ['日光'], tags: ['寺社', '滝', '紅葉', '歴史'] },
  { id: 'takachiho', name: '高千穂峡', aliases: ['高千穂峡', '高千穂'], tags: ['渓谷', '寺社', '自然'] },
  { id: 'achi', name: '阿智村', aliases: ['阿智村'], tags: ['星空', '自然', '静か'] },
];
