// data/tourist-attractions/kamphaeng-phet.js
const kamphaengPhetAttractions = [
  { id: 'kamphaeng-phet-001', name: 'อุทยานประวัติศาสตร์กำแพงเพชร', nameEn: 'Kamphaeng Phet Historical Park', description: 'ได้รับการประกาศให้เป็นมรดกโลกจาก UNESCO มีโบราณสถานที่น่าสนใจ เช่น วัดพระสี่อิริยาบถ และวัดช้างรอบ', coordinates: { latitude: 16.4833, longitude: 99.5167 }, category: 'historical', categories: ['historical', 'temple', 'recommended'], province: 'กำแพงเพชร', district: 'อำเภอเมืองกำแพงเพชร', address: 'อำเภอเมืองกำแพงเพชร จังหวัดกำแพงเพชร', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'kamphaeng-phet-002', name: 'อุทยานแห่งชาติคลองลาน', nameEn: 'Khlong Lan National Park', description: 'มีน้ำตกคลองลานที่สวยงามและธรรมชาติที่อุดมสมบูรณ์ เหมาะสำหรับการพักผ่อนและเดินป่า', coordinates: { latitude: 16.2000, longitude: 99.3000 }, category: 'park', categories: ['park', 'waterfall', 'recommended'], province: 'กำแพงเพชร', district: 'อำเภอคลองลาน', address: 'อำเภอคลองลาน จังหวัดกำแพงเพชร', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => kamphaengPhetAttractions.filter(a => a.isActive);
const getAttractionById = (id) => kamphaengPhetAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => kamphaengPhetAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { kamphaengPhetAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
