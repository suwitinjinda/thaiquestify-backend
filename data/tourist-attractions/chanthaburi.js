// data/tourist-attractions/chanthaburi.js
const chanthaburiAttractions = [
  { id: 'chanthaburi-001', name: 'วัดจันทบุรี', nameEn: 'Wat Chanthaburi', description: 'วัดสำคัญของจังหวัดจันทบุรี', coordinates: { latitude: 12.6000, longitude: 102.1000 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'จันทบุรี', district: 'อำเภอเมืองจันทบุรี', address: 'อำเภอเมืองจันทบุรี จังหวัดจันทบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'chanthaburi-002', name: 'น้ำตกพลิ้ว', nameEn: 'Phlio Waterfall', description: 'น้ำตกที่สวยงามในอุทยานแห่งชาติ', coordinates: { latitude: 12.5000, longitude: 102.2000 }, category: 'waterfall', categories: ['waterfall', 'park', 'recommended'], province: 'จันทบุรี', district: 'อำเภอแหลมสิงห์', address: 'อำเภอแหลมสิงห์ จังหวัดจันทบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => chanthaburiAttractions.filter(a => a.isActive);
const getAttractionById = (id) => chanthaburiAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => chanthaburiAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { chanthaburiAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
