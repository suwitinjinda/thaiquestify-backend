// data/tourist-attractions/pichit.js
const pichitAttractions = [
  { id: 'pichit-001', name: 'บึงสีไฟ', nameEn: 'Bueng Si Fai', description: 'แหล่งน้ำขนาดใหญ่เป็นอันดับสามของประเทศไทย มีบรรยากาศสงบและเป็นสถานที่พักผ่อนหย่อนใจ', coordinates: { latitude: 16.4333, longitude: 100.3500 }, category: 'other', categories: ['other', 'recommended'], province: 'พิจิตร', district: 'อำเภอเมืองพิจิตร', address: 'อำเภอเมืองพิจิตร จังหวัดพิจิตร', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'pichit-002', name: 'วัดท่าหลวง', nameEn: 'Wat Tha Luang', description: 'ประดิษฐานหลวงพ่อเพชร พระพุทธรูปปางมารวิชัยสมัยเชียงแสน เป็นวัดเก่าแก่คู่บ้านคู่เมืองพิจิตร', coordinates: { latitude: 16.4400, longitude: 100.3600 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'พิจิตร', district: 'อำเภอเมืองพิจิตร', address: 'อำเภอเมืองพิจิตร จังหวัดพิจิตร', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => pichitAttractions.filter(a => a.isActive);
const getAttractionById = (id) => pichitAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => pichitAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { pichitAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
