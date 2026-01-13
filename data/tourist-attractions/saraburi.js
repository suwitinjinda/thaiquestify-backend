// data/tourist-attractions/saraburi.js
// สถานที่ท่องเที่ยวจังหวัดสระบุรี สำหรับเควส Check-in

const saraburiAttractions = [
  {
    id: 'saraburi-001',
    name: 'วัดแก่งคอย',
    nameEn: 'Wat Kaeng Khoi',
    description: 'วัดเก่าแก่ที่สร้างขึ้นในปี พ.ศ. 2330 มีพระพุทธไสยาสน์นิมิตมงคลมุนีศรีแก่งคอย และถ้ำพญานาคจำลองที่สวยงาม',
    coordinates: {
      latitude: 14.5833,
      longitude: 100.8500
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'สระบุรี',
    district: 'อำเภอแก่งคอย',
    address: 'อำเภอแก่งคอย จังหวัดสระบุรี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-002',
    name: 'เขื่อนป่าสักชลสิทธิ์',
    nameEn: 'Pasak Chonlasit Dam',
    description: 'เขื่อนดินที่ยาวที่สุดในประเทศไทย มีจุดชมวิวสวยงามและกิจกรรมหลากหลาย เช่น นั่งรถรางเที่ยวสันเขื่อน และชมพระอาทิตย์ตกดิน',
    coordinates: {
      latitude: 14.8333,
      longitude: 100.6833
    },
    category: 'park',
    categories: ['park', 'recommended'],
    province: 'สระบุรี',
    district: 'อำเภอพัฒนานิคม',
    address: 'อำเภอพัฒนานิคม จังหวัดสระบุรี',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-003',
    name: 'วัดป่าสว่างบุญ',
    nameEn: 'Wat Pa Sawang Bun',
    description: 'มีพระมหาเจดีย์ 500 ยอด ที่งดงามและเป็นเอกลักษณ์ ภายในบรรจุพระบรมสารีริกธาตุ 84,000 องค์',
    coordinates: {
      latitude: 14.8167,
      longitude: 100.6500
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'สระบุรี',
    district: 'อำเภอเมืองสระบุรี',
    address: 'อำเภอเมืองสระบุรี จังหวัดสระบุรี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-004',
    name: 'น้ำตกเจ็ดสาวน้อย',
    nameEn: 'Ched Sao Noi Waterfall',
    description: 'น้ำตกที่มีชั้นเล็ก ๆ 7 ชั้น น้ำใสสะอาด เหมาะสำหรับการพักผ่อนและเล่นน้ำ',
    coordinates: {
      latitude: 14.6000,
      longitude: 100.9167
    },
    category: 'park',
    categories: ['park'],
    province: 'สระบุรี',
    district: 'อำเภอแก่งคอย',
    address: 'อำเภอแก่งคอย จังหวัดสระบุรี',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-005',
    name: 'ฟาร์มโคนมไทย-เดนมาร์ค',
    nameEn: 'Thai-Denmark Dairy Farm',
    description: 'สถานที่เรียนรู้เกี่ยวกับการเลี้ยงโคนมและกระบวนการผลิตนม พร้อมกิจกรรมสนุก ๆ สำหรับครอบครัว',
    coordinates: {
      latitude: 14.5167,
      longitude: 100.9167
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'สระบุรี',
    district: 'อำเภอมวกเหล็ก',
    address: 'อำเภอมวกเหล็ก จังหวัดสระบุรี',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-006',
    name: 'อุทยานแห่งชาติน้ำตกสามหลั่น',
    nameEn: 'Sam Lan National Park',
    description: 'พื้นที่ธรรมชาติที่มีน้ำตกและเส้นทางเดินป่า เหมาะสำหรับผู้ที่รักการผจญภัย',
    coordinates: {
      latitude: 14.5833,
      longitude: 100.8500
    },
    category: 'park',
    categories: ['park'],
    province: 'สระบุรี',
    district: 'อำเภอแก่งคอย',
    address: 'อำเภอแก่งคอย จังหวัดสระบุรี',
    checkInRadius: 500,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-007',
    name: 'สวนเบญจมาศบิ๊กเต้',
    nameEn: 'Big Tee Chrysanthemum Garden',
    description: 'สวนดอกไม้ที่มีดอกเบญจมาศหลากสีสัน เหมาะสำหรับการถ่ายรูปและพักผ่อน',
    coordinates: {
      latitude: 14.5167,
      longitude: 100.9167
    },
    category: 'park',
    categories: ['park'],
    province: 'สระบุรี',
    district: 'อำเภอมวกเหล็ก',
    address: 'อำเภอมวกเหล็ก จังหวัดสระบุรี',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-008',
    name: 'วัดถ้ำพระโพธิสัตว์',
    nameEn: 'Wat Tham Phra Phothisat',
    description: 'วัดที่มีถ้ำธรรมชาติและพระพุทธรูปประดิษฐานอยู่ภายใน',
    coordinates: {
      latitude: 14.5833,
      longitude: 100.8500
    },
    category: 'temple',
    categories: ['temple'],
    province: 'สระบุรี',
    district: 'อำเภอแก่งคอย',
    address: 'อำเภอแก่งคอย จังหวัดสระบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-009',
    name: 'อ่างเก็บน้ำมวกเหล็ก',
    nameEn: 'Muak Lek Reservoir',
    description: 'สถานที่พักผ่อนที่มีวิวสวยงามและกิจกรรมทางน้ำ',
    coordinates: {
      latitude: 14.5167,
      longitude: 100.9167
    },
    category: 'park',
    categories: ['park'],
    province: 'สระบุรี',
    district: 'อำเภอมวกเหล็ก',
    address: 'อำเภอมวกเหล็ก จังหวัดสระบุรี',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'saraburi-010',
    name: 'วัดแขกมวกเหล็ก',
    nameEn: 'Wat Khaek Muak Lek',
    description: 'วัดที่มีสถาปัตยกรรมสวยงามและเป็นศูนย์รวมจิตใจของชาวบ้าน',
    coordinates: {
      latitude: 14.5167,
      longitude: 100.9167
    },
    category: 'temple',
    categories: ['temple'],
    province: 'สระบุรี',
    district: 'อำเภอมวกเหล็ก',
    address: 'อำเภอมวกเหล็ก จังหวัดสระบุรี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAttractionById = (id) => {
  return saraburiAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  return saraburiAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return saraburiAttractions.filter(attr => attr.isActive);
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return saraburiAttractions.filter(attr =>
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

  const index = saraburiAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    saraburiAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

// Export
module.exports = {
  saraburiAttractions,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
