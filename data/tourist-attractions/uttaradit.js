// data/tourist-attractions/uttaradit.js
// สถานที่ท่องเที่ยวอุตรดิตถ์ สำหรับเควส Check-in

const uttaraditAttractions = [
  {
    id: 'uttaradit-001',
    name: 'อุทยานแห่งชาติภูสอยดาว',
    nameEn: 'Phu Soi Dao National Park',
    description: 'พื้นที่ป่าธรรมชาติที่สวยงาม มีทุ่งดอกหงอนนาคสีม่วงบานในช่วงฤดูฝน และน้ำตกสายทิพย์ที่น่าชม เหมาะสำหรับผู้ที่รักการผจญภัย',
    coordinates: {
      latitude: 17.7333,
      longitude: 101.0000
    },
    category: 'park',
    categories: ['park', 'mountain', 'recommended'],
    province: 'อุตรดิตถ์',
    district: 'อำเภอน้ำปาด',
    address: 'อำเภอน้ำปาด จังหวัดอุตรดิตถ์',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'uttaradit-002',
    name: 'เขื่อนสิริกิติ์',
    nameEn: 'Sirikit Dam',
    description: 'เขื่อนดินที่ใหญ่ที่สุดในประเทศไทย นอกจากจะเป็นแหล่งผลิตไฟฟ้าและชลประทานแล้ว ยังเป็นสถานที่พักผ่อนหย่อนใจที่มีภูมิทัศน์สวยงามและสวนสุมาลัยที่ร่มรื่น',
    coordinates: {
      latitude: 17.7500,
      longitude: 100.5000
    },
    category: 'other',
    categories: ['other', 'recommended'],
    province: 'อุตรดิตถ์',
    district: 'อำเภอท่าปลา',
    address: 'บ้านผาซ่อม ตำบลผาเลือด อำเภอท่าปลา จังหวัดอุตรดิตถ์',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'uttaradit-003',
    name: 'อุทยานแห่งชาติต้นสักใหญ่',
    nameEn: 'Giant Teak Tree National Park',
    description: 'เป็นที่ตั้งของต้นสักที่ใหญ่ที่สุดในโลก มีอายุประมาณ 1,500 ปี และมีเส้นทางเดินศึกษาธรรมชาติที่น่าสนใจ',
    coordinates: {
      latitude: 17.8000,
      longitude: 100.4000
    },
    category: 'park',
    categories: ['park', 'recommended'],
    province: 'อุตรดิตถ์',
    district: 'อำเภอลับแล',
    address: 'อำเภอลับแล จังหวัดอุตรดิตถ์',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'uttaradit-004',
    name: 'วัดพระแท่นศิลาอาสน์',
    nameEn: 'Wat Phra Thaen Sila At',
    description: 'วัดสำคัญที่มีพระแท่นศิลาอาสน์เป็นศูนย์กลาง เป็นสถานที่ศักดิ์สิทธิ์และมีสถาปัตยกรรมที่งดงาม',
    coordinates: {
      latitude: 17.6500,
      longitude: 100.0833
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'อุตรดิตถ์',
    district: 'อำเภอท่าปลา',
    address: 'อำเภอท่าปลา จังหวัดอุตรดิตถ์',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'uttaradit-005',
    name: 'วัดพระบรมธาตุทุ่งยั้ง',
    nameEn: 'Wat Phra Borommathat Thung Yang',
    description: 'วัดสำคัญที่มีพระบรมธาตุทุ่งยั้งเป็นศูนย์กลาง เป็นสถานที่ศักดิ์สิทธิ์และมีสถาปัตยกรรมที่งดงาม',
    coordinates: {
      latitude: 17.6000,
      longitude: 100.0500
    },
    category: 'temple',
    categories: ['temple', 'historical', 'recommended'],
    province: 'อุตรดิตถ์',
    district: 'อำเภอลับแล',
    address: 'อำเภอลับแล จังหวัดอุตรดิตถ์',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'uttaradit-006',
    name: 'พิพิธภัณฑ์เมืองอุตรดิตถ์',
    nameEn: 'Uttaradit City Museum',
    description: 'พิพิธภัณฑ์ที่จัดแสดงโบราณวัตถุและศิลปะพื้นบ้านของอุตรดิตถ์ เหมาะสำหรับผู้ที่สนใจประวัติศาสตร์และวัฒนธรรม',
    coordinates: {
      latitude: 17.6167,
      longitude: 100.1000
    },
    category: 'museum',
    categories: ['museum', 'historical', 'recommended'],
    province: 'อุตรดิตถ์',
    district: 'อำเภอเมืองอุตรดิตถ์',
    address: 'อำเภอเมืองอุตรดิตถ์ จังหวัดอุตรดิตถ์',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper functions
const getAllActiveAttractions = () => {
  return uttaraditAttractions.filter(attraction => attraction.isActive);
};

const getAttractionById = (id) => {
  return uttaraditAttractions.find(attraction => attraction.id === id);
};

const getAttractionsByCategory = (category) => {
  return uttaraditAttractions.filter(attraction => 
    attraction.isActive && 
    (attraction.category === category || attraction.categories.includes(category))
  );
};

module.exports = {
  uttaraditAttractions,
  getAllActiveAttractions,
  getAttractionById,
  getAttractionsByCategory
};
