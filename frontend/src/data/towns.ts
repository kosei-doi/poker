import type { Town } from '../types';

// 要件 7.1・7.2。片道所要時間と往復交通費は東京駅から特急ひたち（＋水郡線）を使う想定の目安（1人）
// labelPoint は mapshaper -points inner の点を基準に、スマホ幅でラベル同士が重ならないよう境界の内側で少しずらしている
export const TOWNS: Town[] = [
  {
    id: 'hitachi', name: '日立市', code: '08202', oneWayMin: 90, roundTripYen: 7400,
    companions: ['友達と', 'ひとり', 'ふたり', '家族と'], labelPoint: [36.67, 140.61],
  },
  {
    id: 'hitachiota', name: '常陸太田市', code: '08212', oneWayMin: 110, roundTripYen: 8000,
    companions: ['友達と', 'ひとり', 'ふたり'], labelPoint: [36.52, 140.5],
  },
  {
    id: 'takahagi', name: '高萩市', code: '08214', oneWayMin: 100, roundTripYen: 8400,
    companions: ['友達と', 'ひとり', 'ふたり', '家族と'], labelPoint: [36.796, 140.598],
  },
  {
    id: 'kitaibaraki', name: '北茨城市', code: '08215', oneWayMin: 115, roundTripYen: 8800,
    companions: ['友達と', 'ひとり', 'ふたり', '家族と'], labelPoint: [36.84, 140.66],
  },
  {
    id: 'hitachiomiya', name: '常陸大宮市', code: '08225', oneWayMin: 120, roundTripYen: 8600,
    companions: [], labelPoint: [36.618, 140.342],
  },
  {
    id: 'daigo', name: '大子町', code: '08364', oneWayMin: 170, roundTripYen: 9400,
    companions: ['友達と', 'ふたり', '家族と'], labelPoint: [36.791, 140.335],
  },
];

export const townById = (id: string) => TOWNS.find((t) => t.id === id);
