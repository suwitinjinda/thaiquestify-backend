// data/tourist-attractions/nong-bua-lamphu.js
const nongBuaLamphuAttractions = [
  { id: 'nong-bua-lamphu-001', name: 'วัดถ้ำกลองเพล', nameEn: 'Wat Tham Klong Phlue', description: 'วัดที่มีถ้ำและธรรมชาติที่สวยงาม', coordinates: { latitude: 17.2000, longitude: 102.4167 }, category: 'temple', categories: ['temple', 'recommended'], province: 'หนองบัวลำภู', district: 'อำเภอเมืองหนองบัวลำภู', address: 'อำเภอเมืองหนองบัวลำภู จังหวัดหนองบัวลำภู', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => nongBuaLamphuAttractions.filter(a => a.isActive);
const getAttractionById = (id) => nongBuaLamphuAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => nongBuaLamphuAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { nongBuaLamphuAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
