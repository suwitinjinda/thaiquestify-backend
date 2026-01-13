// data/tourist-attractions/phrae.js
// สถานที่ท่องเที่ยวแพร่ สำหรับเควส Check-in

const phraeAttractions = [
  {
    id: 'phrae-001',
    name: 'วนอุทยานแพะเมืองผี',
    nameEn: 'Phae Mueang Phi Forest Park',
    description: 'ปรากฏการณ์ธรรมชาติที่เกิดจากการกัดเซาะของน้ำและลม ทำให้เกิดเสาดินและหินรูปร่างแปลกตา เป็นสถานที่ท่องเที่ยวที่สวยงามและน่าตื่นตาตื่นใจ',
    coordinates: {
      latitude: 18.1500,
      longitude: 100.1833
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'แพร่',
    district: 'อำเภอเมืองแพร่',
    address: 'อำเภอเมืองแพร่ จังหวัดแพร่',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phrae-002',
    name: 'วัดพระธาตุสุโทนมงคลคีรี',
    nameEn: 'Wat Phra That Suton Mongkhon Khiri',
    description: 'วัดที่มีสถาปัตยกรรมงดงามและเป็นที่เคารพของชาวแพร่ มีพระธาตุที่สวยงาม',
    coordinates: {
      latitude: 18.1400,
      longitude: 100.1900
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'แพร่',
    district: 'อำเภอเมืองแพร่',
    address: 'อำเภอเมืองแพร่ จังหวัดแพร่',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phrae-003',
    name: 'วัดจอมสวรรค์',
    nameEn: 'Wat Chom Sawan',
    description: 'วัดเก่าแก่ที่สร้างด้วยศิลปะพม่า มีอุโบสถไม้ที่สวยงามและเป็นเอกลักษณ์ เป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 18.1450,
      longitude: 100.1950
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'แพร่',
    district: 'อำเภอเมืองแพร่',
    address: 'อำเภอเมืองแพร่ จังหวัดแพร่',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phrae-004',
    name: 'วัดพระธาตุช่อแฮ',
    nameEn: 'Wat Phra That Cho Hae',
    description: 'วัดสำคัญที่มีพระธาตุช่อแฮเป็นศูนย์กลาง เป็นสถานที่ศักดิ์สิทธิ์และมีสถาปัตยกรรมที่งดงาม',
    coordinates: {
      latitude: 18.1300,
      longitude: 100.1800
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'แพร่',
    district: 'อำเภอเมืองแพร่',
    address: 'อำเภอเมืองแพร่ จังหวัดแพร่',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phrae-005',
    name: 'พิพิธภัณฑ์บ้านประทับใจ',
    nameEn: 'Ban Prathap Chai Museum',
    description: 'พิพิธภัณฑ์บ้านไม้เก่าแก่ที่แสดงวิถีชีวิตและวัฒนธรรมของชาวแพร่ เหมาะสำหรับผู้ที่สนใจประวัติศาสตร์และวัฒนธรรม',
    coordinates: {
      latitude: 18.1350,
      longitude: 100.1850
    },
    category: 'museum',
    categories: ['museum', 'historical', 'recommended'],
    province: 'แพร่',
    district: 'อำเภอเมืองแพร่',
    address: 'อำเภอเมืองแพร่ จังหวัดแพร่',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phrae-006',
    name: 'อุทยานแห่งชาติแม่ยม',
    nameEn: 'Mae Yom National Park',
    description: 'อุทยานแห่งชาติที่มีธรรมชาติสวยงาม มีน้ำตกและเส้นทางเดินป่า เหมาะสำหรับผู้ที่รักการผจญภัย',
    coordinates: {
      latitude: 18.0000,
      longitude: 100.1000
    },
    category: 'park',
    categories: ['park', 'recommended'],
    province: 'แพร่',
    district: 'อำเภอสอง',
    address: 'อำเภอสอง จังหวัดแพร่',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return phraeAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return phraeAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return phraeAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  phraeAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
