// data/tourist-attractions/sa-kaeo.js
const saKaeoAttractions = [
  { id: 'sa-kaeo-001', name: 'ตลาดโรงเกลือ', nameEn: 'Rong Kluea Market', description: 'ตลาดชายแดนที่จำหน่ายสินค้าจากกัมพูชา', coordinates: { latitude: 13.6500, longitude: 102.5000 }, category: 'market', categories: ['market', 'recommended'], province: 'สระแก้ว', district: 'อำเภออรัญประเทศ', address: 'อำเภออรัญประเทศ จังหวัดสระแก้ว', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'sa-kaeo-002', name: 'อุทยานแห่งชาติปางสีดา', nameEn: 'Pang Sida National Park', description: 'อุทยานแห่งชาติที่มีธรรมชาติสวยงาม', coordinates: { latitude: 14.0000, longitude: 102.2000 }, category: 'park', categories: ['park', 'recommended'], province: 'สระแก้ว', district: 'อำเภอวัฒนานคร', address: 'อำเภอวัฒนานคร จังหวัดสระแก้ว', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => saKaeoAttractions.filter(a => a.isActive);
const getAttractionById = (id) => saKaeoAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => saKaeoAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { saKaeoAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
