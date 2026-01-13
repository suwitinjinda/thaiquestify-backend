// data/tourist-attractions/phitsanulok.js
// สถานที่ท่องเที่ยวพิษณุโลก สำหรับเควส Check-in

const phitsanulokAttractions = [
  {
    id: 'phitsanulok-001',
    name: 'วัดพระศรีรัตนมหาธาตุวรมหาวิหาร (วัดใหญ่)',
    nameEn: 'Wat Phra Si Rattana Mahathat Woramahawihan',
    description: 'วัดที่ประดิษฐานพระพุทธชินราช พระพุทธรูปที่มีความงดงามและเป็นที่เคารพนับถือ เป็นวัดที่สำคัญที่สุดของพิษณุโลก',
    coordinates: {
      latitude: 16.8167,
      longitude: 100.2667
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พิษณุโลก',
    district: 'อำเภอเมืองพิษณุโลก',
    address: 'อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phitsanulok-002',
    name: 'อุทยานแห่งชาติภูหินร่องกล้า',
    nameEn: 'Phu Hin Rong Kla National Park',
    description: 'สถานที่สำคัญทางประวัติศาสตร์และธรรมชาติ มีจุดท่องเที่ยวเช่น ลานหินปุ่ม ผาชูธง และทุ่งดอกกระดาษ',
    coordinates: {
      latitude: 16.9667,
      longitude: 101.0167
    },
    category: 'park',
    categories: ['park', 'mountain', 'historical', 'recommended'],
    province: 'พิษณุโลก',
    district: 'อำเภอนครไทย',
    address: 'อำเภอนครไทย จังหวัดพิษณุโลก',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phitsanulok-003',
    name: 'น้ำตกหมันแดง',
    nameEn: 'Man Daeng Waterfall',
    description: 'น้ำตกที่มีความสวยงามและเป็นที่นิยมในหมู่นักท่องเที่ยว มีธรรมชาติอุดมสมบูรณ์',
    coordinates: {
      latitude: 17.0000,
      longitude: 100.5000
    },
    category: 'waterfall',
    categories: ['waterfall', 'park', 'recommended'],
    province: 'พิษณุโลก',
    district: 'อำเภอวังทอง',
    address: 'อำเภอวังทอง จังหวัดพิษณุโลก',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phitsanulok-004',
    name: 'วัดจุฬามณี',
    nameEn: 'Wat Chulamani',
    description: 'วัดเก่าแก่ที่มีสถาปัตยกรรมที่สวยงามและเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 16.8000,
      longitude: 100.2500
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พิษณุโลก',
    district: 'อำเภอเมืองพิษณุโลก',
    address: 'อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phitsanulok-005',
    name: 'พิพิธภัณฑ์เรือนไทย',
    nameEn: 'Thai House Museum',
    description: 'พิพิธภัณฑ์ที่จัดแสดงเรือนไทยและวิถีชีวิตไทย เหมาะสำหรับผู้ที่สนใจประวัติศาสตร์และวัฒนธรรม',
    coordinates: {
      latitude: 16.8200,
      longitude: 100.2700
    },
    category: 'museum',
    categories: ['museum', 'historical', 'recommended'],
    province: 'พิษณุโลก',
    district: 'อำเภอเมืองพิษณุโลก',
    address: 'อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return phitsanulokAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return phitsanulokAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return phitsanulokAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  phitsanulokAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
