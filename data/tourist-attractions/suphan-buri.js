// data/tourist-attractions/suphan-buri.js
const suphanBuriAttractions = [
  { id: 'suphan-buri-001', name: 'วัดพระศรีรัตนมหาธาตุ', nameEn: 'Wat Phra Si Rattana Mahathat', description: 'วัดเก่าแก่ที่มีเจดีย์ที่สวยงาม', coordinates: { latitude: 14.4667, longitude: 100.1167 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'สุพรรณบุรี', district: 'อำเภอเมืองสุพรรณบุรี', address: 'อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'suphan-buri-002', name: 'วัดป่าเลไลยก์', nameEn: 'Wat Pa Lelai', description: 'วัดที่มีพระพุทธรูปปางป่าเลไลยก์', coordinates: { latitude: 14.4700, longitude: 100.1200 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'สุพรรณบุรี', district: 'อำเภอเมืองสุพรรณบุรี', address: 'อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี', checkInRadius: 100, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => suphanBuriAttractions.filter(a => a.isActive);
const getAttractionById = (id) => suphanBuriAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => suphanBuriAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { suphanBuriAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
