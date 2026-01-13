// data/tourist-attractions/singburi.js
// สถานที่ท่องเที่ยวจังหวัดสิงห์บุรี สำหรับเควส Check-in

const singburiAttractions = [
  {
    id: 'singburi-001',
    name: 'วัดพระนอนจักรสีห์วรวิหาร',
    nameEn: 'Wat Phra Non Chaksri Worawihan',
    description: 'วัดเก่าแก่ที่มีพระพุทธไสยาสน์ขนาดใหญ่และยาวที่สุดในประเทศไทย',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'สิงห์บุรี',
    district: 'อำเภอเมืองสิงห์บุรี',
    address: 'อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-002',
    name: 'ตลาดย้อนยุคบ้านบางระจัน',
    nameEn: 'Ban Bang Rachan Retro Market',
    description: 'ตลาดที่จำลองบรรยากาศสมัยโบราณ พ่อค้าแม่ค้าแต่งกายแบบชาวบ้านบางระจันและใช้ภาษาพื้นเมือง',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'market',
    categories: ['market', 'historical', 'recommended'],
    province: 'สิงห์บุรี',
    district: 'อำเภอค่ายบางระจัน',
    address: 'อำเภอค่ายบางระจัน จังหวัดสิงห์บุรี',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-003',
    name: 'อนุสาวรีย์วีรชนค่ายบางระจัน',
    nameEn: 'Bang Rachan Heroes Monument',
    description: 'อนุสรณ์สถานที่ระลึกถึงความกล้าหาญของชาวบ้านบางระจันในการต่อสู้เพื่อชาติ',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'historical',
    categories: ['historical', 'recommended'],
    province: 'สิงห์บุรี',
    district: 'อำเภอค่ายบางระจัน',
    address: 'อำเภอค่ายบางระจัน จังหวัดสิงห์บุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-004',
    name: 'วัดพิกุลทอง',
    nameEn: 'Wat Pikun Thong',
    description: 'วัดที่มีพระพุทธรูปปางประทานพรขนาดใหญ่ และเป็นศูนย์รวมจิตใจของชาวสิงห์บุรี',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'temple',
    categories: ['temple'],
    province: 'สิงห์บุรี',
    district: 'อำเภอเมืองสิงห์บุรี',
    address: 'อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-005',
    name: 'พิพิธภัณฑ์บ้านบางระจัน',
    nameEn: 'Ban Bang Rachan Museum',
    description: 'พิพิธภัณฑ์ที่จัดแสดงเรื่องราวและวัตถุโบราณเกี่ยวกับวีรกรรมของชาวบ้านบางระจัน',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'museum',
    categories: ['museum', 'historical'],
    province: 'สิงห์บุรี',
    district: 'อำเภอค่ายบางระจัน',
    address: 'อำเภอค่ายบางระจัน จังหวัดสิงห์บุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-006',
    name: 'วัดอัมพวัน',
    nameEn: 'Wat Amphawan',
    description: 'วัดที่มีชื่อเสียงด้านการปฏิบัติธรรมและเป็นสถานที่ปฏิบัติธรรมที่ได้รับความนิยม',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'temple',
    categories: ['temple'],
    province: 'สิงห์บุรี',
    district: 'อำเภอเมืองสิงห์บุรี',
    address: 'อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-007',
    name: 'วัดโพธิ์เก้าต้น',
    nameEn: 'Wat Pho Kao Ton',
    description: 'วัดที่มีต้นโพธิ์เก้าต้นอายุกว่าร้อยปี และเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'สิงห์บุรี',
    district: 'อำเภอเมืองสิงห์บุรี',
    address: 'อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-008',
    name: 'วัดสว่างอารมณ์',
    nameEn: 'Wat Sawang Arom',
    description: 'วัดที่มีพระพุทธรูปปางมารวิชัยขนาดใหญ่ และเป็นสถานที่ปฏิบัติธรรมที่เงียบสงบ',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'temple',
    categories: ['temple'],
    province: 'สิงห์บุรี',
    district: 'อำเภอเมืองสิงห์บุรี',
    address: 'อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-009',
    name: 'วัดหน้าพระธาตุ',
    nameEn: 'Wat Na Phra That',
    description: 'วัดที่มีพระธาตุเจดีย์เก่าแก่ และเป็นสถานที่สำคัญทางศาสนา',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'สิงห์บุรี',
    district: 'อำเภอเมืองสิงห์บุรี',
    address: 'อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'singburi-010',
    name: 'วัดสิงห์',
    nameEn: 'Wat Sing',
    description: 'วัดที่มีพระพุทธรูปปางมารวิชัยขนาดใหญ่ และเป็นศูนย์รวมจิตใจของชาวสิงห์บุรี',
    coordinates: {
      latitude: 14.8833,
      longitude: 100.4000
    },
    category: 'temple',
    categories: ['temple'],
    province: 'สิงห์บุรี',
    district: 'อำเภอเมืองสิงห์บุรี',
    address: 'อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAttractionById = (id) => {
  return singburiAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  return singburiAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return singburiAttractions.filter(attr => attr.isActive);
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return singburiAttractions.filter(attr =>
    attr.isActive && (
      attr.name.toLowerCase().includes(term) ||
      attr.nameEn.toLowerCase().includes(term) ||
      attr.description.toLowerCase().includes(term)
    )
  );
};

const updateAttractionCoordinates = (attractionId, latitude, longitude, source = 'manual') => {
  const attraction = getAttractionById(attractionId);
  if (!attraction) {
    return null;
  }

  attraction.coordinates = {
    latitude: latitude,
    longitude: longitude
  };
  attraction.updatedAt = new Date();
  attraction.coordinateSource = source;

  const index = singburiAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    singburiAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

// Export
module.exports = {
  singburiAttractions,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
