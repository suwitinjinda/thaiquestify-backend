// data/tourist-attractions/ang-thong.js
// สถานที่ท่องเที่ยวจังหวัดอ่างทอง สำหรับเควส Check-in

const angThongAttractions = [
  {
    id: 'ang-thong-001',
    name: 'วัดม่วง',
    nameEn: 'Wat Muang',
    description: 'เป็นที่ประดิษฐานพระพุทธมหานวมินทรศากยมุนีศรีวิเศษชัยชาญ หรือ "หลวงพ่อใหญ่" ซึ่งเป็นพระพุทธรูปปางมารวิชัยขนาดใหญ่ที่สุดในประเทศไทย มีความสูงถึง 95 เมตร และหน้าตักกว้าง 63.05 เมตร',
    coordinates: {
      latitude: 14.6167,
      longitude: 100.3667
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'อ่างทอง',
    district: 'อำเภอวิเศษชัยชาญ',
    address: 'อำเภอวิเศษชัยชาญ จังหวัดอ่างทอง',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ang-thong-002',
    name: 'วัดป่าโมกวรวิหาร',
    nameEn: 'Wat Pa Mok Worawihan',
    description: 'มีพระพุทธไสยาสน์ขนาดใหญ่ที่สันนิษฐานว่าสร้างขึ้นในสมัยสุโขทัย องค์พระนอนมีความยาวประมาณ 22 เมตร และมีพระพักตร์ที่งดงาม',
    coordinates: {
      latitude: 14.6167,
      longitude: 100.3667
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'อ่างทอง',
    district: 'อำเภอป่าโมก',
    address: 'อำเภอป่าโมก จังหวัดอ่างทอง',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ang-thong-003',
    name: 'วัดฝาง',
    nameEn: 'Wat Fang',
    description: 'วัดที่มีโบสถ์หินทรายแกะสลักสวยงามในสไตล์ศิลปะขอมร่วมสมัย นอกจากนี้ยังมีวิหารเก่าแก่ที่มีต้นโพธิ์ปกคลุมบริเวณช่องประตูขนาดใหญ่',
    coordinates: {
      latitude: 14.5833,
      longitude: 100.4167
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'อ่างทอง',
    district: 'อำเภอเมืองอ่างทอง',
    address: 'อำเภอเมืองอ่างทอง จังหวัดอ่างทอง',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ang-thong-004',
    name: 'ตลาดศาลเจ้าโรงทอง',
    nameEn: 'Chao Rong Thong Market',
    description: 'ตลาดเก่าแก่ที่มีขนมไทยโบราณและของฝากมากมาย เช่น ขนมบ้าบิ่น ขนมขี้ควาย และขนมเกสรลำเจียก',
    coordinates: {
      latitude: 14.5833,
      longitude: 100.4167
    },
    category: 'market',
    categories: ['market', 'recommended'],
    province: 'อ่างทอง',
    district: 'อำเภอเมืองอ่างทอง',
    address: 'อำเภอเมืองอ่างทอง จังหวัดอ่างทอง',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ang-thong-005',
    name: 'อินโต ฟาร์ม เมล่อน',
    nameEn: 'Into Farm Melon',
    description: 'ฟาร์มเมล่อนพันธุ์ JP Green ที่เปิดให้นักท่องเที่ยวเข้าชมและชิมเมล่อนสดๆ จากสวน พร้อมเมนูอาหารคาวหวานที่ทำจากเมล่อน',
    coordinates: {
      latitude: 14.6000,
      longitude: 100.4000
    },
    category: 'other',
    categories: ['other'],
    province: 'อ่างทอง',
    district: 'อำเภอเมืองอ่างทอง',
    address: 'อำเภอเมืองอ่างทอง จังหวัดอ่างทอง',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ang-thong-006',
    name: 'วัดจันทรังษี',
    nameEn: 'Wat Chantharangsri',
    description: 'มีวิหารจัตุมุขมียอดบุษบกกลาง 5 ชั้น เป็นสถาปัตยกรรมที่งดงาม ภายในประดิษฐานรูปหล่อหลวงพ่อสด',
    coordinates: {
      latitude: 14.5833,
      longitude: 100.4167
    },
    category: 'temple',
    categories: ['temple'],
    province: 'อ่างทอง',
    district: 'อำเภอเมืองอ่างทอง',
    address: 'อำเภอเมืองอ่างทอง จังหวัดอ่างทอง',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ang-thong-007',
    name: 'วัดต้นสน',
    nameEn: 'Wat Ton Son',
    description: 'วัดที่ได้รับการบูรณะจนสวยงาม มีพุทธศิลป์ที่งดงามและเป็นที่ประทับใจแก่ผู้พบเห็น',
    coordinates: {
      latitude: 14.5833,
      longitude: 100.4167
    },
    category: 'temple',
    categories: ['temple'],
    province: 'อ่างทอง',
    district: 'อำเภอเมืองอ่างทอง',
    address: 'อำเภอเมืองอ่างทอง จังหวัดอ่างทอง',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const getAttractionById = (id) => {
  return angThongAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  return angThongAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return angThongAttractions.filter(attr => attr.isActive);
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return angThongAttractions.filter(attr =>
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

  const index = angThongAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    angThongAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

module.exports = {
  angThongAttractions,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
