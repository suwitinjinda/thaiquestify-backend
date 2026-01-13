// data/tourist-attractions/nan.js
// สถานที่ท่องเที่ยวน่าน สำหรับเควส Check-in

const nanAttractions = [
  {
    id: 'nan-001',
    name: 'วัดภูมินทร์',
    nameEn: 'Wat Phumin',
    description: 'วัดเก่าแก่ที่มีจิตรกรรมฝาผนังชื่อดัง "ปู่ม่านย่าม่าน" หรือ "กระซิบรักบันลือโลก" เป็นงานศิลปะที่สวยงามและมีชื่อเสียง',
    coordinates: {
      latitude: 18.7747,
      longitude: 100.7716
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'น่าน',
    district: 'อำเภอเมืองน่าน',
    address: 'ตำบลในเวียง อำเภอเมืองน่าน จังหวัดน่าน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nan-002',
    name: 'วังศิลาแลง',
    nameEn: 'Wang Sila Lang',
    description: 'แกรนด์แคนยอนเมืองปัว ธารน้ำไหลผ่านซอกหินที่ถูกน้ำกัดเซาะจนเกิดเป็นร่องรอยสวยงาม เป็นสถานที่ท่องเที่ยวธรรมชาติที่สวยงาม',
    coordinates: {
      latitude: 19.1667,
      longitude: 100.9000
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'น่าน',
    district: 'อำเภอปัว',
    address: 'อำเภอปัว จังหวัดน่าน',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nan-003',
    name: 'จุดชมวิวบ้านปางแก-บ้านมณีพฤกษ์',
    nameEn: 'Ban Pang Kae - Ban Manee Phruek Viewpoint',
    description: 'จุดชมทะเลหมอกที่สามารถมองเห็นภูเขาสลับซับซ้อนอย่างงดงาม เหมาะสำหรับการชมพระอาทิตย์ขึ้นและทะเลหมอก',
    coordinates: {
      latitude: 19.2000,
      longitude: 100.8500
    },
    category: 'mountain',
    categories: ['mountain', 'recommended'],
    province: 'น่าน',
    district: 'อำเภอปัว',
    address: 'อำเภอปัว จังหวัดน่าน',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nan-004',
    name: 'วัดพระธาตุแช่แห้ง',
    nameEn: 'Wat Phra That Chae Haeng',
    description: 'วัดสำคัญที่มีพระธาตุแช่แห้งเป็นศูนย์กลาง เป็นสถานที่ศักดิ์สิทธิ์และมีสถาปัตยกรรมที่งดงาม',
    coordinates: {
      latitude: 18.7833,
      longitude: 100.7833
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'น่าน',
    district: 'อำเภอเมืองน่าน',
    address: 'อำเภอเมืองน่าน จังหวัดน่าน',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nan-005',
    name: 'อุทยานแห่งชาติดอยภูคา',
    nameEn: 'Doi Phu Kha National Park',
    description: 'อุทยานแห่งชาติที่มีธรรมชาติสวยงาม มีน้ำตกและเส้นทางเดินป่า เหมาะสำหรับผู้ที่รักการผจญภัย',
    coordinates: {
      latitude: 19.3000,
      longitude: 101.0000
    },
    category: 'park',
    categories: ['park', 'mountain', 'recommended'],
    province: 'น่าน',
    district: 'อำเภอบ่อเกลือ',
    address: 'อำเภอบ่อเกลือ จังหวัดน่าน',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nan-006',
    name: 'วัดพระธาตุช้างค้ำ',
    nameEn: 'Wat Phra That Chang Kham',
    description: 'วัดเก่าแก่ที่มีเจดีย์รูปช้างล้อมรอบ เป็นสถาปัตยกรรมล้านนาที่สวยงามและเป็นสถานที่สำคัญ',
    coordinates: {
      latitude: 18.7750,
      longitude: 100.7700
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'น่าน',
    district: 'อำเภอเมืองน่าน',
    address: 'อำเภอเมืองน่าน จังหวัดน่าน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nan-007',
    name: 'พิพิธภัณฑ์สถานแห่งชาติน่าน',
    nameEn: 'Nan National Museum',
    description: 'พิพิธภัณฑ์ที่จัดแสดงโบราณวัตถุและศิลปะพื้นบ้านของน่าน เหมาะสำหรับผู้ที่สนใจประวัติศาสตร์และวัฒนธรรม',
    coordinates: {
      latitude: 18.7800,
      longitude: 100.7750
    },
    category: 'museum',
    categories: ['museum', 'historical', 'recommended'],
    province: 'น่าน',
    district: 'อำเภอเมืองน่าน',
    address: 'อำเภอเมืองน่าน จังหวัดน่าน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return nanAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return nanAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return nanAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  nanAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
