// data/tourist-attractions/sukhothai.js
// สถานที่ท่องเที่ยวสุโขทัย สำหรับเควส Check-in

const sukhothaiAttractions = [
  {
    id: 'sukhothai-001',
    name: 'อุทยานประวัติศาสตร์สุโขทัย',
    nameEn: 'Sukhothai Historical Park',
    description: 'แหล่งมรดกโลกที่มีโบราณสถานสำคัญ เช่น วัดมหาธาตุ วัดศรีสวาย และวัดสระศรี เป็นสถานที่สำคัญทางประวัติศาสตร์ของไทย',
    coordinates: {
      latitude: 17.0167,
      longitude: 99.7000
    },
    category: 'historical',
    categories: ['historical', 'temple', 'recommended'],
    province: 'สุโขทัย',
    district: 'อำเภอเมืองสุโขทัย',
    address: 'อำเภอเมืองสุโขทัย จังหวัดสุโขทัย',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sukhothai-002',
    name: 'วัดศรีชุม',
    nameEn: 'Wat Si Chum',
    description: 'วัดที่ประดิษฐานพระอจนะ พระพุทธรูปปางมารวิชัยขนาดใหญ่ เป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 17.0300,
      longitude: 99.7100
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'สุโขทัย',
    district: 'อำเภอเมืองสุโขทัย',
    address: 'อำเภอเมืองสุโขทัย จังหวัดสุโขทัย',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sukhothai-003',
    name: 'พิพิธภัณฑสถานแห่งชาติ สวรรควรนายก',
    nameEn: 'Sawankhalok National Museum',
    description: 'พิพิธภัณฑ์ที่จัดแสดงประวัติศาสตร์และศิลปวัตถุของสุโขทัย เหมาะสำหรับผู้ที่สนใจประวัติศาสตร์และวัฒนธรรม',
    coordinates: {
      latitude: 17.3000,
      longitude: 99.8000
    },
    category: 'museum',
    categories: ['museum', 'historical', 'recommended'],
    province: 'สุโขทัย',
    district: 'อำเภอสวรรคโลก',
    address: 'อำเภอสวรรคโลก จังหวัดสุโขทัย',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sukhothai-004',
    name: 'วัดมหาธาตุ',
    nameEn: 'Wat Mahathat',
    description: 'วัดสำคัญในอุทยานประวัติศาสตร์สุโขทัย มีเจดีย์และโบราณสถานที่สวยงาม',
    coordinates: {
      latitude: 17.0200,
      longitude: 99.7050
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'สุโขทัย',
    district: 'อำเภอเมืองสุโขทัย',
    address: 'อำเภอเมืองสุโขทัย จังหวัดสุโขทัย',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sukhothai-005',
    name: 'อุทยานประวัติศาสตร์ศรีสัชนาลัย',
    nameEn: 'Si Satchanalai Historical Park',
    description: 'อุทยานประวัติศาสตร์ที่มีโบราณสถานสำคัญ เป็นแหล่งมรดกโลกอีกแห่งหนึ่ง',
    coordinates: {
      latitude: 17.4333,
      longitude: 99.7833
    },
    category: 'historical',
    categories: ['historical', 'temple', 'recommended'],
    province: 'สุโขทัย',
    district: 'อำเภอศรีสัชนาลัย',
    address: 'อำเภอศรีสัชนาลัย จังหวัดสุโขทัย',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return sukhothaiAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return sukhothaiAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return sukhothaiAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  sukhothaiAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
