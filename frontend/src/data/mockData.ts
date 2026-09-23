import type { EventItem, TourPlan } from '../types';

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: '安曇野 里山クラフト＆オーガニックマルシェ',
    category: 'marche',
    date: '2026年10月17日 (土) - 18日 (日)',
    time: '10:00 - 15:30',
    locationName: '国営アルプスあづみの公園 前庭広場',
    address: '長野県安曇野市堀金烏川33-4',
    lat: 36.3125,
    lng: 137.8482,
    catchphrase: '北アルプスの麓で、自然の恵みと手仕事のぬくもりに触れる2日間',
    description: '信州の澄んだ空気と清流に育まれた旬の採れたて野菜、手作り酵母パン、木工・陶芸の作家たちが集う週末限定の青空マーケット。出店者と顔を合わせながら、地域の暮らしや素材へのこだわりを直接聞くことができます。飲食ブースやアコースティック生演奏も開催！',
    organizer: {
      name: '山田 航平',
      role: '安曇野ローカルマルシェ実行委員会（Uターン移住5年目）',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      story: '「地域のいいもの」を外から来る人にも日常の延長として感じてほしい。作り手と旅人が笑顔で言葉を交わすあたたかい居場所をつくりたくて始めました。'
    },
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80',
    tags: ['地場野菜', 'クラフト', 'ピクニック', '家族連れ歓迎', '音楽'],
    recommendedFor: ['観光・旅行者歓迎', '週末プチトリップ', '食・オーガニック好き'],
    capacity: '入場自由（一部ワークショップ定員各回10名）',
    fee: '入場無料（飲食・物販は実費）',
    nearbySpots: [
      {
        id: 'spot-1',
        name: '安曇野の隠れ家わさび茶房',
        category: 'カフェ・軽食',
        distance: '徒歩8分',
        description: '名水で育ったわさびを使ったオリジナルスイーツと焙煎珈琲'
      },
      {
        id: 'spot-2',
        name: '碌山美術館（アート散策）',
        category: '文化・観光',
        distance: '車で10分',
        description: 'レンガ造りの美しい教会風建築と信州の近代彫刻'
      }
    ],
    footprints: [
      {
        id: 'fp-1',
        eventId: 'evt-1',
        userName: 'サクラ（東京都）',
        userType: '観光客',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.20',
        comment: '前回の春マルシェにふらっと参加。農家のお母さんが美味しい林檎の見分け方を教えてくれてほっこりしました。木彫りのスプーンをお土産に購入！',
        rating: 5,
        highlightTag: '出店者さんとの会話が最高'
      },
      {
        id: 'fp-2',
        eventId: 'evt-1',
        userName: 'ケンイチ（神奈川県）',
        userType: '移住検討中',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.21',
        comment: '移住の下見を兼ねて訪問。若い移住者の方も多く、地域の温かいコミュニティの雰囲気を肌で感じることができました。',
        rating: 5,
        highlightTag: '移住者とのリアルな出会い'
      },
      {
        id: 'fp-3',
        eventId: 'evt-1',
        userName: 'ミキ（愛知県）',
        userType: '観光客',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.22',
        comment: '子供連れでも芝生で走り回れてのんびり過ごせました。採れたてぶどうジュースが絶品！',
        rating: 4,
        highlightTag: 'ファミリー向け'
      }
    ]
  },
  {
    id: 'evt-2',
    title: '築120年 古民家酒蔵の「秋の伝統味噌・発酵食仕込み体験」',
    category: 'workshop',
    date: '2026年10月24日 (土)',
    time: '13:00 - 16:00',
    locationName: '登録有形文化財 高橋醸造 蔵カフェ「結び」',
    address: '長野県松本市波田2890',
    lat: 36.2081,
    lng: 137.8631,
    catchphrase: '代々受け継がれた木桶と麹の香りに包まれる、身体に優しい食の知恵',
    description: '明治時代から続く造り酒屋の仕込み蔵を特別見学。地元契約栽培の大豆と蔵付きの天然麹を使い、自分だけの熟成味噌を仕込みます（仕込んだ味噌2kgはお持ち帰りいただけます）。作業後は蔵人が振る舞う具だくさん豚汁と新米おにぎりの試食会付き！',
    organizer: {
      name: '高橋 宗一郎',
      role: '高橋醸造 六代目当主',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      story: '百年続く蔵の梁を見上げながら、昔ながらの微生物の働きと手仕事の面白さを体験してほしいです。旅の思い出を半年後の食卓で味わってください。'
    },
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    tags: ['発酵文化', '伝統体験', '持ち帰りあり', '古民家', '食育'],
    recommendedFor: ['手仕事・料理好き', '文化体験', 'ひとり旅・カップル'],
    capacity: '先着15名（要事前申し込み）',
    fee: '4,500円（材料費・仕込み味噌2kg・試食代込み）',
    nearbySpots: [
      {
        id: 'spot-3',
        name: '波田の清流と野鳥の遊歩道',
        category: '自然・散策',
        distance: '徒歩3分',
        description: '梓川の清流を眺めながら歩ける木陰の散策路'
      },
      {
        id: 'spot-4',
        name: '湯の原 立ち寄り天然温泉',
        category: '温泉・癒やし',
        distance: '車で7分',
        description: '地元民に愛される掛け流しの素朴な弱アルカリ性温泉'
      }
    ],
    footprints: [
      {
        id: 'fp-4',
        eventId: 'evt-2',
        userName: 'ユウタ（京都府）',
        userType: 'ワーケーション',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.15',
        comment: 'ワーケーション合間に参加しました。蔵の静けさと発酵の深みある香りにリフレッシュ！仕込んだ味噌が熟成するのが今から楽しみ。',
        rating: 5,
        highlightTag: '歴史を感じる特別な体験'
      },
      {
        id: 'fp-5',
        eventId: 'evt-2',
        userName: 'ミサキ（千葉県）',
        userType: '観光客',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.18',
        comment: '当主のお話がとても面白く、日本の伝統食の奥深さを学びました。試食の新米とお味噌汁が絶品でした！',
        rating: 5,
        highlightTag: '当主のお話が魅力的'
      }
    ]
  },
  {
    id: 'evt-3',
    title: '鎮守の杜 竹灯籠1000本と夜神楽「秋宵の灯火の集い」',
    category: 'festival',
    date: '2026年10月31日 (土)',
    time: '17:00 - 20:30',
    locationName: '穂高神社 境内および参道',
    address: '長野県安曇野市穂高6079',
    lat: 36.3392,
    lng: 137.8837,
    catchphrase: '秋の夜長、幽玄な竹あかりと太鼓の響きが里山を包む幻想的な一夜',
    description: '地域の子どもたちやボランティアが一本一本彫り上げた竹灯籠1000本に火が灯り、秋の夜空の下で伝統の神楽舞が奉納されます。境内の屋台では地元酒蔵の熱燗や、秋の味覚「栗おこわ」「きのこ汁」が振る舞われ、観光客と地元住民が焚き火を囲んで語り合います。',
    organizer: {
      name: '松田 健司',
      role: '穂高伝統文化継承会・地域活性化ワーキンググループ',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      story: '過疎化で途絶えかけた夜の祭りを、竹林整備で出た間伐材を使って再生しました。灯火の温もりの中で、世代や地域を超えた結びつきを感じてください。'
    },
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    tags: ['伝統行事', 'ライトアップ', '夜イベント', '地元グルメ', 'フォトスポット'],
    recommendedFor: ['観光・旅行者歓迎', '写真・カメラ好き', '夜の散策'],
    capacity: '自由参加（竹灯籠点火のプチボランティア当日先着30名募集）',
    fee: '観覧無料（お気持ちの灯火協力金100円〜）',
    nearbySpots: [
      {
        id: 'spot-5',
        name: '穂高温泉郷 足湯処',
        category: '足湯・休憩',
        distance: '車で8分',
        description: '夜間も利用可能な天然温泉の無料足湯スポット'
      },
      {
        id: 'spot-6',
        name: '大王わさび農場 水車小屋',
        category: '名所・景観',
        distance: '車で5分',
        description: '名作映画のロケ地にもなった蓼川沿いの清らかな水車'
      }
    ],
    footprints: [
      {
        id: 'fp-6',
        eventId: 'evt-3',
        userName: 'タツヤ（埼玉県）',
        userType: '観光客',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.21',
        comment: '点火ボランティアに参加！チャッカマンを持って参道の竹灯籠に火を灯していく作業は心に残る素晴らしい体験でした。神楽の音色も鳥肌ものでした。',
        rating: 5,
        highlightTag: '点火ボランティアが感動的'
      },
      {
        id: 'fp-7',
        eventId: 'evt-3',
        userName: 'マナミ（地元ファン）',
        userType: '地元ファン',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.22',
        comment: '毎年楽しみにしています。外から来た旅行者の方と焚き火で自然とお話しできるアットホームな雰囲気が大好きです。',
        rating: 5,
        highlightTag: 'あたたかい地元交流'
      }
    ]
  },
  {
    id: 'evt-4',
    title: '棚田の稲刈りと天日干し（はぜ掛け）体験＆絶景新米おにぎり',
    category: 'nature',
    date: '2026年10月11日 (日)',
    time: '09:30 - 14:00',
    locationName: '信州 四賀の里 眺望の棚田',
    address: '長野県松本市会田4120',
    lat: 36.3508,
    lng: 137.9892,
    catchphrase: '日本の原風景が広がる棚田で、鎌を使った伝統の稲刈りと里山ピクニック',
    description: '急斜面に幾重にも連なる棚田で、地元保存会のおじいちゃん・おばあちゃんの手ほどきを受けながら稲刈りと「はぜ掛け（天日干し）」を体験。心地よい汗を流した後は、澄み渡る秋晴れのアルプスを眺めながら、名水仕込みの新米塩むすびとお漬物を味わいます。長靴・軍手レンタルあり！',
    organizer: {
      name: '小林 義雄 & 里山保全グループ',
      role: '四賀棚田保全会 会長',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      story: '高齢化で耕作が大変な棚田ですが、都会から若い人たちが来て「景色が綺麗！お米が美味しい！」と喜んでくれるのが一番の元気の源です。'
    },
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    tags: ['農業体験', '里山保全', '新米', '絶景', '初心者歓迎', 'ボランティア体験'],
    recommendedFor: ['観光・旅行者歓迎', '親子ファミリー', '食と農に興味がある方'],
    capacity: '20名（事前受付）',
    fee: '2,000円（新米2合プレゼント・昼食おにぎり・保険料込み）',
    nearbySpots: [
      {
        id: 'spot-7',
        name: '里山古民家カフェ「野の花」',
        category: 'カフェ',
        distance: '車で5分',
        description: '季節の野草茶と地元産果物のタルトが味わえる隠れ家カフェ'
      },
      {
        id: 'spot-8',
        name: '四賀化石館・公園',
        category: '体験・見学',
        distance: '車で7分',
        description: 'クジラの化石が見つかった歴史あるジオパークスポット'
      }
    ],
    footprints: [
      {
        id: 'fp-8',
        eventId: 'evt-4',
        userName: 'ダイスケ＆ハルカ（東京都）',
        userType: '観光客',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.22',
        comment: '初めて鎌を持ちました！地元のおじいちゃんがコツを優しく教えてくれてあっという間の半日。労働の後の新米おにぎりの美味しさは一生忘れません。',
        rating: 5,
        highlightTag: '人生初のはぜ掛け体験！'
      }
    ]
  },
  {
    id: 'evt-5',
    title: '廃校リノベ複合施設「森の音」秋のクラフトシネマ＆焚き火BAR',
    category: 'culture',
    date: '2026年11月07日 (土)',
    time: '16:00 - 21:00',
    locationName: '森の音 Campus（旧明科中学校分校）',
    address: '長野県安曇野市明科東川手1102',
    lat: 36.3685,
    lng: 137.9351,
    catchphrase: '木造校舎の校庭で巨大スクリーン野外上映会 ✕ 地元クラフトビールと焚き火',
    description: '廃校となった木造校舎をリノベーションしたクリエイティブ拠点。夕暮れのグラウンドに張られた大型スクリーンで短編ショートフィルムを上映。校舎内では木工やレザーのワークショップ、夜は校庭の焚き火を囲みながら信州クラフトビールとジビエソーセージが楽しめます。',
    organizer: {
      name: '中村 恵美',
      role: '森の音プロジェクト代表 / クリエイティブディレクター',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      story: '使われなくなった学校に再び笑い声と灯りを。県外からのクリエイターや旅行者がふらっと立ち寄って、地元の面白い人と混ざり合える場を目指しています。'
    },
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    tags: ['野外シネマ', 'クラフトビール', '廃校リノベ', '焚き火', '音楽', 'ワーケーション'],
    recommendedFor: ['若者・カップル', 'クリエイター', 'ワーケーション滞在者'],
    capacity: '80名程度',
    fee: '上映鑑賞料1,500円（ワンドリンク付き）',
    nearbySpots: [
      {
        id: 'spot-9',
        name: '廃線敷（旧国鉄篠ノ井線）遊歩道',
        category: '自然・歴史散策',
        distance: '徒歩12分',
        description: '明治のレンガトンネルが残るノスタルジックな廃線ウォーキングコース'
      }
    ],
    footprints: [
      {
        id: 'fp-9',
        eventId: 'evt-5',
        userName: 'コウヘイ（東京都）',
        userType: 'ワーケーション',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        date: '2026.09.19',
        comment: 'コワーキング利用で滞在中にイベントに参加。星空の下で焚き火を囲みながら飲むビールが最高でした。地元の人とも自然に繋がれる素敵な拠点です！',
        rating: 5,
        highlightTag: '最高のワーケーション体験'
      }
    ]
  }
];

export const SAMPLE_TOUR_PLANS: TourPlan[] = [
  {
    id: 'plan-1',
    title: '五感で味わう信州里山・秋の休日めぐりコース',
    subtitle: '朝のオーガニックマルシェから夕暮れの竹灯籠まで、地域の空気と人にどっぷり浸かる贅沢な1日',
    theme: '食と自然・クラフト',
    target: '観光客・週末ひとり旅やカップル',
    duration: '1日（約7時間）',
    recommendedTransport: '車・レンタカー または レンタサイクル（電動アシスト推奨）',
    items: [
      {
        time: '10:00',
        title: '安曇野 里山クラフト＆オーガニックマルシェに到着',
        type: 'event',
        locationName: '国営アルプスあづみの公園 前庭広場',
        description: '出店者さんたちと会話しながら、焼きたてパンや朝採れリンゴを物色。芝生の上でコーヒー片手にアコースティック演奏を聴く。',
        tips: '限定の手作りジャムは午前中のうちに買うのがおすすめ！'
      },
      {
        time: '12:30',
        title: '安曇野の隠れ家わさび茶房でランチ＆散策',
        type: 'meal',
        locationName: '安曇野の隠れ家わさび茶房',
        description: '名水で育ったフレッシュなわさび丼と、お口直しのわさびソフトクリームを堪能。',
        tips: 'テラス席から北アルプスの山並みがきれいに見えます。'
      },
      {
        time: '14:30',
        title: '大王わさび農場＆水車小屋をフォト散歩',
        type: 'spot',
        locationName: '大王わさび農場',
        description: '透き通る蓼川の水面をゆらめく水草と、水車小屋のノスタルジックな風景で深呼吸。',
        tips: '川沿いの木陰ベンチは絶好の休憩スポット。'
      },
      {
        time: '17:00',
        title: '鎮守の杜 竹灯籠1000本と夜神楽に参加＆足跡チェックイン',
        type: 'event',
        locationName: '穂高神社 境内',
        description: '夕暮れとともに灯る竹灯籠の明かりに息を呑む。神楽の音色に耳を傾け、焚き火で温まりながら地元の人と語らう。',
        tips: '点火ボランティアに参加すると記念の竹札がもらえます！'
      }
    ]
  },
  {
    id: 'plan-2',
    title: '手仕事と発酵の知恵に触れる、心整うローカル体験コース',
    subtitle: '百年蔵での味噌仕込みと、廃校カフェで出会う地域のクリエイターたち',
    theme: '文化・体験・発酵食',
    target: '移住検討者・ワーケーション滞在者・学び好き',
    duration: '半日〜夕方（約5時間）',
    recommendedTransport: 'ローカル電車（松本電鉄上高地線 / 大糸線）＋ 徒歩',
    items: [
      {
        time: '13:00',
        title: '築120年 古民家酒蔵で味噌仕込みワークショップ',
        type: 'event',
        locationName: '高橋醸造 蔵カフェ「結び」',
        description: '当主から麹と微生物の循環の話を聞き、自分の手で味噌を仕込む。蔵人が炊いた新米と味噌汁で心もお腹も満たされる。',
        tips: 'エプロンと手ぬぐいを持参すると作業がスムーズです。'
      },
      {
        time: '16:00',
        title: '波田の清流と野鳥の遊歩道をのんびり散策',
        type: 'spot',
        locationName: '梓川沿いの散策路',
        description: '川のせせらぎを聞きながら、仕込んだ味噌の重みをリュックに感じて歩く贅沢なリフレッシュ時間。',
        tips: '夕日に照らされる川面がとても綺麗です。'
      },
      {
        time: '17:30',
        title: '森の音 Campus 焚き火BARで地域の人と交流',
        type: 'event',
        locationName: '森の音 Campus',
        description: '校庭の焚き火を囲んで、信州の地ビールを片手に移住者やクラフト作家とカジュアルなおしゃべり。',
        tips: '「めぐりまち」の足跡マップに今日の感想を投稿してみましょう！'
      }
    ]
  }
];
