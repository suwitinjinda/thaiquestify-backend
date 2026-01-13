// data/tourist-attractions/tak.js
// สถานที่ท่องเที่ยวตาก สำหรับเควส Check-in

const takAttractions = [
  {
    id: 'tak-001',
    name: 'น้ำตกทีลอซู',
    nameEn: 'Thi Lo Su Waterfall',
    description: 'น้ำตกขนาดใหญ่ที่มีความสวยงามและเป็นที่รู้จักในระดับประเทศ ตั้งอยู่ในอำเภออุ้มผาง เป็นน้ำตกที่สวยงามและมีธรรมชาติอุดมสมบูรณ์',
    coordinates: {
      latitude: 15.9000,
      longitude: 98.7500
    },
    category: 'waterfall',
    categories: ['waterfall', 'park', 'recommended'],
    province: 'ตาก',
    district: 'อำเภออุ้มผาง',
    address: 'อำเภออุ้มผาง จังหวัดตาก',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tak-002',
    name: 'วัดมณีไพรสณฑ์',
    nameEn: 'Wat Mani Phraisun',
    description: 'วัดเก่าแก่ในอำเภอแม่สอด มีเจดีย์วิหารสัมพุทเธที่มีสถาปัตยกรรมแบบพม่า เป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 16.7000,
      longitude: 98.5000
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'ตาก',
    district: 'อำเภอแม่สอด',
    address: 'อำเภอแม่สอด จังหวัดตาก',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tak-003',
    name: 'วัดชุมพลคีรี',
    nameEn: 'Wat Chumphon Kiri',
    description: 'วัดที่มีเจดีย์สีทองจำลองแบบมาจากเจดีย์ชเวดากองของพม่า เป็นสถานที่สำคัญและสวยงาม',
    coordinates: {
      latitude: 16.7200,
      longitude: 98.5200
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'ตาก',
    district: 'อำเภอแม่สอด',
    address: 'อำเภอแม่สอด จังหวัดตาก',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tak-004',
    name: 'ตลาดดอยมูเซอ',
    nameEn: 'Doi Musoe Market',
    description: 'ตลาดที่จำหน่ายผักสด ผลไม้เมืองเหนือ และผลิตผลการเกษตรจากชาวมูเซอ เป็นสถานที่ท่องเที่ยวที่ได้รับความนิยม',
    coordinates: {
      latitude: 16.8000,
      longitude: 98.6000
    },
    category: 'market',
    categories: ['market', 'recommended'],
    province: 'ตาก',
    district: 'อำเภอแม่สอด',
    address: 'อำเภอแม่สอด จังหวัดตาก',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tak-005',
    name: 'อุทยานแห่งชาติตากสินมหาราช',
    nameEn: 'Taksin Maharat National Park',
    description: 'อุทยานแห่งชาติที่มีธรรมชาติสวยงาม มีน้ำตกและเส้นทางเดินป่า เหมาะสำหรับผู้ที่รักการผจญภัย',
    coordinates: {
      latitude: 16.9000,
      longitude: 99.0000
    },
    category: 'park',
    categories: ['park', 'mountain', 'recommended'],
    province: 'ตาก',
    district: 'อำเภอเมืองตาก',
    address: 'อำเภอเมืองตาก จังหวัดตาก',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return takAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return takAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return takAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  takAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
