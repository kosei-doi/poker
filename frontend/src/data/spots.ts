import type { Spot } from '../types';

// 要件 7.2。説明文には声にない事実（店名・営業時間・数字）を書かない
export const SPOTS: Spot[] = [
  // 常陸太田市（旅費 8,000 + 1,500 = 9,500円）
  {
    id: 'hitachiota-bamboo', townId: 'hitachiota', name: '西山の竹林の小径', kind: '見る',
    description: '竹林の中を抜ける細い道。風が吹くと竹の葉が鳴る。',
    lat: 36.524, lng: 140.505, order: 1, stayMin: 50, moveMin: 15, costYen: 0,
  },
  {
    id: 'hitachiota-kujiragaoka', townId: 'hitachiota', name: '鯨ヶ丘の坂の町並み', kind: '見る',
    description: '坂道に沿って古い建物が並ぶ町並み。路地を歩いて回れる。',
    lat: 36.54, lng: 140.528, order: 2, stayMin: 60, moveMin: 10, costYen: 0,
  },
  {
    id: 'hitachiota-soba', townId: 'hitachiota', name: '常陸秋そばの店', kind: '食べる',
    description: '地元のそば粉で打つそばの店。',
    lat: 36.558, lng: 140.541, order: 3, stayMin: 60, moveMin: 25, costYen: 1200,
  },
  {
    id: 'hitachiota-temple', townId: 'hitachiota', name: '山あいの古刹', kind: '見る',
    description: '山の中腹にある古いお寺。石段を上ってお参りする。',
    lat: 36.6, lng: 140.49, order: 4, stayMin: 45, moveMin: 0, costYen: 300,
  },
  // 高萩市（旅費 8,400 + 1,000 = 9,400円）
  {
    id: 'takahagi-hananuki', townId: 'takahagi', name: '花貫渓谷', kind: '見る',
    description: '吊り橋から渓流を見下ろせる渓谷。',
    lat: 36.76, lng: 140.62, order: 1, stayMin: 60, moveMin: 5, costYen: 0,
  },
  {
    id: 'takahagi-trail', townId: 'takahagi', name: '渓谷沿いの遊歩道', kind: '体験',
    description: '川沿いに続く遊歩道。足元に気をつけて歩く。',
    lat: 36.776, lng: 140.636, order: 2, stayMin: 70, moveMin: 25, costYen: 0,
  },
  {
    id: 'takahagi-diner', townId: 'takahagi', name: '山里の食堂', kind: '食べる',
    description: '地元の人も通う小さな食堂。',
    lat: 36.725, lng: 140.7, order: 3, stayMin: 60, moveMin: 0, costYen: 1000,
  },
  // 日立市（旅費 7,400 + 1,000 = 8,400円）
  {
    id: 'hitachi-oiwa', townId: 'hitachi', name: '御岩神社', kind: '見る',
    description: '山のふもとにある神社。参道は木々に囲まれている。',
    lat: 36.638, lng: 140.6, order: 1, stayMin: 70, moveMin: 25, costYen: 0,
  },
  {
    id: 'hitachi-kamine', townId: 'hitachi', name: 'かみね公園の高台', kind: '見る',
    description: '市街地と海を見下ろす高台の公園。',
    lat: 36.606, lng: 140.638, order: 2, stayMin: 50, moveMin: 10, costYen: 0,
  },
  {
    id: 'hitachi-cafe', townId: 'hitachi', name: '海沿いのカフェ', kind: '食べる',
    description: '窓の外に海が広がるカフェ。',
    lat: 36.576, lng: 140.646, order: 3, stayMin: 60, moveMin: 10, costYen: 1000,
  },
  {
    id: 'hitachi-station', townId: 'hitachi', name: '海の見える駅舎', kind: '見る',
    description: 'ガラス張りの駅舎。通路から海が見える。',
    lat: 36.592, lng: 140.662, order: 4, stayMin: 30, moveMin: 0, costYen: 0,
  },
  // 北茨城市（旅費 8,800 + 2,600 = 11,400円）
  {
    id: 'kitaibaraki-izura', townId: 'kitaibaraki', name: '五浦海岸', kind: '見る',
    description: '岩場と入り江が続く海岸。',
    lat: 36.835, lng: 140.775, order: 1, stayMin: 60, moveMin: 15, costYen: 0,
  },
  {
    id: 'kitaibaraki-anko', townId: 'kitaibaraki', name: 'あんこう料理の店', kind: '食べる',
    description: '港町のあんこう料理と海鮮の店。',
    lat: 36.855, lng: 140.77, order: 2, stayMin: 70, moveMin: 20, costYen: 2000,
  },
  {
    id: 'kitaibaraki-onsen', townId: 'kitaibaraki', name: '海辺の温泉', kind: '体験',
    description: '海の近くの日帰り温泉。',
    lat: 36.8, lng: 140.745, order: 3, stayMin: 90, moveMin: 0, costYen: 600,
  },
  // 大子町（旅費 9,400 + 2,600 = 12,000円）
  {
    id: 'daigo-fukuroda', townId: 'daigo', name: '袋田の滝', kind: '見る',
    description: '岩肌を何段にも流れ落ちる滝。',
    lat: 36.763, lng: 140.406, order: 1, stayMin: 70, moveMin: 20, costYen: 300,
  },
  {
    id: 'daigo-soba', townId: 'daigo', name: '奥久慈のそば店', kind: '食べる',
    description: '町なかのそば店。',
    lat: 36.77, lng: 140.355, order: 2, stayMin: 60, moveMin: 15, costYen: 1500,
  },
  {
    id: 'daigo-onsen', townId: 'daigo', name: '山あいの温泉', kind: '体験',
    description: '山に囲まれた温泉。',
    lat: 36.8, lng: 140.36, order: 3, stayMin: 90, moveMin: 0, costYen: 800,
  },
];

export const spotById = (id: string) => SPOTS.find((s) => s.id === id);
export const spotsOfTown = (townId: string) => SPOTS.filter((s) => s.townId === townId).sort((a, b) => a.order - b.order);
