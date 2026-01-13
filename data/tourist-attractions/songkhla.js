// data/tourist-attractions/songkhla.js
const songkhlaAttractions = [
  { id: 'songkhla-001', name: 'หาดสมิหลา', nameEn: 'Samila Beach', description: 'หาดทรายที่สวยงามและมีรูปปั้นนางเงือก', coordinates: { latitude: 7.2000, longitude: 100.6000 }, category: 'beach', categories: ['beach', 'recommended'], province: 'สงขลา', district: 'อำเภอเมืองสงขลา', address: 'อำเภอเมืองสงขลา จังหวัดสงขลา', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'songkhla-002', name: 'วัดมัชฌิมาวาส', nameEn: 'Wat Matchimawat', description: 'วัดสำคัญของสงขลา', coordinates: { latitude: 7.1833, longitude: 100.6000 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'สงขลา', district: 'อำเภอเมืองสงขลา', address: 'อำเภอเมืองสงขลา จังหวัดสงขลา', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => songkhlaAttractions.filter(a => a.isActive);
const getAttractionById = (id) => songkhlaAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => songkhlaAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { songkhlaAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
