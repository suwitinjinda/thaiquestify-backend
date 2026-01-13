// data/tourist-attractions/lopburi.js
// สถานที่ท่องเที่ยวจังหวัดลพบุรี สำหรับเควส Check-in

const lopburiAttractions = [
  {
    id: 'lopburi-001',
    name: 'พระปรางค์สามยอด',
    nameEn: 'Phra Prang Sam Yot',
    description: 'โบราณสถานสไตล์ขอมที่มีพระปรางค์สามองค์ตั้งเรียงกัน เป็นสัญลักษณ์สำคัญของลพบุรี',
    coordinates: {
      latitude: 14.8000,
      longitude: 100.6167
    },
    category: 'historical',
    categories: ['historical', 'recommended'],
    province: 'ลพบุรี',
    district: 'อำเภอเมืองลพบุรี',
    address: 'อำเภอเมืองลพบุรี จังหวัดลพบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lopburi-002',
    name: 'วัดพระศรีรัตนมหาธาตุ',
    nameEn: 'Wat Phra Si Rattana Mahathat',
    description: 'วัดเก่าแก่ที่มีพระปรางค์ประธานและโบราณสถานอื่น ๆ ที่สะท้อนถึงศิลปะและวัฒนธรรมในอดีต',
    coordinates: {
      latitude: 14.8000,
      longitude: 100.6167
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'ลพบุรี',
    district: 'อำเภอเมืองลพบุรี',
    address: 'อำเภอเมืองลพบุรี จังหวัดลพบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lopburi-003',
    name: 'พระนารายณ์ราชนิเวศน์ (วังนารายณ์)',
    nameEn: 'Phra Narai Ratchaniwet (Narai Palace)',
    description: 'พระราชวังที่สร้างขึ้นในสมัยสมเด็จพระนารายณ์มหาราช ปัจจุบันเป็นพิพิธภัณฑ์ที่จัดแสดงโบราณวัตถุและประวัติศาสตร์ของลพบุรี',
    coordinates: {
      latitude: 14.8000,
      longitude: 100.6167
    },
    category: 'museum',
    categories: ['museum', 'historical', 'recommended'],
    province: 'ลพบุรี',
    district: 'อำเภอเมืองลพบุรี',
    address: 'อำเภอเมืองลพบุรี จังหวัดลพบุรี',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lopburi-004',
    name: 'บ้านวิชาเยนทร์',
    nameEn: 'Ban Vichayen',
    description: 'บ้านพักของคอนสแตนติน ฟอลคอน หรือเจ้าพระยาวิชาเยนทร์ ที่ปรึกษาชาวกรีกในสมัยสมเด็จพระนารายณ์มหาราช',
    coordinates: {
      latitude: 14.8000,
      longitude: 100.6167
    },
    category: 'historical',
    categories: ['historical'],
    province: 'ลพบุรี',
    district: 'อำเภอเมืองลพบุรี',
    address: 'อำเภอเมืองลพบุรี จังหวัดลพบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lopburi-005',
    name: 'เขื่อนป่าสักชลสิทธิ์',
    nameEn: 'Pasak Chonlasit Dam',
    description: 'เขื่อนดินที่ยาวที่สุดในประเทศไทย มีทัศนียภาพที่สวยงามและเป็นจุดชมวิวที่น่าสนใจ',
    coordinates: {
      latitude: 14.8333,
      longitude: 100.6833
    },
    category: 'park',
    categories: ['park', 'recommended'],
    province: 'ลพบุรี',
    district: 'อำเภอพัฒนานิคม',
    address: 'อำเภอพัฒนานิคม จังหวัดลพบุรี',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lopburi-006',
    name: 'ทุ่งทานตะวัน',
    nameEn: 'Sunflower Fields',
    description: 'ในช่วงฤดูหนาว ทุ่งทานตะวันในลพบุรีจะบานสะพรั่ง เป็นจุดถ่ายรูปยอดนิยมของนักท่องเที่ยว',
    coordinates: {
      latitude: 14.8333,
      longitude: 100.6833
    },
    category: 'park',
    categories: ['park', 'recommended'],
    province: 'ลพบุรี',
    district: 'อำเภอพัฒนานิคม',
    address: 'อำเภอพัฒนานิคม จังหวัดลพบุรี',
    checkInRadius: 500,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lopburi-007',
    name: 'วัดป่าสว่างบุญ',
    nameEn: 'Wat Pa Sawang Bun',
    description: 'วัดที่มีพระมหาเจดีย์ 500 ยอด สร้างขึ้นอย่างงดงามและเป็นเอกลักษณ์',
    coordinates: {
      latitude: 14.8167,
      longitude: 100.6500
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'ลพบุรี',
    district: 'อำเภอเมืองลพบุรี',
    address: 'อำเภอเมืองลพบุรี จังหวัดลพบุรี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lopburi-008',
    name: 'วัดนครโกษา',
    nameEn: 'Wat Nakhon Kosa',
    description: 'วัดเก่าแก่ที่มีโบราณสถานและพระพุทธรูปเก่าแก่มากมาย',
    coordinates: {
      latitude: 14.8000,
      longitude: 100.6167
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'ลพบุรี',
    district: 'อำเภอเมืองลพบุรี',
    address: 'อำเภอเมืองลพบุรี จังหวัดลพบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const getAttractionById = (id) => {
  return lopburiAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  return lopburiAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return lopburiAttractions.filter(attr => attr.isActive);
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return lopburiAttractions.filter(attr =>
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

  const index = lopburiAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    lopburiAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

module.exports = {
  lopburiAttractions,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
