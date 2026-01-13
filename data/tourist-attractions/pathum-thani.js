// data/tourist-attractions/pathum-thani.js
// สถานที่ท่องเที่ยวจังหวัดปทุมธานี สำหรับเควส Check-in

const pathumThaniAttractions = [
  {
    id: 'pathum-thani-001',
    name: 'ดรีมเวิลด์',
    nameEn: 'Dream World',
    description: 'สวนสนุกขนาดใหญ่ที่มีเครื่องเล่นและกิจกรรมมากมาย เหมาะสำหรับครอบครัวและกลุ่มเพื่อน มีเครื่องเล่นหลากหลายสำหรับทุกเพศทุกวัย บรรยากาศสนุกสนานและตื่นเต้น',
    coordinates: {
      latitude: 13.994675,
      longitude: 100.675626
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'ปทุมธานี',
    district: 'อำเภอธัญบุรี',
    address: '62 หมู่ 1 ถนนรังสิต-องครักษ์ ตำบลบึงยี่โถ อำเภอธัญบุรี จังหวัดปทุมธานี 12130',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-002',
    name: 'พิพิธภัณฑ์พระราม 9',
    nameEn: 'Rama IX Museum',
    description: 'พิพิธภัณฑ์วิทยาศาสตร์ที่นำเสนอเรื่องราวของการเกิดสายพันธุ์มนุษย์และการกำเนิดจักรวาล เหมาะสำหรับผู้ที่สนใจด้านวิทยาศาสตร์และประวัติศาสตร์ มีนิทรรศการแบบโต้ตอบและเทคโนโลยีทันสมัย',
    coordinates: {
      latitude: 14.0833,
      longitude: 100.6167
    },
    category: 'museum',
    categories: ['museum', 'recommended'],
    province: 'ปทุมธานี',
    district: 'อำเภอคลองหลวง',
    address: 'ตำบลคลองห้า อำเภอคลองหลวง จังหวัดปทุมธานี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-003',
    name: 'วัดปัญญานันทาราม',
    nameEn: 'Wat Panyanantaram',
    description: 'วัดที่มีพุทธศิลป์สามมิติและบรรยากาศสงบ เหมาะสำหรับการปฏิบัติธรรมและศึกษาธรรมะ มีสถาปัตยกรรมที่สวยงามและเป็นสถานที่สำคัญทางศาสนา',
    coordinates: {
      latitude: 14.12975,
      longitude: 100.72267
    },
    category: 'temple',
    categories: ['temple', 'recommended'],
    province: 'ปทุมธานี',
    district: 'อำเภอคลองหลวง',
    address: '1 หมู่ 10 ซอยวัดปัญญา ตำบลคลองหก อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-004',
    name: 'พิพิธภัณฑ์การเกษตรเฉลิมพระเกียรติฯ (Wisdom Farm)',
    nameEn: 'Museum of Agriculture (Wisdom Farm)',
    description: 'พิพิธภัณฑ์การเรียนรู้กลางแจ้งที่เน้นการถ่ายทอดองค์ความรู้ด้านเกษตรเศรษฐกิจพอเพียง มีสะพานไม้ไผ่ทอดยาวให้เดินชมบรรยากาศท้องทุ่ง เหมาะสำหรับครอบครัวและผู้ที่สนใจการเกษตร',
    coordinates: {
      latitude: 14.0833,
      longitude: 100.6333
    },
    category: 'museum',
    categories: ['museum', 'park'],
    province: 'ปทุมธานี',
    district: 'อำเภอคลองหลวง',
    address: 'ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-005',
    name: 'พิพิธภัณฑ์วิทยาศาสตร์แห่งชาติ',
    nameEn: 'National Science Museum',
    description: 'พิพิธภัณฑ์วิทยาศาสตร์และเทคโนโลยีที่ทันสมัย แบ่งเป็น 6 ชั้น ครอบคลุมหัวข้อต่าง ๆ เช่น วิทยาศาสตร์พื้นฐาน เทคโนโลยีภูมิปัญญาไทย และอื่น ๆ เหมาะสำหรับครอบครัวและนักเรียน',
    coordinates: {
      latitude: 14.0833,
      longitude: 100.6167
    },
    category: 'museum',
    categories: ['museum', 'recommended'],
    province: 'ปทุมธานี',
    district: 'อำเภอคลองหลวง',
    address: 'อำเภอคลองหลวง จังหวัดปทุมธานี',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-006',
    name: 'วัดเขียนเขต พระอารามหลวง',
    nameEn: 'Wat Khian Khet Royal Temple',
    description: 'วัดพระอารามหลวงที่มีพระอุโบสถสีทองอร่ามและลายปูนปั้นที่วิจิตรบรรจง บรรยากาศร่มรื่น เหมาะสำหรับการทำบุญและไหว้พระ เป็นสถานที่สำคัญทางศาสนาและศิลปะ',
    coordinates: {
      latitude: 14.0167,
      longitude: 100.6167
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'ปทุมธานี',
    district: 'อำเภอธัญบุรี',
    address: 'คลอง 5 อำเภอธัญบุรี จังหวัดปทุมธานี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-007',
    name: 'วัดเทียนถวาย',
    nameEn: 'Wat Tian Thawai',
    description: 'วัดเก่าแก่ที่มีตำนานว่าสร้างขึ้นเมื่อประมาณ พ.ศ. 1880 โดยพระเจ้าอู่ทอง มีประวัติศาสตร์ยาวนานและสถาปัตยกรรมโบราณที่สวยงาม',
    coordinates: {
      latitude: 14.0167,
      longitude: 100.5333
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'ปทุมธานี',
    district: 'อำเภอเมืองปทุมธานี',
    address: 'ตำบลบ้านใหม่ อำเภอเมืองปทุมธานี จังหวัดปทุมธานี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-009',
    name: 'ทุ่งนามอญ',
    nameEn: 'Mon Rice Fields',
    description: 'สถานที่ที่สามารถสัมผัสวัฒนธรรมของชาวมอญและบรรยากาศทุ่งนา เหมาะสำหรับการพักผ่อนและเรียนรู้วัฒนธรรม มีวิวทุ่งนาสีเขียวสวยงาม',
    coordinates: {
      latitude: 14.0167,
      longitude: 100.5500
    },
    category: 'park',
    categories: ['park', 'historical'],
    province: 'ปทุมธานี',
    district: 'อำเภอเมืองปทุมธานี',
    address: 'อำเภอเมืองปทุมธานี จังหวัดปทุมธานี',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-010',
    name: 'พิพิธภัณฑ์หินหายาก',
    nameEn: 'Rare Stone Museum',
    description: 'พิพิธภัณฑ์ที่จัดแสดงหินหายาก ฟอสซิล และแร่ธาตุต่างๆ มีคอลเลกชันที่น่าสนใจสำหรับผู้ที่สนใจธรณีวิทยาและธรรมชาติ',
    coordinates: {
      latitude: 14.0135,
      longitude: 100.5305
    },
    category: 'museum',
    categories: ['museum'],
    province: 'ปทุมธานี',
    district: 'อำเภอเมืองปทุมธานี',
    address: '29/2 หมู่ 1 ถนนรังสิต-ท่าช้าง ตำบลบ้านกลาง อำเภอเมืองปทุมธานี จังหวัดปทุมธานี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-011',
    name: 'วัดสันเจา',
    nameEn: 'Wat San Chao',
    description: 'วัดโบราณที่มีศาลเจ้าสยามแพรงสี เป็นสถานที่สำคัญทางศาสนาและวัฒนธรรม มีสถาปัตยกรรมที่สวยงาม',
    coordinates: {
      latitude: 14.0135,
      longitude: 100.5305
    },
    category: 'temple',
    categories: ['temple', 'historical'],
    province: 'ปทุมธานี',
    district: 'อำเภอเมืองปทุมธานี',
    address: 'ตำบลบ้านกลาง อำเภอเมืองปทุมธานี จังหวัดปทุมธานี',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-012',
    name: 'สวนสนุกแฮปปี้ ซันไชน์ ปาร์ค',
    nameEn: 'Happy Sunshine Park',
    description: 'สวนสนุกใหม่ที่เปิดในปี 2567 มีเครื่องเล่นมากกว่า 50 ชนิด ตั้งอยู่ใกล้แยกปู่โพธิ์ ถนนติวานนท์ และถนน 345 สะพานปทุมธานี 2 เหมาะสำหรับครอบครัว',
    coordinates: {
      latitude: 14.0167,
      longitude: 100.5333
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'ปทุมธานี',
    district: 'อำเภอเมืองปทุมธานี',
    address: 'แยกปู่โพธิ์ ถนนติวานนท์ อำเภอเมืองปทุมธานี จังหวัดปทุมธานี',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-013',
    name: 'มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต',
    nameEn: 'Thammasat University Rangsit Campus',
    description: 'มหาวิทยาลัยที่มีพื้นที่กว้างขวางและสวยงาม มีสนามกีฬาและสถานที่สำคัญต่างๆ เหมาะสำหรับการเยี่ยมชมและเรียนรู้',
    coordinates: {
      latitude: 14.0833,
      longitude: 100.6167
    },
    category: 'other',
    categories: ['other'],
    province: 'ปทุมธานี',
    district: 'อำเภอคลองหลวง',
    address: 'ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pathum-thani-014',
    name: 'มหาวิทยาลัยรังสิต',
    nameEn: 'Rangsit University',
    description: 'มหาวิทยาลัยเอกชนที่มีพื้นที่กว้างขวาง มีสนามกีฬาและสถานที่สำคัญต่างๆ เหมาะสำหรับการเยี่ยมชม',
    coordinates: {
      latitude: 14.0135,
      longitude: 100.5305
    },
    category: 'other',
    categories: ['other'],
    province: 'ปทุมธานี',
    district: 'อำเภอเมืองปทุมธานี',
    address: 'อำเภอเมืองปทุมธานี จังหวัดปทุมธานี',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAttractionById = (id) => {
  return pathumThaniAttractions.find(attr => attr.id === id);
};

const getAttractionsByCategory = (category) => {
  return pathumThaniAttractions.filter(attr => attr.category === category && attr.isActive);
};

const getAllActiveAttractions = () => {
  return pathumThaniAttractions.filter(attr => attr.isActive);
};

const searchAttractionsByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return pathumThaniAttractions.filter(attr =>
    attr.isActive && (
      attr.name.toLowerCase().includes(term) ||
      attr.nameEn.toLowerCase().includes(term) ||
      attr.description.toLowerCase().includes(term)
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
  const index = pathumThaniAttractions.findIndex(a => a.id === attractionId);
  if (index !== -1) {
    pathumThaniAttractions[index] = attraction;
    return attraction;
  }

  return null;
};

// Export
module.exports = {
  pathumThaniAttractions,
  getAttractionById,
  getAttractionsByCategory,
  getAllActiveAttractions,
  searchAttractionsByName,
  updateAttractionCoordinates
};
