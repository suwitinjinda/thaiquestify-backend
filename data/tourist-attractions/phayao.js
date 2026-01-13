// data/tourist-attractions/phayao.js
// สถานที่ท่องเที่ยวพะเยา สำหรับเควส Check-in

const phayaoAttractions = [
  {
    id: 'phayao-001',
    name: 'กว๊านพะเยา',
    nameEn: 'Kwan Phayao',
    description: 'ทะเลสาบน้ำจืดขนาดใหญ่ที่เป็นแหล่งชีวิตของชาวพะเยา มีวิวทิวทัศน์ที่สวยงามและเป็นสถานที่พักผ่อนหย่อนใจ',
    coordinates: {
      latitude: 19.174118,
      longitude: 99.90131
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'พะเยา',
    district: 'อำเภอเมืองพะเยา',
    address: 'อำเภอเมืองพะเยา จังหวัดพะเยา',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phayao-002',
    name: 'วัดศรีโคมคำ',
    nameEn: 'Wat Si Khom Kham',
    description: 'ประดิษฐานพระเจ้าตนหลวง พระพุทธรูปศักดิ์สิทธิ์ที่ชาวพะเยาเคารพบูชา เป็นวัดที่สำคัญที่สุดของพะเยา',
    coordinates: {
      latitude: 19.1700,
      longitude: 99.9000
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พะเยา',
    district: 'อำเภอเมืองพะเยา',
    address: 'อำเภอเมืองพะเยา จังหวัดพะเยา',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phayao-003',
    name: 'อุทยานแห่งชาติภูซาง',
    nameEn: 'Phu Sang National Park',
    description: 'อุทยานแห่งชาติที่มีน้ำตกภูซาง น้ำตกอุ่นที่ไหลตลอดปี มีธรรมชาติสวยงามและเหมาะสำหรับการพักผ่อน',
    coordinates: {
      latitude: 19.6000,
      longitude: 100.3000
    },
    category: 'park',
    categories: ['park', 'waterfall', 'recommended'],
    province: 'พะเยา',
    district: 'อำเภอภูซาง',
    address: 'อำเภอภูซาง จังหวัดพะเยา',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phayao-004',
    name: 'วัดพระธาตุจอมทอง',
    nameEn: 'Wat Phra That Chom Thong',
    description: 'วัดสำคัญที่มีพระธาตุจอมทองเป็นศูนย์กลาง เป็นสถานที่ศักดิ์สิทธิ์และมีสถาปัตยกรรมที่งดงาม',
    coordinates: {
      latitude: 19.1800,
      longitude: 99.9100
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พะเยา',
    district: 'อำเภอเมืองพะเยา',
    address: 'อำเภอเมืองพะเยา จังหวัดพะเยา',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phayao-005',
    name: 'วัดอนาลโยทิพยาราม',
    nameEn: 'Wat Analayo Thipphayaram',
    description: 'วัดที่มีสถาปัตยกรรมที่สวยงามและเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 19.1750,
      longitude: 99.9050
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พะเยา',
    district: 'อำเภอเมืองพะเยา',
    address: 'อำเภอเมืองพะเยา จังหวัดพะเยา',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'phayao-006',
    name: 'วัดนันตาราม',
    nameEn: 'Wat Nantararam',
    description: 'วัดเก่าแก่ที่มีสถาปัตยกรรมล้านนาที่งดงาม และเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 19.1650,
      longitude: 99.8950
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พะเยา',
    district: 'อำเภอเมืองพะเยา',
    address: 'อำเภอเมืองพะเยา จังหวัดพะเยา',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return phayaoAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return phayaoAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return phayaoAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  phayaoAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
