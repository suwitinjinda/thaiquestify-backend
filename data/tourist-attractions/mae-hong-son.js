// data/tourist-attractions/mae-hong-son.js
// สถานที่ท่องเที่ยวแม่ฮ่องสอน สำหรับเควส Check-in

const maeHongSonAttractions = [
  {
    id: 'mae-hong-son-001',
    name: 'ปางอุ๋ง',
    nameEn: 'Pang Ung',
    description: 'โครงการพระราชดำริปางตอง 2 หรือที่รู้จักกันในชื่อ "ปางอุ๋ง" เป็นจุดกางเต็นท์ยอดนิยมริมอ่างเก็บน้ำขนาดเล็ก ท่ามกลางป่าสนและบรรยากาศที่เงียบสงบ เหมาะสำหรับการพักผ่อนและชมธรรมชาติ',
    coordinates: {
      latitude: 19.498184,
      longitude: 97.909558
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'แม่ฮ่องสอน',
    district: 'อำเภอเมืองแม่ฮ่องสอน',
    address: 'ตำบลหมอกจำแป่ อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mae-hong-son-002',
    name: 'หมู่บ้านรักไทย',
    nameEn: 'Ban Rak Thai',
    description: 'หมู่บ้านชาวจีนยูนนานที่ตั้งอยู่ท่ามกลางหุบเขาและอ่างเก็บน้ำ นักท่องเที่ยวสามารถชิมชา ชมไร่ชา และสัมผัสวัฒนธรรมจีนยูนนานได้ที่นี่',
    coordinates: {
      latitude: 19.4500,
      longitude: 97.8500
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'แม่ฮ่องสอน',
    district: 'อำเภอเมืองแม่ฮ่องสอน',
    address: 'อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mae-hong-son-003',
    name: 'สะพานซูตองเป้',
    nameEn: 'Sutongpae Bridge',
    description: 'สะพานไม้ที่สร้างขึ้นจากความศรัทธาของชาวบ้านและพระภิกษุสงฆ์ เพื่อใช้สัญจรข้ามทุ่งนา บรรยากาศยามเช้าพร้อมสายหมอกและแสงอาทิตย์เป็นที่ดึงดูดนักท่องเที่ยว',
    coordinates: {
      latitude: 19.388013,
      longitude: 97.951970
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'แม่ฮ่องสอน',
    district: 'อำเภอเมืองแม่ฮ่องสอน',
    address: 'บ้านกุงไม้สัก ตำบลปางหมู อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mae-hong-son-004',
    name: 'วัดจองคำ',
    nameEn: 'Wat Chong Kham',
    description: 'วัดสำคัญที่มีสถาปัตยกรรมพม่าที่สวยงามและเป็นสถานที่สำคัญทางประวัติศาสตร์ของแม่ฮ่องสอน',
    coordinates: {
      latitude: 19.3000,
      longitude: 97.9500
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'แม่ฮ่องสอน',
    district: 'อำเภอเมืองแม่ฮ่องสอน',
    address: 'อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mae-hong-son-005',
    name: 'วัดจองกลาง',
    nameEn: 'Wat Chong Klang',
    description: 'วัดสำคัญที่มีสถาปัตยกรรมพม่าที่สวยงามและเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 19.3050,
      longitude: 97.9550
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'แม่ฮ่องสอน',
    district: 'อำเภอเมืองแม่ฮ่องสอน',
    address: 'อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mae-hong-son-006',
    name: 'ถ้ำปลา',
    nameEn: 'Tham Pla (Fish Cave)',
    description: 'ถ้ำที่มีปลาขนาดใหญ่อาศัยอยู่ เป็นสถานที่ท่องเที่ยวธรรมชาติที่สวยงามและน่าตื่นตาตื่นใจ',
    coordinates: {
      latitude: 19.2500,
      longitude: 97.9000
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'แม่ฮ่องสอน',
    district: 'อำเภอเมืองแม่ฮ่องสอน',
    address: 'อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mae-hong-son-007',
    name: 'ดอยแม่อูคอ',
    nameEn: 'Doi Mae U-Kho',
    description: 'จุดชมทะเลหมอกที่สวยงาม เหมาะสำหรับการชมพระอาทิตย์ขึ้นและทะเลหมอก มีวิวทิวทัศน์ที่สวยงาม',
    coordinates: {
      latitude: 19.5000,
      longitude: 98.0000
    },
    category: 'mountain',
    categories: ['mountain', 'recommended'],
    province: 'แม่ฮ่องสอน',
    district: 'อำเภอปางมะผ้า',
    address: 'อำเภอปางมะผ้า จังหวัดแม่ฮ่องสอน',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return maeHongSonAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return maeHongSonAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return maeHongSonAttractions.filter(attraction =>
    attraction.isActive &&
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  maeHongSonAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
