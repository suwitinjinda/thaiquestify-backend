// data/tourist-attractions/surat-thani.js
const suratThaniAttractions = [
  { id: 'surat-thani-001', name: 'เกาะสมุย', nameEn: 'Koh Samui', description: 'เกาะที่สวยงามและเป็นที่นิยมมาก', coordinates: { latitude: 9.5000, longitude: 100.0000 }, category: 'beach', categories: ['beach', 'recommended'], province: 'สุราษฎร์ธานี', district: 'อำเภอเกาะสมุย', address: 'อำเภอเกาะสมุย จังหวัดสุราษฎร์ธานี', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'surat-thani-002', name: 'เกาะพะงัน', nameEn: 'Koh Phangan', description: 'เกาะที่สวยงามและมีงานปาร์ตี้ Full Moon', coordinates: { latitude: 9.7500, longitude: 100.0000 }, category: 'beach', categories: ['beach', 'recommended'], province: 'สุราษฎร์ธานี', district: 'อำเภอเกาะพะงัน', address: 'อำเภอเกาะพะงัน จังหวัดสุราษฎร์ธานี', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => suratThaniAttractions.filter(a => a.isActive);
const getAttractionById = (id) => suratThaniAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => suratThaniAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { suratThaniAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
