// data/tourist-attractions/chainat.js
// สถานที่ท่องเที่ยวจังหวัดชัยนาท สำหรับเควส Check-in

const chainatAttractions = [
  {
    id: 'chainat-001',
    name: 'สวนนกชัยนาท',
    nameEn: 'Chainat Bird Park',
    description: 'เป็นสวนนกที่มีกรงนกขนาดใหญ่ที่สุดในเอเชีย ภายในมีนกหลากหลายสายพันธุ์ให้ชม และยังมีพิพิธภัณฑ์ไข่นกที่รวบรวมไข่นกจากทั่วโลก',
    coordinates: {
      latitude: 15.1833,
      longitude: 100.1333
    },
    category: 'zoo',
    categories: ['zoo', 'recommended'],
    province: 'ชัยนาท',
    district: 'อำเภอเมืองชัยนาท',
    address: 'อำเภอเมืองชัยนาท จังหวัดชัยนาท',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-002',
    name: 'เขื่อนเจ้าพระยา',
    nameEn: 'Chao Phraya Dam',
    description: 'เขื่อนชลประทานขนาดใหญ่แห่งแรกของประเทศไทย ตั้งอยู่ที่อำเภอสรรพยา เป็นจุดชมวิวแม่น้ำเจ้าพระยาที่สวยงาม',
    coordinates: {
      latitude: 15.2000,
      longitude: 100.1500
    },
    category: 'park',
    categories: ['park', 'recommended'],
    province: 'ชัยนาท',
    district: 'อำเภอสรรพยา',
    address: 'อำเภอสรรพยา จังหวัดชัยนาท',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-003',
    name: 'วัดปฐมเทศนาอรัญวาสี (วัดเขาพลอง)',
    nameEn: 'Wat Pathom Thetsana Aranyawasi (Wat Khao Phalong)',
    description: 'วัดที่ตั้งอยู่บนยอดเขาพลอง สามารถชมวิวเมืองชัยนาทได้แบบ 180 องศา ภายในวัดมีพระพุทธรูปปางมารวิชัยขนาดใหญ่',
    coordinates: {
      latitude: 15.1833,
      longitude: 100.1333
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'ชัยนาท',
    district: 'อำเภอเมืองชัยนาท',
    address: 'อำเภอเมืองชัยนาท จังหวัดชัยนาท',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-004',
    name: 'วัดพิชัยนาวาส (วัดบ้านเชี่ยน)',
    nameEn: 'Wat Phichai Nawas (Wat Ban Chian)',
    description: 'วัดโบราณสมัยอยุธยาตอนกลาง มีพระอุโบสถกลางสระน้ำ ภายในประดิษฐาน "หลวงพ่อโต" พระพุทธรูปปางป่าเลไลย์',
    coordinates: {
      latitude: 15.1833,
      longitude: 100.1333
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'ชัยนาท',
    district: 'อำเภอเมืองชัยนาท',
    address: 'อำเภอเมืองชัยนาท จังหวัดชัยนาท',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-005',
    name: 'วัดไกลกังวล (เขาสารพัดศรีเจริญธรรม)',
    nameEn: 'Wat Klaikangwon (Khao Saraphat Si Charoen Tham)',
    description: 'วัดโบราณตั้งแต่สมัยลพบุรี บนยอดเขามีรอยพระพุทธบาทขนาดใหญ่และซากโบสถ์เก่า',
    coordinates: {
      latitude: 15.1833,
      longitude: 100.1333
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'ชัยนาท',
    district: 'อำเภอเมืองชัยนาท',
    address: 'อำเภอเมืองชัยนาท จังหวัดชัยนาท',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-006',
    name: 'วัดพิกุลงาม',
    nameEn: 'Wat Pikun Ngam',
    description: 'วัดที่ร่มรื่นด้วยต้นพิกุล มีลิงอาศัยอยู่มาก ทุกปีจะมีการจัดงาน "เลี้ยงโต๊ะจีนลิง" พร้อมมหรสพ',
    coordinates: {
      latitude: 15.1833,
      longitude: 100.1333
    },
    category: 'temple',
    categories: ['temple'],
    province: 'ชัยนาท',
    district: 'อำเภอเมืองชัยนาท',
    address: 'อำเภอเมืองชัยนาท จังหวัดชัยนาท',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-007',
    name: 'คุ้งสำเภาฟิล์ม & คาเฟ่',
    nameEn: 'Kung Sampao Film & Cafe',
    description: 'คาเฟ่บรรยากาศดี ริมแม่น้ำเจ้าพระยา เหมาะสำหรับการพักผ่อนและถ่ายรูป',
    coordinates: {
      latitude: 15.2000,
      longitude: 100.1500
    },
    category: 'other',
    categories: ['other'],
    province: 'ชัยนาท',
    district: 'อำเภอสรรพยา',
    address: 'อำเภอสรรพยา จังหวัดชัยนาท',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-008',
    name: 'WHAM Cafe',
    nameEn: 'WHAM Cafe',
    description: 'คาเฟ่สไตล์โฮมคาเฟ่ บรรยากาศอบอุ่น มีเมนูอาหารและเครื่องดื่มหลากหลาย',
    coordinates: {
      latitude: 15.1833,
      longitude: 100.1333
    },
    category: 'other',
    categories: ['other'],
    province: 'ชัยนาท',
    district: 'อำเภอเมืองชัยนาท',
    address: 'อำเภอเมืองชัยนาท จังหวัดชัยนาท',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-009',
    name: 'เนรมิตคาเฟ่',
    nameEn: 'Neramit Cafe',
    description: 'คาเฟ่ที่จำลองบรรยากาศเหมือนอยู่ต่างประเทศ มีจุดถ่ายรูปสวยงามมากมาย',
    coordinates: {
      latitude: 15.1833,
      longitude: 100.1333
    },
    category: 'other',
    categories: ['other'],
    province: 'ชัยนาท',
    district: 'อำเภอเมืองชัยนาท',
    address: 'อำเภอเมืองชัยนาท จังหวัดชัยนาท',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'chainat-010',
    name: 'คลาสิคคาราวาน',
    nameEn: 'Classic Caravan',
    description: 'คาเฟ่และที่พักสไตล์รถบ้าน มีสวนสัตว์เล็กๆ และกิจกรรมให้อาหารสัตว์',
    coordinates: {
      latitude: 15.1833,
      longitude: 100.1333
    },
    category: 'other',
    categories: ['other'],
    province: 'ชัยนาท',
    district: 'อำเภอเมืองชัยนาท',
    address: 'อำเภอเมืองชัยนาท จังหวัดชัยนาท',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAttractionById = (id) => {
  return chainatAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  return chainatAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return chainatAttractions.filter(attr => attr.isActive);
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return chainatAttractions.filter(attr =>
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

  const index = chainatAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    chainatAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

// Export
module.exports = {
  chainatAttractions,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
