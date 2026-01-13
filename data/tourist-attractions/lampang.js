// data/tourist-attractions/lampang.js
// สถานที่ท่องเที่ยวลำปาง สำหรับเควส Check-in

const lampangAttractions = [
  {
    id: 'lampang-001',
    name: 'วัดพระธาตุลำปางหลวง',
    nameEn: 'Wat Phra That Lampang Luang',
    description: 'วัดเก่าแก่ที่มีสถาปัตยกรรมล้านนาที่งดงาม และเป็นที่ประดิษฐานพระธาตุศักดิ์สิทธิ์ของจังหวัด มีวิหารไม้ที่สวยงามและเป็นสถานที่สำคัญทางประวัติศาสตร์',
    coordinates: {
      latitude: 18.21748,
      longitude: 99.38884
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'ลำปาง',
    district: 'อำเภอเกาะคา',
    address: 'ตำบลลำปางหลวง อำเภอเกาะคา จังหวัดลำปาง',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lampang-002',
    name: 'อุทยานแห่งชาติแจ้ซ้อน',
    nameEn: 'Chae Son National Park',
    description: 'สถานที่ท่องเที่ยวธรรมชาติที่มีบ่อน้ำพุร้อนและน้ำตกสวยงาม เหมาะสำหรับการพักผ่อนและแช่น้ำแร่ มีน้ำตกแจ้ซ้อนที่สวยงาม',
    coordinates: {
      latitude: 18.836330,
      longitude: 99.469360
    },
    category: 'park',
    categories: ['park', 'waterfall', 'recommended'],
    province: 'ลำปาง',
    district: 'อำเภอเมืองปาน',
    address: 'ตำบลแจ้ซ้อน อำเภอเมืองปาน จังหวัดลำปาง',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lampang-003',
    name: 'กาดกองต้า',
    nameEn: 'Kad Kong Ta',
    description: 'ย่านตลาดเก่าที่เต็มไปด้วยสถาปัตยกรรมโบราณและร้านค้าท้องถิ่น เป็นสถานที่ที่นักท่องเที่ยวนิยมมาเดินเล่นและชิมอาหารพื้นเมือง',
    coordinates: {
      latitude: 18.2900,
      longitude: 99.5000
    },
    category: 'market',
    categories: ['market', 'historical', 'recommended'],
    province: 'ลำปาง',
    district: 'อำเภอเมืองลำปาง',
    address: 'ถนนตลาดเก่า อำเภอเมืองลำปาง จังหวัดลำปาง',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lampang-004',
    name: 'หล่มภูเขียว',
    nameEn: 'Lom Phu Kheo',
    description: 'บึงน้ำธรรมชาติที่มีน้ำสีเขียวมรกตใสสะอาด ตั้งอยู่ในอำเภองาว เป็นสถานที่ท่องเที่ยวที่น่าตื่นตาตื่นใจ มีวิวทิวทัศน์ที่สวยงาม',
    coordinates: {
      latitude: 18.7500,
      longitude: 99.9500
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'ลำปาง',
    district: 'อำเภองาว',
    address: 'อำเภองาว จังหวัดลำปาง',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lampang-005',
    name: 'ศูนย์อนุรักษ์ช้างไทย',
    nameEn: 'Thai Elephant Conservation Center',
    description: 'ศูนย์อนุรักษ์ช้างที่ให้ความรู้เกี่ยวกับช้างและอนุรักษ์ช้างไทย มีการแสดงช้างและกิจกรรมเกี่ยวกับช้าง',
    coordinates: {
      latitude: 18.3500,
      longitude: 99.5500
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'ลำปาง',
    district: 'อำเภอเมืองลำปาง',
    address: 'อำเภอเมืองลำปาง จังหวัดลำปาง',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lampang-006',
    name: 'วัดเจดีย์ซาวหลัง',
    nameEn: 'Wat Chedi Sao',
    description: 'วัดที่มีเจดีย์ 20 องค์เรียงกัน เป็นวัดที่มีสถาปัตยกรรมล้านนาที่สวยงามและเป็นสถานที่สำคัญ',
    coordinates: {
      latitude: 18.3000,
      longitude: 99.5200
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'ลำปาง',
    district: 'อำเภอเมืองลำปาง',
    address: 'อำเภอเมืองลำปาง จังหวัดลำปาง',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lampang-007',
    name: 'วัดพระแก้วดอนเต้า',
    nameEn: 'Wat Phra Kaeo Don Tao',
    description: 'วัดเก่าแก่ที่มีสถาปัตยกรรมล้านนาที่งดงาม และเป็นสถานที่สำคัญทางประวัติศาสตร์ของลำปาง',
    coordinates: {
      latitude: 18.2900,
      longitude: 99.5100
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'ลำปาง',
    district: 'อำเภอเมืองลำปาง',
    address: 'อำเภอเมืองลำปาง จังหวัดลำปาง',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return lampangAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return lampangAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return lampangAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  lampangAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
