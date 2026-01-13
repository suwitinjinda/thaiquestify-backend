// data/tourist-attractions/samut-prakan.js
// สถานที่ท่องเที่ยวจังหวัดสมุทรปราการ สำหรับเควส Check-in

const samutPrakanAttractions = [
  {
    id: 'samut-prakan-001',
    name: 'เมืองโบราณ',
    nameEn: 'Ancient City (Muang Boran)',
    description: 'อุทยานประวัติศาสตร์กลางแจ้งขนาดใหญ่ จำลองสถานที่สำคัญจากทั่วประเทศไทย',
    coordinates: {
      latitude: 13.5367,
      longitude: 100.6239
    },
    category: 'historical',
    province: 'สมุทรปราการ',
    district: 'อำเภอเมืองสมุทรปราการ',
    address: '296/1 หมู่ที่ 7 ถนนสุขุมวิท ตำบลบางปูใหม่ อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ',
    checkInRadius: 100, // เมตร - รัศมีการเช็คอิน
    thumbnail: null, // URL รูปภาพ (ถ้ามี)
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'samut-prakan-002',
    name: 'ฟาร์มจระเข้และสวนสัตว์สมุทรปราการ',
    nameEn: 'Samut Prakan Crocodile Farm and Zoo',
    description: 'ฟาร์มจระเข้ที่ใหญ่ที่สุดในโลก มีโชว์จระเข้และสัตว์หลากหลาย',
    coordinates: {
      latitude: 13.5896,
      longitude: 100.6032
    },
    category: 'zoo',
    province: 'สมุทรปราการ',
    district: 'อำเภอเมืองสมุทรปราการ',
    address: '555 ถนนท้ายบ้าน ตำบลท้ายบ้าน อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'samut-prakan-003',
    name: 'วัดอโศการาม',
    nameEn: 'Wat Asokaram',
    description: 'วัดสงบ บรรยากาศร่มรื่น มีพระเจดีย์สีขาวโดดเด่น',
    coordinates: {
      latitude: 13.5412,
      longitude: 100.6139
    },
    category: 'temple',
    province: 'สมุทรปราการ',
    district: 'อำเภอเมืองสมุทรปราการ',
    address: 'หมู่ที่ 7 ตำบลบางปูใหม่ อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ',
    checkInRadius: 80,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'samut-prakan-004',
    name: 'พิพิธภัณฑ์ทหารเรือ',
    nameEn: 'Royal Thai Navy Museum',
    description: 'พิพิธภัณฑ์ประวัติศาสตร์เกี่ยวกับกองทัพเรือไทย',
    coordinates: {
      latitude: 13.6023,
      longitude: 100.5973
    },
    category: 'museum',
    province: 'สมุทรปราการ',
    district: 'อำเภอพระสมุทรเจดีย์',
    address: '999 ถนนสุขุมวิท ตำบลปากน้ำ อำเภอพระสมุทรเจดีย์ จังหวัดสมุทรปราการ',
    checkInRadius: 80,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'samut-prakan-005',
    name: 'ป้อมพระจุลจอมเกล้า',
    nameEn: 'Phra Chulachomklao Fort',
    description: 'ป้อมปราการประวัติศาสตร์ ริมปากแม่น้ำเจ้าพระยา',
    coordinates: {
      latitude: 13.5298,
      longitude: 100.6015
    },
    category: 'historical',
    province: 'สมุทรปราการ',
    district: 'อำเภอพระสมุทรเจดีย์',
    address: 'ตำบลแหลมฟ้าผ่า อำเภอพระสมุทรเจดีย์ จังหวัดสมุทรปราการ',
    checkInRadius: 80,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'samut-prakan-006',
    name: 'ตลาดน้ำบางน้ำผึ้ง',
    nameEn: 'Bang Nam Pheung Floating Market',
    description: 'ตลาดน้ำอบอุ่นใจกลางธรรมชาติ ขายอาหารพื้นบ้านและของฝาก',
    coordinates: {
      latitude: 13.6482,
      longitude: 100.5504
    },
    category: 'market',
    province: 'สมุทรปราการ',
    district: 'อำเภอพระสมุทรเจดีย์',
    address: 'ตำบลบางน้ำผึ้ง อำเภอพระสมุทรเจดีย์ จังหวัดสมุทรปราการ',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ThaiQuestify Office
const thaiQuestifyOffice = {
  id: 'thaiquestify-office-001',
  name: 'ThaiQuestify Office',
  nameEn: 'ThaiQuestify Office',
  description: 'สำนักงาน ThaiQuestify - สถานที่ท่องเที่ยวและทำเควส',
  coordinates: {
    latitude: 13.5688036,
    longitude: 100.6443941
  },
  category: 'office',
  province: 'สมุทรปราการ',
  district: 'อำเภอเมืองสมุทรปราการ',
  address: 'ThaiQuestify Office, Samut Prakan',
  checkInRadius: 100,
  thumbnail: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Helper functions
const getAttractionById = (id) => {
  if (id === thaiQuestifyOffice.id) return thaiQuestifyOffice;
  return samutPrakanAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  const allAttractions = [...samutPrakanAttractions, thaiQuestifyOffice];
  return allAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return [...samutPrakanAttractions.filter(attr => attr.isActive), thaiQuestifyOffice];
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  const allAttractions = [...samutPrakanAttractions, thaiQuestifyOffice];
  return allAttractions.filter(attr =>
    attr.isActive && (
      attr.name.toLowerCase().includes(term) ||
      attr.nameEn.toLowerCase().includes(term)
    )
  );
};

/**
 * Update attraction coordinates (in-memory only)
 * Note: To persist, you would need file writing logic
 */
const updateAttractionCoordinates = (attractionId, latitude, longitude, source = 'manual') => {
  const attraction = getAttractionById(attractionId);
  if (!attraction) {
    return null;
  }

  // Update coordinates
  attraction.coordinates = {
    latitude: latitude,
    longitude: longitude
  };
  attraction.updatedAt = new Date();
  attraction.coordinateSource = source;

  // Find and update in the array
  if (attractionId === thaiQuestifyOffice.id) {
    Object.assign(thaiQuestifyOffice, attraction);
    return thaiQuestifyOffice;
  }

  const index = samutPrakanAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    samutPrakanAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

// Export
module.exports = {
  samutPrakanAttractions,
  thaiQuestifyOffice,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
