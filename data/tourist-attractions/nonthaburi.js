// data/tourist-attractions/nonthaburi.js
// สถานที่ท่องเที่ยวจังหวัดนนทบุรี สำหรับเควส Check-in

const nonthaburiAttractions = [
  {
    id: 'nonthaburi-001',
    name: 'เกาะเกร็ด',
    nameEn: 'Ko Kret',
    description: 'เกาะกลางแม่น้ำเจ้าพระยาที่เป็นชุมชนชาวมอญ มีชื่อเสียงด้านเครื่องปั้นดินเผาและขนมไทย สามารถเดินเที่ยวชมวัดและชิมอาหารท้องถิ่นได้ บรรยากาศเงียบสงบและเป็นเอกลักษณ์',
    coordinates: {
      latitude: 13.9167,
      longitude: 100.4833
    },
    category: 'historical',
    categories: ['historical', 'recommended'],
    province: 'นนทบุรี',
    district: 'อำเภอปากเกร็ด',
    address: 'เกาะเกร็ด อำเภอปากเกร็ด จังหวัดนนทบุรี',
    checkInRadius: 500,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-002',
    name: 'วัดปรางค์หลวง',
    nameEn: 'Wat Prang Luang',
    description: 'วัดเก่าแก่ที่สร้างขึ้นในสมัยอยุธยาตอนต้น มีปรางค์แบบขอมเป็นจุดเด่น และประดิษฐานพระพุทธรูปหลวงพ่ออู่ทองที่มีความศักดิ์สิทธิ์',
    coordinates: {
      latitude: 13.8667,
      longitude: 100.5167
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'นนทบุรี',
    district: 'อำเภอเมืองนนทบุรี',
    address: 'อำเภอเมืองนนทบุรี จังหวัดนนทบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-003',
    name: 'วัดบรมราชากาญจนาภิเษกอนุสรณ์ (วัดเล่งเน่ยยี่ 2)',
    nameEn: 'Wat Bormaratchakarnkanjanapisek Anusorn (Wat Leng Noei Yi 2)',
    description: 'วัดจีนที่มีสถาปัตยกรรมงดงามและเป็นศูนย์กลางของชาวไทยเชื้อสายจีนในพื้นที่ มีความสวยงามและเป็นเอกลักษณ์',
    coordinates: {
      latitude: 13.8500,
      longitude: 100.5167
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'นนทบุรี',
    district: 'อำเภอเมืองนนทบุรี',
    address: 'อำเภอเมืองนนทบุรี จังหวัดนนทบุรี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-004',
    name: 'ตลาดน้ำบางคูเวียง',
    nameEn: 'Bang Khu Wiang Floating Market',
    description: 'ตลาดน้ำที่ยังคงวิถีชีวิตแบบดั้งเดิม มีพ่อค้าแม่ค้าพายเรือขายสินค้าและอาหารท้องถิ่น บรรยากาศอบอุ่นและเป็นเอกลักษณ์',
    coordinates: {
      latitude: 13.8833,
      longitude: 100.4500
    },
    category: 'market',
    categories: ['market', 'recommended'],
    province: 'นนทบุรี',
    district: 'อำเภอบางกรวย',
    address: 'อำเภอบางกรวย จังหวัดนนทบุรี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-005',
    name: 'สวนสมเด็จพระศรีนครินทร์',
    nameEn: 'Queen Sirikit Park',
    description: 'สวนสาธารณะขนาดใหญ่ที่มีพื้นที่สีเขียวและบึงน้ำ เหมาะสำหรับการพักผ่อนและออกกำลังกาย บรรยากาศร่มรื่น',
    coordinates: {
      latitude: 13.8500,
      longitude: 100.5333
    },
    category: 'park',
    categories: ['park'],
    province: 'นนทบุรี',
    district: 'อำเภอเมืองนนทบุรี',
    address: 'อำเภอเมืองนนทบุรี จังหวัดนนทบุรี',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-006',
    name: 'พิพิธภัณฑ์จังหวัดนนทบุรี',
    nameEn: 'Nonthaburi Provincial Museum',
    description: 'ตั้งอยู่ในศาลากลางจังหวัดนนทบุรี (เก่า) แสดงประวัติศาสตร์และวัฒนธรรมของจังหวัด',
    coordinates: {
      latitude: 13.8667,
      longitude: 100.5167
    },
    category: 'museum',
    categories: ['museum'],
    province: 'นนทบุรี',
    district: 'อำเภอเมืองนนทบุรี',
    address: 'อำเภอเมืองนนทบุรี จังหวัดนนทบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-007',
    name: 'วัดชลประทานรังสฤษดิ์',
    nameEn: 'Wat Chonprathan Rangsarit',
    description: 'วัดที่มีบรรยากาศเงียบสงบและเป็นสถานที่ปฏิบัติธรรมที่ได้รับความนิยม',
    coordinates: {
      latitude: 13.8333,
      longitude: 100.5000
    },
    category: 'temple',
    categories: ['temple'],
    province: 'นนทบุรี',
    district: 'อำเภอบางกรวย',
    address: 'อำเภอบางกรวย จังหวัดนนทบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-008',
    name: 'ตลาดน้ำไทรน้อย',
    nameEn: 'Sai Noi Floating Market',
    description: 'ตลาดน้ำที่มีสินค้าท้องถิ่นและอาหารอร่อยมากมาย บรรยากาศอบอุ่น',
    coordinates: {
      latitude: 13.9000,
      longitude: 100.4000
    },
    category: 'market',
    categories: ['market'],
    province: 'นนทบุรี',
    district: 'อำเภอไทรน้อย',
    address: 'อำเภอไทรน้อย จังหวัดนนทบุรี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-009',
    name: 'อิมแพ็ค เมืองทองธานี',
    nameEn: 'Impact Muang Thong Thani',
    description: 'ศูนย์แสดงสินค้าและการประชุมขนาดใหญ่ที่มีการจัดงานต่างๆ ตลอดปี',
    coordinates: {
      latitude: 13.9167,
      longitude: 100.5500
    },
    category: 'other',
    categories: ['other'],
    province: 'นนทบุรี',
    district: 'อำเภอปากเกร็ด',
    address: 'อำเภอปากเกร็ด จังหวัดนนทบุรี',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nonthaburi-010',
    name: 'ท่าน้ำนนทบุรี',
    nameEn: 'Nonthaburi Pier',
    description: 'ท่าเรือหลักบนแม่น้ำเจ้าพระยา ตั้งอยู่ใกล้กับหอนาฬิกานนทบุรีและศาลากลางจังหวัดนนทบุรี (เก่า) บริเวณรอบๆ มีร้านอาหาร ร้านกาแฟ และตลาดท้องถิ่นให้เยี่ยมชม',
    coordinates: {
      latitude: 13.8667,
      longitude: 100.5167
    },
    category: 'other',
    categories: ['other'],
    province: 'นนทบุรี',
    district: 'อำเภอเมืองนนทบุรี',
    address: 'อำเภอเมืองนนทบุรี จังหวัดนนทบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAttractionById = (id) => {
  return nonthaburiAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  return nonthaburiAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return nonthaburiAttractions.filter(attr => attr.isActive);
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return nonthaburiAttractions.filter(attr =>
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

  const index = nonthaburiAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    nonthaburiAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

// Export
module.exports = {
  nonthaburiAttractions,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
