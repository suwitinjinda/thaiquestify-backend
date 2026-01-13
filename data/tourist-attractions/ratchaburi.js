// data/tourist-attractions/ratchaburi.js
const ratchaburiAttractions = [
  { id: 'ratchaburi-001', name: 'ถ้ำเขาหลวง', nameEn: 'Khao Luang Cave', description: 'ถ้ำที่มีพระพุทธรูปและหินงอกหินย้อยสวยงาม', coordinates: { latitude: 13.5333, longitude: 99.8000 }, category: 'other', categories: ['other', 'recommended'], province: 'ราชบุรี', district: 'อำเภอเมืองราชบุรี', address: 'อำเภอเมืองราชบุรี จังหวัดราชบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ratchaburi-002', name: 'ตลาดน้ำดำเนินสะดวก', nameEn: 'Damnoen Saduak Floating Market', description: 'ตลาดน้ำที่มีชื่อเสียงระดับโลก', coordinates: { latitude: 13.5167, longitude: 99.9500 }, category: 'market', categories: ['market', 'recommended'], province: 'ราชบุรี', district: 'อำเภอดำเนินสะดวก', address: 'อำเภอดำเนินสะดวก จังหวัดราชบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => ratchaburiAttractions.filter(a => a.isActive);
const getAttractionById = (id) => ratchaburiAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => ratchaburiAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { ratchaburiAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
