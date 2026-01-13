// data/tourist-attractions/rayong.js
const rayongAttractions = [
  { id: 'rayong-001', name: 'เกาะเสม็ด', nameEn: 'Koh Samet', description: 'เกาะที่สวยงามมีหาดทรายขาวและน้ำทะเลใส', coordinates: { latitude: 12.5667, longitude: 101.4500 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ระยอง', district: 'อำเภอเมืองระยอง', address: 'อำเภอเมืองระยอง จังหวัดระยอง', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'rayong-002', name: 'สวนสนประดิพัทธ์', nameEn: 'Suan Son Pradiphat', description: 'สวนสนริมชายหาดที่สวยงาม', coordinates: { latitude: 12.6000, longitude: 101.4000 }, category: 'park', categories: ['park', 'beach', 'recommended'], province: 'ระยอง', district: 'อำเภอเมืองระยอง', address: 'อำเภอเมืองระยอง จังหวัดระยอง', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => rayongAttractions.filter(a => a.isActive);
const getAttractionById = (id) => rayongAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => rayongAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { rayongAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
