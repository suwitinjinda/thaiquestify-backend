// data/tourist-attractions/chiang-mai.js
// สถานที่ท่องเที่ยวเชียงใหม่ สำหรับเควส Check-in

const chiangMaiAttractions = [
  {
    id: 'chiang-mai-001',
    name: 'ดอยอินทนนท์',
    nameEn: 'Doi Inthanon',
    description: 'ยอดเขาที่สูงที่สุดในประเทศไทย สูง 2,565 เมตร มีอากาศเย็นสบายตลอดปี เป็นจุดชมวิวทะเลหมอกที่สวยงาม มีน้ำตกหลายแห่ง และพระมหาธาตุนภเมทนีดล พระมหาธาตุนภพลภูมิสิริ',
    coordinates: {
      latitude: 18.588004,
      longitude: 98.486770
    },
    category: 'mountain',
    categories: ['mountain', 'park', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอจอมทอง',
    address: 'อุทยานแห่งชาติดอยอินทนนท์ อำเภอจอมทอง จังหวัดเชียงใหม่',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-002',
    name: 'วัดพระธาตุดอยสุเทพ',
    nameEn: 'Wat Phra That Doi Suthep',
    description: 'วัดสำคัญที่ตั้งอยู่บนดอยสุเทพ สูง 1,073 เมตร จากระดับน้ำทะเล สามารถชมวิวเมืองเชียงใหม่ได้จากจุดนี้ มีพระบรมธาตุเจดีย์ที่สวยงาม และบันไดนาค 306 ขั้น',
    coordinates: {
      latitude: 18.80493,
      longitude: 98.92202
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'ดอยสุเทพ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-003',
    name: 'ถนนนิมมานเหมินทร์',
    nameEn: 'Nimmanhaemin Road',
    description: 'ย่านที่เต็มไปด้วยคาเฟ่ ร้านอาหาร และร้านค้าที่มีสไตล์ทันสมัย เหมาะสำหรับการเดินเล่นและช้อปปิ้ง เป็นย่านที่ได้รับความนิยมจากนักท่องเที่ยวและคนท้องถิ่น',
    coordinates: {
      latitude: 18.8000,
      longitude: 98.9700
    },
    category: 'other',
    categories: ['shopping', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'ถนนนิมมานเหมินทร์ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-004',
    name: 'อุทยานแห่งชาติดอยสุเทพ-ปุย',
    nameEn: 'Doi Suthep-Pui National Park',
    description: 'พื้นที่ธรรมชาติที่มีน้ำตกและเส้นทางเดินป่าหลายแห่ง เหมาะสำหรับผู้ที่รักการผจญภัย มีน้ำตกห้วยแก้ว น้ำตกมณฑาธาร และจุดชมวิวต่างๆ',
    coordinates: {
      latitude: 18.8500,
      longitude: 98.9000
    },
    category: 'park',
    categories: ['park', 'mountain', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อุทยานแห่งชาติดอยสุเทพ-ปุย อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-005',
    name: 'หมู่บ้านแม่กำปอง',
    nameEn: 'Mae Kampong Village',
    description: 'หมู่บ้านเล็กๆ ในหุบเขาที่มีบรรยากาศเงียบสงบและธรรมชาติสวยงาม มีน้ำตกแม่กำปอง ไร่ชา และโฮมสเตย์สำหรับพักผ่อน',
    coordinates: {
      latitude: 18.7833,
      longitude: 99.2167
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอแม่แจ่ม',
    address: 'หมู่บ้านแม่กำปอง อำเภอแม่แจ่ม จังหวัดเชียงใหม่',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-006',
    name: 'ตลาดวโรรส',
    nameEn: 'Warorot Market',
    description: 'ตลาดเก่าแก่ที่มีสินค้าหลากหลาย ทั้งอาหารพื้นเมืองและของฝาก เป็นตลาดที่ได้รับความนิยมจากนักท่องเที่ยวและคนท้องถิ่น',
    coordinates: {
      latitude: 18.7900,
      longitude: 98.9900
    },
    category: 'market',
    categories: ['market', 'shopping', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'ถนนเจริญเมือง อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-007',
    name: 'สวนสัตว์เชียงใหม่',
    nameEn: 'Chiang Mai Zoo',
    description: 'สถานที่ที่เหมาะสำหรับครอบครัว มีสัตว์หลากหลายชนิดและกิจกรรมที่น่าสนใจ มีอุโมงค์สัตว์น้ำ และจุดชมวิว',
    coordinates: {
      latitude: 18.8083,
      longitude: 98.9417
    },
    category: 'zoo',
    categories: ['zoo', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: '100 ถนนห้วยแก้ว อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-008',
    name: 'วัดเจดีย์หลวง',
    nameEn: 'Wat Chedi Luang',
    description: 'วัดเก่าแก่ที่มีเจดีย์ขนาดใหญ่ที่ถูกทำลายบางส่วนจากแผ่นดินไหว แต่ยังคงความงดงามและเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 18.7875,
      longitude: 98.9867
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'ถนนพระปกเกล้า อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-009',
    name: 'วัดพระสิงห์',
    nameEn: 'Wat Phra Singh',
    description: 'วัดสำคัญที่มีพระพุทธสิหิงค์ประดิษฐานอยู่ เป็นวัดที่มีสถาปัตยกรรมล้านนาที่สวยงามและเป็นที่เคารพของชาวเชียงใหม่',
    coordinates: {
      latitude: 18.7883,
      longitude: 98.9850
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'ถนนสิงหราช อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-mai-010',
    name: 'ประตูท่าแพ',
    nameEn: 'Tha Phae Gate',
    description: 'ประตูเมืองเก่าที่เป็นสัญลักษณ์สำคัญของเชียงใหม่ เป็นจุดเริ่มต้นของย่านเมืองเก่าและเป็นสถานที่ถ่ายรูปยอดนิยม',
    coordinates: {
      latitude: 18.7883,
      longitude: 98.9900
    },
    category: 'historical',
    categories: ['historical', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'ถนนท่าแพ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return chiangMaiAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return chiangMaiAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return chiangMaiAttractions.filter(attraction =>
    attraction.isActive &&
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  chiangMaiAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
