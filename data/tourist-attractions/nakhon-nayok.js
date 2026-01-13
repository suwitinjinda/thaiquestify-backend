// data/tourist-attractions/nakhon-nayok.js
const nakhonNayokAttractions = [
  { id: 'nakhon-nayok-001', name: 'น้ำตกนางรอง', nameEn: 'Nang Rong Waterfall', description: 'น้ำตกที่สวยงามและเป็นที่นิยมในหมู่นักท่องเที่ยว', coordinates: { latitude: 14.3000, longitude: 101.2000 }, category: 'waterfall', categories: ['waterfall', 'park', 'recommended'], province: 'นครนายก', district: 'อำเภอเมืองนครนายก', address: 'อำเภอเมืองนครนายก จังหวัดนครนายก', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'nakhon-nayok-002', name: 'อุทยานแห่งชาติเขาใหญ่', nameEn: 'Khao Yai National Park', description: 'อุทยานแห่งชาติที่มีธรรมชาติสวยงามและสัตว์ป่าหลากหลาย', coordinates: { latitude: 14.4000, longitude: 101.3000 }, category: 'park', categories: ['park', 'mountain', 'recommended'], province: 'นครนายก', district: 'อำเภอปากพลี', address: 'อำเภอปากพลี จังหวัดนครนายก', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => nakhonNayokAttractions.filter(a => a.isActive);
const getAttractionById = (id) => nakhonNayokAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => nakhonNayokAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { nakhonNayokAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
