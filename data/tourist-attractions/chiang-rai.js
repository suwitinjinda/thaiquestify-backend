// data/tourist-attractions/chiang-rai.js
// สถานที่ท่องเที่ยวเชียงราย สำหรับเควส Check-in

const chiangRaiAttractions = [
  {
    id: 'chiang-rai-001',
    name: 'วัดร่องขุ่น',
    nameEn: 'Wat Rong Khun (White Temple)',
    description: 'วัดที่มีสถาปัตยกรรมสีขาวงดงาม ออกแบบโดยอาจารย์เฉลิมชัย โฆษิตพิพัฒน์ เป็นงานศิลปะร่วมสมัยที่ผสมผสานวัฒนธรรมไทยและสากล เป็นสถานที่ท่องเที่ยวที่ได้รับความนิยมมากที่สุดแห่งหนึ่งของเชียงราย',
    coordinates: {
      latitude: 19.824329,
      longitude: 99.763027
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอเมืองเชียงราย',
    address: 'ตำบลป่าอ้อดอนชัย อำเภอเมืองเชียงราย จังหวัดเชียงราย',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-002',
    name: 'ภูชี้ฟ้า',
    nameEn: 'Phu Chi Fa',
    description: 'จุดชมวิวทะเลหมอกที่สวยงาม ตั้งอยู่บนยอดเขาสูง 1,628 เมตร เหมาะสำหรับการชมพระอาทิตย์ขึ้น มีวิวทิวทัศน์ที่สวยงามและเป็นจุดถ่ายรูปยอดนิยม',
    coordinates: {
      latitude: 19.7000,
      longitude: 100.3000
    },
    category: 'mountain',
    categories: ['mountain', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอเทิง',
    address: 'บ้านร่มฟ้าไทย หมู่ 10 ตำบลตับเต่า อำเภอเทิง จังหวัดเชียงราย',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-003',
    name: 'ดอยแม่สลอง',
    nameEn: 'Doi Mae Salong',
    description: 'พื้นที่ที่มีชุมชนชาวจีนยูนนานและไร่ชาขนาดใหญ่ นักท่องเที่ยวสามารถสัมผัสวัฒนธรรมและชิมชาอู่หลงได้ มีวิวทิวทัศน์ที่สวยงามและอากาศเย็นสบาย',
    coordinates: {
      latitude: 20.1649,
      longitude: 99.6222
    },
    category: 'mountain',
    categories: ['mountain', 'other', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอแม่ฟ้าหลวง',
    address: 'ตำบลแม่สลองนอก อำเภอแม่ฟ้าหลวง จังหวัดเชียงราย',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-004',
    name: 'ไร่ชาฉุยฟง',
    nameEn: 'Choui Fong Tea Plantation',
    description: 'ไร่ชาขนาดใหญ่ที่มีทิวทัศน์สวยงามและเป็นจุดถ่ายรูปยอดนิยม มีร้านกาแฟและร้านอาหารให้บริการ นักท่องเที่ยวสามารถชมกระบวนการผลิตชาและซื้อผลิตภัณฑ์ชาได้',
    coordinates: {
      latitude: 19.9000,
      longitude: 99.8000
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอแม่จัน',
    address: 'อำเภอแม่จัน จังหวัดเชียงราย',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-005',
    name: 'วัดพระแก้ว',
    nameEn: 'Wat Phra Kaew',
    description: 'วัดเก่าแก่ที่เคยเป็นที่ประดิษฐานของพระแก้วมรกต ปัจจุบันมีพระพุทธรูปหินอ่อนที่สวยงามและเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 19.9100,
      longitude: 99.8300
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอเมืองเชียงราย',
    address: 'ถนนไตรรัตน์ อำเภอเมืองเชียงราย จังหวัดเชียงราย',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-006',
    name: 'ถ้ำหลวง-ขุนน้ำนางนอน',
    nameEn: 'Tham Luang - Khun Nam Nang Non',
    description: 'สถานที่ที่เคยเป็นข่าวดังระดับโลก ปัจจุบันเปิดให้นักท่องเที่ยวเข้าชม มีพิพิธภัณฑ์และนิทรรศการเกี่ยวกับการช่วยเหลือ 13 หมูป่า',
    coordinates: {
      latitude: 20.3667,
      longitude: 99.8667
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอแม่สาย',
    address: 'ตำบลโป่งงาม อำเภอแม่สาย จังหวัดเชียงราย',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-007',
    name: 'สกายวอล์คดอยเวา',
    nameEn: 'Doi Wa Skywalk',
    description: 'จุดชมวิวใหม่ที่มีทางเดินกระจกใส สามารถมองเห็นวิวเมืองเชียงรายได้อย่างชัดเจน เป็นสถานที่ท่องเที่ยวที่ได้รับความนิยม',
    coordinates: {
      latitude: 19.8500,
      longitude: 99.7500
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอเมืองเชียงราย',
    address: 'อำเภอเมืองเชียงราย จังหวัดเชียงราย',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-008',
    name: 'วัดแสงแก้วโพธิญาณ',
    nameEn: 'Wat Sang Kaew Photiyan',
    description: 'วัดที่มีสถาปัตยกรรมงดงามและเป็นที่เคารพของชาวเชียงราย มีพระพุทธรูปและงานศิลปะที่สวยงาม',
    coordinates: {
      latitude: 19.9200,
      longitude: 99.8400
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอเมืองเชียงราย',
    address: 'อำเภอเมืองเชียงราย จังหวัดเชียงราย',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-009',
    name: 'วัดพระธาตุดอยตุง',
    nameEn: 'Wat Phra That Doi Tung',
    description: 'วัดสำคัญที่ตั้งอยู่บนดอยตุง มีพระธาตุที่สวยงามและเป็นสถานที่ศักดิ์สิทธิ์ มีวิวทิวทัศน์ที่สวยงาม',
    coordinates: {
      latitude: 20.3167,
      longitude: 99.8167
    },
    category: 'temple',
    categories: ['temple', 'mountain', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอแม่ฟ้าหลวง',
    address: 'ดอยตุง อำเภอแม่ฟ้าหลวง จังหวัดเชียงราย',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chiang-rai-010',
    name: 'สวนแม่ฟ้าหลวง',
    nameEn: 'Mae Fah Luang Garden',
    description: 'สวนดอกไม้ที่สวยงามบนดอยตุง มีดอกไม้หลากหลายชนิดและวิวทิวทัศน์ที่สวยงาม เป็นสถานที่ท่องเที่ยวที่ได้รับความนิยม',
    coordinates: {
      latitude: 20.3000,
      longitude: 99.8000
    },
    category: 'park',
    categories: ['park', 'recommended'],
    province: 'เชียงราย',
    district: 'อำเภอแม่ฟ้าหลวง',
    address: 'ดอยตุง อำเภอแม่ฟ้าหลวง จังหวัดเชียงราย',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return chiangRaiAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return chiangRaiAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return chiangRaiAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  chiangRaiAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
