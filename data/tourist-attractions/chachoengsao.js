// data/tourist-attractions/chachoengsao.js
const chachoengsaoAttractions = [
  { id: 'chachoengsao-001', name: 'วัดโสธรวรารามวรวิหาร', nameEn: 'Wat Sothon Wararam Worawihan', description: 'วัดสำคัญที่ประดิษฐานหลวงพ่อโสธร พระพุทธรูปศักดิ์สิทธิ์', coordinates: { latitude: 13.6833, longitude: 101.0833 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'ฉะเชิงเทรา', district: 'อำเภอเมืองฉะเชิงเทรา', address: 'อำเภอเมืองฉะเชิงเทรา จังหวัดฉะเชิงเทรา', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'chachoengsao-002', name: 'ตลาดน้ำบางคล้า', nameEn: 'Bang Khla Floating Market', description: 'ตลาดน้ำที่จำหน่ายอาหารและสินค้าท้องถิ่น', coordinates: { latitude: 13.7500, longitude: 101.2000 }, category: 'market', categories: ['market', 'recommended'], province: 'ฉะเชิงเทรา', district: 'อำเภอบางคล้า', address: 'อำเภอบางคล้า จังหวัดฉะเชิงเทรา', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => chachoengsaoAttractions.filter(a => a.isActive);
const getAttractionById = (id) => chachoengsaoAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => chachoengsaoAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { chachoengsaoAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
