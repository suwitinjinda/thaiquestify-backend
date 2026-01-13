// data/tourist-attractions/ayutthaya.js
// สถานที่ท่องเที่ยวจังหวัดพระนครศรีอยุธยา สำหรับเควส Check-in

const ayutthayaAttractions = [
  {
    id: 'ayutthaya-001',
    name: 'วัดไชยวัฒนาราม',
    nameEn: 'Wat Chaiwatthanaram',
    description: 'วัดที่สร้างขึ้นในปี พ.ศ. 2173 โดยพระเจ้าปราสาททอง เพื่อเป็นอนุสรณ์แด่พระมารดา โดดเด่นด้วยปรางค์กลางสูง 35 เมตร ล้อมรอบด้วยปรางค์ย่อยสี่องค์ สะท้อนสถาปัตยกรรมแบบขอม',
    coordinates: {
      latitude: 14.3394,
      longitude: 100.5400
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ayutthaya-002',
    name: 'วัดราชบูรณะ',
    nameEn: 'Wat Ratchaburana',
    description: 'ก่อตั้งในปี พ.ศ. 1967 โดยสมเด็จพระบรมราชาธิราชที่ 2 บนสถานที่เผาศพของพระเชษฐาทั้งสองที่ต่อสู้เพื่อราชบัลลังก์ ปรางค์กลางของวัดนี้มีภาพจิตรกรรมฝาผนังที่หายากจากยุคต้นอยุธยา',
    coordinates: {
      latitude: 14.3567,
      longitude: 100.5589
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ayutthaya-003',
    name: 'วัดพนัญเชิงวรวิหาร',
    nameEn: 'Wat Phanan Choeng',
    description: 'ตั้งอยู่ทางตะวันออกเฉียงใต้ของเกาะอยุธยา วัดนี้มีพระพุทธรูปหลวงพ่อโตสูง 19 เมตร สร้างขึ้นในปี พ.ศ. 1867 และเป็นที่เคารพของทั้งชาวไทยและชาวไทยเชื้อสายจีน',
    coordinates: {
      latitude: 14.3411,
      longitude: 100.5767
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ayutthaya-004',
    name: 'วัดธรรมิกราช',
    nameEn: 'Wat Thammikarat',
    description: 'วัดนี้มีเจดีย์สิงห์ล้อมที่โดดเด่น และพระพุทธรูปปางไสยาสน์ยาว 12 เมตร วัดนี้มีประวัติศาสตร์ยาวนานและเป็นที่น่าสนใจสำหรับผู้ที่สนใจศิลปะก่อนยุคอยุธยา',
    coordinates: {
      latitude: 14.3589,
      longitude: 100.5556
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ayutthaya-005',
    name: 'ตลาดเจ้าพรหม',
    nameEn: 'Chao Phrom Market',
    description: 'ตลาดดั้งเดิมของอยุธยาที่ตั้งอยู่บนถนนนเรศวร ที่นี่คุณจะพบกับอาหาร เสื้อผ้า ของหวานไทย และสินค้าต่าง ๆ มากมาย',
    coordinates: {
      latitude: 14.3589,
      longitude: 100.5589
    },
    category: 'market',
    categories: ['market', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'ถนนนเรศวร อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ayutthaya-006',
    name: 'วัดมหาธาตุ',
    nameEn: 'Wat Mahathat',
    description: 'วัดนี้เป็นที่รู้จักจากเศียรพระพุทธรูปที่ถูกปกคลุมด้วยรากไม้ ซึ่งเป็นสัญลักษณ์ของอุทยานประวัติศาสตร์อยุธยา',
    coordinates: {
      latitude: 14.3589,
      longitude: 100.5589
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ayutthaya-007',
    name: 'วัดพระศรีสรรเพชญ์',
    nameEn: 'Wat Phra Si Sanphet',
    description: 'วัดนี้เคยเป็นวัดหลวงในพระราชวังเก่า มีเจดีย์สามองค์ที่เป็นสัญลักษณ์ของอยุธยา',
    coordinates: {
      latitude: 14.3589,
      longitude: 100.5589
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'ayutthaya-008',
    name: 'อุทยานประวัติศาสตร์พระนครศรีอยุธยา',
    nameEn: 'Ayutthaya Historical Park',
    description: 'อุทยานประวัติศาสตร์ที่ได้รับการขึ้นทะเบียนเป็นมรดกโลก มีโบราณสถานและวัดเก่าแก่มากมาย',
    coordinates: {
      latitude: 14.3589,
      longitude: 100.5589
    },
    category: 'historical',
    categories: ['historical', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 500,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAttractionById = (id) => {
  return ayutthayaAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  return ayutthayaAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return ayutthayaAttractions.filter(attr => attr.isActive);
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return ayutthayaAttractions.filter(attr =>
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

  const index = ayutthayaAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    ayutthayaAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

// Export
module.exports = {
  ayutthayaAttractions,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
