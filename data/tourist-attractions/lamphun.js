// data/tourist-attractions/lamphun.js
// สถานที่ท่องเที่ยวลำพูน สำหรับเควส Check-in

const lamphunAttractions = [
  {
    id: 'lamphun-001',
    name: 'วัดพระธาตุหริภุญชัย',
    nameEn: 'Wat Phra That Hariphunchai',
    description: 'วัดสำคัญที่มีพระธาตุหริภุญชัยเป็นศูนย์กลาง เป็นสถานที่ศักดิ์สิทธิ์และมีสถาปัตยกรรมที่งดงาม เป็นวัดที่สำคัญที่สุดของลำพูน',
    coordinates: {
      latitude: 18.5767,
      longitude: 99.0083
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'ลำพูน',
    district: 'อำเภอเมืองลำพูน',
    address: 'ถนนจามเทวี อำเภอเมืองลำพูน จังหวัดลำพูน',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lamphun-002',
    name: 'พิพิธภัณฑสถานแห่งชาติหริภุญไชย',
    nameEn: 'Hariphunchai National Museum',
    description: 'พิพิธภัณฑ์ที่จัดแสดงโบราณวัตถุและศิลปะพื้นบ้านของลำพูน เหมาะสำหรับผู้ที่สนใจประวัติศาสตร์และวัฒนธรรม',
    coordinates: {
      latitude: 18.5800,
      longitude: 99.0100
    },
    category: 'museum',
    categories: ['museum', 'historical', 'recommended'],
    province: 'ลำพูน',
    district: 'อำเภอเมืองลำพูน',
    address: 'อำเภอเมืองลำพูน จังหวัดลำพูน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lamphun-003',
    name: 'สะพานขาวทาชมภู',
    nameEn: 'Tha Chomphu White Bridge',
    description: 'สะพานรถไฟสีขาวที่มีความสวยงามและเป็นจุดถ่ายรูปยอดนิยมของนักท่องเที่ยว มีวิวทิวทัศน์ที่สวยงาม',
    coordinates: {
      latitude: 18.6000,
      longitude: 99.0200
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'ลำพูน',
    district: 'อำเภอเมืองลำพูน',
    address: 'อำเภอเมืองลำพูน จังหวัดลำพูน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lamphun-004',
    name: 'วัดจามเทวี',
    nameEn: 'Wat Chamthewi',
    description: 'วัดเก่าแก่ที่มีสถาปัตยกรรมล้านนาที่งดงาม และเป็นสถานที่สำคัญทางประวัติศาสตร์ของลำพูน',
    coordinates: {
      latitude: 18.5750,
      longitude: 99.0050
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'ลำพูน',
    district: 'อำเภอเมืองลำพูน',
    address: 'อำเภอเมืองลำพูน จังหวัดลำพูน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lamphun-005',
    name: 'วัดมหาวัน',
    nameEn: 'Wat Mahawan',
    description: 'วัดเก่าแก่ที่มีสถาปัตยกรรมล้านนาที่สวยงาม และเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 18.5700,
      longitude: 99.0000
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'ลำพูน',
    district: 'อำเภอเมืองลำพูน',
    address: 'อำเภอเมืองลำพูน จังหวัดลำพูน',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lamphun-006',
    name: 'อุทยานแห่งชาติดอยขุนตาล',
    nameEn: 'Doi Khun Tan National Park',
    description: 'อุทยานแห่งชาติที่มีธรรมชาติสวยงาม มีน้ำตกและเส้นทางเดินป่า เหมาะสำหรับผู้ที่รักการผจญภัย',
    coordinates: {
      latitude: 18.4500,
      longitude: 99.1500
    },
    category: 'park',
    categories: ['park', 'mountain', 'recommended'],
    province: 'ลำพูน',
    district: 'อำเภอป่าซาง',
    address: 'อำเภอป่าซาง จังหวัดลำพูน',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return lamphunAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return lamphunAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return lamphunAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  lamphunAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
