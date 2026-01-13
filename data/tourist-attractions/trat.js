// data/tourist-attractions/trat.js
const tratAttractions = [
  { id: 'trat-001', name: 'เกาะช้าง', nameEn: 'Koh Chang', description: 'เกาะที่ใหญ่เป็นอันดับสองของประเทศไทย มีหาดทรายสวยงามและธรรมชาติอุดมสมบูรณ์', coordinates: { latitude: 12.0000, longitude: 102.3333 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ตราด', district: 'อำเภอเกาะช้าง', address: 'อำเภอเกาะช้าง จังหวัดตราด', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'trat-002', name: 'เกาะกูด', nameEn: 'Koh Kood', description: 'เกาะที่สวยงามและเงียบสงบ เหมาะสำหรับการพักผ่อน', coordinates: { latitude: 11.6667, longitude: 102.5333 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ตราด', district: 'อำเภอเกาะกูด', address: 'อำเภอเกาะกูด จังหวัดตราด', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => tratAttractions.filter(a => a.isActive);
const getAttractionById = (id) => tratAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => tratAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { tratAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
