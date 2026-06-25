export interface DictationSentence {
  id: number
  level: 'intermediate' | 'advanced'
  audioUrl: string
  fullSentence: string
  displayText: string
  answer: string
}

export const INTERMEDIATE_SENTENCES: DictationSentence[] = [
  { id: 1,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_1.wav',
    fullSentence: '여기 메뉴판 좀 다시 갖다 주시겠어요?',
    displayText:  '여기 [      ] 좀 다시 갖다 주시겠어요?',
    answer: '메뉴판' },

  { id: 2,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_2.wav',
    fullSentence: '교통카드를 단말기에 태그할 때 잔액이 부족하대요.',
    displayText:  '[        ]를 단말기에 태그할 때 잔액이 부족하대요.',
    answer: '교통카드' },

  { id: 3,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_3.wav',
    fullSentence: '카페라떼에 우유 대신 두유로 변경해 주세요.',
    displayText:  '카페라떼에 우유 대신 [    ]로 변경해 주세요.',
    answer: '두유' },

  { id: 4,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_4.wav',
    fullSentence: '텀블러에 담아 주시면 이백 원 할인되나요?',
    displayText:  '[      ]에 담아 주시면 이백 원 할인되나요?',
    answer: '텀블러' },

  { id: 5,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_5.wav',
    fullSentence: '포인트 적립은 핸드폰 번호로 하시면 됩니다.',
    displayText:  '포인트 [    ]은 핸드폰 번호로 하시면 됩니다.',
    answer: '적립' },

  { id: 6,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_6.wav',
    fullSentence: '비닐봉투는 한 장에 백 원인데 구매하시겠습니까?',
    displayText:  '[      ]는 한 장에 백 원인데 구매하시겠습니까?',
    answer: '비닐봉투' },

  { id: 7,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_7.wav',
    fullSentence: '냉동 식품은 집에 가자마자 냉동실에 넣어야 해요.',
    displayText:  '냉동 식품은 집에 가자마자 [    ]에 넣어야 해요.',
    answer: '냉동실' },

  { id: 8,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_8.wav',
    fullSentence: '옷을 사기 전에 탈의실에서 한번 입어 봐도 될까요?',
    displayText:  '옷을 사기 전에 [    ]에서 한번 입어 봐도 될까요?',
    answer: '탈의실' },

  { id: 9,  level: 'intermediate', audioUrl: '/audio/level2/intermediate_9.wav',
    fullSentence: '신발이 발에 꽉 끼어서 한 사이즈 큰 걸로 바꿨어요.',
    displayText:  '신발이 발에 꽉 끼어서 한 [    ] 큰 걸로 바꿨어요.',
    answer: '사이즈' },

  { id: 10, level: 'intermediate', audioUrl: '/audio/level2/intermediate_10.wav',
    fullSentence: '계산대에 줄이 너무 길어서 한참을 기다렸습니다.',
    displayText:  '[    ]에 줄이 너무 길어서 한참을 기다렸습니다.',
    answer: '계산대' },

  { id: 11, level: 'intermediate', audioUrl: '/audio/level2/intermediate_11.wav',
    fullSentence: '기차표를 미리 예매하지 않으면 좌석이 없을 거예요.',
    displayText:  '[    ]를 미리 예매하지 않으면 좌석이 없을 거예요.',
    answer: '기차표' },

  { id: 12, level: 'intermediate', audioUrl: '/audio/level2/intermediate_12.wav',
    fullSentence: '병원에 가기 전에 미리 예약 전화를 해 두었어요.',
    displayText:  '병원에 가기 전에 미리 [   ] 전화를 해 두었어요.',
    answer: '예약' },

  { id: 13, level: 'intermediate', audioUrl: '/audio/level2/intermediate_13.wav',
    fullSentence: '이 약은 식후 삼십 분에 세 번 챙겨 드셔야 합니다.',
    displayText:  '이 약은 [   ] 삼십 분에 세 번 챙겨 드셔야 합니다.',
    answer: '식후' },

  { id: 14, level: 'intermediate', audioUrl: '/audio/level2/intermediate_14.wav',
    fullSentence: '외국인등록증을 발급받으려면 서류가 많이 필요해요.',
    displayText:  '[          ]을 발급받으려면 서류가 많이 필요해요.',
    answer: '외국인등록증' },

  { id: 15, level: 'intermediate', audioUrl: '/audio/level2/intermediate_15.wav',
    fullSentence: '해외로 송금할 때 수수료가 얼마나 나오나요?',
    displayText:  '해외로 [   ]할 때 수수료가 얼마나 나오나요?',
    answer: '송금' },

  { id: 16, level: 'intermediate', audioUrl: '/audio/level2/intermediate_16.wav',
    fullSentence: '내일부터 장마가 시작된다고 하니 우산을 챙기세요.',
    displayText:  '내일부터 [   ]가 시작된다고 하니 우산을 챙기세요.',
    answer: '장마' },

  { id: 17, level: 'intermediate', audioUrl: '/audio/level2/intermediate_17.wav',
    fullSentence: '미세먼지 농도가 높아서 마스크를 써야겠습니다.',
    displayText:  '[     ] 농도가 높아서 마스크를 써야겠습니다.',
    answer: '미세먼지' },

  { id: 18, level: 'intermediate', audioUrl: '/audio/level2/intermediate_18.wav',
    fullSentence: '고장이 난 세탁기를 고치려고 서비스센터에 접수했어요.',
    displayText:  '고장이 난 [    ]를 고치려고 서비스센터에 접수했어요.',
    answer: '세탁기' },

  { id: 19, level: 'intermediate', audioUrl: '/audio/level2/intermediate_19.wav',
    fullSentence: '통장을 개설하려면 도장이나 서명이 필요합니다.',
    displayText:  '[   ]을 개설하려면 도장이나 서명이 필요합니다.',
    answer: '통장' },

  { id: 20, level: 'intermediate', audioUrl: '/audio/level2/intermediate_20.wav',
    fullSentence: '주차장이 만차라서 차를 세울 곳을 찾지 못했어요.',
    displayText:  '[    ]이 만차라서 차를 세울 곳을 찾지 못했어요.',
    answer: '주차장' },

  { id: 21, level: 'intermediate', audioUrl: '/audio/level2/intermediate_21.wav',
    fullSentence: '카트를 이용하려면 백 원짜리 동전이 필요합니다.',
    displayText:  '[   ]를 이용하려면 백 원짜리 동전이 필요합니다.',
    answer: '카트' },

  { id: 22, level: 'intermediate', audioUrl: '/audio/level2/intermediate_22.wav',
    fullSentence: '수저와 젓가락은 테이블 옆 서랍에 들어 있습니다.',
    displayText:  '[   ]와 젓가락은 테이블 옆 서랍에 들어 있습니다.',
    answer: '수저' },

  { id: 23, level: 'intermediate', audioUrl: '/audio/level2/intermediate_23.wav',
    fullSentence: '주말이라 그런지 카페에 빈자리가 하나도 없네요.',
    displayText:  '주말이라 그런지 카페에 [    ]가 하나도 없네요.',
    answer: '빈자리' },

  { id: 24, level: 'intermediate', audioUrl: '/audio/level2/intermediate_24.wav',
    fullSentence: '진동벨이 울리면 주문하신 음료를 받으러 오세요.',
    displayText:  '[    ]이 울리면 주문하신 음료를 받으러 오세요.',
    answer: '진동벨' },

  { id: 25, level: 'intermediate', audioUrl: '/audio/level2/intermediate_25.wav',
    fullSentence: '영수증 필요 없으니까 그냥 버려 주세요.',
    displayText:  '[    ] 필요 없으니까 그냥 버려 주세요.',
    answer: '영수증' },
]

export const ADVANCED_SENTENCES: DictationSentence[] = [
  { id: 1,  level: 'advanced', audioUrl: '/audio/level3/advanced_1.wav',
    fullSentence: '최근 1인 가구가 늘어나면서 소형 가전제품의 판매량이 급증하고 있습니다.',
    displayText:  '최근 1인 가구가 늘어나면서 소형 가전제품의 판매량이 [       ] 있습니다.',
    answer: '급증하고' },

  { id: 2,  level: 'advanced', audioUrl: '/audio/level3/advanced_2.wav',
    fullSentence: '인터넷 익명성을 악용해 타인을 비방하는 댓글 문화는 시급히 개선되어야 합니다.',
    displayText:  '인터넷 익명성을 악용해 타인을 [      ] 댓글 문화는 시급히 개선되어야 합니다.',
    answer: '비방하는' },

  { id: 3,  level: 'advanced', audioUrl: '/audio/level3/advanced_3.wav',
    fullSentence: '환경 보호를 위해 일회용품 사용을 제한하는 제도가 본격적으로 시행되었습니다.',
    displayText:  '환경 보호를 위해 일회용품 사용을 제한하는 제도가 [       ] 시행되었습니다.',
    answer: '본격적으로' },

  { id: 4,  level: 'advanced', audioUrl: '/audio/level3/advanced_4.wav',
    fullSentence: '스마트폰 과의존은 아동 및 청소년의 성장에 부정적인 영향을 미칠 수 있습니다.',
    displayText:  '스마트폰 과의존은 아동 및 청소년의 성장에 [      ] 영향을 미칠 수 있습니다.',
    answer: '부정적인' },

  { id: 5,  level: 'advanced', audioUrl: '/audio/level3/advanced_5.wav',
    fullSentence: '반려동물을 가족처럼 생각하는 인구가 늘면서 관련 시장이 급성장하고 있습니다.',
    displayText:  '반려동물을 가족처럼 생각하는 인구가 늘면서 관련 시장이 [        ] 있습니다.',
    answer: '급성장하고' },

  { id: 6,  level: 'advanced', audioUrl: '/audio/level3/advanced_6.wav',
    fullSentence: '청년들의 주거 안정을 위해 정부에서 여러 대책을 마련하고 있습니다.',
    displayText:  '청년들의 주거 [   ]을 위해 정부에서 여러 대책을 마련하고 있습니다.',
    answer: '안정' },

  { id: 7,  level: 'advanced', audioUrl: '/audio/level3/advanced_7.wav',
    fullSentence: '디지털 기기에 서툰 고령층이 점차 소외되고 있습니다.',
    displayText:  '디지털 기기에 [   ] 고령층이 점차 소외되고 있습니다.',
    answer: '서툰' },

  { id: 8,  level: 'advanced', audioUrl: '/audio/level3/advanced_8.wav',
    fullSentence: '쓰레기 분리배출을 생활화하는 것만으로도 환경 오염을 크게 줄일 수 있습니다.',
    displayText:  '쓰레기 [      ]을 생활화하는 것만으로도 환경 오염을 크게 줄일 수 있습니다.',
    answer: '분리배출' },

  { id: 9,  level: 'advanced', audioUrl: '/audio/level3/advanced_9.wav',
    fullSentence: '의견 차이가 좁혀지지 않아 합의점을 찾기까지 시간이 걸릴 예정입니다.',
    displayText:  '의견 차이가 [       ] 않아 합의점을 찾기까지 시간이 걸릴 예정입니다.',
    answer: '좁혀지지' },

  { id: 10, level: 'advanced', audioUrl: '/audio/level3/advanced_10.wav',
    fullSentence: '급변하는 비즈니스 환경에 유연하게 대처할 수 있는 조직 문화가 필요합니다.',
    displayText:  '급변하는 비즈니스 환경에 [     ] 대처할 수 있는 조직 문화가 필요합니다.',
    answer: '유연하게' },

  { id: 11, level: 'advanced', audioUrl: '/audio/level3/advanced_11.wav',
    fullSentence: '특별 단속 기간 동안 음주운전 및 신호 위반 행위를 집중적으로 처벌합니다.',
    displayText:  '특별 단속 기간 동안 음주운전 및 신호 위반 행위를 [       ] 처벌합니다.',
    answer: '집중적으로' },

  { id: 12, level: 'advanced', audioUrl: '/audio/level3/advanced_12.wav',
    fullSentence: '개인정보 유출을 방지하기 위해 비밀번호를 정기적으로 변경해 주세요.',
    displayText:  '개인정보 [   ]을 방지하기 위해 비밀번호를 정기적으로 변경해 주세요.',
    answer: '유출' },

  { id: 13, level: 'advanced', audioUrl: '/audio/level3/advanced_13.wav',
    fullSentence: '인공지능의 발전이 인간의 일자리에 미치는 영향에 대한 연구가 활발합니다.',
    displayText:  '[      ]의 발전이 인간의 일자리에 미치는 영향에 대한 연구가 활발합니다.',
    answer: '인공지능' },

  { id: 14, level: 'advanced', audioUrl: '/audio/level3/advanced_14.wav',
    fullSentence: '기후 변화로 인한 자연재해가 전 세계적으로 빈번하게 발생하고 있습니다.',
    displayText:  '기후 변화로 인한 자연재해가 전 세계적으로 [      ] 발생하고 있습니다.',
    answer: '빈번하게' },

  { id: 15, level: 'advanced', audioUrl: '/audio/level3/advanced_15.wav',
    fullSentence: '다문화 가정이 늘어남에 따라 서로의 문화를 존중하는 태도가 중요해졌습니다.',
    displayText:  '다문화 가정이 늘어남에 따라 서로의 문화를 [      ] 태도가 중요해졌습니다.',
    answer: '존중하는' },

  { id: 16, level: 'advanced', audioUrl: '/audio/level3/advanced_16.wav',
    fullSentence: '정부가 발표한 새로운 부동산 정책에 대해 시장의 관심이 집중되고 있습니다.',
    displayText:  '정부가 발표한 새로운 [     ] 정책에 대해 시장의 관심이 집중되고 있습니다.',
    answer: '부동산' },

  { id: 17, level: 'advanced', audioUrl: '/audio/level3/advanced_17.wav',
    fullSentence: '제품을 출시하기 전에 소비자의 욕구를 정확히 파악하는 것이 중요합니다.',
    displayText:  '제품을 출시하기 전에 소비자의 욕구를 정확히 [      ] 것이 중요합니다.',
    answer: '파악하는' },

  { id: 18, level: 'advanced', audioUrl: '/audio/level3/advanced_18.wav',
    fullSentence: '대도시 집중 현상을 해결하기 위해 지방 도시를 활성화하려는 노력이 필요합니다.',
    displayText:  '대도시 집중 현상을 해결하기 위해 지방 도시를 [         ] 노력이 필요합니다.',
    answer: '활성화하려는' },

  { id: 19, level: 'advanced', audioUrl: '/audio/level3/advanced_19.wav',
    fullSentence: '고객의 불만 사항을 실시간으로 접수하고 대처하는 시스템이 시급합니다.',
    displayText:  '고객의 불만 사항을 [       ]으로 접수하고 대처하는 시스템이 시급합니다.',
    answer: '실시간' },

  { id: 20, level: 'advanced', audioUrl: '/audio/level3/advanced_20.wav',
    fullSentence: '농촌 지역의 인구 감소 문제를 해결하기 위한 귀농 지원 정책이 활발합니다.',
    displayText:  '농촌 지역의 인구 [   ] 문제를 해결하기 위한 귀농 지원 정책이 활발합니다.',
    answer: '감소' },

  { id: 21, level: 'advanced', audioUrl: '/audio/level3/advanced_21.wav',
    fullSentence: '과도한 스마트폰 사용은 수면 장애를 유발하는 주요 원인 중 하나입니다.',
    displayText:  '과도한 스마트폰 사용은 수면 장애를 [      ] 주요 원인 중 하나입니다.',
    answer: '유발하는' },

  { id: 22, level: 'advanced', audioUrl: '/audio/level3/advanced_22.wav',
    fullSentence: '소방차와 구급차가 신속히 이동할 수 있도록 길을 양보해 주십시오.',
    displayText:  '소방차와 구급차가 [    ] 이동할 수 있도록 길을 양보해 주십시오.',
    answer: '신속히' },

  { id: 23, level: 'advanced', audioUrl: '/audio/level3/advanced_23.wav',
    fullSentence: '현대 사회에서는 기계화로 인해 인간의 노동 가치가 점차 변화하고 있습니다.',
    displayText:  '현대 사회에서는 기계화로 인해 인간의 노동 가치가 [   ] 변화하고 있습니다.',
    answer: '점차' },

  { id: 24, level: 'advanced', audioUrl: '/audio/level3/advanced_24.wav',
    fullSentence: '에너지 절약을 위해 여름철 실내 적정 온도를 유지해야 합니다.',
    displayText:  '에너지 [   ]을 위해 여름철 실내 적정 온도를 유지해야 합니다.',
    answer: '절약' },

  { id: 25, level: 'advanced', audioUrl: '/audio/level3/advanced_25.wav',
    fullSentence: '주말마다 전통 시장에서는 시민들을 위한 다양한 문화 행사가 열립니다.',
    displayText:  '주말마다 [   ] 시장에서는 시민들을 위한 다양한 문화 행사가 열립니다.',
    answer: '전통' },
]

export function pickRandom(arr: DictationSentence[], count = 10): DictationSentence[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
